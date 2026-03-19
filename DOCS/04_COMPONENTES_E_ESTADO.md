# BLUEPRINT: Sistema de Estudos de Elite
## Parte 4: Componentes e Estado (Svelte)

---

## 1. ESTRUTURA DE DIRETÓRIOS

```
src/
├── lib/
│   ├── db.js                    # Dexie database
│   ├── fsrs/                    # Motor FSRS (Parte 2)
│   ├── engines/                 # Engines de negócio (Parte 3)
│   ├── stores/                  # Svelte stores
│   │   ├── config.js
│   │   ├── session.js
│   │   ├── cards.js
│   │   ├── subjects.js
│   │   ├── ui.js
│   │   └── index.js
│   ├── actions/                 # Actions (modificam estado)
│   │   ├── review.js
│   │   ├── session.js
│   │   └── sync.js
│   └── utils/                   # Utilitários
│       ├── date.js
│       ├── format.js
│       └── keyboard.js
├── components/                  # Componentes Svelte
│   ├── common/                  # Componentes genéricos
│   ├── cards/                   # Componentes de cards
│   ├── session/                 # Componentes de sessão
│   ├── dashboard/               # Componentes de dashboard
│   └── settings/                # Componentes de configuração
├── routes/                      # Páginas (SvelteKit)
│   ├── +page.svelte            # Dashboard
│   ├── +layout.svelte          # Layout principal
│   ├── study/
│   │   └── +page.svelte        # Sessão de estudo
│   ├── cards/
│   │   └── +page.svelte        # Gerenciar cards
│   ├── subjects/
│   │   └── +page.svelte        # Gerenciar matérias
│   ├── stats/
│   │   └── +page.svelte        # Estatísticas
│   └── settings/
│       └── +page.svelte        # Configurações
└── app.css                      # Estilos globais (Tailwind)
```

---

## 2. SVELTE STORES

### 2.1 Store de Configuração: src/lib/stores/config.js

```javascript
import { writable, derived } from 'svelte/store';
import { db } from '../db.js';

/**
 * Store de configuração global
 */
function createConfigStore() {
  const { subscribe, set, update } = writable(null);

  return {
    subscribe,
    
    /**
     * Carrega configuração do banco
     */
    async load() {
      let config = await db.config.get(1);
      
      if (!config) {
        // Criar configuração padrão
        config = {
          id: 1,
          userName: '',
          targetExam: {
            name: '',
            date: null,
            institution: '',
            positions: 0
          },
          schedule: {
            weeklyHours: 20,
            dailyDistribution: {
              monday: 3, tuesday: 3, wednesday: 3,
              thursday: 3, friday: 3, saturday: 3, sunday: 2
            },
            preferredStartTime: '06:00',
            breakDuration: 10,
            sessionBlockMinutes: 50
          },
          fsrsParams: {
            w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
            requestRetention: 0.85,
            maximumInterval: 365,
            enableFuzz: true
          },
          preferences: {
            newCardsPerDay: 20,
            maxReviewsPerDay: 200,
            interleaveSubjects: true,
            showAnswerTime: true,
            enableSound: true,
            theme: 'system'
          },
          gamification: {
            currentStreak: 0,
            longestStreak: 0,
            totalXP: 0,
            level: 1
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await db.config.add(config);
      }
      
      set(config);
      return config;
    },

    /**
     * Atualiza configuração
     */
    async save(changes) {
      update(config => {
        const updated = {
          ...config,
          ...changes,
          updatedAt: new Date().toISOString()
        };
        db.config.put(updated);
        return updated;
      });
    },

    /**
     * Atualiza parâmetros FSRS
     */
    async updateFSRS(params) {
      update(config => {
        const updated = {
          ...config,
          fsrsParams: { ...config.fsrsParams, ...params },
          updatedAt: new Date().toISOString()
        };
        db.config.put(updated);
        return updated;
      });
    },

    /**
     * Incrementa streak
     */
    async incrementStreak() {
      update(config => {
        const newStreak = config.gamification.currentStreak + 1;
        const updated = {
          ...config,
          gamification: {
            ...config.gamification,
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, config.gamification.longestStreak)
          },
          updatedAt: new Date().toISOString()
        };
        db.config.put(updated);
        return updated;
      });
    },

    /**
     * Reseta streak
     */
    async resetStreak() {
      update(config => {
        const updated = {
          ...config,
          gamification: {
            ...config.gamification,
            currentStreak: 0
          },
          updatedAt: new Date().toISOString()
        };
        db.config.put(updated);
        return updated;
      });
    },

    /**
     * Adiciona XP
     */
    async addXP(amount) {
      update(config => {
        const newXP = config.gamification.totalXP + amount;
        const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
        
        const updated = {
          ...config,
          gamification: {
            ...config.gamification,
            totalXP: newXP,
            level: newLevel
          },
          updatedAt: new Date().toISOString()
        };
        db.config.put(updated);
        return updated;
      });
    }
  };
}

export const configStore = createConfigStore();

// Derived stores
export const theme = derived(configStore, $config => $config?.preferences?.theme || 'system');
export const fsrsParams = derived(configStore, $config => $config?.fsrsParams);
export const examDate = derived(configStore, $config => $config?.targetExam?.date);
export const daysUntilExam = derived(examDate, $date => {
  if (!$date) return null;
  return Math.ceil((new Date($date) - new Date()) / 86400000);
});
```

