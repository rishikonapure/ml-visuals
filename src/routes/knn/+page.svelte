<script>
  import { onMount } from 'svelte';
  import KNNCanvas     from '$lib/components/visualization/KNNCanvas.svelte';
  import VoteBadge     from '$lib/components/visualization/VoteBadge.svelte';
  import MathBreakdown from '$lib/components/visualization/MathBreakdown.svelte';
  import Scrolly       from '$lib/components/layout/Scrolly.svelte';
  import Navbar        from '$lib/components/layout/Navbar.svelte';
  import KSlider       from '$lib/components/controls/KSlider.svelte';
  import MetricToggle  from '$lib/components/controls/MetricToggle.svelte';
  import DatasetPicker from '$lib/components/controls/DatasetPicker.svelte';

  import {
    currentStep, sandboxMode, showBoundary,
    queryPoint, trainingData, k, knnResult,
    addTrainingPoint, resetDataset
  } from '$lib/stores/knnStore.js';

  // ── Paper → Viz ───────────────────────────────────────────────────────────
  let paperUrl    = '';
  let paperStatus = ''; // '' | 'submitted' | 'empty'
  function submitPaper() {
    if (!paperUrl.trim()) { paperStatus = 'empty'; return; }
    paperStatus = 'submitted';
    paperUrl = '';
  }

  // ── Visit counter (CountAPI — free, no auth) ──────────────────────────────
  let visitCount = null;
  async function fetchVisitCount() {
    try {
      const res = await fetch('https://api.countapi.xyz/hit/mlvisuals-io/knn-page');
      if (res.ok) {
        const data = await res.json();
        visitCount = data.value;
      }
    } catch (_) { /* silently ignore if offline */ }
  }

  const CC = { A:'#4E79FF', B:'#FF4E6A', C:'#2ECC8F', D:'#FF9F1C' };
  const CB = { A:'#EEF2FF', B:'#FFF0F2', C:'#EDFAF4', D:'#FFF6EC' };

  let activeStep = 0;
  let canvasW    = 560;
  let canvasH    = 500;
  let sbLabel    = 'A';
  let sbRef;

  // ── Step → vizMode / badgeMode ────────────────────────────────────────────
  // 14-step flow: Basic (1–7) → Issues (8–11) → Advanced (12–13) → When (14)
  function stepVizMode(s) {
    if (s === 10) return 'evenK';
    if (s === 12) return 'weighted';
    if (s === 13) return 'probabilistic';
    return 'default';
  }
  function stepBadgeMode(s) {
    if (s === 10) return 'evenK';
    if (s === 12) return 'weighted';
    if (s === 13) return 'probabilistic';
    return 'default';
  }
  $: curVizMode   = stepVizMode(activeStep);
  $: curBadgeMode = stepBadgeMode(activeStep);

  // ── Chapters (14 steps) ───────────────────────────────────────────────────
  const chapters = [

    // ── PART 1: BASIC KNN ─────────────────────────────────────────────────
    {
      step: 1,
      part: 'Part 1 · Basic KNN',
      tag: 'The Core Idea',
      title: 'Classify by asking your neighbors',
      body: `
        <p>Imagine you've just moved to a new city and someone asks: "What neighbourhood is this?"
        You don't have a map, so you look at the five nearest houses.
        Four have <em>blue</em> doors, one has a <em>red</em> door.
        You say: <strong>"Probably the blue-door neighbourhood."</strong></p>

        <p>That is K-Nearest Neighbors in a nutshell. Given an unlabeled data point,
        KNN looks at the <strong>K closest labeled examples</strong> in the training set
        and takes a <strong>majority vote</strong>. No training. No equations to solve.
        Just memory and distance.</p>

        <p>KNN is called a <strong>lazy learner</strong> — it defers all computation to
        prediction time, storing the entire training set as-is.
        Training is instant. Prediction requires computing distances to every stored example.</p>
      `
    },
    {
      step: 2,
      part: null,
      tag: 'Training Data',
      title: 'Start with labeled examples',
      body: `
        <p>Every supervised learning algorithm begins with <strong>training data</strong>:
        examples where the correct answer is already known.
        On the canvas, each dot is one training example.</p>

        <p>A dot's <strong>position (x, y)</strong> represents its <em>features</em> —
        measurements like petal length and width for a flower,
        or glucose level and BMI for a patient.
        The dot's <strong>color</strong> is its <em>class label</em> —
        the known answer.</p>

        <p>KNN's entire "training" step is simply <strong>storing this data</strong>.
        There are no weights to learn, no trees to build, no equations to optimize.
        The dataset <em>is</em> the model.</p>
      `
    },
    {
      step: 3,
      part: null,
      tag: 'The Query Point',
      title: 'A new, unlabeled point arrives',
      body: `
        <p>Now a <strong>new data point</strong> appears — the white <strong>"?"</strong>
        in the center of the canvas. We don't know its class.
        Maybe it's a new patient, a new customer, or a new flower sample.</p>

        <p>This is the <strong>query point</strong>.
        To classify it, KNN will examine its surroundings:
        <em>which labeled training points are nearest,
        and what class do they belong to?</em></p>

        <p>The fundamental assumption: <strong>nearby points in feature space
        tend to share the same label</strong>. If your features are meaningful,
        similar inputs produce similar outputs. KNN exploits this directly.</p>

        <p>Try dragging the "?" to a different part of the canvas — notice
        how its surroundings change. The algorithm's answer is always local.</p>
      `
    },
    {
      step: 4,
      part: null,
      tag: 'Measuring Distances',
      title: 'Compute the distance to every point',
      body: `
        <p>Before KNN can find the nearest neighbors, it must measure
        how far the query point is from <em>every single training example</em>.
        No shortcuts — all N distances are computed every prediction.</p>

        <p>The default is <strong>Euclidean distance</strong> —
        the straight-line "as the crow flies" measurement:</p>

        <div class="formula">d = √( (x₁ − x₂)² + (y₁ − y₂)² )</div>

        <p>The gray dashed lines fanning out from "?" visualize
        each of these distances. Shorter lines = closer neighbors.
        This is an <strong>O(N) operation per prediction</strong> —
        meaning prediction cost grows linearly with dataset size.</p>

        <p>Other metrics interpret "distance" differently:
        <strong>Manhattan</strong> travels in axis-aligned steps (like city blocks);
        <strong>Minkowski</strong> generalizes both.
        The right metric depends on your feature space geometry.</p>
      `
    },
    {
      step: 5,
      part: null,
      tag: 'K Nearest Neighbors',
      title: 'Sort and pick the K closest',
      body: `
        <p>With all distances computed, KNN <strong>sorts them</strong>
        and selects the K smallest — the K closest training points.
        The dashed orange ring shows the radius needed to enclose exactly K points.
        Everything beyond that ring is ignored.</p>

        <p>The bold colored lines and <strong>#1, #2, #3…</strong> badges
        rank the neighbors by closeness.
        Notice how the ring size changes as you drag the query point —
        the neighborhood is entirely dynamic and local. There's no fixed territory.</p>

        <p>The choice of K is the central hyperparameter.
        <strong>Small K</strong> (like 1) makes predictions sensitive to every nearby point.
        <strong>Large K</strong> (like 15) averages over a wider region, smoothing noise.
        Neither extreme is universally best — it depends on your data.</p>
      `
    },
    {
      step: 6,
      part: null,
      tag: 'Majority Vote',
      title: 'Let the K neighbors vote',
      body: `
        <p>Each of the K selected neighbors casts <strong>one vote</strong>
        for their own class. The class with the most votes wins —
        and that becomes the prediction for the query point.</p>

        <p>It's deliberately simple: <em>no weights, no probabilities,
        just raw democracy</em>. If K = 5 and the split is 3 blue / 2 red,
        the point is classified blue regardless of whether
        the two red neighbors were much closer than the three blue ones.</p>

        <p>The <strong>vote tally panel</strong> below the canvas
        shows the breakdown in real time.
        Drag the "?" across class boundaries to watch the tally flip.</p>
      `
    },
    {
      step: 7,
      part: null,
      tag: 'Decision Boundary',
      title: 'Run KNN at every point in space',
      body: `
        <p>Imagine running KNN not just for the query point,
        but for <em>every possible location</em> across the entire 2D space.
        The result is a <strong>decision boundary</strong>:
        the colored regions show which class KNN would predict at each location.</p>

        <p>Unlike logistic regression or SVMs, KNN's boundary is
        <strong>non-linear and non-parametric</strong>.
        It wraps tightly around clusters, carves out islands,
        and follows complex data shapes that no straight line could capture.</p>

        <p>The boundary has no global formula — it's entirely determined
        by the training data. Move or add one point and the boundary
        changes locally around it. KNN has no "model" beyond the data itself.</p>
      `
    },

    // ── PART 2: ISSUES WITH BASIC KNN ────────────────────────────────────
    {
      step: 8,
      part: 'Part 2 · Issues with Basic KNN',
      tag: 'The K Tradeoff',
      title: 'Low K overfits. High K underfits.',
      body: `
        <p>This is the central tension in KNN — use the K slider
        to watch the boundary change:</p>

        <p><strong>K = 1:</strong> Each training point gets its own territory.
        The boundary is extremely jagged with isolated "islands."
        The model perfectly memorizes training data but generalizes poorly —
        this is <strong>overfitting</strong> (high variance, low bias).</p>

        <p><strong>K = 15+:</strong> The boundary smooths out.
        Local patterns disappear as large neighborhoods average away detail.
        The model is stable but misses fine structure —
        this is <strong>underfitting</strong> (low variance, high bias).</p>

        <p>Finding the right K requires <strong>cross-validation</strong>.
        A common starting point: K = √N where N is your number of training samples,
        then tune from there. There's no universally correct K.</p>
      `
    },
    {
      step: 9,
      part: null,
      tag: 'Choosing K Wisely',
      title: 'Why K should always be odd',
      body: `
        <p>There's an important practical rule for <strong>binary classification</strong>:
        always choose an <strong>odd K</strong>.</p>

        <p>Here's why — imagine K = 4.
        Suppose exactly 2 neighbors are Class A and 2 are Class B.
        You have a <strong>perfect tie</strong> with no clear winner.
        Most implementations resolve this by random choice or by falling back to
        K = 1 (the nearest single neighbor). Either way, it's arbitrary.</p>

        <p>With an <strong>odd K</strong>, ties in binary classification are
        mathematically impossible — one class always has the majority.
        For multiclass problems, odd K reduces (but doesn't eliminate)
        tie probability.</p>

        <p>The next step demonstrates what this tie looks like in the visualization.</p>
      `
    },
    {
      step: 10,
      part: null,
      tag: 'Even K: Ties',
      title: 'When the vote splits perfectly',
      body: `
        <p>The visualization has now switched to an <strong>even K</strong>.
        When the K nearest neighbors split equally between two classes —
        say 2 Class A and 2 Class B — a tie is declared.</p>

        <p>Watch the query point: when a tie occurs, it shows <strong>"="</strong>
        instead of a predicted class letter, and turns gray.
        The algorithm has no confident answer.</p>

        <p>Try dragging the "?" to different positions — notice how the
        tie state appears and disappears as the vote composition changes.
        At positions near class boundaries, ties are most common with even K.</p>

        <p>In practice, most frameworks (including scikit-learn) handle ties by
        breaking them using the distances to the tying classes.
        But it's still a design flaw — easily avoided by choosing an odd K.</p>
      `
    },
    {
      step: 11,
      part: null,
      tag: 'Equal-Vote Problem',
      title: 'Not all neighbors deserve equal weight',
      body: `
        <p>Here's a subtle but important flaw in standard KNN.
        Look at the K connecting lines — they all have the
        <strong>same thickness</strong>. That's not just visual style:
        each neighbor has exactly <strong>one equal vote</strong>,
        regardless of how close or far it is.</p>

        <p>Consider this scenario with K = 5:</p>

        <ul class="scenario-list">
          <li><span class="s-dot a"></span> Neighbor #1 is Class A — distance <strong>0.04</strong> (very close)</li>
          <li><span class="s-dot b"></span> Neighbors #2–5 are Class B — distances <strong>0.30–0.45</strong></li>
        </ul>

        <p>Standard KNN output: <strong>Class B wins, 4 votes to 1.</strong></p>

        <p>But intuitively, that single Class A neighbor at distance 0.04
        is <em>right next door</em>, while the four Class B neighbors are
        much farther away. Should they really outweigh it 4-to-1?</p>

        <p>The fix: instead of one flat vote per neighbor,
        give each neighbor a <strong>weight proportional to closeness</strong>.
        Closer means more influence. This is Weighted KNN.</p>
      `
    },

    // ── PART 3: ADVANCED KNN ──────────────────────────────────────────────
    {
      step: 12,
      part: 'Part 3 · Advanced KNN',
      tag: 'Weighted KNN',
      title: 'Weight votes by inverse distance',
      body: `
        <p>Weighted KNN assigns each neighbor a vote weight based on proximity:</p>

        <div class="formula">wᵢ = 1 / (dᵢ + ε)</div>

        <p>where dᵢ is the distance and ε ≈ 10⁻⁶ prevents division by zero.
        A neighbor at distance 0.1 gets weight 10. A neighbor at distance 1.0
        gets weight 1. The close neighbor is <strong>10× more influential</strong>.</p>

        <p>Notice the <strong>line thickness</strong> in the visualization:
        thicker lines = higher weight = closer neighbors.
        The concentric dashed rings around each neighbor visualize their
        relative influence area.</p>

        <p>Revisiting the scenario from the previous step with weighted voting:
        the single very-close Class A neighbor will often dominate —
        correctly overriding the four more distant Class B neighbors.
        Weighted KNN is also less sensitive to the exact choice of K,
        since distant neighbors barely influence the result.</p>

        <p>The live calculation below shows the exact math using
        the current query point position — <em>drag "?" to update it.</em></p>
      `
    },
    {
      step: 13,
      part: null,
      tag: 'Probabilistic KNN',
      title: 'Output confidence, not just a class',
      body: `
        <p>So far, KNN has given us a hard decision: "Class A."
        But in many real applications we need more nuance:
        <em>how confident is the prediction?</em></p>

        <p>Probabilistic KNN treats the <strong>fraction of K neighbors</strong>
        belonging to each class as a <em>class probability</em>:</p>

        <div class="formula">P(class c) = votes(c) / K</div>

        <p>If 3 of 5 neighbors are Class A:
        <strong>P(A) = 60%</strong>, P(B) = 40%.
        Instead of a coin-flip binary decision, you get a confidence level.</p>

        <p>These probabilities unlock powerful downstream patterns:
        <strong>thresholding</strong> (only decide when P &gt; 0.80, else say "uncertain"),
        <strong>ranking</strong> predictions by confidence,
        <strong>calibration</strong> (verifying that 60% confidence really means 60% accuracy),
        and <strong>ensemble averaging</strong> across multiple models.</p>

        <p>Drag the "?" toward the boundary between two classes — watch the probabilities
        approach 50/50. That's the model telling you it genuinely doesn't know.</p>
      `
    },

    // ── PART 4: WHEN TO USE ───────────────────────────────────────────────
    {
      step: 14,
      part: 'Part 4 · Practical Guidance',
      tag: 'When to Use KNN',
      title: 'Know its strengths and limits',
      body: `
        <p><strong>KNN works well when:</strong>
        you have a small, clean, low-dimensional dataset;
        you need a simple interpretable baseline;
        or you're doing rapid prototyping before committing
        to more complex methods. It requires zero training time.</p>

        <p><strong>KNN struggles when:</strong>
        the dataset is large (O(N) prediction cost per query);
        features are high-dimensional — the
        <strong>curse of dimensionality</strong> causes all points to become
        equidistant in high-D space, making "nearest" meaningless;
        features have very different scales (always <strong>normalize first</strong>!);
        or many features are irrelevant (distorting distances).</p>

        <p><strong>Practical rule of thumb:</strong>
        Use KNN as a strong baseline.
        If it performs well, your data has clean local structure.
        If it doesn't, that's useful information about
        the geometry of your feature space — guiding you toward
        models that make different assumptions.</p>
      `
    }
  ];

  // ── Scroll handler ─────────────────────────────────────────────────────────
  function onStep(e) {
    activeStep = e.detail.index;
    currentStep.set(activeStep);
    // Boundary auto-shows for decision boundary + K tradeoff steps
    showBoundary.set(activeStep >= 7 && activeStep <= 8);
    sandboxMode.set(false);
  }

  function goSandbox() {
    sandboxMode.set(true);
    showBoundary.set(true);
    currentStep.set(99);
    activeStep = 99;
    document.getElementById('sandbox')?.scrollIntoView({ behavior: 'smooth' });
  }

  // Sandbox gets its own independent canvas size — bigger than the story viz
  let sbCanvasW = 640;
  let sbCanvasH = 500;

  onMount(() => {
    const upd = () => {
      const vw = window.innerWidth;
      if (vw < 600) {
        canvasW  = vw - 32;
        canvasH  = Math.round(canvasW * 0.85);
        sbCanvasW = canvasW;
        sbCanvasH = canvasH;
      } else if (vw < 900) {
        canvasW  = Math.min(vw - 40, 480);
        canvasH  = Math.round(canvasW * 0.88);
        sbCanvasW = canvasW;
        sbCanvasH = canvasH;
      } else {
        // Desktop: story viz (left panel) and sandbox canvas (right of controls) differ
        canvasW   = Math.min(520, Math.round(vw * 0.44));
        canvasH   = 480;
        sbCanvasW = Math.min(700, Math.round(vw * 0.58 - 60));
        sbCanvasH = Math.min(520, Math.round(sbCanvasW * 0.76));
      }
    };
    upd();
    window.addEventListener('resize', upd);
    fetchVisitCount();
    return () => window.removeEventListener('resize', upd);
  });
