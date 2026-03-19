<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { sessionGenerator } from '$lib/engines/sessionGenerator.js';
  import { COLORS, getMasteryColor, getMasteryLevel, getMasteryLabel, getMasteryBackground, TRANSITIONS, ANIMATIONS } from '$lib/design/tokens.mjs';
  import Spinner from '$lib/components/common/Spinner.svelte';

  /** @type {any[]} */
  let mission = [];
  /** @type {any[]} */
  let healthPanel = [];
  let loading = true;
  let progressToday = 0;

  const ACTION_CONFIG = {
    urgent: { 
      label: 'Urgente', 
      icon: '🚨', 
      bg: 'bg-mastery-critical/10 dark:bg-mastery-critical/20', 
      border: 'border-mastery-critical/20 dark:border-mastery-critical/30', 
      badge: 'bg-mastery-critical', 
      btnClass: 'bg-mastery-critical hover:bg-mastery-critical/90' 
    },
    review: { 
      label: 'Revisão', 
      icon: '🔄', 
      bg: 'bg-primary-50 dark:bg-primary-900/20', 
      border: 'border-primary-200 dark:border-primary-700', 
      badge: 'bg-primary-600', 
      btnClass: 'bg-primary-600 hover:bg-primary-700' 
    },
    new: { 
      label: 'Novo', 
      icon: '✨', 
      bg: 'bg-state-new/10 dark:bg-state-new/20', 
      border: 'border-state-new/20 dark:border-state-new/30', 
      badge: 'bg-state-new', 
      btnClass: 'bg-state-new hover:bg-state-new/90' 
    },
  };

  const HEALTH_CONFIG = {
    healthy:  { icon: '✅', label: 'Saudável', color: 'text-emerald-600 dark:text-emerald-400' },
    warning:  { icon: '⚠️', label: 'Atenção',  color: 'text-amber-500 dark:text-amber-400' },
    critical: { icon: '🔴', label: 'Crítico',  color: 'text-red-500 dark:text-red-400' },
    none:     { icon: '❓', label: 'Sem dados', color: 'text-slate-400 dark:text-slate-500' },
  };

  function getMasteryConfig(masteryLevel) {
    if (!masteryLevel || masteryLevel === 'neutro') return null;
    
    const colorClass = getMasteryColorClass(masteryLevel);
    const bgClass = colorClass.replace('text-', 'bg-');
    const borderClass = colorClass.replace('text-', 'border-');
    const label = getMasteryLabel(masteryLevel);
    
    let icon = '📊';
    switch(masteryLevel) {
      case 'critico': case 'urgente': icon = '🚨'; break;
      case 'fraco': icon = '📚'; break;
      case 'medio': icon = '📈'; break;
      case 'forte': icon = '💪'; break;
    }
    
    return { icon, colorClass, bgClass, borderClass, label };
  }

  onMount(async () => {
    [mission, healthPanel] = await Promise.all([
      sessionGenerator.getDailyMission(5),
      sessionGenerator.getSubjectHealthPanel(),
    ]);
    loading = false;
  });

  function studyTopic(topicId) {
    goto(`/study?topicId=${topicId}`);
    // Animate button feedback
    document.dispatchEvent(new CustomEvent('topicStart', { detail: { topicId } }));
  }

  function getHealthStatus(retention) {
    if (retention === null || retention === undefined) return 'none';
    if (retention < 60) return 'critical';
    if (retention < 75) return 'warning';
    return 'healthy';
  }

  // Helper function for Tailwind mastery color classes
  function getMasteryColorClass(masteryLevel) {
    // masteryLevel is a string like 'critico', 'fraco', 'medio', 'forte'
    // Map to Tailwind classes
    const classMap = {
      'critico': 'text-mastery-critical',
      'fraco': 'text-mastery-weak',
      'medio': 'text-mastery-medium',
      'forte': 'text-mastery-strong',
      'neutral': 'text-mastery-neutral'
    };
    return classMap[masteryLevel] || 'text-mastery-neutral';
  }
</script>

