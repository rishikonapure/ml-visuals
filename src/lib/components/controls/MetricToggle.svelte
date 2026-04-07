<script>
  import { selectedMetric } from '../../stores/knnStore.js';
  import { metrics } from '../../algorithm/distances.js';
  const list = Object.entries(metrics).map(([k, v]) => ({ key: k, ...v }));
</script>

<div class="control-block">
  <span class="label">Distance Metric</span>
  <!-- Compact horizontal pill row — formula shown as tooltip -->
  <div class="btns">
    {#each list as m}
      <button
        class="btn" class:active={$selectedMetric === m.key}
        on:click={() => selectedMetric.set(m.key)}
        title={m.formula}
      >
        {m.label}
      </button>
    {/each}
  </div>
</div>

<style>
  .control-block { display: flex; flex-direction: column; gap: 6px; }
  .label {
    font-family: 'Inter', sans-serif;
    font-size: 11px; font-weight: 700;
    color: #6B7280; text-transform: uppercase; letter-spacing: 0.06em;
  }
  /* Three equal pills in one row */
  .btns { display: flex; gap: 5px; }
  .btn {
    flex: 1;
    padding: 7px 6px;
    border-radius: 7px;
    border: 1.5px solid #E5E7EB;
    background: #fff;
    font-family: 'Inter', sans-serif;
    font-size: 11.5px; font-weight: 500; color: #6B7280;
    cursor: pointer; transition: all 0.18s;
    text-align: center; white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis;
  }
  .btn:hover { border-color: #C4C8D8; color: #374151; background: #F9FAFB; }
  .btn.active { border-color: #4E79FF; background: #EEF2FF; color: #2452CC; font-weight: 700; }
</style>
