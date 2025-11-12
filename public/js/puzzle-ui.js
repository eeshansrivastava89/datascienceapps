(function () {
  const { puzzleState } = window.simState;

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

  function tileReveal(row, col, fruit) {
    const selector = `.memory-tile[data-row="${row}"][data-col="${col}"]`;
    return document.querySelector(selector);
  }

  window.puzzleUI = { buildGrid, showMemorizePhase, hideFruits, updateTimerDisplay, tileReveal };
})();
