(function initCorrectedModule(global) {
  const App = (global.PitchingCorrectionApp = global.PitchingCorrectionApp || {});

  function clearCanvas(canvas, ctx) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function renderSourceFrame({ video, ctx, canvas }) {
    clearCanvas(canvas, ctx);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }

  function renderCorrectedFrame({ video, ctx, canvas, transform }) {
    if (!transform?.matrix || !transform?.output) {
      renderSourceFrame({ video, ctx, canvas });
      return;
    }

    const [a, b, c, d, e, f] = transform.matrix;
    const offsetX = transform.output.x;
    const offsetY = transform.output.y;

    clearCanvas(canvas, ctx);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.setTransform(a, b, c, d, e - offsetX, f - offsetY);
    ctx.drawImage(video, 0, 0);
    ctx.restore();
  }

  function playCorrectedVideo({ state, dom, setStatus }) {
    if (!state.transform.matrix) {
      setStatus('先に「補正実行」を行ってください。');
      return;
    }

    stopCorrectedVideo({ state, dom });
    state.isPlayingCorrected = true;

    const tick = () => {
      if (!state.isPlayingCorrected) return;
      renderCorrectedFrame({
        video: dom.sourceVideo,
        ctx: dom.ctx,
        canvas: dom.previewCanvas,
        transform: state.transform,
      });
      state.correctedRequestId = requestAnimationFrame(tick);
    };
