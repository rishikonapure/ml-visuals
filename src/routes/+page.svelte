<script>
  import { onMount } from 'svelte';
  import Navbar from '$lib/components/layout/Navbar.svelte';
  import { categories } from '$lib/data/algoRegistry.js';

  // ── Visit counter ──────────────────────────────────────────────────────────
  let visitCount = null;
  async function fetchVisitCount() {
    try {
      const res = await fetch('https://api.countapi.xyz/hit/mlvisuals-io/knn-page');
      if (res.ok) { const d = await res.json(); visitCount = d.value; }
    } catch (_) {}
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalTopics = categories.flatMap(c => c.items).length;
  const liveTopics  = categories.flatMap(c => c.items).filter(a => a.live).length;

  // ── Filter / active category ───────────────────────────────────────────────
  let activeFilter = 'all'; // 'all' | category id
  $: visibleCats = activeFilter === 'all'
    ? categories
    : categories.filter(c => c.id === activeFilter);

  // ── Difficulty colour ──────────────────────────────────────────────────────
  function diffColor(d) {
    if (d === 'Beginner')     return { bg:'#F0FDF4', color:'#16A34A' };
    if (d === 'Intermediate') return { bg:'#FFF7ED', color:'#EA580C' };
    return                           { bg:'#F5F3FF', color:'#7C3AED' };
  }

  onMount(fetchVisitCount);
</script>

<svelte:head>
  <title>ML Visuals — Interactive Machine Learning Explainers</title>
  <meta name="description" content="Step-by-step visual explorations of ML algorithms. Learn KNN, Decision Trees, Transformers and more — interactively, from first principles." />
</svelte:head>

<Navbar activeAlgo="" />

<!-- ══════════════════════ HERO ═════════════════════════════════════════════ -->
<section class="hero">

  <div class="bg-dots" aria-hidden="true">
    {#each Array(24) as _, i}
      <div class="bg-dot" style="
        left:{5+(i*14.1%88)}%;top:{8+(i*19.3%82)}%;
        background:{['#4E79FF','#FF4E6A','#2ECC8F','#FF9F1C','#7C3AED'][i%5]};
        width:{6+(i%4)*3}px;height:{6+(i%4)*3}px;
        opacity:{0.05+(i%3)*0.03};animation-delay:{(i*0.35).toFixed(1)}s"/>
    {/each}
  </div>

  <div class="hero-inner">
    <!-- Left -->
    <div class="hero-left">
      <div class="hero-badge">
        <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="10" stroke="#4E79FF" stroke-width="1.8"/>
          <circle cx="6"  cy="9"  r="2.2" fill="#4E79FF"/>
          <circle cx="14" cy="7"  r="2.2" fill="#FF4E6A"/>
          <circle cx="10" cy="15" r="2.2" fill="#2ECC8F"/>
          <circle cx="16" cy="14" r="1.6" fill="#FF9F1C" opacity="0.8"/>
        </svg>
        ML Visuals
      </div>

      <h1>Machine learning,<br/><span class="accent">made visible.</span></h1>

      <p class="hero-sub">
        Every major ML algorithm — explained visually, interactively,
        and from first principles. No lectures. No textbooks.
        Just you and the algorithm.
      </p>

      <div class="hero-stats">
        <div class="stat">
          <span class="stat-n">{totalTopics}</span>
          <span class="stat-l">Topics</span>
        </div>
        <div class="stat-div"></div>
        <div class="stat">
          <span class="stat-n">5</span>
          <span class="stat-l">Categories</span>
        </div>
        <div class="stat-div"></div>
        <div class="stat">
          <span class="stat-n">{liveTopics}</span>
          <span class="stat-l">Live now</span>
        </div>
        <div class="stat-div"></div>
        <div class="stat">
          <span class="stat-n">Free</span>
          <span class="stat-l">Always</span>
        </div>
      </div>

      <div class="hero-actions">
        <a href="/knn" class="btn-primary">Start with KNN &rarr;</a>
        <a href="#catalog" class="btn-secondary"
          on:click|preventDefault={() => document.getElementById('catalog')?.scrollIntoView({ behavior:'smooth' })}>
          Browse all topics
        </a>
      </div>
    </div>

    <!-- Right: Featured KNN card -->
    <div class="hero-right">
      <div class="featured-card">
        <div class="fc-eyebrow">
          <span class="fc-live-dot"></span>
          Live Now
        </div>
        <div class="fc-num">01</div>
        <h2 class="fc-title">K-Nearest Neighbors</h2>
        <p class="fc-desc">
          Classify new data by majority vote of K closest training examples.
          Watch every step happen on an interactive canvas — distances,
          neighbors, decision boundaries and more.
        </p>
        <div class="fc-tags">
          {#each ['Classification','Non-parametric','Beginner','14 steps','~10 min'] as t}
            <span class="fc-tag">{t}</span>
          {/each}
        </div>
        <div class="fc-concepts">
          {#each ['Distance metrics','Majority voting','K tradeoff','Weighted KNN','Decision boundary'] as c}
            <span class="fc-concept">✓ {c}</span>
          {/each}
        </div>
        <a href="/knn" class="fc-cta">Launch interactive &rarr;</a>
        <!-- mini canvas preview dots -->
        <div class="fc-preview" aria-hidden="true">
          {#each [
            {x:22,y:35,c:'#4E79FF'},{x:38,y:20,c:'#FF4E6A'},{x:55,y:42,c:'#4E79FF'},
            {x:30,y:58,c:'#2ECC8F'},{x:65,y:28,c:'#FF4E6A'},{x:78,y:55,c:'#2ECC8F'},
            {x:48,y:68,c:'#4E79FF'},{x:18,y:72,c:'#2ECC8F'},{x:72,y:15,c:'#FF4E6A'},
          ] as d}
            <div class="fp-dot" style="left:{d.x}%;top:{d.y}%;background:{d.c}"/>
          {/each}
          <!-- query point -->
          <div class="fp-query">?</div>
          <!-- distance rings -->
          <div class="fp-ring fp-ring1"></div>
          <div class="fp-ring fp-ring2"></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ══════════════════════ CATALOG ══════════════════════════════════════════ -->
<section class="catalog" id="catalog">

  <!-- Filter bar -->
  <div class="filter-bar">
    <div class="filter-inner">
      <button
        class="filter-btn" class:active={activeFilter === 'all'}
        on:click={() => activeFilter = 'all'}>
        All Topics
        <span class="filter-count">{totalTopics}</span>
      </button>
      {#each categories as cat}
        <button
          class="filter-btn" class:active={activeFilter === cat.id}
          style="--fc:{cat.color}"
          on:click={() => activeFilter = activeFilter === cat.id ? 'all' : cat.id}>
          {cat.label}
          <span class="filter-count">{cat.items.length}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Category rows -->
  <div class="cat-rows">
    {#each visibleCats as cat}
      <div class="cat-row">

        <!-- Row header -->
        <div class="row-header">
          <div class="row-hl" style="background:{cat.color}"></div>
          <div class="row-header-text">
            <h2 class="row-title" style="color:{cat.color}">{cat.label}</h2>
            <p class="row-sub">
              {cat.items.length} topics ·
              {cat.items.filter(a=>a.live).length > 0
                ? `${cat.items.filter(a=>a.live).length} live`
                : 'coming soon'}
            </p>
          </div>
          <div class="row-progress-wrap">
            <div class="row-progress-track">
              <div class="row-progress-fill"
                style="width:{cat.items.filter(a=>a.live).length/cat.items.length*100}%;background:{cat.color}">
              </div>
            </div>
            <span class="row-progress-label" style="color:{cat.color}">
              {cat.items.filter(a=>a.live).length}/{cat.items.length} live
            </span>
          </div>
        </div>

        <!-- Horizontal scroll grid -->
        <div class="algo-row">
          {#each cat.items as algo, idx}
            {@const dc = diffColor(algo.difficulty)}
            <a
              href={algo.live ? algo.route : `/${algo.id}`}
              class="algo-card"
              class:algo-live={algo.live}
              class:algo-soon={!algo.live}
              style="--cc:{cat.color};--cbg:{cat.bg}"
            >
              <!-- Top color bar -->
              <div class="ac-bar" style="background:{algo.live ? cat.color : '#E5E7EB'}"></div>

              <div class="ac-body">
                <!-- Number + live badge row -->
                <div class="ac-top">
                  <span class="ac-num">{String(idx+1).padStart(2,'0')}</span>
                  {#if algo.live}
                    <span class="ac-live-badge">● Live</span>
                  {:else}
                    <span class="ac-soon-badge">Soon</span>
                  {/if}
                </div>

                <!-- Title -->
                <h3 class="ac-title">{algo.label}</h3>

                <!-- Tag -->
                <span class="ac-tag">{algo.tag}</span>

                <!-- Description (live cards only) -->
                {#if algo.live}
                  <p class="ac-desc">{algo.description}</p>
                {/if}

                <!-- Meta row -->
                <div class="ac-meta">
                  <span class="ac-diff" style="background:{dc.bg};color:{dc.color}">
                    {algo.difficulty}
                  </span>
                  {#if algo.readTime}
                    <span class="ac-time">{algo.readTime}</span>
                  {/if}
                  {#if algo.steps}
                    <span class="ac-steps">{algo.steps} steps</span>
                  {/if}
                </div>

                <!-- CTA -->
                {#if algo.live}
                  <div class="ac-cta">Start &rarr;</div>
                {:else}
                  <div class="ac-coming">Notify me</div>
                {/if}
              </div>
            </a>
          {/each}
        </div>

      </div>
    {/each}
  </div>

</section>

<!-- ══════════════════════ FOOTER ═══════════════════════════════════════════ -->
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
      <p class="foot-desc">A free, interactive series where you learn by exploring, not just reading.</p>
      {#if visitCount !== null}
        <div class="foot-counter">
          <span class="counter-dot"></span>
          <span>{visitCount.toLocaleString()} learners visited</span>
        </div>
      {/if}
    </div>

    <div class="foot-col">
      <p class="foot-col-title">Categories</p>
      <ul class="foot-list">
        {#each categories as cat}
          <li style="--cc:{cat.color}">
            <span class="foot-cat-dot" style="background:{cat.color}"></span>
            {cat.label}
            <span class="foot-cat-count">{cat.items.length}</span>
          </li>
        {/each}
      </ul>
    </div>

    <div class="foot-col">
      <p class="foot-col-title">Live now</p>
      <ul class="foot-list">
        {#each categories.flatMap(c=>c.items).filter(a=>a.live) as algo}
          <li><a href={algo.route} class="foot-live-link">✓ {algo.label}</a></li>
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
  <div class="foot-bottom">
    <span>© 2025 ML Visuals · Made for learners everywhere</span>
    <span>Data for educational use only</span>
  </div>
</footer>

<style>
  :global(*,*::before,*::after){ box-sizing:border-box; margin:0; padding:0; }
  :global(body){
    background:#F9FAFB; color:#1F2937;
    font-family:'Inter',sans-serif; -webkit-font-smoothing:antialiased; overflow-x:hidden;
  }

  /* ── HERO ─────────────────────────────────────────────────── */
  .hero {
    min-height: 92vh;
    background: linear-gradient(150deg,#EEF2FF 0%,#FAFBFE 50%,#F0FDF4 100%);
    border-bottom: 1px solid #E5E7EB;
    padding: 100px 24px 60px;
    position: relative; overflow: hidden;
  }
  .bg-dots { position:absolute;inset:0;pointer-events:none;z-index:0; }
  .bg-dot  { position:absolute;border-radius:50%;animation:flt 8s ease-in-out infinite; }
  @keyframes flt { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }

  .hero-inner {
    max-width:1200px; margin:0 auto;
    display:grid; grid-template-columns:1fr 480px;
    gap:56px; align-items:center;
    position:relative; z-index:1;
  }

  /* Left */
  .hero-badge {
    display:inline-flex; align-items:center; gap:8px;
    font-size:13px; font-weight:700; color:#4E79FF;
    background:white; border:1px solid #C7D4FF;
    padding:6px 16px; border-radius:20px;
    box-shadow:0 2px 10px rgba(78,121,255,0.1);
    margin-bottom:24px;
  }
  h1 {
    font-family:'Space Grotesk',sans-serif;
    font-size:clamp(40px,5.5vw,68px);
    font-weight:700; line-height:1.08;
    color:#111827; margin-bottom:18px;
  }
  .accent { color:#4E79FF; }
  .hero-sub {
    font-size:17px; line-height:1.75; color:#4B5563;
    max-width:480px; margin-bottom:28px;
  }

  /* Stats */
  .hero-stats {
    display:flex; align-items:center; gap:0;
    margin-bottom:32px; flex-wrap:wrap;
  }
  .stat { display:flex; flex-direction:column; gap:2px; padding:0 20px; }
  .stat:first-child { padding-left:0; }
  .stat-n { font-family:'Space Grotesk',sans-serif; font-size:26px; font-weight:700; color:#111827; }
  .stat-l { font-size:11px; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.07em; font-weight:600; }
  .stat-div { width:1px; height:36px; background:#E5E7EB; }

  /* Actions */
  .hero-actions { display:flex; gap:12px; flex-wrap:wrap; }
  .btn-primary {
    background:#4E79FF; color:white;
    font-family:'Space Grotesk',sans-serif; font-size:15px; font-weight:700;
    padding:13px 28px; border-radius:10px; text-decoration:none;
    transition:background 0.15s,transform 0.15s;
    display:inline-block;
  }
  .btn-primary:hover { background:#3B68EE; transform:translateY(-1px); }
  .btn-secondary {
    background:white; color:#374151;
    font-size:15px; font-weight:600;
    padding:13px 24px; border-radius:10px;
    border:1px solid #E5E7EB; text-decoration:none;
    transition:background 0.15s; display:inline-block;
  }
  .btn-secondary:hover { background:#F9FAFB; }

  /* Featured KNN card (hero right) */
  .featured-card {
    background:white; border:1.5px solid #C7D4FF;
    border-radius:20px; padding:28px;
    box-shadow:0 8px 40px rgba(78,121,255,0.12);
    position:relative; overflow:hidden;
  }
  .fc-eyebrow {
    display:inline-flex; align-items:center; gap:6px;
    font-size:11px; font-weight:700; color:#16A34A;
    text-transform:uppercase; letter-spacing:0.08em;
    margin-bottom:12px;
  }
  .fc-live-dot {
    width:7px; height:7px; border-radius:50%; background:#16A34A;
    animation:pulse 2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
  .fc-num {
    font-family:'JetBrains Mono',monospace;
    font-size:13px; color:#C7D4FF; margin-bottom:6px;
  }
  .fc-title {
    font-family:'Space Grotesk',sans-serif;
    font-size:24px; font-weight:700; color:#111827;
    margin-bottom:10px;
  }
  .fc-desc {
    font-size:13px; line-height:1.7; color:#6B7280; margin-bottom:14px;
  }
  .fc-tags { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px; }
  .fc-tag {
    font-size:11px; font-weight:500;
    background:#F3F4F6; color:#6B7280;
    padding:3px 10px; border-radius:20px; border:1px solid #E5E7EB;
  }
  .fc-concepts { display:flex; flex-direction:column; gap:4px; margin-bottom:20px; }
  .fc-concept { font-size:12px; color:#4E79FF; font-weight:500; }
  .fc-cta {
    display:inline-block; background:#4E79FF; color:white;
    font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:700;
    padding:10px 22px; border-radius:9px; text-decoration:none;
    transition:background 0.15s; position:relative; z-index:2;
  }
  .fc-cta:hover { background:#3B68EE; }

  /* Mini canvas preview in card */
  .fc-preview {
    position:absolute; bottom:0; right:0;
    width:160px; height:130px;
    opacity:0.18; pointer-events:none; overflow:hidden;
  }
  .fp-dot {
    position:absolute; width:10px; height:10px; border-radius:50%;
    transform:translate(-50%,-50%);
    box-shadow:0 0 0 2px white;
  }
  .fp-query {
    position:absolute; left:50%; top:50%;
    transform:translate(-50%,-50%);
    width:22px; height:22px; border-radius:50%;
    background:#2D3047; border:3px solid white;
    display:flex; align-items:center; justify-content:center;
    font-size:10px; font-weight:800; color:white;
  }
  .fp-ring {
    position:absolute; left:50%; top:50%;
    border-radius:50%; border:1.5px dashed #F5A623;
    transform:translate(-50%,-50%);
    animation:spin 10s linear infinite;
  }
  .fp-ring1 { width:60px; height:60px; }
  .fp-ring2 { width:100px; height:100px; opacity:0.5; animation-direction:reverse; }
  @keyframes spin { to { transform:translate(-50%,-50%) rotate(360deg); } }

  /* ── CATALOG ──────────────────────────────────────────────── */
  .catalog { background:#F9FAFB; padding:0 0 80px; }

  /* Filter bar */
  .filter-bar {
    position:sticky; top:56px; z-index:50;
    background:rgba(249,250,251,0.95);
    backdrop-filter:blur(10px);
    border-bottom:1px solid #E5E7EB;
    padding:0 24px;
  }
  .filter-inner {
    max-width:1200px; margin:0 auto;
    display:flex; gap:4px; overflow-x:auto;
    padding:12px 0;
    scrollbar-width:none;
  }
  .filter-inner::-webkit-scrollbar { display:none; }
  .filter-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:7px 16px; border-radius:20px;
    font-size:13px; font-weight:600; color:#6B7280;
    background:white; border:1px solid #E5E7EB;
    cursor:pointer; white-space:nowrap;
    font-family:inherit; transition:all 0.15s;
    flex-shrink:0;
  }
  .filter-btn:hover { border-color:#D1D5DB; color:#374151; }
  .filter-btn.active {
    background:var(--fc,#4E79FF);
    border-color:var(--fc,#4E79FF);
    color:white;
  }
  .filter-btn:first-child.active { background:#111827; border-color:#111827; }
  .filter-count {
    font-size:11px; font-weight:700;
    background:rgba(0,0,0,0.12); padding:1px 7px; border-radius:10px;
  }
  .filter-btn.active .filter-count { background:rgba(255,255,255,0.25); }

  /* Category rows */
  .cat-rows { max-width:1200px; margin:0 auto; padding:0 24px; }

  .cat-row { padding:48px 0 0; }
  .row-header {
    display:flex; align-items:center; gap:16px; margin-bottom:20px;
  }
  .row-hl { width:4px; height:36px; border-radius:2px; flex-shrink:0; }
  .row-header-text { flex:1; }
  .row-title {
    font-family:'Space Grotesk',sans-serif;
    font-size:20px; font-weight:700; margin-bottom:2px;
  }
  .row-sub { font-size:13px; color:#9CA3AF; }
  .row-progress-wrap {
    display:flex; align-items:center; gap:10px; margin-left:auto;
  }
  .row-progress-track {
    width:100px; height:4px; background:#E5E7EB; border-radius:2px; overflow:hidden;
  }
  .row-progress-fill { height:100%; border-radius:2px; }
  .row-progress-label { font-size:11px; font-weight:700; font-family:'JetBrains Mono',monospace; }

  /* Algo card row - horizontal scroll */
  .algo-row {
    display:flex; gap:16px;
    overflow-x:auto; padding-bottom:16px;
    scrollbar-width:thin; scrollbar-color:#E5E7EB transparent;
  }
  .algo-row::-webkit-scrollbar { height:4px; }
  .algo-row::-webkit-scrollbar-track { background:transparent; }
  .algo-row::-webkit-scrollbar-thumb { background:#E5E7EB; border-radius:2px; }

  /* Individual algo card */
  .algo-card {
    flex-shrink:0; width:220px;
    background:white; border:1.5px solid #E5E7EB;
    border-radius:14px; overflow:hidden;
    text-decoration:none; color:inherit;
    display:flex; flex-direction:column;
    transition:transform 0.18s, box-shadow 0.18s, border-color 0.18s;
    position:relative;
  }
  .algo-live { cursor:pointer; }
  .algo-live:hover {
    transform:translateY(-4px);
    box-shadow:0 12px 32px rgba(0,0,0,0.12);
    border-color:var(--cc);
  }
  .algo-soon { cursor:default; opacity:0.7; }
  .algo-soon:hover { opacity:0.85; }

  .ac-bar { height:4px; }
  .ac-body { padding:16px; display:flex; flex-direction:column; gap:8px; flex:1; }
  .ac-top { display:flex; align-items:center; justify-content:space-between; }
  .ac-num {
    font-family:'JetBrains Mono',monospace;
    font-size:11px; color:#D1D5DB; font-weight:700;
  }
  .ac-live-badge {
    font-size:9px; font-weight:700; text-transform:uppercase;
    letter-spacing:0.06em; color:#16A34A;
    background:#DCFCE7; padding:2px 8px; border-radius:4px;
  }
  .ac-soon-badge {
    font-size:9px; font-weight:600;
    background:#F3F4F6; color:#D1D5DB;
    padding:2px 8px; border-radius:4px;
  }
  .ac-title {
    font-family:'Space Grotesk',sans-serif;
    font-size:14px; font-weight:700; color:#111827;
    line-height:1.3;
  }
  .algo-soon .ac-title { color:#9CA3AF; }
  .ac-tag { font-size:10.5px; color:#9CA3AF; }
  .ac-desc {
    font-size:11.5px; color:#6B7280; line-height:1.6;
    display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;
  }
  .ac-meta { display:flex; gap:5px; flex-wrap:wrap; margin-top:auto; }
  .ac-diff {
    font-size:10px; font-weight:700; padding:2px 8px;
    border-radius:4px; white-space:nowrap;
  }
  .ac-time,.ac-steps {
    font-size:10px; color:#C4C8D8;
    font-family:'JetBrains Mono',monospace;
  }
  .ac-cta {
    font-size:12px; font-weight:700; color:var(--cc);
    margin-top:4px;
    transition:gap 0.15s;
  }
  .algo-live:hover .ac-cta { letter-spacing:0.02em; }
  .ac-coming { font-size:11px; color:#D1D5DB; margin-top:4px; }

  /* ── FOOTER ───────────────────────────────────────────────── */
  footer { background:#111827; border-top:1px solid #1F2937; padding:56px 24px 0; }
  .foot-inner {
    max-width:1200px; margin:0 auto;
    display:grid; grid-template-columns:2fr 1.2fr 1.6fr;
    gap:48px; padding-bottom:48px; border-bottom:1px solid #1F2937;
  }
  .foot-brand-col { display:flex; flex-direction:column; gap:10px; }
  .foot-brand { display:flex; align-items:center; gap:9px; }
  .foot-brand-name { font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:700; color:white; }
  .foot-tagline { font-size:14px; color:#9CA3AF; font-style:italic; }
  .foot-desc   { font-size:13px; color:#4B5563; line-height:1.7; max-width:280px; }
  .foot-counter {
    display:inline-flex; align-items:center; gap:7px; margin-top:4px;
    background:#1F2937; border:1px solid #374151;
    padding:6px 14px; border-radius:20px;
    font-size:12px; color:#9CA3AF; font-weight:500; width:fit-content;
  }
  .counter-dot {
    width:7px; height:7px; border-radius:50%;
    background:#2ECC8F; box-shadow:0 0 6px #2ECC8F88;
    animation:pulse 2s ease-in-out infinite;
  }
  .foot-col { display:flex; flex-direction:column; gap:12px; }
  .foot-col-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#4B5563; }
  .foot-list { list-style:none; display:flex; flex-direction:column; gap:8px; }
  .foot-list li {
    font-size:13px; color:#6B7280;
    display:flex; align-items:center; gap:8px;
  }
  .foot-cat-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
  .foot-cat-count { font-size:11px; color:#374151; margin-left:auto; font-family:'JetBrains Mono',monospace; }
  .foot-live-link { color:#6B7280; text-decoration:none; }
  .foot-live-link:hover { color:#E5E7EB; }
  .foot-tech { display:flex; flex-wrap:wrap; gap:6px; }
  .tech-pill {
    font-size:11px; font-weight:500; background:#1F2937;
    color:#6B7280; border:1px solid #374151; padding:3px 10px; border-radius:6px;
  }
  .foot-bottom {
    max-width:1200px; margin:0 auto;
    display:flex; justify-content:space-between; align-items:center;
    padding:18px 0; font-size:12px; color:#374151;
    flex-wrap:wrap; gap:8px;
  }

  /* ── RESPONSIVE ───────────────────────────────────────────── */
  @media (max-width:1024px) {
    .hero-inner { grid-template-columns:1fr; }
    .hero-right { display:none; }
  }
  @media (max-width:900px) {
    .foot-inner { grid-template-columns:1fr 1fr; }
    .foot-brand-col { grid-column:1/-1; }
    .row-progress-wrap { display:none; }
  }
  @media (max-width:600px) {
    .hero { padding:88px 16px 48px; }
    h1 { font-size:36px; }
    .hero-stats { gap:0; }
    .stat { padding:0 12px; }
    .stat-n { font-size:22px; }
    .foot-inner { grid-template-columns:1fr; gap:28px; }
    .foot-bottom { flex-direction:column; align-items:flex-start; }
  }
</style>
