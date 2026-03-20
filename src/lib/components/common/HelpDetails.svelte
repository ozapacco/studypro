<script>
  export let label = 'O que é isso?';
  export let size = 'sm';
</script>

<details class="help-details help-{size}">
  <summary class="help-summary">
    <span class="help-icon">ℹ️</span>
    <span>{label}</span>
  </summary>
  <div class="help-content">
    <slot />
  </div>
</details>

<style>
  .help-details {
    display: inline-block;
  }

  .help-summary {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-primary-500, #3b82f6);
    cursor: pointer;
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
  }

  .help-summary:hover {
    background-color: var(--color-primary-50, #eff6ff);
  }

  .help-sm .help-icon {
    font-size: 0.75rem;
  }

  .help-lg .help-icon {
    font-size: 1rem;
  }

  .help-content {
    margin-top: 0.5rem;
    padding: 0.75rem;
    background-color: var(--color-slate-50, #f8fafc);
    border-radius: 0.5rem;
    font-size: 0.75rem;
    line-height: 1.5;
    color: var(--color-slate-600, #475569);
  }

  :global(.dark) .help-content {
    background-color: var(--color-slate-900, #0f172a);
    color: var(--color-slate-300, #cbd5e1);
  }

  .help-content :global(h4) {
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .help-content :global(ul) {
    margin: 0.25rem 0 0 1rem;
    padding-left: 0.5rem;
  }

  .help-content :global(li) {
    margin: 0.125rem 0;
  }
</style>
