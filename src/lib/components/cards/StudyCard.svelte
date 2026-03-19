<script>
  import { fade, fly } from 'svelte/transition';
  import { sessionStore } from '$lib/stores';
  import { formatInterval } from '$lib/utils/format';
  import { fsrs } from '$lib/fsrs/fsrs.js';
import Button from '../common/Button.svelte';
  import Badge from '../common/Badge.svelte';
  import { TRANSITIONS } from '$lib/design/tokens.mjs';

  export let card;
  export let showAnswer = false;

  $: safeCard = card || {
    state: 'new',
    difficulty: 5,
    stability: 0,
    reps: 0,
    lapses: 0,
    content: { question: '', front: '' }
  };

  $: previews = fsrs.previewRatings(safeCard);

  const stateLabel = {
    new: 'novo',
    learning: 'aprendendo',
    review: 'revisao',
    relearning: 'reaprendendo'
  };

  const ratingConfig = {
    1: { label: 'De novo', color: 'bg-rating-again', key: '1' },
    2: { label: 'Dificil', color: 'bg-rating-hard', key: '2' },
    3: { label: 'Bom', color: 'bg-rating-good', key: '3' },
    4: { label: 'Facil', color: 'bg-rating-easy', key: '4' }
  };

  const stateColors = {
    new: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30',
    learning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30',
    review: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30',
    relearning: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30'
  };

  function handleRating(rating) {
    sessionStore.answer(rating);
  }

  function handleKeyDown(event) {
    if ($sessionStore.isPaused || $sessionStore.isComplete) return;

    if (event.code === 'Space' || event.code === 'Enter') {
      if (!showAnswer) {
        sessionStore.showAnswer();
        event.preventDefault();
      }
    } else if (showAnswer) {
      const rating = parseInt(event.key);
      if (rating >= 1 && rating <= 4) {
        handleRating(rating);
        event.preventDefault();
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="flex flex-col h-full animate-fade-in" in:fade={{ duration: 200 }}>
  <!-- Card Header -->
  <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/50">
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border {stateColors[safeCard.state] || stateColors.new}">
        {stateLabel[safeCard.state] || safeCard.state}
      </span>
      
      {#if safeCard.subjectName}
        <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 uppercase tracking-tight">
          {safeCard.subjectName}
        </span>
      {/if}
      
      {#if safeCard.topicName}
        <span class="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest px-1 ml-1 opacity-80">
          › {safeCard.topicName}
        </span>
      {/if}
    </div>
    
    <div class="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
      STREAK: {safeCard.stats?.streak || 0}
    </div>
  </div>

  <div class="flex-1 overflow-y-auto">
    <div class="mb-8">
      <h3 class="text-xl font-black text-slate-800 dark:text-white leading-tight mb-6">
        {safeCard.content?.question || safeCard.content?.front || 'Sem conteudo no card'}
      </h3>
    </div>

    {#if safeCard.type === 'question' && safeCard.content?.options}
      <div class="flex flex-col gap-2.5 mb-8">
        {#each safeCard.content.options as option}
          <div
            class="group p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer 
              {showAnswer && option.isCorrect ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100' : ''} 
              {showAnswer && !option.isCorrect ? 'border-slate-100 dark:border-slate-800 opacity-40' : ''} 
              {!showAnswer ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm' : ''}"
          >
            <div class="flex items-start gap-3">
              <span class="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 group-hover:text-primary-600 transition-colors">
                {(option.id || '').toString().toUpperCase()}
              </span>
              <span class="text-sm font-bold leading-relaxed">{option.text}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if showAnswer}
      <div class="pt-6 border-t-2 border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500" in:fly={{ y: 20, duration: 200 }}>
        {#if safeCard.content?.back}
          <div class="mb-6">
            <span class="text-[10px] font-black text-primary-500 uppercase tracking-widest block mb-3">Resposta</span>
            <p class="text-base font-bold text-slate-700 dark:text-slate-200 leading-relaxed bg-primary-500/5 p-4 rounded-xl border border-primary-500/20">
              {safeCard.content.back}
            </p>
          </div>
        {/if}

        {#if safeCard.content?.explanation}
          <div class="p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <h4 class="text-[9px] font-black text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-widest flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              Explicação Detalhada
            </h4>
            <p class="text-xs font-bold text-blue-800 dark:text-blue-300 leading-relaxed">{safeCard.content.explanation}</p>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <div class="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
    {#if !showAnswer}
      <button 
        class="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-primary-500/20 active:scale-[0.98] ring-offset-2 dark:ring-offset-slate-900 focus:ring-2 focus:ring-primary-500" 
        on:click={() => sessionStore.showAnswer()}
      >
        REVELAR RESPOSTA
        <span class="block text-[9px] opacity-70 mt-1 font-bold">ESPAÇO OU ENTER</span>
      </button>
    {:else}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        {#each [1, 2, 3, 4] as rating}
          {@const config = ratingConfig[rating]}
          {@const ratingColors = {
            1: 'bg-rose-600 shadow-rose-500/20 hover:bg-rose-700',
            2: 'bg-amber-600 shadow-amber-500/20 hover:bg-amber-700',
            3: 'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-700',
            4: 'bg-blue-600 shadow-blue-500/20 hover:bg-blue-700'
          }}
          <button
            class="flex flex-col items-center p-3 rounded-2xl text-white transition-all duration-200 hover:scale-[1.05] active:scale-[0.95] shadow-lg {ratingColors[rating]}"
            on:click={() => handleRating(rating)}
          >
            <span class="text-[9px] font-black uppercase tracking-widest mb-1">{config.label}</span>
            <span class="text-lg font-black leading-none mb-1">
              {previews[rating].isMinutes ? `${previews[rating].interval}m` : formatInterval(previews[rating].interval)}
            </span>
            <span class="text-[8px] font-bold opacity-60 px-1.5 py-0.5 rounded bg-black/10">PRESS {config.key}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
