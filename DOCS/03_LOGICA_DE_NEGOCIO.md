# BLUEPRINT: Sistema de Estudos de Elite
## Parte 3: Lógica de Negócio

---

## 1. SCHEDULER ENGINE (Agendador de Revisões)

### 1.1 Arquivo: src/lib/engines/scheduler.js

```javascript
import { db } from '../db.js';
import { fsrs } from '../fsrs/fsrs.js';
import { State } from '../fsrs/states.js';

/**
 * Gerencia a fila de cards para revisão
 */
export class Scheduler {
  
  /**
   * Busca todos os cards que vencem hoje ou antes
   */
  async getDueCards(options = {}) {
    const {
      subjectIds = null,      // Filtrar por matérias
      limit = null,           // Limite de cards
      excludeBuried = true,   // Excluir enterrados
      excludeSuspended = true // Excluir suspensos
    } = options;

    const now = new Date().toISOString();
    
    let query = db.cards.where('due').belowOrEqual(now);
    
    // Aplicar filtros
    const cards = await query.toArray();
    
    let filtered = cards.filter(card => {
      if (excludeBuried && card.buried) return false;
      if (excludeSuspended && card.suspended) return false;
      if (subjectIds && !subjectIds.includes(card.subjectId)) return false;
      return true;
    });

    // Ordenar por prioridade
    filtered = this.sortByPriority(filtered);

    // Aplicar limite
    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }

  /**
   * Busca cards novos para aprender
   */
  async getNewCards(options = {}) {
    const {
      subjectId = null,
      limit = 20,
      respectDailyLimit = true
    } = options;

    // Verificar limite diário já usado
    let remainingNew = limit;
    if (respectDailyLimit) {
      const config = await db.config.get(1);
      const today = new Date().toISOString().split('T')[0];
      const todayStats = await db.dailyStats.get({ date: today });
      
      if (todayStats) {
        remainingNew = Math.max(0, config.preferences.newCardsPerDay - todayStats.cards.newLearned);
      }
    }

    if (remainingNew <= 0) return [];

    // Buscar cards novos
    let query;
    if (subjectId) {
      query = db.cards.where('[subjectId+state]').equals([subjectId, State.NEW]);
    } else {
      query = db.cards.where('state').equals(State.NEW);
    }

    const cards = await query.limit(remainingNew).toArray();
    
    // Ordenar por tópico (para manter contexto)
    return cards.sort((a, b) => {
      if (a.topicId !== b.topicId) return a.topicId - b.topicId;
      return a.id - b.id;
    });
  }

  /**
   * Busca cards em estado de aprendizado (intervalos curtos)
   */
  async getLearningCards() {
    const now = new Date().toISOString();
    
    const cards = await db.cards
      .where('state')
      .anyOf([State.LEARNING, State.RELEARNING])
      .toArray();
    
    return cards.filter(card => card.due <= now);
  }

  /**
   * Ordena cards por prioridade
   * Fatores: urgência, dificuldade, importância da matéria
   */
  sortByPriority(cards) {
    const now = new Date();
    
    return cards.sort((a, b) => {
      // 1. Learning/Relearning primeiro (intervalos curtos são urgentes)
      if (a.state !== b.state) {
        const stateOrder = { learning: 0, relearning: 1, review: 2 };
        return (stateOrder[a.state] || 3) - (stateOrder[b.state] || 3);
      }

      // 2. Cards mais atrasados primeiro
      const aOverdue = (now - new Date(a.due)) / 86400000;
      const bOverdue = (now - new Date(b.due)) / 86400000;
      
      if (Math.abs(aOverdue - bOverdue) > 1) {
        return bOverdue - aOverdue;
      }

      // 3. Cards mais difíceis primeiro (para pegar com mente fresca)
      return b.difficulty - a.difficulty;
    });
  }

  /**
   * Calcula estatísticas da fila de revisão
   */
  async getQueueStats() {
    const now = new Date();
    const today = new Date(now).setHours(23, 59, 59, 999);
    
    const allCards = await db.cards.toArray();
    
    const stats = {
      new: 0,
      learning: 0,
      review: 0,
      relearning: 0,
      dueToday: 0,
      overdue: 0,
      buried: 0,
      suspended: 0
    };

    for (const card of allCards) {
      if (card.buried) { stats.buried++; continue; }
      if (card.suspended) { stats.suspended++; continue; }

      stats[card.state]++;

      if (card.state !== State.NEW) {
        const dueDate = new Date(card.due);
        if (dueDate <= now) {
          stats.overdue++;
        } else if (dueDate <= today) {
          stats.dueToday++;
        }
      }
    }

    return stats;
  }

  /**
   * Estima tempo necessário para limpar a fila
   */
  async estimateStudyTime() {
    const dueCards = await this.getDueCards();
    const learningCards = await this.getLearningCards();
    
    // Tempo médio por tipo de card (em segundos)
    const avgTime = {
      review: 15,
      learning: 30,
      relearning: 25
    };

    let totalSeconds = 0;
    
    for (const card of [...dueCards, ...learningCards]) {
      totalSeconds += avgTime[card.state] || 20;
    }

    return {
      cards: dueCards.length + learningCards.length,
      estimatedMinutes: Math.ceil(totalSeconds / 60),
      breakdown: {
        reviews: dueCards.length,
        learning: learningCards.length
      }
    };
  }
}

export const scheduler = new Scheduler();
```

