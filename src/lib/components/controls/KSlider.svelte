<script>
  import { k, trainingData } from '../../stores/knnStore.js';
  $: maxK = Math.max(1, Math.min(15, $trainingData.length - 1));
  $: pct = (($k - 1) / (maxK - 1)) * 100;
</script>

<div class="control-block">
  <div class="row">
    <span class="label">Value of K</span>
    <span class="val">{$k}</span>
  </div>
  <input type="range" min="1" max={maxK} step="1" bind:value={$k}
    class="slider" style="--pct:{pct}%" />
  <div class="hints">
    <span>K=1 (overfits)</span>
    <span>K={maxK} (smooth)</span>
  </div>
</div>

<style>
  .control-block { display: flex; flex-direction: column; gap: 8px; }
  .row { display: flex; justify-content: space-between; align-items: baseline; }
  .label {
    font-family: 'Inter', sans-serif;
    font-size: 12px; font-weight: 600;
    color: #6B7280; text-transform: uppercase; letter-spacing: 0.06em;
  }
  .val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 18px; font-weight: 700; color: #C07C00;
  }
  .slider {
    -webkit-appearance: none;
    width: 100%; height: 5px;
    border-radius: 5px;
    outline: none; cursor: pointer;
    background: linear-gradient(to right,
      #F5A623 0%, #F5A623 var(--pct),
      #E5E7EB var(--pct), #E5E7EB 100%);
  }
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px; height: 22px;
    border-radius: 50%;
    background: #F5A623;
    border: 3px solid #fff;
    box-shadow: 0 1px 6px rgba(245,166,35,0.4);
    cursor: pointer;
  }
  .hints {
    display: flex; justify-content: space-between;
    font-size: 11px; color: #9CA3AF;
    font-family: 'Inter', sans-serif;
  }
</style>
