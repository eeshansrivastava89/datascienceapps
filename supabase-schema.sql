-- ====================
-- 1. PostHog Events Table
-- ====================
CREATE TABLE IF NOT EXISTS posthog_events (
  id BIGSERIAL PRIMARY KEY,

  -- Core PostHog fields
  uuid TEXT NOT NULL UNIQUE,
  event TEXT NOT NULL,
  distinct_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Full properties as JSONB
  properties JSONB,

  -- Extracted key properties for faster queries (computed from JSONB)
  variant TEXT GENERATED ALWAYS AS (properties->>'variant') STORED,
  feature_flag_response TEXT GENERATED ALWAYS AS (properties->>'$feature_flag_response') STORED,
  completion_time_seconds NUMERIC GENERATED ALWAYS AS ((properties->>'completion_time_seconds')::numeric) STORED,
  correct_words_count INTEGER GENERATED ALWAYS AS ((properties->>'correct_words_count')::integer) STORED,
  total_guesses_count INTEGER GENERATED ALWAYS AS ((properties->>'total_guesses_count')::integer) STORED,
  user_id TEXT GENERATED ALWAYS AS (properties->>'user_id') STORED,

  -- Metadata
  session_id TEXT,
  window_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_posthog_event UNIQUE (uuid)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_posthog_events_event ON posthog_events(event);
CREATE INDEX IF NOT EXISTS idx_posthog_events_distinct_id ON posthog_events(distinct_id);
CREATE INDEX IF NOT EXISTS idx_posthog_events_timestamp ON posthog_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_posthog_events_variant ON posthog_events(variant) WHERE variant IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posthog_events_feature_flag ON posthog_events(feature_flag_response) WHERE feature_flag_response IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posthog_events_user_id ON posthog_events(user_id) WHERE user_id IS NOT NULL;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_posthog_events_event_variant ON posthog_events(event, variant) WHERE variant IS NOT NULL;

COMMENT ON TABLE posthog_events IS 'Raw events from PostHog batch export';
COMMENT ON COLUMN posthog_events.variant IS 'Extracted from properties.variant (A or B)';
COMMENT ON COLUMN posthog_events.feature_flag_response IS 'Extracted from properties.$feature_flag_response (control or 4-words)';

----------------------------------
-- 2. Views for API Calls
----------------------------------


-- Regular views (no caching, always fresh, simplified queries)
CREATE OR REPLACE VIEW v_variant_stats AS
SELECT
  variant,
  feature_flag_response,
  COUNT(DISTINCT distinct_id) as unique_users,
  COUNT(*) as total_completions,
  AVG(completion_time_seconds) as avg_completion_time,
  MIN(completion_time_seconds) as min_completion_time,
  MAX(completion_time_seconds) as max_completion_time
FROM posthog_events
WHERE event = 'puzzle_completed'
  AND variant IS NOT NULL
  AND feature_flag_response IS NOT NULL
  AND session_id IS NOT NULL
GROUP BY variant, feature_flag_response;

CREATE OR REPLACE VIEW v_conversion_funnel AS
WITH started_events AS (
  SELECT 
    variant,
    'Started' as stage,
    COUNT(*) as event_count,
    COUNT(DISTINCT distinct_id) as unique_users,
    1 as stage_order
  FROM posthog_events
  WHERE event = 'puzzle_started' 
    AND variant IS NOT NULL
    AND session_id IS NOT NULL
  GROUP BY variant
),
completed_events AS (
  SELECT 
    variant,
    'Completed' as stage,
    COUNT(*) as event_count,
    COUNT(DISTINCT distinct_id) as unique_users,
    2 as stage_order
  FROM posthog_events
  WHERE event = 'puzzle_completed' 
    AND variant IS NOT NULL
    AND session_id IS NOT NULL
  GROUP BY variant
),
repeated_events AS (
  SELECT 
    variant,
    'Repeated' as stage,
    COUNT(*) as event_count,
    COUNT(DISTINCT distinct_id) as unique_users,
    3 as stage_order
  FROM posthog_events
  WHERE event = 'puzzle_repeated'
    AND variant IS NOT NULL
    AND session_id IS NOT NULL
  GROUP BY variant
),
failed_events AS (
  SELECT 
    variant,
    'Failed' as stage,
    COUNT(*) as event_count,
    COUNT(DISTINCT distinct_id) as unique_users,
    4 as stage_order
  FROM posthog_events
  WHERE event = 'puzzle_failed'
    AND variant IS NOT NULL
    AND session_id IS NOT NULL
  GROUP BY variant
)
SELECT variant, stage, event_count, unique_users, stage_order
FROM (
  SELECT * FROM started_events
  UNION ALL
  SELECT * FROM completed_events
  UNION ALL
  SELECT * FROM repeated_events
  UNION ALL
  SELECT * FROM failed_events
) funnel_stages
ORDER BY variant, stage_order;

-- Indexes for faster queries on posthog_events
CREATE INDEX IF NOT EXISTS idx_posthog_events_completed 
ON posthog_events(event, variant, session_id) 
WHERE event = 'puzzle_completed' AND variant IS NOT NULL AND session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posthog_events_started 
ON posthog_events(event, variant, session_id) 
WHERE event = 'puzzle_started' AND variant IS NOT NULL AND session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posthog_events_repeated 
ON posthog_events(event, variant, session_id) 
WHERE event = 'puzzle_repeated' AND variant IS NOT NULL AND session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posthog_events_failed
ON posthog_events(event, variant, session_id) 
WHERE event = 'puzzle_failed' AND variant IS NOT NULL AND session_id IS NOT NULL;

-- Index for faster aggregations (covers the GROUP BY in variant_stats)
CREATE INDEX IF NOT EXISTS idx_posthog_events_variant_flag 
ON posthog_events(variant, feature_flag_response) 
WHERE event = 'puzzle_completed' AND variant IS NOT NULL AND session_id IS NOT NULL;

-- =============================================
-- Consolidated Variant Overview View
-- Returns a single row with two JSON columns:
--   stats: JSON array of per-variant metric objects
--   comparison: JSON object with cross-variant comparison metrics
-- =============================================
CREATE OR REPLACE VIEW v_variant_overview AS
WITH stats AS (
  SELECT
    variant,
    feature_flag_response,
    COUNT(DISTINCT distinct_id) AS unique_users,
    COUNT(*) AS total_completions,
    AVG(completion_time_seconds) AS avg_completion_time,
    MIN(completion_time_seconds) AS min_completion_time,
    MAX(completion_time_seconds) AS max_completion_time
  FROM posthog_events
  WHERE event = 'puzzle_completed'
    AND variant IS NOT NULL
    AND feature_flag_response IS NOT NULL
    AND session_id IS NOT NULL
  GROUP BY variant, feature_flag_response
), comparison AS (
  SELECT
    (SELECT avg_completion_time FROM stats WHERE variant = 'A' LIMIT 1) AS variant_a_avg,
    (SELECT avg_completion_time FROM stats WHERE variant = 'B' LIMIT 1) AS variant_b_avg,
    (SELECT total_completions FROM stats WHERE variant = 'A' LIMIT 1) AS variant_a_completions,
    (SELECT total_completions FROM stats WHERE variant = 'B' LIMIT 1) AS variant_b_completions,
    (SELECT (b.avg_completion_time - a.avg_completion_time)
       FROM stats a JOIN stats b ON a.variant = 'A' AND b.variant = 'B' LIMIT 1) AS time_difference_seconds,
    (SELECT CASE WHEN a.avg_completion_time > 0
                THEN ROUND(((b.avg_completion_time - a.avg_completion_time) / a.avg_completion_time) * 100, 1)
                ELSE NULL END
       FROM stats a JOIN stats b ON a.variant = 'A' AND b.variant = 'B' LIMIT 1) AS percentage_difference
)
SELECT
  (SELECT json_agg(row_to_json(stats)) FROM stats) AS stats,
  (SELECT row_to_json(comparison) FROM comparison) AS comparison;

COMMENT ON VIEW v_variant_overview IS 'Single-row JSON view combining per-variant stats and cross-variant comparison metrics.';

-- Grant direct read of the view (RLS does not apply to views; underlying table RLS still applies)
GRANT SELECT ON v_variant_overview TO anon, authenticated;

-- RPC function (security definer) to expose the same JSON without requiring base-table RLS relaxations
CREATE OR REPLACE FUNCTION public.variant_overview()
RETURNS TABLE (stats json, comparison json)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stats AS (
    SELECT
      variant,
      feature_flag_response,
      COUNT(DISTINCT distinct_id) AS unique_users,
      COUNT(*) AS total_completions,
      AVG(completion_time_seconds) AS avg_completion_time,
      MIN(completion_time_seconds) AS min_completion_time,
      MAX(completion_time_seconds) AS max_completion_time
    FROM posthog_events
    WHERE event = 'puzzle_completed'
      AND variant IS NOT NULL
      AND feature_flag_response IS NOT NULL
      AND session_id IS NOT NULL
    GROUP BY variant, feature_flag_response
  ), comparison AS (
    SELECT
      (SELECT avg_completion_time FROM stats WHERE variant = 'A' LIMIT 1) AS variant_a_avg,
      (SELECT avg_completion_time FROM stats WHERE variant = 'B' LIMIT 1) AS variant_b_avg,
      (SELECT total_completions FROM stats WHERE variant = 'A' LIMIT 1) AS variant_a_completions,
      (SELECT total_completions FROM stats WHERE variant = 'B' LIMIT 1) AS variant_b_completions,
      (SELECT (b.avg_completion_time - a.avg_completion_time)
         FROM stats a JOIN stats b ON a.variant = 'A' AND b.variant = 'B' LIMIT 1) AS time_difference_seconds,
      (SELECT CASE WHEN a.avg_completion_time > 0
                  THEN ROUND(((b.avg_completion_time - a.avg_completion_time) / a.avg_completion_time) * 100, 1)
                  ELSE NULL END
         FROM stats a JOIN stats b ON a.variant = 'A' AND b.variant = 'B' LIMIT 1) AS percentage_difference
  )
  SELECT
    (SELECT json_agg(row_to_json(stats)) FROM stats) AS stats,
    (SELECT row_to_json(comparison) FROM comparison) AS comparison;
$$;

GRANT EXECUTE ON FUNCTION public.variant_overview() TO anon, authenticated;

-- Ensure PostgREST read for existing funnel view
GRANT SELECT ON v_conversion_funnel TO anon, authenticated;

-- =============================================
-- RPC: recent_completions(limit integer)
-- Returns rows matching the dashboard table with friendly column names
-- =============================================
CREATE OR REPLACE FUNCTION public.recent_completions(limit_count integer DEFAULT 100)
RETURNS TABLE (
  "Variant" text,
  "Time to Complete" numeric,
  "Correct Words" integer,
  "Total Guesses" integer,
  "When" text,
  "City" text,
  "Country" text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    variant::text AS "Variant",
    completion_time_seconds AS "Time to Complete",
    correct_words_count AS "Correct Words",
    total_guesses_count AS "Total Guesses",
    TO_CHAR(timestamp AT TIME ZONE 'America/Los_Angeles', 'YYYY-MM-DD HH24:MI:SS') AS "When",
    properties ->> '$geoip_city_name' AS "City",
    properties ->> '$geoip_country_name' AS "Country"
  FROM posthog_events
  WHERE event = 'puzzle_completed'
    AND completion_time_seconds IS NOT NULL
  ORDER BY timestamp DESC
  LIMIT GREATEST(1, LEAST(limit_count, 500));
$$;

GRANT EXECUTE ON FUNCTION public.recent_completions(integer) TO anon, authenticated;

-- =============================================
-- RPC: completion_time_distribution()
-- Returns a single row with two arrays of completion times by variant
-- =============================================
CREATE OR REPLACE FUNCTION public.completion_time_distribution()
RETURNS TABLE (
  variant_a_times numeric[],
  variant_b_times numeric[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ARRAY(SELECT completion_time_seconds FROM posthog_events WHERE event='puzzle_completed' AND completion_time_seconds IS NOT NULL AND variant='A' ORDER BY completion_time_seconds) AS variant_a_times,
    ARRAY(SELECT completion_time_seconds FROM posthog_events WHERE event='puzzle_completed' AND completion_time_seconds IS NOT NULL AND variant='B' ORDER BY completion_time_seconds) AS variant_b_times;
$$;

GRANT EXECUTE ON FUNCTION public.completion_time_distribution() TO anon, authenticated;

-- =============================================
-- RPC: leaderboard(variant text, limit_count int)
-- Returns username, best_time, total_completions
-- =============================================
CREATE OR REPLACE FUNCTION public.leaderboard(variant text DEFAULT 'A', limit_count integer DEFAULT 10)
RETURNS TABLE (
  username text,
  best_time numeric,
  total_completions bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    properties->>'username' AS username,
    MIN(completion_time_seconds) AS best_time,
    COUNT(*) AS total_completions
  FROM posthog_events 
  WHERE event = 'puzzle_completed' 
    AND (variant = leaderboard.variant OR leaderboard.variant IS NULL)
    AND properties->>'username' IS NOT NULL
    AND completion_time_seconds IS NOT NULL
  GROUP BY properties->>'username'
  ORDER BY best_time ASC
  LIMIT GREATEST(1, LEAST(limit_count, 50));
$$;

GRANT EXECUTE ON FUNCTION public.leaderboard(text, integer) TO anon, authenticated;

-- =============================================
-- RPC: personal_best(variant text, username text)
-- Returns the best completion time (seconds) for a specific user/variant
-- =============================================
CREATE OR REPLACE FUNCTION public.personal_best(
  variant text,
  username text
)
RETURNS TABLE (
  best_time numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    MIN(completion_time_seconds) AS best_time
  FROM posthog_events
  WHERE event = 'puzzle_completed'
    AND completion_time_seconds IS NOT NULL
    AND properties->>'username' = username
    AND (variant = personal_best.variant OR personal_best.variant IS NULL)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.personal_best(text, text) TO anon, authenticated;

-- =============================================
-- 5. Analytics run log (for notebooks/jobs)
-- =============================================

-- Simple append-only log to track notebook/job runs
CREATE TABLE IF NOT EXISTS analytics_run_log (
  id bigserial PRIMARY KEY,
  job_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('ok','fail')),
  duration_ms integer,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_run_log_created_at ON analytics_run_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_run_log_job ON analytics_run_log(job_name);

COMMENT ON TABLE analytics_run_log IS 'Append-only run logs for scheduled notebooks/jobs';

-- SECURITY DEFINER RPC for logging without exposing table writes
CREATE OR REPLACE FUNCTION public.log_analytics_run(
  job_name text,
  status text,
  duration_ms integer,
  message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO analytics_run_log(job_name, status, duration_ms, message)
  VALUES (job_name, status, duration_ms, CASE WHEN message IS NULL THEN NULL ELSE left(message, 2000) END);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_analytics_run(text, text, integer, text) TO anon, authenticated;