---

## 2. INTERLEAVER ENGINE (Intercalação Inteligente)

### 2.1 Arquivo: src/lib/engines/interleaver.js

```javascript
import { db } from '../db.js';

/**
 * Implementa intercalação inteligente de matérias
 * Baseado em research de cognitive interleaving
 */
export class Interleaver {
  
  /**
   * Intercala cards de diferentes matérias
   * 
   * Regras:
   * 1. Não repetir mesma matéria em sequência (exceto se só houver uma)
   * 2. Alternar entre matérias "pesadas" e "leves"
   * 3. Respeitar o contexto do tópico quando possível
   */
  interleaveCards(cards, options = {}) {
    const {
      maxConsecutive = 3,      // Máximo de cards da mesma matéria em sequência
      preferContextSwitch = true // Preferir trocar de contexto
    } = options;

    if (cards.length <= 1) return cards;

    // Agrupar por matéria
    const bySubject = this.groupBy(cards, 'subjectId');
    const subjects = Object.keys(bySubject);
    
    if (subjects.length === 1) return cards; // Só uma matéria

    const interleaved = [];
    let lastSubjectId = null;
    let consecutiveCount = 0;
    
    // Round-robin com limite de consecutivos
    while (this.hasCardsRemaining(bySubject)) {
      // Encontrar próxima matéria válida
      let nextSubject = this.selectNextSubject(
        bySubject, 
        lastSubjectId, 
        consecutiveCount >= maxConsecutive
      );
      
      if (!nextSubject) break;
      
      // Pegar próximo card dessa matéria
      const card = bySubject[nextSubject].shift();
      interleaved.push(card);
      
      // Atualizar tracking
      if (nextSubject === lastSubjectId) {
        consecutiveCount++;
      } else {
        consecutiveCount = 1;
        lastSubjectId = nextSubject;
      }
    }

    return interleaved;
  }

  /**
   * Seleciona próxima matéria para intercalação
   */
  selectNextSubject(bySubject, lastSubjectId, forceSwitch) {
    const available = Object.entries(bySubject)
      .filter(([_, cards]) => cards.length > 0)
      .map(([id, _]) => id);

    if (available.length === 0) return null;
    if (available.length === 1) return available[0];

    // Se precisar trocar, excluir a última
    let candidates = available;
    if (forceSwitch && lastSubjectId) {
      candidates = available.filter(id => id !== lastSubjectId);
      if (candidates.length === 0) candidates = available;
    }

    // Preferir matéria diferente da última
    if (lastSubjectId && candidates.includes(lastSubjectId) && candidates.length > 1) {
      const others = candidates.filter(id => id !== lastSubjectId);
      // 80% chance de trocar
      if (Math.random() < 0.8) {
        return others[Math.floor(Math.random() * others.length)];
      }
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /**
   * Cria um ciclo de estudo balanceado
   * 
   * @param {Object} config - Configuração do ciclo
   * @returns {Array} Sequência de blocos de estudo
   */
  createStudyCycle(config) {
    const {
      subjects,           // Array de { id, name, minutes, weight }
      totalMinutes,       // Tempo total disponível
      blockDuration = 25  // Duração de cada bloco (Pomodoro)
    } = config;

    // Calcular proporção de cada matéria baseado no peso
    const totalWeight = subjects.reduce((sum, s) => sum + s.weight, 0);
    
    const blocks = [];
    let remainingMinutes = totalMinutes;
    let cyclePosition = 0;

    // Distribuir blocos proporcionalmente
    for (const subject of subjects) {
      const proportion = subject.weight / totalWeight;
      const subjectMinutes = Math.round(totalMinutes * proportion);
      const numBlocks = Math.max(1, Math.round(subjectMinutes / blockDuration));
      
      for (let i = 0; i < numBlocks && remainingMinutes > 0; i++) {
        const duration = Math.min(blockDuration, remainingMinutes);
        blocks.push({
          subjectId: subject.id,
          subjectName: subject.name,
          duration,
          position: cyclePosition++,
          type: 'study'
        });
        remainingMinutes -= duration;
      }
    }

    // Intercalar os blocos
    return this.shuffleBlocks(blocks);
  }

  /**
   * Embaralha blocos mantendo diversidade
   */
  shuffleBlocks(blocks) {
    if (blocks.length <= 2) return blocks;

    const shuffled = [];
    const bySubject = this.groupBy(blocks, 'subjectId');
    
    while (this.hasCardsRemaining(bySubject)) {
      const subjects = Object.keys(bySubject).filter(id => bySubject[id].length > 0);
      
      // Pegar um bloco de cada matéria em round-robin
      for (const subjectId of subjects) {
        if (bySubject[subjectId].length > 0) {
          shuffled.push(bySubject[subjectId].shift());
        }
      }
    }

    return shuffled;
  }

  // Helpers
  groupBy(array, key) {
    return array.reduce((acc, item) => {
      const k = item[key];
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    }, {});
  }

  hasCardsRemaining(grouped) {
    return Object.values(grouped).some(arr => arr.length > 0);
  }
}

export const interleaver = new Interleaver();
```