### 2.2 Store de Sessão: src/lib/stores/session.js

```javascript
import { writable, derived, get } from 'svelte/store';
import { db } from '../db.js';
import { fsrs } from '../fsrs/fsrs.js';
import { configStore } from './config.js';

/**
 * Estado da sessão de estudo atual
 */
function createSessionStore() {
  const initial = {
    // Sessão atual
    session: null,
    currentBlockIndex: 0,
    
    // Card atual sendo revisado
    currentCard: null,
    cardStartTime: null,
    showingAnswer: false,
    
    // Fila de cards do bloco atual
    cardQueue: [],
    queuePosition: 0,
    
    // Estatísticas da sessão atual
    stats: {
      cardsReviewed: 0,
      correctCount: 0,
      incorrectCount: 0,
      totalTime: 0,
      ratings: { 1: 0, 2: 0, 3: 0, 4: 0 }
    },
    
    // Estado da UI
    isPaused: false,
    isComplete: false
  };

  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    
    /**
     * Inicia uma sessão de estudo
     */
    async start(session) {
      const firstBlock = session.plan.blocks[0];
      const queue = firstBlock?.cards || [];
      
      set({
        ...initial,
        session,
        cardQueue: queue,
        currentCard: queue[0] || null,
        cardStartTime: Date.now()
      });

      // Atualizar status no banco
      await db.sessions.update(session.id, { 
        status: 'in_progress',
        actualStartTime: new Date().toTimeString().slice(0, 5)
      });
    },

    /**
     * Mostra a resposta do card atual
     */
    showAnswer() {
      update(state => ({
        ...state,
        showingAnswer: true
      }));
    },

    /**
     * Processa a resposta do usuário
     */
    async answer(rating) {
      const state = get({ subscribe });
      if (!state.currentCard) return;

      const responseTime = Date.now() - state.cardStartTime;
      const card = state.currentCard;
      
      // Processar revisão com FSRS
      const config = get(configStore);
      const fsrsInstance = new fsrs.constructor(config.fsrsParams);
      const result = fsrsInstance.review(card, rating);

      // Atualizar card no banco
      await db.cards.update(card.id, {
        ...result,
        stats: {
          ...card.stats,
          totalReviews: (card.stats?.totalReviews || 0) + 1,
          correctCount: (card.stats?.correctCount || 0) + (rating >= 2 ? 1 : 0),
          incorrectCount: (card.stats?.incorrectCount || 0) + (rating < 2 ? 1 : 0),
          averageTime: Math.round(
            ((card.stats?.averageTime || 0) * (card.stats?.totalReviews || 0) + responseTime) /
            ((card.stats?.totalReviews || 0) + 1)
          ),
          streak: rating >= 2 ? (card.stats?.streak || 0) + 1 : 0
        }
      });

      // Salvar log de revisão
      await db.reviewLogs.add({
        cardId: card.id,
        timestamp: new Date().toISOString(),
        rating,
        stateBefore: card.state,
        stateAfter: result.state,
        responseTime,
        intervalBefore: card.lastInterval || 0,
        intervalAfter: result.lastInterval,
        stabilityBefore: card.stability,
        stabilityAfter: result.stability,
        difficultyBefore: card.difficulty,
        difficultyAfter: result.difficulty,
        sessionId: state.session.id
      });

      // Calcular XP
      const xp = this.calculateXP(rating, responseTime, card);
      await configStore.addXP(xp);

      // Atualizar estado
      update(s => {
        const newPosition = s.queuePosition + 1;
        const nextCard = s.cardQueue[newPosition] || null;
        
        return {
          ...s,
          queuePosition: newPosition,
          currentCard: nextCard,
          cardStartTime: nextCard ? Date.now() : null,
          showingAnswer: false,
          stats: {
            cardsReviewed: s.stats.cardsReviewed + 1,
            correctCount: s.stats.correctCount + (rating >= 2 ? 1 : 0),
            incorrectCount: s.stats.incorrectCount + (rating < 2 ? 1 : 0),
            totalTime: s.stats.totalTime + responseTime,
            ratings: {
              ...s.stats.ratings,
              [rating]: s.stats.ratings[rating] + 1
            }
          }
        };
      });

      // Verificar se bloco terminou
      const newState = get({ subscribe });
      if (!newState.currentCard) {
        await this.nextBlock();
      }
    },

    /**
     * Calcula XP ganho
     */
    calculateXP(rating, responseTime, card) {
      let xp = 10; // Base
      
      // Bonus por rating
      if (rating === 4) xp += 5;
      else if (rating === 3) xp += 2;
      else if (rating === 1) xp -= 3;
      
      // Bonus por velocidade (< 10s)
      if (responseTime < 10000) xp += 3;
      
      // Bonus por streak
      if (card.stats?.streak > 5) xp += 2;
      
      return Math.max(1, xp);
    },

    /**
     * Avança para o próximo bloco
     */
    async nextBlock() {
      update(state => {
        const nextIndex = state.currentBlockIndex + 1;
        const nextBlock = state.session?.plan?.blocks?.[nextIndex];
        
        if (!nextBlock) {
          // Sessão completa
          return { ...state, isComplete: true };
        }
        
        const queue = nextBlock.cards || [];
        
        return {
          ...state,
          currentBlockIndex: nextIndex,
          cardQueue: queue,
          queuePosition: 0,
          currentCard: queue[0] || null,
          cardStartTime: queue[0] ? Date.now() : null,
          showingAnswer: false
        };
      });
    },

    /**
     * Pausa a sessão
     */
    pause() {
      update(state => ({ ...state, isPaused: true }));
    },

    /**
     * Retoma a sessão
     */
    resume() {
      update(state => ({
        ...state,
        isPaused: false,
        cardStartTime: Date.now() // Reset timer
      }));
    },

    /**
     * Finaliza a sessão
     */
    async finish() {
      const state = get({ subscribe });
      
      // Atualizar sessão no banco
      await db.sessions.update(state.session.id, {
        status: 'completed',
        actualEndTime: new Date().toTimeString().slice(0, 5),
        execution: {
          reviewsDone: state.stats.cardsReviewed,
          correctAnswers: state.stats.correctCount,
          incorrectAnswers: state.stats.incorrectCount,
          totalActiveTime: Math.round(state.stats.totalTime / 60000)
        }
      });

      // Atualizar estatísticas diárias
      const today = new Date().toISOString().split('T')[0];
      const existing = await db.dailyStats.where('date').equals(today).first();
      
      if (existing) {
        await db.dailyStats.update(existing.id, {
          cards: {
            ...existing.cards,
            reviewed: existing.cards.reviewed + state.stats.cardsReviewed
          },
          time: {
            ...existing.time,
            actual: existing.time.actual + Math.round(state.stats.totalTime / 60000)
          },
          performance: {
            correctRate: (existing.performance.correctRate + 
              state.stats.correctCount / state.stats.cardsReviewed) / 2
          }
        });
      } else {
        await db.dailyStats.add({
          date: today,
          cards: { reviewed: state.stats.cardsReviewed, newLearned: 0 },
          time: { actual: Math.round(state.stats.totalTime / 60000) },
          performance: {
            correctRate: state.stats.correctCount / state.stats.cardsReviewed
          }
        });
      }

      // Verificar streak
      await this.checkStreak();

      // Reset state
      set(initial);
    },

    /**
     * Verifica e atualiza streak
     */
    async checkStreak() {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      const yesterdayStats = await db.dailyStats.where('date').equals(yesterday).first();
      
      if (yesterdayStats && yesterdayStats.cards.reviewed > 0) {
        await configStore.incrementStreak();
      } else {
        await configStore.resetStreak();
        await configStore.incrementStreak();
      }
    },

    /**
     * Atalhos de teclado
     */
    handleKeyboard(event) {
      const state = get({ subscribe });
      
      if (state.isPaused) return;
      
      if (!state.showingAnswer) {
        // Mostrar resposta com espaço ou enter
        if (event.code === 'Space' || event.code === 'Enter') {
          event.preventDefault();
          this.showAnswer();
        }
      } else {
        // Ratings com 1-4
        if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(event.code)) {
          event.preventDefault();
          this.answer(parseInt(event.code.slice(-1)));
        }
        // Ou J/K/L/; para one-hand
        const keyMap = { KeyJ: 1, KeyK: 2, KeyL: 3, Semicolon: 4 };
        if (keyMap[event.code]) {
          event.preventDefault();
          this.answer(keyMap[event.code]);
        }
      }
    },

    /**
     * Reset completo
     */
    reset() {
      set(initial);
    }
  };
}

export const sessionStore = createSessionStore();

// Derived stores
export const currentBlock = derived(sessionStore, $s => 
  $s.session?.plan?.blocks?.[$s.currentBlockIndex]
);

export const progress = derived(sessionStore, $s => ({
  current: $s.queuePosition,
  total: $s.cardQueue.length,
  percentage: $s.cardQueue.length > 0 
    ? Math.round(($s.queuePosition / $s.cardQueue.length) * 100) 
    : 0
}));

export const sessionStats = derived(sessionStore, $s => $s.stats);
```

