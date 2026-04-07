/**
 * KNN Algorithm — built from scratch, every step exposed for visualization.
 */
import { euclidean } from './distances.js';

/** Compute & sort distances from queryPoint to all training points */
export function computeAllDistances(queryPoint, trainingData, distanceFn = euclidean) {
  return trainingData
    .map((pt, index) => ({
      index, x: pt.x, y: pt.y, label: pt.label,
      distance: distanceFn([queryPoint.x, queryPoint.y], [pt.x, pt.y])
    }))
    .sort((a, b) => a.distance - b.distance);
}

/** Pick the K nearest from a sorted distances array */
export function getKNearest(sortedDistances, k) {
  return sortedDistances.slice(0, k);
}

/** Standard majority vote — returns { winner, votes: {label: count} } */
export function majorityVote(neighbors) {
  const votes = {};
  for (const n of neighbors) votes[n.label] = (votes[n.label] || 0) + 1;
  const entries = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  const isTie = entries.length > 1 && entries[0][1] === entries[1][1];
  return { winner: entries[0][0], votes, isTie };
}

/** Weighted vote — closer neighbors get weight = 1 / (distance + ε) */
export function weightedVote(neighbors) {
  const weights = {};
  let total = 0;
  for (const n of neighbors) {
    const w = 1 / (n.distance + 1e-6);
    weights[n.label] = (weights[n.label] || 0) + w;
    total += w;
  }
  // Normalize weights to fractions
  const normalized = {};
  for (const [k, v] of Object.entries(weights)) normalized[k] = v / total;
  const winner = Object.entries(normalized).sort((a, b) => b[1] - a[1])[0][0];
  return { winner, weights: normalized, raw: weights };
}

/** Full standard predict */
export function predict(queryPoint, trainingData, k, distanceFn = euclidean) {
  const allDistances = computeAllDistances(queryPoint, trainingData, distanceFn);
  const neighbors    = getKNearest(allDistances, k);
  const { winner, votes, isTie } = majorityVote(neighbors);
  return { allDistances, neighbors, votes, prediction: winner, isTie, queryPoint };
}

/** Predict with weighted vote */
export function predictWeighted(queryPoint, trainingData, k, distanceFn = euclidean) {
  const allDistances = computeAllDistances(queryPoint, trainingData, distanceFn);
  const neighbors    = getKNearest(allDistances, k);
  const { winner, weights } = weightedVote(neighbors);
  return { allDistances, neighbors, weights, prediction: winner, queryPoint };
}

/** Decision boundary: classify every grid point */
export function computeDecisionBoundary(trainingData, k, distanceFn = euclidean, resolution = 60) {
  const out = [];
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = i / resolution, y = j / resolution;
      const dists     = computeAllDistances({ x, y }, trainingData, distanceFn);
      const neighbors = getKNearest(dists, k);
      const { winner } = majorityVote(neighbors);
      out.push({ x, y, label: winner });
    }
  }
  return out;
}
