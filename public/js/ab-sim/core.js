// Feature flag + identity keys
const FEATURE_FLAG_KEY = 'word_search_difficulty_v2';
const USERNAME_KEY = 'simulator_username';
const USER_ID_KEY = 'simulator_user_id';
window.FEATURE_FLAG_KEY = FEATURE_FLAG_KEY;

const TILE_COLORS = {
  base: 'bg-gray-100',
  memorizing: 'bg-gray-100',
  hit: 'bg-emerald-300',
  miss: 'bg-red-500'
};

const TILE_COLOR_CLASSES = ['bg-gray-100', 'bg-emerald-300', 'bg-red-500', 'bg-red-600', 'bg-gray-800', 'bg-gray-700', 'bg-green-600'];

const MEMORIZE_DURATION_SECONDS = 7;
const ROUND_DURATION_MS = 60000;
const PERSONAL_BEST_KEY_PREFIX = 'ab_sim_pb_ms';
let personalBestMs = null;

function getPersonalBestStorageKey(variant) {
  return `${PERSONAL_BEST_KEY_PREFIX}_${variant}`;
}

async function primePersonalBestCache(variant, username) {
  if (!variant || !username || !window.supabaseApi?.personalBest) {
    console.log('[PB] Skipping prime; missing variant/user/api', { variant, username });
    personalBestMs = null;
    return;
  }
  try {
    const cacheKey = getPersonalBestStorageKey(variant);
    const cached = localStorage.getItem(cacheKey);
    if (cached !== null) {
      const cachedValue = Number(cached);
      personalBestMs = Number.isFinite(cachedValue) ? cachedValue : null;
      console.log('[PB] Loaded from cache', { cacheKey, personalBestMs });
    }
    const data = await window.supabaseApi.personalBest(variant, username);
    console.log('[PB] RPC response', { variant, username, data });
    if (data?.best_time !== undefined && data?.best_time !== null) {
      const bestMs = Number(data.best_time) * 1000;
      if (Number.isFinite(bestMs)) {
        personalBestMs = bestMs;
        localStorage.setItem(cacheKey, String(bestMs));
        console.log('[PB] Cache populated from RPC', { cacheKey, bestMs });
        return;
      }
    }
    if (cached === null) {
      personalBestMs = null;
      localStorage.removeItem(cacheKey);
      console.log('[PB] No PB found; cleared cache', { cacheKey });
    }
  } catch (error) {
    console.error('personal best cache error', error);
  }
}

function updatePersonalBestCache(variant, newMs) {
  if (!variant || !Number.isFinite(newMs)) return;
  personalBestMs = Number.isFinite(personalBestMs)
    ? Math.min(personalBestMs, newMs)
    : newMs;
  localStorage.setItem(getPersonalBestStorageKey(variant), String(personalBestMs));
  console.log('[PB] Updated cache with new best', { variant, personalBestMs });
}

function applyTileColor(tile, state = 'base') {
  if (!tile) return;
  tile.classList.remove(...TILE_COLOR_CLASSES);
  tile.classList.add(TILE_COLORS[state] || TILE_COLORS.base);
}

// Username generation helper
const generateUsername = () => {
  if (typeof window.generateRandomUsername === 'function') {
    return window.generateRandomUsername();
  }
  return 'Player ' + Math.floor(Math.random() * 1000);
};

