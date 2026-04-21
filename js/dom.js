(function initDomModule(global) {
  const App = (global.PitchingCorrectionApp = global.PitchingCorrectionApp || {});

  function getDomRefs() {
    const previewCanvas = document.getElementById('previewCanvas');

    return {
      sourceVideo: document.getElementById('sourceVideo'),
      previewCanvas,
      ctx: previewCanvas.getContext('2d'),
      videoInput: document.getElementById('videoInput'),
      heightInput: document.getElementById('heightInput'),
      seekBar: document.getElementById('seekBar'),
      pauseButton: document.getElementById('pauseButton'),
      timeLabel: document.getElementById('timeLabel'),
      modeButtons: [...document.querySelectorAll('#modeButtons button')],
      applyButton: document.getElementById('applyButton'),
      playButton: document.getElementById('playButton'),
      stopButton: document.getElementById('stopButton'),
      resetPointsButton: document.getElementById('resetPointsButton'),
      resetAllButton: document.getElementById('resetAllButton'),
      exportButton: document.getElementById('exportButton'),
      statusText: document.getElementById('statusText'),
      renderModeRadios: [...document.querySelectorAll('input[name="renderMode"]')],
    };
  }

  App.Dom = { getDomRefs };
})(window);
