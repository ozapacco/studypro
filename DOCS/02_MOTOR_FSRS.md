# BLUEPRINT: Sistema de Estudos de Elite
## Parte 2: Motor FSRS (Free Spaced Repetition Scheduler)

---

## 1. INTRODUÇÃO AO FSRS

### 1.1 O que é FSRS?
FSRS (Free Spaced Repetition Scheduler) é um algoritmo de repetição espaçada moderno que supera o SM-2 (usado no Anki original) em:
- **Precisão**: Modela melhor a curva de esquecimento individual
- **Adaptabilidade**: Aprende com seu padrão de memória
- **Eficiência**: Menos revisões para mesma retenção

### 1.2 Conceitos Fundamentais

```
┌─────────────────────────────────────────────────────────────┐
│                    MODELO DE MEMÓRIA                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Retrievability (R) = (1 + FACTOR * t/S)^DECAY             │
│                                                             │
│  Onde:                                                      │
│    R = Probabilidade de lembrar (0 a 1)                    │
│    t = Tempo desde última revisão (dias)                   │
│    S = Estabilidade da memória (dias)                      │
│    DECAY = -0.5                                            │
│    FACTOR = 19/81                                          │
│                                                             │
│  Estabilidade (S):                                          │
│    - Tempo para R cair de 100% para ~90%                   │
│    - Aumenta com revisões bem-sucedidas                    │
│    - Diminui com esquecimentos                             │
│                                                             │
│  Dificuldade (D):                                           │
│    - Quão difícil é lembrar este card (1-10)              │
│    - Afeta quanto S aumenta por revisão                    │
│    - Cards difíceis precisam mais repetições               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. IMPLEMENTAÇÃO COMPLETA

### 2.1 Arquivo: src/lib/fsrs/params.js

```javascript
/**
 * Parâmetros default do FSRS v4
 * Calibrados estatisticamente em milhões de revisões
 */
export const DEFAULT_PARAMS = {
  w: [
    0.4,    // w[0]:  Estabilidade inicial para rating "Again" (1)
    0.6,    // w[1]:  Estabilidade inicial para rating "Hard" (2)
    2.4,    // w[2]:  Estabilidade inicial para rating "Good" (3)
    5.8,    // w[3]:  Estabilidade inicial para rating "Easy" (4)
    4.93,   // w[4]:  Dificuldade inicial (D0)
    0.94,   // w[5]:  Fator de escala para cálculo de D
    0.86,   // w[6]:  Fator de decaimento de D
    0.01,   // w[7]:  Fator de mean reversion
    1.49,   // w[8]:  Fator de crescimento de S (success)
    0.14,   // w[9]:  Fator de dificuldade no crescimento de S
    0.94,   // w[10]: Fator de retrievability no crescimento de S
    2.18,   // w[11]: Penalidade para rating "Hard"
    0.05,   // w[12]: Fator base de relearning
    0.34,   // w[13]: Fator de dificuldade no relearning
    1.26,   // w[14]: Fator de estabilidade no relearning
    0.29,   // w[15]: Fator de retrievability no relearning
    2.61    // w[16]: Bonus para rating "Easy"
  ],
  
  requestRetention: 0.85,
  maximumInterval: 365,
  enableFuzz: true
};

export const FSRS_CONSTANTS = {
  DECAY: -0.5,
  FACTOR: 19 / 81,
  MIN_STABILITY: 0.1,
  MAX_DIFFICULTY: 10,
  MIN_DIFFICULTY: 1
};
```

### 2.2 Arquivo: src/lib/fsrs/states.js

```javascript
export const State = Object.freeze({
  NEW: 'new',
  LEARNING: 'learning',
  REVIEW: 'review',
  RELEARNING: 'relearning'
});

export const Rating = Object.freeze({
  AGAIN: 1,
  HARD: 2,
  GOOD: 3,
  EASY: 4
});

// Labels para UI
export const RatingLabels = {
  1: { text: 'Não lembrei', color: 'red', shortcut: '1' },
  2: { text: 'Difícil', color: 'orange', shortcut: '2' },
  3: { text: 'Bom', color: 'green', shortcut: '3' },
  4: { text: 'Fácil', color: 'blue', shortcut: '4' }
};
```

### 2.3 Arquivo: src/lib/fsrs/fsrs.js (Motor Principal)

```javascript
import { DEFAULT_PARAMS, FSRS_CONSTANTS } from './params.js';
import { State, Rating } from './states.js';

