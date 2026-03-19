# BLUEPRINT: Sistema de Estudos de Elite
## Parte 5: UI/UX Completo

---

## 1. DESIGN SYSTEM

### 1.1 Cores (Tailwind Config)

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cores principais
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Principal
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        
        // Cores de estado dos cards
        state: {
          new: '#8b5cf6',      // Roxo
          learning: '#f59e0b', // Amarelo
          review: '#10b981',   // Verde
          relearning: '#ef4444' // Vermelho
        },
        
        // Cores de rating
        rating: {
          again: '#ef4444',
          hard: '#f97316',
          good: '#22c55e',
          easy: '#3b82f6'
        },
        
        // Cores de matérias (paleta sugerida)
        subject: {
          1: '#7C3AED', // Roxo
          2: '#2563EB', // Azul
          3: '#059669', // Verde
          4: '#DC2626', // Vermelho
          5: '#D97706', // Laranja
          6: '#7C3AED', // Roxo escuro
          7: '#0891B2', // Ciano
          8: '#4F46E5', // Indigo
        }
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite'
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        }
      }
    }
  }
};
```

### 1.2 Componentes Base: src/components/common/

#### Button.svelte
```svelte
<script>
  export let variant = 'primary'; // primary, secondary, ghost, danger
  export let size = 'md'; // sm, md, lg
  export let disabled = false;
  export let loading = false;
  export let fullWidth = false;
  
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200',
    ghost: 'hover:bg-gray-100 text-gray-600 dark:hover:bg-gray-800 dark:text-gray-300',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
</script>

<button
  class="
    inline-flex items-center justify-center font-medium rounded-lg
    transition-colors duration-150 focus:outline-none focus:ring-2 
    focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 
    disabled:cursor-not-allowed
    {variants[variant]}
    {sizes[size]}
    {fullWidth ? 'w-full' : ''}
  "
  {disabled}
  disabled={disabled || loading}
  on:click