---

## 3. SESSION GENERATOR (Gerador de Sessão Diária)

### 3.1 Arquivo: src/lib/engines/sessionGenerator.js

```javascript
import { db } from '../db.js';
import { scheduler } from './scheduler.js';
import { interleaver } from './interleaver.js';

/**
 * Gera o plano de estudo diário otimizado
 */
export class SessionGenerator {
  
  /**
   * Gera uma sessão de estudo completa para hoje
   */
  async generateDailySession() {
    const config = await db.config.get(1);
    const today = new Date();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()];
    
    // Tempo disponível hoje
    const availableMinutes = config.schedule.dailyDistribution[dayOfWeek] * 60;
    
    if (availableMinutes <= 0) {
      return this.createRestDaySession();
    }

    // Buscar dados necessários
    const [dueCards, newCardsAvailable, subjects, queueStats] = await Promise.all([
      scheduler.getDueCards(),
      scheduler.getNewCards({ respectDailyLimit: true }),
      db.subjects.toArray(),
      scheduler.getQueueStats()
    ]);

    // Calcular distribuição de tempo
    const timeAllocation = this.allocateTime(availableMinutes, queueStats, config);
    
    // Gerar blocos da sessão
    const blocks = [];

    // ─────────────────────────────────────────────────────────
    // BLOCO 1: Revisões urgentes (cards atrasados e learning)
    // ─────────────────────────────────────────────────────────
    if (timeAllocation.urgentReviews > 0) {
      const urgentCards = dueCards.filter(c => {
        const overdueDays = (today - new Date(c.due)) / 86400000;
        return overdueDays > 1 || c.state === 'learning' || c.state === 'relearning';
      });

      if (urgentCards.length > 0) {
        blocks.push({
          type: 'urgent_review',
          title: 'Revisões Urgentes',
          description: 'Cards atrasados e em aprendizado',
          durationMinutes: timeAllocation.urgentReviews,
          cards: interleaver.interleaveCards(urgentCards),
          estimatedCards: Math.min(urgentCards.length, Math.floor(timeAllocation.urgentReviews * 2))
        });
      }
    }

    // ─────────────────────────────────────────────────────────
    // BLOCO 2: Conteúdo novo (teoria + questões novas)
    // ─────────────────────────────────────────────────────────
    if (timeAllocation.newContent > 0) {
      const nextLesson = await this.getNextLesson(subjects);
      
      if (nextLesson) {
        blocks.push({
          type: 'new_content',
          title: `Conteúdo Novo: ${nextLesson.subjectName}`,
          description: nextLesson.lessonTitle,
          durationMinutes: timeAllocation.newContent,
          lessonId: nextLesson.lessonId,
          topicId: nextLesson.topicId,
          subjectId: nextLesson.subjectId,
          newCards: newCardsAvailable.filter(c => c.topicId === nextLesson.topicId).slice(0, 15)
        });
      }
    }

    // ─────────────────────────────────────────────────────────
    // BLOCO 3: Revisões regulares (intercaladas)
    // ─────────────────────────────────────────────────────────
    if (timeAllocation.reviews > 0) {
      const regularCards = dueCards.filter(c => c.state === 'review');
      
      if (regularCards.length > 0) {
        blocks.push({
          type: 'review',
          title: 'Revisões do Dia',
          description: 'Manutenção da memória de longo prazo',
          durationMinutes: timeAllocation.reviews,
          cards: interleaver.interleaveCards(regularCards),
          estimatedCards: Math.min(regularCards.length, Math.floor(timeAllocation.reviews * 2))
        });
      }
    }

    // ─────────────────────────────────────────────────────────
    // BLOCO 4: Questões extras (banco de questões)
    // ─────────────────────────────────────────────────────────
    if (timeAllocation.questions > 0) {
      const weakSubject = await this.getWeakestSubject(subjects);
      
      blocks.push({
        type: 'questions',
        title: `Questões: ${weakSubject?.name || 'Mistas'}`,
        description: 'Prática ativa com questões',
        durationMinutes: timeAllocation.questions,
        subjectId: weakSubject?.id,
        targetCount: Math.floor(timeAllocation.questions * 1.5) // ~40s por questão
      });
    }

    // ─────────────────────────────────────────────────────────
    // BLOCO 5: Encoding final (resumo do dia)
    // ─────────────────────────────────────────────────────────
    if (timeAllocation.encoding > 0) {
      blocks.push({
        type: 'encoding',
        title: 'Consolidação Final',
        description: 'Revisão rápida do que foi estudado hoje',
        durationMinutes: timeAllocation.encoding,
        activities: [
          'Revisar anotações do dia',
          'Criar/revisar mapas mentais',
          'Identificar pontos de dúvida'
        ]
      });
    }

    // Criar objeto da sessão
    const session = {
      date: today.toISOString().split('T')[0],
      status: 'planned',
      plannedStartTime: config.schedule.preferredStartTime,
      plan: {
        totalMinutes: availableMinutes,
        blocks
      },
      execution: {
        reviewsDone: 0,
        newCardsDone: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        totalActiveTime: 0
      },
      createdAt: new Date().toISOString()
    };

    // Salvar no banco
    const sessionId = await db.sessions.add(session);
    
    return { ...session, id: sessionId };
  }

  /**
   * Aloca tempo entre diferentes atividades
   */
  allocateTime(totalMinutes, queueStats, config) {
    // Prioridades adaptativas baseadas na situação
    const urgentCount = queueStats.overdue + queueStats.learning + queueStats.relearning;
    const reviewCount = queueStats.review;
    
    // Base allocation (pode ser ajustada)
    let allocation = {
      urgentReviews: 0,
      newContent: 0,
      reviews: 0,
      questions: 0,
      encoding: 0
    };

    let remaining = totalMinutes;

    // 1. Encoding sempre: 10-15min no final
    allocation.encoding = Math.min(15, Math.floor(remaining * 0.08));
    remaining -= allocation.encoding;

    // 2. Revisões urgentes: até 25% do tempo ou necessário
    if (urgentCount > 0) {
      const urgentTime = Math.min(
        Math.ceil(urgentCount / 2), // ~30s por card
        Math.floor(remaining * 0.25)
      );
      allocation.urgentReviews = urgentTime;
      remaining -= urgentTime;
    }

    // 3. Se tem muitas revisões pendentes, priorizar
    if (reviewCount > 50) {
      // Modo "catch up": mais revisões, menos conteúdo novo
      allocation.reviews = Math.floor(remaining * 0.5);
      allocation.newContent = Math.floor(remaining * 0.25);
      allocation.questions = remaining - allocation.reviews - allocation.newContent;
    } else {
      // Modo normal: balanceado
      allocation.newContent = Math.floor(remaining * 0.35);
      allocation.reviews = Math.floor(remaining * 0.35);
      allocation.questions = remaining - allocation.newContent - allocation.reviews;
    }

    return allocation;
  }

  /**
   * Encontra próxima aula a estudar
   */
  async getNextLesson(subjects) {
    // Ordenar matérias por prioridade (peso * inverso do progresso)
    const subjectsWithProgress = await Promise.all(
      subjects.map(async (subject) => {
        const topics = await db.topics.where('subjectId').equals(subject.id).toArray();
        const totalLessons = topics.reduce((sum, t) => sum + t.theory.totalLessons, 0);
        const completedLessons = topics.reduce((sum, t) => sum + t.theory.completedLessons, 0);
        const progress = totalLessons > 0 ? completedLessons / totalLessons : 0;
        
        return {
          ...subject,
          progress,
          priority: subject.weight * (1 - progress) // Maior peso + menor progresso = maior prioridade
        };
      })
    );

    // Ordenar por prioridade
    subjectsWithProgress.sort((a, b) => b.priority - a.priority);

    // Encontrar primeira aula incompleta
    for (const subject of subjectsWithProgress) {
      const incompleteLessons = await db.lessons
        .where('completed')
        .equals(false)
        .filter(l => {
          // Verificar se pertence a um tópico desta matéria
          return true; // Simplificado - em produção, fazer join
        })
        .first();

      if (incompleteLessons) {
        const topic = await db.topics.get(incompleteLessons.topicId);
        return {
          lessonId: incompleteLessons.id,
          lessonTitle: incompleteLessons.title,
          topicId: topic.id,
          topicName: topic.name,
          subjectId: subject.id,
          subjectName: subject.name
        };
      }
    }

    return null;
  }

  /**
   * Encontra matéria mais fraca (para focar questões)
   */
  async getWeakestSubject(subjects) {
    const withRetention = await Promise.all(
      subjects.map(async (subject) => {
        const cards = await db.cards
          .where('subjectId')
          .equals(subject.id)
          .toArray();
        
        const reviewCards = cards.filter(c => c.state === 'review');
        if (reviewCards.length < 10) return { ...subject, retention: 1 };

        const avgRetention = reviewCards.reduce((sum, c) => {
          const elapsed = (Date.now() - new Date(c.lastReview)) / 86400000;
          return sum + Math.pow(0.9, elapsed / (c.stability || 1));
        }, 0) / reviewCards.length;

        return { ...subject, retention: avgRetention };
      })
    );

    // Retornar matéria com menor retenção
    return withRetention.sort((a, b) => a.retention - b.retention)[0];
  }

  /**
   * Cria sessão para dia de descanso
   */
  createRestDaySession() {
    return {
      date: new Date().toISOString().split('T')[0],
      status: 'rest_day',
      plan: {
        totalMinutes: 0,
        blocks: [],
        message: 'Dia de descanso programado. Aproveite para recuperar!'
      }
    };
  }
}

export const sessionGenerator = new SessionGenerator();
```

