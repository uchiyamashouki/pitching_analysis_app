(function initStateModule(global) {
  const App = (global.PitchingCorrectionApp = global.PitchingCorrectionApp || {});

  function createInitialState() {
    return {
      videoFile: null,
      videoUrl: null,
      heightCm: null,
      currentMode: null,
      points: {
        planeP0: null,
        planeP1: null,
        planeP2: null,
        planeP3: null,
        headTop: null,
        footBottom: null,
      },
      transform: {
        type: null,
        matrix: null,
        inverseMatrix: null,
        scaleCmPerPixel: null,
        output: null,
        destinationRect: null,
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
      planeP0: null,
      planeP1: null,
      planeP2: null,
      planeP3: null,
      headTop: null,
      footBottom: null,
    };
    state.transform = {
      type: null,
      matrix: null,
      inverseMatrix: null,
      scaleCmPerPixel: null,
      output: null,
      destinationRect: null,
    };
  }

  App.State = {
    createInitialState,
    resetPoints,
  };
})(window);
