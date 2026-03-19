<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { analytics } from '$lib/engines/analytics.js';

  let data = [];
  let loading = true;
  let weeks = [];

  onMount(async () => {
    const raw = await analytics.getConsistencyData();
    data = raw;
    generateCalendar();
    loading = false;
  });

  function generateCalendar() {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364); // 52 weeks ago
    
    // Shift to start of the week (Sunday = 0)
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const calendar = [];
    let current = new Date(startDate);
    
    for (let w = 0; w < 53; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = current.toISOString().split('T')[0];
        const dayData = data.find(item => item.date === dateStr);
        week.push({
          date: dateStr,
          level: dayData ? dayData.level : 0,
          count: dayData ? dayData.count : 0
        });
        current.setDate(current.getDate() + 1);
      }
      calendar.push(week);
    }
    weeks = calendar;
  }

  const LEVELS = [
    'bg-slate-100 dark:bg-slate-800/50', // 0
    'bg-primary-200 dark:bg-primary-900/40', // 1
    'bg-primary-400 dark:bg-primary-700/60', // 2
    'bg-primary-600 dark:bg-primary-500/80', // 3
    'bg-primary-800 dark:bg-primary-400'     // 4
  ];

  const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  function getMonthLabels() {
    const labels = [];
    const today = new Date();
    let current = new Date();
    current.setDate(today.getDate() - 364);
    
    for (let i = 0; i < 12; i++) {
       labels.push({
         name: MONTHS[current.getMonth()],
         pos: Math.floor(i * 4.4) // Approximate week position
       });
       current.setMonth(current.getMonth() + 1);
    }
    return labels;
  }
</script>

<div class="consistency-heatmap w-full overflow-x-auto scrollbar-hide py-4">
  {#if loading}
    <div class="h-32 flex items-center justify-center animate-pulse">
      <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapeando consistência...</span>
    </div>
  {:else}
    <div class="inline-block min-w-full md:min-w-0" in:fade>
      <!-- Month Labels -->
      <div class="flex text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-2 ml-6">
        {#each getMonthLabels() as month}
          <div class="grow text-left" style="flex-basis: 0">{month.name}</div>
        {/each}
      </div>

      <div class="flex gap-1.5">
        <!-- Day Labels -->
        <div class="flex flex-col justify-between py-1 pr-2 text-[8px] font-bold text-slate-300 dark:text-slate-600 uppercase">
          <span>Seg</span>
          <span>Qua</span>
          <span>Sex</span>
        </div>

        <!-- Grid -->
        <div class="flex gap-1">
          {#each weeks as week}
            <div class="flex flex-col gap-1">
              {#each week as day}
                <div 
                  class="w-3 h-3 md:w-3.5 md:h-3.5 rounded-sm {LEVELS[day.level]} transition-all hover:ring-2 hover:ring-primary-500/50 cursor-pointer relative group"
                  title="{day.date}: {day.count} cards"
                >
                  <!-- Tooltip (Simulated via title, but could be enhanced) -->
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[8px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {day.count} cards em {day.date}
                  </div>
                </div>
              {/each}
            </div>
          {/each}
        </div>
      </div>

      <!-- Legend -->
      <div class="flex items-center justify-end gap-1.5 mt-4 text-[8px] font-bold text-slate-400 uppercase">
        <span>Menos</span>
        {#each LEVELS as level}
          <div class="w-2.5 h-2.5 rounded-sm {level}"></div>
        {/each}
        <span>Mais</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
