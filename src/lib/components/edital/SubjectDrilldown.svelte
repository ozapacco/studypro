<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { db } from '$lib/db.js';
  import { tutorEngine } from '$lib/engines/tutorEngine.js';
  import { getMasteryColor, getMasteryLevel, getMasteryLabel, TRANSITIONS } from '$lib/design/tokens.mjs';
  import MasteryGauge from '$lib/components/study/MasteryGauge.svelte';
  import InteractiveCard from '$lib/components/common/InteractiveCard.svelte';

  export let subjectId;
  export let compact = false;

  let subject = null;
  let topics = [];
  let recentNotes = [];
  let recentErrors = [];
  let loading = true;
  let expandedTopic = null;
  let subjectMastery = null;
  let bestTopicId = null;

  onMount(async () => {
    subject = await db.subjects.get(subjectId);
    const masteryData = await tutorEngine.calculateSubjectMastery([subject]);
    subjectMastery = masteryData[0] || null;
    topics = await db.topics.where('subjectId').equals(subjectId).toArray();
    topics.sort((a, b) => (b.importance || 1) - (a.importance || 1));

    if (topics.length > 0) {
      bestTopicId = topics[0].id;
    }

    const allCards = await db.cards.where('subjectId').equals(subjectId).toArray();
    const topicIds = topics.map(t => t.id);

    const topicStats = await Promise.all(topics.map(async (topic) => {
      const cards = allCards.filter(c => c.topicId === topic.id);
      const reviewCards = cards.filter(c => c.state === 'review' && c.lastReview);
      const mature = reviewCards.filter(c => (c.stability || 0) > 21);
      const retention = reviewCards.length > 0 ? (mature.length / reviewCards.length) : 0;
      const totalCorrect = reviewCards.reduce((s, c) => s + (c.stats?.correctCount || 0), 0);
      const totalReviewed = reviewCards.reduce((s, c) => s + (c.stats?.totalReviews || 0), 0);
      const accuracy = totalReviewed > 0 ? totalCorrect / totalReviewed : 0;
      const coverage = cards.length > 0 ? (cards.length - cards.filter(c => c.state === 'new').length) / cards.length : 0;

      return {
        ...topic,
        totalCards: cards.length,
        matureCards: mature.length,
        retention: Math.round(retention * 100),
        accuracy: Math.round(accuracy * 100),
        coverage: Math.round(coverage * 100),
      };
    }));
    topics = topicStats;

    const today = new Date();
    today.setDate(today.getDate() - 30);
    const since = today.toISOString();
    const topicNotes = await db.notes.where('topicId').anyOf(topicIds).toArray();
    recentNotes = topicNotes.filter(n => n.type === 'bizu' && n.createdAt >= since).slice(0, 5);
    recentErrors = topicNotes.filter(n => n.type === 'error' && n.createdAt >= since).slice(0, 5);

    loading = false;
  });

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
</script>

