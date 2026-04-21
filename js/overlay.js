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
    drawLine(ctx, state.points.planeP0, state.points.planeP1, '#ff9800');
    drawLine(ctx, state.points.planeP1, state.points.planeP2, '#ff9800');
    drawLine(ctx, state.points.planeP2, state.points.planeP3, '#ff9800');
    drawLine(ctx, state.points.planeP3, state.points.planeP0, '#ff9800');
    drawLine(ctx, state.points.headTop, state.points.footBottom, '#4caf50');
    drawLine(ctx, state.points.headTop, state.points.footBottom, '#4caf50');

    drawPoint(ctx, state.points.planeP0, 'P0', '#ef5350');
    drawPoint(ctx, state.points.planeP1, 'P1', '#ff9800');
    drawPoint(ctx, state.points.planeP2, 'P2', '#03a9f4');
    drawPoint(ctx, state.points.planeP3, 'P3', '#ab47bc');
    drawPoint(ctx, state.points.headTop, 'Head', '#4caf50');
    drawPoint(ctx, state.points.footBottom, 'Foot', '#8bc34a');
  }

    App.Overlay = { drawOverlay };
})(window);
  
