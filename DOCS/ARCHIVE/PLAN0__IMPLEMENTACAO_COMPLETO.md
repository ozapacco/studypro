# PLANO DE IMPLEMENTAÇÃO — Sistemão 2.0

## Tutor Ativo + Domínio do Edital + Mapas PlantUML + Fluxo Fechado

---

## RESUMO EXECUTIVO

| Feature              | Status Atual  | Complexidade | Impacto |
| -------------------- | ------------- | ------------ | ------- |
| 1. Tutor Ativo       | ✅ Ativo     | 🔴 Alta      | 🔴🔴🔴  |
| 2. Domínio do Edital | ✅ Completo  | 🟡 Média     | 🔴🔴    |
| 3. Mapas PlantUML    | ✅ Completo+ | 🟡 Média     | 🔴🔴    |
| 4. Fluxo Fechado     | 🟡 Parcial   | 🟡 Média     | 🔴🔴🔴  |
| 5. Forte vs Fraco    | 🟡 Parcial   | 🟡 Média     | 🔴🔴    |

**Fases:** 5 fases sequenciais. A Fase 1 é pré-requisito para todas as outras.
**Tempo estimado:** 3-4 semanas (desenvolvimento paralelo de Fases 2-5).

---

## FASE 1 — Tutor Ativo (Motor de Decisão)

### O que é

O "cérebro" do sistema. Decide **O QUE** o aluno vai estudar, **QUANDO** e **POR QUÊ**, de forma mandatória (ativo), não apenas sugestiva.

### O que muda no código

#### 1.1. NOVO ARQUIVO: `src/lib/engines/tutorEngine.js`

