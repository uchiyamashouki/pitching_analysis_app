(function initMain(global) {
  const App = global.PitchingCorrectionApp;
  const state = App.State.createInitialState();
  const dom = App.Dom.getDomRefs();

  function setStatus(text) {
    dom.statusText.textContent = text;
  }

  function configureCanvasSize() {
    if (!dom.sourceVideo.videoWidth || !dom.sourceVideo.videoHeight) return;
    dom.previewCanvas.width = dom.sourceVideo.videoWidth;
    dom.previewCanvas.height = dom.sourceVideo.videoHeight;
  }

  function updateTimeLabel() {
    const current = Number.isFinite(dom.sourceVideo.currentTime) ? dom.sourceVideo.currentTime : 0;
    const duration = Number.isFinite(dom.sourceVideo.duration) ? dom.sourceVideo.duration : 0;
    dom.timeLabel.textContent = `${current.toFixed(3)}s / ${duration.toFixed(3)}s`;
  }

  function drawPreviewFrame() {
    if (!state.videoFile) return;
    App.Corrected.renderSourceFrame({
      video: dom.sourceVideo,
      ctx: dom.ctx,
      canvas: dom.previewCanvas,
    });
    App.Overlay.drawOverlay(dom.ctx, state);
  }

  function setMode(mode) {
    state.currentMode = mode;
    dom.modeButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.mode === mode);
    });
    setStatus(`設定モード: ${mode ?? 'なし'}`);
  }

  function getCanvasPoint(event) {
    const rect = dom.previewCanvas.getBoundingClientRect();
    const scaleX = dom.previewCanvas.width / rect.width;
    const scaleY = dom.previewCanvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function validatePoints() {
    const required = ['origin', 'xAxisEnd', 'yAxisEnd', 'headTop', 'footBottom'];
    const missing = required.filter((key) => !state.points[key]);
    if (missing.length) {
      setStatus(`未設定: ${missing.join(', ')}`);
      return false;
    }
    return true;
  }

  function applyCorrection() {
    if (!state.videoFile) {
      setStatus('先に動画を読み込んでください。');
      return;
    }
    if (!validatePoints()) return;

    state.transform.scaleCmPerPixel = App.Transform.computeScaleFromHeight(
      state.heightCm,
      state.points.headTop,
      state.points.footBottom,
    );

    const transform = App.Transform.computeAffineTransform({
      origin: state.points.origin,
      xAxisEnd: state.points.xAxisEnd,
      yAxisEnd: state.points.yAxisEnd,
      renderMode: state.renderMode,
      videoWidth: dom.sourceVideo.videoWidth,
      videoHeight: dom.sourceVideo.videoHeight,
    });

    if (!transform) {
      setStatus('変換行列の計算に失敗しました。点の設定を見直してください。');
      return;
    }

    state.transform.matrix = transform.matrix;
    state.transform.inverseMatrix = transform.inverseMatrix;
    state.transform.output = transform.output;

    dom.previewCanvas.width = transform.output.width;
    dom.previewCanvas.height = transform.output.height;

    App.Corrected.renderCorrectedFrame({
      video: dom.sourceVideo,
      ctx: dom.ctx,
      canvas: dom.previewCanvas,
      transform: state.transform,
    });

    setStatus('補正完了。再生ボタンで確認できます。');
  }

  function resetPoints() {
    App.State.resetPoints(state);
    configureCanvasSize();
    drawPreviewFrame();
    setStatus('基準点を再設定してください。');
  }

  function resetAll() {
    App.Corrected.stopCorrectedVideo({ state, dom });

    if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);

    const initial = App.State.createInitialState();
    Object.keys(state).forEach((key) => {
      state[key] = initial[key];
    });

    dom.sourceVideo.removeAttribute('src');
    dom.sourceVideo.load();
    dom.videoInput.value = '';
    dom.previewCanvas.width = 640;
    dom.previewCanvas.height = 360;
    dom.ctx.fillStyle = '#000';
    dom.ctx.fillRect(0, 0, dom.previewCanvas.width, dom.previewCanvas.height);

    dom.seekBar.value = 0;
    dom.seekBar.max = 0;
    dom.seekBar.disabled = true;
    dom.pauseButton.disabled = true;
    dom.timeLabel.textContent = '0.000s / 0.000s';
    dom.heightInput.value = '';
    dom.modeButtons.forEach((button) => button.classList.remove('active'));

    setStatus('リセットしました。');
  }

  function loadVideo(file) {
    App.Corrected.stopCorrectedVideo({ state, dom });
    if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);

    state.videoFile = file;
    state.videoUrl = URL.createObjectURL(file);
    dom.sourceVideo.src = state.videoUrl;
    dom.sourceVideo.load();
    setStatus(`動画を読み込み中: ${file.name}`);
  }

  function handleCanvasPointerDown(event) {
    if (!state.videoFile || !state.currentMode) return;

    const point = getCanvasPoint(event);

    if (state.currentMode === 'origin') state.points.origin = point;
    if (state.currentMode === 'headTop') state.points.headTop = point;
    if (state.currentMode === 'footBottom') state.points.footBottom = point;

    if (state.currentMode === 'xAxis') {
      if (!state.points.origin) {
        setStatus('先に原点を設定してください。');
        return;
      }
      state.points.xAxisEnd = point;
    }

    if (state.currentMode === 'yAxis') {
      if (!state.points.origin) {
        setStatus('先に原点を設定してください。');
        return;
      }
      state.points.yAxisEnd = point;
    }

    drawPreviewFrame();
  }

  dom.videoInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    loadVideo(file);
  });

  dom.heightInput.addEventListener('input', () => {
    const value = Number.parseFloat(dom.heightInput.value);
    state.heightCm = Number.isFinite(value) && value > 0 ? value : null;
  });

  dom.sourceVideo.addEventListener('loadedmetadata', () => {
    configureCanvasSize();
    drawPreviewFrame();
    dom.seekBar.max = dom.sourceVideo.duration;
    dom.seekBar.disabled = false;
    dom.pauseButton.disabled = false;
    updateTimeLabel();
    setStatus('代表フレームに移動して基準点を設定してください。');
  });

  dom.sourceVideo.addEventListener('error', () => {
    setStatus('動画の読み込みに失敗しました。別ファイルで再度お試しください。');
  }
                                   
  dom.sourceVideo.addEventListener('timeupdate', () => {
    if (!dom.seekBar.matches(':active')) {
      dom.seekBar.value = dom.sourceVideo.currentTime;
    }

    updateTimeLabel();
    if (!state.isPlayingCorrected) drawPreviewFrame();
  });

  dom.seekBar.addEventListener('input', () => {
    if (!Number.isFinite(dom.sourceVideo.duration)) return;
    dom.sourceVideo.currentTime = Math.max(0, Math.min(Number.parseFloat(dom.seekBar.value), dom.sourceVideo.duration));
  });

  dom.pauseButton.addEventListener('click', () => {
    dom.sourceVideo.pause();
    drawPreviewFrame();
  });

  dom.modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });

  dom.previewCanvas.addEventListener('pointerdown', handleCanvasPointerDown);

  dom.applyButton.addEventListener('click', applyCorrection);
  dom.playButton.addEventListener('click', () => {
    App.Corrected.playCorrectedVideo({ state, dom, setStatus });
  });
  dom.stopButton.addEventListener('click', () => {
    App.Corrected.stopCorrectedVideo({ state, dom });
  });
  dom.resetPointsButton.addEventListener('click', resetPoints);
  dom.resetAllButton.addEventListener('click', resetAll);
  dom.exportButton.addEventListener('click', () => {
    App.Corrected.exportCorrectedVideo({ state, dom, setStatus });
  });

  dom.renderModeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked) state.renderMode = radio.value;
    });
  });

  resetAll();
})(window);
