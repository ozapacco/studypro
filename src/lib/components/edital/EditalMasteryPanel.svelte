<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { tutorEngine } from '$lib/engines/tutorEngine.js';
  import { COLORS, getMasteryColor, getMasteryLevel, getMasteryLabel, TRANSITIONS } from '$lib/design/tokens.mjs';
  import SubjectDrilldown from './SubjectDrilldown.svelte';

  export let showFilters = true;
  export let maxSubjects = null;

  let subjects = [];
  let loading = true;
  let filter = 'all';
  let selectedSubject = null;
  let expandedSubject = null;

  onMount(async () => {
    subjects = await tutorEngine.calculateSubjectMastery(
      await import('$lib/db.js').then(m => m.db.subjects.toArray())
    );
    subjects.sort((a, b) => a.domainScore - b.domainScore);
    if (maxSubjects) subjects = subjects.slice(0, maxSubjects);
    loading = false;
  });

  $: filtered = filter === 'all'
    ? subjects
    : filter === 'critical'
    ? subjects.filter(s => s.critical)
    : filter === 'weak'
    ? subjects.filter(s => s.weak && !s.critical)
    : subjects.filter(s => s.domainScore >= 85);

  $: criticalCount = subjects.filter(s => s.critical).length;
  $: weakCount = subjects.filter(s => s.weak).length;
  $: mediumCount = subjects.filter(s => s.domainScore >= 60 && s.domainScore < 85).length;
  $: strongCount = subjects.filter(s => s.domainScore >= 85).length;

  $: overallScore = subjects.length > 0
    ? Math.round(subjects.reduce((s, sub) => s + sub.domainScore, 0) / subjects.length)
    : 0;

  $: criticalWeight = subjects.filter(s => s.critical).reduce((s, sub) => s + (sub.weight || 0), 0);
  $: totalWeight = subjects.reduce((s, sub) => s + (sub.weight || 0), 0);

  function getBarColor(score) {
    return getMasteryColor(score);
  }

  function getMasteryLevelText(score) {
    return getMasteryLabel(score);
  }

  function getMasteryColorClass(score) {
    const level = getMasteryLevel(score);
    return `bg-mastery-${level}`;
  }

  function getMasteryTextColorClass(score) {
    const level = getMasteryLevel(score);
    return `text-mastery-${level}`;
  }

  function openDrilldown(subject) {
    expandedSubject = expandedSubject?.id === subject.id ? null : subject;
  }

  function goToSubject(subject) {
    goto(`/study?topicId=${subject.id}`);
  }

  function goToEdital() {
    goto('/edital');
  }
</script>

