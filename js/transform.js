(function initTransformModule(global) {
  const App = (global.PitchingCorrectionApp = global.PitchingCorrectionApp || {});

  function normalize(vec) {
    const len = Math.hypot(vec.x, vec.y);
    if (len < 1e-6) return null;
    return { x: vec.x / len, y: vec.y / len };
  }

  function transformPoint([a, b, c, d, e, f], point) {
    return {
      x: a * point.x + c * point.y + e,
      y: b * point.x + d * point.y + f,
    };
  }

  function invertCanvasMatrix([a, b, c, d, e, f]) {
    const det = a * d - b * c;
    if (Math.abs(det) < 1e-10) return null;

    const ia = d / det;
    const ib = -b / det;
    const ic = -c / det;
    const id = a / det;
    const ie = (c * f - d * e) / det;
    const iff = (b * e - a * f) / det;

    return [ia, ib, ic, id, ie, iff];
  }

  function computeScaleFromHeight(heightCm, headTop, footBottom) {
    if (!heightCm || !headTop || !footBottom) return null;

    const pixelHeight = Math.hypot(headTop.x - footBottom.x, headTop.y - footBottom.y);
    if (pixelHeight < 1e-6) return null;

    return heightCm / pixelHeight;
  }

  function computeAffineTransform({ origin, xAxisEnd, yAxisEnd, renderMode, videoWidth, videoHeight }) {
    const vx = { x: xAxisEnd.x - origin.x, y: xAxisEnd.y - origin.y };
    const vyRaw = { x: yAxisEnd.x - origin.x, y: yAxisEnd.y - origin.y };

    const ex = normalize(vx);
    if (!ex) return null;

    const dot = vyRaw.x * ex.x + vyRaw.y * ex.y;
    const vyOrtho = { x: vyRaw.x - dot * ex.x, y: vyRaw.y - dot * ex.y };

    let ey = normalize(vyOrtho);
    if (!ey) ey = { x: -ex.y, y: ex.x };
    if (ey.y > 0) ey = { x: -ey.x, y: -ey.y };

    const matrix = [
      ex.x,
      ex.y,
      ey.x,
      ey.y,
      -(ex.x * origin.x + ey.x * origin.y),
      -(ex.y * origin.x + ey.y * origin.y),
    ];     

    const inverseMatrix = invertCanvasMatrix(matrix);
    if (!inverseMatrix) return null;

    const corners = [
      { x: 0, y: 0 },
      { x: videoWidth, y: 0 },
      { x: videoWidth, y: videoHeight },
      { x: 0, y: videoHeight },
    ].map((point) => transformPoint(matrix, point));

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    corners.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });

    const output = renderMode === 'autoCrop'
      ? {
          width: Math.max(1, Math.ceil(maxX - minX)),
          height: Math.max(1, Math.ceil(maxY - minY)),
          x: minX,
          y: minY,
        }
      : {
          width: videoWidth,
          height: videoHeight,
          x: 0,
          y: 0,
        };

    return { matrix, inverseMatrix, output };
  }

  App.Transform = {
    computeScaleFromHeight,
    computeAffineTransform,
  };
})(window);
