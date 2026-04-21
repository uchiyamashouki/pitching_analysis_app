(function initStateModule(global) {
  const App = (global.PitchingCorrectionApp = global.PitchingCorrectionApp || {});

  function createInitialState() {
    return {
      videoFile: null,
      videoUrl: null,
      heightCm: null,
      currentMode: null,
      points: {
        origin: null,
        xAxisEnd: null,
        yAxisEnd: null,
        headTop: null,
        footBottom: null,
      },
      transform: {
        matrix: null,
        inverseMatrix: null,
        scaleCmPerPixel: null,
        output: null,
      },
      renderMode: 'autoCrop',
      isPlayingCorrected: false,
      correctedRequestId: null,
      exportRecorder: null,
      exportChunks: [],
    };
  }

  function resetPoints(state) {
    state.points = {
      origin: null,
      xAxisEnd: null,
      yAxisEnd: null,
      headTop: null,
      footBottom: null,
    };
    state.transform = {
      matrix: null,
      inverseMatrix: null,
      scaleCmPerPixel: null,
      output: null,
    };
  }

  App.State = {
    createInitialState,
    resetPoints,
  };
})(window);
