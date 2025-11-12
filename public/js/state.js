(function () {
  // Centralized game state
  const puzzleState = {
    variant: null,
    puzzleConfig: null,
    startTime: null,
    isRunning: false,
    timerInterval: null,
    completionTime: null,
    // Memory game specific state
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

  window.simState = { puzzleState, resetState };
})();
