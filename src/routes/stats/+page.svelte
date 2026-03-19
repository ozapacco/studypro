<script>
  import { onMount } from 'svelte';
  import { fade, fly, slide } from 'svelte/transition';
  import { analytics } from '$lib/engines/analytics.js';
  import { scheduler } from '$lib/engines/scheduler.js';
  import { priorityRanker } from '$lib/engines/priorityRanker.js';
  import { initializeDatabase } from '$lib/db.js';
  import InteractiveCard from '$lib/components/common/InteractiveCard.svelte';
  import { COLORS } from '$lib/design/tokens.mjs';

  // New Components
  import ConsistencyHeatmap from '$lib/components/stats/ConsistencyHeatmap.svelte';
  import FutureWorkloadChart from '$lib/components/stats/FutureWorkloadChart.svelte';
  import EfficiencyAnalysis from '$lib/components/stats/EfficiencyAnalysis.svelte';

  let loading = true;
  let projection = null;
  let queueStats = null;
  let timeEstimate = null;
  let rankedSubjects = [];
  let periodStats = null;

  const trendLabel = {
    insufficient_data: 'Dados insuficientes',
    improving: 'Melhorando',
    declining: 'Piorando',
    stable: 'Estável'
  };

  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(defaultStart.getDate() - 29);

  let startDate = defaultStart.toISOString().split('T')[0];
  let endDate = today.toISOString().split('T')[0];

  onMount(async () => {
    await initializeDatabase();
    await loadStats();
  });

  async function loadStats() {
    loading = true;
    const [projectionResult, queueResult, estimateResult, rankedResult, periodResult] = await Promise.all([
      analytics.projectPassProbability(),
      scheduler.getQueueStats(),
      scheduler.estimateStudyTime(),
      priorityRanker.rankSubjects(),
      analytics.getPeriodStats(startDate, endDate)
    ]);

    projection = projectionResult;
    queueStats = queueResult;
    timeEstimate = estimateResult;
    rankedSubjects = rankedResult;
    periodStats = periodResult;
    loading = false;
  }

  function getTrendColor(trend) {
    if (trend === 'improving') return 'text-emerald-500';
    if (trend === 'declining') return 'text-rose-500';
    return 'text-slate-400';
  }
</script>

