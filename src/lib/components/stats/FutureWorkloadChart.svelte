<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { scheduler } from '$lib/engines/scheduler.js';

  let data = [];
  let loading = true;
  let maxCount = 0;

  onMount(async () => {
    data = await scheduler.getFutureWorkload(14);
    maxCount = Math.max(...data.map(d => d.count), 1);
    loading = false;
  });

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { weekday: 'short' }).split('.')[0];
  };

  const getDayNum = (dateStr) => dateStr.split('-')[2];
</script>

<div class="future-workload py-4">
  {#if loading}
    <div class="h-40 flex items-center justify-center animate-pulse">
      <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Calculando carga futura...</span>
    </div>
  {:else}
    <div class="flex flex-col gap-6" in:fade>
      <div class="flex items-end justify-between gap-1.5 h-32 md:h-40">
        {#each data as day}
          {@const height = (day.count / maxCount) * 100}
          <div class="flex-1 flex flex-col items-center gap-2 group">
            <div 
              class="w-full rounded-t-md transition-all duration-500 relative {day.count > 50 ? 'bg-primary-600' : 'bg-primary-400/60 dark:bg-primary-500/30'}"
              style="height: {height}%"
            >
              <!-- Tooltip -->
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[8px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {day.count} cards
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Labels -->
      <div class="flex justify-between gap-1.5">
        {#each data as day}
          <div class="flex-1 flex flex-col items-center">
            <span class="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{getDayName(day.date)}</span>
            <span class="text-[10px] font-bold text-slate-800 dark:text-slate-200">{getDayNum(day.date)}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