### 2.3 Store de Cards: src/lib/stores/cards.js

```javascript
import { writable, derived } from 'svelte/store';
import { db } from '../db.js';
import { scheduler } from '../engines/scheduler.js';

/**
 * Store para gerenciamento de cards
 */
function createCardsStore() {
  const { subscribe, set, update } = writable({
    cards: [],
    loading: false,
    filters: {
      subjectId: null,
      topicId: null,
      state: null,
      searchQuery: ''
    },
    sort: {
      field: 'due',
      direction: 'asc'
    }
  });

  return {
    subscribe,

    /**
     * Carrega cards com filtros
     */
    async load(filters = {}) {
      update(s => ({ ...s, loading: true }));
      
      let query = db.cards;
      
      if (filters.subjectId) {
        query = query.where('subjectId').equals(filters.subjectId);
      }
      
      let cards = await query.toArray();
      
      // Aplicar filtros adicionais
      if (filters.topicId) {
        cards = cards.filter(c => c.topicId === filters.topicId);
      }
      if (filters.state) {
        cards = cards.filter(c => c.state === filters.state);
      }
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        cards = cards.filter(c => 
          c.content.question?.toLowerCase().includes(q) ||
          c.content.front?.toLowerCase().includes(q)
        );
      }

      update(s => ({
        ...s,
        cards,
        filters: { ...s.filters, ...filters },
        loading: false
      }));
    },

    /**
     * Adiciona um novo card
     */
    async add(cardData) {
      const card = {
        ...cardData,
        state: 'new',
        stability: 0,
        difficulty: 5,
        due: new Date().toISOString(),
        reps: 0,
        lapses: 0,
        lastReview: null,
        lastRating: null,
        suspended: false,
        buried: false,
        flagged: false,
        stats: {
          totalReviews: 0,
          correctCount: 0,
          incorrectCount: 0,
          averageTime: 0,
          streak: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const id = await db.cards.add(card);
      
      update(s => ({
        ...s,
        cards: [...s.cards, { ...card, id }]
      }));

      // Atualizar stats da matéria
      await this.updateSubjectStats(card.subjectId);

      return id;
    },

    /**
     * Atualiza um card
     */
    async update(id, changes) {
      const updated = {
        ...changes,
        updatedAt: new Date().toISOString()
      };
      
      await db.cards.update(id, updated);
      
      update(s => ({
        ...s,
        cards: s.cards.map(c => c.id === id ? { ...c, ...updated } : c)
      }));
    },

    /**
     * Remove um card
     */
    async remove(id) {
      const card = await db.cards.get(id);
      await db.cards.delete(id);
      
      update(s => ({
        ...s,
        cards: s.cards.filter(c => c.id !== id)
      }));

      if (card) {
        await this.updateSubjectStats(card.subjectId);
      }
    },

    /**
     * Suspende/reativa card
     */
    async toggleSuspend(id) {
      const card = await db.cards.get(id);
      await this.update(id, { suspended: !card.suspended });
    },

    /**
     * Enterra card até amanhã
     */
    async bury(id) {
      await this.update(id, { buried: true });
      
      // Agendar para desenterrar amanhã
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(4, 0, 0, 0);
      
      // Em produção, isso seria um job agendado
    },

    /**
     * Desenterrar todos os cards
     */
    async unburyAll() {
      await db.cards.where('buried').equals(true).modify({ buried: false });
      await this.load();
    },

    /**
     * Reseta um card para estado inicial
     */
    async reset(id) {
      await this.update(id, {
        state: 'new',
        stability: 0,
        difficulty: 5,
        due: new Date().toISOString(),
        reps: 0,
        lapses: 0,
        lastReview: null,
        lastRating: null
      });
    },

    /**
     * Atualiza estatísticas da matéria
     */
    async updateSubjectStats(subjectId) {
      const cards = await db.cards.where('subjectId').equals(subjectId).toArray();
      
      const stats = {
        totalCards: cards.length,
        matureCards: cards.filter(c => c.stability > 21).length,
        learningCards: cards.filter(c => c.state === 'learning' || c.state === 'relearning').length,
        newCards: cards.filter(c => c.state === 'new').length,
        averageEase: cards.length > 0
          ? cards.reduce((sum, c) => sum + c.difficulty, 0) / cards.length
          : 5,
        retention: cards.filter(c => c.state === 'review').length > 0
          ? cards.filter(c => c.state === 'review' && c.lapses === 0).length /
            cards.filter(c => c.state === 'review').length
          : 0
      };

      await db.subjects.update(subjectId, { stats });
    },

    /**
     * Importa cards de CSV/JSON
     */
    async import(data, subjectId, topicId) {
      const cards = data.map(item => ({
        topicId,
        subjectId,
        type: item.type || 'question',
        content: item.content,
        state: 'new',
        stability: 0,
        difficulty: 5,
        due: new Date().toISOString(),
        reps: 0,
        lapses: 0,
        createdAt: new Date().toISOString()
      }));

      await db.cards.bulkAdd(cards);
      await this.load({ subjectId });
      await this.updateSubjectStats(subjectId);
      
      return cards.length;
    }
  };
}

export const cardsStore = createCardsStore();

// Derived: Cards que vencem hoje
export const dueToday = derived(cardsStore, async () => {
  return await scheduler.getDueCards();
});
```