export class FSRS {
  constructor(params = {}) {
    this.w = params.w || DEFAULT_PARAMS.w;
    this.requestRetention = params.requestRetention || DEFAULT_PARAMS.requestRetention;
    this.maximumInterval = params.maximumInterval || DEFAULT_PARAMS.maximumInterval;
    this.enableFuzz = params.enableFuzz ?? DEFAULT_PARAMS.enableFuzz;
  }

  // ═══════════════════════════════════════════════════════════
  // FUNÇÕES MATEMÁTICAS CORE
  // ═══════════════════════════════════════════════════════════

  /**
   * Probabilidade de lembrar após t dias
   */
  retrievability(stability, elapsedDays) {
    if (stability <= 0) return 0;
    const { DECAY, FACTOR } = FSRS_CONSTANTS;
    return Math.pow(1 + FACTOR * elapsedDays / stability, DECAY);
  }

  /**
   * Intervalo para atingir a retenção desejada
   */
  nextInterval(stability) {
    const { DECAY, FACTOR } = FSRS_CONSTANTS;
    const interval = stability / FACTOR * 
      (Math.pow(this.requestRetention, 1 / DECAY) - 1);
    
    const bounded = Math.min(
      Math.max(Math.round(interval), 1), 
      this.maximumInterval
    );
    
    return this.enableFuzz ? this.applyFuzz(bounded) : bounded;
  }

  /**
   * Adiciona ±5% de variação para evitar clustering
   */
  applyFuzz(interval) {
    if (interval < 3) return interval;
    const fuzz = 1 + (Math.random() * 0.1 - 0.05);
    return Math.max(1, Math.round(interval * fuzz));
  }

  // ═══════════════════════════════════════════════════════════
  // CÁLCULOS DE ESTABILIDADE
  // ═══════════════════════════════════════════════════════════

  /**
   * Estabilidade inicial (primeiro contato com o card)
   */
  initStability(rating) {
    return Math.max(this.w[rating - 1], FSRS_CONSTANTS.MIN_STABILITY);
  }

  /**
   * Nova estabilidade após acerto (rating >= 2)
   */
  nextStabilitySuccess(d, s, r, rating) {
    const hardPenalty = rating === Rating.HARD ? this.w[11] : 1;
    const easyBonus = rating === Rating.EASY ? this.w[16] : 1;
    
    const newS = s * (
      1 +
      Math.exp(this.w[8]) *
      (11 - d) *
      Math.pow(s, -this.w[9]) *
      (Math.exp((1 - r) * this.w[10]) - 1) *
      hardPenalty *
      easyBonus
    );
    
    return Math.max(newS, FSRS_CONSTANTS.MIN_STABILITY);
  }

  /**
   * Nova estabilidade após erro (rating = 1)
   */
  nextStabilityFail(d, s, r) {
    const newS = this.w[12] *
      Math.pow(d, -this.w[13]) *
      (Math.pow(s + 1, this.w[14]) - 1) *
      Math.exp((1 - r) * this.w[15]);
    
    return Math.max(
      Math.min(newS, s),
      FSRS_CONSTANTS.MIN_STABILITY
    );
  }

  // ═══════════════════════════════════════════════════════════
  // CÁLCULOS DE DIFICULDADE
  // ═══════════════════════════════════════════════════════════

  initDifficulty(rating) {
    const d = this.w[4] - Math.exp(this.w[5] * (rating - 1)) + 1;
    return this.clampDifficulty(d);
  }

  nextDifficulty(d, rating) {
    const delta = -(this.w[6] * (rating - 3));
    const newD = d + delta;
    const meanReverted = this.w[7] * this.initDifficulty(4) + (1 - this.w[7]) * newD;
    return this.clampDifficulty(meanReverted);
  }

  clampDifficulty(d) {
    return Math.min(Math.max(d, FSRS_CONSTANTS.MIN_DIFFICULTY), FSRS_CONSTANTS.MAX_DIFFICULTY);
  }

