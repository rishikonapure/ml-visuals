<script>
  import { onMount } from 'svelte';
  import { boundaryGrid, showBoundary } from '../../stores/knnStore.js';

  export let width = 540;
  export let height = 480;
  export let padding = 40;

  // Light-theme class colors as RGB
  const CLASS_RGB = {
    A: [78, 121, 255],
    B: [255, 78, 106],
    C: [46, 204, 143],
    D: [255, 159, 28]
  };

  let canvas;
  let ctx;

  function draw(grid) {
    if (!canvas || !grid || grid.length === 0) return;
    if (!ctx) ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    if (!$showBoundary) return;

    const resolution = Math.round(Math.sqrt(grid.length)) - 1;
    if (resolution < 1) return;
    const cellW = (width - padding * 2) / resolution;
    const cellH = (height - padding * 2) / resolution;

    for (const pt of grid) {
      const col = CLASS_RGB[pt.label] ?? [150, 150, 150];
      ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]}, 0.22)`;
      const px = padding + pt.x * (width - padding * 2) - cellW / 2;
      const py = padding + (1 - pt.y) * (height - padding * 2) - cellH / 2;
      ctx.fillRect(px, py, cellW + 1.5, cellH + 1.5);
    }
  }

  onMount(() => { ctx = canvas?.getContext('2d'); });
  $: draw($boundaryGrid);
  $: if (!$showBoundary && ctx) ctx.clearRect(0, 0, width, height);
</script>

<canvas
  bind:this={canvas}
  {width}
  {height}
  style="position:absolute; top:0; left:0; border-radius:16px; pointer-events:none;"
/>
