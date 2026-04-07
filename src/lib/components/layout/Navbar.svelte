<script>
  import { onMount } from 'svelte';
  import { categories } from '$lib/data/algoRegistry.js';

  export let activeAlgo = 'knn';

  let openCat    = null;   // desktop hover dropdown
  let scrolled   = false;
  let menuOpen   = false;  // mobile drawer
  let mobileOpen = null;   // mobile accordion cat

  function toggleMobile(id) {
    mobileOpen = mobileOpen === id ? null : id;
  }

  onMount(() => {
    const onScroll = () => { scrolled = window.scrollY > 80; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });
</script>

<nav class="nav" class:scrolled>
  <div class="nav-inner">

    <!-- Brand -->
    <a href="/" class="brand" aria-label="ML Visuals home">
      <span class="brand-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="10" stroke="#4E79FF" stroke-width="1.8"/>
          <circle cx="6"  cy="9"  r="2.2" fill="#4E79FF"/>
          <circle cx="14" cy="7"  r="2.2" fill="#FF4E6A"/>
          <circle cx="10" cy="15" r="2.2" fill="#2ECC8F"/>
          <circle cx="16" cy="14" r="1.6" fill="#FF9F1C" opacity="0.8"/>
        </svg>
      </span>
      <span class="brand-text">ML Visuals</span>
    </a>

    <!-- Desktop category nav -->
    <div class="cat-nav" role="menubar">
      {#each categories as cat}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="cat-wrap"
          on:mouseenter={() => openCat = cat.id}
          on:mouseleave={() => openCat = null}
        >
          <button
            class="cat-btn"
            class:active={cat.items.some(a => a.id === activeAlgo)}
            style="--cc:{cat.color}"
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={openCat === cat.id}
          >
            {cat.label}
            <svg class="chevron" class:open={openCat === cat.id}
              width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>

          {#if openCat === cat.id}
            <div class="dropdown" role="menu" style="--cc:{cat.color};--cbg:{cat.bg}">
              <div class="drop-header" style="border-left: 3px solid {cat.color}">
                <span class="drop-cat">{cat.label}</span>
                <span class="drop-count">{cat.items.length} topics</span>
              </div>
              <ul class="drop-list">
                {#each cat.items as item}
                  <li>
                    <a
                      href={item.live ? '/' : `/${item.id}`}
                      class="drop-item"
                      class:live={item.live}
                      class:soon={!item.live}
                      role="menuitem"
                      on:click={() => openCat = null}
                    >
                      <span class="di-label">{item.label}</span>
                      <span class="di-tag">{item.tag}</span>
                      {#if item.live}
                        <span class="di-live">Live ✓</span>
                      {:else}
                        <span class="di-soon">Soon</span>
                      {/if}
                    </a>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Mobile hamburger -->
    <button
      class="hamburger"
      aria-label="Toggle menu"
      aria-expanded={menuOpen}
      on:click={() => { menuOpen = !menuOpen; if (!menuOpen) mobileOpen = null; }}
    >
      <span class:open={menuOpen}></span>
      <span class:open={menuOpen}></span>
      <span class:open={menuOpen}></span>
    </button>
  </div>

  <!-- Mobile drawer -->
  {#if menuOpen}
    <div class="mobile-drawer">
      {#each categories as cat}
        <div class="m-cat">
          <button
            class="m-cat-btn"
            class:m-open={mobileOpen === cat.id}
            on:click={() => toggleMobile(cat.id)}
            style="--cc:{cat.color}"
          >
            <span>{cat.label}</span>
            <svg class="chevron" class:open={mobileOpen === cat.id}
              width="12" height="12" viewBox="0 0 10 10" fill="none">
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>

          {#if mobileOpen === cat.id}
            <ul class="m-items">
              {#each cat.items as item}
                <li>
                  <a
                    href={item.live ? '/' : `/${item.id}`}
                    class="m-item"
                    class:live={item.live}
                    class:soon={!item.live}
                    style="--cc:{cat.color}"
                    on:click={() => menuOpen = false}
                  >
                    {item.label}
                    {#if item.live}
                      <span class="di-live" style="margin-left:auto">Live ✓</span>
                    {:else}
                      <span class="di-soon" style="margin-left:auto">Soon</span>
                    {/if}
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</nav>

<style>
  /* ── Base ── */
  .nav {
    position: fixed; top: 0; left: 0; right: 0;
    z-index: 200;
    transition: background 0.3s, box-shadow 0.3s, backdrop-filter 0.3s;
    background: transparent;
  }
  .nav.scrolled {
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 1px 0 rgba(0,0,0,0.08);
  }
  .nav-inner {
    max-width: 1280px; margin: 0 auto;
    padding: 0 24px; height: 56px;
    display: flex; align-items: center; gap: 4px;
  }

  /* Brand */
  .brand {
    display: flex; align-items: center; gap: 9px;
    text-decoration: none; flex-shrink: 0; margin-right: 12px;
  }
  .brand-icon { display: flex; align-items: center; }
  .brand-text {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 16px; font-weight: 700; color: #111827;
    letter-spacing: -0.01em;
  }

  /* Desktop category nav */
  .cat-nav {
    display: flex; align-items: center; gap: 2px;
    flex: 1;
  }
  .cat-wrap {
    position: relative;
  }
  .cat-btn {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 11px; border-radius: 8px;
    font-size: 13px; font-weight: 500; color: #374151;
    background: none; border: none; cursor: pointer;
    font-family: inherit;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .cat-btn:hover { background: #F3F4F6; color: #111827; }
  .cat-btn.active { color: var(--cc); font-weight: 600; }
  .cat-btn.active:hover { background: color-mix(in srgb, var(--cc) 8%, white); }
  .chevron { transition: transform 0.2s; flex-shrink: 0; color: #9CA3AF; }
  .chevron.open { transform: rotate(180deg); }

  /* Dropdown */
  .dropdown {
    position: absolute; top: calc(100% + 8px); left: 0;
    min-width: 280px; max-width: 320px;
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
    overflow: hidden;
    animation: dropIn 0.15s ease;
    z-index: 300;
  }
  @keyframes dropIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .drop-header {
    padding: 12px 16px 10px;
    background: var(--cbg);
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid #F3F4F6;
  }
  .drop-cat  { font-size: 12px; font-weight: 700; color: var(--cc); text-transform: uppercase; letter-spacing: 0.07em; }
  .drop-count{ font-size: 11px; color: #9CA3AF; }
  .drop-list {
    list-style: none; padding: 6px 0; margin: 0;
    max-height: 360px; overflow-y: auto;
  }
  .drop-item {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 16px; font-size: 13px; text-decoration: none;
    transition: background 0.12s;
  }
  .drop-item.live { color: #111827; cursor: pointer; }
  .drop-item.live:hover { background: var(--cbg); }
  .drop-item.soon { color: #9CA3AF; cursor: default; }
  .di-label { flex: 1; font-weight: 500; }
  .di-tag   { font-size: 10px; color: #C4C8D8; white-space: nowrap; }
  .di-live  {
    font-size: 9px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; background: #DCFCE7; color: #16A34A;
    padding: 2px 7px; border-radius: 4px; white-space: nowrap; flex-shrink: 0;
  }
  .di-soon  {
    font-size: 9px; font-weight: 600;
    background: #F3F4F6; color: #D1D5DB;
    padding: 2px 7px; border-radius: 4px; white-space: nowrap; flex-shrink: 0;
  }

  /* Hamburger */
  .hamburger {
    display: none; flex-direction: column; gap: 5px;
    padding: 6px; background: none; border: none; cursor: pointer;
  }
  .hamburger span {
    display: block; width: 20px; height: 2px;
    background: #374151; border-radius: 2px;
    transition: transform 0.2s, opacity 0.2s;
  }
  .hamburger span.open:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .hamburger span.open:nth-child(2) { opacity: 0; }
  .hamburger span.open:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  /* Mobile drawer */
  .mobile-drawer {
    background: white; border-top: 1px solid #E5E7EB;
    max-height: 70vh; overflow-y: auto;
  }
  .m-cat { border-bottom: 1px solid #F3F4F6; }
  .m-cat-btn {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; padding: 14px 24px;
    font-size: 14px; font-weight: 600;
    color: #374151; background: none; border: none;
    font-family: inherit; cursor: pointer; text-align: left;
    transition: background 0.15s;
  }
  .m-cat-btn.m-open { color: var(--cc); background: #F9FAFB; }
  .m-items { list-style: none; padding: 4px 0 10px; margin: 0; background: #FAFAFA; }
  .m-item {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 24px 10px 36px;
    font-size: 13px; text-decoration: none;
  }
  .m-item.live { color: #111827; font-weight: 500; }
  .m-item.soon { color: #C4C8D8; cursor: default; }

  /* Responsive */
  @media (max-width: 900px) {
    .cat-nav  { display: none; }
    .hamburger{ display: flex; margin-left: auto; }
  }
</style>