// Game state
const puzzleState = {
    variant: null,
    puzzleConfig: null,
    startTime: null,
    isRunning: false,
    timerInterval: null,
    countdownInterval: null,
    completionTime: null,
    isMemorizing: false,
    foundPineapples: [],
    totalClicks: 0,
    gridState: [],
    gameSessionId: null
  };

  function resetState() {
    puzzleState.isRunning = false;
    clearInterval(puzzleState.timerInterval);
    clearInterval(puzzleState.countdownInterval);
    puzzleState.countdownInterval = null;
    puzzleState.startTime = null;
    puzzleState.foundPineapples = [];
    puzzleState.totalClicks = 0;
    puzzleState.gridState = [];
    puzzleState.completionTime = null;
    puzzleState.isMemorizing = false;
    puzzleState.gameSessionId = null;
  }

  function clearCountdownTimer() {
    if (puzzleState.countdownInterval) {
      clearInterval(puzzleState.countdownInterval);
      puzzleState.countdownInterval = null;
    }
  }

  function updateMemorizePill(state = 'idle', { text, countdown } = {}) {
    const pill = $('memorize-pill');
    if (!pill) return;
    pill.dataset.state = state;
    if (text) {
      const textEl = $('memorize-pill-text');
      if (textEl) textEl.textContent = text;
    }
    if (typeof countdown !== 'undefined') {
      const countdownEl = $('memorize-countdown');
      if (countdownEl) {
        if (typeof countdown === 'number') {
          const padded = countdown < 10 ? `0${countdown}` : `${countdown}`;
          countdownEl.textContent = `${padded}s`;
        } else {
          countdownEl.textContent = countdown;
        }
      }
    }
  }

  function resetMemorizePill() {
    updateMemorizePill('idle', {
      text: 'Click Start to reveal the board.',
      countdown: `${MEMORIZE_DURATION_SECONDS}s`
    });
  }

  function buildPineappleProgress(targetCount) {
    const slotsHost = $('pineapple-progress-slots');
    const fill = $('pineapple-progress-fill');
    const track = $('pineapple-progress-track');
    if (!slotsHost || !fill || !track) return;
    slotsHost.innerHTML = '';
    for (let i = 0; i < targetCount; i++) {
      const slot = document.createElement('div');
      slot.className = 'pineapple-slot';
      slot.dataset.index = String(i);
      slot.innerHTML = '<span>🍍</span>';
      slotsHost.appendChild(slot);
    }
    const targetLabel = $('pineapple-target');
    if (targetLabel) targetLabel.textContent = targetCount;
    fill.style.width = '0%';
    updatePineappleProgress(0);
  }

  function resetProgressVisuals() {
    const progressContainer = document.querySelector('.pineapple-progress');
    const progressStats = $('pineapple-stats');
    progressContainer?.classList.remove('success', 'fail');
    progressStats?.classList.remove('is-visible');
    setPersonalBestVisibility(false);
  }

  function setPersonalBestVisibility(isVisible) {
    const personalBestPill = $('pineapple-personal-best');
    if (!personalBestPill) return;
    personalBestPill.classList.toggle('is-visible', Boolean(isVisible));
    personalBestPill.setAttribute('aria-hidden', Boolean(isVisible) ? 'false' : 'true');
  }

  function updatePineappleProgress(foundCount) {
    const slotsHost = $('pineapple-progress-slots');
    const fill = $('pineapple-progress-fill');
    const storedTarget = Number($('pineapple-target')?.textContent || 0);
    const target = puzzleState.puzzleConfig?.targetCount ?? storedTarget ?? 0;
    if (!slotsHost || !fill || !Number.isFinite(target)) return;
    const slots = slotsHost.querySelectorAll('.pineapple-slot');
    slots.forEach((slot, index) => {
      slot.classList.remove('is-active', 'is-missed');
      if (slot.classList.contains('pop')) {
        slot.classList.remove('pop');
      }
      if (index < foundCount) {
        if (!slot.classList.contains('is-complete')) {
          slot.classList.add('pop');
          setTimeout(() => slot.classList.remove('pop'), 320);
        }
        slot.classList.add('is-complete');
      } else {
        slot.classList.remove('is-complete');
        if (index === foundCount) {
          slot.classList.add('is-active');
        }
      }
    });
    const progressPercent = target === 0 ? 0 : Math.min(100, (foundCount / target) * 100);
    fill.style.width = `${progressPercent}%`;
    const foundLabel = $('pineapple-progress-found');
    if (foundLabel) foundLabel.textContent = foundCount;
    const targetLabel = $('pineapple-target');
    if (targetLabel) targetLabel.textContent = target;
  }

  function markProgressFailure() {
    const slotsHost = $('pineapple-progress-slots');
    if (!slotsHost) return;
    const slots = slotsHost.querySelectorAll('.pineapple-slot');
    const foundCount = puzzleState.foundPineapples.length;
    slots.forEach((slot, index) => {
      if (index >= foundCount && !slot.classList.contains('is-complete')) {
        slot.classList.remove('is-active');
        slot.classList.add('is-missed');
      }
    });
  }

  function setGridPulse(isActive) {
    const grid = $('letter-grid');
    if (!grid) return;
    grid.classList.toggle('grid-live', Boolean(isActive));
  }

  // Utility: build puzzle grid
  function buildGrid(config) {
    const gridHTML = config.grid.map((row, rowIndex) =>
      row.map((fruit, colIndex) =>
        `<div class="aspect-square rounded-lg bg-gray-100 flex items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden memory-tile border-2 border-gray-300 hover:!bg-orange-100 hover:!border-orange-600 hover:scale-105" data-row="${rowIndex}" data-col="${colIndex}" data-fruit="${fruit}">
          <span class="text-2xl transition-all duration-300 fruit-emoji opacity-0 scale-80">${fruit}</span>
        </div>`
      ).join('')
    ).join('');
    $('letter-grid').innerHTML = gridHTML;
  }

  function showMemorizePhase() {
    document.querySelectorAll('.memory-tile').forEach(tile => {
      applyTileColor(tile, 'memorizing');
      tile.classList.add('scale-105');
      const emoji = tile.querySelector('.fruit-emoji');
      emoji.classList.remove('opacity-0', 'scale-80');
      emoji.classList.add('opacity-100', 'scale-100');
    });
    $('start-button').classList.add('hidden');
    updateMemorizePill('memorizing', {
      text: 'Memorize every pineapple location.',
      countdown: MEMORIZE_DURATION_SECONDS
    });
  }

  function hideFruits() {
    document.querySelectorAll('.memory-tile').forEach(tile => {
      tile.classList.remove('scale-105');
      applyTileColor(tile, 'base');
      const emoji = tile.querySelector('.fruit-emoji');
      emoji.classList.remove('opacity-100', 'scale-100');
      emoji.classList.add('opacity-0', 'scale-80');
    });
  }

  function updateTimerDisplay(elapsed) {
    const remaining = Math.max(ROUND_DURATION_MS - elapsed, 0);
    $('timer').textContent = formatTime(remaining);
  }

  // Feature flag resolution & user identity
  function initializeVariant() {
    if (typeof posthog === 'undefined') return false;
    const posthogVariant = posthog.getFeatureFlag(FEATURE_FLAG_KEY);

    let variant = null;
    if (posthogVariant === '4-words') variant = 'B';
    else if (posthogVariant === 'control') variant = 'A';
    else return false;

    localStorage.setItem('simulator_variant', variant);

    const userId = 'user_' + Math.random().toString(36).slice(2, 11);
    localStorage.setItem('simulator_user_id', userId);

    if (!localStorage.getItem('simulator_username')) {
      const username = generateUsername();
      localStorage.setItem('simulator_username', username);
      if (typeof posthog !== 'undefined' && posthog.identify) {
        posthog.identify(username);
      }
    }

    return true;
  }

  // Event tracking helper
  function trackEvent(name, extra = {}) {
    try {
      if (!posthog?.capture) return;

      posthog.capture(name, {
        variant: puzzleState.variant,
        username: localStorage.getItem(USERNAME_KEY),
        user_id: localStorage.getItem(USER_ID_KEY),
        game_session_id: puzzleState.gameSessionId,
        $feature_flag: FEATURE_FLAG_KEY,
        $feature_flag_response: posthog.getFeatureFlag(FEATURE_FLAG_KEY),
        ...extra
      });
    } catch (error) {
      console.error('PostHog error:', error);
    }
  }

  // Leaderboard rendering (via supabaseApi)
  async function renderLeaderboard(variant, preloadedData) {
    const list = document.getElementById('leaderboard-list');
    const username = localStorage.getItem('simulator_username');
    if (!list) return;
    try {
      if (!window.supabaseApi) throw new Error('Supabase API not initialized');
      const data = typeof preloadedData === 'undefined'
        ? await window.supabaseApi.leaderboard(variant, 10)
        : preloadedData;
      if (!data || data.length === 0) {
        list.innerHTML = '<p class="rounded-xl border border-dashed border-border/70 bg-card/40 px-4 py-3 text-center text-xs font-medium text-muted-foreground">Complete a run to enter the hall of fame.</p>';
        return;
      }
      const baseRowSurface = 'bg-white border border-slate-200 dark:bg-slate-900/80 dark:border-slate-700 shadow-sm';

      const userIndex = data.findIndex(entry => entry.username === username);
      const userRank = userIndex >= 0 ? userIndex + 1 : null;
      const userEntry = userIndex >= 0 ? data[userIndex] : null;

      const baseRowClass = 'flex items-center justify-between rounded-2xl px-3 py-1 text-[11px] transition-all duration-200 transform';

      const rows = data.slice(0, 5).map((entry, i) => {
        const isCurrentUser = entry.username === username;
        const glowClass = isCurrentUser
          ? 'ring-2 ring-amber-300 shadow-[0_0_28px_rgba(251,191,36,0.45)]'
          : 'hover:ring-1 hover:ring-slate-200 dark:hover:ring-slate-600';
        return `
          <li class="${baseRowClass} ${baseRowSurface} ${glowClass} hover:-translate-y-0.5 hover:shadow-lg hover:bg-slate-50 dark:hover:bg-slate-900/60 focus-within:-translate-y-0.5 focus-within:ring-2 focus-within:ring-slate-300">
            <span class="flex items-center gap-2 font-mono text-[11px]">
              <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 font-semibold text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                ${i + 1}
              </span>
              <span class="truncate leading-tight ${isCurrentUser ? 'font-semibold' : ''}">${entry.username}</span>
              ${isCurrentUser ? '<span class="text-[9px] uppercase tracking-[0.3em] text-sky-600 dark:text-sky-300">You</span>' : ''}
            </span>
            <span class="font-semibold text-slate-900 dark:text-slate-100 tabular-nums text-xs">${Number(entry.best_time).toFixed(2)}s</span>
          </li>
        `;
      }).join('');

      let userRow = '';
      if (userEntry && userRank > 5) {
        userRow = `
          <div class="mt-3 space-y-1.5 rounded-2xl border border-sky-200/80 bg-sky-50/80 p-2.5 text-[11px] text-sky-900 shadow-[0_12px_28px_rgba(14,165,233,0.25)] dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100">
            <div class="text-[9px] font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-300">Your Current Rank</div>
            <div class="flex items-center justify-between font-mono text-[11px]">
              <span class="flex items-center gap-1.5">
                <span class="font-bold">${userRank}.</span>
                <span>${userEntry.username}</span>
              </span>
              <span class="font-semibold tabular-nums">${Number(userEntry.best_time).toFixed(2)}s</span>
            </div>
          </div>
        `;
      }

      list.innerHTML = `<ol class="space-y-1">${rows}</ol>${userRow}`;
    } catch (error) {
      console.error('Leaderboard error:', error);
      list.innerHTML = '<p class="rounded-xl border border-red-200/60 bg-red-50/80 px-4 py-3 text-center text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">Loading leaderboard…</p>';
    }
  }

  // Display variant + build grid
  function displayVariant() {
    const variant = localStorage.getItem('simulator_variant');
    if (!variant) {
      $('user-variant').textContent = 'Error';
      $('user-username').textContent = 'Feature flag failed';
      $('difficulty-display').textContent = 'Check PostHog config';
      $('target-word-count').textContent = '0';
      return;
    }
    puzzleState.variant = variant;
    const username = localStorage.getItem('simulator_username');
    const config = window.PuzzleConfig.getPuzzleForVariant(variant);
    puzzleState.puzzleConfig = config;
    $('user-variant').textContent = `Variant ${variant} | ${config.id}`;
    $('user-username').textContent = username || 'Loading...';
    $('difficulty-display').textContent = `Difficulty: ${config.difficulty}/10`;
    $('target-word-count').textContent = config.targetCount;
    buildPineappleProgress(config.targetCount);
    resetMemorizePill();
    const puzzleSection = $('puzzle-section');
    puzzleSection.classList.toggle('variant-a-theme', variant === 'A');
    puzzleSection.classList.toggle('variant-b-theme', variant === 'B');
    buildGrid(config);
  }

  function setupPuzzle() {
    const variant = localStorage.getItem('simulator_variant');
    if (!variant) {
      const startButton = $('start-button');
      if (startButton) {
        startButton.disabled = true;
        startButton.textContent = 'Feature Flag Error';
        startButton.classList.add('opacity-50', 'cursor-not-allowed');
      }
      return;
    }
    $('start-button').addEventListener('click', startChallenge);
    $('reset-button').addEventListener('click', () => resetPuzzle());
    document.querySelectorAll('.try-again-button').forEach(btn => btn.addEventListener('click', () => resetPuzzle(true)));
    document.querySelectorAll('.memory-tile').forEach(tile => tile.addEventListener('click', handleTileClick));
  }

  function startChallenge() {
    puzzleState.isRunning = true;
    puzzleState.isMemorizing = true;
    puzzleState.foundPineapples = [];
    puzzleState.totalClicks = 0;
    puzzleState.gridState = Array(5).fill(null).map(() => Array(5).fill(false));
    puzzleState.gameSessionId = 'game_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    resetProgressVisuals();
    updatePineappleProgress(0);
    setGridPulse(true);
    showMemorizePhase();
    startCountdownTimer();
    trackEvent('puzzle_started', { difficulty: puzzleState.puzzleConfig.difficulty, puzzle_id: puzzleState.puzzleConfig.id });
  }

  function startCountdownTimer() {
    clearCountdownTimer();
    let countdown = MEMORIZE_DURATION_SECONDS;
    updateMemorizePill('memorizing', {
      text: 'Memorize every pineapple location.',
      countdown
    });
    puzzleState.countdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        updateMemorizePill('memorizing', { countdown });
      } else {
        clearCountdownTimer();
        updateMemorizePill('memorizing', { countdown: 'Go!' });
        setTimeout(() => {
          puzzleState.isMemorizing = false;
          startGamePhase();
        }, 400);
      }
    }, 1000);
  }

  function startGamePhase() {
    puzzleState.startTime = Date.now();
    hideFruits();
    updateMemorizePill('hunting', {
      text: 'Find every pineapple before the clock hits zero.',
      countdown: 'GO!'
    });
    setGridPulse(true);
    $('reset-button').classList.remove('hidden');
    puzzleState.timerInterval = setInterval(updateTimer, 100);
  }

  function updateTimer() {
    const elapsed = Date.now() - puzzleState.startTime;
    if (elapsed >= ROUND_DURATION_MS) return endChallenge(false);
    updateTimerDisplay(elapsed);
  }

  function handleTileClick(event) {
    if (!puzzleState.isRunning || puzzleState.isMemorizing) return;
    const tile = event.currentTarget;
    const row = parseInt(tile.dataset.row);
    const col = parseInt(tile.dataset.col);
    const fruit = tile.dataset.fruit;
    if (puzzleState.gridState[row][col]) return;
    puzzleState.totalClicks++;
    puzzleState.gridState[row][col] = true;
    if (fruit === '🍍') {
      puzzleState.foundPineapples.push([row, col]);
      applyTileColor(tile, 'hit');
      tile.classList.add('scale-105');
      const emoji = tile.querySelector('.fruit-emoji');
      emoji.classList.remove('opacity-0', 'scale-80');
      emoji.classList.add('opacity-100', 'scale-100');
      updatePineappleProgress(puzzleState.foundPineapples.length);
      if (puzzleState.foundPineapples.length === puzzleState.puzzleConfig.targetCount) endChallenge(true);
    } else {
      applyTileColor(tile, 'miss');
      tile.classList.add('animate-pulse');
      const emoji = tile.querySelector('.fruit-emoji');
      emoji.classList.remove('opacity-0', 'scale-80');
      emoji.classList.add('opacity-100', 'scale-100');
      setTimeout(() => {
        tile.classList.remove('animate-pulse', 'scale-105');
        applyTileColor(tile, 'base');
        emoji.classList.remove('opacity-100', 'scale-100');
        emoji.classList.add('opacity-0', 'scale-80');
        puzzleState.gridState[row][col] = false;
      }, 1000);
    }
  }

  async function endChallenge(success) {
    puzzleState.isRunning = false;
    clearInterval(puzzleState.timerInterval);
    setGridPulse(false);
    puzzleState.completionTime = success ? Date.now() - puzzleState.startTime : 60000;
    $('reset-button').classList.add('hidden');
    document.querySelectorAll('.try-again-button').forEach(btn => btn.classList.remove('hidden'));
    const progressContainer = document.querySelector('.pineapple-progress');
    const progressStats = $('pineapple-stats');
    const resultTime = $('pineapple-result-time');
    const resultGuesses = $('pineapple-result-guesses');
    progressContainer?.classList.remove('success', 'fail');
    progressStats?.classList.remove('is-visible');
    setPersonalBestVisibility(false);
    
    if (success) {
      await updateLeaderboard(puzzleState.variant);
      const isPersonalBest = !Number.isFinite(personalBestMs) || puzzleState.completionTime < personalBestMs;
      console.log('[PB] Success run evaluated', {
        completionMs: puzzleState.completionTime,
        personalBestMs,
        isPersonalBest
      });
      if (resultTime) resultTime.textContent = formatTime(puzzleState.completionTime);
      if (resultGuesses) resultGuesses.textContent = puzzleState.totalClicks;
      updatePineappleProgress(puzzleState.puzzleConfig.targetCount);
      progressContainer?.classList.add('success');
      
      // Enhanced Personal Best styling
      setPersonalBestVisibility(isPersonalBest);
      if (isPersonalBest) {
        updatePersonalBestCache(puzzleState.variant, puzzleState.completionTime);
      }
    } else {
      if (resultTime) resultTime.textContent = '00:60:00';
      if (resultGuesses) resultGuesses.textContent = puzzleState.totalClicks;
      setPersonalBestVisibility(false);
      progressContainer?.classList.add('fail');
      markProgressFailure();
    }
    trackEvent(success ? 'puzzle_completed' : 'puzzle_failed', {
      completion_time_seconds: success ? Number((puzzleState.completionTime / 1000).toFixed(3)) : undefined,
      correct_words_count: puzzleState.foundPineapples.length,
      total_guesses_count: puzzleState.totalClicks
    });
    setTimeout(() => {
      resetMemorizePill();
      progressStats?.classList.add('is-visible');
    }, 800);
  }

  function resetPuzzle(isRepeat = false) {
    resetState();
    $('timer').textContent = '00:60:00';
    clearCountdownTimer();
    resetMemorizePill();
    updatePineappleProgress(0);
    resetProgressVisuals();
    document.querySelectorAll('.memory-tile').forEach(tile => {
      tile.classList.remove('scale-105', 'animate-pulse');
      applyTileColor(tile, 'base');
      const emoji = tile.querySelector('.fruit-emoji');
      emoji.classList.remove('opacity-100', 'scale-100');
      emoji.classList.add('opacity-0', 'scale-80');
    });
    $('start-button').classList.remove('hidden');
    $('reset-button').classList.add('hidden');
    setGridPulse(false);
    document.querySelectorAll('.try-again-button').forEach(btn => btn.classList.add('hidden'));
    setPersonalBestVisibility(false);
    if (isRepeat) trackEvent('puzzle_repeated', {});
  }

  async function updateLeaderboard(currentTime = null, currentVariant = null) {
    const variant = currentVariant || localStorage.getItem('simulator_variant');
    if (!variant) return false;

    let data;
    let hadError = false;

    if (window.supabaseApi) {
      try {
        data = await window.supabaseApi.leaderboard(variant, 10);
      } catch (error) {
        hadError = true;
        console.error('Leaderboard fetch error:', error);
      }
    } else {
      hadError = true;
    }

    if (hadError) {
      await renderLeaderboard(variant);
    } else {
      await renderLeaderboard(variant, data);
    }
  }

  function showFeatureFlagError() {
    const errorHTML = `<div class="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950 mb-4"><div class="flex items-start gap-2"><div class="text-lg">⚠️</div><div class="flex-1"><h3 class="font-semibold text-red-900 dark:text-red-100 text-sm">PostHog Feature Flag Error</h3><p class="text-xs text-red-800 dark:text-red-200 mt-1">Feature flag \"${FEATURE_FLAG_KEY}\" failed to load. Check PostHog configuration.</p></div></div></div>`;
    const challengeSection = $('challenge-section');
    if (challengeSection) {
      const errorDiv = document.createElement('div');
      errorDiv.innerHTML = errorHTML;
      challengeSection.parentNode.insertBefore(errorDiv, challengeSection);
    }
  }

  async function afterVariantResolved() {
    displayVariant();
    setupPuzzle();
    const variant = puzzleState.variant;
    const username = localStorage.getItem('simulator_username');
    await Promise.all([
      updateLeaderboard(variant),
      primePersonalBestCache(variant, username)
    ]);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (typeof posthog === 'undefined' || !posthog.onFeatureFlags) {
      console.error('PostHog not initialized. Check environment variables.');
      showFeatureFlagError();
      return;
    }
    posthog.onFeatureFlags(() => {
      const ok = initializeVariant();
      if (!ok) {
        return setTimeout(() => {
          const retry = initializeVariant();
          if (!retry) {
            console.error('PostHog feature flag not resolved after retry.');
            showFeatureFlagError();
            return;
          }
          afterVariantResolved();
        }, 500);
      }
      afterVariantResolved();
    });
  });

  // expose limited API (for potential future reuse/testing)
  window.abSim = { startChallenge, resetPuzzle, puzzleState };
