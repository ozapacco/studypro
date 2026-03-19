<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { db } from '$lib/db.js';
  import { getMasteryColor, getMasteryLevel, getMasteryLabel, TRANSITIONS, COLORS } from '$lib/design/tokens.mjs';
  import PlantUMLRenderer from '$lib/components/mindmaps/PlantUMLRenderer.svelte';

  /** @type {{ topicId: number, topicName: string, subjectName: string, subjectColor: string, actionType: string, retention?: number, masteryLevel?: string, domainScore?: number, accuracy?: number, coverage?: number }} */
  export let topic;

  const dispatch = createEventDispatcher();

  /** @type {any[]} */
  let notes = [];
  let loading = true;
  let mindMapPuml = null;
  let showMindMap = false;

  // Active Recall state
  let recallText = '';
  let revealed = false;
  let effortSeconds = 0;
  let effortInterval = null;

  // Ritual (for new topics)
  let ritPhone = false;
  let ritWater = false;
  let ritFocus = false;

  $: isReview = topic.actionType === 'review' || topic.actionType === 'urgent';
  $: bizus = notes.filter(n => n.type === 'bizu');
  $: errors = notes.filter(n => n.type === 'error');
  $: hasNotes = bizus.length > 0 || errors.length > 0;

  onMount(async () => {
    try {
      notes = await db.notes.where('topicId').equals(topic.topicId).toArray();
      const topicData = await db.topics.get(topic.topicId);
      mindMapPuml = topicData?.mindMapPuml || null;
    } catch (e) {
      console.error('Error loading PreVoo data:', e);
    } finally {
      loading = false;
    }

    if (isReview && hasNotes) {
      effortInterval = setInterval(() => effortSeconds++, 1000);
    }
  });

  onDestroy(() => { 
    if (effortInterval) clearInterval(effortInterval); 
  });

  function reveal() {
    revealed = true;
    if (effortInterval) clearInterval(effortInterval);
  }

  $: canStart = revealed || !isReview || !hasNotes || effortSeconds >= 30;

  async function startSession() {
    // Reward effort if they spent time thinking
    if (!revealed && effortSeconds >= 15) {
      // Small bonus for mental effort
      try {
        const { configStore } = await import('$lib/stores/config.js');
        configStore.addXP(Math.min(10, Math.floor(effortSeconds / 3)));
      } catch (e) {
        // Silently fail if store not available or error
      }
    }
    dispatch('start');
  }

  function skip() {
    dispatch('start');
  }

  const ACTION_CONFIG = {
    urgent: { label: 'Urgente', emoji: '🚨', colorClass: 'text-mastery-critical', bgClass: 'bg-mastery-critical/10 border-mastery-critical/20' },
    review: { label: 'Revisão', emoji: '🔄', colorClass: 'text-blue-600', bgClass: 'bg-blue-500/10 border-blue-200/50' },
    new:    { label: 'Novo',    emoji: '✨', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-500/10 border-emerald-200/50' },
  };
  $: actionInfo = ACTION_CONFIG[topic.actionType] || ACTION_CONFIG.review;
</script>

<div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
  <div 
    class="w-full max-w-2xl max-height-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in"
    in:fly={{ y: 20, duration: 400 }}
  >
    <!-- Header Decorator -->
    <div class="h-2 w-full" style="background: {topic.subjectColor || COLORS.primary[500]}"></div>

    <div class="p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-10px)]">
      <!-- Breadcrumb & Status -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-black uppercase tracking-widest" style="color: {topic.subjectColor || COLORS.primary[500]}">
            {topic.subjectName}
          </span>
          <span class="text-slate-300 dark:text-slate-700">/</span>
          <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border {actionInfo.bgClass} {actionInfo.colorClass}">
            {actionInfo.emoji} {actionInfo.label}
          </span>
        </div>
        
        {#if isReview && effortSeconds > 0 && !revealed}
          <div class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest animate-pulse">
            ⏱️ ESFORÇO: {effortSeconds}s
          </div>
        {/if}
      </div>

      <h1 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white leading-tight mb-4">
        {topic.topicName}
      </h1>

      <!-- Stats Bar -->
      {#if topic.masteryLevel || topic.domainScore}
        <div class="flex flex-wrap items-center gap-3 mb-8">
          {#if topic.masteryLevel}
            {@const levelKey = topic.masteryLevel === 'forte' ? 'strong' : topic.masteryLevel === 'critico' ? 'critical' : topic.masteryLevel === 'fraco' ? 'weak' : 'medium'}
            <span class="bg-mastery-{levelKey} text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-mastery-{levelKey}/20">
              {topic.masteryLevel} {topic.retention ? `${topic.retention}%` : ''}
            </span>
          {/if}
          
          <div class="flex items-center gap-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
            {#if topic.domainScore}
              <span>Domínio: <strong class="text-slate-600 dark:text-slate-300">{topic.domainScore}%</strong></span>
            {/if}
            {#if topic.accuracy}
              <span>Acerto: <strong class="text-slate-600 dark:text-slate-300">{topic.accuracy}%</strong></span>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Mind Map Section -->
      {#if mindMapPuml}
        <div class="mb-6">
          <button 
            class="w-full flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 transition-all hover:shadow-md active:scale-[0.99] group"
            on:click={() => showMindMap = !showMindMap}
          >
            <div class="flex items-center gap-3">
              <span class="text-lg">🧠</span>
              <span class="text-xs font-black uppercase tracking-widest">Mapa Mental do Tópico</span>
            </div>
            <span class="text-xs transition-transform duration-300 {showMindMap ? 'rotate-180' : ''}">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </span>
          </button>
          
          {#if showMindMap}
            <div class="mt-4 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
              <PlantUMLRenderer puml={mindMapPuml} collapsed={false} />
            </div>
          {/if}
        </div>
      {/if}

      <!-- Main Content Area -->
      {#if isReview && hasNotes}
        <!-- Active Recall flow -->
        <div class="space-y-6">
          <div class="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center text-xl shadow-lg shadow-primary-500/20 shrink-0">
                🧩
              </div>
              <div>
                <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">Esforço de Recuperação</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                  Force sua mente a lembrar os conceitos chave de <strong>{topic.topicName}</strong> antes de ver o material.
                </p>
              </div>
            </div>
            
            <textarea
              class="w-full mt-4 p-4 min-h-[100px] rounded-xl bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold focus:border-primary-500 transition-all outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
              placeholder="Digite o que vier à mente... conceitos, fórmulas, mnemônicos..."
              bind:value={recallText}
            ></textarea>
          </div>

          <!-- Material Section -->
          <div class="relative group">
            <div class="flex items-center justify-between mb-3 px-1">
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material de Referência</h4>
              {#if !revealed}
                <span class="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  Bloqueado
                </span>
              {/if}
            </div>
            
            <div class="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/30 dark:bg-slate-950/20">
              {#if !revealed}
                <div class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
                  <button 
                    class="bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-xl transition-all hover:scale-105 active:scale-95 border border-slate-200 dark:border-slate-700 uppercase tracking-widest"
                    on:click={reveal}
                  >
                    👁️ Revelar Material
                  </button>
                </div>
              {/if}

              <div class="p-4 space-y-4 {revealed ? '' : 'blur-lg grayscale select-none pointer-events-none transition-all duration-700'}">
                {#if bizus.length > 0}
                  <div>
                    <h5 class="text-[9px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                      Seus Bizus
                    </h5>
                    <div class="space-y-2">
                      {#each bizus as bizu}
                        <div class="p-3 bg-amber-500/5 border-l-4 border-amber-500 rounded-r-xl text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed italic">
                          "{bizu.content}"
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}

                {#if errors.length > 0}
                  <div>
                    <h5 class="text-[9px] font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      Erros para não repetir
                    </h5>
                    <div class="space-y-2">
                      {#each errors as err}
                        <div class="p-3 bg-rose-500/5 border-l-4 border-rose-500 rounded-r-xl text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                          {err.content}
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {:else}
        <!-- Ritual flow for new or notes-less topics -->
        <div class="space-y-8">
          <div class="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-4 mb-6">
              <span class="text-3xl">🛡️</span>
              <div>
                <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Ritual de Foco</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-bold italic">Prepare-se para entrar no State of Flow.</p>
              </div>
            </div>
            
            <div class="flex flex-col gap-3">
              {#each [
              { id: 'ritPhone', label: 'Celular em outra sala ou silencioso', icon: '📵' },
              { id: 'ritWater', label: 'Água ao alcance das mãos', icon: '💧' },
              { id: 'ritFocus', label: 'Respirei fundo e estou presente', icon: '🧘' }
            ] as rit}
              <label class="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 cursor-pointer transition-all hover:border-primary-400 group">
                {#if rit.id === 'ritPhone'}
                  <input type="checkbox" class="w-5 h-5 accent-primary-600 rounded-lg cursor-pointer" bind:checked={ritPhone} />
                {:else if rit.id === 'ritWater'}
                  <input type="checkbox" class="w-5 h-5 accent-primary-600 rounded-lg cursor-pointer" bind:checked={ritWater} />
                {:else}
                  <input type="checkbox" class="w-5 h-5 accent-primary-600 rounded-lg cursor-pointer" bind:checked={ritFocus} />
                {/if}
                <span class="text-lg grayscale group-hover:grayscale-0 transition-all">{rit.icon}</span>
                <span class="text-sm font-black text-slate-700 dark:text-slate-200">{rit.label}</span>
              </label>
            {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Footer Actions -->
      <div class="mt-8 flex flex-col gap-3">
        {#if canStart}
          <button 
            class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 duration-500" 
            on:click={startSession}
          >
            {#if !revealed && isReview && hasNotes}
              DECOLAR COM ESFORÇO MENTAL 🧠
            {:else}
              DECOLAR AGORA 🚀
            {/if}
          </button>
        {:else if isReview && hasNotes}
           <div class="text-center py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest italic animate-pulse">
             Pense mais {30 - effortSeconds}s para bônus de neuroplasticidade...
           </div>
        {/if}
        
        <button 
          class="w-full p-4 rounded-2xl text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/30"
          on:click={skip}
        >
          {isReview ? 'Pular Ritual (sem bônus)' : 'Estudar depois'}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
  .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>