```javascript
import { db } from "../db.js";
import { scheduler } from "./scheduler.js";
import { sessionGenerator } from "./sessionGenerator.js";
import { priorityRanker } from "./priorityRanker.js";

export const TUTOR_MODE = {
  PASSIVE: "passive", // Sugere apenas
  ACTIVE: "active", // Obriga (recomenda com peso mandatório)
  STRICT: "strict", // Bloqueia outras matérias até completar
};

export const PROFICIENCY_THRESHOLD = {
  STRONG: 0.85, // >85% retenção → domínio forte
  WEAK: 0.6, // <60% retenção → domínio fraco
  CRITICAL: 0.4, // <40% → urgência máxima
};

export class TutorEngine {
  /**
   * Decide a próxima missão para o aluno.
   * Retorna { topic, reason, mandatory, estimatedMinutes, mode }
   */
  async decideNextMission() {
    const config = await db.config.get(1);
    const mode = config?.tutor?.mode || TUTOR_MODE.ACTIVE;
    const today = new Date();

    const [subjects, dueCards, queueStats] = await Promise.all([
      db.subjects.toArray(),
      scheduler.getDueCards(),
      scheduler.getQueueStats(),
    ]);

    // 1) Urgência absoluta: cards learning/relearning atrasados
    const urgentCards = dueCards.filter((c) => {
      const overdue = (today.getTime() - new Date(c.due).getTime()) / 86400000;
      return overdue > 1 || c.state === "learning" || c.state === "relearning";
    });

    if (urgentCards.length > 0) {
      const urgentTopic = await db.topics.get(urgentCards[0].topicId);
      const urgentSubject = await db.subjects.get(urgentTopic?.subjectId);
      return {
        type: "urgent",
        topic: urgentTopic,
        subject: urgentSubject,
        reason: `Você tem ${urgentCards.length} card(s) urgente(s) em ${urgentTopic?.name}`,
        mandatory: true,
        blockType: "urgent_review",
        cardIds: urgentCards.slice(0, 20).map((c) => c.id),
        estimatedMinutes: Math.min(urgentCards.length * 2, 25),
        mode,
      };
    }

    // 2) Calcular domínio real por matéria
    const subjectMastery = await this.calculateSubjectMastery(subjects);
    const strongSubjects = subjectMastery.filter(
      (s) => s.retention >= PROFICIENCY_THRESHOLD.STRONG,
    );
    const weakSubjects = subjectMastery.filter(
      (s) => s.retention < PROFICIENCY_THRESHOLD.STRONG,
    );

    // 3) Decidir foco principal
    let focus;
    if (mode === TUTOR_MODE.STRICT) {
      // Modo estrito: continua na mesma matéria até atingir threshold
      const strictFocus = await this.getStrictFocus(weakSubjects);
      if (strictFocus) focus = strictFocus;
    }

    if (!focus) {
      // ROI-based: maior retorno por tempo investido
      focus = await this.getROIFocus(subjectMastery, config);
    }

    // 4) Montar missão completa
    const topicCards = await db.cards
      .where("topicId")
      .equals(focus.topicId)
      .toArray();
    const dueForTopic = dueCards.filter((c) => c.topicId === focus.topicId);
    const newForTopic = topicCards
      .filter((c) => c.state === "new")
      .slice(0, 10);

    return {
      type: focus.actionType,
      topic: focus.topic,
      subject: focus.subject,
      reason: focus.reason,
      mandatory: mode !== TUTOR_MODE.PASSIVE,
      blockType: this.actionToBlockType(focus.actionType),
      cardIds: [
        ...dueForTopic.map((c) => c.id),
        ...newForTopic.map((c) => c.id),
      ],
      estimatedMinutes: this.estimateTime(
        focus.topic,
        dueForTopic,
        newForTopic,
      ),
      mode,
      mastery: focus.retention,
      masteryLevel: this.getMasteryLabel(focus.retention),
    };
  }

  async calculateSubjectMastery(subjects) {
    return Promise.all(
      subjects.map(async (subject) => {
        const cards = await db.cards
          .where("subjectId")
          .equals(subject.id)
          .toArray();
        const reviewCards = cards.filter(
          (c) => c.state === "review" && c.lastReview,
        );
        const totalCards = cards.length;
        const nonNewCards = cards.filter((c) => c.state !== "new").length;

        // Retenção real: % de cards com stability > 21 (maduros)
        const matureCards = reviewCards.filter((c) => (c.stability || 0) > 21);
        const retention =
          reviewCards.length > 0 ? matureCards.length / reviewCards.length : 0;

        // Acerto real: ratio de correct vs total em review
        const totalCorrect = reviewCards.reduce(
          (s, c) => s + (c.stats?.correctCount || 0),
          0,
        );
        const totalReviewed = reviewCards.reduce(
          (s, c) => s + (c.stats?.totalReviews || 0),
          0,
        );
        const accuracy = totalReviewed > 0 ? totalCorrect / totalReviewed : 0;

        // Cobertura do edital: % do conteúdo já visto (não-new)
        const coverage = totalCards > 0 ? nonNewCards / totalCards : 0;

        // Domínio composto (0-100)
        const domainScore = Math.round(
          (retention * 0.4 + accuracy * 0.4 + coverage * 0.2) * 100,
        );

        return {
          id: subject.id,
          name: subject.name,
          weight: subject.weight || 1,
          retention: Math.round(retention * 100),
          accuracy: Math.round(accuracy * 100),
          coverage: Math.round(coverage * 100),
          domainScore,
          totalCards,
          matureCards: matureCards.length,
          weak: retention < PROFICIENCY_THRESHOLD.STRONG,
          critical: retention < PROFICIENCY_THRESHOLD.CRITICAL,
        };
      }),
    );
  }

  async getStrictFocus(weakSubjects) {
    if (weakSubjects.length === 0) return null;
    const weakest = weakSubjects.sort((a, b) => a.retention - b.retention)[0];
    const subject = await db.subjects.get(weakest.id);
    const topics = await db.topics
      .where("subjectId")
      .equals(subject.id)
      .toArray();
    const topic = topics.sort(
      (a, b) => (b.importance || 1) - (a.importance || 1),
    )[0];

    return {
      topic,
      subject,
      retention: weakest.retention,
      reason: `Modo estrito: você está em ${weakest.retention}% de domínio em ${subject.name}. Foque aqui até 85%+.`,
      actionType: weakest.retention < 40 ? "urgent" : "review",
    };
  }

  async getROIFocus(subjectMastery, config) {
    const examDate = new Date(
      config?.targetExam?.date || new Date(Date.now() + 180 * 86400000),
    );
    const daysLeft = Math.max(1, (examDate.getTime() - Date.now()) / 86400000);
    const urgency = Math.min(1, 90 / daysLeft);

    // ROI = (peso_edital × potencial_crescimento × urgência) / tempo_estimado
    const withROI = subjectMastery
      .filter((s) => s.totalCards > 0)
      .map((s) => {
        const growthPotential = 1 - s.retention / 100;
        const roi =
          (s.weight * growthPotential * (1 + urgency)) /
          Math.max(1, s.totalCards / 20);
        return { ...s, roi };
      })
      .sort((a, b) => b.roi - a.roi);

    const best = withROI[0];
    if (!best) return null;

    const subject = await db.subjects.get(best.id);
    const topics = await db.topics
      .where("subjectId")
      .equals(subject.id)
      .toArray();
    const topic = topics.sort(
      (a, b) => (b.importance || 1) - (a.importance || 1),
    )[0];

    return {
      topic,
      subject,
      retention: best.retention,
      reason: this.buildReason(best, urgency, daysLeft),
      actionType: best.retention < 60 ? "review" : "new",
    };
  }

  buildReason(subject, urgency, daysLeft) {
    if (subject.retention < 40)
      return `⚠️ CRÍTICO: ${subject.name} está em apenas ${subject.retention}% de domínio. Urgência máxima.`;
    if (subject.retention < 60)
      return `📚 ${subject.name} precisa de atenção — ${subject.retention}% de domínio atual.`;
    if (subject.weight >= 0.3 && urgency > 0.5)
      return `📈 ${subject.name} tem peso alto no concurso e urgency. ROI ideal agora.`;
    return `🎯 ${subject.name} — domínio em ${subject.retention}%. Próximo passo ideal.`;
  }

  actionToBlockType(actionType) {
    const map = {
      urgent: "urgent_review",
      review: "review",
      new: "new_content",
    };
    return map[actionType] || "review";
  }

  estimateTime(topic, dueCards, newCards) {
    const urgentTime =
      dueCards.filter(
        (c) =>
          c.state === "learning" ||
          c.state === "relearning" ||
          (new Date(c.due).getTime() - Date.now()) / 86400000 < -1,
      ).length * 2;
    const reviewTime =
      dueCards.filter((c) => c.state === "review").length * 1.5;
    const newTime = newCards.length * 3;
    return Math.min(60, urgentTime + reviewTime + newTime);
  }

  getMasteryLabel(retention) {
    if (retention >= 85) return "forte";
    if (retention >= 60) return "médio";
    if (retention >= 40) return "fraco";
    return "crítico";
  }

  async recalculateAfterSession(sessionResult) {
    // Após cada sessão, recalcula e atualiza o estado do tutor
    const next = await this.decideNextMission();
    await db.config.update(1, {
      tutor: {
        lastMission: next,
        lastRecalcAt: new Date().toISOString(),
      },
    });
    return next;
  }
}

export const tutorEngine = new TutorEngine();
```

