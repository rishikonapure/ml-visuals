<script>
  import { knnResult, evenKResult, weightedResult, k } from '../../stores/knnStore.js';

  // 'default' | 'evenK' | 'weighted' | 'probabilistic'
  export let mode = 'default';

  const C  = { A:'#4E79FF', B:'#FF4E6A', C:'#2ECC8F', D:'#FF9F1C' };
  const BG = { A:'#EEF2FF', B:'#FFF0F2', C:'#EDFAF4', D:'#FFF6EC' };

  // Pick the active result based on mode
  $: result =
    mode === 'evenK'        ? $evenKResult    :
    mode === 'weighted'     ? $weightedResult :
    mode === 'probabilistic'? $knnResult      :
    $knnResult;

  $: isTie    = mode === 'evenK' && result?.isTie;
  $: winner   = result?.prediction ?? null;
  $: displayK = mode === 'evenK' && $k % 2 !== 0 ? $k + 1 : $k;

  // Build display rows
  $: rows = (() => {
    if (!result) return [];
    if (mode === 'weighted') {
      // weights are already normalized fractions
      return Object.entries(result.weights ?? {})
        .map(([label, frac]) => ({ label, value: frac, display: `${(frac * 100).toFixed(0)}%` }))
        .sort((a, b) => b.value - a.value);
    }
    if (mode === 'probabilistic') {
      const total = Object.values(result.votes ?? {}).reduce((s,v)=>s+v, 0);
      return Object.entries(result.votes ?? {})
        .map(([label, count]) => ({ label, value: count/total, display: `${(count/total*100).toFixed(0)}%` }))
        .sort((a, b) => b.value - a.value);
    }
    if (mode === 'evenK') {
      const total = Object.values(result.votes ?? {}).reduce((s,v)=>s+v, 0);
      return Object.entries(result.votes ?? {})
        .map(([label, count]) => ({ label, value: count/total, display: `${count}/${total}` }))
        .sort((a, b) => b.value - a.value);
    }
    // default
    const total = Object.values(result.votes ?? {}).reduce((s,v)=>s+v, 0);
    return Object.entries(result.votes ?? {})
      .map(([label, count]) => ({ label, value: count/total, display: `${count}/${total}` }))
      .sort((a, b) => b.value - a.value);
  })();

  $: modeLabel =
    mode === 'weighted'      ? 'Weighted Vote'      :
    mode === 'probabilistic' ? 'Class Probability'  :
    mode === 'evenK'         ? 'Even-K Vote'        :
    'Majority Vote';

  $: kPillColor =
    mode === 'weighted'      ? '#7C3AED' :
    mode === 'probabilistic' ? '#0891B2' :
    mode === 'evenK'         ? '#DC2626' :
    '#C07C00';

  $: kPillBg =
    mode === 'weighted'      ? '#F5F3FF' :
    mode === 'probabilistic' ? '#E0F2FE' :
    mode === 'evenK'         ? '#FEF2F2' :
    '#FFF7ED';
</script>

{#if winner || isTie}
  <div class="card">
    <div class="header">
      <span class="mode-label">{modeLabel}</span>
      <span class="k-tag" style="color:{kPillColor}; background:{kPillBg}">
        K = {displayK}
      </span>
    </div>

    <div class="bars">
      {#each rows as row}
        <div class="bar-row">
          <span class="dot" style="background:{C[row.label] ?? '#888'}" />
          <span class="lbl">Class {row.label}</span>
          <div class="track">
            <div class="fill" style="width:{row.value*100}%; background:{C[row.label] ?? '#888'}" />
          </div>
          <span class="num">{row.display}</span>
        </div>
      {/each}
    </div>

    <!-- Verdict -->
    {#if isTie}
      <div class="verdict tie">
        <span class="v-label">Result</span>
        <span class="tie-badge">TIE — ambiguous!</span>
      </div>
    {:else if winner}
      <div class="verdict" style="background:{BG[winner] ?? '#F9FAFB'}; border-color:{C[winner] ?? '#888'}25">
        <span class="v-label">
          {mode === 'probabilistic' ? 'Most likely' : mode === 'weighted' ? 'Highest weight' : 'Predicted'}
        </span>
        <span class="v-winner" style="color:{C[winner] ?? '#111'}">Class {winner}</span>
      </div>
    {/if}

    <!-- Mode-specific note -->
    {#if mode === 'weighted'}
      <p class="note">Thicker lines = closer = more influence</p>
    {:else if mode === 'probabilistic'}
      <p class="note">Percentage = fraction of K votes</p>
    {:else if mode === 'evenK'}
      <p class="note">Even K can create ties — always prefer odd K!</p>
    {/if}
  </div>
{/if}

<style>
  .card {
    background: #fff;
    border: 1.5px solid #E5E7EB;
    border-radius: 14px;
    padding: 18px 20px;
    display: flex; flex-direction: column; gap: 12px;
    min-width: 230px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    animation: pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes pop {
    from { opacity:0; transform:scale(0.88) translateY(6px); }
    to   { opacity:1; transform:scale(1) translateY(0); }
  }
  .header { display:flex; justify-content:space-between; align-items:center; }
  .mode-label {
    font-family:'Inter',sans-serif; font-size:11px; font-weight:700;
    color:#9CA3AF; text-transform:uppercase; letter-spacing:0.08em;
  }
  .k-tag {
    font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700;
    padding: 2px 9px; border-radius: 20px;
  }
  .bars { display:flex; flex-direction:column; gap:8px; }
  .bar-row { display:flex; align-items:center; gap:8px; }
  .dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .lbl { font-size:12px; color:#6B7280; width:52px; flex-shrink:0; font-family:'Inter',sans-serif; }
  .track { flex:1; height:7px; background:#F3F4F6; border-radius:4px; overflow:hidden; }
  .fill  { height:100%; border-radius:4px; transition:width 0.5s cubic-bezier(0.4,0,0.2,1); }
  .num   { font-family:'JetBrains Mono',monospace; font-size:11px; color:#9CA3AF; width:38px; text-align:right; flex-shrink:0; }
  .verdict {
    display:flex; justify-content:space-between; align-items:center;
    padding:10px 14px; border-radius:10px; border:1.5px solid;
  }
  .verdict.tie { background:#FEF2F2; border-color:#FECACA; }
  .v-label  { font-size:12px; color:#9CA3AF; font-family:'Inter',sans-serif; }
  .v-winner { font-size:20px; font-weight:800; font-family:'Inter',sans-serif; }
  .tie-badge {
    font-size:14px; font-weight:700; color:#DC2626;
    font-family:'Inter',sans-serif;
  }
  .note {
    font-size:11px; color:#9CA3AF; font-style:italic;
    font-family:'Inter',sans-serif; line-height:1.5;
    padding-top:6px; border-top:1px solid #F0F2F7;
    margin-top:2px;
  }
</style>
