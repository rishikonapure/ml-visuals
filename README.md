# KNN Explorable Explainer

An interactive, scroll-driven visual explanation of the **K-Nearest Neighbors** algorithm — built with Svelte + D3.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev
# → Open http://localhost:5173

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

## Deploy to Vercel

```bash
# One-time setup
npm i -g vercel

# Deploy
vercel
```

## Project Structure

```
src/
├── routes/+page.svelte          ← Main page
├── lib/
│   ├── algorithm/
│   │   ├── knn.js               ← KNN from scratch
│   │   ├── distances.js         ← Euclidean, Manhattan, Minkowski
│   │   └── datasets.js          ← Built-in 2D datasets
│   ├── components/
│   │   ├── visualization/       ← KNNCanvas, DecisionBoundary, VoteBadge
│   │   ├── controls/            ← KSlider, MetricToggle, DatasetPicker
│   │   └── layout/              ← Scrolly, StickyViz
│   └── stores/knnStore.js       ← Global state
```

## Features
- 7-chapter scroll-driven story
- Live decision boundary heatmap
- Interactive sandbox (add points, drag query, adjust K)
- 3 distance metrics: Euclidean, Manhattan, Minkowski
- 4 preset datasets: Blobs, Moons, Circles, XOR
