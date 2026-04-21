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

    dom.sourceVideo.currentTime = 0;
    dom.sourceVideo.play();
    tick();
    setStatus('補正後プレビューを再生中です。');
  }

  function stopCorrectedVideo({ state, dom }) {
    state.isPlayingCorrected = false;
    if (state.correctedRequestId) {
      cancelAnimationFrame(state.correctedRequestId);
      state.correctedRequestId = null;
    }
    dom.sourceVideo.pause();
  }

  function exportCorrectedVideo({ state, dom, setStatus }) {
    if (!state.transform.matrix) {
      setStatus('先に「補正実行」を行ってください。');
      return;
    }

    if (!window.MediaRecorder) {
      setStatus('このブラウザは MediaRecorder に対応していません。');
      return;
    }

    stopCorrectedVideo({ state, dom });
    state.exportChunks = [];

    const stream = dom.previewCanvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    state.exportRecorder = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data?.size > 0) state.exportChunks.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(state.exportChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'corrected.webm';
      a.click();
      URL.revokeObjectURL(url);
      state.exportRecorder = null;
      setStatus('WebM を保存しました。');
    };

    dom.sourceVideo.currentTime = 0;
    dom.sourceVideo.play();
    recorder.start();
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
        state.isPlayingCorrected = false;
        recorder.stop();
        return;
      }

      state.correctedRequestId = requestAnimationFrame(tick);
    };

    tick();
    setStatus('書き出し中です...');
  }

   App.Corrected = {
    renderSourceFrame,
    renderCorrectedFrame,
    playCorrectedVideo,
    stopCorrectedVideo,
    exportCorrectedVideo,
  };
})(window);