### 2.4 Store de UI: src/lib/stores/ui.js

```javascript
import { writable, derived } from 'svelte/store';

/**
 * Estado global da UI
 */
function createUIStore() {
  const { subscribe, set, update } = writable({
    // Sidebar
    sidebarOpen: true,
    sidebarCollapsed: false,
    
    // Modals
    activeModal: null,
    modalData: null,
    
    // Toasts/Notifications
    toasts: [],
    
    // Loading states
    globalLoading: false,
    loadingMessage: '',
    
    // Theme
    darkMode: false,
    
    // Mobile
    isMobile: false,
    
    // Keyboard
    keyboardShortcutsEnabled: true
  });

  return {
    subscribe,

    // Sidebar
    toggleSidebar() {
      update(s => ({ ...s, sidebarOpen: !s.sidebarOpen }));
    },
    
    collapseSidebar() {
      update(s => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed }));
    },

    // Modals
    openModal(name, data = null) {
      update(s => ({ ...s, activeModal: name, modalData: data }));
    },
    
    closeModal() {
      update(s => ({ ...s, activeModal: null, modalData: null }));
    },

    // Toasts
    toast(message, type = 'info', duration = 3000) {
      const id = Date.now();
      const toast = { id, message, type };
      
      update(s => ({ ...s, toasts: [...s.toasts, toast] }));
      
      if (duration > 0) {
        setTimeout(() => {
          update(s => ({
            ...s,
            toasts: s.toasts.filter(t => t.id !== id)
          }));
        }, duration);
      }
      
      return id;
    },
    
    dismissToast(id) {
      update(s => ({
        ...s,
        toasts: s.toasts.filter(t => t.id !== id)
      }));
    },

    // Loading
    setLoading(loading, message = '') {
      update(s => ({
        ...s,
        globalLoading: loading,
        loadingMessage: message
      }));
    },

    // Theme
    setDarkMode(dark) {
      update(s => ({ ...s, darkMode: dark }));
      document.documentElement.classList.toggle('dark', dark);
      localStorage.setItem('darkMode', dark);
    },
    
    toggleDarkMode() {
      update(s => {
        const newDark = !s.darkMode;
        document.documentElement.classList.toggle('dark', newDark);
        localStorage.setItem('darkMode', newDark);
        return { ...s, darkMode: newDark };
      });
    },

    // Mobile detection
    checkMobile() {
      const isMobile = window.innerWidth < 768;
      update(s => ({ ...s, isMobile }));
    },

    // Initialize
    init() {
      // Load dark mode preference
      const savedDark = localStorage.getItem('darkMode') === 'true';
      this.setDarkMode(savedDark);
      
      // Check mobile
      this.checkMobile();
      window.addEventListener('resize', () => this.checkMobile());
    }
  };
}

export const uiStore = createUIStore();

// Convenience exports
export const { toast, openModal, closeModal, setLoading } = uiStore;
```

