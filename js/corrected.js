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

  function stopCorrectedVideo({ state, dom }) {
    state.isPlayingCorrected = false;
    if (state.correctedRequestId !== null) {
      cancelAnimationFrame(state.correctedRequestId);
      state.correctedRequestId = null;
    }

    dom.sourceVideo.pause();

    if (state.transform.matrix) {
      renderCorrectedFrame({
        video: dom.sourceVideo,
        ctx: dom.ctx,
        canvas: dom.previewCanvas,
        transform: state.transform,
      });
        return;
    }

    renderSourceFrame({
      video: dom.sourceVideo,
      ctx: dom.ctx,
      canvas: dom.previewCanvas,
    });
  }

  function playCorrectedVideo({ state, dom, setStatus }) {
    if (!state.transform.matrix) {
      setStatus('先に「補正実行」を行ってください。');
      return;
    }

    stopCorrectedVideo({ state, dom });

    dom.sourceVideo.currentTime = 0;
    dom.sourceVideo
      .play()
      .then(() => {
        state.isPlayingCorrected = true;

        const tick = () => {
          if (!state.isPlayingCorrected) return;
          renderCorrectedFrame({
            video: dom.sourceVideo,
            ctx: dom.ctx,
            canvas: dom.previewCanvas,
            transform: state.transform,
          });

          if (dom.sourceVideo.ended) {
            stopCorrectedVideo({ state, dom });
            return;
          }

          state.correctedRequestId = requestAnimationFrame(tick);
        };

        state.correctedRequestId = requestAnimationFrame(tick);
      })
      .catch(() => {
        setStatus('再生を開始できませんでした。ブラウザの再生制限をご確認ください。');
      });
  }

  function exportCorrectedVideo({ state, dom, setStatus }) {
    if (!state.transform.matrix) {
      setStatus('先に「補正実行」を行ってください。');
      return;
    }

    setStatus('WebM保存は未実装です。必要なら次に追加します。');
    // TODO: MediaRecorder を利用した出力機能を追加。
    // 現時点では再生機能の安定化を優先し、誤動作しないよう案内のみ表示する。
    void dom;
  }

  App.Corrected = {
    renderSourceFrame,
    renderCorrectedFrame,
    playCorrectedVideo,
    stopCorrectedVideo,
    exportCorrectedVideo,
  };
})(window);
