<script>
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { uiStore } from '$lib/stores';
  import { initializeDatabase } from '$lib/db.js';
  import { restoreFromCloudIfNeeded, scheduleCloudSync, setupCloudSync } from '$lib/cloud/sync.js';
  import { ANIMATIONS } from '$lib/design/tokens.mjs';
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
        <a
          href={item.href}
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 group"
        >
          <span class="text-xl grayscale group-hover:grayscale-0 transition-all">{item.icon}</span>
          <span class="font-bold text-sm tracking-tight">{item.label}</span>
        </a>
      {/each}
    </nav>

    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <button class="w-full flex items-center gap-3 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary-500 transition-colors" on:click={() => uiStore.toggleDarkMode()}>
        <span>🌗 Tema</span>
      </button>
    </div>
  </aside>

  <main class="flex-1 overflow-auto">
    <div class="h-full {transitioning ? ANIMATIONS.fadeIn : ''}">
      <slot />
    </div>
  </main>
</div>

{#if $uiStore.toasts.length > 0}
  <div class="fixed bottom-4 right-4 space-y-2 z-50">
    {#each $uiStore.toasts as item (item.id)}
      <div
        class={`px-4 py-3 rounded-lg shadow-lg text-white ${item.type === 'success' ? 'bg-green-500' : ''} ${item.type === 'error' ? 'bg-red-500' : ''} ${item.type === 'warning' ? 'bg-yellow-500' : ''} ${item.type === 'info' ? 'bg-blue-500' : ''}`}
      >
        {item.message}
      </div>
    {/each}
  </div>
{/if}
