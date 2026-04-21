(function initOverlayModule(global) {
  const App = (global.PitchingCorrectionApp = global.PitchingCorrectionApp || {});

  function drawPoint(ctx, point, label, color) {
    if (!point) return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '14px sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(label, point.x + 10, point.y - 10);
    ctx.restore();
  }

  function drawLine(ctx, from, to, color) {
    if (!from || !to) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawOverlay(ctx, state) {
    drawLine(ctx, state.points.origin, state.points.xAxisEnd, '#ff9800');
    drawLine(ctx, state.points.origin, state.points.yAxisEnd, '#03a9f4');
    drawLine(ctx, state.points.headTop, state.points.footBottom, '#4caf50');

    drawPoint(ctx, state.points.origin, 'O', '#ef5350');
    drawPoint(ctx, state.points.xAxisEnd, 'X', '#ff9800');
    drawPoint(ctx, state.points.yAxisEnd, 'Y', '#03a9f4');
    drawPoint(ctx, state.points.headTop, 'Head', '#4caf50');
    drawPoint(ctx, state.points.footBottom, 'Foot', '#8bc34a');
  }

    App.Overlay = { drawOverlay };
})(window);
  
