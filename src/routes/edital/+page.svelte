<script>
  import { onMount } from 'svelte';
  import { fade, fly, slide } from 'svelte/transition';
  import { page } from '$app/stores';
  import { db, initializeDatabase } from '$lib/db.js';
  import { tutorEngine } from '$lib/engines/tutorEngine.js';
  import { getMasteryColor, getMasteryLevel, getMasteryLabel, TRANSITIONS, COLORS } from '$lib/design/tokens.mjs';
  import EditalMasteryPanel from '$lib/components/edital/EditalMasteryPanel.svelte';
  import SubjectDrilldown from '$lib/components/edital/SubjectDrilldown.svelte';
  import InteractiveCard from '$lib/components/common/InteractiveCard.svelte';
  import MasteryGauge from '$lib/components/study/MasteryGauge.svelte';

  let loading = true;
  let subjects = [];
  let selectedSubjectId = null;
  let examDate = null;
  let daysLeft = null;

  onMount(async () => {
    await initializeDatabase();
    const config = await db.config.get(1);
    examDate = config?.targetExam?.date;
    if (examDate) {
      daysLeft = Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / 86400000);
    }

    subjects = await tutorEngine.calculateSubjectMastery(await db.subjects.toArray());
    subjects.sort((a, b) => a.domainScore - b.domainScore);

    const urlSubject = $page.url.searchParams.get('subject');
    if (urlSubject) {
      selectedSubjectId = parseInt(urlSubject);
    }

    loading = false;
  });

  function selectSubject(id) {
    selectedSubjectId = selectedSubjectId === id ? null : id;
    if (selectedSubjectId) {
      // Small delay to allow layout to shift
      setTimeout(() => {
        const el = document.getElementById(`subject-detail-${id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  $: overallScore = subjects.length > 0
    ? Math.round(subjects.reduce((s, sub) => s + sub.domainScore, 0) / subjects.length)
    : 0;

  $: criticalCount = subjects.filter(s => s.critical).length;
  $: weakCount = subjects.filter(s => s.weak && !s.critical).length;
  $: strongCount = subjects.filter(s => s.domainScore >= 85).length;
</script>

<svelte:head>
  <title>Domínio do Edital | Sistemão</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8 md:py-12 animate-fade-in">
  <!-- Header -->
  <header class="mb-10">
    <a href="/" class="group inline-flex items-center gap-2 text-slate-400 hover:text-primary-500 transition-colors mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      <span class="text-[10px] font-black uppercase tracking-widest">Painel</span>
    </a>
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl md:text-4xl font-black text-slate-800 dark:text-white leading-tight">Domínio do Edital</h1>
        {#if examDate}
          <div class="flex items-center gap-3 mt-2">
            <span class="text-xs font-bold text-slate-400">{new Date(examDate).toLocaleDateString('pt-BR')}</span>
            <span class="w-1 h-1 rounded-full bg-slate-300"></span>
            <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full {daysLeft < 30 ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">
              {daysLeft} dias restantes
            </span>
          </div>
        {/if}
      </div>
    </div>
  </header>

  {#if loading}
    <div class="flex flex-col items-center justify-center h-64 gap-4">
      <div class="w-10 h-10 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin"></div>
      <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculando Dominio...</span>
    </div>
  {:else if subjects.length === 0}
    <div class="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl animate-scale-in">
      <span class="text-5xl mb-6 block">📚</span>
      <h2 class="text-2xl font-black text-slate-800 dark:text-white mb-2">Nenhuma Matéria Cadastrada</h2>
      <p class="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8 font-bold">
        Você precisa adicionar matérias para visualizar seu desempenho global e detalhado.
      </p>
      <a href="/subjects" class="px-8 py-3 bg-primary-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all">
        ADICIONAR MATÉRIAS
      </a>
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start">
      <!-- Left Column: Global Overview -->
      <div class="lg:col-span-4 space-y-8">
        <!-- Global Mastery Panel -->
        <div class="animate-in fade-in slide-in-from-left-4 duration-500">
           <InteractiveCard padding="lg">
             <EditalMasteryPanel showFilters={true} />
           </InteractiveCard>
        </div>

        <!-- Legend -->
        <div class="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
          <h3 class="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4">Legenda de Domínio</h3>
          <div class="space-y-4">
            {#each [
              { label: 'CRÍTICO', color: 'bg-mastery-critical', desc: '< 40% — Foco total necessário' },
              { label: 'FRACO', color: 'bg-mastery-weak', desc: '40-59% — Revisão frequente' },
              { label: 'MÉDIO', color: 'bg-mastery-medium', desc: '60-84% — Em consolidação' },
              { label: 'FORTE', color: 'bg-mastery-strong', desc: '≥ 85% — Modo manutenção' }
            ] as item}
              <div class="flex items-start gap-3">
                <span class="w-2.5 h-2.5 rounded-full {item.color} mt-1 flex-shrink-0 animate-pulse"></span>
                <div class="flex flex-col">
                  <span class="text-[9px] font-black text-slate-700 dark:text-slate-200 tracking-wider">
                    {item.label}
                  </span>
                  <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    {item.desc}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Right Column: List & Details -->
      <div class="lg:col-span-8 space-y-8">
        <!-- Dashboard Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
          <InteractiveCard padding="lg">
            <div class="flex items-center gap-6">
              <MasteryGauge score={overallScore} size="lg" animate={true} label="SCORE" />
              <div class="flex-1">
                <h2 class="text-xl font-black text-slate-800 dark:text-white leading-none mb-4">Domínio Geral</h2>
                <div class="flex flex-wrap gap-2">
                  {#if criticalCount > 0}
                    <span class="px-2.5 py-1 rounded-full bg-mastery-critical text-white text-[9px] font-black shadow-lg shadow-mastery-critical/20">
                      {criticalCount} CRÍTICAS
                    </span>
                  {/if}
                  {#if weakCount > 0}
                    <span class="px-2.5 py-1 rounded-full bg-mastery-weak text-white text-[9px] font-black shadow-lg shadow-mastery-weak/20">
                      {weakCount} FRACAS
                    </span>
                  {/if}
                  <span class="px-2.5 py-1 rounded-full bg-mastery-strong text-white text-[9px] font-black shadow-lg shadow-mastery-strong/20">
                    {strongCount} FORTES
                  </span>
                </div>
              </div>
            </div>
          </InteractiveCard>

          <InteractiveCard padding="lg">
             <div class="h-full flex flex-col justify-center">
               <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Meta de Desempenho</h3>
               <div class="space-y-4">
                 <div class="flex justify-between items-end">
                   <span class="text-2xl font-black text-slate-800 dark:text-white">{overallScore}%</span>
                   <span class="text-[10px] font-bold text-slate-400 mb-1">META: 90%</span>
                 </div>
                 <div class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div class="h-full bg-primary-500 rounded-full transition-all duration-1000" style="width: {overallScore}%"></div>
                 </div>
               </div>
             </div>
          </InteractiveCard>
        </div>

        <!-- Subjects Detail List -->
        <div class="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Distribuição por Matéria</h3>
          
          <div class="grid grid-cols-1 gap-4">
            {#each subjects as subject (subject.id)}
              {@const level = getMasteryLevel(subject.domainScore)}
              {@const colorClass = `bg-mastery-${level}`}
              <div id="subject-detail-{subject.id}" class="scroll-mt-10">
                <InteractiveCard 
                  clickable={true} 
                  padding="none" 
                  on:click={() => selectSubject(subject.id)}
                  className="overflow-hidden {selectedSubjectId === subject.id ? 'ring-2 ring-primary-500 ring-inset shadow-2xl' : ''}"
                >
                  <div class="p-5 flex items-center justify-between gap-4">
                    <div class="flex items-center gap-4 flex-1 overflow-hidden">
                      <div class="w-2.5 h-10 rounded-full flex-shrink-0" style="background: {subject.color || COLORS.primary[500]}"></div>
                      <div class="flex-1 overflow-hidden">
                        <div class="flex items-baseline gap-2 mb-1">
                          <h4 class="text-base font-black text-slate-800 dark:text-white truncate">{subject.name}</h4>
                          <span class="text-[9px] font-bold text-slate-400">PESO: {Math.round((subject.weight || 0) * 100)}%</span>
                        </div>
                        <div class="flex items-center gap-3">
                          <div class="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-[120px]">
                            <div class="h-full {colorClass} transition-all duration-700" style="width: {subject.domainScore}%"></div>
                          </div>
                          <span class="text-xs font-black text-slate-500 dark:text-slate-400">{subject.domainScore}%</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-4 flex-shrink-0">
                      <MasteryGauge score={subject.domainScore} size="sm" animate={false} />
                      <span class="text-slate-300 dark:text-slate-700 transition-transform duration-300 {selectedSubjectId === subject.id ? 'rotate-180' : ''}">
                         <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </span>
                    </div>
                  </div>

                  {#if selectedSubjectId === subject.id}
                    <div class="border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/40 p-6 md:p-8" transition:slide={{ duration: 300 }}>
                      <SubjectDrilldown subjectId={subject.id} compact={false} />
                    </div>
                  {/if}
                </InteractiveCard>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
</style>
