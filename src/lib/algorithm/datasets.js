/**
 * Built-in 2D labeled datasets for KNN demonstrations
 * All coordinates are normalized to [0, 1] range
 */

function gaussian(cx, cy, spread, n, label, seed = 0) {
  const points = [];
  // Simple seeded pseudo-random for reproducibility
  let s = seed + 1;
  const rand = () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < n; i++) {
    // Box-Muller for Gaussian
    const u = rand(), v = rand();
    const nx = Math.sqrt(-2 * Math.log(u + 0.0001)) * Math.cos(2 * Math.PI * v);
    const ny = Math.sqrt(-2 * Math.log(u + 0.0001)) * Math.sin(2 * Math.PI * v);
    points.push({
      x: Math.max(0.05, Math.min(0.95, cx + nx * spread)),
      y: Math.max(0.05, Math.min(0.95, cy + ny * spread)),
      label
    });
  }
  return points;
}

export const datasets = {
  blobs: {
    name: 'Gaussian Blobs',
    description: 'Three well-separated clusters — ideal for learning the basics',
    data: [
      ...gaussian(0.25, 0.25, 0.08, 18, 'A', 1),
      ...gaussian(0.75, 0.25, 0.08, 18, 'B', 2),
      ...gaussian(0.5,  0.75, 0.08, 18, 'C', 3)
    ]
  },

  moons: {
    name: 'Two Moons',
    description: 'Interleaving half-circles — shows KNN handling non-linear boundaries',
    data: (() => {
      const pts = [];
      const n = 25;
      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1)) * Math.PI;
        pts.push({ x: 0.15 + 0.35 * Math.cos(t), y: 0.35 + 0.3 * Math.sin(t) + (Math.random() - 0.5) * 0.05, label: 'A' });
        pts.push({ x: 0.5 + 0.35 * Math.cos(t + Math.PI), y: 0.55 - 0.3 * Math.sin(t + Math.PI) + (Math.random() - 0.5) * 0.05, label: 'B' });
      }
      return pts;
    })()
  },

  circles: {
    name: 'Concentric Circles',
    description: 'Inner vs outer ring — demonstrates how K affects sensitivity',
    data: (() => {
      const pts = [];
      const n = 20;
      for (let i = 0; i < n; i++) {
        const t = (i / n) * 2 * Math.PI;
        const r1 = 0.14 + (Math.random() - 0.5) * 0.03;
        const r2 = 0.32 + (Math.random() - 0.5) * 0.04;
        pts.push({ x: 0.5 + r1 * Math.cos(t), y: 0.5 + r1 * Math.sin(t), label: 'A' });
        pts.push({ x: 0.5 + r2 * Math.cos(t), y: 0.5 + r2 * Math.sin(t), label: 'B' });
      }
      return pts;
    })()
  },

  xor: {
    name: 'XOR Pattern',
    description: 'Checkerboard quadrants — a classic non-linearly separable problem',
    data: [
      ...gaussian(0.25, 0.25, 0.07, 15, 'A', 10),
      ...gaussian(0.75, 0.75, 0.07, 15, 'A', 11),
      ...gaussian(0.75, 0.25, 0.07, 15, 'B', 12),
      ...gaussian(0.25, 0.75, 0.07, 15, 'B', 13)
    ]
  }
};

export const defaultDataset = 'blobs';