### 2.5 Index de Stores: src/lib/stores/index.js

```javascript
// Re-export all stores
export { configStore, theme, fsrsParams, examDate, daysUntilExam } from './config.js';
export { sessionStore, currentBlock, progress, sessionStats } from './session.js';
export { cardsStore, dueToday } from './cards.js';
export { uiStore, toast, openModal, closeModal, setLoading } from './ui.js';

// Store de matérias (simplificado)
import { writable } from 'svelte/store';
import { db } from '../db.js';

function createSubjectsStore() {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    
    async load() {
      const subjects = await db.subjects.orderBy('order').toArray();
      set(subjects);
      return subjects;
    },

    async add(subject) {
      const order = (await db.subjects.count()) + 1;
      const id = await db.subjects.add({
        ...subject,
        order,
        proficiencyLevel: 0,
        stats: { totalCards: 0, matureCards: 0, learningCards: 0, newCards: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await this.load();
      return id;
    },

    async update(id, changes) {
      await db.subjects.update(id, {
        ...changes,
        updatedAt: new Date().toISOString()
      });
      await this.load();
    },

    async remove(id) {
      // Também remove cards e tópicos relacionados
      await db.cards.where('subjectId').equals(id).delete();
      await db.topics.where('subjectId').equals(id).delete();
      await db.subjects.delete(id);
      await this.load();
    },

    async reorder(fromIndex, toIndex) {
      const subjects = await db.subjects.orderBy('order').toArray();
      const [moved] = subjects.splice(fromIndex, 1);
      subjects.splice(toIndex, 0, moved);
      
      await Promise.all(
        subjects.map((s, i) => db.subjects.update(s.id, { order: i + 1 }))
      );
      await this.load();
    }
  };
}

export const subjectsStore = createSubjectsStore();
```

