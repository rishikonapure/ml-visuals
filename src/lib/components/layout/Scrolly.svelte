<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';

  export let threshold = 0.6; // how far into view before step triggers

  const dispatch = createEventDispatcher();
  let container;
  let observer;

  onMount(() => {
    const steps = container.querySelectorAll('.scroll-step');

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.dataset.step);
            dispatch('step', { index });
          }
        });
      },
      {
        root: null,
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0
      }
    );

    steps.forEach(step => observer.observe(step));
  });

  onDestroy(() => {
    if (observer) observer.disconnect();
  });
</script>

<div bind:this={container} class="scrolly-container">
  <slot />
</div>

<style>
  .scrolly-container {
    position: relative;
  }
</style>
