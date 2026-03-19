<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { tutorEngine } from '$lib/engines/tutorEngine.js';
  import { getMasteryColor, getMasteryLevel, TRANSITIONS } from '$lib/design/tokens.mjs';

  let subjects = [];
  let loading = true;

  onMount(async () => {
    try {
      const { db } = await import('$lib/db.js');
      subjects = await tutorEngine.calculateSubjectMastery(await db.subjects.toArray());
    } catch (e) {
      subjects = [];
    }
    loading = false;
  });

  $: overallScore = subjects.length > 0
    ? Math.round(subjects.reduce((s, sub) => s + sub.domainScore, 0) / subjects.length)
    : 0;
  $: criticalCount = subjects.filter(s => s.critical).length;
  $: weakCount = subjects.filter(s => s.weak && !s.critical).length;

  function getBarColor(score) {
    return getMasteryColor(score);
  }

  function getMasteryColorClass(score) {
    const level = getMasteryLevel(score);
    return `bg-mastery-${level}`;
  }

  function getMasteryTextColorClass(score) {
    const level = getMasteryLevel(score);
    return `text-mastery-${level}`;
  }
</script>

<button 
  class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-left transition-all duration-200 hover:border-primary-500 hover:shadow-lg hover:-translate-y-0.5 group active:scale-[0.98]" 
  on:click={() => goto('/edital')}
>
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center gap-2">
      <span class="text-xs">📊</span>
      <span class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Domínio Edital</span>
    </div>
    {#if !loading && criticalCount > 0}
      <span class="bg-mastery-critical text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">{criticalCount}!</span>
    {/if}
  </div>

  {#if loading}
    <div class="flex justify-center py-2">
      <div class="w-4 h-4 border-2 border-slate-100 border-t-primary-500 rounded-full animate-spin"></div>
    </div>
  {:else}
    <div class="flex items-baseline gap-1 mb-2">
      <span class="text-2xl font-black leading-none {getMasteryTextColorClass(overallScore)}">{overallScore}</span>
      <span class="text-[10px] font-bold text-slate-400">/100</span>
    </div>
    <div class="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2.5">
      <div class="h-full rounded-full transition-all duration-700 {getMasteryColorClass(overallScore)}" style="width: {overallScore}%"></div>
    </div>
    <div class="flex items-center gap-1.5">
      {#if criticalCount > 0}
        <span class="w-1.5 h-1.5 rounded-full bg-mastery-critical"></span>
        <p class="text-[10px] font-bold text-mastery-critical truncate">{criticalCount} matéria(s) crítica(s)</p>
      {:else if weakCount > 0}
        <span class="w-1.5 h-1.5 rounded-full bg-mastery-weak"></span>
        <p class="text-[10px] font-bold text-mastery-weak truncate">{weakCount} matéria(s) fraca(s)</p>
      {:else}
        <span class="w-1.5 h-1.5 rounded-full bg-mastery-strong"></span>
        <p class="text-[10px] font-bold text-mastery-strong truncate">Edital saudável</p>
      {/if}
    </div>
  {/if}
</button>

<style>
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
