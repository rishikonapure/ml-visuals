<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import {
    knnResult, evenKResult, weightedResult,
    queryPoint, trainingData,
    showBoundary, boundaryGrid, boundaryLoading,
    sandboxMode, addTrainingPoint
  } from '../../stores/knnStore.js';

  export let currentStep = 0;
  export let width  = 560;
  export let height = 500;
  export let activeLabel = 'A';
  // 'default' | 'evenK' | 'weighted'
  export let vizMode = 'default';

  const PAD = 40;
  const C   = { A:'#4E79FF', B:'#FF4E6A', C:'#2ECC8F', D:'#FF9F1C' };
  const RGB = { A:[78,121,255], B:[255,78,106], C:[46,204,143], D:[255,159,28] };

  let svgEl, boundaryCanvas, bCtx, isDragging = false;

  // ── Scales ───────────────────────────────────────────────────────────────
  $: xS = d3.scaleLinear().domain([0,1]).range([PAD, width-PAD]);
  $: yS = d3.scaleLinear().domain([0,1]).range([height-PAD, PAD]);

  // ── Active result based on vizMode ────────────────────────────────────────
  $: activeResult =
    vizMode === 'evenK'    ? $evenKResult   :
    vizMode === 'weighted' ? $weightedResult :
    $knnResult;

  // ── Display flags ─────────────────────────────────────────────────────────
  $: isSandbox   = $sandboxMode;
  $: showQuery   = currentStep >= 3  || isSandbox;
  $: showLines   = currentStep >= 4  || isSandbox;
  // Step 4: show ALL distances (fan-out); Step 5+: only K-nearest
  $: showAllDist = (currentStep === 4) && !isSandbox;
  $: showRing    = currentStep >= 5  || isSandbox;
  $: showLabels  = currentStep >= 5  || isSandbox;
  $: showPred    = currentStep >= 6  || isSandbox;

  $: neighborSet = (showLabels && activeResult)
    ? new Set(activeResult.neighbors.map(n => n.index))
    : new Set();

  $: ringR = (() => {
    if (!showRing || !activeResult?.neighbors?.length) return 0;
    const d = activeResult.neighbors[activeResult.neighbors.length - 1].distance;
    return (xS(d) - xS(0)) * 1.1;
  })();

  // Max distance for weighted line normalization
  $: maxDist = activeResult?.neighbors?.length
    ? activeResult.neighbors[activeResult.neighbors.length - 1].distance
    : 1;

  // ── Boundary canvas ───────────────────────────────────────────────────────
  function drawBoundary(grid) {
    if (!boundaryCanvas) return;
    if (!bCtx) bCtx = boundaryCanvas.getContext('2d');
    bCtx.clearRect(0, 0, width, height);
    if (!$showBoundary || !grid?.length) return;
    const res = Math.round(Math.sqrt(grid.length)) - 1;
    if (res < 1) return;
    const cw = (width  - PAD*2) / res;
    const ch = (height - PAD*2) / res;
    for (const pt of grid) {
      const col = RGB[pt.label] ?? [150,150,150];
      bCtx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},0.2)`;
      bCtx.fillRect(
        PAD + pt.x * (width-PAD*2) - cw/2,
        PAD + (1-pt.y) * (height-PAD*2) - ch/2,
        cw+1.5, ch+1.5
      );
    }
  }
  $: drawBoundary($boundaryGrid);
  $: if (bCtx && !$showBoundary) bCtx.clearRect(0,0,width,height);
  onMount(() => { bCtx = boundaryCanvas?.getContext('2d'); });

  // ── Interaction ───────────────────────────────────────────────────────────
  function norm(cx, cy) {
    const r = svgEl.getBoundingClientRect();
    return {
      x: Math.max(0.02, Math.min(0.98, xS.invert(cx - r.left))),
      y: Math.max(0.02, Math.min(0.98, yS.invert(cy - r.top)))
    };
  }
  function nearQ(cx, cy) {
    if (!showQuery) return false;
    const r  = svgEl.getBoundingClientRect();
    const dx = cx - (r.left + xS($queryPoint.x));
    const dy = cy - (r.top  + yS($queryPoint.y));
    return Math.sqrt(dx*dx + dy*dy) < 22;
  }
  function onDown(e)    { if (nearQ(e.clientX,e.clientY)) { isDragging=true; e.preventDefault(); } }
  function onMove(e)    { if (isDragging) queryPoint.set(norm(e.clientX,e.clientY)); }
  function onUp(e)      { if (isDragging) { isDragging=false; return; } if (!$sandboxMode) return; queryPoint.set(norm(e.clientX, e.clientY)); /* next click adds point */ const n=norm(e.clientX,e.clientY); addTrainingPoint(n.x,n.y,activeLabel); }
  function onTStart(e)  { const t=e.touches[0]; if (nearQ(t.clientX,t.clientY)) { isDragging=true; e.preventDefault(); } }
  function onTMove(e)   { if (!isDragging) return; const t=e.touches[0]; queryPoint.set(norm(t.clientX,t.clientY)); e.preventDefault(); }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  class="wrap" class:drag={isDragging} class:sb={$sandboxMode}
  style="width:{width}px;height:{height}px"
  on:mousedown={onDown} on:mousemove={onMove} on:mouseup={onUp}
  on:mouseleave={()=>isDragging=false}
  on:touchstart={onTStart} on:touchmove={onTMove} on:touchend={()=>isDragging=false}
  role="img" aria-label="KNN visualization"
>
  <!-- Layer 1: decision boundary canvas -->
  <canvas bind:this={boundaryCanvas} {width} {height} class="bl" />

  <!-- Layer 1.5: boundary loading overlay -->
  {#if $boundaryLoading}
    <div class="bd-loading" style="width:{width}px;height:{height}px">
      <span class="bd-spinner"></span>
      <span class="bd-text">Computing boundary…</span>
    </div>
  {/if}

  <!-- Layer 2: SVG -->
  <svg bind:this={svgEl} {width} {height} class="sv">

    <!-- bg: transparent so the boundary canvas (z-index:1) shows through -->
    <rect {width} {height} fill="transparent" />

    <!-- grid -->
    {#each d3.range(0,1.01,0.2) as v}
      <line x1={xS(v)} y1={PAD} x2={xS(v)} y2={height-PAD} stroke="#E8EBF5" stroke-width="1"/>
      <line x1={PAD} y1={yS(v)} x2={width-PAD} y2={yS(v)} stroke="#E8EBF5" stroke-width="1"/>
    {/each}

    <!-- axis labels -->
    <text x={width/2} y={height-6} text-anchor="middle" fill="#C4C8D8" font-size="10" font-family="Inter,sans-serif">Feature 1</text>
    <text x="10" y={height/2} text-anchor="middle" fill="#C4C8D8" font-size="10" font-family="Inter,sans-serif" transform="rotate(-90,10,{height/2})">Feature 2</text>

    <!-- distance lines -->
    {#if showLines && activeResult}
      {#if showAllDist}
        <!-- Step 4: ALL distances fanning out from query point -->
        {#each activeResult.allDistances as n, i}
          {@const opacity = Math.max(0.12, 0.55 - n.distance * 0.6)}
          <line
            x1={xS($queryPoint.x)} y1={yS($queryPoint.y)}
            x2={xS(n.x)} y2={yS(n.y)}
            stroke="#8A95AD"
            stroke-width="1"
            stroke-dasharray="5 4"
            opacity={opacity}
            style="pointer-events:none"
          />
        {/each}
      {:else}
        <!-- Step 5+: Only K-nearest lines (colored, weighted thickness) -->
        {#each (showLabels ? activeResult.neighbors : activeResult.allDistances.slice(0,16)) as n, i}
          {@const isN = neighborSet.has(n.index)}
          {@const weight = vizMode==='weighted' && isN
            ? Math.max(0.2, 1 - (n.distance / (maxDist * 1.2)))
            : null}
          <line
            x1={xS($queryPoint.x)} y1={yS($queryPoint.y)}
            x2={xS(n.x)} y2={yS(n.y)}
            stroke={isN ? C[n.label] : '#C8CDD8'}
            stroke-width={
              vizMode==='weighted' && isN
                ? 1.5 + weight * 5
                : isN ? 2.5 : 1
            }
            stroke-dasharray={isN ? '0' : '5 4'}
            opacity={isN ? (vizMode==='weighted' ? 0.4 + weight * 0.6 : 0.9) : 0.4}
            style="transition:stroke 0.3s,opacity 0.3s; pointer-events:none"
          />
        {/each}
      {/if}
    {/if}

    <!-- K ring -->
    {#if showRing && ringR > 0}
      <circle cx={xS($queryPoint.x)} cy={yS($queryPoint.y)} r={ringR}
        fill="none" stroke="#F5A623" stroke-width="2" stroke-dasharray="8 4"
        opacity="0.75" style="pointer-events:none">
        <animateTransform attributeName="transform" type="rotate"
          from="0 {xS($queryPoint.x)} {yS($queryPoint.y)}"
          to="360 {xS($queryPoint.x)} {yS($queryPoint.y)}"
          dur="16s" repeatCount="indefinite"/>
      </circle>
    {/if}

    <!-- Weighted mode: concentric weight rings -->
    {#if vizMode === 'weighted' && showLabels && activeResult}
      {#each activeResult.neighbors as n, i}
        {@const w = 1 - (n.distance / (maxDist * 1.2))}
        <circle cx={xS(n.x)} cy={yS(n.y)} r={8 + w*10}
          fill={C[n.label] + '18'} stroke={C[n.label]} stroke-width="1.5"
          stroke-dasharray="3 2" opacity="0.6" style="pointer-events:none"/>
      {/each}
    {/if}

    <!-- Training points -->
    {#each $trainingData as pt, i}
      {@const isN = neighborSet.has(i)}
      {@const dimmed = showLabels && !isN}
      <circle cx={xS(pt.x)} cy={yS(pt.y)}
        r={isN ? 10 : 7}
        fill={C[pt.label] ?? '#888'} stroke="white"
        stroke-width={isN ? 2.5 : 1.5}
        opacity={dimmed ? 0.2 : 0.9}
        style="transition:all 0.3s ease; cursor:default"
      ><title>Class {pt.label}</title></circle>
    {/each}

    <!-- Rank badges -->
    {#if showLabels && activeResult}
      {#each activeResult.neighbors as n, i}
        <text x={xS(n.x)} y={yS(n.y)-14}
          text-anchor="middle" font-size="10" font-weight="700"
          fill={C[n.label]} font-family="Inter,sans-serif"
          style="pointer-events:none">#{i+1}</text>
      {/each}
    {/if}

    <!-- Query point -->
    {#if showQuery}
      {@const pred = showPred && activeResult ? activeResult.prediction : null}
      {@const isTie = vizMode==='evenK' && activeResult?.isTie}
      <!-- aura -->
      <circle cx={xS($queryPoint.x)} cy={yS($queryPoint.y)} r="24"
        fill={pred ? (C[pred]+'15') : '#0000000a'}
        style="transition:fill 0.5s; pointer-events:none"/>
      <!-- main -->
      <circle cx={xS($queryPoint.x)} cy={yS($queryPoint.y)} r="14"
        fill={isTie ? '#9CA3AF' : (pred ? C[pred] : '#2D3047')}
        stroke="white" stroke-width="3"
        style="transition:fill 0.5s; cursor:grab; filter:drop-shadow(0 2px 8px rgba(0,0,0,0.15))"/>
      <!-- label -->
      <text x={xS($queryPoint.x)} y={yS($queryPoint.y)+5}
        text-anchor="middle" font-size="13" font-weight="800"
        fill="white" font-family="Inter,sans-serif"
        style="pointer-events:none;user-select:none"
      >{isTie ? '=' : (pred ?? '?')}</text>
      <!-- sandbox hint -->
      {#if $sandboxMode && !isDragging}
        <text x={xS($queryPoint.x)} y={yS($queryPoint.y)-32}
          text-anchor="middle" font-size="10" fill="#9CA3AF"
          font-family="Inter,sans-serif" style="pointer-events:none">drag me</text>
      {/if}
    {/if}

  </svg>
</div>

<style>
  .wrap {
    position: relative;
    border-radius: 16px;
    border: 1.5px solid #E2E6F0;
    box-shadow: 0 2px 20px rgba(0,0,0,0.07);
    overflow: hidden;
    user-select: none;
    background: #FAFBFF;
    flex-shrink: 0;
  }
  .bl, .sv {
    position: absolute;
    top: 0; left: 0;
    display: block;
  }
  .bl { z-index: 1; }
  .sv { z-index: 2; background: transparent; }
  .wrap.sb   { cursor: crosshair; }
  .wrap.drag { cursor: grabbing !important; }

  /* Boundary loading overlay */
  .bd-loading {
    position: absolute; top: 0; left: 0;
    z-index: 3;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: rgba(250,251,255,0.70);
    pointer-events: none;
  }
  .bd-spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2.5px solid #E5E7EB;
    border-top-color: #4E79FF;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .bd-text {
    font-family: 'Inter', sans-serif;
    font-size: 12px; color: #6B7280; font-style: italic;
  }
</style>
