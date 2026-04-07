<script>
  // No props needed — height is controlled by CSS sticky behaviour
</script>

<!--
  StickyViz: right-pane sticky container for scrollytelling.
  The parent (.viz-col) must stretch to match the narrative column
  (no align-items:start on the parent grid).
  This div sticks to the top and fills the viewport height,
  staying in view throughout the entire scroll.
-->
<div class="sticky-pane">
  <div class="inner">
    <slot />
  </div>
</div>

<style>
  .sticky-pane {
    position: sticky;
    top: 0;
    height: 100vh;
    /* Scroll children vertically if they overflow on small screens */
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 24px 0;
    /* Let it grow but cap at viewport height */
    max-height: 100vh;
  }
</style>