<svelte:head>
  <title>Analíticos Avançados | Sistemão</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-10 md:py-16 animate-fade-in">
  <!-- Header -->
  <header class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
    <div>
      <h1 class="text-3xl md:text-5xl font-black text-slate-800 dark:text-white leading-tight">Painel de Performance</h1>
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
        Elite Analytics Engine 2.0
      </p>
    </div>
    
    <div class="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none">
      <div class="flex flex-col px-3">
        <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Início</span>
        <input class="bg-transparent border-none p-0 text-xs font-black uppercase text-slate-700 dark:text-slate-200 focus:ring-0" type="date" bind:value={startDate} />
      </div>
      <div class="w-px h-6 bg-slate-100 dark:bg-slate-800"></div>
      <div class="flex flex-col px-3">
        <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fim</span>
        <input class="bg-transparent border-none p-0 text-xs font-black uppercase text-slate-700 dark:text-slate-200 focus:ring-0" type="date" bind:value={endDate} />
      </div>
      <button 
        on:click={loadStats} 
        class="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
        aria-label="Atualizar Dados"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
      </button>
    </div>
  </header>

  {#if loading}
    <div class="flex flex-col items-center justify-center py-32 gap-6">
      <div class="relative w-16 h-16">
        <div class="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
        <div class="absolute inset-0 border-4 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
      <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Sincronizando Módulos Analíticos...</span>
    </div>
  {:else}
    <!-- Quick Metrics Bento Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
      <!-- Projection -->
      <div class="lg:col-span-2">
        <InteractiveCard padding="lg" active={projection.passProbability > 75}>
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                🎯 Probabilidade de Aprovação
              </h3>
              <div class="flex items-baseline gap-2">
                 <span class="text-6xl md:text-7xl font-black text-primary-600 tracking-tighter">{projection.passProbability}%</span>
                 <span class="text-[10px] font-black text-slate-300 uppercase italic">Projetado</span>
              </div>
              <p class="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed mt-4 max-w-sm">
                "{projection.recommendation}"
              </p>
            </div>
            {#if projection.daysUntilExam}
               <div class="bg-primary-100/50 dark:bg-primary-900/30 px-4 py-2 rounded-2xl text-center border border-primary-200 dark:border-primary-800">
                  <div class="text-xl font-black text-primary-600">{projection.daysUntilExam}</div>
                  <div class="text-[8px] font-black text-primary-400 uppercase tracking-tighter">Dias p/ Prova</div>
               </div>
            {/if}
          </div>
        </InteractiveCard>
      </div>

      <!-- Structural Health -->
       <div class="lg:col-span-1">
        <InteractiveCard padding="lg">
          <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Fila de Revisão</h3>
          <div class="text-3xl font-black text-slate-800 dark:text-white mb-2">{timeEstimate.cards} <small class="text-xs uppercase opacity-30">Cards</small></div>
          <div class="flex items-center gap-2 mb-8">
            <span class="text-xs font-bold text-slate-500 italic">~{timeEstimate.estimatedMinutes} min de foco</span>
          </div>
          <div class="space-y-3">
             {#each [
               { label: 'Hoje', val: queueStats.dueToday, color: 'text-primary-600' },
               { label: 'Atrasados', val: queueStats.overdue, color: 'text-rose-500' }
             ] as stat}
               <div class="flex items-center justify-between">
                  <span class="text-[9px] font-black text-slate-400 uppercase">{stat.label}</span>
                  <span class="text-xs font-black {stat.color}">{stat.val}</span>
               </div>
             {/each}
          </div>
        </InteractiveCard>
      </div>

      <!-- Efficiency Quick Stat -->
      <div class="lg:col-span-1">
        <InteractiveCard padding="lg">
          <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Domínio Estável</h3>
          <div class="text-3xl font-black text-emerald-500 mb-2">
            {Math.round((periodStats.avgRetention || 0) * 100)}%
          </div>
          <div class="flex items-center gap-1.5 mb-8">
             <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[8px] font-black rounded-full uppercase italic">
               {trendLabel[periodStats.trend] || 'Nivelado'}
             </span>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[9px] font-black text-slate-400 uppercase">Período</span>
              <span class="text-xs font-black text-slate-700 dark:text-slate-200">{periodStats.days} dias</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[9px] font-black text-slate-400 uppercase">Intensidade</span>
              <span class="text-xs font-black text-slate-700 dark:text-slate-200">{Math.round(periodStats.totalCards / (periodStats.days || 1))} cards/dia</span>
            </div>
          </div>
        </InteractiveCard>
      </div>
    </div>

    <!-- Middle Section: Consistency & Future -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
       <!-- Heatmap -->
       <div class="lg:col-span-2 space-y-4">
          <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Heatmap de Consistência (365 Dias)</h3>
          <InteractiveCard padding="lg">
             <ConsistencyHeatmap />
          </InteractiveCard>
       </div>

       <!-- Future Workload -->
       <div class="lg:col-span-1 space-y-4">
          <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Carga Futura Projetada (14 Dias)</h3>
          <InteractiveCard padding="lg">
             <FutureWorkloadChart />
          </InteractiveCard>
       </div>
    </div>

    <!-- Bottom Section: Detailed Analysis -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
       <!-- Time/Efficiency Insights -->
       <div class="lg:col-span-1 space-y-4">
          <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Insights de Horário e Foco</h3>
          <EfficiencyAnalysis />
       </div>

       <!-- ROI Ranking -->
       <div class="lg:col-span-2 space-y-4">
          <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Ranking de Prioridade (ROI Strategic List)</h3>
          <div class="grid grid-cols-1 gap-4">
            {#each rankedSubjects.slice(0, 6) as subject, i}
               <div 
                class="animate-in fade-in slide-in-from-right-4 duration-500" 
                style="animation-delay: {i * 100}ms"
               >
                 <InteractiveCard padding="none">
                    <div class="flex items-center justify-between p-4">
                       <div class="flex items-center gap-4 min-w-0">
                          <div 
                            class="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0"
                            style="background: {subject.color}20; color: {subject.color}"
                          >
                            {i+1}
                          </div>
                          <div class="truncate">
                             <h4 class="text-xs font-black text-slate-800 dark:text-white uppercase truncate">{subject.name}</h4>
                             <p class="text-[9px] font-bold text-slate-400 italic truncate max-w-[200px]">"{subject.recommendation}"</p>
                          </div>
                       </div>
                       <div class="flex items-center gap-6 shrink-0">
                          <div class="text-right">
                             <div class="text-[10px] font-black text-primary-600">{subject.roi}</div>
                             <div class="text-[7px] font-black text-slate-300 uppercase tracking-widest">ROI SCORE</div>
                          </div>
                          <div class="w-1 bg-slate-100 dark:bg-slate-800 h-8 rounded-full"></div>
                          <div class="text-right">
                             <div class="text-[10px] font-black text-slate-700 dark:text-slate-200">{subject.urgency}%</div>
                             <div class="text-[7px] font-black text-slate-300 uppercase tracking-widest">URGÊNCIA</div>
                          </div>
                       </div>
                    </div>
                 </InteractiveCard>
               </div>
            {/each}
          </div>
       </div>
    </div>
  {/if}
</div>

<style>
  @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  
  :global(.scrollbar-hide::-webkit-scrollbar) {
    display: none;
  }
</style>
