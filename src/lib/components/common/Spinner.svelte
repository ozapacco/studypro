<script>
  /**
   * Spinner - Loading state component
   * Standardized loading indicator across the application
   *
   * @exports {string} size - sm (16px) | md (24px) | lg (32px)
   * @exports {string} color - CSS color value (default: currentColor)
   */
  export let size = 'md';
  export let color = 'currentColor';
  export let className = '';

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  $: sizeClass = sizes[size] || sizes.md;
</script>

<div
  class={`spinner ${sizeClass} ${className}`}
  style="border-top-color: transparent; color: {color}"
></div>

<style>
  .spinner {
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 999px;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
