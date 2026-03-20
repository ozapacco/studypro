<script>
  import { fade, fly, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { uiStore } from '$lib/stores/ui';
  import { onMount } from 'svelte';

  $: config = $uiStore.confirm;
  let cancelBtn;

  onMount(() => {
    if (config.open && cancelBtn) {
      setTimeout(() => cancelBtn?.focus(), 100);
    }
  });

  function handleKeydown(e) {
    if (!config.open) return;
    if (e.key === 'Escape') uiStore.resolveConfirm(false);
  }

  function handleBackdropClick() {
    uiStore.resolveConfirm(false);
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if config.open}
  <!-- Overlay Backdrop -->
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    in:fade={{ duration: 200 }} 
    out:fade={{ duration: 150 }}
  >
    <button 
      class="absolute inset-0 w-full h-full bg-slate-900/60 backdrop-blur-[2px] border-none cursor-default" 
      aria-label="Fechar"
      on:click={handleBackdropClick}
    ></button>

    <!-- Dialog Content -->
    <div 
      class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      in:scale={{ start: 0.9, duration: 400, easing: cubicOut }}
      out:scale={{ start: 0.9, duration: 200 }}
    >
      <div class="px-8 pt-10 pb-8 text-center">
        <!-- Visual Cue -->
        <div 
          class="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl
                 {config.variant === 'danger' ? 'bg-rose-50 dark:bg-rose-950/30' : 
                  config.variant === 'warning' ? 'bg-amber-50 dark:bg-amber-950/30' : 
                  'bg-primary-50 dark:bg-primary-950/30'}"
        >
          {#if config.variant === 'danger'}
            🗑️
          {:else if config.variant === 'warning'}
            ⚠️
          {:else}
            ❓
          {/if}
        </div>

        <h3 id="confirm-title" class="text-xl font-black text-slate-800 dark:text-white mb-2 leading-tight">
          {config.title}
        </h3>
        <p class="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          {config.message}
        </p>

        <div class="space-y-3">
          <button
            on:click={() => uiStore.resolveConfirm(true)}
            class="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all active:scale-95
                   {config.variant === 'danger' ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' : 
                    config.variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' : 
                    'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20'}"
          >
            {config.confirmLabel}
          </button>
          
          <button
            bind:this={cancelBtn}
            on:click={() => uiStore.resolveConfirm(false)}
            class="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            {config.cancelLabel}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
