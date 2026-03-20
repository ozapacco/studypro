<script>
  import { onMount } from 'svelte';
  import { configStore, subjectsStore, daysUntilExam, toast } from '$lib/stores';
  import { scheduler } from '$lib/engines/scheduler.js';
  import { analytics } from '$lib/engines/analytics.js';
  import { db, initializeDatabase } from '$lib/db.js';
  import { seedStarterData } from '$lib/seed.js';
  import { TRANSITIONS, ANIMATIONS, COLORS } from '$lib/design/tokens.mjs';
  import Card from '$lib/components/common/Card.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import ProgressBar from '$lib/components/common/ProgressBar.svelte';
  import Badge from '$lib/components/common/Badge.svelte';
  import MissaoDiaria from '$lib/components/dashboard/MissaoDiaria.svelte';
  import TutorMission from '$lib/components/tutor/TutorMission.svelte';
  import { tutorEngine, TUTOR_MODE } from '$lib/engines/tutorEngine.js';
  import EditalWidget from '$lib/components/edital/EditalWidget.svelte';

  let queueStats = null;
  let projection = null;
  let todaySession = null;
  let loading = true;
  let tutorMode = 'active';

  onMount(async () => {
    await initializeDatabase();
    await refreshDashboard();
    loading = false;
  });

  async function refreshDashboard() {
    await Promise.all([configStore.load(), subjectsStore.load()]);
    queueStats = await scheduler.getQueueStats();
    projection = await analytics.projectPassProbability();
    const today = new Date().toISOString().split('T')[0];
    const sessions = await db.sessions.where('date').equals(today).toArray();
    todaySession =
      sessions.find((item) => item.status === 'in_progress') ||
      sessions.find((item) => item.status === 'planned') ||
      sessions[0] ||
      null;
    tutorMode = $configStore?.tutor?.mode || 'active';
  }

  async function toggleTutorMode() {
    const modes = [TUTOR_MODE.ACTIVE, TUTOR_MODE.PASSIVE, TUTOR_MODE.STRICT];
    const currentIdx = modes.indexOf(tutorMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    await configStore.setTutorMode(nextMode);
    await tutorEngine.setMode(nextMode);
    tutorMode = nextMode;
  }

  async function seedDemo() {
    const result = await seedStarterData();
    if (!result.created) {
      toast('Você já possui matérias cadastradas.', 'info');
      return;
    }
    toast(`Demonstração criada com ${result.subjects} matérias e ${result.cards} cards.`, 'success');
    await refreshDashboard();
  }

  $: totalDue = (queueStats?.learning || 0) + (queueStats?.review || 0) + (queueStats?.overdue || 0);
</script>

<svelte:head>
  <title>Dashboard | Sistemão</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8 md:py-12 animate-fade-in">
  <!-- Header -->
  <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
    <div class="space-y-1">
      <h1 class="text-3xl md:text-4xl font-black text-slate-800 dark:text-white leading-tight">
        Olá, <span class="text-primary-600">{$configStore?.userName || 'Estudante'}</span>!
      </h1>
      <p class="text-sm md:text-base font-bold text-slate-400 dark:text-slate-500 flex items-center gap-2">
        {#if $daysUntilExam}
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Faltam <span class="text-slate-600 dark:text-slate-300">{$daysUntilExam} dias</span> para a prova
        {:else}
          <span class="opacity-70">Data da prova não configurada</span>
        {/if}
      </p>
    </div>

    <div class="flex items-center gap-4">
      <button 
        class="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:border-primary-500/50 active:scale-95 group"
        on:click={toggleTutorMode}
      >
        <span class="relative flex h-2.5 w-2.5">
          {#if tutorMode === 'strict'}
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          {:else if tutorMode === 'active'}
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          {:else}
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          {/if}
        </span>
        <span class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Tutor: {tutorMode === 'strict' ? 'Estrito' : tutorMode === 'active' ? 'Ativo' : 'Passivo'}
        </span>
      </button>
    </div>
  </header>

  {#if loading}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-8">
        <div class="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse"></div>
        <div class="h-40 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse"></div>
      </div>
      <div class="space-y-8">
        <div class="h-48 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse"></div>
        <div class="h-48 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse"></div>
      </div>
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-8">
        {#if $subjectsStore.length > 0 && totalDue > 0}
          <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TutorMission />
          </div>
          
          <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <div class="p-6 md:p-8">
              <MissaoDiaria />
              
              <!-- Quick Queue Stats -->
              <div class="grid grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/50">
                {#each [
                  { label: 'Novos', value: queueStats?.new || 0, color: 'text-blue-500' },
                  { label: 'Aprendendo', value: queueStats?.learning || 0, color: 'text-amber-500' },
                  { label: 'Revisão', value: queueStats?.review || 0, color: 'text-emerald-500' },
                  { label: 'Atrasados', value: queueStats?.overdue || 0, color: 'text-rose-500' }
                ] as stat}
                  <div class="flex flex-col items-center">
                    <span class="text-lg md:text-2xl font-black {stat.color} leading-none mb-1">{stat.value}</span>
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">{stat.label}</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>
          
          <div class="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <EditalWidget />
          </div>
        {:else}
          <!-- Empty State com Onboarding -->
          <div class="flex flex-col items-center justify-center min-h-[60vh] text-center gap-8 px-4">
            
            <!-- Ícone motivacional -->
            <div class="text-6xl">🚀</div>
            
            <!-- Título -->
            <div>
              <h1 class="text-3xl font-black text-slate-800 dark:text-white mb-2">
                Bem-vindo ao StudyPro!
              </h1>
              <p class="text-slate-500 dark:text-slate-400 text-lg max-w-md font-bold">
                Você está a 3 passos de ter um sistema de estudos inteligente funcionando.
              </p>
            </div>

            <!-- Checklist de passos -->
            <div class="flex flex-col gap-3 w-full max-w-sm text-left">
              
              <a href="/subjects" class="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-primary-400 hover:border-primary hover:bg-primary-5 transition-all group dark:border-primary-600 dark:hover:border-primary-400">
                <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 flex items-center justify-center font-black text-sm group-hover:bg-primary-600 group-hover:text-white transition-all">
                  1
                </div>
                <div>
                  <div class="font-semibold text-sm text-slate-700 dark:text-slate-200">Cadastrar Matérias do Edital</div>
                  <div class="text-xs text-slate-400">Defina as matérias e seus pesos</div>
                </div>
                <span class="ml-auto text-slate-400 group-hover:text-primary-600">→</span>
              </a>

              <div class="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 opacity-60">
                <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-sm text-slate-400">2</div>
                <div>
                  <div class="font-semibold text-sm text-slate-500">Criar Flashcards</div>
                  <div class="text-xs text-slate-400">Adicione perguntas e respostas</div>
                </div>
              </div>

              <div class="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 opacity-60">
                <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-sm text-slate-400">3</div>
                <div>
                  <div class="font-semibold text-sm text-slate-500">Iniciar a Missão</div>
                  <div class="text-xs text-slate-400">O sistema cuida do resto</div>
                </div>
              </div>
            </div>

            <!-- CTA Principal -->
            <div class="flex flex-col sm:flex-row gap-3">
              <a href="/subjects" class="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:scale-105 transition-all">
                Começar Agora → Configurar Matérias
              </a>
              <button on:click={seedDemo} class="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-black text-lg transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95">
                Ver Demonstração
              </button>
            </div>

          </div>
        {/if}
      </div>

      <!-- Sidebar -->
      <div class="space-y-8">
        {#if projection}
          <div class="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-primary-500/20 animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-4">Chance de Aprovação</h3>
            <div class="text-center mb-6">
              <div class="text-6xl font-black tracking-tight mb-2">{projection.passProbability}%</div>
              <div class="text-[11px] font-bold bg-white/20 inline-block px-3 py-1 rounded-full uppercase tracking-widest">
                Nota Projetada: {projection.projectedScore}%
              </div>
            </div>
            <div class="p-4 bg-black/10 rounded-2xl border border-white/10">
              <p class="text-[11px] font-bold leading-relaxed italic opacity-90 text-center">
                "{projection.recommendation}"
              </p>
            </div>
          </div>
        {/if}

        <!-- Streak & Level -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg animate-in fade-in slide-in-from-right-4 duration-700 delay-400">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seu Progresso</h3>
            <span class="bg-amber-500/10 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200">
              NÍVEL {$configStore?.gamification?.level || 1}
            </span>
          </div>
          <div class="flex items-center justify-center gap-6 py-2">
            <div class="text-center">
              <div class="text-4xl font-black text-amber-500 leading-none mb-1 tracking-tight">{$configStore?.gamification?.currentStreak || 0}</div>
              <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest">DIAS SEGUIDOS</div>
            </div>
            <div class="w-px h-12 bg-slate-100 dark:bg-slate-800"></div>
            <div class="text-center">
              <div class="text-4xl font-black text-primary-500 leading-none mb-1 tracking-tight">{$configStore?.gamification?.totalXP || 0}</div>
              <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest">TOTAL XP</div>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <nav class="bg-slate-50 dark:bg-slate-950 rounded-3xl p-3 border border-slate-200/50 dark:border-slate-800/50 animate-in fade-in slide-in-from-right-4 duration-700 delay-500">
          <div class="flex flex-col gap-1">
            {#each [
              { href: '/edital', label: 'Evolução por Matéria', icon: '📈' },
              { href: '/cards', label: 'Manual de Flashcards', icon: '📓' },
              { href: '/stats', label: 'Análise de Desempenho', icon: '📊' },
              { href: '/settings', label: 'Configurações', icon: '⚙️' }
            ] as link}
              <a href={link.href} class="flex items-center gap-3 p-4 rounded-2xl transition-all hover:bg-white dark:hover:bg-slate-900 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] group">
                <span class="text-xl grayscale group-hover:grayscale-0 transition-all">{link.icon}</span>
                <span class="text-sm font-bold text-slate-700 dark:text-slate-200">{link.label}</span>
              </a>
            {/each}
          </div>
        </nav>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>