<div class="mission-container animate-fade-in">
{#if loading}
  <div class="flex items-center justify-center h-48">
    <Spinner size="lg" color="text-primary-500" />
  </div>
{:else if mission.length === 0}
  <div class="flex flex-col items-center justify-center h-48 text-center space-y-4">
    <span class="text-5xl animate-bounce">🎉</span>
    <div>
      <p class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Missão cumprida!</p>
      <p class="text-sm text-gray-500 dark:text-gray-400">Nenhum tópico pendente por agora. Adicione novos cards ou descanse.</p>
    </div>
  </div>
{:else}
  <!-- ── Header ── -->
  <div class="flex items-start justify-between mb-6 animate-slide-up">
    <div>
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
        <span class="text-3xl">🚀</span>
        Missão do Dia
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 font-medium italic">"Foco total. Um tópico de cada vez."</p>
    </div>
    <div class="text-right">
      <div class="text-3xl font-extrabold text-primary-600 dark:text-primary-400 leading-none">{progressToday}</div>
      <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">/ {mission.length} concluídos</div>
    </div>
  </div>

  <!-- ── HERO: Primeiro tópico em destaque ── -->
  {#if mission[0]}
    {@const hero = mission[0]}
    {@const cfg = ACTION_CONFIG[hero.actionType] || ACTION_CONFIG.review}
    {@const masteryCfg = hero.masteryLevel ? getMasteryConfig(hero.masteryLevel) : null}
    <div 
      class="relative rounded-2xl p-6 mb-6 card-interaction-trigger animate-scale-in {cfg.bg} border-2 {cfg.border} shadow-lg hover:shadow-interactive-hover transition-all duration-300 group"
    >
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider" style="color: {hero.subjectColor || COLORS.mastery.neutral}">
            <span class="w-2.5 h-2.5 rounded-full" style="background: {hero.subjectColor || COLORS.mastery.neutral}"></span>
            <span class="truncate max-w-[150px] sm:max-w-[200px]">{hero.subjectName}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] sm:text-xs font-bold text-white px-3 py-1.5 rounded-full uppercase tracking-tight {cfg.badge}">
            {cfg.icon} {cfg.label}
          </span>
          {#if masteryCfg}
            <span 
              class="text-[10px] sm:text-xs font-bold text-white px-3 py-1.5 rounded-full border border-white/30 {masteryCfg.bgClass}"
            >
              {masteryCfg.icon} {hero.retention}%
            </span>
          {/if}
        </div>
      </div>

      <h3 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-4 line-clamp-2">{hero.topicName}</h3>

      {#if masteryCfg}
        <div 
          class="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl border-l-4 font-semibold text-sm {masteryCfg.borderClass} {masteryCfg.bgClass}"
        >
          <span class="{masteryCfg.colorClass}">{masteryCfg.icon}</span>
          <span class="{masteryCfg.colorClass} uppercase font-bold">{masteryCfg.label}</span>
          <span class="text-gray-600 dark:text-gray-300">
            — {hero.domainScore}% geral · {hero.accuracy}% acerto
          </span>
        </div>
      {/if}

      <div class="flex flex-wrap gap-2 mb-6">
        {#if hero.urgentCount > 0}
          <span class="px-3 py-1.5 text-xs font-bold rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700">
            🚨 {hero.urgentCount} urgentes
          </span>
        {/if}
        {#if hero.reviewCount > 0}
          <span class="px-3 py-1.5 text-xs font-bold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
            🔄 {hero.reviewCount} revisões
          </span>
        {/if}
        {#if hero.newCount > 0}
          <span class="px-3 py-1.5 text-xs font-bold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
            ✨ {hero.newCount} novos
          </span>
        {/if}
      </div>

      <button
        class="w-full bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 hover:from-primary-600 hover:via-primary-700 hover:to-primary-800 text-white text-lg font-bold py-3.5 px-6 rounded-xl {TRANSITIONS.base} hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] focus-ring group-hover:shadow-xl relative overflow-hidden"
        on:click={() => studyTopic(hero.topicId)}
      >
        <div class="relative z-10 flex items-center justify-center gap-3">
          <span class="text-xl">▶</span>
          <span>Estudar agora</span>
        </div>
        <div class="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
      </button>
    </div>
  {/if}

  <!-- ── Fila: próximos tópicos ── -->
  {#if mission.length > 1}
    <div class="mt-8">
      <h4 class="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-extrabold mb-3">Na Fila — Próximos</h4>
      <div class="flex flex-col gap-2">
        {#each mission.slice(1) as item, i}
          {@const cfg = ACTION_CONFIG[item.actionType] || ACTION_CONFIG.review}
          {@const mc = item.masteryLevel ? getMasteryConfig(item.masteryLevel) : null}
           <button
            class="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 p-3 text-left transition-all duration-200 hover:translate-x-1 hover:shadow-interactive animate-fade-in"
            style="border-left: 4px solid {item.subjectColor || COLORS.mastery.neutral}; animation-delay: {i * 50}ms"
            on:click={() => studyTopic(item.topicId)}
          >
            <div class="text-[10px] font-black text-slate-300 dark:text-slate-600 w-4 flex-shrink-0 text-center">{i + 2}</div>
            <div class="flex-1 min-w-0">
              <div class="text-[10px] font-bold uppercase tracking-wider opacity-80 truncate" style="color: {item.subjectColor || COLORS.mastery.neutral}">
                {item.subjectName}
              </div>
              <div class="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{item.topicName}</div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="w-7 h-7 flex items-center justify-center rounded-full text-white text-xs {cfg.badge} shadow-sm overflow-hidden" title={cfg.label}>
                {cfg.icon}
              </span>
              {#if item.masteryLevel && mc}
                <span class="text-xs font-black {getMasteryColorClass(item.masteryLevel)}" title="Dominio {item.masteryLevel}">{item.retention}%</span>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- ── Health Panel ── -->
  {#if healthPanel.length > 0}
    <div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
      <h4 class="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">🩺 Saúde por Matéria</h4>
      <div class="flex flex-col gap-3">
        {#each healthPanel as subject}
          {@const hcfg = HEALTH_CONFIG[subject.health] || HEALTH_CONFIG.none}
          <div class="grid grid-cols-[1fr,80px,80px] sm:grid-cols-[140px,1fr,40px,90px] items-center gap-3 text-xs">
            <div class="flex items-center gap-2 overflow-hidden">
              <span class="w-2 h-2 rounded-full flex-shrink-0" style="background: {subject.color}"></span>
              <span class="font-bold text-slate-700 dark:text-slate-300 truncate">{subject.name}</span>
            </div>
            <div class="hidden sm:block h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                style="width: {subject.avgRetention ?? 0}%; background: {subject.color}"
              ></div>
            </div>
            <span class="text-right font-bold text-slate-500">{subject.avgRetention ?? 0}%</span>
            <span class="text-right font-black uppercase text-[10px] tracking-tight {hcfg.color}">{hcfg.icon} {hcfg.label}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
{/if}
</div>

<style>
  /* Base transitions and interactivity classes are now in app.css or handled by Tailwind */
  
  :global(.line-clamp-2) {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
