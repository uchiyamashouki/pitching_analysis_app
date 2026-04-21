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

    clearCanvas(canvas, ctx);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (transform.type === 'homography') {
      renderHomographyFrame({ video, ctx, transform });
      return;
    }

    renderSourceFrame({ video, ctx, canvas });
  }

  function drawWarpedTriangle({ ctx, video, srcA, srcB, srcC, dstA, dstB, dstC }) {
    const denom = srcA.x * (srcB.y - srcC.y) + srcB.x * (srcC.y - srcA.y) + srcC.x * (srcA.y - srcB.y);
    if (Math.abs(denom) < 1e-6) return;

    const a = (dstA.x * (srcB.y - srcC.y) + dstB.x * (srcC.y - srcA.y) + dstC.x * (srcA.y - srcB.y)) / denom;
    const b = (dstA.y * (srcB.y - srcC.y) + dstB.y * (srcC.y - srcA.y) + dstC.y * (srcA.y - srcB.y)) / denom;
    const c = (dstA.x * (srcC.x - srcB.x) + dstB.x * (srcA.x - srcC.x) + dstC.x * (srcB.x - srcA.x)) / denom;
    const d = (dstA.y * (srcC.x - srcB.x) + dstB.y * (srcA.x - srcC.x) + dstC.y * (srcB.x - srcA.x)) / denom;
    const e = (dstA.x * (srcB.x * srcC.y - srcC.x * srcB.y)
      + dstB.x * (srcC.x * srcA.y - srcA.x * srcC.y)
      + dstC.x * (srcA.x * srcB.y - srcB.x * srcA.y)) / denom;
    const f = (dstA.y * (srcB.x * srcC.y - srcC.x * srcB.y)
      + dstB.y * (srcC.x * srcA.y - srcA.x * srcC.y)
      + dstC.y * (srcA.x * srcB.y - srcB.x * srcA.y)) / denom;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(dstA.x, dstA.y);
    ctx.lineTo(dstB.x, dstB.y);
    ctx.lineTo(dstC.x, dstC.y);
    ctx.closePath();
    ctx.clip();
    ctx.setTransform(a, b, c, d, e, f);
    ctx.drawImage(video, 0, 0);
    ctx.restore();
  }

  function renderHomographyFrame({ video, ctx, transform }) {
    const inverse = transform.inverseMatrix;
    const destinationRect = transform.destinationRect;
    if (!inverse || !destinationRect) return;

    const cellSize = 24;
    const cols = Math.max(2, Math.ceil(destinationRect.width / cellSize));
    const rows = Math.max(2, Math.ceil(destinationRect.height / cellSize));
    const stepX = destinationRect.width / cols;
    const stepY = destinationRect.height / rows;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x0 = destinationRect.offsetX + col * stepX;
        const y0 = destinationRect.offsetY + row * stepY;
        const x1 = destinationRect.offsetX + (col + 1) * stepX;
        const y1 = destinationRect.offsetY + (row + 1) * stepY;

        const d00 = { x: x0, y: y0 };
        const d10 = { x: x1, y: y0 };
        const d11 = { x: x1, y: y1 };
        const d01 = { x: x0, y: y1 };

        const s00 = App.Transform.projectPoint(inverse, d00);
        const s10 = App.Transform.projectPoint(inverse, d10);
        const s11 = App.Transform.projectPoint(inverse, d11);
        const s01 = App.Transform.projectPoint(inverse, d01);
        if (!s00 || !s10 || !s11 || !s01) continue;

        drawWarpedTriangle({ ctx, video, srcA: s00, srcB: s10, srcC: s11, dstA: d00, dstB: d10, dstC: d11 });
        drawWarpedTriangle({ ctx, video, srcA: s00, srcB: s11, srcC: s01, dstA: d00, dstB: d11, dstC: d01 });
      }
    }
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
