<script>
  import { onMount, onDestroy } from 'svelte';
  import { sessionStore } from '$lib/stores';

  let elapsed = 0;
  let interval;

  $: isPaused = $sessionStore.isPaused;
  $: hours = Math.floor(elapsed / 3600);
  $: minutes = Math.floor((elapsed % 3600) / 60);
  $: seconds = elapsed % 60;

  $: display =
    hours > 0
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${minutes}:${String(seconds).padStart(2, '0')}`;

  onMount(() => {
    interval = setInterval(() => {
      if (!isPaused) elapsed += 1;
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div class="flex items-center gap-2 text-lg font-mono">
  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <span class:text-yellow-500={isPaused}>{display}</span>
  {#if isPaused}
    <span class="text-xs text-yellow-500">(pausado)</span>
  {/if}
</div>
