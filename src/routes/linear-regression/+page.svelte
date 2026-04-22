<script>
  import { onDestroy } from 'svelte';
  import Scrolly from '$lib/components/layout/Scrolly.svelte';
  import Navbar  from '$lib/components/layout/Navbar.svelte';

  /* ── SVG DIMENSIONS ─────────────────────────────────────────────────── */
  const W = 500, H = 380;
  const PAD = { t: 28, r: 24, b: 52, l: 62 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;
  const X0 = 700,  X1 = 3300;
  const Y0 = 80,   Y1 = 760;

  const xs = v  => PAD.l + (v  - X0) / (X1 - X0) * iW;
  const ys = v  => PAD.t + (1  - (v  - Y0) / (Y1 - Y0)) * iH;
  const xi = px => X0    + (px - PAD.l) / iW * (X1 - X0);
  const yi = py => Y0    + (1  - (py - PAD.t) / iH) * (Y1 - Y0);

  const xTicks = [800, 1200, 1600, 2000, 2400, 2800, 3200];
  const yTicks = [100, 200, 300, 400, 500, 600, 700];

  /* ── DATASETS ───────────────────────────────────────────────────────── */
  const DATASETS = {
    clean: [
      {x:900,y:205},{x:1050,y:228},{x:1100,y:242},{x:1200,y:264},
      {x:1300,y:278},{x:1400,y:298},{x:1500,y:322},{x:1600,y:332},
      {x:1700,y:356},{x:1800,y:374},{x:1900,y:391},{x:2000,y:411},
      {x:2100,y:429},{x:2200,y:447},{x:2400,y:481},{x:2500,y:502},
      {x:2600,y:521},{x:2700,y:540},{x:2900,y:576},{x:3100,y:608}
    ],
    noisy: [
      {x:900,y:178},{x:1050,y:262},{x:1100,y:214},{x:1200,y:295},
      {x:1300,y:244},{x:1400,y:345},{x:1500,y:283},{x:1600,y:375},
      {x:1700,y:314},{x:1800,y:418},{x:1900,y:342},{x:2000,y:442},
      {x:2100,y:393},{x:2200,y:498},{x:2400,y:432},{x:2500,y:554},
      {x:2600,y:472},{x:2700,y:588},{x:2900,y:514},{x:3100,y:648}
    ],
    outliers: [
      {x:900,y:205},{x:1050,y:228},{x:1100,y:242},{x:1200,y:268},
      {x:1300,y:278},{x:1400,y:298},{x:1500,y:322},{x:1600,y:332},
      {x:1700,y:356},{x:1800,y:374},{x:1900,y:391},{x:2000,y:411},
      {x:2100,y:429},{x:2200,y:447},{x:2400,y:481},
      {x:1100,y:680},{x:2800,y:165},{x:2000,y:720}
    ]
  };

  /* ── ALGORITHM FUNCTIONS ────────────────────────────────────────────── */
  function ols(pts) {
    const n = pts.length;
    if (n < 2) return { m: 0.17, b: 128 };
    const xm = pts.reduce((s,p) => s+p.x, 0) / n;
    const ym = pts.reduce((s,p) => s+p.y, 0) / n;
    const num = pts.reduce((s,p) => s+(p.x-xm)*(p.y-ym), 0);
    const den = pts.reduce((s,p) => s+(p.x-xm)**2, 0);
    if (Math.abs(den) < 1e-10) return { m:0, b:ym };
    const m = num / den;
    return { m, b: ym - m*xm };
  }
  function mse(pts, m, b) {
    if (!pts.length) return 0;
    return pts.reduce((s,p) => s+(p.y-(m*p.x+b))**2, 0) / pts.length;
  }
  function buildGDPath(target, steps=80) {
    const s0 = { m:0.02, b:560 };
    const hist = [];
    for (let i=0; i<=steps; i++) {
      const t = i/steps;
      const e = t<0.5 ? 2*t*t : -1+(4-2*t)*t;
      hist.push({ m: s0.m+e*(target.m-s0.m), b: s0.b+e*(target.b-s0.b) });
    }
    return hist;
  }
  function lineCoords(m, b) {
    return { x1:xs(X0), y1:ys(m*X0+b), x2:xs(X1), y2:ys(m*X1+b) };
  }

  /* ── PRE-COMPUTED STORY VALUES ──────────────────────────────────────── */
  const storyPts  = [...DATASETS.clean];
  const storyOls  = ols(storyPts);
  const BAD       = { m:0.05, b:220 };
  const QX        = 2000;
  const qy        = storyOls.m * QX + storyOls.b;
  const olsMse    = mse(storyPts, storyOls.m, storyOls.b);
  const badMse    = mse(storyPts, BAD.m, BAD.b);
  const gdStart   = { m:0.02, b:560 };
  const xMean     = storyPts.reduce((s,p)=>s+p.x,0)/storyPts.length;
  const yMean     = storyPts.reduce((s,p)=>s+p.y,0)/storyPts.length;
  const olsNum    = storyPts.reduce((s,p)=>s+(p.x-xMean)*(p.y-yMean),0);
  const olsDen    = storyPts.reduce((s,p)=>s+(p.x-xMean)**2,0);

  /* ── STORY STATE ────────────────────────────────────────────────────── */
  let activeStep = 1;
  function onStep(e) { activeStep = e.detail.index; }

  $: currentChapter = chapters.find(c=>c.step===activeStep) ?? chapters[0];
  $: currentShow    = currentChapter.show;

  /* ── GD ANIMATION (step 13) ─────────────────────────────────────────── */
  let gdHist  = [];
  let gdFrame = 0;
  let gdLine  = { ...gdStart };
  let gdTimer = null;
  let gdDone  = false;
  $: gdMse    = mse(storyPts, gdLine.m, gdLine.b);

  $: if (activeStep === 13 && !gdDone) triggerGD();

  function triggerGD() {
    if (gdTimer) clearInterval(gdTimer);
    gdHist  = buildGDPath(storyOls);
    gdFrame = 0;
    gdLine  = { ...gdHist[0] };
    gdTimer = setInterval(()=>{
      gdFrame++;
      if (gdFrame >= gdHist.length) {
        clearInterval(gdTimer); gdDone = true;
        gdLine = { ...gdHist[gdHist.length-1] }; return;
      }
      gdLine = { ...gdHist[gdFrame] };
    }, 45);
  }
  function replayGD() { gdDone = false; triggerGD(); }

  /* ── DRAGGABLE LINE (step 12) ───────────────────────────────────────── */
  const DX_L = 900;
  const DX_R = 3100;

  let dragM = storyOls.m;
  let dragB = storyOls.b;
  $: dragMse = mse(storyPts, dragM, dragB);

  let hLy = 0;
  let hRy = 0;
  let dragging = null;
  let storySvgEl;
  let dragInitialized = false;

  $: if (activeStep === 12 && !dragInitialized) initDrag();

  function initDrag() {
    dragM = storyOls.m; dragB = storyOls.b;
    hLy   = ys(storyOls.m * DX_L + storyOls.b);
    hRy   = ys(storyOls.m * DX_R + storyOls.b);
    dragInitialized = true;
  }
  function onHandleDown(which) { dragging = which; }
  function updateDragFromY(svgRawY) {
    const svgY   = svgRawY * (H / storySvgEl.getBoundingClientRect().height);
    const clamped = Math.max(PAD.t+2, Math.min(H-PAD.b-2, svgY));
    if (dragging === 'L') hLy = clamped;
    else                  hRy = clamped;
    dragM = (yi(hRy) - yi(hLy)) / (DX_R - DX_L);
    dragB = yi(hLy) - dragM * DX_L;
  }
  function onSvgMove(e) {
    if (!dragging || !storySvgEl) return;
    updateDragFromY(e.clientY - storySvgEl.getBoundingClientRect().top);
  }
  function onSvgTouchMove(e) {
    if (!dragging || !storySvgEl || !e.touches[0]) return;
    updateDragFromY(e.touches[0].clientY - storySvgEl.getBoundingClientRect().top);
  }
  function stopDrag() { dragging = null; }

  /* ── CHAPTERS (14 steps) ─────────────────────────────────────────────── */
  const chapters = [
    {
      step:1, part:'Part 1 · The Setup', tag:'First Principles', show:'axes',
      title:'A spreadsheet and a question',
      body:`
        <p>Imagine you work at a real estate firm. On your desk sits a spreadsheet of
        <strong>20 houses that sold last month</strong>. Each row contains two numbers
        — floor area in sqft and final sale price in thousands of dollars.</p>
        <p>Your manager walks in: <em>"New listing just came in. 2,000 sqft.
        What do we price it at?"</em> You've never seen this house before. But you
        have those 20 past sales — and somewhere in that data is the answer.
        The axes on the left are ready, waiting for the story to begin.</p>
        <p>This is the central challenge of supervised learning:
        <strong>use patterns from the past to make predictions about the future</strong>.
        Linear Regression is the most elegant, foundational solution to this problem
        — and it begins with a blank chart and an honest question.</p>
      `
    },
    {
      step:2, part:null, tag:'The Data', show:'dots',
      title:'Every house becomes a dot',
      body:`
        <p>Each of those 20 house sales becomes a single dot on the chart.
        The dot's <strong>horizontal position</strong> encodes the house's size (sqft),
        and its <strong>vertical position</strong> encodes the sale price ($k).
        One row of your spreadsheet — one point in space.</p>
        <p>This is a <strong>scatter plot</strong>, and it's the single most important
        thing you can do before building any model. Before equations. Before algorithms.
        Before anything else: <em>look at your data</em>.</p>
        <p>Notice that the dots aren't random. They form a rough diagonal band rising
        from bottom-left to top-right. That's a <strong>signal</strong> — bigger houses
        tend to cost more. Not perfectly, not always, but consistently enough that
        a pattern is clearly visible. That pattern is what we're about to capture.</p>
      `
    },
    {
      step:3, part:null, tag:'The Signal', show:'dots_trend',
      title:"There's a relationship hiding here",
      body:`
        <p>Stare at those dots for a moment. Your brain is already doing something
        remarkable — it's detecting a trend. Even without any calculation, you could
        draw a rough line through the middle of that cloud and it would
        <em>feel right</em>. The dashed guide on the left confirms what you're sensing.</p>
        <p>What your brain does intuitively, linear regression does mathematically.
        It asks: <em>"Of all possible straight lines, which one passes as close as
        possible to every dot simultaneously?"</em> That line is the model.
        Finding it is the entire problem.</p>
        <p>The scatter around the trend is <strong>noise</strong> — variation caused
        by factors we're not measuring: location, views, renovations, negotiation.
        The model's job is to capture the <strong>signal</strong> while accepting
        that the noise can never be fully explained away. Every real-world model
        lives with this tradeoff.</p>
      `
    },
    {
      step:4, part:'Part 2 · The Line', tag:'The Model', show:'line',
      title:'One equation to describe them all',
      body:`
        <p>Here it is — the linear regression model. A single straight line
        threading through the cloud of dots. And this entire model,
        including <em>every prediction it will ever make</em>, is described
        by just one equation:</p>
        <div class="formula">ŷ = mx + b</div>
        <p>Where <strong>ŷ</strong> ("y-hat") is the predicted price,
        <strong>x</strong> is the house size, <strong>m</strong> is the slope,
        and <strong>b</strong> is the intercept. Two numbers — m and b — and
        you have a machine that can price any house anywhere.</p>
        <p>This is a <strong>parametric model</strong>. Once training is complete,
        you don't need the original 20 data points anymore — you just need m and b.
        The entire learned knowledge is compressed into two numbers. Compare that to
        KNN, which stores every training point forever. Linear regression is
        dramatically more compact.</p>
      `
    },
    {
      step:5, part:null, tag:'The Slope', show:'slope',
      title:'What does m actually tell you?',
      body:`
        <p>The slope <strong>m</strong> is the heart of the model. It answers the
        most important question: <em>"For every 1 extra sqft of floor area,
        how much more expensive is the house?"</em></p>
        <p>Look at the triangle on the line. The green horizontal leg is
        a "run" of <strong>600 sqft</strong>. The red vertical leg is the resulting
        "rise" in price: exactly m × 600. Rise divided by run equals m.
        For this dataset, m ≈ <strong>${storyOls.m.toFixed(3)}</strong> — meaning
        each extra square foot adds roughly
        <strong>$${(storyOls.m*1000).toFixed(0)}</strong> to the predicted price.</p>
        <p>A steeper line means a stronger relationship. A flat line (m ≈ 0) means
        size barely predicts price at all. The sign matters too — a negative m
        would mean larger houses are somehow cheaper. Nonsensical here, but perfectly
        valid in other domains: longer battery cycles correlate with lower failure
        rates, more sleep correlates with fewer errors.</p>
      `
    },
    {
      step:6, part:null, tag:'The Intercept', show:'intercept',
      title:'What does b anchor?',
      body:`
        <p>The intercept <strong>b</strong> is where the regression line crosses
        the y-axis — the model's predicted price when house size is zero.
        For this dataset, b ≈ <strong>${storyOls.b.toFixed(1)}k</strong>.</p>
        <p>Yes, a house with zero square feet makes no physical sense. And that's
        okay. The intercept isn't meant to be taken literally. It's a
        <strong>mathematical anchor</strong> that positions the line vertically
        so it can pass correctly through the data. Think of it as the baseline
        price level that exists independently of size.</p>
        <p><strong>m</strong> controls the <em>tilt</em> of the line — steeper
        or flatter. <strong>b</strong> controls the <em>height</em> — higher or
        lower. Adjust m and the line rotates. Adjust b and the entire line shifts
        up or down without changing its angle. Every straight line in the universe
        corresponds to exactly one (m, b) pair.</p>
      `
    },
    {
      step:7, part:'Part 3 · Predictions', tag:'Generalisation', show:'prediction',
      title:"Pricing the house we've never seen",
      body:`
        <p>Time for the thing that makes this entire exercise worthwhile —
        <strong>actually making a prediction</strong>. A new house: 2,000 sqft.
        Not in our training data. We've never seen it. How do we price it?</p>
        <p>Simple: plug 2,000 into the equation. Follow the orange dotted lines
        on the chart — trace vertically up from x = 2,000 until you hit the
        regression line, then follow horizontally left to read the price.</p>
        <div class="formula">ŷ = ${storyOls.m.toFixed(3)} × 2000 + ${storyOls.b.toFixed(1)} ≈ <strong>$${qy.toFixed(0)}k</strong></div>
        <p>This is <strong>generalisation</strong> — the model extracted a pattern
        from 20 training examples and applies it to a question it's never encountered.
        The entire power of machine learning rests on this idea: if the pattern is
        real and consistent, it will hold for new data too.</p>
      `
    },
    {
      step:8, part:'Part 4 · Error', tag:'Residuals', show:'residuals',
      title:'Every prediction is imperfect',
      body:`
        <p>The line doesn't pass through every dot. It can't — the dots scatter,
        and no single line can be at all of them simultaneously. For each house,
        there's a gap between what the model predicted and what actually sold.
        These gaps are called <strong>residuals</strong>:</p>
        <div class="formula">eᵢ = yᵢ − ŷᵢ</div>
        <p>Every colored vertical line you see is a residual.
        <span style="color:#FF4E6A;font-weight:600">Red</span> means the actual
        price was <em>higher</em> than predicted — we underestimated.
        <span style="color:#2ECC8F;font-weight:600">Green</span> means the actual
        price was <em>lower</em> — we overestimated.</p>
        <p>Residuals are honest diagnostics. In a good model they look like random
        scatter — small on average, no systematic pattern. If you see large
        residuals consistently for big houses, your model has a structural flaw
        that no straight line can fix. The residuals are the model talking back to you.</p>
      `
    },
    {
      step:9, part:null, tag:'Squared Error', show:'squares',
      title:'Why we square the gaps',
      body:`
        <p>We need one number to measure how wrong the model is overall. Why not
        just add up all the residuals? The problem: positive and negative residuals
        <strong>cancel each other out</strong>. A model that's off by $100k in
        both directions would look perfect. That's dangerous.</p>
        <p>The fix: <strong>square each residual before summing</strong>.
        Look at the squares drawn on the chart — each square's side equals the
        absolute residual, so its <em>area equals residual²</em>.
        Two things happen when you square:</p>
        <p>First, all signs vanish — a residual of −80k becomes 6,400, same as
        +80k. Second, <strong>large errors are punished disproportionately</strong>
        — a residual of 80k contributes 6,400 to the total, while a 40k residual
        contributes only 1,600. The model cares four times more about the
        large-square houses. The best fit line minimises the total area of all squares.</p>
      `
    },
    {
      step:10, part:null, tag:'Loss Function', show:'mse',
      title:'MSE: one number to rule them all',
      body:`
        <p>Sum all the squared residuals, divide by n — and you have
        <strong>Mean Squared Error</strong>:</p>
        <div class="formula">MSE = (1/n) × Σ (yᵢ − ŷᵢ)²</div>
        <p>For the best-fit line on this dataset,
        MSE ≈ <strong>${olsMse.toFixed(1)}</strong>.
        This is the <strong>loss function</strong> — the single number that measures
        how wrong the model is. Lower = better. The algorithm's entire objective
        is to find the m and b that push MSE as low as possible.</p>
        <p>MSE has units of price² (k²), which is hard to interpret directly.
        Practitioners often report <strong>RMSE = √MSE</strong>, which brings the
        error back into dollars. Here, RMSE ≈
        <strong>$${Math.sqrt(olsMse).toFixed(1)}k</strong> — the average prediction
        is off by about ${Math.sqrt(olsMse).toFixed(0)}k per house. Not bad for a
        two-parameter model.</p>
      `
    },
    {
      step:11, part:'Part 5 · Best Fit', tag:'The Right Line', show:'compare',
      title:'Not all lines are equal',
      body:`
        <p>Let's put the best-fit line (blue) head-to-head with a competitor (orange).
        The orange line has a flatter slope — it captures the general upward trend,
        but not aggressively enough. At first glance, it looks reasonable.
        The residuals tell a completely different story.</p>
        <p>For small houses (900–1,200 sqft), the orange line is fairly close.
        But as house size grows it increasingly underestimates. By 3,000 sqft
        it's off by <em>hundreds of thousands of dollars</em>. Those residuals are
        enormous — and when squared, they dominate the total.</p>
        <p><strong>MSE (orange) ≈ ${badMse.toFixed(0)}</strong> vs
        <strong>MSE (blue) ≈ ${olsMse.toFixed(0)}</strong> — roughly
        <strong>${Math.round(badMse/olsMse)}× worse</strong>.
        The blue line is mathematically <em>guaranteed</em> to have the lowest
        possible MSE of any straight line on this dataset. That guarantee is
        what "best fit" actually means.</p>
      `
    },
    {
      step:12, part:null, tag:'Loss Landscape', show:'drag',
      title:'Drag the line — feel the MSE change',
      body:`
        <p>Every possible line — every combination of slope m and intercept b —
        produces a different MSE. Imagine a landscape where height at each (m, b)
        position represents error. Most of this terrain is rough and high.
        There is exactly <strong>one valley</strong>, and its floor is the best fit.</p>
        <p>The line on the left is now <strong>draggable</strong>. Grab either
        circular endpoint and tilt or shift it. The MSE badge updates live.
        Try to push MSE as low as you can by hand — you're now doing manually
        what the algorithm does automatically, thousands of times per second.</p>
        <p>Notice how sensitive MSE is to slope. A small tilt in the wrong
        direction rapidly amplifies errors for the large houses on the right.
        This "sharpness" of the valley is what makes gradient descent converge
        reliably — the landscape always guides the line toward the minimum.</p>
      `
    },
    {
      step:13, part:null, tag:'Gradient Descent', show:'gd_animate',
      title:'Rolling downhill, step by step',
      body:`
        <p>The orange line starts at a random position — poor slope, high intercept,
        enormous MSE. Gradient descent takes over. At each step it asks:
        <em>"Which direction would increase MSE the most right now?"</em>
        Then it steps in the <strong>exact opposite direction</strong> — downhill.</p>
        <div class="formula">m ← m − α · ∂MSE/∂m</div>
        <p>Watch the MSE counter fall with each frame. Early steps are large —
        there's a steep gradient pulling the line hard toward the data. As it
        approaches the optimum the gradient weakens, the steps shrink, and the
        line <em>converges</em>.</p>
        <p>That update rule — two subtractions per iteration — is the engine
        behind every modern neural network. GPT, image generators,
        protein-folding models — all trained by gradient descent on a loss
        function. You're watching the fundamental mechanism of all of machine
        learning in its simplest, clearest form.</p>
      `
    },
    {
      step:14, part:null, tag:'Closed Form', show:'final',
      title:'The exact answer, no guessing required',
      body:`
        <p>Gradient descent is powerful but iterative — it needs a starting point,
        a learning rate, and many steps. For simple linear regression there's
        something far better: an <strong>exact closed-form solution</strong> that
        hands you the perfect m and b in a single pass through the data.</p>
        <p>The derivation: take the derivative of MSE with respect to m and b,
        set both to zero (the valley floor is always flat — gradient = 0 at the
        minimum), and solve the two resulting equations simultaneously.
        The result is <strong>Ordinary Least Squares (OLS)</strong>:</p>
      `
    }
  ];

  /* ── HINTS (1-indexed) ──────────────────────────────────────────────── */
  const hints = [
    null,
    "The axes are ready — every dot we're about to add is a real house sale",
    "Hover over any dot · horizontal = size, vertical = price",
    "Can you see the diagonal trend? That's the signal we want to capture",
    "Two numbers — m and b — define every prediction this line will ever make",
    "Rise ÷ Run = slope m · steeper line = stronger size-price relationship",
    "The red dot marks where the line crosses the y-axis — the model's baseline",
    "Follow the dotted lines: up from x=2000 to the line, then left to the price",
    "Red = underestimate · Green = overestimate · Longer line = bigger error",
    "Each square's area = residual² · larger squares hurt MSE much more",
    "MSE = average squared error · this line achieves the lowest possible value",
    "Orange has large residuals for big houses — its MSE is far higher than blue's",
    "Drag either blue handle to tilt or shift the line · MSE updates live",
    "MSE falls with each step · click Replay to watch again",
    "No iteration needed — the formula gives the global minimum directly"
  ];

  /* ── REACTIVE LINE COORDS ───────────────────────────────────────────── */
  $: olsLc  = lineCoords(storyOls.m, storyOls.b);
  $: badLc  = lineCoords(BAD.m,      BAD.b);
  $: gdLc   = lineCoords(gdLine.m,   gdLine.b);
  $: dragLc = lineCoords(dragM,      dragB);

  /* ── SANDBOX ────────────────────────────────────────────────────────── */
  let sbDataset   = 'clean';
  let sbPts       = [...DATASETS.clean];
  let sbM         = 0.15;
  let sbB         = 200;
  let sbGdRunning = false;
  let sbGdTimer   = null;
  let sbSvgEl;

  $: sbOls = ols(sbPts);
  $: sbMse = mse(sbPts, sbM, sbB);
  $: sbLc  = lineCoords(sbM, sbB);

  function sbClick(e) {
    if (!sbSvgEl) return;
    const rect = sbSvgEl.getBoundingClientRect();
    const dx = xi((e.clientX-rect.left)*(W/rect.width));
    const dy = yi((e.clientY-rect.top)*(H/rect.height));
    if (dx>=X0 && dx<=X1 && dy>=Y0 && dy<=Y1)
      sbPts = [...sbPts, {x:dx, y:dy}];
  }
  function sbBestFit() { sbM = sbOls.m; sbB = sbOls.b; }
  function sbRunGD() {
    const hist = buildGDPath(sbOls);
    let idx = 0; sbGdRunning = true;
    if (sbGdTimer) clearInterval(sbGdTimer);
    sbM = hist[0].m; sbB = hist[0].b;
    sbGdTimer = setInterval(()=>{
      idx++;
      if (idx >= hist.length) {
        clearInterval(sbGdTimer); sbGdRunning = false;
        sbM = hist[hist.length-1].m; sbB = hist[hist.length-1].b; return;
      }
      sbM = hist[idx].m; sbB = hist[idx].b;
    }, 40);
  }
  function sbReset() {
    sbPts=[...DATASETS[sbDataset]]; sbM=0.15; sbB=200;
    sbGdRunning=false; if(sbGdTimer) clearInterval(sbGdTimer);
  }
  function sbSwitch(d) {
    sbDataset=d; sbPts=[...DATASETS[d]]; sbM=0.15; sbB=200;
    sbGdRunning=false; if(sbGdTimer) clearInterval(sbGdTimer);
  }

  onDestroy(() => {
    if (gdTimer)   clearInterval(gdTimer);
    if (sbGdTimer) clearInterval(sbGdTimer);
  });
</script>

<svelte:head>
  <title>Linear Regression — ML Visuals</title>
  <meta name="description" content="Learn Linear Regression from first principles — scatter plots, residuals, MSE, gradient descent and OLS explained through interactive visualisations." />
</svelte:head>

<Navbar activeAlgo="linear-regression" />

<!-- ══════════════════════ BANNER ═══════════════════════════════════════ -->
<section class="lr-banner">
  <div class="lr-banner-inner">
    <a href="/" class="banner-back">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      All topics
    </a>
    <div class="banner-crumb">
      <span class="banner-cat">Classical ML</span>
      <span class="banner-sep">·</span>
      <span class="banner-num">Module 02</span>
    </div>
    <h1 class="banner-title">Linear Regression</h1>
    <p class="banner-desc">
      From a blank scatter plot to gradient descent — a first-principles visual
      journey through the most foundational algorithm in machine learning.
    </p>
    <div class="banner-meta">
      <span class="bm-pill bm-green">● Live</span>
      <span class="bm-pill">Beginner</span>
      <span class="bm-pill">14 steps</span>
      <span class="bm-pill">~14 min</span>
      <span class="bm-pill">Regression</span>
    </div>
    <button class="banner-cta"
      on:click={() => document.querySelector('.story')?.scrollIntoView({ behavior:'smooth' })}>
      Start learning ↓
    </button>
  </div>
  <div class="bg-dots" aria-hidden="true">
    {#each Array(18) as _, i}
      <div class="bg-dot" style="
        left:{5+(i*13.7%90)}%;top:{10+(i*17.3%80)}%;
        background:{['#FF4E6A','#4E79FF','#2ECC8F','#FF9F1C'][i%4]};
        width:{5+(i%4)*2}px;height:{5+(i%4)*2}px;
        opacity:{0.07+(i%3)*0.04};animation-delay:{(i*0.3).toFixed(1)}s"/>
    {/each}
  </div>
</section>

<!-- ══════════════════════ SCROLLY STORY ════════════════════════════════ -->
<section class="story">
  <div class="story-wrap">

    <!-- ── LEFT: sticky visualization ──────────────────────────────── -->
    <div class="viz-col">
      <div class="sticky-panel">

        <div class="step-pill">
          <span class="sp-dot" style="background:#FF4E6A"></span>
          <span>{activeStep} / 14</span>
        </div>

        <div class="viz-card">
          <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
          <svg
            viewBox="0 0 {W} {H}" width={W} height={H} class="lr-svg"
            role="img"
            bind:this={storySvgEl}
            on:mousemove={onSvgMove}
            on:mouseup={stopDrag}
            on:mouseleave={stopDrag}
            on:touchmove|preventDefault={onSvgTouchMove}
            on:touchend={stopDrag}
          >
            <defs>
              <clipPath id="plot-area">
                <rect x={PAD.l} y={PAD.t} width={iW} height={iH}/>
              </clipPath>
            </defs>

            <!-- Grid -->
            {#each yTicks as y}
              <line x1={PAD.l} y1={ys(y)} x2={W-PAD.r} y2={ys(y)} stroke="#F3F4F6" stroke-width="1"/>
            {/each}
            {#each xTicks as x}
              <line x1={xs(x)} y1={PAD.t} x2={xs(x)} y2={H-PAD.b} stroke="#F3F4F6" stroke-width="1"/>
            {/each}

            <!-- Axes -->
            <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H-PAD.b} stroke="#D1D5DB" stroke-width="1.5"/>
            <line x1={PAD.l} y1={H-PAD.b} x2={W-PAD.r} y2={H-PAD.b} stroke="#D1D5DB" stroke-width="1.5"/>

            <!-- Tick labels -->
            {#each xTicks as x}
              <text x={xs(x)} y={H-PAD.b+16} text-anchor="middle" font-size="10" fill="#9CA3AF">
                {x>=1000?(x/1000).toFixed(1)+'k':x}
              </text>
            {/each}
            {#each yTicks as y}
              <text x={PAD.l-7} y={ys(y)+4} text-anchor="end" font-size="10" fill="#9CA3AF">{y}k</text>
            {/each}

            <!-- Axis labels -->
            <text x={W/2} y={H-3} text-anchor="middle" font-size="11" fill="#9CA3AF">Size (sqft)</text>
            <text x={11} y={H/2} text-anchor="middle" font-size="11" fill="#9CA3AF"
              transform="rotate(-90,11,{H/2})">Price ($k)</text>

            <!-- ── TREND GUIDE (step 3) ── -->
            {#if currentShow === 'dots_trend'}
              <line x1={xs(800)} y1={ys(155)} x2={xs(3200)} y2={ys(660)}
                stroke="#C4C8D8" stroke-width="1.5" stroke-dasharray="10,5"
                clip-path="url(#plot-area)"/>
              <text x={xs(3050)} y={ys(700)} font-size="10" fill="#9CA3AF"
                font-style="italic">trend →</text>
            {/if}

            <!-- ── BAD LINE + its residuals (step 11) ── -->
            {#if currentShow === 'compare'}
              {#each storyPts as p}
                {@const py = BAD.m*p.x+BAD.b}
                <line x1={xs(p.x)} y1={ys(p.y)} x2={xs(p.x)} y2={ys(py)}
                  stroke="#FF9F1C" stroke-width="1" opacity="0.35"
                  clip-path="url(#plot-area)"/>
              {/each}
              <line x1={badLc.x1} y1={badLc.y1} x2={badLc.x2} y2={badLc.y2}
                stroke="#FF9F1C" stroke-width="2.5" stroke-dasharray="6,3" opacity="0.85"/>
            {/if}

            <!-- ── RESIDUAL LINES (steps 8, 9) ── -->
            {#if currentShow === 'residuals' || currentShow === 'squares'}
              {#each storyPts as p}
                {@const py = storyOls.m*p.x+storyOls.b}
                {@const isAbove = p.y > py}
                <line x1={xs(p.x)} y1={ys(p.y)} x2={xs(p.x)} y2={ys(py)}
                  stroke={isAbove ? '#FF4E6A' : '#2ECC8F'}
                  stroke-width="1.8" opacity="0.75"
                  clip-path="url(#plot-area)"/>
              {/each}
            {/if}

            <!-- ── SQUARED ERROR SQUARES (step 9) ── -->
            {#if currentShow === 'squares'}
              <g clip-path="url(#plot-area)">
                {#each storyPts as p}
                  {@const py   = storyOls.m*p.x+storyOls.b}
                  {@const side = Math.abs(ys(p.y)-ys(py)) * 2.2}
                  {@const topY = Math.min(ys(p.y), ys(py))}
                  {@const isAbove = p.y > py}
                  <rect
                    x={xs(p.x)} y={topY}
                    width={Math.min(side, iW*0.35)} height={Math.min(side, iH*0.6)}
                    fill={isAbove ? '#FF4E6A' : '#2ECC8F'} opacity="0.16"
                    stroke={isAbove ? '#FF4E6A' : '#2ECC8F'}
                    stroke-width="0.8" stroke-opacity="0.45"/>
                {/each}
              </g>
            {/if}

            <!-- ── DRAG LINE + its residuals (step 12) ── -->
            {#if currentShow === 'drag'}
              <!-- Ghost OLS line -->
              <line x1={olsLc.x1} y1={olsLc.y1} x2={olsLc.x2} y2={olsLc.y2}
                stroke="#4E79FF" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.2"/>
              {#each storyPts as p}
                {@const py = dragM*p.x+dragB}
                {@const isAbove = p.y > py}
                <line x1={xs(p.x)} y1={ys(p.y)} x2={xs(p.x)} y2={ys(py)}
                  stroke={isAbove?'#FF4E6A':'#2ECC8F'}
                  stroke-width="1.2" stroke-dasharray="3,2" opacity="0.45"
                  clip-path="url(#plot-area)"/>
              {/each}
              <!-- The draggable line -->
              <line x1={dragLc.x1} y1={dragLc.y1} x2={dragLc.x2} y2={dragLc.y2}
                stroke={dragMse <= olsMse*1.15 ? '#2ECC8F' : '#4E79FF'} stroke-width="2.5"/>
            {/if}

            <!-- ── GD ANIMATED LINE (step 13) ── -->
            {#if currentShow === 'gd_animate'}
              <!-- Ghost OLS target -->
              <line x1={olsLc.x1} y1={olsLc.y1} x2={olsLc.x2} y2={olsLc.y2}
                stroke="#4E79FF" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.2"/>
              <line x1={gdLc.x1} y1={gdLc.y1} x2={gdLc.x2} y2={gdLc.y2}
                stroke={gdDone?'#2ECC8F':'#FF9F1C'} stroke-width="2.8"/>
            {/if}

            <!-- ── OLS LINE (steps 4-11, 14) ── -->
            {#if ['line','slope','intercept','prediction','residuals','squares','mse','compare','final'].includes(currentShow)}
              <line x1={olsLc.x1} y1={olsLc.y1} x2={olsLc.x2} y2={olsLc.y2}
                stroke="#4E79FF" stroke-width={currentShow==='final'?3:2.5}/>
            {/if}

            <!-- ── DATA DOTS (all steps except 'axes') ── -->
            {#if currentShow !== 'axes'}
              {#each storyPts as p}
                <circle cx={xs(p.x)} cy={ys(p.y)} r="5"
                  fill="#4E79FF" stroke="white" stroke-width="1.5" opacity="0.88"/>
              {/each}
            {/if}

            <!-- ── SLOPE ANNOTATION (step 5) ── -->
            {#if currentShow === 'slope'}
              {@const sx1 = 1400}
              {@const sx2 = 2000}
              {@const sy1 = storyOls.m*sx1+storyOls.b}
              {@const sy2 = storyOls.m*sx2+storyOls.b}
              <line x1={xs(sx1)} y1={ys(sy1)} x2={xs(sx2)} y2={ys(sy1)}
                stroke="#2ECC8F" stroke-width="2" stroke-dasharray="5,2"/>
              <line x1={xs(sx2)} y1={ys(sy1)} x2={xs(sx2)} y2={ys(sy2)}
                stroke="#FF4E6A" stroke-width="2" stroke-dasharray="5,2"/>
              <text x={xs((sx1+sx2)/2)} y={ys(sy1)+17} text-anchor="middle"
                font-size="10.5" fill="#2ECC8F" font-weight="700">run = 600 sqft</text>
              <text x={xs(sx2)+32} y={ys((sy1+sy2)/2)+4} text-anchor="middle"
                font-size="10.5" fill="#FF4E6A" font-weight="700">rise</text>
              <!-- slope badge -->
              <rect x={PAD.l+8} y={PAD.t+4} width="168" height="52" rx="8"
                fill="#EEF2FF" stroke="#4E79FF" stroke-width="1.2"/>
              <text x={PAD.l+20} y={PAD.t+22} font-size="11" fill="#4E79FF" font-weight="700">
                slope m = {storyOls.m.toFixed(4)}
              </text>
              <text x={PAD.l+20} y={PAD.t+40} font-size="10.5" fill="#6B7280">
                +${(storyOls.m*1000).toFixed(0)} per sqft
              </text>
            {/if}

            <!-- ── INTERCEPT ANNOTATION (step 6) ── -->
            {#if currentShow === 'intercept'}
              {@const iy = storyOls.b}
              <!-- Vertical drop line from y-axis intercept -->
              <line x1={PAD.l} y1={ys(iy)} x2={PAD.l+20} y2={ys(iy)}
                stroke="#FF4E6A" stroke-width="2" stroke-dasharray="4,2"/>
              <circle cx={PAD.l} cy={ys(iy)} r="6"
                fill="#FF4E6A" stroke="white" stroke-width="2"/>
              <text x={PAD.l+26} y={ys(iy)+4} font-size="11" fill="#FF4E6A" font-weight="700">
                b = {storyOls.b.toFixed(1)}k
              </text>
              <rect x={PAD.l+8} y={PAD.t+4} width="172" height="52" rx="8"
                fill="#FFF1F2" stroke="#FF4E6A" stroke-width="1.2"/>
              <text x={PAD.l+20} y={PAD.t+22} font-size="11" fill="#FF4E6A" font-weight="700">
                intercept b = {storyOls.b.toFixed(1)}k
              </text>
              <text x={PAD.l+20} y={PAD.t+40} font-size="10.5" fill="#6B7280">
                baseline when x = 0
              </text>
            {/if}

            <!-- ── PREDICTION PROJECTION (step 7) ── -->
            {#if currentShow === 'prediction'}
              {@const px2  = QX}
              {@const pred = storyOls.m*QX + storyOls.b}
              <line x1={xs(px2)} y1={ys(Y0)} x2={xs(px2)} y2={ys(pred)}
                stroke="#FF9F1C" stroke-width="1.8" stroke-dasharray="6,3"/>
              <line x1={PAD.l} y1={ys(pred)} x2={xs(px2)} y2={ys(pred)}
                stroke="#FF9F1C" stroke-width="1.8" stroke-dasharray="6,3"/>
              <circle cx={xs(px2)} cy={ys(pred)} r="6"
                fill="#FF9F1C" stroke="white" stroke-width="2"/>
              <rect x={xs(px2)+10} y={ys(pred)-26} width="110" height="28" rx="6"
                fill="#FFF7ED" stroke="#FF9F1C" stroke-width="1.2"/>
              <text x={xs(px2)+18} y={ys(pred)-8} font-size="11" fill="#D97706" font-weight="700">
                ŷ ≈ ${pred.toFixed(0)}k
              </text>
            {/if}

            <!-- ── MSE BADGE (steps 10, mse) ── -->
            {#if currentShow === 'mse'}
              <rect x={PAD.l+8} y={PAD.t+4} width="162" height="60" rx="8"
                fill="#EEF2FF" stroke="#4E79FF" stroke-width="1.2"/>
              <text x={PAD.l+20} y={PAD.t+22} font-size="11" fill="#4E79FF" font-weight="700">Best-fit MSE</text>
              <text x={PAD.l+20} y={PAD.t+48} font-size="22" fill="#4E79FF" font-weight="800">
                {olsMse.toFixed(0)}
              </text>
            {/if}

            <!-- ── COMPARE MSE BADGES (step 11) ── -->
            {#if currentShow === 'compare'}
              <rect x={PAD.l+8} y={PAD.t+4} width="148" height="56" rx="8"
                fill="#EEF2FF" stroke="#4E79FF" stroke-width="1.2"/>
              <text x={PAD.l+18} y={PAD.t+21} font-size="10.5" fill="#4E79FF" font-weight="700">Blue (best fit)</text>
              <text x={PAD.l+18} y={PAD.t+42} font-size="13" fill="#4E79FF" font-weight="700">
                MSE {olsMse.toFixed(0)}
              </text>
              <rect x={PAD.l+8} y={PAD.t+68} width="148" height="56" rx="8"
                fill="#FFF7ED" stroke="#FF9F1C" stroke-width="1.2"/>
              <text x={PAD.l+18} y={PAD.t+85} font-size="10.5" fill="#D97706" font-weight="700">Orange (bad fit)</text>
              <text x={PAD.l+18} y={PAD.t+106} font-size="13" fill="#D97706" font-weight="700">
                MSE {badMse.toFixed(0)}
              </text>
            {/if}

            <!-- ── DRAG MSE BADGE + HANDLES (step 12) ── -->
            {#if currentShow === 'drag'}
              <rect x={PAD.l+8} y={PAD.t+4} width="165" height="62" rx="8"
                fill="white" stroke="#E5E7EB" stroke-width="1.2"/>
              <text x={PAD.l+18} y={PAD.t+22} font-size="10.5" fill="#6B7280">MSE (your line)</text>
              <text x={PAD.l+18} y={PAD.t+50} font-size="22" font-weight="800"
                fill={dragMse <= olsMse*1.15 ? '#2ECC8F' : '#FF4E6A'}>
                {dragMse > 99999 ? '>100k' : dragMse.toFixed(0)}
              </text>
              <!-- Best MSE label -->
              <text x={PAD.l+18} y={PAD.t+72} font-size="9.5" fill="#9CA3AF">
                best possible: {olsMse.toFixed(0)}
              </text>
              <!-- Handles -->
              <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
              <circle cx={xs(DX_L)} cy={hLy} r="10"
                fill="white" stroke="#4E79FF" stroke-width="2.5"
                style="cursor:ns-resize"
                on:mousedown|stopPropagation={() => onHandleDown('L')}
                on:touchstart|preventDefault|stopPropagation={() => onHandleDown('L')}/>
              <text x={xs(DX_L)} y={hLy+4} text-anchor="middle"
                font-size="9" fill="#4E79FF" pointer-events="none">↕</text>
              <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
              <circle cx={xs(DX_R)} cy={hRy} r="10"
                fill="white" stroke="#4E79FF" stroke-width="2.5"
                style="cursor:ns-resize"
                on:mousedown|stopPropagation={() => onHandleDown('R')}
                on:touchstart|preventDefault|stopPropagation={() => onHandleDown('R')}/>
              <text x={xs(DX_R)} y={hRy+4} text-anchor="middle"
                font-size="9" fill="#4E79FF" pointer-events="none">↕</text>
            {/if}

            <!-- ── GD BADGES (step 13) ── -->
            {#if currentShow === 'gd_animate'}
              <rect x={PAD.l+8} y={PAD.t+4} width="162" height="60" rx="8"
                fill={gdDone?'#F0FDF4':'#FFF7ED'}
                stroke={gdDone?'#2ECC8F':'#FF9F1C'} stroke-width="1.2"/>
              <text x={PAD.l+20} y={PAD.t+22} font-size="11"
                fill={gdDone?'#16A34A':'#D97706'} font-weight="700">
                {gdDone ? '✓ Converged!' : 'Descending…'}
              </text>
              <text x={PAD.l+20} y={PAD.t+48} font-size="20" font-weight="800"
                fill={gdDone?'#16A34A':'#D97706'}>
                {gdMse.toFixed(0)}
              </text>
            {/if}

            <!-- ── FINAL BADGE (step 14) ── -->
            {#if currentShow === 'final'}
              <rect x={W-PAD.r-148} y={PAD.t+4} width="142" height="64" rx="8"
                fill="#EEF2FF" stroke="#4E79FF" stroke-width="1.2"/>
              <text x={W-PAD.r-78} y={PAD.t+21} text-anchor="middle"
                font-size="11" fill="#4E79FF" font-weight="700">Best Fit (OLS)</text>
              <text x={W-PAD.r-78} y={PAD.t+39} text-anchor="middle"
                font-size="10.5" fill="#6B7280">m = {storyOls.m.toFixed(4)}</text>
              <text x={W-PAD.r-78} y={PAD.t+55} text-anchor="middle"
                font-size="10.5" fill="#6B7280">b = {storyOls.b.toFixed(1)}k</text>
            {/if}

          </svg>
        </div>

        <!-- Replay for GD -->
        {#if currentShow === 'gd_animate' && gdDone}
          <button class="replay-btn" on:click={replayGD}>↺ Replay animation</button>
        {/if}

        <!-- Contextual hint -->
        <div class="canvas-hint">{hints[activeStep] ?? ''}</div>

      </div>
    </div>

    <!-- ── RIGHT: flowing narrative ─────────────────────────────────── -->
    <div class="narr-col">
      <Scrolly on:step={onStep}>
        {#each chapters as ch}
          <div class="scroll-step" class:active={activeStep === ch.step} data-step={ch.step}>
            <div class="step-text">

              {#if ch.part}
                <div class="part-label">{ch.part}</div>
              {/if}

              <div class="step-eyebrow">
                <span class="eyebrow-line"></span>
                <span class="eyebrow-tag">{ch.tag}</span>
                <span class="step-num">{String(ch.step).padStart(2,'0')}</span>
              </div>

              <h2>{ch.title}</h2>
              <div class="body-text">{@html ch.body}</div>

              <!-- OLS math breakdown (step 14 only) -->
              {#if ch.step === 14}
                <div class="ols-breakdown">
                  <div class="ob-block">
                    <div class="ob-label">Slope <em>m</em></div>
                    <div class="ob-formula">m = Σ(xᵢ − x̄)(yᵢ − ȳ) ÷ Σ(xᵢ − x̄)²</div>
                    <div class="ob-calc">
                      <span class="ob-frac">
                        <span class="ob-num">{olsNum.toFixed(0)}</span>
                        <span class="ob-bar"></span>
                        <span class="ob-den">{olsDen.toFixed(0)}</span>
                      </span>
                      <span class="ob-eq">= <strong>{storyOls.m.toFixed(4)}</strong></span>
                    </div>
                  </div>
                  <div class="ob-block">
                    <div class="ob-label">Intercept <em>b</em></div>
                    <div class="ob-formula">b = ȳ − m · x̄</div>
                    <div class="ob-calc">
                      <span class="ob-expr">
                        {yMean.toFixed(1)} − {storyOls.m.toFixed(4)} × {xMean.toFixed(1)}
                      </span>
                      <span class="ob-eq">= <strong>{storyOls.b.toFixed(1)}k</strong></span>
                    </div>
                  </div>
                  <div class="ob-footer">
                    ✓ No iterations · No learning rate · Exact global minimum
                  </div>
                </div>
              {/if}

            </div>
          </div>
        {/each}

        <!-- Sandbox CTA -->
        <div class="scroll-step active-always" data-step={15}>
          <div class="step-text cta-step">
            <div class="step-eyebrow">
              <span class="eyebrow-line"></span>
              <span class="eyebrow-tag">Sandbox</span>
            </div>
            <h2>Now experiment for yourself</h2>
            <p class="cta-body">
              The intuition becomes real when you interact with it.
              Adjust m and b manually, watch MSE change live, run gradient descent
              on your own dataset, and feel exactly why the best-fit line is best.
            </p>
            <ul class="cta-list">
              <li><span class="li-icon">⟡</span> <strong>Drag the sliders</strong> to change slope and intercept — MSE updates instantly</li>
              <li><span class="li-icon">⟡</span> <strong>Click the chart</strong> to add your own data points</li>
              <li><span class="li-icon">⟡</span> <strong>Run Gradient Descent</strong> and watch the line home in</li>
              <li><span class="li-icon">⟡</span> <strong>Switch to Noisy or Outliers</strong> — see how they change the fit</li>
            </ul>
            <button class="go-btn"
              on:click={() => document.getElementById('sandbox')?.scrollIntoView({ behavior:'smooth' })}>
              Open Sandbox →
            </button>
          </div>
        </div>

      </Scrolly>
    </div>

  </div>
</section>

<!-- ══════════════════════ SANDBOX ══════════════════════════════════════ -->
<section class="sandbox" id="sandbox">
  <div class="sb-wrap">

    <div class="sb-canvas-col">
      <div class="sb-canvas-header">
        <div>
          <span class="sb-label">Sandbox</span>
          <h2 class="sb-title">Explore Linear Regression interactively</h2>
          <p class="sb-desc">
            <strong>Click</strong> the chart to add data points ·
            <strong>Drag sliders</strong> to adjust m and b
          </p>
        </div>
      </div>

      <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
      <svg role="img" viewBox="0 0 {W} {H}" class="sb-svg"
        bind:this={sbSvgEl} on:click={sbClick} style="cursor:crosshair">

        {#each yTicks as y}
          <line x1={PAD.l} y1={ys(y)} x2={W-PAD.r} y2={ys(y)} stroke="#F3F4F6" stroke-width="1"/>
        {/each}
        {#each xTicks as x}
          <line x1={xs(x)} y1={PAD.t} x2={xs(x)} y2={H-PAD.b} stroke="#F3F4F6" stroke-width="1"/>
        {/each}
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H-PAD.b} stroke="#D1D5DB" stroke-width="1.5"/>
        <line x1={PAD.l} y1={H-PAD.b} x2={W-PAD.r} y2={H-PAD.b} stroke="#D1D5DB" stroke-width="1.5"/>
        {#each xTicks as x}
          <text x={xs(x)} y={H-PAD.b+16} text-anchor="middle" font-size="10" fill="#9CA3AF">
            {x>=1000?(x/1000).toFixed(1)+'k':x}
          </text>
        {/each}
        {#each yTicks as y}
          <text x={PAD.l-7} y={ys(y)+4} text-anchor="end" font-size="10" fill="#9CA3AF">{y}k</text>
        {/each}
        <text x={W/2} y={H-3} text-anchor="middle" font-size="11" fill="#9CA3AF">Size (sqft)</text>
        <text x={11} y={H/2} text-anchor="middle" font-size="11" fill="#9CA3AF"
          transform="rotate(-90,11,{H/2})">Price ($k)</text>

        {#each sbPts as p}
          {@const py = sbM*p.x+sbB}
          <line x1={xs(p.x)} y1={ys(p.y)} x2={xs(p.x)} y2={ys(py)}
            stroke="#FF4E6A" stroke-width="1" opacity="0.22"/>
        {/each}
        <line x1={sbLc.x1} y1={sbLc.y1} x2={sbLc.x2} y2={sbLc.y2}
          stroke={sbGdRunning?'#FF9F1C':'#4E79FF'} stroke-width="2.5"/>
        {#each sbPts as p}
          <circle cx={xs(p.x)} cy={ys(p.y)} r="5"
            fill="#4E79FF" stroke="white" stroke-width="1.5" opacity="0.88"/>
        {/each}

        <!-- MSE badge -->
        <rect x={W-PAD.r-124} y={PAD.t+4} width="118" height="56" rx="8"
          fill="white" stroke="#E5E7EB" stroke-width="1.2"/>
        <text x={W-PAD.r-66} y={PAD.t+22} text-anchor="middle" font-size="10" fill="#6B7280">MSE</text>
        <text x={W-PAD.r-66} y={PAD.t+46} text-anchor="middle" font-size="20"
          fill="#4E79FF" font-weight="700">
          {sbMse>999999?'>1M':sbMse.toFixed(0)}
        </text>
      </svg>
    </div>

    <div class="sb-ctrl-col">
      <div class="sbc">
        <label class="sbc-label">Dataset</label>
        <div class="sbc-ds-row">
          {#each ['clean','noisy','outliers'] as d}
            <button class="ds-btn" class:ds-active={sbDataset===d} on:click={()=>sbSwitch(d)}>
              {d.charAt(0).toUpperCase()+d.slice(1)}
            </button>
          {/each}
        </div>
      </div>
      <div class="sbc">
        <label class="sbc-label">
          Slope <span class="sbc-m">m</span> =
          <span class="sbc-val">{sbM.toFixed(3)}</span>
        </label>
        <input type="range" min="0" max="0.4" step="0.001"
          bind:value={sbM} disabled={sbGdRunning}/>
        <div class="slider-hints"><span>0 (flat)</span><span>0.4 (steep)</span></div>
      </div>
      <div class="sbc">
        <label class="sbc-label">
          Intercept <span class="sbc-c">b</span> =
          <span class="sbc-val">{Math.round(sbB)}k</span>
        </label>
        <input type="range" min="-100" max="500" step="1"
          bind:value={sbB} disabled={sbGdRunning}/>
        <div class="slider-hints"><span>-100k</span><span>+500k</span></div>
      </div>
      <div class="sb-eq">
        ŷ = <strong class="eq-m">{sbM.toFixed(3)}</strong>x
        + <strong class="eq-c">{Math.round(sbB)}</strong>
      </div>
      <div class="sbc sb-actions">
        <button class="sb-btn sb-btn-primary" on:click={sbRunGD} disabled={sbGdRunning}>
          {sbGdRunning ? '⏳ Running…' : '▶ Run Gradient Descent'}
        </button>
        <button class="sb-btn sb-btn-secondary" on:click={sbBestFit} disabled={sbGdRunning}>
          ⌖ Snap to Best Fit (OLS)
        </button>
        <button class="sb-btn sb-btn-ghost" on:click={sbReset}>↺ Reset</button>
      </div>
    </div>

  </div>
</section>

<!-- ══════════════════════ SUMMARY ══════════════════════════════════════ -->
<section class="summary">
  <div class="sum-wrap">
    <h2>What you've learned</h2>
    <p class="sum-intro">From a blank scatter plot to the exact mathematical solution — here's your reference.</p>
    <div class="sum-grid">
      {#each [
        { color:'#4E79FF', bg:'#EEF2FF', title:'ŷ = mx + b',
          body:'Any straight line is fully defined by slope m and intercept b. Linear Regression finds the specific (m, b) pair that minimises MSE over the training data.' },
        { color:'#FF4E6A', bg:'#FFF0F2', title:'Residuals',
          body:'The vertical gap between each data point and the line: eᵢ = yᵢ − ŷᵢ. Positive = underestimate. Negative = overestimate. They reveal exactly where the model is wrong.' },
        { color:'#2ECC8F', bg:'#EDFAF4', title:'Mean Squared Error',
          body:'MSE = (1/n)Σ(yᵢ−ŷᵢ)². Squaring eliminates sign and disproportionately penalises large errors. Minimising MSE gives the best fit.' },
        { color:'#FF9F1C', bg:'#FFF6EC', title:'Gradient Descent',
          body:'An iterative optimiser: compute the gradient of MSE with respect to m and b, then step downhill. The universal training algorithm for all neural networks.' },
        { color:'#7C3AED', bg:'#F5F3FF', title:'Ordinary Least Squares',
          body:'The closed-form solution: m = Σ(xᵢ−x̄)(yᵢ−ȳ)/Σ(xᵢ−x̄)². Gives the exact global minimum in one pass — no iteration needed for simple regression.' },
        { color:'#0891B2', bg:'#E0F2FE', title:'Parametric vs Lazy',
          body:'Linear Regression is parametric — all learning is stored in m and b. KNN is lazy — it stores every training point. Parametric models are far more compact.' },
      ] as c}
        <div class="sum-card">
          <div class="sc-bar" style="background:{c.color}"></div>
          <strong style="color:{c.color}">{c.title}</strong>
          <p>{c.body}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- ══════════════════════ FOOTER ═══════════════════════════════════════ -->
<footer>
  <div class="foot-inner">
    <div class="foot-brand-col">
      <div class="foot-brand">
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="10" stroke="#4E79FF" stroke-width="1.8"/>
          <circle cx="6"  cy="9"  r="2.2" fill="#4E79FF"/>
          <circle cx="14" cy="7"  r="2.2" fill="#FF4E6A"/>
          <circle cx="10" cy="15" r="2.2" fill="#2ECC8F"/>
          <circle cx="16" cy="14" r="1.6" fill="#FF9F1C" opacity="0.8"/>
        </svg>
        <span class="foot-brand-name">ML Visuals</span>
      </div>
      <p class="foot-tagline">Machine learning, made visible.</p>
      <p class="foot-desc">A free, interactive series where you learn by exploring — not just reading.</p>
    </div>
    <div class="foot-col">
      <p class="foot-col-title">Up next in Classical ML</p>
      <ul class="foot-list">
        {#each ['Logistic Regression','Decision Trees','Naive Bayes','SVM','Random Forest'] as algo}
          <li><span class="fl-soon">Soon</span>{algo}</li>
        {/each}
      </ul>
    </div>
    <div class="foot-col">
      <p class="foot-col-title">What you covered</p>
      <ul class="foot-list about-list">
        {#each [
          'Scatter plots and the signal vs noise distinction',
          'The line equation ŷ = mx + b',
          'Slope m and intercept b explained',
          'Residuals and their meaning',
          'Mean Squared Error (MSE)',
          'Gradient Descent — the universal optimizer',
          'Ordinary Least Squares — closed-form solution',
        ] as t}
          <li>{t}</li>
        {/each}
      </ul>
    </div>
  </div>
  <div class="foot-bottom">
    <span>© 2025 ML Visuals · <a href="/">Home</a></span>
    <div class="foot-bottom-right">
      <a href="/">All Topics</a>
      <a href="/knn">KNN</a>
    </div>
  </div>
</footer>

<style>
  :global(body) { margin:0; font-family:'Inter',sans-serif; background:#FAFBFE; color:#111827; }
  * { box-sizing:border-box; }

  /* ── BANNER ───────────────────────────────────────────────────────── */
  .lr-banner {
    min-height:56vh; display:flex; align-items:center; justify-content:center;
    background:linear-gradient(150deg,#FFF1F2 0%,#FAFBFE 50%,#EEF2FF 100%);
    border-bottom:1px solid #E5E7EB;
    padding:100px 24px 60px; text-align:center;
    position:relative; overflow:hidden;
  }
  .lr-banner-inner { position:relative; z-index:1; display:flex; flex-direction:column; align-items:center; gap:16px; }
  .banner-back { font-size:13px; color:#6B7280; text-decoration:none; display:flex; align-items:center; gap:6px; transition:color 0.15s; }
  .banner-back:hover { color:#111827; }
  .banner-crumb { display:flex; align-items:center; gap:8px; font-size:13px; color:#9CA3AF; }
  .banner-cat   { color:#FF4E6A; font-weight:700; }
  .banner-sep   { color:#D1D5DB; }
  .banner-title {
    font-family:'Space Grotesk',sans-serif;
    font-size:clamp(38px,6vw,68px); font-weight:700; color:#111827; margin:0; line-height:1.1;
  }
  .banner-desc { font-size:16px; color:#6B7280; max-width:560px; line-height:1.7; margin:0; }
  .banner-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; }
  .bm-pill { font-size:12px; font-weight:600; background:#F3F4F6; color:#6B7280; padding:4px 12px; border-radius:20px; }
  .bm-green { background:#DCFCE7; color:#16A34A; }
  .banner-cta {
    background:#FF4E6A; color:white;
    font-family:'Space Grotesk',sans-serif; font-size:15px; font-weight:700;
    padding:12px 28px; border-radius:10px; border:none; cursor:pointer;
    transition:background 0.15s, transform 0.15s;
  }
  .banner-cta:hover { background:#E0395A; transform:translateY(-1px); }
  .bg-dots { position:absolute; inset:0; pointer-events:none; z-index:0; }
  .bg-dot  { position:absolute; border-radius:50%; animation:flt 7s ease-in-out infinite; }
  @keyframes flt { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }

  /* ── STORY LAYOUT ─────────────────────────────────────────────────── */
  .story { padding:0; background:#F9FAFB; }
  .story-wrap {
    max-width:1200px; margin:0 auto;
    display:grid; grid-template-columns:5fr 7fr;
    padding:0 24px;
  }

  /* Left sticky viz */
  .viz-col { position:relative; }
  .sticky-panel {
    position:sticky; top:0; height:100vh; overflow-y:auto;
    display:flex; flex-direction:column; align-items:center;
    justify-content:center; gap:12px;
    padding:20px 32px 20px 0;
  }
  .step-pill {
    display:inline-flex; align-items:center; gap:7px;
    font-size:11px; font-weight:600; color:#6B7280;
    background:white; border:1px solid #E5E7EB;
    padding:4px 12px; border-radius:20px;
    box-shadow:0 1px 4px rgba(0,0,0,0.05);
    align-self:flex-start;
  }
  .sp-dot { width:7px; height:7px; border-radius:50%; }
  .viz-card {
    background:white; border:1.5px solid #E5E7EB; border-radius:14px;
    overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.07);
    width:100%;
  }
  .lr-svg { display:block; width:100%; height:auto; }
  .replay-btn {
    font-size:12px; font-weight:700; color:#16A34A;
    background:white; border:1.5px solid #BBF7D0;
    border-radius:8px; padding:6px 16px; cursor:pointer;
    transition:background 0.15s;
  }
  .replay-btn:hover { background:#F0FDF4; }
  .canvas-hint {
    font-size:12px; color:#9CA3AF; font-style:italic;
    text-align:center; line-height:1.5; max-width:380px; min-height:18px;
  }

  /* Right narrative */
  .narr-col { padding:80px 0 80px 48px; border-left:1px solid #E5E7EB; }

  .scroll-step {
    min-height:90vh; display:flex; align-items:center; padding:48px 0;
    opacity:0.3; transition:opacity 0.5s ease;
  }
  .scroll-step.active, .scroll-step.active-always { opacity:1; }
  .step-text { max-width:480px; }

  .part-label {
    font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em;
    color:#C4C8D8; margin-bottom:20px; padding:4px 0; border-top:1px solid #E5E7EB;
  }
  .step-eyebrow { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
  .eyebrow-line { display:block; width:24px; height:2px; background:#FF4E6A; border-radius:1px; flex-shrink:0; }
  .eyebrow-tag  { font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#FF4E6A; }
  .step-num     { font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700; color:#D1D5DB; margin-left:auto; }

  .step-text h2 {
    font-family:'Space Grotesk',sans-serif;
    font-size:28px; font-weight:700; color:#111827;
    margin:0 0 20px; line-height:1.25;
  }

  .body-text :global(p)          { font-size:15px; line-height:1.85; color:#374151; margin:0 0 16px; }
  .body-text :global(p:last-child){ margin-bottom:0; }
  .body-text :global(strong)     { color:#111827; font-weight:700; }
  .body-text :global(em)         { color:#6B7280; font-style:italic; }
  .body-text :global(span[style*="color:#FF4E6A"]) { font-weight:600; }
  .body-text :global(span[style*="color:#2ECC8F"]) { font-weight:600; }
  .body-text :global(.formula) {
    font-family:'JetBrains Mono',monospace;
    font-size:14px; color:#4E79FF;
    background:#EEF2FF; border-left:3px solid #4E79FF;
    padding:10px 16px; border-radius:0 8px 8px 0;
    margin:14px 0; line-height:1.6;
  }

  /* OLS breakdown (step 14) */
  .ols-breakdown {
    margin-top:24px;
    background:#F9FAFB; border:1.5px solid #E5E7EB; border-radius:14px;
    overflow:hidden;
  }
  .ob-block {
    padding:16px 20px;
    border-bottom:1px solid #F3F4F6;
  }
  .ob-block:last-of-type { border-bottom:none; }
  .ob-label {
    font-size:11px; font-weight:700; text-transform:uppercase;
    letter-spacing:0.08em; color:#9CA3AF; margin-bottom:8px;
  }
  .ob-label em { color:#4E79FF; font-style:italic; text-transform:none; letter-spacing:0; }
  .ob-formula {
    font-family:'JetBrains Mono',monospace;
    font-size:13px; color:#374151; margin-bottom:10px;
  }
  .ob-calc {
    display:flex; align-items:center; gap:12px;
    font-family:'JetBrains Mono',monospace;
    font-size:13px; color:#374151;
  }
  .ob-frac {
    display:inline-flex; flex-direction:column; align-items:center; gap:2px;
  }
  .ob-num  { font-size:13px; color:#4E79FF; font-weight:700; }
  .ob-bar  { width:100%; height:1.5px; background:#4E79FF; border-radius:1px; min-width:60px; }
  .ob-den  { font-size:13px; color:#4E79FF; font-weight:700; }
  .ob-eq   { font-size:15px; color:#111827; }
  .ob-eq strong { color:#111827; font-size:17px; }
  .ob-expr { color:#374151; }
  .ob-footer {
    padding:12px 20px;
    font-size:12px; font-weight:700; color:#16A34A;
    background:#F0FDF4; border-top:1px solid #DCFCE7;
  }

  /* CTA step */
  .cta-step h2 { color:#111827; }
  .cta-body  { font-size:15px; line-height:1.75; color:#374151; margin:0 0 20px; }
  .cta-list  { list-style:none; padding:0; margin:0 0 24px; display:flex; flex-direction:column; gap:10px; }
  .cta-list li { display:flex; gap:10px; font-size:14px; color:#4B5563; line-height:1.5; }
  .li-icon   { color:#FF4E6A; font-size:12px; flex-shrink:0; margin-top:2px; }
  .go-btn {
    background:#FF4E6A; color:white;
    font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:700;
    padding:11px 24px; border-radius:9px; border:none; cursor:pointer;
    transition:background 0.15s, transform 0.15s;
  }
  .go-btn:hover { background:#E0395A; transform:translateY(-1px); }

  /* ── SANDBOX ──────────────────────────────────────────────────────── */
  .sandbox { background:white; border-top:1px solid #E5E7EB; padding:72px 24px; }
  .sb-wrap {
    max-width:1200px; margin:0 auto;
    display:grid; grid-template-columns:1fr 300px; gap:40px; align-items:start;
  }
  .sb-canvas-header { margin-bottom:16px; }
  .sb-label { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.1em; color:#FF4E6A; display:block; margin-bottom:4px; }
  .sb-title { font-family:'Space Grotesk',sans-serif; font-size:22px; font-weight:700; color:#111827; margin:0 0 6px; }
  .sb-desc  { font-size:13px; color:#6B7280; margin:0; }
  .sb-svg   { display:block; width:100%; height:auto; border:1.5px solid #E5E7EB; border-radius:14px; box-shadow:0 2px 12px rgba(0,0,0,0.05); }
  .sb-ctrl-col { display:flex; flex-direction:column; gap:14px; padding-top:48px; }
  .sbc { background:#F9FAFB; border:1.5px solid #E5E7EB; border-radius:12px; padding:14px; }
  .sbc-label { display:block; font-size:12px; font-weight:600; color:#6B7280; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.05em; }
  .sbc-val   { color:#111827; font-family:'JetBrains Mono',monospace; font-weight:700; }
  .sbc-m     { color:#4E79FF; font-style:italic; font-weight:700; }
  .sbc-c     { color:#FF4E6A; font-style:italic; font-weight:700; }
  .sbc-ds-row{ display:flex; gap:6px; }
  .ds-btn {
    flex:1; padding:7px 0; border-radius:8px;
    border:1.5px solid #E5E7EB; background:white;
    font-size:12px; font-weight:600; color:#6B7280;
    cursor:pointer; transition:all 0.15s;
  }
  .ds-btn:hover      { border-color:#FF4E6A; color:#FF4E6A; }
  .ds-btn.ds-active  { border-color:#FF4E6A; background:#FFF1F2; color:#FF4E6A; }
  input[type="range"]          { width:100%; accent-color:#4E79FF; cursor:pointer; }
  input[type="range"]:disabled { opacity:0.4; cursor:not-allowed; }
  .slider-hints { display:flex; justify-content:space-between; font-size:10px; color:#D1D5DB; margin-top:4px; }
  .sb-eq {
    text-align:center; font-family:'JetBrains Mono',monospace;
    font-size:15px; color:#6B7280; padding:12px;
    background:#F9FAFB; border-radius:10px; border:1.5px solid #E5E7EB;
  }
  .eq-m { color:#4E79FF; }
  .eq-c { color:#FF4E6A; }
  .sb-actions { display:flex; flex-direction:column; gap:8px; }
  .sb-btn { width:100%; padding:10px 14px; border-radius:9px; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.15s; border:none; }
  .sb-btn:disabled          { opacity:0.5; cursor:not-allowed; }
  .sb-btn-primary           { background:#4E79FF; color:white; }
  .sb-btn-primary:hover:not(:disabled) { background:#3B68EE; }
  .sb-btn-secondary         { background:#F0FDF4; color:#16A34A; border:1.5px solid #BBF7D0; }
  .sb-btn-secondary:hover:not(:disabled) { background:#DCFCE7; }
  .sb-btn-ghost             { background:#F3F4F6; color:#6B7280; }
  .sb-btn-ghost:hover       { background:#E5E7EB; }

  /* ── SUMMARY ──────────────────────────────────────────────────────── */
  .summary { background:#F3F4F6; border-top:1px solid #E5E7EB; padding:80px 24px; }
  .sum-wrap { max-width:1200px; margin:0 auto; }
  .summary h2 { font-family:'Space Grotesk',sans-serif; font-size:30px; font-weight:700; color:#111827; margin-bottom:10px; text-align:center; }
  .sum-intro  { text-align:center; font-size:15px; color:#6B7280; margin-bottom:40px; }
  .sum-grid   { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px; }
  .sum-card   { background:white; border:1px solid #E5E7EB; border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:8px; box-shadow:0 1px 6px rgba(0,0,0,0.04); }
  .sc-bar     { width:28px; height:3px; border-radius:2px; margin-bottom:4px; }
  .sum-card strong { font-size:14px; font-weight:700; }
  .sum-card p      { font-size:13px; line-height:1.7; color:#6B7280; margin:0; }

  /* ── FOOTER ───────────────────────────────────────────────────────── */
  footer { background:#111827; border-top:1px solid #1F2937; padding:56px 24px 0; }
  .foot-inner {
    max-width:1200px; margin:0 auto;
    display:grid; grid-template-columns:2fr 1.4fr 1.6fr;
    gap:48px; padding-bottom:48px; border-bottom:1px solid #1F2937;
  }
  .foot-brand-col { display:flex; flex-direction:column; gap:10px; }
  .foot-brand     { display:flex; align-items:center; gap:9px; }
  .foot-brand-name{ font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:700; color:white; }
  .foot-tagline   { font-size:14px; color:#9CA3AF; font-style:italic; }
  .foot-desc      { font-size:13px; color:#4B5563; line-height:1.7; max-width:300px; }
  .foot-col       { display:flex; flex-direction:column; gap:12px; }
  .foot-col-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#4B5563; }
  .foot-list      { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
  .foot-list li   { font-size:13px; color:#6B7280; display:flex; align-items:center; gap:8px; }
  .foot-list.about-list li::before { content:'—'; color:#374151; flex-shrink:0; font-size:11px; }
  .fl-soon { font-size:9px; font-weight:600; background:#1F2937; color:#4B5563; padding:1px 7px; border-radius:4px; }
  .foot-bottom {
    max-width:1200px; margin:0 auto;
    display:flex; justify-content:space-between; align-items:center;
    padding:18px 0; font-size:12px; color:#374151; flex-wrap:wrap; gap:8px;
  }
  .foot-bottom a { color:#4B5563; text-decoration:none; }
  .foot-bottom a:hover { color:#9CA3AF; }
  .foot-bottom-right { display:flex; gap:20px; }

  /* ── RESPONSIVE ───────────────────────────────────────────────────── */
  @media (max-width:900px) {
    .story-wrap  { grid-template-columns:1fr; padding:0 16px; }
    .viz-col     { order:1; }
    .narr-col    { order:2; padding:40px 0 60px; border-left:none; border-top:1px solid #E5E7EB; }
    .sticky-panel{ position:static; height:auto; padding:24px 0 0; }
    .scroll-step { min-height:70vh; }
    .sb-wrap     { grid-template-columns:1fr; gap:24px; }
    .sb-ctrl-col { padding-top:0; display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .sb-actions  { grid-column:1/-1; }
    .foot-inner  { grid-template-columns:1fr 1fr; }
    .foot-brand-col { grid-column:1/-1; }
  }
  @media (max-width:600px) {
    .banner-title { font-size:36px; }
    .scroll-step  { min-height:60vh; padding:32px 0; }
    .step-text h2 { font-size:22px; }
    .sum-grid     { grid-template-columns:1fr; }
    .foot-inner   { grid-template-columns:1fr; gap:32px; }
    .foot-bottom  { flex-direction:column; align-items:flex-start; }
    .sb-ctrl-col  { grid-template-columns:1fr; }
  }
</style>