---

## 3. UTILITÁRIOS

### 3.1 Formatação de Datas: src/lib/utils/date.js

```javascript
/**
 * Utilitários de data
 */

export function formatDate(date, format = 'short') {
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('pt-BR');
    case 'long':
      return d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'time':
      return d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'relative':
      return formatRelative(d);
    default:
      return d.toISOString();
  }
}

export function formatRelative(date) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = d - now;
  const diffDays = Math.ceil(diffMs / 86400000);
  
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Amanhã';
  if (diffDays === -1) return 'Ontem';
  if (diffDays > 0 && diffDays < 7) return `Em ${diffDays} dias`;
  if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)} dias atrás`;
  
  return formatDate(date, 'short');
}

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

export function formatInterval(days) {
  if (days < 1) return '< 1d';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${(days / 30).toFixed(1)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

export function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function isToday(date) {
  return new Date(date).toISOString().split('T')[0] === getToday();
}
```

### 3.2 Formatação Geral: src/lib/utils/format.js

```javascript
/**
 * Utilitários de formatação
 */

export function formatNumber(num, decimals = 0) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

export function formatPercent(value, decimals = 0) {
  return `${formatNumber(value * 100, decimals)}%`;
}

export function formatCompact(num) {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}k`;
  return `${(num / 1000000).toFixed(1)}M`;
}

export function truncate(str, length = 50) {
  if (!str || str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}

export function pluralize(count, singular, plural = null) {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || singular + 's'}`;
}

export function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
```

### 3.3 Atalhos de Teclado: src/lib/utils/keyboard.js

```javascript
/**
 * Gerenciador de atalhos de teclado
 */

const shortcuts = new Map();

export function registerShortcut(key, callback, options = {}) {
  const { ctrl = false, shift = false, alt = false, meta = false } = options;
  
  const id = `${ctrl ? 'ctrl+' : ''}${shift ? 'shift+' : ''}${alt ? 'alt+' : ''}${meta ? 'meta+' : ''}${key.toLowerCase()}`;
  
  shortcuts.set(id, { callback, options });
  
  return () => shortcuts.delete(id);
}

export function handleKeydown(event) {
  const id = `${event.ctrlKey ? 'ctrl+' : ''}${event.shiftKey ? 'shift+' : ''}${event.altKey ? 'alt+' : ''}${event.metaKey ? 'meta+' : ''}${event.key.toLowerCase()}`;
  
  const shortcut = shortcuts.get(id);
  
  if (shortcut) {
    const { callback, options } = shortcut;
    
    // Ignorar se estiver em input
    if (!options.allowInInput && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
      return;
    }
    
    event.preventDefault();
    callback(event);
  }
}

// Atalhos globais padrão
export function initKeyboardShortcuts() {
  document.addEventListener('keydown', handleKeydown);
  
  // Retornar cleanup function
  return () => document.removeEventListener('keydown', handleKeydown);
}
```

---

## PRÓXIMO DOCUMENTO

**Parte 5: UI/UX Completo** — Componentes visuais, telas, fluxos de navegação, design system
