<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { uiStore } from '$lib/stores';
  import { initializeDatabase } from '$lib/db.js';
  import { restoreFromCloudIfNeeded, scheduleCloudSync, setupCloudSync } from '$lib/cloud/sync.js';
  import { ANIMATIONS } from '$lib/design/tokens.mjs';
  import ConfirmDialog from '$lib/components/common/ConfirmDialog.svelte';
  import '../app.css';

  let transitioning = false;

  const navItems = [
    { href: '/', label: 'Início', icon: '🏠' },
    { href: '/study', label: 'Estudo', icon: '📖' },
    { href: '/cards', label: 'Cartões', icon: '📇' },
    { href: '/subjects', label: 'Matérias', icon: '📚' },
    { href: '/stats', label: 'Estatísticas', icon: '📊' },
    { href: '/edital', label: 'Edital', icon: '🎯' },
    { href: '/settings', label: 'Ajustes', icon: '⚙️' }
  ];

  function isActive(href) {
    const path = $page.url.pathname;
    if (href === '/') return path === '/';
    return path === href || path.startsWith(`${href}/`);
  }

  onMount(async () => {
    uiStore.init();

    await initializeDatabase();
    await setupCloudSync();

    const restore = await restoreFromCloudIfNeeded();
    if (restore?.restored) {
      uiStore.toast('Dados restaurados do Supabase.', 'success', 5000);
    }

    scheduleCloudSync('app_boot', 600);
  });

  afterNavigate(() => {
    transitioning = true;
    setTimeout(() => transitioning = false, 200);
  });
</script>

<div class="min-h-screen flex">
  <aside class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 hidden md:flex flex-col">
    <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
      <span class="text-xl font-bold font-display text-primary-600 tracking-tight italic">StudyPro <span class="text-xs font-black uppercase not-italic opacity-40 ml-1">v2</span></span>
    </div>

    <nav class="flex-1 p-4 space-y-1">
      {#each navItems as item}
        {@const active = isActive(item.href)}
        <a
          href={item.href}
          aria-current={active ? 'page' : undefined}
          class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                 {active 
                   ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 font-bold' 
                   : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-primary-600 dark:hover:text-primary-400'}"
        >
          <span class="text-xl {active ? '' : 'grayscale'} group-hover:grayscale-0 transition-all">{item.icon}</span>
          <span class="text-sm tracking-tight">{item.label}</span>
        </a>
      {/each}
    </nav>

    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <button class="w-full flex items-center gap-3 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary-500 transition-colors" on:click={() => uiStore.toggleDarkMode()}>
        <span>🌗 Tema</span>
      </button>
    </div>
  </aside>

  <main class="flex-1 overflow-auto pb-20 md:pb-0">
    <div class="h-full {transitioning ? ANIMATIONS.fadeIn : ''}">
      <slot />
    </div>
  </main>
</div>

<!-- Mobile Bottom Navigation -->
<nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 z-50 px-2 pb-safe">
  <div class="flex justify-around items-center h-16">
    {#each navItems.filter(i => ['Início', 'Estudo', 'Cartões', 'Matérias', 'Ajustes'].includes(i.label)) as item}
      {@const active = isActive(item.href)}
      <a 
        href={item.href} 
        aria-current={active ? 'page' : undefined}
        class="flex flex-col items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-90
               {active ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'}"
      >
        <span class="text-2xl {active ? '' : 'grayscale'}">{item.icon}</span>
        <span class="text-[9px] font-black uppercase tracking-widest">{item.label === 'Ajustes' ? 'Menu' : item.label}</span>
      </a>
    {/each}
  </div>
</nav>

{#if $uiStore.toasts.length > 0}
  <div class="fixed bottom-20 md:bottom-4 right-4 space-y-2 z-50" aria-live="polite" aria-relevant="additions text">
    {#each $uiStore.toasts as item (item.id)}
      <div
        class={`px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-3 ${item.type === 'success' ? 'bg-green-500' : ''} ${item.type === 'error' ? 'bg-red-500' : ''} ${item.type === 'warning' ? 'bg-yellow-500' : ''} ${item.type === 'info' ? 'bg-blue-500' : ''}`}
        role={item.type === 'error' || item.type === 'warning' ? 'alert' : 'status'}
      >
        <span class="flex-1">{item.message}</span>
        <button 
          on:click={() => uiStore.dismissToast(item.id)}
          class="p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Fechar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    {/each}
  </div>
{/if}

<ConfirmDialog />

