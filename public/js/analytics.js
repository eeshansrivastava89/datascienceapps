(function () {
  function baseEventProps(extra = {}) {
    const props = {
      variant: localStorage.getItem('simulator_variant'),
      username: localStorage.getItem('simulator_username'),
      user_id: localStorage.getItem('simulator_user_id'),
      ...extra
    };
    try {
      const flagKey = window.FEATURE_FLAG_KEY;
      if (typeof posthog !== 'undefined' && flagKey) {
        props.$feature_flag = flagKey;
        props.$feature_flag_response = posthog.getFeatureFlag(flagKey);
      }
    } catch {}
    return props;
  }

  function trackEvent(name, extra = {}) {
    try {
      if (typeof posthog === 'undefined' || !posthog.capture) return;
      posthog.capture(name, baseEventProps(extra));
    } catch (e) {
      console.error('PostHog error:', e);
    }
  }

  async function renderLeaderboard(variant) {
    const list = document.getElementById('leaderboard-list');
    const username = localStorage.getItem('simulator_username');
    if (!list) return;
    try {
      if (!window.supabaseApi) throw new Error('Supabase API not initialized');
      const data = await window.supabaseApi.leaderboard(variant, 10);
      if (!data || data.length === 0) {
        list.innerHTML = '<p class="text-center text-[0.70rem] italic text-gray-400">Complete to rank</p>';
        return;
      }
      const userBest = data.find(entry => entry.username === username);
      const userRank = data.findIndex(entry => entry.username === username) + 1;
      let html = data.slice(0, 5).map((entry, i) => {
        const isCurrentUser = entry.username === username;
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅';
        const highlight = isCurrentUser ? ' bg-blue-50 dark:bg-blue-950 border-l-2 border-blue-500 pl-2' : '';
        return `<div class="flex items-center justify-between py-1.5${highlight}"><span class="font-mono text-xs"><span style="display:inline-block;width:1.5rem;">${medal}</span> ${entry.username}${isCurrentUser ? ' 🌟' : ''}</span><span style="font-weight: 600; color: #3b82f6;">${Number(entry.best_time).toFixed(2)}s</span></div>`;
      }).join('');
      if (userBest && userRank > 5) {
        html += `<div style="border-top: 1px solid #d1d5db; margin-top: 0.5rem; padding-top: 0.5rem;"><div class="flex items-center justify-between py-1.5 bg-blue-50 dark:bg-blue-950 border-l-2 border-blue-500 pl-2"><span class="font-mono text-xs"><span style="display:inline-block;width:1.5rem;">${userRank}.</span> ${userBest.username} 🌟</span><span style="font-weight: 600; color: #3b82f6;">${Number(userBest.best_time).toFixed(2)}s</span></div></div>`;
      }
      list.innerHTML = html;
    } catch (error) {
      console.error('Leaderboard render error:', error);
      list.innerHTML = '<p class="text-center text-[0.70rem] italic text-gray-400">Loading...</p>';
    }
  }

  window.analytics = { baseEventProps, trackEvent, renderLeaderboard };
})();
