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
</script>

<div
  {...$$restProps}
  class={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${paddings[padding]} ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''} ${clickable ? 'cursor-pointer' : ''}`}
  on:click
  role={clickable ? 'button' : undefined}
>
  <slot />
</div>