>
  {#if loading}
    <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  {/if}
  <slot />
</button>
```

#### Card.svelte
```svelte
<script>
  export let padding = 'md'; // none, sm, md, lg
  export let hover = false;
  export let clickable = false;
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
</script>

<div
  class="
    bg-white dark:bg-gray-800 rounded-xl border border-gray-200 
    dark:border-gray-700 {paddings[padding]}
    {hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
    {clickable ? 'cursor-pointer' : ''}
  "
  on:click
  role={clickable ? 'button' : undefined}
>
  <slot />
</div>
```

#### ProgressBar.svelte
```svelte
<script>
  export let value = 0; // 0-100
  export let max = 100;
  export let color = 'primary'; // primary, success, warning, danger
  export let size = 'md'; // sm, md, lg
  export let showLabel = false;
  
  $: percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const colors = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };
</script>

<div class="w-full">
  <div class="bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden {sizes[size]}">
    <div 
      class="h-full transition-all duration-300 {colors[color]}" 
      style="width: {percentage}%"
    />
  </div>
  {#if showLabel}
    <span class="text-xs text-gray-500 mt-1">{percentage.toFixed(0)}%</span>
  {/if}
</div>
```

#### Badge.svelte
```svelte
<script>
  export let variant = 'default'; // default, success, warning, danger, info
  export let size = 'md';
  
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1 text-sm'
  };
</script>

<span class="inline-flex items-center font-medium rounded-full {variants[variant]} {sizes[size]}">
  <slot />
</span>
```

---

## 2. COMPONENTES DE ESTUDO

### 2.1 StudyCard.svelte (Card de Revisão)

```svelte
<script>
  import { fade, fly } from 'svelte/transition';
  import { sessionStore } from '$lib/stores';
  import { formatInterval } from '$lib/utils/format';
  import { fsrs } from '$lib/fsrs/fsrs';
  import Button from '../common/Button.svelte';
  import Badge from '../common/Badge.svelte';
  
  export let card;
  export let showAnswer = false;
  
  // Calcular previews de intervalo
  $: previews = fsrs.previewRatings(card);
  
  const ratingConfig = {
    1: { label: 'Não lembrei', color: 'bg-rating-again', key: '1' },
    2: { label: 'Difícil', color: 'bg-rating-hard', key: '2' },
    3: { label: 'Bom', color: 'bg-rating-good', key: '3' },
    4: { label: 'Fácil', color: 'bg-rating-easy', key: '4' }
  };
  
  function handleRating(rating) {
    sessionStore.answer(rating);
  }
</script>

<div class="flex flex-col h-full" in:fade={{ duration: 200 }}>
  <!-- Header com metadados -->
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-2">
      <Badge variant={card.state === 'new' ? 'info' : card.state === 'learning' ? 'warning' : 'success'}>
        {card.state}
      </Badge>
      {#if card.content.source}
        <span class="text-sm text-gray-500">{card.content.source}</span>
      {/if}
    </div>
    <div class="text-sm text-gray-500">
      {#if card.stats?.streak > 0}
        🔥 {card.stats.streak}
      {/if}
    </div>
  </div>

  <!-- Conteúdo do Card -->
  <div class="flex-1 overflow-y-auto">
    <!-- Questão -->
    <div class="mb-6">
      <p class="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
        {card.content.question || card.content.front}
      </p>
    </div>

    <!-- Opções (se for questão múltipla escolha) -->
    {#if card.type === 'question' && card.content.options}
      <div class="space-y-2 mb-6">
        {#each card.content.options as option}
          <div 
            class="p-3 rounded-lg border transition-colors
              {showAnswer && option.isCorrect 
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                : 'border-gray-200 dark:border-gray-700'}
              {showAnswer && !option.isCorrect 
                ? 'opacity-60' 
                : ''}"
          >
            <span class="font-medium mr-2">{option.id.toUpperCase()})</span>
            {option.text}
          </div>
        {/each}
      </div>
    {/if}

    <!-- Resposta/Explicação (quando mostrada) -->
    {#if showAnswer}
      <div 
        class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4"
        in:fly={{ y: 20, duration: 200 }}
      >
        {#if card.content.back}
          <p class="text-gray-700 dark:text-gray-300">{card.content.back}</p>
        {/if}
        
        {#if card.content.explanation}
          <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 class="font-medium text-blue-800 dark:text-blue-300 mb-2">Explicação</h4>
            <p class="text-blue-700 dark:text-blue-200 text-sm">
              {card.content.explanation}
            </p>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Área de ação -->
  <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
    {#if !showAnswer}
      <!-- Botão mostrar resposta -->
      <Button fullWidth on:click={() => sessionStore.showAnswer()}>
        Mostrar Resposta
        <span class="ml-2 text-xs opacity-70">(Espaço)</span>
      </Button>
    {:else}
      <!-- Botões de rating -->
      <div class="grid grid-cols-4 gap-2">
        {#each [1, 2, 3, 4] as rating}
          <button
            class="flex flex-col items-center p-3 rounded-lg transition-all
              hover:scale-105 {ratingConfig[rating].color} text-white"
            on:click={() => handleRating(rating)}
          >
            <span class="text-sm font-medium">{ratingConfig[rating].label}</span>
            <span class="text-xs opacity-80 mt-1">
              {previews[rating].isMinutes 
                ? `${previews[rating].interval}m` 
                : formatInterval(previews[rating].interval)}
            </span>
            <span class="text-xs opacity-60">({ratingConfig[rating].key})</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
```

### 2.2 SessionProgress.svelte

```svelte
<script>
  import { sessionStore, progress, currentBlock, sessionStats } from '$lib/stores';
  import ProgressBar from '../common/ProgressBar.svelte';
  import Badge from '../common/Badge.svelte';
  import { formatDuration } from '$lib/utils/date';
  
  $: correctRate = $sessionStats.cardsReviewed > 0 
    ? ($sessionStats.correctCount / $sessionStats.cardsReviewed * 100).toFixed(0)
    : 0;
</script>

<div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
  <div class="flex items-center justify-between mb-2">
    <!-- Info do bloco atual -->
    <div class="flex items-center gap-3">
      <Badge>{$currentBlock?.type || 'Carregando...'}</Badge>
      <span class="text-sm text-gray-600 dark:text-gray-400">
        {$currentBlock?.title || ''}
      </span>
    </div>
    
    <!-- Estatísticas rápidas -->
    <div class="flex items-center gap-4 text-sm">
      <span class="text-gray-500">
        <span class="font-medium text-gray-700 dark:text-gray-300">{$sessionStats.cardsReviewed}</span> cards
      </span>
      <span class="text-green-600">
        {correctRate}% correto
      </span>
      <span class="text-gray-500">
        {formatDuration(Math.round($sessionStats.totalTime / 60000))}
      </span>
    </div>
  </div>

  <!-- Barra de progresso -->
  <div class="flex items-center gap-3">
    <ProgressBar 
      value={$progress.current} 
      max={$progress.total} 
      color="primary"
      size="md"
    />
    <span class="text-sm text-gray-500 whitespace-nowrap">
      {$progress.current}/{$progress.total}
    </span>
  </div>
</div>
```

### 2.3 SessionTimer.svelte

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { sessionStore } from '$lib/stores';
  
  let elapsed = 0;
  let interval;
  
  $: isPaused = $sessionStore.isPaused;
  
  $: hours = Math.floor(elapsed / 3600);
  $: minutes = Math.floor((elapsed % 3600) / 60);
  $: seconds = elapsed % 60;
  
  $: display = hours > 0 
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;

  onMount(() => {
    interval = setInterval(() => {
      if (!isPaused) {
        elapsed++;
      }
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div class="flex items-center gap-2 text-lg font-mono">
  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <span class:text-yellow-500={isPaused}>
    {display}
  </span>
  {#if isPaused}
    <span class="text-xs text-yellow-500">(pausado)</span>
  {/if}
</div>
```

---

## 3. TELAS PRINCIPAIS

### 3.1 Dashboard: src/routes/+page.svelte

```svelte
<script>
  import { onMount } from 'svelte';
  import { 
    configStore, subjectsStore, daysUntilExam,
    toast 
  } from '$lib/stores';
  import { scheduler } from '$lib/engines/scheduler.js';
  import { sessionGenerator } from '$lib/engines/sessionGenerator.js';
  import { analytics } from '$lib/engines/analytics.js';
  import Card from '$lib/components/common/Card.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import ProgressBar from '$lib/components/common/ProgressBar.svelte';
  import Badge from '$lib/components/common/Badge.svelte';
  
  let queueStats = null;
  let projection = null;
  let todaySession = null;
  let loading = true;
  
  onMount(async () => {
    await Promise.all([
      configStore.load(),
      subjectsStore.load()
    ]);
    
    queueStats = await scheduler.getQueueStats();
    projection = await analytics.projectPassProbability();
    
    // Verificar se já tem sessão para hoje
    const today = new Date().toISOString().split('T')[0];
    // todaySession = await db.sessions.where('date').equals(today).first();
    
    loading = false;
  });
  
  async function startStudy() {
    const session = await sessionGenerator.generateDailySession();
    // Navegar para a tela de estudo
    window.location.href = '/study';
  }
</script>

<svelte:head>
  <title>Dashboard | Sistema de Estudos</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
  <!-- Header com saudação -->
  <header class="mb-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
      Olá, {$configStore?.userName || 'Estudante'}! 👋
    </h1>
    <p class="text-gray-500 mt-1">
      {#if $daysUntilExam}
        Faltam <span class="font-semibold text-primary-600">{$daysUntilExam} dias</span> para sua prova
      {:else}
        Configure sua data de prova para ver a contagem regressiva
      {/if}
    </p>
  </header>

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Coluna principal -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Card de estudo do dia -->
        <Card padding="lg">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Sessão de Hoje
              </h2>
              <p class="text-sm text-gray-500 mt-1">
                {queueStats?.overdue || 0} atrasados · {queueStats?.dueToday || 0} para hoje
              </p>
            </div>
            
            <Button on:click={startStudy}>
              {todaySession?.status === 'in_progress' ? 'Continuar' : 'Iniciar'} Estudo
            </Button>
          </div>

          <!-- Resumo da fila -->
          <div class="grid grid-cols-4 gap-4 mt-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-state-new">{queueStats?.new || 0}</div>
              <div class="text-xs text-gray-500">Novos</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-state-learning">{queueStats?.learning || 0}</div>
              <div class="text-xs text-gray-500">Aprendendo</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-state-review">{queueStats?.review || 0}</div>
              <div class="text-xs text-gray-500">Revisão</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-red-500">{queueStats?.overdue || 0}</div>
              <div class="text-xs text-gray-500">Atrasados</div>
            </div>
          </div>
        </Card>

        <!-- Matérias -->
        <Card padding="lg">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Suas Matérias
          </h2>
          
          <div class="space-y-3">
            {#each $subjectsStore as subject}
              <div class="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div 
                  class="w-3 h-3 rounded-full" 
                  style="background-color: {subject.color}"
                />
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-gray-800 dark:text-gray-200">
                      {subject.name}
                    </span>
                    <span class="text-sm text-gray-500">
                      {subject.stats?.totalCards || 0} cards
                    </span>
                  </div>
                  <ProgressBar 
                    value={subject.proficiencyLevel} 
                    max={100}
                    size="sm"
                    color={subject.proficiencyLevel > 70 ? 'success' : subject.proficiencyLevel > 40 ? 'warning' : 'danger'}
                  />
                </div>
              </div>
            {/each}
          </div>
          
          <Button variant="ghost" fullWidth class="mt-4">
            + Adicionar Matéria
          </Button>
        </Card>
      </div>

      <!-- Sidebar direita -->
      <div class="space-y-6">
        
        <!-- Projeção de aprovação -->
        {#if projection}
          <Card padding="lg">
            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Projeção de Aprovação
            </h3>
            
            <div class="text-center py-4">
              <div class="text-5xl font-bold text-primary-600">
                {projection.passProbability}%
              </div>
              <div class="text-sm text-gray-500 mt-1">
                Nota projetada: {projection.projectedScore}%
              </div>
            </div>
            
            <p class="text-sm text-gray-600 dark:text-gray-400 text-center mt-4">
              {projection.recommendation}
            </p>
          </Card>
        {/if}

        <!-- Streak e gamificação -->
        <Card padding="lg">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Sua Sequência
            </h3>
            <Badge variant="warning">
              Nível {$configStore?.gamification?.level || 1}
            </Badge>
          </div>
          
          <div class="text-center py-4">
            <div class="text-4xl">🔥</div>
            <div class="text-3xl font-bold text-orange-500 mt-2">
              {$configStore?.gamification?.currentStreak || 0} dias
            </div>
            <div class="text-sm text-gray-500">
              Recorde: {$configStore?.gamification?.longestStreak || 0} dias
            </div>
          </div>
          
          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">XP Total</span>
              <span class="font-medium">{$configStore?.gamification?.totalXP || 0}</span>
            </div>
          </div>
        </Card>

        <!-- Quick actions -->
        <Card padding="md">
          <div class="space-y-2">
            <a href="/cards" class="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span class="text-gray-700 dark:text-gray-300">📚 Gerenciar Cards</span>
            </a>
            <a href="/stats" class="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span class="text-gray-700 dark:text-gray-300">📊 Ver Estatísticas</span>
            </a>
            <a href="/settings" class="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span class="text-gray-700 dark:text-gray-300">⚙️ Configurações</span>
            </a>
          </div>
        </Card>
      </div>
    </div>
  {/if}
</div>
```

### 3.2 Tela de Estudo: src/routes/study/+page.svelte

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { 
    sessionStore, progress, currentBlock, sessionStats,
    configStore, toast
  } from '$lib/stores';
  import { sessionGenerator } from '$lib/engines/sessionGenerator.js';
  import StudyCard from '$lib/components/cards/StudyCard.svelte';
  import SessionProgress from '$lib/components/session/SessionProgress.svelte';
  import SessionTimer from '$lib/components/session/SessionTimer.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import Card from '$lib/components/common/Card.svelte';
  
  let keyboardHandler;
  
  onMount(async () => {
    // Carregar configuração
    await configStore.load();
    
    // Verificar se tem sessão ativa ou criar nova
    if (!$sessionStore.session) {
      const session = await sessionGenerator.generateDailySession();
      await sessionStore.start(session);
    }
    
    // Configurar atalhos de teclado
    keyboardHandler = (e) => sessionStore.handleKeyboard(e);
    document.addEventListener('keydown', keyboardHandler);
  });
  
  onDestroy(() => {
    if (keyboardHandler) {
      document.removeEventListener('keydown', keyboardHandler);
    }
  });
  
  function handlePause() {
    if ($sessionStore.isPaused) {
      sessionStore.resume();
    } else {
      sessionStore.pause();
    }
  }
  
  async function handleFinish() {
    await sessionStore.finish();
    toast('Sessão finalizada! Bom trabalho! 🎉', 'success');
    goto('/');
  }
</script>

<svelte:head>
  <title>Sessão de Estudo | Sistema de Estudos</title>
</svelte:head>

<div class="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
  <!-- Header fixo -->
  <header class="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a href="/" class="text-gray-400 hover:text-gray-600">
          ← Voltar
        </a>
        <SessionTimer />
      </div>
      
      <div class="flex items-center gap-2">
        <Button variant="ghost" on:click={handlePause}>
          {$sessionStore.isPaused ? '▶️ Continuar' : '⏸️ Pausar'}
        </Button>
        <Button variant="secondary" on:click={handleFinish}>
          Finalizar
        </Button>
      </div>
    </div>
    
    <!-- Barra de progresso -->
    <SessionProgress />
  </header>

  <!-- Conteúdo principal -->
  <main class="flex-1 overflow-hidden">
    {#if $sessionStore.isComplete}
      <!-- Tela de conclusão -->
      <div class="h-full flex items-center justify-center p-4">
        <Card padding="lg" class="max-w-md w-full text-center">
          <div class="text-6xl mb-4">🎉</div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Parabéns!
          </h2>
          <p class="text-gray-500 mb-6">
            Você completou a sessão de hoje!
          </p>
          
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="text-2xl font-bold text-primary-600">
                {$sessionStats.cardsReviewed}
              </div>
              <div class="text-sm text-gray-500">Cards revisados</div>
            </div>
            <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="text-2xl font-bold text-green-600">
                {$sessionStats.cardsReviewed > 0 
                  ? Math.round($sessionStats.correctCount / $sessionStats.cardsReviewed * 100) 
                  : 0}%
              </div>
              <div class="text-sm text-gray-500">Taxa de acerto</div>
            </div>
          </div>
          
          <Button fullWidth on:click={handleFinish}>
            Voltar ao Dashboard
          </Button>
        </Card>
      </div>
    
    {:else if $sessionStore.isPaused}
      <!-- Tela de pausa -->
      <div class="h-full flex items-center justify-center p-4">
        <Card padding="lg" class="max-w-md w-full text-center">
          <div class="text-6xl mb-4">☕</div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Sessão Pausada
          </h2>
          <p class="text-gray-500 mb-6">
            Descanse um pouco e volte quando estiver pronto!
          </p>
          <Button fullWidth on:click={() => sessionStore.resume()}>
            Continuar Estudando
          </Button>
        </Card>
      </div>
    
    {:else if $sessionStore.currentCard}
      <!-- Card de estudo -->
      <div class="h-full max-w-3xl mx-auto p-4">
        <Card padding="lg" class="h-full">
          <StudyCard 
            card={$sessionStore.currentCard}
            showAnswer={$sessionStore.showingAnswer}
          />
        </Card>
      </div>
    
    {:else if $currentBlock?.type === 'new_content'}
      <!-- Bloco de conteúdo novo -->
      <div class="h-full max-w-3xl mx-auto p-4">
        <Card padding="lg">
          <h2 class="text-xl font-bold mb-4">{$currentBlock.title}</h2>
          <p class="text-gray-600 mb-6">{$currentBlock.description}</p>
          
          <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p class="text-yellow-800 dark:text-yellow-200">
              📖 Este bloco é para estudo de conteúdo novo. 
              Leia o material indicado e depois clique em "Concluído".
            </p>
          </div>
          
          <Button fullWidth class="mt-6" on:click={() => sessionStore.nextBlock()}>
            Conteúdo Concluído
          </Button>
        </Card>
      </div>
    
    {:else if $currentBlock?.type === 'encoding'}
      <!-- Bloco de encoding -->
      <div class="h-full max-w-3xl mx-auto p-4">
        <Card padding="lg">
          <h2 class="text-xl font-bold mb-4">{$currentBlock.title}</h2>
          <p class="text-gray-600 mb-6">{$currentBlock.description}</p>
          
          <div class="space-y-3">
            {#each $currentBlock.activities as activity}
              <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <input type="checkbox" class="w-5 h-5 text-primary-600" />
                <span>{activity}</span>
              </div>
            {/each}
          </div>
          
          <Button fullWidth class="mt-6" on:click={() => sessionStore.nextBlock()}>
            Finalizar Consolidação
          </Button>
        </Card>
      </div>
    
    {:else}
      <!-- Loading ou erro -->
      <div class="h-full flex items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    {/if}
  </main>
</div>
```

---

## 4. FLUXOS DE NAVEGAÇÃO

```
┌─────────────────────────────────────────────────────────────┐
│                     FLUXO PRINCIPAL                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Dashboard] ─────┬───────► [Sessão de Estudo]             │
│       │           │              │                          │
│       │           │              ├── Card de Revisão        │
│       │           │              ├── Bloco de Conteúdo      │
│       │           │              ├── Bloco de Questões      │
│       │           │              └── Tela de Conclusão      │
│       │           │                                         │
│       ├───────────┼───────► [Gerenciar Cards]              │
│       │           │              │                          │
│       │           │              ├── Lista de Cards         │
│       │           │              ├── Adicionar Card         │
│       │           │              └── Editar Card            │
│       │           │                                         │
│       ├───────────┼───────► [Matérias]                     │
│       │           │              │                          │
│       │           │              ├── Lista de Matérias      │
│       │           │              ├── Tópicos da Matéria     │
│       │           │              └── Aulas/PDFs             │
│       │           │                                         │
│       ├───────────┼───────► [Estatísticas]                 │
│       │           │              │                          │
│       │           │              ├── Visão Geral            │
│       │           │              ├── Por Matéria            │
│       │           │              ├── Curva de Retenção      │
│       │           │              └── Projeções              │
│       │           │                                         │
│       └───────────┴───────► [Configurações]                │
│                                  │                          │
│                                  ├── Perfil                 │
│                                  ├── Concurso Alvo          │
│                                  ├── Horários               │
│                                  ├── FSRS (Avançado)        │
│                                  └── Backup/Restaurar       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. ATALHOS DE TECLADO

```
┌─────────────────────────────────────────────────────────────┐
│                    ATALHOS GLOBAIS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Space] ou [Enter]    Mostrar resposta / Próximo          │
│                                                             │
│  [1]                   Rating: Não lembrei (Again)         │
│  [2]                   Rating: Difícil (Hard)              │
│  [3]                   Rating: Bom (Good)                  │
│  [4]                   Rating: Fácil (Easy)                │
│                                                             │
│  [J] [K] [L] [;]       Ratings 1-4 (mão direita)           │
│                                                             │
│  [P]                   Pausar/Continuar sessão             │
│  [Esc]                 Fechar modal / Voltar               │
│                                                             │
│  [Ctrl+S]              Sincronizar/Salvar                  │
│  [Ctrl+D]              Toggle dark mode                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## PRÓXIMO DOCUMENTO

**Parte 6: Setup do Projeto + Implementação Final** — package.json, configurações, scripts de build, instruções de deploy, checklist de implementação
