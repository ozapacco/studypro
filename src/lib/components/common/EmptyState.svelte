<script>
  /**
   * EmptyState - Empty state component
   * Standardized empty/placeholder state with icon, title, description, and action
   *
   * @exports {string} icon - Emoji or text icon
   * @exports {string} title - Main heading text
   * @exports {string} description - Supporting text description
   * @exports {string} size - sm | md | lg (affects padding and icon size)
   * @exports {string} className
   */
  export let icon = '📋';
  export let title = 'Nenhum item encontrado';
  export let description = '';
  export let size = 'md';

  const sizes = {
    sm: {
      padding: 'p-4',
      icon: 'text-2xl',
      title: 'text-sm',
      desc: 'text-xs'
    },
    md: {
      padding: 'p-6',
      icon: 'text-4xl',
      title: 'text-base',
      desc: 'text-sm'
    },
    lg: {
      padding: 'p-10',
      icon: 'text-6xl',
      title: 'text-lg',
      desc: 'text-base'
    }
  };

  $: sizeConfig = sizes[size] || sizes.md;
</script>

<div class="empty-state {sizeConfig.padding}">
  {#if icon}
    <span class="empty-icon {sizeConfig.icon}">{icon}</span>
  {/if}
  {#if title}
    <h3 class="empty-title {sizeConfig.title}">{title}</h3>
  {/if}
  {#if description}
    <p class="empty-desc {sizeConfig.desc}">{description}</p>
  {/if}
  <slot name="action" />
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    text-align: center;
    border-radius: 1rem;
    background: transparent;
  }

  .empty-icon {
    margin-bottom: 0.5rem;
  }

  .empty-title {
    font-weight: 600;
    color: #1f2937;
  }

  :global(.dark) .empty-title {
    color: #f3f4f6;
  }

  .empty-desc {
    color: #6b7280;
    max-width: 400px;
    line-height: 1.5;
  }

  :global(.dark) .empty-desc {
    color: #9ca3af;
  }
</style>
