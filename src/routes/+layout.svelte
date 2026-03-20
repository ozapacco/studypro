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
    { href: '/', icon: '🏠', label: 'Painel' },
    { href: '/study', icon: '📚', label: 'Estudo' },
    { href: '/cards', icon: '🗂️', label: 'Cartões' },
    { href: '/subjects', icon: '📖', label: 'Matérias' },
    { href: '/stats', icon: '📊', label: 'Estatísticas' },
    { href: '/settings', icon: '⚙️', label: 'Ajustes' }
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
      <span class="text-xl font-bold text-primary-600">StudyPro</span>
    </div>

    <nav class="flex-1 p-4 space-y-1">
      {#each navItems as item}
        <a
          href={item.href}
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
        >
          <span class="text-base leading-none" aria-hidden="true">{item.icon}</span>
          <span class="font-medium">{item.label}</span>
        </a>
      {/each}
    </nav>

    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <button class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" on:click={() => uiStore.toggleDarkMode()}>
        <span>Alternar tema</span>
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