<div class="mastery-panel">
  {#if loading}
    <div class="panel-loading">
      <div class="spinner"></div>
      <span>Calculando dominio...</span>
    </div>
  {:else if subjects.length === 0}
    <div class="panel-empty">
      <span class="empty-icon">📋</span>
      <p>Nenhuma materia cadastrada.</p>
      <p class="empty-hint">Adicione materias para acompanhar o dominio do edital.</p>
    </div>
  {:else}
    <!-- Score geral -->
    <div class="flex items-center gap-6 mb-4">
      <div class="score-ring shadow-sm" style="--pct: {overallScore}; --ring-color: {getMasteryColor(overallScore)}">
        <div class="score-ring-inner">
          <span class="text-2xl font-black text-slate-800 dark:text-white leading-none">{overallScore}</span>
          <span class="text-[8px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">DOMINIO</span>
        </div>
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Dominio do Edital</h3>
        <div class="flex flex-wrap gap-2">
          <span class="text-[10px] font-bold px-2 rounded-full bg-mastery-critical text-white">criticas {criticalCount}</span>
          <span class="text-[10px] font-bold px-2 rounded-full bg-mastery-weak text-white">fracas {weakCount}</span>
          <span class="text-[10px] font-bold px-2 rounded-full bg-mastery-medium text-white">medias {mediumCount}</span>
          <span class="text-[10px] font-bold px-2 rounded-full bg-mastery-strong text-white">fortes {strongCount}</span>
        </div>
        {#if criticalWeight > 0 && totalWeight > 0}
          <div class="mt-3">
            <span class="text-[10px] font-extrabold text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-md border border-red-100 dark:border-red-900/50">
              ⚠️ {Math.round(criticalWeight)}% do edital em dominio critico
            </span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Barra de progresso geral -->
    <div class="overall-bar-wrap mb-6 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div class="overall-bar h-full transition-all duration-1000 {getMasteryColorClass(overallScore)}" style="width: {overallScore}%"></div>
    </div>

    <!-- Filtros -->
    {#if showFilters}
      <div class="flex flex-wrap gap-2 mb-6">
        {#each ['all', 'critical', 'weak', 'strong'] as f}
          {@const counts = { all: subjects.length, critical: criticalCount, weak: weakCount, strong: strongCount }}
          {@const labels = { all: 'Todas', critical: 'Criticas', weak: 'Fracas', strong: 'Fortes' }}
          <button 
            class="px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-200 {filter === f ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary-400'}" 
            on:click={() => filter = f}
          >
            {labels[f]} ({counts[f]})
          </button>
        {/each}
      </div>
    {/if}

    <!-- Lista de materias -->
    <div class="flex flex-col gap-3">
      {#each filtered as subject, i (subject.id)}
        {@const levelLabel = getMasteryLevelText(subject.domainScore)}
        <div class="animate-in fade-in slide-in-from-right-4 duration-500" style="animation-delay: {i * 40}ms">
          <div class="rounded-2xl border-2 transition-all duration-300 overflow-hidden {expandedSubject?.id === subject.id ? 'border-primary-500 dark:border-primary-400 shadow-xl' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950'}">
            <button class="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50" on:click={() => openDrilldown(subject)}>
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style="background: {subject.color || COLORS.mastery.neutral}"></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 mb-1.5">
                    <span class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">{subject.name}</span>
                    <span class="text-[10px] font-black text-slate-400">{subject.weight ? Math.round(subject.weight * 100) : 0}% peso</span>
                  </div>
                  <div class="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-700 {getMasteryColorClass(subject.domainScore)}" style="width: {subject.domainScore}%"></div>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3 ml-6 flex-shrink-0">
                <span class="text-[9px] font-black px-2.5 py-1 rounded-full text-white uppercase tracking-tight shadow-sm {getMasteryColorClass(subject.domainScore)}">
                  {levelLabel}
                </span>
                <span class="text-sm font-black text-slate-800 dark:text-white min-w-[32px] text-right">{subject.domainScore}%</span>
                <span class="text-slate-300 dark:text-slate-600 transition-transform duration-300 {expandedSubject?.id === subject.id ? 'rotate-180' : ''}">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </span>
              </div>
            </button>

            {#if expandedSubject?.id === subject.id}
              <div class="p-5 border-t-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-black/20">
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                  {#each [
                    { label: 'Retenção', value: subject.retention },
                    { label: 'Acerto', value: subject.accuracy },
                    { label: 'Cobertura', value: subject.coverage }
                  ] as metric}
                    <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                      <span class="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{metric.label}</span>
                      <span class="block text-lg font-black {getMasteryTextColorClass(metric.value)}">{metric.value}%</span>
                      <div class="h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div class="h-full rounded-full {getMasteryColorClass(metric.value)}" style="width: {metric.value}%"></div>
                      </div>
                    </div>
                  {/each}
                  <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                    <span class="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Cards</span>
                    <span class="block text-lg font-black text-slate-800 dark:text-white">{subject.totalCards}</span>
                    <span class="block text-[9px] font-bold text-emerald-500 mt-1">{subject.matureCards} Maduros</span>
                  </div>
                </div>

                <div class="flex gap-3">
                  <button 
                    class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20" 
                    on:click={() => goto(`/study?topicId=${subject.id}`)}
                  >
                    ▶ Estudar {subject.name}
                  </button>
                  <a href="/edital" class="px-6 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-colors text-center">Painel Detalhado</a>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    {#if !maxSubjects}
      <button class="w-full mt-6 py-4 bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 transition-all hover:bg-white dark:hover:bg-slate-950 hover:border-solid hover:shadow-lg" on:click={goToEdital}>
        Explorar Edital Completo →
      </button>
    {/if}
  {/if}
</div>

<style>
  .score-ring {
    position: relative;
    width: 80px;
    height: 80px;
    flex-shrink: 0;
    border-radius: 50%;
    background: conic-gradient(var(--ring-color, #6366f1) 0%, var(--ring-color, #6366f1) calc(var(--pct) * 1%), rgba(0,0,0,0.05) calc(var(--pct) * 1%));
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .score-ring:hover { transform: scale(1.05); }
  
  :global(.dark) .score-ring { background: conic-gradient(var(--ring-color, #6366f1) 0%, var(--ring-color, #6366f1) calc(var(--pct) * 1%), rgba(255,255,255,0.05) calc(var(--pct) * 1%)); }
  
  .score-ring::before {
    content: '';
    position: absolute;
    inset: 8px;
    background: white;
    border-radius: 50%;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  }
  :global(.dark) .score-ring::before { background: #020617; box-shadow: inset 0 2px 4px rgba(255,255,255,0.02); }
  
  .score-ring-inner {
    position: relative;
    text-align: center;
    z-index: 10;
  }
</style>
