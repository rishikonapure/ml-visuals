<script>
  import { knnResult, weightedResult } from '../../stores/knnStore.js';

  export let mode = 'weighted'; // 'weighted' | 'probabilistic'

  const C  = { A:'#4E79FF', B:'#FF4E6A', C:'#2ECC8F', D:'#FF9F1C' };
  const CB = { A:'#EEF2FF', B:'#FFF0F2', C:'#EDFAF4', D:'#FFF6EC' };
  const EPS = 1e-6;

  // ── Weighted rows ──────────────────────────────────────────────────────────
  $: wNeighbors = (() => {
    if (!$weightedResult?.neighbors?.length) return [];
    const nbrs = $weightedResult.neighbors;
    const rows = nbrs.map(n => ({ ...n, rawW: 1 / (n.distance + EPS) }));
    const total = rows.reduce((s, r) => s + r.rawW, 0);
    return rows.map(r => ({ ...r, pct: (r.rawW / total) * 100 }));
  })();

  $: wClassTotals = (() => {
    if (!$weightedResult?.weights) return [];
    return Object.entries($weightedResult.weights)
      .sort((a, b) => b[1] - a[1])
      .map(([lbl, frac]) => ({ label: lbl, pct: frac * 100 }));
  })();

  $: wPrediction = $weightedResult?.prediction;

  // ── Probabilistic rows ─────────────────────────────────────────────────────
  $: pNeighbors = (() => {
    if (!$knnResult?.neighbors?.length) return [];
    return $knnResult.neighbors.map(n => ({ label: n.label, dist: n.distance }));
  })();

  $: pClassTotals = (() => {
    if (!$knnResult?.votes) return [];
    const total = Object.values($knnResult.votes).reduce((a, b) => a + b, 0);
    return Object.entries($knnResult.votes)
      .sort((a, b) => b[1] - a[1])
      .map(([lbl, votes]) => ({ label: lbl, votes, total, pct: (votes / total) * 100 }));
  })();

  $: pPrediction = $knnResult?.prediction;
  $: pConfidence = pClassTotals.find(c => c.label === pPrediction)?.pct ?? 0;
</script>