#### 1.2. ALTERAR: `db.js` — adicionar schema do tutor

```javascript
// Na função initializeDatabase(), adicionar dentro do objeto config:
tutor: {
  mode: 'active',  // 'passive' | 'active' | 'strict'
  strictSubjectId: null,
  lastMission: null,
  lastRecalcAt: null,
}
```

E no version(3) → version(4) para adicionar o campo `mindMapPuml` em topics:

```javascript
db.version(4).stores({
  // ... tudo do version 3 ...
  topics: "++id, subjectId, name, &[subjectId+order], mindMapPuml",
  notes: "++id, topicId, type, createdAt",
});
```

E adicionar ao `topics` schema:

```javascript
topics: "++id, subjectId, name, importance, difficulty, &[subjectId+order], mindMapPuml";
```

#### 1.3. ALTERAR: `src/lib/stores/config.js`

```javascript
// Adicionar campo tutor ao store reativo
tutor: {
  mode: 'active',
  lastMission: null,
  lastRecalcAt: null,
}
```

Adicionar métodos:

```javascript
setTutorMode(mode) {
  update(c => ({ ...c, tutor: { ...c.tutor, mode } }));
  db.config.update(1, { 'tutor.mode': mode });
},

getTutorMode() {
  let mode = 'active';
  subscribe(c => { mode = c?.tutor?.mode || 'active'; })();
  return mode;
}
```

#### 1.4. NOVO COMPONENTE: `src/lib/components/tutor/TutorMission.svelte`

Componente que exibe a missão ativa do tutor (topo do dashboard):