{#if loading}
  <div class="flex items-center gap-3 p-6 text-slate-400 text-sm">
    <div class="w-4 h-4 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin"></div>
    <span>Carregando...</span>
  </div>
{:else if subject}
  <div class="animate-in fade-in slide-in-from-bottom-2 duration-500">
    <!-- Hero Section -->
    <div class="rounded-2xl p-5 text-white mb-6 shadow-xl" style="background: linear-gradient(135deg, {subject.color || '#6366f1'}, color-mix(in srgb, {subject.color || '#6366f1'} 70%, black))">
      <div class="flex items-center justify-between gap-4">
        <div class="flex-1 min-w-0">
          <h2 class="text-xl font-black mb-1 truncate">{subject.name}</h2>
          <div class="flex items-center gap-2 mb-3">
            <span class="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest leading-none">Peso: {Math.round((subject.weight || 0) * 100)}%</span>
            {#if subjectMastery}
              <span class="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest leading-none">{getMasteryLabel(subjectMastery.domainScore)}</span>
            {/if}
          </div>
          {#if subjectMastery}
            <div class="flex gap-3 text-[10px] font-bold opacity-80 uppercase tracking-tight">
              <span>Retenção: {subjectMastery.retention}%</span>
              <span>Acerto: {subjectMastery.accuracy}%</span>
              <span>Cobertura: {subjectMastery.coverage}%</span>
            </div>
          {/if}
        </div>
        {#if subjectMastery}
          <div class="bg-white/10 p-2 rounded-full backdrop-blur-sm border border-white/10">
            <MasteryGauge score={subjectMastery.domainScore} size="md" animate={false} />
          </div>
        {/if}
      </div>
      <button class="w-full mt-4 bg-white text-slate-900 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]" on:click={() => goto(`/study?topicId=${bestTopicId}`)}>
        ▶ Iniciar Sessão Sugerida
      </button>
    </div>

    {#if !compact}
      <!-- Bizus e Erros Recentes -->
      {#if recentNotes.length > 0 || recentErrors.length > 0}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {#if recentNotes.length > 0}
            <div class="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <h4 class="text-[9px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.1em] mb-3">💡 Bizus recentes</h4>
              <div class="flex flex-col gap-2">
                {#each recentNotes as note}
                  <div class="text-[11px] leading-relaxed p-2 bg-white dark:bg-slate-800 rounded-lg border border-amber-100/50 dark:border-amber-950/50 shadow-sm">
                    <span class="font-bold text-slate-500 dark:text-slate-400 block mb-0.5">{topics.find(t => t.id === note.topicId)?.name || '?'}:</span>
                    <span class="text-slate-700 dark:text-slate-200 italic">"{note.content?.slice(0, 80)}{note.content?.length > 80 ? '...' : ''}"</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
          {#if recentErrors.length > 0}
            <div class="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
              <h4 class="text-[9px] font-black text-red-600 dark:text-red-500 uppercase tracking-[0.1em] mb-3">📕 Erros recentes</h4>
              <div class="flex flex-col gap-2">
                {#each recentErrors as note}
                  <div class="text-[11px] leading-relaxed p-2 bg-white dark:bg-slate-800 rounded-lg border border-red-100/50 dark:border-red-950/50 shadow-sm">
                    <span class="font-bold text-slate-500 dark:text-slate-400 block mb-0.5">{topics.find(t => t.id === note.topicId)?.name || '?'}:</span>
                    <span class="text-slate-700 dark:text-slate-200 italic">"{note.content?.slice(0, 80)}{note.content?.length > 80 ? '...' : ''}"</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    {/if}

    <!-- Topicos -->
    <div class="mt-4">
      <h4 class="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4 px-1">Tópicos da Matéria</h4>
      <div class="flex flex-col gap-2">
        {#each topics as topic, i (topic.id)}
          <div 
            class="animate-in fade-in slide-in-from-bottom-2 duration-500" 
            style="animation-delay: {i * 40}ms"
          >
            <InteractiveCard 
              clickable={true} 
              animate={true} 
              padding="none" 
              className="{expandedTopic === topic.id ? 'ring-2 ring-primary-500 ring-inset shadow-lg' : ''}"
            >
            <div class="transition-all duration-300">
              <button 
                class="w-full flex items-center justify-between p-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30" 
                on:click={() => expandedTopic = expandedTopic === topic.id ? null : topic.id}
              >
                <div class="flex items-center gap-3">
                  <div class="flex gap-0.5">
                    {#each Array(5) as _, i}
                      <div class="w-1.5 h-1.5 rounded-full {i < (topic.importance || 1) ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-slate-100 dark:bg-slate-800'}"></div>
                    {/each}
                  </div>
                  <span class="text-sm font-bold text-slate-700 dark:text-slate-200">{topic.name}</span>
                </div>
                <div class="flex items-center gap-3 ml-4">
                  <MasteryGauge score={topic.retention} size="xs" animate={false} />
                  <span class="text-[10px] font-black text-slate-400">{topic.totalCards}c</span>
                  <span class="text-slate-300 dark:text-slate-600 transition-transform {expandedTopic === topic.id ? 'rotate-180' : ''}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </span>
                </div>
              </button>

              {#if expandedTopic === topic.id}
                <div class="px-4 pb-4 pt-1 border-t border-slate-50 dark:border-slate-800/50 bg-slate-50/20 dark:bg-black/10">
                  <div class="grid grid-cols-3 gap-3 mb-4 mt-3">
                    {#each [
                      { label: 'Retenção', value: topic.retention },
                      { label: 'Acerto', value: topic.accuracy },
                      { label: 'Cobertura', value: topic.coverage }
                    ] as metric}
                      <div>
                        <span class="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">{metric.label}</span>
                        <div class="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div class="h-full rounded-full {getMasteryColorClass(metric.value)}" style="width: {metric.value}%"></div>
                        </div>
                        <span class="text-[10px] font-black mt-1 block {getMasteryTextColorClass(metric.value)}">{metric.value}%</span>
                      </div>
                    {/each}
                  </div>
                  <div class="flex items-center justify-between mb-4 text-[10px] font-bold text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span>{topic.totalCards} cards totais</span>
                    <span class="text-slate-600 dark:text-slate-300">{topic.matureCards} maduros</span>
                  </div>
                  <button class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-black text-xs transition-all shadow-lg shadow-emerald-500/10 hover:scale-[1.01]" on:click={() => goto(`/study?topicId=${topic.id}`)} aria-label="Iniciar Sessão do Tópico">
                    ▶ Iniciar Sessão do Tópico
                  </button>
                </div>
              {/if}
            </div>
            </InteractiveCard>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
