<script>
  export let padding = 'md';
  export let hover = false;
  export let clickable = false;

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  function handleKeydown(event) {
    if (!clickable) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.currentTarget?.click?.();
    }
  }
</script>

<div
  {...$$restProps}
  class={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${paddings[padding]} ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''} ${clickable ? 'cursor-pointer' : ''} ${clickable ? 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900' : ''}`}
  on:click
  on:keydown={handleKeydown}
  role={clickable ? 'button' : undefined}
  tabindex={clickable ? 0 : undefined}
>
  <slot />
</div>
