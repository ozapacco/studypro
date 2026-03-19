<script>
  export let value = 0;
  export let max = 100;
  export let color = 'primary';
  export let size = 'md';
  export let showLabel = false;

  $: percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colors = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };
</script>

<div class="w-full">
  <div class={`bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizes[size]}`}>
    <div class={`h-full transition-all duration-300 ${colors[color]}`} style={`width: ${percentage}%`}></div>
  </div>
  {#if showLabel}
    <span class="text-xs text-gray-500 mt-1">{percentage.toFixed(0)}%</span>
  {/if}
</div>
