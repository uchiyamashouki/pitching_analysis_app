(function initTransformModule(global) {
  const App = (global.PitchingCorrectionApp = global.PitchingCorrectionApp || {});

  function solveLinearSystem(matrix, vector) {
    const n = vector.length;
    const a = matrix.map((row, rowIndex) => [...row, vector[rowIndex]]);

    for (let col = 0; col < n; col += 1) {
      let pivot = col;
      for (let row = col + 1; row < n; row += 1) {
        if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
      }
      if (Math.abs(a[pivot][col]) < 1e-10) return null;
      if (pivot !== col) [a[pivot], a[col]] = [a[col], a[pivot]];

      const divisor = a[col][col];
      for (let c = col; c <= n; c += 1) a[col][c] /= divisor;

      for (let row = 0; row < n; row += 1) {
        if (row === col) continue;
        const factor = a[row][col];
        for (let c = col; c <= n; c += 1) {
          a[row][c] -= factor * a[col][c];
        }
      }
    }
    
    return a.map((row) => row[n]);
  }

  function computeScaleFromHeight(heightCm, headTop, footBottom) {
    if (!heightCm || !headTop || !footBottom) return null;

    const pixelHeight = Math.hypot(headTop.x - footBottom.x, headTop.y - footBottom.y);
    if (pixelHeight < 1e-6) return null;

    return heightCm / pixelHeight;
  }

  function invertHomography(matrix) {
    const [a, b, c, d, e, f, g, h, i] = matrix;
    const A = e * i - f * h;
    const B = -(d * i - f * g);
    const C = d * h - e * g;
    const D = -(b * i - c * h);
    const E = a * i - c * g;
    const F = -(a * h - b * g);
    const G = b * f - c * e;
    const H = -(a * f - c * d);
    const I = a * e - b * d;
    const det = a * A + b * B + c * C;
    if (Math.abs(det) < 1e-10) return null;
    return [A / det, D / det, G / det, B / det, E / det, H / det, C / det, F / det, I / det];
  }

  function projectPoint(matrix, point) {
    const [h11, h12, h13, h21, h22, h23, h31, h32, h33] = matrix;
    const w = h31 * point.x + h32 * point.y + h33;
    if (Math.abs(w) < 1e-10) return null;
    return {
      x: (h11 * point.x + h12 * point.y + h13) / w,
      y: (h21 * point.x + h22 * point.y + h23) / w,
    };
  }

  function computeHomography(srcPoints, dstPoints) {
    if (srcPoints.length !== 4 || dstPoints.length !== 4) return null;

    const matrix = [];
    const vector = [];

    for (let idx = 0; idx < 4; idx += 1) {
      const { x, y } = srcPoints[idx];
      const { x: u, y: v } = dstPoints[idx];

      matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
      vector.push(u);
      matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
      vector.push(v);
    }

    const solved = solveLinearSystem(matrix, vector);
    if (!solved) return null;
    return [...solved, 1];
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function computeHomographyTransform({ planePoints, renderMode, videoWidth, videoHeight }) {
    const width = Math.max(
      1,
      Math.round((distance(planePoints[0], planePoints[1]) + distance(planePoints[3], planePoints[2])) / 2),
    );
    const height = Math.max(
      1,
      Math.round((distance(planePoints[0], planePoints[3]) + distance(planePoints[1], planePoints[2])) / 2),
    );

    const cropOutput = {
      width,
      height,
      x: 0,
      y: 0,
    };

    const keepBlackOutput = {
      width: videoWidth,
      height: videoHeight,
      x: 0,
      y: 0,
    }; 

    const output = renderMode === 'autoCrop' ? cropOutput : keepBlackOutput;
    const offsetX = renderMode === 'autoCrop' ? 0 : (videoWidth - width) / 2;
    const offsetY = renderMode === 'autoCrop' ? 0 : (videoHeight - height) / 2;
    const destinationRect = { width, height, offsetX, offsetY };

    const destinationPlane = [
      { x: offsetX, y: offsetY },
      { x: offsetX + width, y: offsetY },
      { x: offsetX + width, y: offsetY + height },
      { x: offsetX, y: offsetY + height },
    ];

    const matrix = computeHomography(planePoints, destinationPlane);
    if (!matrix) return null;
    const inverseMatrix = invertHomography(matrix);
    if (!inverseMatrix) return null;

    return { type: 'homography', matrix, inverseMatrix, output, destinationRect };
  }

  App.Transform = {
    computeScaleFromHeight,
    computeHomographyTransform,
    projectPoint,
  };
})(window);
