(function () {
  // Feature flag key
  const FEATURE_FLAG_KEY = 'word_search_difficulty_v2';
  window.FEATURE_FLAG_KEY = FEATURE_FLAG_KEY;

  // Game state
  const puzzleState = {
    variant: null,
    puzzleConfig: null,
    startTime: null,
    isRunning: false,
    timerInterval: null,
    completionTime: null,
    isMemorizing: false,
    foundPineapples: [],
    totalClicks: 0,
    gridState: []
  };

  function resetState() {
    puzzleState.isRunning = false;
    clearInterval(puzzleState.timerInterval);
    puzzleState.startTime = null;
    puzzleState.foundPineapples = [];
    puzzleState.totalClicks = 0;
    puzzleState.gridState = [];
    puzzleState.completionTime = null;
    puzzleState.isMemorizing = false;
  }

  // Utility: build puzzle grid
  function buildGrid(config) {
    const gridHTML = config.grid.map((row, rowIndex) =>
      row.map((fruit, colIndex) =>
        `<div class="aspect-square rounded-lg bg-gray-600 flex items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden memory-tile border-2 border-gray-500 hover:!bg-orange-500 hover:!border-orange-600 hover:scale-105" data-row="${rowIndex}" data-col="${colIndex}" data-fruit="${fruit}">
          <span class="text-2xl transition-all duration-300 fruit-emoji opacity-0 scale-80">${fruit}</span>
        </div>`
      ).join('')
    ).join('');
    $('letter-grid').innerHTML = gridHTML;
  }

  function showMemorizePhase() {
    document.querySelectorAll('.memory-tile').forEach(tile => {
      tile.classList.remove('bg-gray-800', 'bg-green-600', 'bg-red-600');
      tile.classList.add('bg-green-600', 'scale-105');
      const emoji = tile.querySelector('.fruit-emoji');
      emoji.classList.remove('opacity-0', 'scale-80');
      emoji.classList.add('opacity-100', 'scale-100');
    });
    $('start-button').classList.add('hidden');
    $('memorize-message').classList.remove('hidden');
  }

  function hideFruits() {
    document.querySelectorAll('.memory-tile').forEach(tile => {
      tile.classList.remove('bg-green-600', 'scale-105');
      tile.classList.add('bg-gray-800');
      const emoji = tile.querySelector('.fruit-emoji');
      emoji.classList.remove('opacity-100', 'scale-100');
      emoji.classList.add('opacity-0', 'scale-80');
    });
  }

  function updateTimerDisplay(elapsed) {
    $('timer').textContent = formatTime(60000 - elapsed);
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
      const username = typeof window.generateRandomUsername === 'function'
        ? window.generateRandomUsername()
        : 'Player ' + Math.floor(Math.random() * 1000);
      localStorage.setItem('simulator_username', username);
      if (posthog.identify) {
        try { posthog.identify(username); } catch {}
      }
    }
    return true;
  }

  // Event tracking helper
  function trackEvent(name, extra = {}) {
    try {
      if (typeof posthog === 'undefined' || !posthog.capture) return;
      posthog.capture(name, {
        variant: puzzleState.variant,
        username: localStorage.getItem('simulator_username'),
        user_id: localStorage.getItem('simulator_user_id'),
        $feature_flag: FEATURE_FLAG_KEY,
        $feature_flag_response: posthog.getFeatureFlag(FEATURE_FLAG_KEY),
        ...extra
      });
    } catch (e) {
      console.error('PostHog error:', e);
    }
  }

  // Leaderboard rendering (via supabaseApi)
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
      console.error('Leaderboard error:', error);
      list.innerHTML = '<p class="text-center text-[0.70rem] italic text-gray-400">Loading...</p>';
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
    showMemorizePhase();
    setTimeout(() => {
      $('memorize-message').classList.add('hidden');
      startCountdownTimer();
    }, 2000);
    trackEvent('puzzle_started', { difficulty: puzzleState.puzzleConfig.difficulty, puzzle_id: puzzleState.puzzleConfig.id });
  }

  function startCountdownTimer() {
    let countdown = 5;
    $('countdown-timer').classList.remove('hidden');
    $('countdown-number').textContent = countdown;
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        $('countdown-number').textContent = countdown;
      } else {
        clearInterval(countdownInterval);
        $('countdown-number').textContent = 'HIDE';
        setTimeout(() => {
          $('countdown-timer').classList.add('hidden');
          puzzleState.isMemorizing = false;
          startGamePhase();
        }, 1000);
      }
    }, 1000);
  }

  function startGamePhase() {
    puzzleState.startTime = Date.now();
    hideFruits();
    $('memorize-message').classList.add('hidden');
    $('reset-button').classList.remove('hidden');
    puzzleState.timerInterval = setInterval(updateTimer, 100);
  }

  function updateTimer() {
    const elapsed = Date.now() - puzzleState.startTime;
    if (elapsed >= 60000) return endChallenge(false);
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
      tile.classList.remove('bg-gray-800');
      tile.classList.add('bg-green-600', 'scale-105');
      const emoji = tile.querySelector('.fruit-emoji');
      emoji.classList.remove('opacity-0', 'scale-80');
      emoji.classList.add('opacity-100', 'scale-100');
      $('found-pineapples-list').textContent = `${puzzleState.foundPineapples.length}/${puzzleState.puzzleConfig.targetCount}`;
      if (puzzleState.foundPineapples.length === puzzleState.puzzleConfig.targetCount) endChallenge(true);
    } else {
      tile.classList.remove('bg-gray-800');
      tile.classList.add('bg-red-600', 'animate-pulse');
      const emoji = tile.querySelector('.fruit-emoji');
      emoji.classList.remove('opacity-0', 'scale-80');
      emoji.classList.add('opacity-100', 'scale-100');
      setTimeout(() => {
        tile.classList.remove('bg-red-600', 'animate-pulse');
        tile.classList.add('bg-gray-800');
        emoji.classList.remove('opacity-100', 'scale-100');
        emoji.classList.add('opacity-0', 'scale-80');
        puzzleState.gridState[row][col] = false;
      }, 1000);
    }
  }

  function endChallenge(success) {
    puzzleState.isRunning = false;
    clearInterval(puzzleState.timerInterval);
    puzzleState.completionTime = success ? Date.now() - puzzleState.startTime : 60000;
    $('reset-button').classList.add('hidden');
    document.querySelectorAll('.try-again-button').forEach(btn => btn.classList.remove('hidden'));
    $('result-card').classList.remove('hidden');
    const statusBadge = $('result-card').querySelector('.inline-flex');
    const emojiSpan = statusBadge.querySelector('.text-xl');
    const statusTitle = statusBadge.querySelector('.text-xs');
    if (success) {
      const isPersonalBest = updateLeaderboard(puzzleState.completionTime, puzzleState.variant);
      $('result-time').textContent = formatTime(puzzleState.completionTime);
      $('result-guesses').textContent = puzzleState.totalClicks;
      $('result-message').innerHTML = isPersonalBest ? '🏆 Personal Best!' : '✓ Complete!';
      $('result-card').classList.remove('border-red-200', 'bg-red-50', 'dark:border-red-900', 'dark:bg-red-950');
      $('result-card').classList.add('border-green-200', 'bg-green-50', 'dark:border-green-900', 'dark:bg-green-950');
      statusBadge.classList.remove('border-red-200', 'dark:border-red-900');
      statusBadge.classList.add('border-green-200', 'dark:border-green-900');
      emojiSpan.textContent = '🎉';
      statusTitle.textContent = 'Challenge Complete';
    } else {
      $('result-time').textContent = '00:60:00';
      $('result-guesses').textContent = `${puzzleState.foundPineapples.length}/${puzzleState.puzzleConfig.targetCount}`;
      $('result-message').innerHTML = '⏰ Time\'s up!';
      $('result-card').classList.remove('border-green-200', 'bg-green-50', 'dark:border-green-900', 'dark:bg-green-950');
      $('result-card').classList.add('border-red-200', 'bg-red-50', 'dark:border-red-900', 'dark:bg-red-950');
      statusBadge.classList.remove('border-green-200', 'dark:border-green-900');
      statusBadge.classList.add('border-red-200', 'dark:border-red-900');
      emojiSpan.textContent = '😞';
      statusTitle.textContent = 'Challenge Failed';
    }
    trackEvent(success ? 'puzzle_completed' : 'puzzle_failed', {
      completion_time_seconds: success ? Number((puzzleState.completionTime / 1000).toFixed(3)) : undefined,
      correct_words_count: puzzleState.foundPineapples.length,
      total_guesses_count: puzzleState.totalClicks
    });
  }

  function resetPuzzle(isRepeat = false) {
    resetState();
    $('timer').textContent = '00:60:00';
    $('found-pineapples-list').textContent = '0';
    document.querySelectorAll('.memory-tile').forEach(tile => {
      tile.classList.remove('bg-green-600', 'bg-red-600', 'bg-gray-800', 'scale-105', 'animate-pulse');
      tile.classList.add('bg-gray-700');
      const emoji = tile.querySelector('.fruit-emoji');
      emoji.classList.remove('opacity-100', 'scale-100');
      emoji.classList.add('opacity-0', 'scale-80');
    });
    $('start-button').classList.remove('hidden');
    $('reset-button').classList.add('hidden');
    $('memorize-message').classList.add('hidden');
    $('countdown-timer').classList.add('hidden');
    document.querySelectorAll('.try-again-button').forEach(btn => btn.classList.add('hidden'));
    $('result-card').classList.add('hidden');
    if (isRepeat) trackEvent('puzzle_repeated', {});
  }

  function updateLeaderboard(currentTime = null, currentVariant = null) {
    const variant = currentVariant || localStorage.getItem('simulator_variant');
    if (!variant) return false;
    renderLeaderboard(variant);
    return currentTime !== null;
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

  function afterVariantResolved() {
    displayVariant();
    setupPuzzle();
    updateLeaderboard();
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
})();
