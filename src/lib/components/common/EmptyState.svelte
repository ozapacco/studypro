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
  export let actionLabel = '';
  export let actionHref = '';
  export let onAction = null;

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
  
  {#if actionLabel}
    <div class="empty-action mt-2">
      {#if actionHref}
        <a href={actionHref} class="btn-action">
          {actionLabel}
        </a>
      {:else}
        <button on:click={onAction} class="btn-action">
          {actionLabel}
        </button>
      {/if}
    </div>
  {/if}

  <slot name="action" />
</div>

<style>
  .btn-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: 0.75rem;
    background-color: var(--color-primary-600, #2563eb);
    color: white;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06);
  }

  .btn-action:hover {
    background-color: var(--color-primary-700, #1d4ed8);
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2), 0 4px 6px -2px rgba(37, 99, 235, 0.1);
  }

  .btn-action:active {
    transform: scale(0.98);
  }
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
