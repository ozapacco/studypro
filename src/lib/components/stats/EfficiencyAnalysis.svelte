<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { analytics } from '$lib/engines/analytics.js';
  import InteractiveCard from '$lib/components/common/InteractiveCard.svelte';

  let data = [];
  let loading = true;
  let peakHour = null;

  onMount(async () => {
    data = await analytics.getEfficiencyAnalysis();
    
    // Find hour with highest total reviews (must have records)
    const valid = data.filter(d => d.total > 5);
    if (valid.length > 0) {
      peakHour = valid.sort((a, b) => b.accuracy - a.accuracy)[0];
    }
    
    loading = false;
  });

  const getIntensityClass = (total) => {
    if (total === 0) return 'text-slate-200 dark:text-slate-800';
    if (total < 20) return 'text-primary-300';
    if (total < 50) return 'text-primary-500';
    return 'text-primary-700 dark:text-primary-400';
  };
</script>

<div class="efficiency-analysis py-4">
  {#if loading}
    <div class="flex justify-center py-10">
      <div class="w-8 h-8 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin"></div>
    </div>
  {:else}
    <div class="space-y-6" in:fade>
      <!-- Peak Performance Callout -->
      {#if peakHour}
        <div class="p-6 rounded-3xl bg-indigo-500 text-white shadow-xl shadow-indigo-500/20">
           <div class="flex items-center justify-between mb-4">
              <span class="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">🏆 Peak Focus Hour</span>
              <span class="text-xl">⚡</span>
           </div>
           <h3 class="text-3xl font-black mb-1">{peakHour.hour}:00h – {peakHour.hour + 1}:00h</h3>
           <p class="text-[11px] font-bold opacity-80 mb-6">Seu cérebro está mais afiado neste horário com <strong>{peakHour.accuracy}% de precisão</strong> e média de <strong>{peakHour.avgTime}s por card</strong>.</p>
           
           <div class="grid grid-cols-2 gap-3">
              <div class="bg-white/10 p-3 rounded-2xl border border-white/10">
                <div class="text-lg font-black">{peakHour.accuracy}%</div>
                <div class="text-[8px] font-black uppercase tracking-widest opacity-60">Precisão</div>
              </div>
              <div class="bg-white/10 p-3 rounded-2xl border border-white/10">
                <div class="text-lg font-black">{peakHour.avgTime}s</div>
                <div class="text-[8px] font-black uppercase tracking-widest opacity-60">Velocidade</div>
              </div>
           </div>
        </div>
      {/if}

      <!-- Hourly Intensity Grid -->
      <div>
        <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">MAPA DIÁRIO DE INTENSIDADE</h4>
        <div class="flex flex-wrap gap-2">
          {#each data as h}
            <div 
              class="w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-black border transition-all 
              {h.total > 0 ? 'bg-white dark:bg-slate-900 border-primary-100 dark:border-primary-900 shadow-sm' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-800'}
              {getIntensityClass(h.total)} group relative"
            >
              {h.hour}
              {#if h.total > 0}
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[8px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                   {h.total} reviews · {h.accuracy}%
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