  // ═══════════════════════════════════════════════════════════
  // FUNÇÃO PRINCIPAL: PROCESSAR REVISÃO
  // ═══════════════════════════════════════════════════════════

  /**
   * Processa uma revisão e retorna o novo estado completo
   * 
   * @param {Object} card - Estado atual do card
   * @param {number} rating - 1=Again, 2=Hard, 3=Good, 4=Easy
   * @param {Date} now - Momento da revisão
   * @returns {Object} Novo estado do card
   */
  review(card, rating, now = new Date()) {
    const elapsedDays = card.lastReview 
      ? (now - new Date(card.lastReview)) / 86400000 
      : 0;
    
    const r = card.stability > 0 
      ? this.retrievability(card.stability, elapsedDays) 
      : 0;
    
    let state, stability, difficulty, interval;
    const { NEW, LEARNING, REVIEW, RELEARNING } = State;
    const { AGAIN, HARD, GOOD, EASY } = Rating;

    // ─────────────────────────────────────────────────────────
    // CARD NOVO
    // ─────────────────────────────────────────────────────────
    if (card.state === NEW) {
      stability = this.initStability(rating);
      difficulty = this.initDifficulty(rating);
      
      if (rating === AGAIN) {
        state = LEARNING;
        interval = 1; // 1 minuto
      } else if (rating === HARD) {
        state = LEARNING;
        interval = 5;
      } else if (rating === GOOD) {
        state = LEARNING;
        interval = 10;
      } else {
        state = REVIEW;
        interval = this.nextInterval(stability);
      }
    }
    
    // ─────────────────────────────────────────────────────────
    // CARD EM APRENDIZADO
    // ─────────────────────────────────────────────────────────
    else if (card.state === LEARNING || card.state === RELEARNING) {
      difficulty = this.nextDifficulty(card.difficulty, rating);
      
      if (rating === AGAIN) {
        state = card.state;
        stability = this.initStability(rating);
        interval = 1;
      } else if (rating === HARD) {
        state = card.state;
        stability = this.initStability(rating);
        interval = 5;
      } else {
        // GOOD ou EASY graduam para REVIEW
        state = REVIEW;
        stability = this.initStability(rating);
        interval = this.nextInterval(stability);
      }
    }
    
    // ─────────────────────────────────────────────────────────
    // CARD EM REVISÃO
    // ─────────────────────────────────────────────────────────
    else if (card.state === REVIEW) {
      difficulty = this.nextDifficulty(card.difficulty, rating);
      
      if (rating === AGAIN) {
        // Lapso: vai para relearning
        state = RELEARNING;
        stability = this.nextStabilityFail(card.difficulty, card.stability, r);
        interval = 1;
      } else {
        // Sucesso: continua em review
        state = REVIEW;
        stability = this.nextStabilitySuccess(card.difficulty, card.stability, r, rating);
        interval = this.nextInterval(stability);
      }
    }

    // Calcular data de vencimento
    const due = this.calculateDue(now, interval, state);
    
    // Contadores
    const lapses = (rating === AGAIN && card.state === REVIEW) 
      ? card.lapses + 1 
      : card.lapses;
    const reps = state === REVIEW ? card.reps + 1 : card.reps;

    return {
      state,
      stability,
      difficulty,
      due: due.toISOString(),
      lastInterval: interval,
      lastReview: now.toISOString(),
      lastRating: rating,
      reps,
      lapses,
      // Metadados para analytics
      _computed: { elapsedDays, retrievability: r, scheduledDays: interval }
    };
  }