<!-- ══════ WEIGHTED BREAKDOWN ═════════════════════════════════════════════════ -->
{#if mode === 'weighted' && wNeighbors.length}
<div class="math-box">
  <div class="mb-header">
    <span class="mb-pill">Live Calculation</span>
    <span class="mb-sub">drag the "?" to update</span>
  </div>

  <!-- formula -->
  <div class="formula">
    <span class="fml-text">wᵢ = 1 / (dᵢ + ε)</span>
    <span class="fml-note">ε = 10⁻⁶ prevents ÷ 0</span>
  </div>

  <!-- per-neighbor rows -->
  <div class="nb-list">
    {#each wNeighbors as row, i}
      <div class="nb-row">
        <span class="nb-rank">#{i+1}</span>
        <span class="nb-chip" style="background:{CB[row.label]};color:{C[row.label]}">
          Class {row.label}
        </span>
        <span class="nb-d">d={row.distance.toFixed(3)}</span>
        <span class="nb-eq">→ w={row.rawW.toFixed(2)}</span>
        <div class="nb-bar-wrap">
          <div class="nb-bar" style="width:{row.pct}%;background:{C[row.label]}"></div>
        </div>
        <span class="nb-pct">{row.pct.toFixed(1)}%</span>
      </div>
    {/each}
  </div>

  <!-- class totals -->
  <div class="divider"></div>
  <p class="section-label">Aggregated class weights</p>
  <div class="class-list">
    {#each wClassTotals as ct}
      <div class="ct-row">
        <span class="ct-name" style="color:{C[ct.label]}">Class {ct.label}</span>
        <div class="ct-track">
          <div class="ct-fill" style="width:{ct.pct}%;background:{C[ct.label]}"></div>
        </div>
        <span class="ct-val" style="color:{C[ct.label]}">{ct.pct.toFixed(1)}%</span>
      </div>
    {/each}
  </div>

  {#if wPrediction}
    <div class="pred-strip" style="border-color:{C[wPrediction]};color:{C[wPrediction]}">
      Prediction → <strong>Class {wPrediction}</strong>
      <span class="pred-note">(weighted majority)</span>
    </div>
  {/if}
</div>
{/if}

<!-- ══════ PROBABILISTIC BREAKDOWN ═══════════════════════════════════════════ -->
{#if mode === 'probabilistic' && pNeighbors.length}
<div class="math-box">
  <div class="mb-header">
    <span class="mb-pill">Live Calculation</span>
    <span class="mb-sub">drag the "?" to update</span>
  </div>

  <!-- formula -->
  <div class="formula">
    <span class="fml-text">P(class c) = votes(c) / K</span>
    <span class="fml-note">simple vote fraction</span>
  </div>

  <!-- per-neighbor rows -->
  <div class="nb-list">
    {#each pNeighbors as row, i}
      <div class="nb-row compact">
        <span class="nb-rank">#{i+1}</span>
        <span class="nb-chip" style="background:{CB[row.label]};color:{C[row.label]}">
          Class {row.label}
        </span>
        <span class="nb-d">d={row.dist.toFixed(3)}</span>
        <span class="nb-vote">1 vote</span>
      </div>
    {/each}
  </div>

  <!-- class totals -->
  <div class="divider"></div>
  <p class="section-label">Class probabilities</p>
  <div class="class-list">
    {#each pClassTotals as ct}
      <div class="ct-row">
        <span class="ct-name" style="color:{C[ct.label]}">Class {ct.label}</span>
        <span class="ct-fraction">{ct.votes}/{ct.total}</span>
        <div class="ct-track">
          <div class="ct-fill" style="width:{ct.pct}%;background:{C[ct.label]}"></div>
        </div>
        <span class="ct-val" style="color:{C[ct.label]}">{ct.pct.toFixed(1)}%</span>
      </div>
    {/each}
  </div>

  {#if pPrediction}
    <div class="pred-strip" style="border-color:{C[pPrediction]};color:{C[pPrediction]}">
      Prediction → <strong>Class {pPrediction}</strong>
      <span class="pred-note">({pConfidence.toFixed(0)}% confidence)</span>
    </div>
  {/if}
</div>
{/if}

<style>
  .math-box {
    margin-top: 20px;
    padding: 14px 16px;
    background: #F8FAFF;
    border: 1px solid #DDEAFF;
    border-radius: 10px;
    font-family: 'Inter', sans-serif;
  }

  /* header */
  .mb-header { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
  .mb-pill {
    background:#4E79FF; color:#fff;
    font-size:9px; font-weight:800; letter-spacing:0.8px; text-transform:uppercase;
    padding:2px 7px; border-radius:4px;
  }
  .mb-sub { color:#9CA3AF; font-size:11px; }

  /* formula bar */
  .formula {
    display:flex; align-items:center; gap:10px;
    background:#EEF2FF; border-radius:6px;
    padding:7px 11px; margin-bottom:10px;
  }
  .fml-text { font-family:'Courier New',monospace; font-size:12px; color:#3D5FCC; font-weight:600; }
  .fml-note { font-size:10px; color:#8B9AC2; }

  /* neighbor list */
  .nb-list { display:flex; flex-direction:column; gap:5px; margin-bottom:4px; }

  .nb-row {
    display:grid;
    grid-template-columns: 22px 62px 70px 70px 1fr 36px;
    align-items:center; gap:4px;
    font-size:11px;
  }
  .nb-row.compact {
    grid-template-columns: 22px 62px 70px auto;
  }

  .nb-rank  { color:#9CA3AF; font-weight:700; font-size:10px; }
  .nb-chip  { font-size:10px; font-weight:700; padding:1px 5px; border-radius:3px; text-align:center; }
  .nb-d     { font-family:monospace; color:#6B7280; font-size:10.5px; }
  .nb-eq    { font-family:monospace; color:#374151; font-size:10.5px; }
  .nb-vote  { color:#9CA3AF; font-size:10px; }

  .nb-bar-wrap { height:8px; background:#EEF2FF; border-radius:4px; overflow:hidden; }
  .nb-bar      { height:100%; border-radius:4px; transition:width 0.35s ease; }
  .nb-pct      { color:#6B7280; font-size:10px; text-align:right; }

  /* divider + section label */
  .divider     { height:1px; background:#E5E9F5; margin:10px 0 6px; }
  .section-label { font-size:10px; font-weight:700; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.6px; margin:0 0 6px; }

  /* class totals */
  .class-list { display:flex; flex-direction:column; gap:5px; margin-bottom:10px; }
  .ct-row {
    display:grid;
    grid-template-columns: 58px 38px 1fr 38px;
    align-items:center; gap:6px;
  }
  /* probabilistic: no fraction column */
  .ct-row:not(:has(.ct-fraction)) {
    grid-template-columns: 58px 1fr 38px;
  }
  .ct-name     { font-size:12px; font-weight:700; }
  .ct-fraction { font-size:10px; color:#6B7280; font-family:monospace; }
  .ct-track    { height:12px; background:#EEF2FF; border-radius:5px; overflow:hidden; }
  .ct-fill     { height:100%; border-radius:5px; transition:width 0.4s ease; }
  .ct-val      { font-size:12px; font-weight:700; text-align:right; }

  /* prediction strip */
  .pred-strip {
    font-size:13px; font-weight:600;
    padding:7px 11px;
    border-left:3px solid;
    background:#F9FAFB; border-radius:0 6px 6px 0;
  }
  .pred-note { color:#9CA3AF; font-weight:400; font-size:11px; margin-left:4px; }
</style>
