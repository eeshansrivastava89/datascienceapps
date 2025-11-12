(function () {
  function initializeVariant(flagKey) {
    if (typeof posthog === 'undefined') return false;
    const posthogVariant = posthog.getFeatureFlag(flagKey);
    let variant = null;
    if (posthogVariant === '4-words') variant = 'B';
    else if (posthogVariant === 'control') variant = 'A';
    else return false; // not resolved yet

    localStorage.setItem('simulator_variant', variant);

    const userId = 'user_' + Math.random().toString(36).slice(2, 11);
    localStorage.setItem('simulator_user_id', userId);

    if (!localStorage.getItem('simulator_username')) {
      const username = typeof window.generateRandomUsername === 'function'
        ? window.generateRandomUsername()
        : 'Player ' + Math.floor(Math.random() * 1000);
      localStorage.setItem('simulator_username', username);
      if (typeof posthog !== 'undefined' && posthog.identify) {
        try { posthog.identify(username); } catch {}
      }
    }
    return true;
  }

  window.featureFlag = { initializeVariant };
})();
