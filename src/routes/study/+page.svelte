<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { fade, fly, scale } from 'svelte/transition';
  import { sessionStore, currentBlock, sessionStats, configStore, toast } from '$lib/stores';
  import { sessionGenerator } from '$lib/engines/sessionGenerator.js';
  import { tutorEngine } from '$lib/engines/tutorEngine.js';
  import { db, initializeDatabase } from '$lib/db.js';
  import { TRANSITIONS, ANIMATIONS, COLORS } from '$lib/design/tokens.mjs';
  import StudyCard from '$lib/components/cards/StudyCard.svelte';
  import SessionProgress from '$lib/components/session/SessionProgress.svelte';
  import SessionTimer from '$lib/components/session/SessionTimer.svelte';
  import PreVoo from '$lib/components/study/PreVoo.svelte';
  import FeynmanStep from '$lib/components/study/FeynmanStep.svelte';
  import PomodoroBreakOverlay from '$lib/components/study/PomodoroBreakOverlay.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import Card from '$lib/components/common/Card.svelte';
  import EmptyState from '$lib/components/common/EmptyState.svelte';

  let keyboardHandler;

  // Block state
  let blocked = false;
  let blockedReason = '';

  // Pre-Voo state
  let showPreVoo = false;
  let preVooTopic = null;

  // Tutor state
  let currentMission = null;
  let nextMission = null;
  let showSessionSummary = false;

  // Feynman Mode state
  let feynmanMode = false;
  let showFeynman = false;
  let feynmanExplanation = '';

  // Pomodoro state
  let pomodoroMode = true;
  const POMODORO_DURATION = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;
  let pomodoroCount = 0;
  let showBreakOverlay = false;
  let isLongBreak = false;
  let pomodoroTimerCheck = false;

  onMount(async () => {
    await initializeDatabase();
    await configStore.load();

    const subjectsCount = await db.subjects.count();
    const topicsCount = await db.topics.count();
    const cardsCount = await db.cards.count();

    if (subjectsCount === 0) {
      blocked = true;
      blockedReason = 'Cadastre matérias do edital para começar a estudar.';
    } else if (topicsCount === 0) {
      blocked = true;
      blockedReason = 'Crie tópicos em uma matéria para desbloquear o estudo.';
    } else if (cardsCount === 0) {
      blocked = true;
      blockedReason = 'Crie pelo menos 1 card para iniciar a sessão.';
    }

    if (blocked) return;

    const topicId = $page.url.searchParams.get('topicId');

    if (topicId) {
      const topicIdNum = parseInt(topicId);
      const [topic, cards, mastery] = await Promise.all([
        db.topics.get(topicIdNum),
        db.cards.where('topicId').equals(topicIdNum).toArray(),
        tutorEngine.calculateSubjectMastery(await db.subjects.toArray()),
      ]);

      if (topic) {
        const subject = await db.subjects.get(topic.subjectId);
        const subjectMastery = mastery.find(s => s.id === topic.subjectId);

        const now = new Date();
        const dueCards = cards.filter(c => c.state !== 'new' && c.due && new Date(c.due) <= now);
        const hasUrgent = cards.some(c => (c.state === 'learning' || c.state === 'relearning'));

        const actionType = hasUrgent ? 'urgent' : dueCards.length > 0 ? 'review' : 'new';
        const retention = subjectMastery?.retention || 0;
        const masteryLabel = subjectMastery ? tutorEngine.getMasteryLabel(retention) : 'desconhecido';

        // PED-F4: Block checks
        const pedagogicalBlock = await tutorEngine.checkPedagogicalBlock(topicIdNum);
        if (pedagogicalBlock.blocked) {
          toast(pedagogicalBlock.reason, 'warning');
          if (configStore.tutor?.mode === 'strict') {
            toast('Desative o modo Estrito em Ajustes ou finalize a matéria atual.', 'info');
            goto('/');
            return;
          }
        }

        preVooTopic = {
          topicId: topicIdNum,
          topicName: topic.name,
          subjectId: topic.subjectId,
          subjectName: subject?.name || 'Matéria',
          subjectColor: subject?.color || COLORS.primary[500],
          actionType,
          retention,
          masteryLevel: masteryLabel,
          domainScore: subjectMastery?.domainScore || 0,
          accuracy: subjectMastery?.accuracy || 0,
          coverage: subjectMastery?.coverage || 0,
        };
        showPreVoo = true;
        return;
      }
    }

    await loadSession();
    setupKeyboard();

    try {
      currentMission = await tutorEngine.decideNextMission();
    } catch (e) {
      console.error('Tutor error:', e);
    }
  });

  function setupKeyboard() {
    keyboardHandler = (event) => sessionStore.handleKeyboard(event);
    document.addEventListener('keydown', keyboardHandler);
  }

  async function loadSession(topicId = null) {
    if (!$sessionStore.session) {
      let session = null;
      if (topicId) {
        session = await sessionGenerator.generateDailySession({ forceTopicId: topicId });
      } else {
        session = await db.sessions.where('status').equals('in_progress').reverse().first();
        if (!session) {
          const today = new Date().toISOString().split('T')[0];
          session = await db.sessions.where('[date+status]').equals([today, 'planned']).first();
        }
      }

      if (session) {
        await sessionStore.start(session);
      } else {
        const newSession = await sessionGenerator.generateDailySession({ forceTopicId: topicId });
        await sessionStore.start(newSession);
      }
    }
  }

  async function handlePreVooStart() {
    showPreVoo = false;
    await loadSession(preVooTopic?.topicId);
    setupKeyboard();
    pomodoroMode = $configStore.preferences?.pomodoroEnabled ?? true;
    feynmanMode = $configStore.preferences?.feynmanEnabled ?? false;
    pomodoroTimerCheck = true;
  }

  onDestroy(() => {
    if (keyboardHandler) document.removeEventListener('keydown', keyboardHandler);
  });

  function handlePause() {
    if ($sessionStore.isPaused) sessionStore.resume();
    else sessionStore.pause();
  }

  async function handleFinish() {
    nextMission = await sessionStore.finishWithRecalc();
    showSessionSummary = true;
  }

  function continueWithNextMission() {
    if (nextMission?.topic?.id) {
      goto(`/study?topicId=${nextMission.topic.id}`);
    } else {
      goto('/');
    }
  }

  // Pomodoro timer check
  $: if (pomodoroMode && pomodoroTimerCheck && !showSessionSummary && !showPreVoo && $sessionStats?.totalTime) {
    const elapsedMinutes = Math.floor($sessionStats.totalTime / 60000);
    if (elapsedMinutes > 0 && elapsedMinutes % 25 === 0 && pomodoroCount < Math.floor(elapsedMinutes / 25)) {
      pomodoroCount = Math.floor(elapsedMinutes / 25);
      isLongBreak = pomodoroCount % 4 === 0;
      showBreakOverlay = true;
      sessionStore.pause();
    }
  }

  function skipBreak() {
    showBreakOverlay = false;
    sessionStore.resume();
  }

  function startBreak() {
    showBreakOverlay = false;
    sessionStore.pause();
    toast(isLongBreak ? 'Pausa de 15 minutos iniciada!' : 'Pausa de 5 minutos iniciada!', 'info');
  }

  function onFeynmanContinue(explanation) {
    feynmanExplanation = explanation;
    showFeynman = false;
    sessionStore.showAnswer();
  }

  function triggerFeynman() {
    if (feynmanMode && !$sessionStore.showingAnswer) {
      showFeynman = true;
    }
  }
