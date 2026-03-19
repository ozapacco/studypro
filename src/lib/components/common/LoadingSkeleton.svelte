<script>
  /**
   * LoadingSkeleton - Skeleton loading component
   * Displays a shimmer effect placeholder while content is loading
   *
   * @exports {string} variant - card (full width) | line (text) | avatar (circle) | avatar-sm
   * @exports {number} width - Only applies to line variant
   * @exports {string} height - Custom height (default: auto based on variant)
   * @exports {string} className
   */
  export let variant = 'card';
  export let width;
  export let height;
  export let className = '';

  const variants = {
    card: 'skeleton-card',
    line: 'skeleton-line',
    avatar: 'skeleton-avatar',
    'avatar-sm': 'skeleton-avatar-sm'
  };

  $: variantClass = variants[variant] || variants.card;
  $: customWidth = width ? `width: ${width}` : '';
  $: customHeight = height ? `height: ${height}` : '';
</script>

<div class="skeleton {variantClass} {className}" style="{customWidth} {customHeight}"></div>

<style>
  .skeleton {
    background: linear-gradient(
      90deg,
      #e2e8f0 25%,
      #f1f5f9 50%,
      #e2e8f0 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.5rem;
  }

  :global(.dark) .skeleton {
    background: linear-gradient(
      90deg,
      #374151 25%,
      #4b5563 50%,
      #374151 75%
    );
    background-size: 200% 100%;
  }

  /* Variants */
  .skeleton-card {
    width: 100%;
    height: 120px;
  }

  .skeleton-line {
    width: 100%;
    height: 1rem;
    border-radius: 0.25rem;
  }

  .skeleton-avatar {
    width: 48px;
    height: 48px;
    border-radius: 999px;
  }

  .skeleton-avatar-sm {
    width: 32px;
    height: 32px;
    border-radius: 999px;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
</style>
