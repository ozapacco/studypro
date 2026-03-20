<script>
  /**
   * InteractiveCard - Card with interactive feedback
   * Wrapper around Card component with hover/active states and smooth transitions
   *
   * @exports {boolean} clickable - Whether card is interactive
   * @exports {boolean} active - Active/success state
   * @exports {string} padding - none | sm (p-3) | md (p-4) | lg (p-6)
   * @exports {boolean} animate - Enable entrance animation (default: true)
   * @exports {string} className
   */
  import Card from './Card.svelte';

  export let clickable = false;
  export let active = false;
  export let padding = 'md';
  export let animate = true;
  export let className = '';

  $: interactiveClass = clickable ? 'card-interactive' : '';
  $: activeClass = active ? 'card-active' : '';
</script>

<Card
  padding={padding}
  class="{interactiveClass} {activeClass} {className}"
  { animate }
  hover={clickable}
  clickable={clickable}
  on:click
>
  <slot />
</Card>

<style>
  /* Interactive card with hover/active states */
  :global(.card-interactive) {
    transition: all 0.15s ease-in-out;
  }

  :global(.card-interactive:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.15);
  }

  :global(.dark .card-interactive:hover) {
    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.4);
  }

  :global(.card-interactive:active) {
    transform: translateY(0);
    box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.1);
  }

  :global(.dark .card-interactive:active) {
    box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.3);
  }

  /* Active/success state */
  :global(.card-active) {
    border-color: #6366f1;
    background: #f5f3ff;
  }

  :global(.dark .card-active) {
    background: rgba(99, 102, 241, 0.1) !important;
    border-color: #6366f1 !important;
  }
</style>