</script>

<svelte:head>
  <title>Estudo | Sistemão</title>
</svelte:head>

{#if showPreVoo && preVooTopic}
  <PreVoo topic={preVooTopic} on:start={handlePreVooStart} />
{/if}

<div class="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
  <!-- Top Bar -->
  <header class="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-30">
    {#if currentMission && !showSessionSummary && !showPreVoo}
      <div 
        class="py-2.5 px-4 text-white animate-in slide-in-from-top duration-500 overflow-hidden" 
        style="background: linear-gradient(90deg, {currentMission.subject?.color || COLORS.primary[500]}, color-mix(in srgb, {currentMission.subject?.color || COLORS.primary[500]} 70%, black))"
      >
        <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 overflow-hidden">
            <span class="bg-white/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0">🎯 FOCO</span>
            <span class="text-sm font-black truncate">{currentMission.topic?.name || 'Sessão de estudo'}</span>
          </div>
          <span class="text-[10px] font-bold opacity-80 whitespace-nowrap hidden sm:block italic">{currentMission.reason}</span>
        </div>
      </div>
    {/if}

    <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
      <div class="flex items-center gap-6">
        <button 
          on:click={() => goto('/')} 
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Voltar para o painel"
          title="Voltar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div class="flex flex-col">
          <SessionTimer />
          <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Tempo de foco</span>
        </div>
        {#if pomodoroMode && pomodoroCount > 0}
          <div class="flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <span class="text-sm">🍅</span>
            <span class="text-[10px] font-black text-amber-700 dark:text-amber-400">{pomodoroCount}</span>
          </div>
        {/if}
      </div>

      <div class="flex items-center gap-2">
        <button 
          on:click={handlePause} 
          class="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
          title={$sessionStore.isPaused ? 'Retomar' : 'Pausar'}
        >
          {#if $sessionStore.isPaused}
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          {/if}
        </button>
        <button 
          on:click={handleFinish} 
          class="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          FINALIZAR
        </button>
      </div>
    </div>

    <SessionProgress />
  </header>

  <main class="flex-1 overflow-hidden relative flex flex-col items-center justify-center p-4">
    {#if blocked}
      <div class="max-w-2xl mx-auto px-4 py-10">
        <EmptyState
          icon="📚"
          title="Antes de começar o estudo"
          description={blockedReason}
          size="lg"
        >
          <div slot="action" class="flex flex-col sm:flex-row gap-3 mt-4">
            <a class="btn-action" href="/subjects">Cadastrar matérias</a>
            <a class="btn-action" href="/cards">Criar cards</a>
          </div>
        </EmptyState>
      </div>
    {:else if $sessionStore.isComplete || showSessionSummary}
      <div 
        class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-scale-in"
        in:fly={{ y: 40, duration: 600 }}
      >
        <div class="text-6xl mb-6">
          {#if $sessionStats.cardsReviewed > 0 && ($sessionStats.correctCount / $sessionStats.cardsReviewed) > 0.8}
            ✨
          {:else if $sessionStats.cardsReviewed > 0}
            💪
          {:else}
            🏁
          {/if}
        </div>
        <h2 class="text-3xl font-black text-slate-800 dark:text-white mb-2 leading-tight">Missão Cumprida!</h2>
        <p class="text-slate-500 dark:text-slate-400 font-bold mb-8">
          {#if $sessionStats.cardsReviewed > 0}
            Você fortaleceu {$sessionStats.cardsReviewed} traços de memória hoje.
          {:else}
            Sessão encerrada com sucesso.
          {/if}
        </p>

        <div class="grid grid-cols-3 gap-4 mb-8">
          {#each [
            { label: 'Cards', value: $sessionStats.cardsReviewed, color: 'text-primary-600', icon: '📇' },
            { label: 'Precisão', value: `${$sessionStats.cardsReviewed > 0 ? Math.round(($sessionStats.correctCount / $sessionStats.cardsReviewed) * 100) : 0}%`, color: 'text-emerald-500', icon: '🎯' },
            { label: 'Tempo', value: `${Math.round(($sessionStats.totalTime || 0) / 60000)}m`, color: 'text-amber-500', icon: '⏱️' }
          ] as stat}
            <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
              <span class="text-lg mb-1">{stat.icon}</span>
              <div class="text-xl font-black {stat.color} leading-none mb-1">{stat.value}</div>
              <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
            </div>
          {/each}
        </div>

        {#if nextMission && nextMission.type !== 'rest'}
          <div class="mb-8 p-6 rounded-3xl text-left bg-gradient-to-br from-primary-600 to-indigo-700 text-white shadow-xl shadow-primary-500/20">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <span class="text-[9px] font-black uppercase tracking-widest opacity-80">Próxima Parada</span>
                <span class="bg-white/20 text-[8px] font-black px-2 py-0.5 rounded-full">
                  RECOMENDADO
                </span>
              </div>
              <span class="text-xl">🚀</span>
            </div>
            <h4 class="text-lg font-black leading-tight mb-2 truncate">{nextMission.topic?.name}</h4>
            <p class="text-[11px] font-bold opacity-80 leading-relaxed mb-6 italic line-clamp-2">"{nextMission.reason}"</p>
            <button 
              on:click={continueWithNextMission} 
              class="w-full py-3.5 bg-white text-primary-600 rounded-2xl font-black text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              CONTINUAR AGORA
            </button>
          </div>
        {/if}

        <button on:click={() => goto('/')} class="px-8 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
          Sair para o Painel
        </button>
      </div>
    {:else if $sessionStore.isPaused}
      <div 
        class="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center animate-scale-in"
      >
        <div class="text-5xl mb-6 animate-pulse">⏸️</div>
        <h2 class="text-2xl font-black text-slate-800 dark:text-white mb-2">Foco em Pausa</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 font-bold mb-8">Respire fundo, tome uma água. Volte quando pronto.</p>
        <button 
          on:click={() => sessionStore.resume()} 
          class="w-full bg-primary-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
        >
          RETOMAR SESSÃO
        </button>
      </div>
    {:else if $sessionStore.currentCard}
      <div class="w-full max-w-3xl h-full max-h-[85vh] animate-in fade-in zoom-in-95 duration-500 flex flex-col">
        <!-- Context Header -->
        <div class="mb-4 px-6 py-2 bg-primary-500/5 border border-primary-500/20 rounded-2xl flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2 overflow-hidden">
             <span class="text-primary-500 text-xs shrink-0">📖</span>
             <span class="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest truncate">
               {$currentBlock?.title || 'Sessão Individual'}
               {#if $sessionStore.currentCard?.topicName}
                 <span class="opacity-50"> › {$sessionStore.currentCard.topicName}</span>
               {/if}
             </span>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            {#each Array(3) as _, i}
              <div class="w-1 h-3 rounded-full {i < ($sessionStore.progressPercent / 33) ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'}"></div>
            {/each}
          </div>
        </div>

        <div class="flex-1 overflow-hidden">
          {#if feynmanMode && !$sessionStore.showingAnswer && !showFeynman}
            <div class="h-full flex flex-col items-center justify-center">
              <Card padding="lg" class="w-full max-w-2xl">
                <div class="text-center mb-4">
                  <span class="text-4xl">🧠</span>
                  <h3 class="text-lg font-black text-slate-800 dark:text-white mt-2">Modo Feynman</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Tente explicar o conceito antes de ver a resposta
                  </p>
                </div>
                <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
                  <p class="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {$sessionStore.currentCard?.content?.front || $sessionStore.currentCard?.content?.question || 'Pergunta'}
                  </p>
                </div>
                <button 
                  on:click={triggerFeynman}
                  class="w-full py-3 bg-primary-600 text-white rounded-xl font-black text-sm shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all"
                >
                  Escrever minha explicação →
                </button>
              </Card>
            </div>
          {:else}
            <Card padding="lg" class="h-full overflow-y-auto">
              <StudyCard card={$sessionStore.currentCard} showAnswer={$sessionStore.showingAnswer} />
            </Card>
          {/if}
        </div>
      </div>
    {:else}
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin"></div>
        <span class="text-xs font-black text-slate-400 uppercase tracking-widest">Carregando Fluxo...</span>
      </div>
    {/if}

    <!-- Feynman Step Overlay -->
    {#if showFeynman}
      <div class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
        <div class="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
          <FeynmanStep 
            concept={$sessionStore.currentCard?.content?.front || $sessionStore.currentCard?.content?.question || 'Conceito'}
            onContinue={onFeynmanContinue}
          />
        </div>
      </div>
    {/if}

    <!-- Pomodoro Break Overlay -->
    {#if showBreakOverlay}
      <PomodoroBreakOverlay 
        isLong={isLongBreak}
        onSkip={skipBreak}
        onStartBreak={startBreak}
      />
    {/if}

    <!-- Floating Notes Hub -->
    {#if $sessionStore.currentCard && preVooTopic && !$sessionStore.isPaused}
      <div class="fixed bottom-8 right-8 z-40">
        <button
          class="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-2xl shadow-xl shadow-amber-500/30 transition-all hover:scale-110 active:scale-90 relative group"
          on:click={() => goto(`/study/notes?topicId=${preVooTopic.topicId}&topicName=${encodeURIComponent(preVooTopic.topicName)}`)}
        >
          📝
          <span class="absolute right-full mr-4 px-3 py-1 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Anotar Bizu/Erro
          </span>
        </button>
      </div>
    {/if}
  </main>
</div>

<style>
  @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>