---

## 4. PRIORITY RANKER (ROI por Hora)

### 4.1 Arquivo: src/lib/engines/priorityRanker.js

```javascript
import { db } from '../db.js';
import { fsrs } from '../fsrs/fsrs.js';

/**
 * Calcula prioridade de estudo baseado em ROI (Return on Investment)
 * ROI = (Impacto na nota) / (Tempo necessário)
 */
export class PriorityRanker {

  /**
   * Rankeia matérias por prioridade de estudo
   */
  async rankSubjects() {
    const subjects = await db.subjects.toArray();
    const config = await db.config.get(1);
    
    const ranked = await Promise.all(
      subjects.map(async (subject) => {
        const score = await this.calculateSubjectROI(subject, config);
        return { ...subject, ...score };
      })
    );

    return ranked.sort((a, b) => b.roi - a.roi);
  }

  /**
   * Calcula ROI de uma matéria
   */
  async calculateSubjectROI(subject, config) {
    // Fatores:
    // 1. Peso no edital (maior peso = mais importante)
    // 2. Proficiência atual (menor = mais espaço para crescer)
    // 3. Dificuldade (mais difícil = mais tempo necessário)
    // 4. Tempo até a prova (menos tempo = mais urgência)

    const weight = subject.weight / 100; // 0-1
    const proficiency = subject.proficiencyLevel / 100; // 0-1
    const growthPotential = 1 - proficiency;

    // Buscar dados de performance
    const cards = await db.cards.where('subjectId').equals(subject.id).toArray();
    const avgDifficulty = cards.length > 0
      ? cards.reduce((sum, c) => sum + c.difficulty, 0) / cards.length / 10
      : 0.5;

    // Tempo até a prova
    const examDate = new Date(config.targetExam.date);
    const today = new Date();
    const daysUntilExam = Math.max(1, (examDate - today) / 86400000);
    const urgency = Math.min(1, 90 / daysUntilExam); // Máxima urgência a 90 dias

    // Fórmula ROI
    // Impacto = peso × potencial de crescimento
    // Custo = dificuldade média (mais difícil = mais tempo)
    const impact = weight * growthPotential * (1 + urgency);
    const cost = 0.3 + (avgDifficulty * 0.7); // Normalizado 0.3-1.0
    const roi = impact / cost;

    return {
      roi: Math.round(roi * 100) / 100,
      impact: Math.round(impact * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      growthPotential: Math.round(growthPotential * 100),
      urgency: Math.round(urgency * 100),
      recommendation: this.getRecommendation(roi, growthPotential, urgency)
    };
  }

  /**
   * Gera recomendação textual
   */
  getRecommendation(roi, growth, urgency) {
    if (roi > 1.5 && urgency > 0.7) {
      return 'PRIORIDADE MÁXIMA: Alto impacto, pouco tempo';
    }
    if (roi > 1.2) {
      return 'Alta prioridade: Bom retorno sobre investimento';
    }
    if (growth < 0.2) {
      return 'Manutenção: Já domina bem, manter revisões';
    }
    if (roi < 0.5) {
      return 'Baixa prioridade: Foque em outras matérias primeiro';
    }
    return 'Prioridade normal: Estudar conforme o ciclo';
  }

  /**
   * Rankeia tópicos dentro de uma matéria
   */
  async rankTopics(subjectId) {
    const topics = await db.topics.where('subjectId').equals(subjectId).toArray();
    
    const ranked = await Promise.all(
      topics.map(async (topic) => {
        const cards = await db.cards.where('topicId').equals(topic.id).toArray();
        
        // Calcular métricas
        const totalCards = cards.length;
        const matureCards = cards.filter(c => c.stability > 21).length;
        const retention = totalCards > 0 ? matureCards / totalCards : 0;
        
        // Score baseado em: importância × (1 - domínio)
        const score = topic.importance * (1 - retention);
        
        return {
          ...topic,
          score: Math.round(score * 100) / 100,
          retention: Math.round(retention * 100),
          matureCards,
          totalCards
        };
      })
    );

    return ranked.sort((a, b) => b.score - a.score);
  }

  /**
   * Identifica gaps críticos de conhecimento
   */
  async identifyGaps() {
    const subjects = await this.rankSubjects();
    const gaps = [];

    for (const subject of subjects) {
      if (subject.growthPotential > 50) {
        const weakTopics = await this.rankTopics(subject.id);
        const criticalTopics = weakTopics.filter(t => t.retention < 60 && t.importance >= 4);
        
        if (criticalTopics.length > 0) {
          gaps.push({
            subject: subject.name,
            subjectId: subject.id,
            severity: subject.roi > 1 ? 'high' : 'medium',
            topics: criticalTopics.slice(0, 3).map(t => ({
              name: t.name,
              retention: t.retention,
              importance: t.importance
            }))
          });
        }
      }
    }

    return gaps.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
}

export const priorityRanker = new PriorityRanker();
```

