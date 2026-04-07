/**
 * Distance metrics for KNN
 * Each returns a number representing distance between two 2D points
 */

export const euclidean = (a, b) => {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
};

export const manhattan = (a, b) => {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
};

export const minkowski = (a, b, p = 3) => {
  return Math.pow(
    Math.pow(Math.abs(a[0] - b[0]), p) + Math.pow(Math.abs(a[1] - b[1]), p),
    1 / p
  );
};

export const metrics = {
  euclidean: { fn: euclidean, label: 'Euclidean', formula: '√(Δx² + Δy²)' },
  manhattan: { fn: manhattan, label: 'Manhattan', formula: '|Δx| + |Δy|' },
  minkowski: { fn: (a, b) => minkowski(a, b, 3), label: 'Minkowski (p=3)', formula: '(|Δx|³ + |Δy|³)^⅓' }
};