  /**
   * Calcula a data de vencimento
   */
  calculateDue(now, interval, state) {
    const due = new Date(now);
    
    if (state === State.LEARNING || state === State.RELEARNING) {
      due.setMinutes(due.getMinutes() + interval);
    } else {
      due.setDate(due.getDate() + interval);
      due.setHours(4, 0, 0, 0); // 4am para aparecer no dia correto
    }
    
    return due;
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITÁRIOS
  // ═══════════════════════════════════════════════════════════

  /**
   * Prevê intervalos para cada rating possível
   */
  previewRatings(card) {
    const now = new Date();
    const previews = {};
    
    for (const rating of [1, 2, 3, 4]) {
      const result = this.review({ ...card }, rating, now);
      previews[rating] = {
        interval: result.lastInterval,
        state: result.state,
        isMinutes: result.state === State.LEARNING || result.state === State.RELEARNING
      };
    }
    
    return previews;
  }

  /**
   * Formata intervalo para exibição
   */
  formatInterval(interval, isMinutes = false) {
    if (isMinutes) {
      if (interval < 60) return `${interval}m`;
      return `${Math.round(interval / 60)}h`;
    }
    
    if (interval === 1) return '1d';
    if (interval < 30) return `${interval}d`;
    if (interval < 365) return `${(interval / 30).toFixed(1)}mo`;
    return `${(interval / 365).toFixed(1)}y`;
  }

  /**
   * Simula curva de retenção
   */
  simulateRetention(stability, days = 60) {
    return Array.from({ length: days + 1 }, (_, day) => ({
      day,
      retention: this.retrievability(stability, day)
    }));
  }
}

// Singleton para uso global
export const fsrs = new FSRS();
```

---

## 3. CALIBRAÇÃO PERSONALIZADA

### 3.1 Arquivo: src/lib/fsrs/optimizer.js

```javascript
import { FSRS } from './fsrs.js';
import { DEFAULT_PARAMS } from './params.js';

/**
 * Otimiza parâmetros FSRS baseado no histórico do usuário
 */
export class FSRSOptimizer {
  
  /**
   * Calcula taxa de retenção real do usuário
   */
  static calculateActualRetention(reviewLogs) {
    if (reviewLogs.length < 50) return null;
    
    // Considerar apenas cards em estado REVIEW
    const reviewOnly = reviewLogs.filter(log => 
      log.stateBefore === 'review'
    );
    
    if (reviewOnly.length < 30) return null;
    
    const remembered = reviewOnly.filter(log => log.rating >= 2).length;
    return remembered / reviewOnly.length;
  }

  /**
   * Analisa padrões de esquecimento por matéria
   */
  static analyzeBySubject(reviewLogs, cards) {
    const bySubject = {};
    
    for (const log of reviewLogs) {
      const card = cards.find(c => c.id === log.cardId);
      if (!card) continue;
      
      const subjectId = card.subjectId;
      if (!bySubject[subjectId]) {
        bySubject[subjectId] = { total: 0, remembered: 0, avgTime: 0 };
      }
      
      bySubject[subjectId].total++;
      if (log.rating >= 2) bySubject[subjectId].remembered++;
      bySubject[subjectId].avgTime += log.responseTime;
    }
    
    // Calcular médias
    for (const subjectId of Object.keys(bySubject)) {
      const data = bySubject[subjectId];
      data.retention = data.remembered / data.total;
      data.avgTime = data.avgTime / data.total;
    }
    
    return bySubject;
  }

  /**
   * Sugere ajuste de requestRetention baseado no histórico
   */
  static suggestRetention(reviewLogs, currentRetention = 0.85) {
    const actual = this.calculateActualRetention(reviewLogs);
    
    if (actual === null) {
      return {
        suggested: currentRetention,
        reason: 'Dados insuficientes para análise'
      };
    }
    
    // Se retenção real está muito abaixo do desejado
    if (actual < currentRetention - 0.1) {
      return {
        suggested: Math.max(0.80, currentRetention - 0.05),
        reason: `Retenção real (${(actual * 100).toFixed(1)}%) abaixo do desejado. Sugerimos reduzir para gerar mais revisões.`
      };
    }
    
    // Se retenção real está muito acima do desejado
    if (actual > currentRetention + 0.05) {
      return {
        suggested: Math.min(0.95, currentRetention + 0.03),
        reason: `Retenção real (${(actual * 100).toFixed(1)}%) acima do desejado. Podemos aumentar os intervalos.`
      };
    }
    
    return {
      suggested: currentRetention,
      reason: `Retenção real (${(actual * 100).toFixed(1)}%) está adequada.`
    };
  }

