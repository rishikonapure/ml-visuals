<script>
  import { page } from '$app/stores';
  import { algoById, categories } from '$lib/data/algoRegistry.js';
  import Navbar from '$lib/components/layout/Navbar.svelte';

  $: algoId = $page.params.algo;
  $: algo   = algoById[algoId];
  $: cat    = algo?.category;

  // Animate dots
  const dotsN = 20;
</script>

<svelte:head>
  {#if algo}
    <title>{algo.label} — Coming Soon · ML Visuals</title>
    <meta name="description" content="Interactive visual explainer for {algo.label} — launching soon on ML Visuals." />
  {:else}
    <title>Not Found · ML Visuals</title>
  {/if}
</svelte:head>

<Navbar activeAlgo={algoId} />

{#if algo && cat}

<!-- ── COMING SOON PAGE ──────────────────────────────────────────────────── -->
<main class="cs-page">

  <!-- Decorative bg -->
  <div class="bg-dots" aria-hidden="true">
    {#each Array(dotsN) as _, i}
      <div class="bg-dot" style="
        left:{8 + (i * 14.3 % 84)}%;
        top:{12 + (i * 18.7 % 76)}%;
        background:{cat.color};
        width:{5 + (i % 4) * 3}px; height:{5 + (i % 4) * 3}px;
        opacity:{0.05 + (i % 3) * 0.04};
        animation-delay:{(i * 0.4).toFixed(1)}s;
      "/>
    {/each}
  </div>

  <div class="cs-inner">

    <!-- ── Header ────────────────────────────────────────── -->
    <div class="cs-header">

      <a href="/" class="back-link">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        ML Visuals
      </a>

      <div class="cs-badge" style="--c:{cat.color};--bg:{cat.bg}">
        <span class="badge-dot" style="background:{cat.color}"></span>
        {cat.label} · Coming Soon
      </div>

      <h1 class="cs-title" style="--c:{cat.color}">
        {algo.label}
      </h1>
      <p class="cs-tag">{algo.tag}</p>
      <p class="cs-desc">{algo.description}</p>

      <div class="cs-meta">
        {#if algo.readTime}
          <span class="cs-meta-item">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.4"/>
              <path d="M7 4v3.5l2 1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            {algo.readTime}
          </span>
        {/if}
        <span class="cs-meta-item">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <rect x="1.5" y="3" width="11" height="9.5" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
            <path d="M1.5 6h11" stroke="currentColor" stroke-width="1.3"/>
            <path d="M5 1.5v3M9 1.5v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          In production
        </span>
      </div>
    </div>

    <!-- ── Two-column body ───────────────────────────────── -->
    <div class="cs-body">

      <!-- What you'll learn -->
      <div class="cs-card">
        <h2 class="cs-card-title" style="color:{cat.color}">What you'll explore</h2>
        <p class="cs-card-sub">
          This visualisation will walk you through {algo.concepts.length} core concepts,
          each with an interactive diagram and a live sandbox.
        </p>
        <ul class="cs-concepts">
          {#each algo.concepts as concept, i}
            <li style="--ci:{i}">
              <span class="concept-num" style="color:{cat.color}">{String(i+1).padStart(2,'0')}</span>
              <span>{concept}</span>
              <span class="concept-bar" style="--c:{cat.color};width:{100 - i * 8}%"></span>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Right column -->
      <div class="cs-right">

        <!-- Prerequisites -->
        {#if algo.prereqs?.length}
          <div class="cs-card prereq-card">
            <h2 class="cs-card-title">Prerequisites</h2>
            <p class="cs-card-sub">Comfortable with these? You're ready for this one.</p>
            <div class="prereq-list">
              {#each algo.prereqs as p}
                {@const pAlgo = Object.values(algoById).find(a => a.label.startsWith(p.split(' ')[0]))}
                {#if pAlgo?.live}
                  <a href={pAlgo.route} class="prereq-pill live">
                    <span class="prereq-live-dot"></span>
                    {p} <span class="prereq-live-tag">Live ✓</span>
                  </a>
                {:else}
                  <span class="prereq-pill">{p}</span>
                {/if}
              {/each}
            </div>
          </div>
        {/if}

        <!-- Notify me -->
        <div class="cs-card notify-card" style="--c:{cat.color};--bg:{cat.bg}">
          <div class="notify-icon" style="background:{cat.bg};color:{cat.color}">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a6 6 0 00-6 6c0 3.5-2 5-2 5h16s-2-1.5-2-5a6 6 0 00-6-6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M10 18a2 2 0 002-2H8a2 2 0 002 2z" fill="currentColor"/>
            </svg>
          </div>
          <h3 class="notify-title">Get notified when this launches</h3>
          <p class="notify-sub">We'll send you a one-time email the moment the interactive visualisation goes live.</p>
          <div class="notify-form">
            <input type="email" class="notify-input" placeholder="you@example.com" />
            <button class="notify-btn" style="background:{cat.color}">Notify me</button>
          </div>
        </div>

        <!-- Other live content -->
        <div class="cs-card other-card">
          <h2 class="cs-card-title">Live now</h2>
          <p class="cs-card-sub">Explore this while you wait:</p>
          <a href="/" class="live-algo-card">
            <div class="lac-left">
              <span class="lac-num">01</span>
              <div>
                <span class="lac-title">K-Nearest Neighbors</span>
                <span class="lac-sub">Classification · 14 steps · ~10 min</span>
              </div>
            </div>
            <span class="lac-cta">Start &rarr;</span>
          </a>
        </div>

        <!-- More in category -->
        <div class="cs-card">
          <h2 class="cs-card-title">More in {cat.label}</h2>
          <ul class="more-list">
            {#each cat.items.filter(a => a.id !== algo.id).slice(0,4) as sibling}
              <li>
                <a href="/{sibling.id}" class="more-item" class:live-item={sibling.live}>
                  <span>{sibling.label}</span>
                  <span class="more-tag">{sibling.tag}</span>
                </a>
              </li>
            {/each}
          </ul>
        </div>

      </div>
    </div>

    <!-- ── Progress bar ───────────────────────────────────── -->
    <div class="cs-progress">
      <p class="cs-progress-label">
        Building the ML Visuals library —
        <strong style="color:{cat.color}">
          {categories.flatMap(c => c.items).filter(a => a.live).length}
        </strong>
        of
        <strong>{categories.flatMap(c => c.items).length}</strong>
        visualisations live
      </p>
      <div class="cs-progress-track">
        <div class="cs-progress-fill" style="
          width:{
            categories.flatMap(c => c.items).filter(a => a.live).length /
            categories.flatMap(c => c.items).length * 100
          }%;
          background:{cat.color}
        "></div>
      </div>
      <div class="cs-category-bars">
        {#each categories as c}
          <div class="ccb" title="{c.label}: {c.items.filter(a=>a.live).length}/{c.items.length} live">
            <span class="ccb-label">{c.label}</span>
            <div class="ccb-track">
              <div class="ccb-fill" style="
                width:{c.items.filter(a=>a.live).length / c.items.length * 100}%;
                background:{c.color}
              "></div>
            </div>
            <span class="ccb-count" style="color:{c.color}">
              {c.items.filter(a=>a.live).length}/{c.items.length}
            </span>
          </div>
        {/each}
      </div>
    </div>

  </div>
</main>

{:else}

<!-- ── 404 ─────────────────────────────────────────────────────────────────── -->
<main class="cs-page not-found">
  <div class="nf-inner">
    <p class="nf-code">404</p>
    <h1 class="nf-title">Algorithm not found</h1>
    <p class="nf-sub">We don't have <code>{algoId}</code> in our registry yet.</p>
    <a href="/" class="nf-btn">← Back to ML Visuals</a>
  </div>
</main>

{/if}

<style>
  /* ── Page shell ────────────────────────────────────────────────── */
  .cs-page {
    min-height: 100vh;
    background: linear-gradient(150deg, #F9FAFB 0%, #FAFBFE 60%, #F0FDF4 100%);
    padding-top: 56px; /* navbar height */
    position: relative; overflow: hidden;
    font-family: 'Inter', sans-serif;
  }
  .bg-dots { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
  .bg-dot  { position: absolute; border-radius: 50%; animation: flt 8s ease-in-out infinite; }
  @keyframes flt { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }

  .cs-inner {
    position: relative; z-index: 1;
    max-width: 1100px; margin: 0 auto;
    padding: 52px 24px 80px;
  }

  /* ── Header ────────────────────────────────────────────────────── */
  .back-link {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 600; color: #9CA3AF;
    text-decoration: none; margin-bottom: 24px;
    transition: color 0.15s;
  }
  .back-link:hover { color: #374151; }

  .cs-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: var(--bg); border: 1px solid color-mix(in srgb, var(--c) 30%, transparent);
    color: var(--c); font-size: 11px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    padding: 5px 14px; border-radius: 20px; margin-bottom: 16px;
  }
  .badge-dot {
    width: 6px; height: 6px; border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

  .cs-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(32px, 5vw, 60px);
    font-weight: 700; line-height: 1.1;
    color: #111827; margin-bottom: 8px;
  }
  .cs-tag {
    font-size: 13px; font-weight: 600;
    color: #9CA3AF; text-transform: uppercase;
    letter-spacing: 0.08em; margin-bottom: 14px;
  }
  .cs-desc {
    font-size: 16px; line-height: 1.75;
    color: #4B5563; max-width: 580px; margin-bottom: 20px;
  }
  .cs-meta { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 48px; }
  .cs-meta-item {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; color: #9CA3AF; font-weight: 500;
  }

  /* ── Body grid ─────────────────────────────────────────────────── */
  .cs-body {
    display: grid; grid-template-columns: 1fr 380px;
    gap: 28px; margin-bottom: 48px;
  }
  .cs-card {
    background: white; border: 1px solid #E5E7EB;
    border-radius: 16px; padding: 24px;
    box-shadow: 0 1px 8px rgba(0,0,0,0.04);
    display: flex; flex-direction: column; gap: 14px;
  }
  .cs-card-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 16px; font-weight: 700; color: #111827;
  }
  .cs-card-sub { font-size: 13px; color: #6B7280; line-height: 1.6; }

  /* Concepts list */
  .cs-concepts { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .cs-concepts li {
    display: grid; grid-template-columns: 28px 1fr;
    align-items: center; gap: 10px;
    font-size: 14px; color: #374151; font-weight: 500;
    position: relative;
    animation: fadeIn 0.4s ease both;
    animation-delay: calc(var(--ci) * 60ms);
  }
  @keyframes fadeIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  .concept-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; font-weight: 700;
  }
  .concept-bar {
    display: none; /* decorative; hidden for now */
  }

  /* Right column */
  .cs-right { display: flex; flex-direction: column; gap: 16px; }

  /* Prerequisites */
  .prereq-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .prereq-pill {
    font-size: 12px; font-weight: 500;
    padding: 5px 13px; border-radius: 20px;
    border: 1px solid #E5E7EB; color: #6B7280;
    background: #F9FAFB; text-decoration: none;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .prereq-pill.live {
    border-color: #BBF7D0; background: #F0FDF4; color: #16A34A;
    cursor: pointer; transition: background 0.15s;
  }
  .prereq-pill.live:hover { background: #DCFCE7; }
  .prereq-live-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #16A34A; flex-shrink: 0;
  }
  .prereq-live-tag { font-size: 10px; font-weight: 700; }

  /* Notify card */
  .notify-card { background: var(--bg); border-color: color-mix(in srgb,var(--c) 25%,transparent); }
  .notify-icon {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid color-mix(in srgb,var(--c) 30%,transparent);
    flex-shrink: 0;
  }
  .notify-title { font-family: 'Space Grotesk',sans-serif; font-size: 15px; font-weight: 700; color: #111827; }
  .notify-sub   { font-size: 12px; color: #6B7280; line-height: 1.6; }
  .notify-form  { display: flex; gap: 6px; }
  .notify-input {
    flex: 1; border: 1px solid #E5E7EB; border-radius: 8px;
    padding: 9px 12px; font-size: 13px; color: #111827;
    font-family: inherit; outline: none;
    transition: border-color 0.2s;
  }
  .notify-input:focus { border-color: var(--c); }
  .notify-btn {
    flex-shrink: 0; color: white; border: none; cursor: pointer;
    font-size: 12px; font-weight: 700; font-family: 'Space Grotesk',sans-serif;
    padding: 9px 14px; border-radius: 8px;
    transition: filter 0.15s;
  }
  .notify-btn:hover { filter: brightness(1.1); }

  /* Live algo card */
  .live-algo-card {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; padding: 14px; border-radius: 12px;
    border: 1.5px solid #C7D4FF; background: #EEF2FF;
    text-decoration: none; transition: box-shadow 0.15s;
  }
  .live-algo-card:hover { box-shadow: 0 4px 16px rgba(78,121,255,0.15); }
  .lac-left   { display: flex; align-items: center; gap: 12px; }
  .lac-num    { font-family: 'Space Grotesk',sans-serif; font-size: 24px; font-weight: 700; color: #C7D4FF; }
  .lac-title  { display: block; font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 2px; }
  .lac-sub    { font-size: 11px; color: #9CA3AF; }
  .lac-cta    { font-size: 13px; font-weight: 700; color: #4E79FF; flex-shrink: 0; }

  /* More in category */
  .more-list  { list-style: none; display: flex; flex-direction: column; gap: 2px; }
  .more-item  {
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 10px; border-radius: 8px;
    font-size: 13px; color: #6B7280;
    text-decoration: none;
    transition: background 0.12s;
  }
  .more-item:hover  { background: #F9FAFB; color: #111827; }
  .more-item.live-item { color: #4E79FF; font-weight: 600; }
  .more-tag   { font-size: 10px; color: #D1D5DB; }

  /* ── Progress ──────────────────────────────────────────────────── */
  .cs-progress {
    background: white; border: 1px solid #E5E7EB;
    border-radius: 16px; padding: 24px 28px;
    box-shadow: 0 1px 8px rgba(0,0,0,0.04);
    display: flex; flex-direction: column; gap: 16px;
  }
  .cs-progress-label { font-size: 14px; color: #6B7280; }
  .cs-progress-track {
    height: 6px; background: #F3F4F6;
    border-radius: 3px; overflow: hidden;
  }
  .cs-progress-fill {
    height: 100%; border-radius: 3px;
    transition: width 1s ease;
  }
  .cs-category-bars { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
  .ccb { display: grid; grid-template-columns: 130px 1fr 36px; align-items: center; gap: 12px; }
  .ccb-label { font-size: 12px; color: #6B7280; font-weight: 500; }
  .ccb-track { height: 4px; background: #F3F4F6; border-radius: 2px; overflow: hidden; }
  .ccb-fill  { height: 100%; border-radius: 2px; }
  .ccb-count { font-size: 11px; font-weight: 700; text-align: right; font-family: 'JetBrains Mono',monospace; }

  /* ── 404 ────────────────────────────────────────────────────────── */
  .not-found { display: flex; align-items: center; justify-content: center; text-align: center; }
  .nf-inner  { display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .nf-code   { font-size: 96px; font-weight: 700; color: #E5E7EB; font-family: 'Space Grotesk',sans-serif; line-height: 1; }
  .nf-title  { font-family: 'Space Grotesk',sans-serif; font-size: 28px; font-weight: 700; color: #111827; }
  .nf-sub    { font-size: 15px; color: #6B7280; }
  .nf-btn {
    margin-top: 8px; padding: 12px 24px; border-radius: 10px;
    background: #111827; color: white; text-decoration: none;
    font-size: 14px; font-weight: 600;
    transition: background 0.15s;
  }
  .nf-btn:hover { background: #374151; }

  /* ── Responsive ─────────────────────────────────────────────────── */
  @media (max-width: 900px) {
    .cs-body { grid-template-columns: 1fr; }
    .cs-right { /* stacks naturally */ }
    .ccb { grid-template-columns: 110px 1fr 32px; }
  }
  @media (max-width: 600px) {
    .cs-inner { padding: 36px 16px 60px; }
    .cs-title { font-size: 30px; }
    .notify-form { flex-direction: column; }
    .cs-progress { padding: 18px; }
    .ccb { grid-template-columns: 90px 1fr 28px; gap: 8px; }
    .ccb-label { font-size: 11px; }
  }
</style>
