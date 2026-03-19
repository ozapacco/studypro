<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { tutorEngine, TUTOR_MODE } from '$lib/engines/tutorEngine.js';
  import { COLORS, getMasteryColor, getMasteryLevel, getMasteryLabel, TRANSITIONS } from '$lib/design/tokens.mjs';
  import Spinner from '$lib/components/common/Spinner.svelte';

  export let compact = false;

  let mission = null;
  let loading = true;
  let refreshing = false;

  onMount(async () => {
    await loadMission();
  });

  async function loadMission() {
    loading = true;
    try {
      mission = await tutorEngine.decideNextMission();
    } catch (e) {
      console.error('Tutor error:', e);
      mission = null;
    }
    loading = false;
  }

  async function refreshMission() {
    refreshing = true;
    try {
      mission = await tutorEngine.recalculateAfterSession({});
    } catch (e) {
      console.error('Tutor recalc error:', e);
    }
    refreshing = false;
  }

  function startMission() {
    if (mission?.topic?.id) {
      goto(`/study?topicId=${mission.topic.id}`);
    } else {
      goto('/study');
    }
  }

  // Helper function to get Tailwind mastery color class
  function getMasteryClass(percentage) {
    const level = getMasteryLevel(percentage);
    return `bg-mastery-${level}`;
  }

  // Helper function to get Tailwind border color class
  function getMasteryBorderClass(percentage) {
    const level = getMasteryLevel(percentage);
    return `border-mastery-${level}`;
  }

  $: cardCount = mission?.cardIds?.length || 0;
  $: modeLabel = mission?.mode === TUTOR_MODE.STRICT ? 'ESTREITO' : mission?.mode === TUTOR_MODE.ACTIVE ? 'TUTOR' : 'SUGESTAO';
  $: masteryColor = mission?.masteryLevel ? getMasteryColor(mission.masteryLevel) : COLORS.mastery.neutral;
</script>

{#if loading}
  <div class="flex items-center gap-2 text-slate-500 text-sm {compact ? 'py-0 text-slate-400 text-xs' : 'py-2'}">
    <Spinner size="sm" color="text-primary-500" />
    {#if !compact}<span>Tutor analisando...</span>{/if}
  </div>
{:else if mission}
  {#if compact}
    <button 
      class="group flex items-center gap-2.5 bg-gradient-to-br from-[--mc] to-[--mc-dark] dark:from-[--mc] dark:to-[--mc-dark] rounded-xl px-3 py-2.5 w-full text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl dark:hover:shadow-2xl cursor-pointer border border-white/10 dark:border-black/10 active:scale-[0.99] animate-fade-in"
      style="--mc: {mission.subject?.color || COLORS.mastery.neutral}; --mc-dark: color-mix(in srgb, {mission.subject?.color || COLORS.mastery.neutral} 70%, black 30%)"
      on:click={startMission}
    >
      <span class="text-xs font-extrabold uppercase tracking-wider px-2 py-1 rounded-full bg-white/25 dark:bg-black/25 text-white whitespace-nowrap flex-shrink-0">
        {modeLabel}
      </span>
      <span class="flex-1 text-sm font-bold text-white truncate min-w-0">
        {mission.topic?.name || 'Dia de estudo'}
      </span>
      <span class="w-2 h-2 rounded-full flex-shrink-0 {getMasteryClass(mission.masteryLevel)}"></span>
    </button>
  {:else}
    <div 
      class="bg-gradient-to-br from-[--mc] to-[--mc-dark] dark:from-[--mc] dark:to-[--mc-dark] rounded-2xl p-5 text-white dark:text-white/95 shadow-xl dark:shadow-2xl animate-fade-in border border-white/10 dark:border-black/10"
      style="--mc: {mission.subject?.color || COLORS.mastery.neutral}; --mc-dark: color-mix(in srgb, {mission.subject?.color || COLORS.mastery.neutral} 70%, black 30%)"
    >
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/25 dark:bg-black/25">
            {mission.mandatory ? '🎯 TUTOR' : '💡 SUGESTÃO'}
          </span>
          {#if mission.masteryLevel}
            <span 
              class="text-xs font-bold px-3 py-1 rounded-full text-white border border-white/20 {getMasteryClass(mission.masteryLevel)}"
            >
              {getMasteryLabel(mission.masteryLevel).toUpperCase()}
              {#if mission.mastery != null}
                <span class="ml-1 opacity-90">{mission.mastery}%</span>
              {/if}
            </span>
          {/if}
        </div>
        <button 
          class="bg-white/15 dark:bg-black/15 hover:bg-white/25 dark:hover:bg-black/25 p-2 rounded-lg transition-all duration-200 border border-white/20 dark:border-black/20 text-white disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
          on:click={refreshMission}
          disabled={refreshing}
          title="Atualizar missão"
        >
          {#if refreshing}
            <Spinner size="sm" />
          {:else}
            <!-- SVG icon for refresh -->
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.88 1.05 6.57 2.82L21 8"></path>
              <polyline points="21 3 21 8 16 8"></polyline>
            </svg>
          {/if}
        </button>
      </div>

      {#if mission.type !== 'rest'}
        <h3 class="text-xl font-extrabold mb-2 line-clamp-2">{mission.topic?.name}</h3>
        {#if mission.subject}
          <p class="flex items-center gap-2 text-sm mb-4 text-white/90">
            <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background: {mission.subject.color || COLORS.mastery.neutral}"></span>
            {mission.subject.name}
          </p>
        {/if}
        <p class="text-sm leading-relaxed mb-5 text-white/85 dark:text-white/80">{mission.reason}</p>

        <div class="flex flex-wrap gap-2.5 text-xs mb-6">
          <span class="bg-white/15 dark:bg-black/15 px-3 py-1.5 rounded-full font-medium whitespace-nowrap">
            ⏱️ ~{mission.estimatedMinutes}min
          </span>
          <span class="bg-white/15 dark:bg-black/15 px-3 py-1.5 rounded-full font-medium whitespace-nowrap">
            📋 {cardCount} cards
          </span>
          <span class="bg-white/25 dark:bg-black/25 px-3 py-1.5 rounded-full font-extrabold uppercase tracking-wide whitespace-nowrap">
            {mission.mode?.toUpperCase()}
          </span>
        </div>

        <button 
          class="w-full bg-white dark:bg-white text-[--mc] dark:text-[--mc] py-3 rounded-xl font-bold text-center transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl dark:hover:shadow-xl active:scale-[0.98] focus-ring"
          on:click={startMission}
        >
          ▶ Iniciar Missão
        </button>
      {:else}
        <div class="flex flex-col items-center text-center gap-4 py-6">
          <span class="text-4xl bg-white/10 dark:bg-black/10 w-16 h-16 rounded-full flex items-center justify-center">☕</span>
          <p class="text-base font-medium text-white/90">{mission.reason}</p>
          <button 
            class="w-full bg-white/10 dark:bg-black/10 text-white dark:text-white/90 py-3 rounded-xl font-bold text-center border border-white/20 dark:border-black/20 hover:bg-white/20 dark:hover:bg-black/20 {TRANSITIONS.colors} focus-ring"
            on:click={startMission}
          >
            ▶ Estudar mesmo assim
          </button>
        </div>
      {/if}
    </div>
  {/if}
{/if}

<style>
  :global(.line-clamp-2) {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