  /**
   * Detecta "ease hell" (dificuldade muito alta)
   */
  static detectEaseHell(cards) {
    const reviewCards = cards.filter(c => c.state === 'review');
    if (reviewCards.length < 20) return null;
    
    const avgDifficulty = reviewCards.reduce((sum, c) => sum + c.difficulty, 0) / reviewCards.length;
    const highDifficultyCount = reviewCards.filter(c => c.difficulty > 7).length;
    const percentage = highDifficultyCount / reviewCards.length;
    
    if (percentage > 0.3 || avgDifficulty > 6.5) {
      return {
        detected: true,
        avgDifficulty,
        highDifficultyPercentage: percentage,
        suggestion: 'Muitos cards com dificuldade alta. Considere resetar a dificuldade dos cards problemáticos.'
      };
    }
    
    return { detected: false };
  }
}
```

---

## 4. TESTES E VALIDAÇÃO

### 4.1 Arquivo: src/lib/fsrs/fsrs.test.js

```javascript
import { describe, it, expect } from 'vitest';
import { FSRS } from './fsrs.js';
import { State, Rating } from './states.js';

describe('FSRS Engine', () => {
  const fsrs = new FSRS();

  describe('Retrievability', () => {
    it('deve ser 1.0 no dia 0', () => {
      expect(fsrs.retrievability(10, 0)).toBeCloseTo(1.0, 2);
    });

    it('deve decair com o tempo', () => {
      const r1 = fsrs.retrievability(10, 5);
      const r2 = fsrs.retrievability(10, 10);
      expect(r1).toBeGreaterThan(r2);
    });

    it('estabilidade maior = decaimento mais lento', () => {
      const rLowS = fsrs.retrievability(5, 10);
      const rHighS = fsrs.retrievability(20, 10);
      expect(rHighS).toBeGreaterThan(rLowS);
    });
  });

  describe('Card Novo', () => {
    const newCard = {
      state: State.NEW,
      stability: 0,
      difficulty: 5,
      reps: 0,
      lapses: 0,
      lastReview: null
    };

    it('rating GOOD deve ir para LEARNING', () => {
      const result = fsrs.review(newCard, Rating.GOOD);
      expect(result.state).toBe(State.LEARNING);
      expect(result.stability).toBeGreaterThan(0);
    });

    it('rating EASY deve ir direto para REVIEW', () => {
      const result = fsrs.review(newCard, Rating.EASY);
      expect(result.state).toBe(State.REVIEW);
      expect(result.lastInterval).toBeGreaterThan(1);
    });

    it('rating AGAIN deve ter menor estabilidade', () => {
      const again = fsrs.review(newCard, Rating.AGAIN);
      const good = fsrs.review(newCard, Rating.GOOD);
      expect(again.stability).toBeLessThan(good.stability);
    });
  });

  describe('Card em Revisão', () => {
    const reviewCard = {
      state: State.REVIEW,
      stability: 10,
      difficulty: 5,
      reps: 5,
      lapses: 0,
      lastReview: new Date(Date.now() - 10 * 86400000).toISOString()
    };

    it('rating AGAIN deve ir para RELEARNING', () => {
      const result = fsrs.review(reviewCard, Rating.AGAIN);
      expect(result.state).toBe(State.RELEARNING);
      expect(result.lapses).toBe(1);
    });

    it('rating GOOD deve aumentar estabilidade', () => {
      const result = fsrs.review(reviewCard, Rating.GOOD);
      expect(result.stability).toBeGreaterThan(reviewCard.stability);
    });

    it('rating EASY deve aumentar mais que GOOD', () => {
      const good = fsrs.review(reviewCard, Rating.GOOD);
      const easy = fsrs.review(reviewCard, Rating.EASY);
      expect(easy.stability).toBeGreaterThan(good.stability);
    });
  });

  describe('Preview Ratings', () => {
    it('deve retornar todos os 4 ratings', () => {
      const card = { state: State.REVIEW, stability: 10, difficulty: 5 };
      const previews = fsrs.previewRatings(card);
      
      expect(Object.keys(previews)).toHaveLength(4);
      expect(previews[1].interval).toBeLessThan(previews[4].interval);
    });
  });
});
```

---

## PRÓXIMO DOCUMENTO

**Parte 3: Lógica de Negócio** — Scheduler de sessões, intercalação inteligente, gerador de plano diário, sistema de priorização ROI/hora