</script>

<!-- ══════════════════════ NAVBAR ════════════════════════════════════════════ -->
<Navbar activeAlgo="knn" />

<!-- ══ KNN MODULE BANNER ═══════════════════════════════════════════════════ -->
<section class="knn-banner">
  <div class="knn-banner-inner">
    <a href="/" class="banner-back">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      All topics
    </a>
    <div class="banner-crumb">
      <span class="banner-cat">Classical ML</span>
      <span class="banner-sep">·</span>
      <span class="banner-num">Module 01</span>
    </div>
    <h1 class="banner-title">K-Nearest Neighbors</h1>
    <p class="banner-desc">
      A visual, step-by-step journey through KNN — from first principles to
      weighted voting and decision boundaries. No prior ML experience needed.
    </p>
    <div class="banner-meta">
      <span class="bm-pill bm-green">● Live</span>
      <span class="bm-pill">Beginner</span>
      <span class="bm-pill">14 steps</span>
      <span class="bm-pill">~10 min</span>
      <span class="bm-pill">Classification</span>
    </div>
    <button class="banner-cta" on:click={() => document.querySelector('.story')?.scrollIntoView({ behavior:'smooth' })}>
      Start learning ↓
    </button>
  </div>
  <div class="bg-dots" aria-hidden="true">
    {#each Array(18) as _, i}
      <div class="bg-dot" style="
        left:{5 + (i * 13.7 % 90)}%;top:{10 + (i * 17.3 % 80)}%;
        background:{Object.values(CC)[i % 4]};
        width:{5 + (i % 4) * 2}px;height:{5 + (i % 4) * 2}px;
        opacity:{0.07 + (i % 3) * 0.04};animation-delay:{(i * 0.3).toFixed(1)}s;"/>
    {/each}
  </div>
</section>

<!-- ══════════════════════ SCROLLY STORY ════════════════════════════════════ -->
<section class="story">
  <div class="story-wrap">

    <!-- ── LEFT: sticky visualization ─────────────────────────────────────── -->
    <div class="viz-col">
      <div class="sticky-panel">

        <!-- Step indicator pill -->
        {#if activeStep >= 1 && activeStep <= 14}
          <div class="step-pill">
            <span class="sp-dot" style="background:{Object.values(CC)[activeStep % 4]}"></span>
            <span>{activeStep} / 14</span>
          </div>
        {/if}

        <!-- Main canvas -->
        <KNNCanvas
          currentStep={activeStep}
          vizMode={curVizMode}
          width={canvasW}
          height={canvasH}
        />

        <!-- Vote badge — shows from step 6 onwards with correct mode -->
        {#if activeStep >= 6 && $knnResult}
          <VoteBadge mode={curBadgeMode} />
        {/if}

        <!-- K slider inline for K-tradeoff step -->
        {#if activeStep === 8}
          <div class="story-kslider">
            <KSlider />
          </div>
        {/if}

        <!-- Contextual hint beneath canvas -->
        <div class="canvas-hint" style="min-height:18px">
          {#if activeStep === 1 || activeStep === 2}
            Click any dot to see its class · Blue / Red / Green / Orange
          {:else if activeStep === 3}
            The white "?" is the query point — drag it around
          {:else if activeStep === 4}
            Every gray dash = one distance measurement · KNN must compute all of them
          {:else if activeStep === 5}
            Colored lines = K nearest · Dashed ring = search radius · Numbers = rank
          {:else if activeStep === 6}
            Each neighbor casts 1 equal vote · Prediction fills the "?" symbol
          {:else if activeStep === 7}
            Every background pixel = a KNN prediction at that location
          {:else if activeStep === 8}
            Use the K slider → watch the boundary smooth out as K grows
          {:else if activeStep === 9}
            Default mode shown — next step demonstrates the actual tie scenario
          {:else if activeStep === 10}
            Even K active · "?" turns "=" when votes split equally — drag to trigger
          {:else if activeStep === 11}
            All lines same thickness = equal weight regardless of distance
          {:else if activeStep === 12}
            Thicker line = closer neighbor = more vote weight
          {:else if activeStep === 13}
            Percentages = P(class) at this location · Drag to the boundary for 50/50
          {/if}
        </div>

      </div>
    </div>

    <!-- ── RIGHT: flowing narrative text ──────────────────────────────────── -->
    <div class="narr-col">
      <Scrolly on:step={onStep}>
        {#each chapters as ch}
          <div
            class="scroll-step"
            class:active={activeStep === ch.step}
            data-step={ch.step}
          >
            <div class="step-text">
              <!-- Part label (shows once per part) -->
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

              <!-- Live math breakdown for weighted + probabilistic steps -->
              {#if ch.step === 12}
                <MathBreakdown mode="weighted" />
              {:else if ch.step === 13}
                <MathBreakdown mode="probabilistic" />
              {/if}
            </div>
          </div>
        {/each}

        <!-- Final sandbox CTA -->
        <div class="scroll-step active-always" data-step={15}>
          <div class="step-text cta-step">
            <div class="step-eyebrow">
              <span class="eyebrow-line"></span>
              <span class="eyebrow-tag">Sandbox</span>
            </div>
            <h2>Now experiment for yourself</h2>
            <p class="cta-body">
              The intuition becomes real when you play with it.
              Drag the query point. Add training data. Push K to extremes.
              Watch the decision boundary reshape in real time.
            </p>
            <ul class="cta-list">
              <li><span class="li-icon">⟡</span> Drag the <strong>"?"</strong> point anywhere on the canvas</li>
              <li><span class="li-icon">⟡</span> Click the canvas to add new training points</li>
              <li><span class="li-icon">⟡</span> Slide K from 1 to 15 and watch the boundary change</li>
              <li><span class="li-icon">⟡</span> Switch distance metrics — see diamond vs circular boundaries</li>
              <li><span class="li-icon">⟡</span> Load the "Two Moons" dataset for a non-linear challenge</li>
            </ul>
            <button class="go-btn" on:click={goSandbox}>Open Sandbox →</button>
          </div>
        </div>
      </Scrolly>
    </div>

  </div>
</section>

<!-- ══════════════════════ SANDBOX ══════════════════════════════════════════ -->
<section class="sandbox" id="sandbox">
  <div class="sb-wrap">

    <!-- ── LEFT: big visualization canvas ────────────────────────────────── -->
    <div class="sb-canvas-col">

      <!-- Header sits above the canvas -->
      <div class="sb-canvas-header">
        <div>
          <span class="sb-label">Sandbox</span>
          <h2 class="sb-title">Explore KNN interactively</h2>
          <p class="sb-desc">
            <strong>Drag "?"</strong> to move the query point ·
            <strong>Click</strong> anywhere to add training points
          </p>
        </div>
        <button class="activate-btn"
          on:click={() => { sandboxMode.set(true); showBoundary.set(true); }}>
          ▶ Activate
        </button>
      </div>

      <KNNCanvas
        bind:this={sbRef}
        currentStep={99}
        vizMode="default"
        width={sbCanvasW}
        height={sbCanvasH}
        activeLabel={sbLabel}
      />

      <!-- Class selector + live prediction in one compact row -->
      <div class="sb-bottom-row">
        <div class="class-row">
          <span class="cr-label">Add as class:</span>
          {#each Object.entries(CC) as [lbl, col]}
            <button
              class="class-btn"
              class:on={sbLabel === lbl}
              style="--c:{col}"
              on:click={() => { sbLabel = lbl; if(sbRef) sbRef.activeLabel = lbl; }}
            >{lbl}</button>
          {/each}
        </div>

        {#if $knnResult}
          <div class="live-bar">
            <span class="lb-text">Prediction:</span>
            <span class="lb-class"
              style="color:{CC[$knnResult.prediction]};background:{CB[$knnResult.prediction]}"
            >Class {$knnResult.prediction}</span>
            <span class="lb-votes">({$knnResult.votes[$knnResult.prediction]}/{$k} votes)</span>
          </div>
        {/if}
      </div>

    </div>

    <!-- ── RIGHT: compact controls sidebar ────────────────────────────────── -->
    <div class="sb-ctrl-col">

      <div class="sbc">
        <KSlider />
        <p class="sbc-note">K=1 overfits · K=11 smooths</p>
      </div>

      <div class="sbc">
        <div class="toggle-row">
          <span class="ctrl-title">Decision Boundary</span>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div class="sw" class:on={$showBoundary} role="switch"
            aria-checked={$showBoundary} tabindex="0"
            on:click={() => showBoundary.update(v => !v)}>
            <div class="sw-thumb" />
          </div>
        </div>
        <p class="sbc-note">60×60 grid · ~1–2 s to compute</p>
      </div>

      <div class="sbc">
        <MetricToggle />
        <p class="sbc-note">Hover buttons to see formula</p>
      </div>

      <div class="sbc">
        <DatasetPicker />
        <p class="sbc-note">Two Moons = non-linear challenge</p>
      </div>

      <button class="reset-btn"
        on:click={() => { resetDataset('blobs'); sandboxMode.set(false); }}>
        ↺ Reset to Default
      </button>

    </div>

  </div>
</section>

<!-- ══════════════════════ SUMMARY ══════════════════════════════════════════ -->
<section class="summary">
  <div class="sum-wrap">
    <h2>What you've learned</h2>
    <p class="sum-intro">
      You've gone from first principles through advanced KNN concepts.
      Here's a compact reference.
    </p>
    <div class="sum-grid">
      {#each [
        { color:'#4E79FF', bg:'#EEF2FF', title:'Lazy learning',       body:'KNN stores all training data and defers computation to prediction time. Training is instant; prediction scales O(N).' },
        { color:'#FF4E6A', bg:'#FFF0F2', title:'Distance metrics',     body:'Euclidean, Manhattan, and Minkowski measure closeness differently. Always normalize features before computing distances.' },
        { color:'#2ECC8F', bg:'#EDFAF4', title:'The K tradeoff',       body:'K=1 overfits (high variance). K=N underfits (high bias). Cross-validation finds the sweet spot. Start at K=√N.' },
        { color:'#F5A623', bg:'#FFF7ED', title:'Use odd K',            body:'Even K risks ties in binary classification. Odd K guarantees a majority. For multiclass, odd K reduces tie probability.' },
        { color:'#7C3AED', bg:'#F5F3FF', title:'Weighted KNN',         body:'Weight = 1/distance. Close points dominate; the model is less sensitive to K choice. Default in sklearn with weights="distance".' },
        { color:'#0891B2', bg:'#E0F2FE', title:'Probabilistic output', body:'Fraction of K votes per class = class probability. Use for thresholding, ranking, calibration, and ensembles.' },
        { color:'#374151', bg:'#F3F4F6', title:'When to use KNN',      body:'Small datasets, low dimensionality, need for interpretability, or as a quick baseline. Always normalize features first.' },
        { color:'#DC2626', bg:'#FEF2F2', title:'Curse of dimensionality', body:'In high-D spaces, all pairwise distances converge. "Nearest" loses meaning. KNN degrades rapidly above ~20 features.' }
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

<!-- ══════════════════════ FOOTER ═══════════════════════════════════════════ -->
<footer>
  <div class="foot-inner">

    <!-- Col 1: Brand + visit count -->
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
      <p class="foot-desc">
        A free, open interactive series where you learn machine learning
        by exploring, not just reading.
      </p>
      {#if visitCount !== null}
        <div class="foot-counter">
          <span class="counter-dot"></span>
          <span>{visitCount.toLocaleString()} learners visited</span>
        </div>
      {/if}
    </div>

    <!-- Col 2: Algorithm series -->
    <div class="foot-col">
      <p class="foot-col-title">Algorithm Series</p>
      <ul class="foot-list">
        {#each [
          { label:'01 · K-Nearest Neighbors', live:true  },
          { label:'02 · Decision Trees',      live:false },
          { label:'03 · Naive Bayes',         live:false },
          { label:'04 · K-Means Clustering',  live:false },
          { label:'05 · Random Forests',      live:false },
          { label:'06 · SVM',                 live:false },
        ] as a}
          <li class:live={a.live} class:soon={!a.live}>
            {a.label}
            {#if a.live}<span class="fl-live">Live</span>
            {:else}<span class="fl-soon">Soon</span>{/if}
          </li>
        {/each}
      </ul>
    </div>

    <!-- Col 3: Built with + KNN topics -->
    <div class="foot-col">
      <p class="foot-col-title">About this module</p>
      <ul class="foot-list about-list">
        {#each [
          '14-step scrollytelling story',
          'Interactive sandbox',
          'Weighted & Probabilistic KNN',
          'Decision boundary visualization',
          'Live math breakdowns',
        ] as item}
          <li>{item}</li>
        {/each}
      </ul>
      <p class="foot-col-title" style="margin-top:20px">Built with</p>
      <div class="foot-tech">
        {#each ['Svelte','D3.js','Scrollama','Vite'] as t}
          <span class="tech-pill">{t}</span>
        {/each}
      </div>
    </div>

  </div>

  <!-- Bottom bar -->
  <div class="foot-bottom">
    <span>© 2025 ML Visuals · Made for learners everywhere</span>
    <div class="foot-bottom-right">
      <span>Data for educational use only</span>
    </div>
  </div>
</footer>

<!-- ══════════════════════ STYLES ════════════════════════════════════════════ -->
<style>
  /* ── RESET & BASE ─────────────────────────────────────────── */
  :global(*,*::before,*::after){ box-sizing:border-box; margin:0; padding:0; }
  :global(body){
    background: #F9FAFB;
    color: #1F2937;
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  :global(strong) { font-weight: 600; }
  :global(em)     { font-style: italic; color: #6B7280; }
  :global(code)   {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.875em;
    background: #F3F4F6;
    padding: 1px 6px;
    border-radius: 4px;
    color: #4338CA;
  }

  /* ── KNN COMPACT BANNER ───────────────────────────────────── */
  .knn-banner {
    background: linear-gradient(135deg, #EEF2FF 0%, #FAFBFE 60%, #F0FDF4 100%);
    border-bottom: 1px solid #E5E7EB;
    padding: 72px 24px 48px;
    position: relative; overflow: hidden;
  }
  .knn-banner-inner {
    max-width: 760px; margin: 0 auto;
    position: relative; z-index: 1;
  }
  .banner-back {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 13px; font-weight: 600; color: #9CA3AF;
    text-decoration: none; margin-bottom: 20px;
    transition: color 0.15s;
  }
  .banner-back:hover { color: #374151; }
  .banner-crumb {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; margin-bottom: 12px;
  }
  .banner-cat { color: #4E79FF; }
  .banner-sep { color: #D1D5DB; }
  .banner-num { color: #9CA3AF; }
  .banner-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(32px, 5vw, 56px);
    font-weight: 700; line-height: 1.1; color: #111827;
    margin-bottom: 14px;
  }
  .banner-desc {
    font-size: 16px; line-height: 1.75; color: #4B5563;
    max-width: 560px; margin-bottom: 20px;
  }
  .banner-meta {
    display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px;
  }
  .bm-pill {
    font-size: 12px; font-weight: 500;
    padding: 4px 12px; border-radius: 20px;
    background: white; border: 1px solid #E5E7EB; color: #6B7280;
  }
  .bm-green { color: #16A34A; border-color: #BBF7D0; background: #F0FDF4; }
  .banner-cta {
    background: #4E79FF; color: white;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 15px; font-weight: 700;
    padding: 12px 28px; border-radius: 10px; border: none;
    cursor: pointer; transition: background 0.15s, transform 0.15s;
  }
  .banner-cta:hover { background: #3B68EE; transform: translateY(-1px); }

  .bg-dots { position:absolute; inset:0; pointer-events:none; z-index:0; }
  .bg-dot  { position:absolute; border-radius:50%; animation: flt 7s ease-in-out infinite; }
  @keyframes flt { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }

  /* ── STORY SECTION ────────────────────────────────────────── */
  .story { padding: 0; background: #F9FAFB; }
  .story-wrap {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 7fr 5fr;
    padding: 0 24px;
  }

  /* ── LEFT: sticky viz ─────────────────────────────────────── */
  .viz-col { position: relative; }
  .sticky-panel {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 20px 32px 20px 0;
  }
  .step-pill {
    display: inline-flex; align-items: center; gap: 7px;
    font-size:11px; font-weight:600; color:#6B7280;
    background:white; border:1px solid #E5E7EB;
    padding:4px 12px; border-radius:20px;
    box-shadow:0 1px 4px rgba(0,0,0,0.05);
    align-self: flex-start;
    margin-left: 4px;
  }
  .sp-dot { width:7px; height:7px; border-radius:50%; }
  .canvas-hint {
    font-size: 12px;
    color: #9CA3AF;
    font-style: italic;
    text-align: center;
    line-height: 1.5;
    max-width: 480px;
  }
  /* Inline K slider for the K-tradeoff step */
  .story-kslider {
    width: 100%;
    max-width: 360px;
    padding: 10px 16px;
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
  }

  /* ── RIGHT: flowing narrative ─────────────────────────────── */
  .narr-col {
    padding: 80px 0 80px 48px;
    border-left: 1px solid #E5E7EB;
  }

  /* Each step = ~90vh, centered, dimmed when not active */
  .scroll-step {
    min-height: 90vh;
    display: flex;
    align-items: center;
    padding: 48px 0;
    opacity: 0.32;
    transition: opacity 0.5s ease;
  }
  .scroll-step.active,
  .scroll-step.active-always { opacity: 1; }

  .step-text { max-width: 420px; }

  /* Part label — appears at first step of each part */
  .part-label {
    font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.12em;
    color: #C4C8D8;
    margin-bottom: 20px;
    padding: 4px 0;
    border-top: 1px solid #E5E7EB;
  }

  .step-eyebrow {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }
  .eyebrow-line {
    width: 22px; height: 1.5px;
    background: #D1D5DB;
    flex-shrink: 0;
  }
  .eyebrow-tag {
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: #4E79FF;
  }
  .step-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: #D1D5DB;
    margin-left: auto;
  }

  h2 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 28px; font-weight: 700;
    color: #111827; line-height: 1.22;
    margin-bottom: 18px;
  }

  /* Prose paragraphs — no boxes, just text */
  .body-text :global(p) {
    font-size: 15.5px;
    line-height: 1.85;
    color: #4B5563;
    margin-bottom: 14px;
  }
  .body-text :global(p:last-child) { margin-bottom: 0; }
  .body-text :global(strong)       { color: #111827; font-weight: 600; }
  .body-text :global(em)           { color: #6B7280; font-style: italic; }

  /* Scenario list — for step 11 equal-vote problem */
  .body-text :global(.scenario-list) {
    list-style: none;
    margin: 12px 0 14px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .body-text :global(.scenario-list li) {
    font-size: 14.5px; color: #4B5563;
    display: flex; align-items: center; gap: 9px;
    line-height: 1.6;
  }
  .body-text :global(.s-dot) {
    width: 10px; height: 10px; border-radius: 50%;
    flex-shrink: 0; display: inline-block;
  }
  .body-text :global(.s-dot.a) { background: #4E79FF; }
  .body-text :global(.s-dot.b) { background: #FF4E6A; }

  /* Inline formula block */
  :global(.formula) {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13.5px;
    background: white;
    border: 1px solid #E5E7EB;
    border-left: 3px solid #4E79FF;
    padding: 11px 16px;
    border-radius: 0 8px 8px 0;
    color: #2452CC;
    margin: 14px 0;
    display: block;
  }

  /* CTA step */
  .cta-step h2 { color: #111827; }
  .cta-body {
    font-size: 15px; line-height: 1.8;
    color: #4B5563; margin-bottom: 20px;
  }
  .cta-list {
    list-style: none;
    display: flex; flex-direction: column; gap: 10px;
    margin-bottom: 28px;
  }
  .cta-list li {
    font-size: 14px; color: #4B5563; line-height: 1.7;
    display: flex; gap: 10px; align-items: flex-start;
  }
  .li-icon { color: #4E79FF; font-size: 12px; margin-top: 3px; flex-shrink: 0; }
  .go-btn {
    padding: 13px 28px;
    background: #4E79FF; color: white;
    border: none; border-radius: 10px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(78,121,255,0.3);
  }
  .go-btn:hover { background: #3B65E8; transform: translateY(-1px); }

  /* ── SANDBOX ──────────────────────────────────────────────── */
  .sandbox {
    min-height: 100vh;
    display: flex; align-items: center;
    background: white;
    border-top: 1px solid #E5E7EB;
    padding: 32px 24px;
  }
  .sb-wrap {
    max-width: 1200px; width: 100%; margin: 0 auto;
    display: grid;
    /* Canvas LEFT (big) | Controls RIGHT (compact sidebar) */
    grid-template-columns: 1fr 260px;
    gap: 32px;
    align-items: start;
  }

  /* ── Left: canvas column ── */
  .sb-canvas-col { display: flex; flex-direction: column; gap: 12px; }

  .sb-canvas-header {
    display: flex; justify-content: space-between;
    align-items: flex-start; gap: 16px; flex-wrap: wrap;
  }
  .sb-label {
    font-size: 10px; font-weight: 800; color: #2ECC8F;
    text-transform: uppercase; letter-spacing: 0.12em;
    display: block; margin-bottom: 4px;
  }
  .sb-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 24px; font-weight: 700; color: #111827;
    line-height: 1.2; margin: 0 0 6px;
  }
  .sb-desc { font-size: 13px; line-height: 1.6; color: #6B7280; margin: 0; }

  .activate-btn {
    flex-shrink: 0;
    padding: 10px 20px;
    background: #2ECC8F; color: white;
    border: none; border-radius: 9px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
    box-shadow: 0 2px 10px rgba(46,204,143,0.25);
    white-space: nowrap;
  }
  .activate-btn:hover { background: #27B87F; transform: translateY(-1px); }

  .sb-bottom-row {
    display: flex; align-items: center;
    justify-content: space-between; flex-wrap: wrap; gap: 10px;
  }
  .class-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .cr-label { font-size: 12px; color: #9CA3AF; }
  .class-btn {
    width: 34px; height: 34px; border-radius: 50%;
    border: 2px solid var(--c);
    background: transparent; color: var(--c);
    font-family: 'Space Grotesk', sans-serif;
    font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all 0.18s;
  }
  .class-btn.on { background: var(--c); color: white; }
  .live-bar {
    display: inline-flex; align-items: center; gap: 8px;
    background: #F9FAFB; border: 1px solid #E5E7EB;
    border-radius: 9px; padding: 8px 14px;
  }
  .lb-text  { font-size: 12px; color: #6B7280; }
  .lb-class {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 14px; font-weight: 700; padding: 2px 10px; border-radius: 6px;
  }
  .lb-votes { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #9CA3AF; }

  /* ── Right: controls sidebar ── */
  .sb-ctrl-col {
    display: flex; flex-direction: column; gap: 8px;
    position: sticky; top: 32px;   /* sidebar stays visible while canvas scrolls */
  }
  .sbc {
    background: #FAFAFA; border: 1px solid #E5E7EB;
    border-radius: 10px; padding: 12px 14px;
    display: flex; flex-direction: column; gap: 6px;
    transition: border-color 0.2s;
  }
  .sbc:hover { border-color: #C4C8D8; }
  .sbc-note {
    font-size: 10.5px; color: #B0B8CC; font-style: italic;
    border-top: 1px solid #F0F2F7; padding-top: 5px; margin-top: 1px;
  }
  .ctrl-title {
    font-size: 11px; font-weight: 700; color: #6B7280;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .toggle-row { display:flex; justify-content:space-between; align-items:center; gap:8px; }
  .sw {
    width: 38px; height: 22px; border-radius: 11px;
    background: #E5E7EB; position: relative;
    cursor: pointer; transition: background 0.25s; flex-shrink: 0;
  }
  .sw.on { background: #4E79FF; }
  .sw-thumb {
    width: 16px; height: 16px; border-radius: 50%; background: white;
    position: absolute; top: 3px; left: 3px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.25s;
  }
  .sw.on .sw-thumb { transform: translateX(16px); }
  .reset-btn {
    padding: 10px; border-radius: 9px;
    border: 1px solid #FEE2E2; background: #FFF8F8; color: #EF4444;
    font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; width: 100%;
  }
  .reset-btn:hover { background: #FEE2E2; }



  /* ── SUMMARY ──────────────────────────────────────────────── */
  .summary {
    background: #F3F4F6;
    border-top: 1px solid #E5E7EB;
    padding: 80px 24px;
  }
  .sum-wrap { max-width: 1200px; margin: 0 auto; }
  .summary h2 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 30px; font-weight: 700;
    color: #111827; margin-bottom: 10px; text-align: center;
  }
  .sum-intro {
    text-align: center; font-size: 15px; color: #6B7280;
    margin-bottom: 40px;
  }
  .sum-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }
  .sum-card {
    background: white; border: 1px solid #E5E7EB;
    border-radius: 12px; padding: 20px;
    display: flex; flex-direction: column; gap: 8px;
    box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  }
  .sc-bar {
    width: 28px; height: 3px; border-radius: 2px; margin-bottom: 4px;
  }
  .sum-card strong { font-size: 14px; font-weight: 700; }
  .sum-card p      { font-size: 13px; line-height: 1.7; color: #6B7280; }

  /* ── FOOTER ───────────────────────────────────────────────── */
  footer {
    background: #111827;
    border-top: 1px solid #1F2937;
    padding: 56px 24px 0;
  }
  .foot-inner {
    max-width: 1200px; margin: 0 auto;
    display: grid;
    grid-template-columns: 2fr 1.4fr 1.6fr;
    gap: 48px;
    padding-bottom: 48px;
    border-bottom: 1px solid #1F2937;
  }

  /* Brand col */
  .foot-brand-col { display: flex; flex-direction: column; gap: 10px; }
  .foot-brand {
    display: flex; align-items: center; gap: 9px; margin-bottom: 2px;
  }
  .foot-brand-name {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 16px; font-weight: 700; color: white;
  }
  .foot-tagline {
    font-size: 14px; color: #9CA3AF; font-style: italic;
  }
  .foot-desc {
    font-size: 13px; color: #4B5563; line-height: 1.7; max-width: 300px;
  }
  .foot-counter {
    display: inline-flex; align-items: center; gap: 7px; margin-top: 6px;
    background: #1F2937; border: 1px solid #374151;
    padding: 6px 14px; border-radius: 20px;
    font-size: 12px; color: #9CA3AF; font-weight: 500;
    width: fit-content;
  }
  .counter-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #2ECC8F; flex-shrink: 0;
    box-shadow: 0 0 6px #2ECC8F88;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  /* List cols */
  .foot-col { display: flex; flex-direction: column; gap: 12px; }
  .foot-col-title {
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: #4B5563;
  }
  .foot-list {
    list-style: none; display: flex; flex-direction: column; gap: 8px;
  }
  .foot-list li {
    font-size: 13px; color: #6B7280;
    display: flex; align-items: center; gap: 8px;
  }
  .foot-list li.live  { color: #9CA3AF; }
  .foot-list li.soon  { color: #374151; }
  .foot-list.about-list li::before {
    content: '—'; color: #374151; flex-shrink: 0; font-size: 11px;
  }
  .fl-live {
    font-size: 9px; font-weight: 700;
    background: #064E3B; color: #34D399;
    padding: 1px 7px; border-radius: 4px;
    letter-spacing: 0.06em; text-transform: uppercase; margin-left: auto;
  }
  .fl-soon {
    font-size: 9px; font-weight: 600;
    background: #1F2937; color: #4B5563;
    padding: 1px 7px; border-radius: 4px;
    letter-spacing: 0.04em; margin-left: auto;
  }
  .foot-tech {
    display: flex; flex-wrap: wrap; gap: 6px;
  }
  .tech-pill {
    font-size: 11px; font-weight: 500;
    background: #1F2937; color: #6B7280;
    border: 1px solid #374151;
    padding: 3px 10px; border-radius: 6px;
  }

  /* Bottom bar */
  .foot-bottom {
    max-width: 1200px; margin: 0 auto;
    display: flex; justify-content: space-between;
    align-items: center; padding: 18px 0;
    font-size: 12px; color: #374151;
    flex-wrap: wrap; gap: 8px;
  }
  .foot-bottom-right { display: flex; gap: 20px; }

  /* ── RESPONSIVE ───────────────────────────────────────────── */

  /* ── Tablet portrait (≤ 900px) ── */
  @media (max-width: 900px) {
    /* Story: stack vertically, viz on top */
    .story-wrap   { grid-template-columns: 1fr; padding: 0 16px; }
    .viz-col      { order: 1; }
    .narr-col     { order: 2; padding: 40px 0 60px; border-left: none; border-top: 1px solid #E5E7EB; }
    .sticky-panel { position: static; height: auto; padding: 24px 0 0; }
    .scroll-step  { min-height: 70vh; }

    /* Sandbox: stack vertically — canvas on top, controls below */
    .sandbox        { align-items: flex-start; min-height: unset; padding: 40px 16px 60px; }
    .sb-wrap        { grid-template-columns: 1fr; gap: 24px; }
    .sb-canvas-col  { order: 1; }
    .sb-ctrl-col    { order: 2; position: static; width: 100%;
                      display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .sbc.full       { grid-column: 1 / -1; }

    /* Footer */
    .foot-inner { grid-template-columns: 1fr 1fr; }
    .foot-brand-col { grid-column: 1 / -1; }
  }

  /* ── Mobile (≤ 600px) ── */
  @media (max-width: 600px) {
    /* Story */
    .story-wrap   { padding: 0 12px; }
    .narr-col     { padding: 32px 0 48px; }
    .step-text    { max-width: 100%; }
    h2            { font-size: 22px; }
    .scroll-step  { min-height: 60vh; padding: 32px 0; }

    /* Sandbox: single-column stack */
    .sandbox        { padding: 32px 12px 48px; }
    .sb-ctrl-col    { display: flex; flex-direction: column; gap: 8px; }
    .sbc.full       { /* fills naturally */ }
    .sb-bottom-row  { flex-direction: column; align-items: flex-start; gap: 8px; }

    /* Summary */
    .sum-grid { grid-template-columns: 1fr; }

    /* Footer */
    .foot-inner { grid-template-columns: 1fr; gap: 32px; }
    .foot-bottom { flex-direction: column; align-items: flex-start; gap: 6px; }
  }
</style>