```svelte
<script>
  import { tutorEngine } from '$lib/engines/tutorEngine.js';
  import { onMount } from 'svelte';

  export let compact = false;  // compact=true no header, false no card do dashboard

  let mission = null;
  let loading = true;
  let refreshing = false;

  onMount(async () => {
    await loadMission();
  });

  async function loadMission() {
    loading = true;
    mission = await tutorEngine.decideNextMission();
    loading = false;
  }

  async function refreshMission() {
    refreshing = true;
    mission = await tutorEngine.recalculateAfterSession({});
    refreshing = false;
  }

  const MASTERY_COLORS = {
    crítico: '#ef4444',
    fraco: '#f97316',
    médio: '#eab308',
    forte: '#22c55e',
  };
</script>

{#if loading}
  <div class="tutor-loading">
    <span class="spinner" />
    <span>Tutor analisando...</span>
  </div>
{:else if mission}
  <div class="tutor-mission" class:compact style="--mc: {mission.subject?.color || '#6366f1'}">
    <div class="mission-header">
      <span class="tutor-badge" class:mandatory={mission.mandatory}>
        {mission.mandatory ? '🎯 TUTOR' : '💡 SUGESTÃO'}
      </span>
      <span class="mastery-badge" style="background: {MASTERY_COLORS[mission.masteryLevel]}">
        {mission.masteryLevel?.toUpperCase()} {mission.mastery?.retention || mission.mastery}%
      </span>
    </div>

    <h3 class="mission-topic">{mission.topic?.name}</h3>
    <p class="mission-subject">{mission.subject?.name}</p>

    {#if !compact}
      <p class="mission-reason">{mission.reason}</p>
      <div class="mission-meta">
        <span>⏱️ ~{mission.estimatedMinutes}min</span>
        <span>📋 {mission.cardIds?.length || 0} cards</span>
        <span>Modo: {mission.mode}</span>
      </div>
    {/if}

    <div class="mission-actions">
      <a href="/study?topic={mission.topic?.id}" class="btn-start-mission">
        ▶ Iniciar Missão
      </a>
      <button class="btn-refresh" on:click={refreshMission} disabled={refreshing}>
        {refreshing ? '🔄' : '🔁'} Atualizar
      </button>
    </div>
  </div>
{/if}

<style>
  .tutor-mission {
    background: linear-gradient(135deg, var(--mc), color-mix(in srgb, var(--mc) 70%, black));
    border-radius: 1rem;
    padding: 1.25rem;
    color: white;
  }
  .tutor-mission.compact {
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    display: flex; align-items: center; gap: 12px;
  }
  .mission-header { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
  .tutor-badge {
    font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
    padding: 3px 8px; border-radius: 999px; background: rgba(255,255,255,0.2);
    letter-spacing: 0.05em;
  }
  .tutor-badge.mandatory { background: rgba(255,255,255,0.35); }
  .mastery-badge {
    font-size: 0.65rem; font-weight: 700; padding: 3px 8px;
    border-radius: 999px; color: white;
  }
  .mission-topic { font-size: 1.1rem; font-weight: 800; margin-bottom: 2px; }
  .compact .mission-topic { font-size: 0.85rem; font-weight: 700; }
  .mission-subject { font-size: 0.8rem; opacity: 0.85; margin-bottom: 8px; }
  .compact .mission-subject { display: none; }
  .mission-reason { font-size: 0.85rem; margin-bottom: 10px; line-height: 1.4; }
  .mission-meta { display: flex; gap: 12px; font-size: 0.75rem; margin-bottom: 12px; }
  .mission-actions { display: flex; gap: 8px; }
  .btn-start-mission {
    flex: 1; padding: 0.6rem; background: white; color: var(--mc);
    border: none; border-radius: 0.5rem; font-weight: 700; font-size: 0.85rem;
    text-align: center; text-decoration: none;
    transition: transform 0.15s;
  }
  .btn-start-mission:hover { transform: translateY(-1px); }
  .btn-refresh {
    padding: 0.6rem 0.8rem; background: rgba(255,255,255,0.2);
    color: white; border: 1px solid rgba(255,255,255,0.3);
    border-radius: 0.5rem; cursor: pointer; font-size: 0.75rem;
  }
  .tutor-loading { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 0.85rem; }
  .spinner { width: 16px; height: 16px; border: 2px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.6s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
```

#### 1.5. ALTERAR: Dashboard (`src/routes/+page.svelte`)

- Importar e renderizar `TutorMission` no topo do dashboard
- Adicionar um toggle no header: `Modo Tutor: [Passivo | Ativo | Estrito]`
- Ao clicar em "Iniciar Missão", redirecionar para `/study?topic={id}`

---

## FASE 2 — Domínio do Edital (Painel de Cobertura)

### O que é

Um painel visual que mostra **% de domínio real** de cada matéria do edital, baseado em acerto, retenção e cobertura.

### O que muda no código

#### 2.1. NOVO COMPONENTE: `src/lib/components/edital/EditalMasteryPanel.svelte`

```
Painel completo do edital com:
- Barra de domínio por matéria (cor por nível: verde/amarelo/vermelho)
- % de acerto, % de retenção, % de cobertura
- Score composto (domínio geral do edital)
- Filtro: mostrar só "fracas" vs "todas"
- Click na matéria → abre drilldown
```

Comportamento:

- Usa `tutorEngine.calculateSubjectMastery()` para pegar dados
- Ordena por domínio (menor primeiro = mais urgente)
- Mostra badge "⚠️ CRÍTICO" se retention < 40%
- Click expande para ver topics internos

#### 2.2. NOVO COMPONENTE: `src/lib/components/edital/SubjectDrilldown.svelte`

Modal/expansão que mostra:

- Gráfico de linha temporal (últimos 30 dias de domínio)
- Topics da matéria com barras individuais
- Questões respondidas vs acerto
- Bizus e erros recentes
- Botão "Estudar esta matéria"

#### 2.3. NOVA ROTA: `src/routes/edital/+page.svelte`

Página dedicada ao painel do edital:

```
┌─────────────────────────────────────────────┐
│  DOMÍNIO DO EDITAL        Score: 67%        │
│  ████████████████░░░░░░░░  67/100          │
├─────────────────────────────────────────────┤
│  📕 Direito Penal         72%  ████████░░  │
│     ├─ Crimes contra Pessoa  85%           │
│     └─ Crimes contra Patri.   60% ⚠️        │
│                                             │
│  📗 Direito Administrativo  45%  █████░░░░  │
│     ├─ Agentes Públicos      38% 🚨        │
│     └─ Licitações             52%          │
└─────────────────────────────────────────────┘
```

#### 2.4. ALTERAR: `src/lib/engines/analytics.js`

Adicionar função `getEditalCoverage`:

```javascript
async getEditalCoverage() {
  const subjects = await db.subjects.toArray();
  const mastery = await tutorEngine.calculateSubjectMastery(subjects);

  const totalWeight = subjects.reduce((s, sub) => s + (sub.weight || 0), 0);
  const weightedScore = mastery.reduce((sum, sub) => {
    return sum + (sub.domainScore * (sub.weight || 0) / 100);
  }, 0);

  return {
    overall: Math.round(weightedScore),
    subjects: mastery,
    examDate: (await db.config.get(1))?.targetExam?.date,
    daysLeft: this.daysUntilExam(),
  };
}
```

#### 2.5. ALTERAR: Dashboard (`src/routes/+page.svelte`)

Adicionar widget compacto no dashboard:

```
┌────────────────────────┐
│ 📊 Domínio Edital      │
│ ████████░░  67%        │
│ ↓ 5 matérias críticas  │
└────────────────────────┘
```

- Ao clicar, abre `EditalMasteryPanel` ou navega para `/edital`

---

## FASE 3 — Mapas Mentais PlantUML

### O que é

Cada tópico pode ter um mapa mental em PlantUML (mindmap syntax) que aparece no PreVoo como contexto visual antes de estudar.

### O que muda no código

#### 3.1. ALTERAR: Schema `db.js` — adicionar `mindMapPuml` em topics

```javascript
// No version(4):
topics: "++id, subjectId, name, importance, difficulty, &[subjectId+order], mindMapPuml";

// Adicionar migration para existing databases
db.version(4)
  .stores({
    /* ... */
  })
  .upgrade((tx) => {
    return tx.topics.toCollection().modify((topic) => {
      if (topic.mindMapPuml === undefined) {
        topic.mindMapPuml = null;
      }
    });
  });
```

#### 3.2. NOVO COMPONENTE: `src/lib/components/mindmaps/PlantUMLRenderer.svelte`

Usa a lib `html2png` + `plantuml-encoder` para renderizar PlantUML no browser:

```svelte
<script>
  export let puml = '';
  export let collapsed = true;

  let rendered = false;
  let imgUrl = '';

  async function render() {
    // Opção 1: API pública do PlantUML (sem servidor)
    // Usa plantuml-encoder para gerar URL PNG
    const encoded = window.btoa(puml).replace(/\+/g, '-').replace(/\//g, '_');
    imgUrl = `http://www.plantuml.com/plantuml/png/~1${encoded}`;
    rendered = true;
  }

  $: if (puml && collapsed === false) render();
</script>

