import { writable, derived } from 'svelte/store';
import { datasets, defaultDataset } from '../algorithm/datasets.js';
import { predict, predictWeighted, computeDecisionBoundary } from '../algorithm/knn.js';
import { metrics } from '../algorithm/distances.js';

// ── Core state ─────────────────────────────────────────────────────────────
export const k               = writable(3);
export const selectedMetric  = writable('euclidean');
export const selectedDataset = writable(defaultDataset);
export const trainingData    = writable(datasets[defaultDataset].data);
export const queryPoint      = writable({ x: 0.52, y: 0.48 });

// ── UI state ───────────────────────────────────────────────────────────────
export const currentStep  = writable(0);
export const sandboxMode  = writable(false);
export const showBoundary = writable(false);
export const vizMode      = writable('default');

// ── Derived: standard KNN prediction ──────────────────────────────────────
export const knnResult = derived(
  [queryPoint, trainingData, k, selectedMetric],
  ([$q, $td, $k, $m]) => {
    if (!$td.length) return null;
    return predict($q, $td, $k, metrics[$m].fn);
  }
);

// ── Derived: even-K result ─────────────────────────────────────────────────
export const evenKResult = derived(
  [queryPoint, trainingData, k, selectedMetric],
  ([$q, $td, $k, $m]) => {
    if (!$td.length) return null;
    const evenK = $k % 2 === 0 ? $k : $k + 1;
    return predict($q, $td, evenK, metrics[$m].fn);
  }
);

// ── Derived: weighted KNN prediction ──────────────────────────────────────
export const weightedResult = derived(
  [queryPoint, trainingData, k, selectedMetric],
  ([$q, $td, $k, $m]) => {
    if (!$td.length) return null;
    return predictWeighted($q, $td, $k, metrics[$m].fn);
  }
);

// ── Async decision boundary ────────────────────────────────────────────────
// Use writable stores + a subscribe-driven scheduler so the heavy grid
// computation runs in a setTimeout(0) — this lets the browser paint a
// "Computing…" loading state before the work starts.
export const boundaryLoading = writable(false);
export const boundaryGrid    = writable([]);

// Internal trigger: fires whenever any boundary-related input changes
const _boundaryTrigger = derived(
  [trainingData, k, selectedMetric, showBoundary],
  values => values
);

let _boundaryTimer = null;
_boundaryTrigger.subscribe(([$td, $k, $m, $show]) => {
  if (_boundaryTimer) clearTimeout(_boundaryTimer);
  if (!$show || $td.length < 2) {
    boundaryGrid.set([]);
    boundaryLoading.set(false);
    return;
  }
  boundaryLoading.set(true);           // paint loading indicator immediately
  _boundaryTimer = setTimeout(() => {  // defer heavy work to next event loop
    const grid = computeDecisionBoundary($td, $k, metrics[$m].fn, 60);
    boundaryGrid.set(grid);
    boundaryLoading.set(false);
  }, 20);
});

// ── Actions ───────────────────────────────────────────────────────────────
export function resetDataset(name) {
  selectedDataset.set(name);
  trainingData.set([...datasets[name].data]);
  queryPoint.set({ x: 0.52, y: 0.48 });
  showBoundary.set(false);
}

export function addTrainingPoint(x, y, label) {
  trainingData.update(pts => [...pts, { x, y, label }]);
}
