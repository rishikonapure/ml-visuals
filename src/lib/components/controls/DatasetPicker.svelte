<script>
  import { selectedDataset, resetDataset } from '../../stores/knnStore.js';
  import { datasets } from '../../algorithm/datasets.js';
  const list = Object.entries(datasets).map(([k, v]) => ({ key: k, ...v }));
</script>

<div class="control-block">
  <span class="label">Dataset</span>
  <!-- Compact horizontal wrap row — 4 pills, wraps to 2×2 if needed -->
  <div class="btns">
    {#each list as ds}
      <button
        class="ds-btn" class:active={$selectedDataset === ds.key}
        on:click={() => resetDataset(ds.key)}
        title={ds.description}
      >
        {ds.name}
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
  .btns { display: flex; flex-wrap: wrap; gap: 5px; }
  .ds-btn {
    padding: 6px 11px;
    border-radius: 7px;
    border: 1.5px solid #E5E7EB;
    background: #fff;
    color: #6B7280;
    font-family: 'Inter', sans-serif;
    font-size: 11.5px; font-weight: 500;
    cursor: pointer; transition: all 0.18s;
    white-space: nowrap;
  }
  .ds-btn:hover { border-color: #C4C8D8; color: #374151; background: #F9FAFB; }
  .ds-btn.active { border-color: #2ECC8F; background: #EDFAF4; color: #1A8C62; font-weight: 700; }
</style>