---

## 5. ANALYTICS ENGINE (Análise e Projeções)

### 5.1 Arquivo: src/lib/engines/analytics.js

```javascript
import { db } from '../db.js';
import { fsrs } from '../fsrs/fsrs.js';

/**
 * Motor de análise e projeções
 */
export class Analytics {

  /**
   * Calcula estatísticas do período
   */
  async getPeriodStats(startDate, endDate) {
    const stats = await db.dailyStats
      .where('date')
      .between(startDate, endDate)
      .toArray();

    if (stats.length === 0) {
      return null;
    }

    return {
      days: stats.length,
      totalTime: stats.reduce((sum, s) => sum + s.time.actual, 0),
      totalCards: stats.reduce((sum, s) => sum + s.cards.reviewed, 0),
      totalNew: stats.reduce((sum, s) => sum + s.cards.newLearned, 0),
      avgRetention: stats.reduce((sum, s) => sum + s.performance.correctRate, 0) / stats.length,
      avgTimePerDay: stats.reduce((sum, s) => sum + s.time.actual, 0) / stats.length,
      streakDays: this.calculateStreak(stats),
      trend: this.calculateTrend(stats)
    };
  }

  /**
   * Calcula streak de dias consecutivos
   */
  calculateStreak(stats) {
    // Ordenar por data decrescente
    const sorted = [...stats].sort((a, b) => b.date.localeCompare(a.date));
    
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let expectedDate = today;

    for (const stat of sorted) {
      if (stat.date === expectedDate && stat.time.actual > 0) {
        streak++;
        // Calcular dia anterior
        const d = new Date(expectedDate);
        d.setDate(d.getDate() - 1);
        expectedDate = d.toISOString().split('T')[0];
      } else if (stat.date < expectedDate) {
        break;
      }
    }

    return streak;
  }

  /**
   * Calcula tendência de performance
   */
  calculateTrend(stats) {
    if (stats.length < 7) return 'insufficient_data';

    const sorted = [...stats].sort((a, b) => a.date.localeCompare(b.date));
    const recent = sorted.slice(-7);
    const previous = sorted.slice(-14, -7);

    if (previous.length < 7) return 'insufficient_data';

    const recentAvg = recent.reduce((sum, s) => sum + s.performance.correctRate, 0) / 7;
    const previousAvg = previous.reduce((sum, s) => sum + s.performance.correctRate, 0) / 7;

    const change = recentAvg - previousAvg;

    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'declining';
    return 'stable';
  }

  /**
   * Projeta probabilidade de aprovação
   */
  async projectPassProbability() {
    const config = await db.config.get(1);
    const subjects = await db.subjects.toArray();
    
    // Para cada matéria, calcular nota esperada
    const projectedScores = await Promise.all(
      subjects.map(async (subject) => {
        const cards = await db.cards
          .where('subjectId')
          .equals(subject.id)
          .toArray();

        // Calcular retenção média ponderada
        const matureCards = cards.filter(c => c.state === 'review');
        if (matureCards.length === 0) {
          return { subject, projectedScore: 0.5, confidence: 'low' };
        }

        // Simular dia da prova
        const examDate = new Date(config.targetExam.date);
        let totalRetention = 0;

        for (const card of matureCards) {
          const elapsedAtExam = (examDate - new Date(card.lastReview)) / 86400000;
          totalRetention += fsrs.retrievability(card.stability, elapsedAtExam);
        }

        const avgRetention = totalRetention / matureCards.length;
        
        // Converter retenção em score esperado (com ruído de prova)
        // Uma pessoa que lembra 85% acerta ~80% das questões (fatores externos)
        const examFactor = 0.95; // 5% de perda por stress/interpretação
        const projectedScore = avgRetention * examFactor;

        return {
          subject,
          projectedScore,
          coverage: matureCards.length / (cards.length || 1),
          confidence: matureCards.length > 30 ? 'high' : matureCards.length > 10 ? 'medium' : 'low'
        };
      })
    );

    // Calcular nota final ponderada
    let weightedScore = 0;
    let totalWeight = 0;

    for (const proj of projectedScores) {
      weightedScore += proj.projectedScore * proj.subject.weight;
      totalWeight += proj.subject.weight;
    }

    const finalScore = weightedScore / totalWeight;
    
    // Estimar probabilidade de passar (modelo simplificado)
    // Assumindo nota de corte típica de 60-70%
    const cutoff = 0.65;
    const margin = finalScore - cutoff;
    
    let passProbability;
    if (margin > 0.15) passProbability = 0.90;
    else if (margin > 0.10) passProbability = 0.80;
    else if (margin > 0.05) passProbability = 0.65;
    else if (margin > 0) passProbability = 0.50;
    else if (margin > -0.05) passProbability = 0.35;
    else if (margin > -0.10) passProbability = 0.20;
    else passProbability = 0.10;

    return {
      projectedScore: Math.round(finalScore * 100),
      passProbability: Math.round(passProbability * 100),
      bySubject: projectedScores.map(p => ({
        name: p.subject.name,
        score: Math.round(p.projectedScore * 100),
        coverage: Math.round(p.coverage * 100),
        confidence: p.confidence
      })),
      daysUntilExam: Math.ceil((new Date(config.targetExam.date) - new Date()) / 86400000),
      recommendation: this.getProjectionRecommendation(finalScore, passProbability)
    };
  }

  getProjectionRecommendation(score, prob) {
    if (prob >= 0.80) {
      return 'Excelente! Mantenha a consistência e foque em manutenção.';
    }
    if (prob >= 0.60) {
      return 'Bom progresso! Intensifique nas matérias mais fracas.';
    }
    if (prob >= 0.40) {
      return 'Atenção: Precisa aumentar ritmo ou focar melhor.';
    }
    return 'Alerta: Reavalie estratégia e considere aumentar horas de estudo.';
  }
}

export const analytics = new Analytics();
```

---

## PRÓXIMO DOCUMENTO

**Parte 4: Componentes e Estado (Svelte)** — Stores, actions, componentes reutilizáveis, gerenciamento de estado reativo