{#if collapsed}
  <div class="map-collapsed" on:click={() => collapsed = false}>
    🧠 Ver mapa mental
  </div>
{:else if imgUrl}
  <div class="map-container">
    <img src={imgUrl} alt="Mapa mental do tópico" />
    <button on:click={() => collapsed = true}>✕ Fechar</button>
  </div>
{:else}
  <div class="map-loading">Gerando mapa...</div>
{/if}
```

> **Nota de segurança:** Para ambiente offline, usar `plantuml-encoder` + `@anthropic-ai/plantuml-server` local ou `kroki.io` API (tem tier free).

#### 3.3. ALTERAR: `PreVoo.svelte` — integrar mapa mental

```svelte
<script>
// ... código existente ...
import PlantUMLRenderer from '$lib/components/mindmaps/PlantUMLRenderer.svelte';

export let topic;

// Carregar mapa mental do tópico
let mindMapPuml = null;
let showMindMap = false;

onMount(async () => {
  // ... código existente de notas ...

  // Carregar mapa mental
  const topicData = await db.topics.get(topic.topicId);
  mindMapPuml = topicData?.mindMapPuml || null;
});
</script>

<!-- NOVO: Mapa mental antes do ritual -->
{#if mindMapPuml}
  <div class="mindmap-section">
    <button class="mindmap-toggle" on:click={() => showMindMap = !showMindMap}>
      🧠 Mapa Mental {showMindMap ? '▲' : '▼'}
    </button>
    {#if showMindMap}
      <PlantUMLRenderer puml={mindMapPuml} collapsed={false} />
    {/if}
  </div>
{/if}
```

#### 3.4. NOVO COMPONENTE: `src/lib/components/topics/TopicEditor.svelte`

Editor para criar/editar mapas PlantUML em cada tópico:

- Textarea com template PlantUML pré-preenchido
- Preview em tempo real (live render)
- Templates prontos por tipo de matéria (Direito, Contabilidade, etc.)
- Botão "Gerar template automático" baseado nos subtópicos existentes

Templates:

```
@startmindmap
* {topicName}
{#each subtopics as st}
** {st.name}
{/each}
@endmindmap
```

#### 3.5. ALTERAR: `src/routes/topics/+page.svelte` (ou criar)

Adicionar botão "🧠 Editar Mapa Mental" em cada tópico que abre o editor.

---

## FASE 4 — Fluxo Fechado (Loop Completo)

### O que é

Garantir que o fluxo **Senta → Tutor diz → PreVoo → Cards → Resultado → Tutor recalcula** funcione como um loop contínuo e automático.

### O que muda no código

#### 4.1. ALTERAR: `src/routes/study/+page.svelte`

Modificar para:

1. Ler `?topic=X` da URL → usa missão do tutor
2. Carregar mapa mental do topic
3. Ao terminar sessão → chamar `tutorEngine.recalculateAfterSession()`
4. Mostrar resumo pós-sessão com nova missão calculada
5. Botão "Próxima Missão" → loop contínuo

```svelte
<script>
// ... código existente ...
import { tutorEngine } from '$lib/engines/tutorEngine.js';
import PlantUMLRenderer from '$lib/components/mindmaps/PlantUMLRenderer.svelte';
import { page } from '$app/stores';
import { goto } from '$app/navigation';

let currentMission = null;
let sessionComplete = false;
let nextMission = null;
let mindMapPuml = null;

// Na inicialização:
onMount(async () => {
  const topicId = $page.url.searchParams.get('topic');
  if (topicId) {
    currentMission = await tutorEngine.decideNextMission();
    const topicData = await db.topics.get(Number(topicId));
    mindMapPuml = topicData?.mindMapPuml || null;
  }
});

// Quando sessão termina:
async function handleSessionComplete(result) {
  sessionComplete = true;
  nextMission = await tutorEngine.recalculateAfterSession(result);
}

// Próxima missão:
async function startNextMission() {
  if (nextMission?.topic) {
    await goto(`/study?topic=${nextMission.topic.id}`);
  }
}
</script>

<!-- NOVO: Barra do Tutor no topo da página de estudo -->
<div class="study-tutor-bar">
  <div class="tutor-info">
    <span class="tutor-label">🎯 FOCO:</span>
    <span class="tutor-topic">{currentMission?.topic?.name}</span>
    <span class="tutor-reason">{currentMission?.reason}</span>
  </div>
  {#if mindMapPuml}
    <PlantUMLRenderer puml={mindMapPuml} collapsed={true} />
  {/if}
</div>

<!-- NOVO: Tela pós-sessão -->
{#if sessionComplete}
  <div class="session-complete">
    <h2>🎉 Sessão Completa!</h2>
    <div class="session-stats">
      <span>✅ {result.correct} acertos</span>
      <span>❌ {result.incorrect} erros</span>
      <span>⏱️ {result.time}min</span>
    </div>

    {#if nextMission}
      <div class="next-mission-preview">
        <h3>Próxima Missão:</h3>
        <p>{nextMission.reason}</p>
        <button on:click={startNextMission}>
          ▶ Continuar: {nextMission.topic?.name}
        </button>
      </div>
    {/if}

    <button on:click={() => goto('/')}>🏠 Voltar ao Dashboard</button>
  </div>
{/if}
```

#### 4.2. ALTERAR: `sessionGenerator.js`

Integrar com `tutorEngine`:

```javascript
// No generateDailySession(), adicionar no início:
import { tutorEngine } from './tutorEngine.js';

async generateDailySession() {
  // Se modo STRICT, força a missão do tutor
  const config = await db.config.get(1);
  if (config?.tutor?.mode === TUTOR_MODE.STRICT) {
    const mission = await tutorEngine.decideNextMission();
    // Gera sessão com foco único na missão estrita
    return this.generateStrictSession(mission);
  }
  // ... resto do código existente ...
}

async generateStrictSession(mission) {
  // Sessão focada em uma única matéria
  // Elimina interleaving, maximiza profundidade
}
```

#### 4.3. NOVO: Hook de sessão completa no `session.js` store

```javascript
// Em src/lib/stores/session.js, adicionar método:
async completeWithRecalc() {
  const state = get({ subscribe });
  await this.finish();
  const next = await tutorEngine.recalculateAfterSession({
    correct: state.stats.correctCount,
    incorrect: state.stats.incorrectCount,
    totalTime: state.stats.totalTime,
    cardsReviewed: state.stats.cardsReviewed,
  });
  return next;
}
```

#### 4.4. ALTERAR: Dashboard (`src/routes/+page.svelte`)

Loop do dashboard:

- "Iniciar Sessão" → agora usa `tutorEngine.decideNextMission()` → redireciona para `/study`
- "Ver Plano do Dia" → mostra blocos planejados com a missão do tutor em destaque
- Badge "🔴 Sessão incompleta" se o usuário fechou sem terminar

---

## FASE 5 — Tempo Diferenciado (Forte vs Fraco)

### O que é

Alocar **mais tempo para matérias fracas** e **menos (ou zero) para matérias fortes**, baseado na métrica de domínio > 85%.

### O que muda no código

#### 5.1. ALTERAR: `sessionGenerator.js` — `allocateTime()`

```javascript
allocateTime(totalMinutes, queueStats) {
  const mastery = await tutorEngine.calculateSubjectMastery(subjects);

  // ... código existente ...

  // FASE 5: Tempo diferenciado por domínio
  const strongSubjects = mastery.filter(s => s.retention >= 85);
  const weakSubjects = mastery.filter(s => s.retention < 85);

  // Se matéria está > 85%, recebe ZERO tempo de conteúdo novo
  // Apenas revisões pontuais se houver cards due
  // O tempo "liberado" vai para weak subjects

  // Ajustar distribuição baseada no perfil:
  if (strongSubjects.length > weakSubjects.length) {
    // Usuário está avançado — mais questões e menos revisão mecânica
    allocation.questions = Math.floor(remaining * 0.40);  // ↑ de 25-30%
    allocation.reviews = Math.floor(remaining * 0.25);    // ↓
    allocation.newContent = Math.floor(remaining * 0.20); // ↓
  } else if (weakSubjects.length > strongSubjects.length) {
    // Usuário está atrasado — foco em fundamentals
    allocation.reviews = Math.floor(remaining * 0.40);    // ↑ manter memória
    allocation.newContent = Math.floor(remaining * 0.30); // ↑ construir base
    allocation.questions = Math.floor(remaining * 0.15); // ↓ menos pressão
  }

  return allocation;
}
```

#### 5.2. NOVO: `src/lib/engines/adaptiveAlloactor.js`

```javascript
export class AdaptiveAllocator {
  /**
   * Dado o tempo total e o perfil de domínio, retorna
   * distribuição otimizada de tempo por matéria.
   */
  async allocate(totalMinutes, mastery) {
    const critical = mastery.filter((s) => s.critical); // <40%
    const weak = mastery.filter((s) => s.weak && !s.critical); // 40-60%
    const medium = mastery.filter((s) => !s.weak && s.retention < 85); // 60-85%
    const strong = mastery.filter((s) => s.retention >= 85); // >85%

    // Distribuição base
    let distribution = {};

    if (critical.length > 0) {
      // Máximo tempo em críticos
      const perSubject = Math.floor((totalMinutes * 0.5) / critical.length);
      critical.forEach((s) => (distribution[s.id] = perSubject));
    }

    if (weak.length > 0) {
      const perSubject = Math.floor((totalMinutes * 0.35) / weak.length);
      weak.forEach((s) => (distribution[s.id] = perSubject));
    }

    if (medium.length > 0) {
      const perSubject = Math.floor((totalMinutes * 0.15) / medium.length);
      medium.forEach((s) => (distribution[s.id] = perSubject));
    }

    // Matérias fortes: ZERO conteúdo novo, apenas 1 card/day de revisão se devido
    // (O FSRS já cuida disso — não alocar tempo aqui)

    return distribution;
  }
}
```

#### 5.3. ALTERAR: `PreVoo.svelte` — feedback visual Forte vs Fraco

```svelte
<!-- No header do PreVoo, adicionar badge de domínio -->
<div class="mastery-indicator" class:strong={retention >= 85} class:weak={retention < 60}>
  {#if retention >= 85}
    💪 Domínio Forte ({retention}%) — foco em manutenção
  {:else if retention < 60}
    📚 Domínio Fraco ({retention}%) — foco intensivo
  {:else}
    📈 Em Progresso ({retention}%)
  {/if}
</div>

<style>
  .mastery-indicator {
    padding: 8px 12px; border-radius: 8px; font-size: 0.85rem;
    margin-bottom: 12px;
  }
  .mastery-indicator.strong { background: rgba(34,197,94,0.1); color: #16a34a; }
  .mastery-indicator.weak   { background: rgba(239,68,68,0.08); color: #dc2626; }
</style>
```

#### 5.4. ALTERAR: `sessionGenerator.js` — `getDailyMission()`

Adicionar `masteryLevel` em cada missão:

```javascript
// Em getDailyMission(), no objeto returned:
const mastery = subjectMastery.find((s) => s.id === subject.id);
topicScores.push({
  // ... campos existentes ...
  masteryLevel: mastery
    ? tutorEngine.getMasteryLabel(mastery.retention)
    : "desconhecido",
  retention: mastery?.retention || 0,
});

// Ordenar: críticos primeiro, depois fracos, etc.
topicScores.sort((a, b) => {
  const order = { crítico: 0, fraco: 1, médio: 2, forte: 3 };
  return order[a.masteryLevel] - order[b.masteryLevel] || b.score - a.score;
});
```

#### 5.5. NOVO COMPONENTE: `src/lib/components/study/MasteryGauge.svelte`

Widget circular que mostra domínio por matéria:

```
    ┌─────────────┐
    │   ┌───┐     │
    │   │72%│     │
    │   └───┘     │
    │  Penal      │
    └─────────────┘
```

- Verde (>85%), Amarelo (60-85%), Vermelho (<60%)
- Animação de preenchimento

---

## ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

```
Semana 1: Fase 1 (Tutor Engine) + Fase 5 parcial
          → Criar tutorEngine.js
          → Criar TutorMission.svelte
          → Integrar no dashboard

Semana 2: Fase 2 (Domínio do Edital)
          → Calcular métricas de domínio
          → Criar EditalMasteryPanel
          → Criar página /edital

Semana 3: Fase 3 (Mapas PlantUML) + Fase 4 (Fluxo Fechado)
          → Schema update (mindMapPuml)
          → PlantUMLRenderer
          → PreVoo com mapa
          → Loop completo study page

Semana 4: Fase 5 completa + Integração + Testes
          → AdaptiveAllocator
          → Alocação de tempo diferenciada
          → Teste end-to-end do fluxo completo
          → UX polish
```

---

## ARQUIVOS A CRIAR (8 novos)

| Arquivo                                               | Fase |
| ----------------------------------------------------- | ---- |
| `src/lib/engines/tutorEngine.js`                      | 1    |
| `src/lib/components/tutor/TutorMission.svelte`        | 1    |
| `src/lib/components/edital/EditalMasteryPanel.svelte` | 2    |
| `src/lib/components/edital/SubjectDrilldown.svelte`   | 2    |
| `src/lib/components/mindmaps/PlantUMLRenderer.svelte` | 3    |
| `src/lib/components/topics/TopicEditor.svelte`        | 3    |
| `src/lib/engines/adaptiveAllocator.js`                | 5    |
| `src/lib/components/study/MasteryGauge.svelte`        | 5    |

## ARQUIVOS A ALTERAR (6 existentes)

| Arquivo                               | Alterações                                       |
| ------------------------------------- | ------------------------------------------------ |
| `src/lib/db.js`                       | Schema v4: mindMapPuml, tutor config, migration  |
| `src/lib/stores/config.js`            | Tutor mode, lastMission                          |
| `src/lib/stores/session.js`           | recalculateAfterSession hook                     |
| `src/lib/engines/sessionGenerator.js` | Integração tutor, alocação diferenciada, mastery |
| `src/routes/+page.svelte`             | TutorMission widget, Edital widget, toggle       |
| `src/routes/study/+page.svelte`       | Tutor bar, mind map, loop, pós-sessão            |

## DEPENDÊNCIAS A INSTALAR

```bash
npm install plantuml-encoder  # para encode PlantUML
# OU usar Kroki API (sem lib):
# https://api.kroki.io/v1/plantuml/svg/~1{encoded}
```

---

## CONFIGURAÇÕES DO TUTOR (Settings)

Adicionar seção em `src/routes/settings/+page.svelte`:

```
TUTOR
─────────────────────────────────
Modo:  ○ Passivo  ○ Ativo  ● Estrito

Passivo:  Sugere o que estudar
Ativo:    Recomenda com peso alto (padrão)
Estrito:  Obriga foco até atingir 85%+

⚠️ Modo Estrito pode parecer "rígido" — o tutor
bloqueia outras matérias até recuperar o domínio.
```

---

## MÉTRICAS DE DOMÍNIO — FÓRMULAS

```
Retenção Real (R):
  R = cards_maduros / cards_em_review
  (cards com stability > 21 dias)

Acerto Real (A):
  A = sum(correctCount) / sum(totalReviews)
  (ratio de acertos vs total de revisões)

Cobertura (C):
  C = (total - new) / total
  (quanto do conteúdo já foi visto)

DOMÍNIO (D):
  D = (R × 0.4) + (A × 0.4) + (C × 0.2)

Ponto de corte:
  D >= 85% → MATÉRIA FORTE → menos tempo
  D <  60% → MATÉRIA FRACA → mais tempo
  D <  40% → CRÍTICO → urgência máxima
```
