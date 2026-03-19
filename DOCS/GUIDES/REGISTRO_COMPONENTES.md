# Registro de Componentes — Sistemão

**Última atualização:** 2026-03-18

---

## Engines (Motor de Lógica)

### tutorEngine.js

**Propósito:** "Cérebro" do sistema — decide O QUE, QUANDO e POR QUÊ o aluno deve estudar.

**Arquivos:** `src/lib/engines/tutorEngine.js`

**Estado:** ✅ Funcional (parcial — faltam integrações)

**Histórico de alterações:**

| Data       | Alteração                                                                                           | Motivação           |
| ---------- | --------------------------------------------------------------------------------------------------- | ------------------- |
| 2026-03-18 | Criação inicial com decideNextMission(), calculateSubjectMastery(), getROIFocus(), getStrictFocus() | Core do tutor ativo |

**Dependências:** `db.js`, `scheduler.js`

**Integrações:**

- Dashboard (`+page.svelte`) — mostra TutorMission
- Página de estudo (`study/+page.svelte`) — barra do tutor + pós-sessão
- Session store (`session.js`) — finishWithRecalc()
- Config store (`config.js`) — tutor mode

---

### scheduler.js

**Propósito:** Gerencia a fila de cards pendientes (due/learning/relearning/new).

**Arquivos:** `src/lib/engines/scheduler.js`

**Estado:** ✅ Completo

---

### sessionGenerator.js

**Propósito:** Gera o plano diário de sessão com blocos intercalados.

**Arquivos:** `src/lib/engines/sessionGenerator.js`

**Estado:** ⚠️ Parcial — não integra adaptiveAllocator

---

### adaptiveAllocator.js

**Propósito:** Distribui tempo de estudo por matéria baseado no domínio.

**Arquivos:** `src/lib/engines/adaptiveAllocator.js`

**Estado:** ⚠️ Criado mas não integrado ao sessionGenerator

---

### analytics.js

**Propósito:** Projeção de probabilidade de aprovação e métricas agregadas.

**Arquivos:** `src/lib/engines/analytics.js`

**Estado:** ✅ Completo

---

## Stores (Estado Reativo)

### sessionStore

**Propósito:** Gerencia estado da sessão de estudo ativa (fila, card atual, stats).

**Arquivos:** `src/lib/stores/session.js`

**Estado:** ✅ Completo

---

### configStore

**Propósito:** Configurações globais do usuário (exame alvo, FSRS params, gamificação, tutor mode).

**Arquivos:** `src/lib/stores/config.js`

**Estado:** ✅ Completo

---

### cardsStore

**Propósito:** Store de cards com métricas por matéria.

**Arquivos:** `src/lib/stores/cards.js`

**Estado:** ✅ Completo

---

### subjectsStore

**Propósito:** Store de matérias do edital.

**Arquivos:** `src/lib/stores/subjects.js`

**Estado:** ✅ Completo

---

## Componentes UI

### TutorMission.svelte

**Propósito:** Card de missão do tutor no dashboard.

**Arquivos:** `src/lib/components/tutor/TutorMission.svelte`

**Estado:** ✅ Implementado

---

### EditalMasteryPanel.svelte

**Propósito:** Painel lateral de domínio do edital.

**Arquivos:** `src/lib/components/edital/EditalMasteryPanel.svelte`

**Estado:** ✅ Implementado

---

### EditalWidget.svelte

**Propósito:** Widget compacto de domínio do edital no dashboard.

**Arquivos:** `src/lib/components/edital/EditalWidget.svelte`

**Estado:** ✅ Implementado

---

### SubjectDrilldown.svelte

**Propósito:** Detalhamento de uma matéria específica (gráficos, topics, bizus).

**Arquivos:** `src/lib/components/edital/SubjectDrilldown.svelte`

**Estado:** ✅ Implementado

---

### PreVoo.svelte

**Propósito:** Ritual pré-estudo (active recall, mapa mental, notas, ritual).

**Arquivos:** `src/lib/components/study/PreVoo.svelte`

**Estado:** ✅ Implementado

---

### PlantUMLRenderer.svelte

**Propósito:** Renderiza mapas mentais PlantUML via API pública.

**Arquivos:** `src/lib/components/mindmaps/PlantUMLRenderer.svelte`

**Estado:** ⚠️ Funcional mas dependente de internet

---

### TopicMindMapEditor.svelte

**Propósito:** Editor de mapas PlantUML integrado no gerenciamento de tópicos.

**Arquivos:** `src/lib/components/mindmaps/TopicMindMapEditor.svelte`

**Estado:** ✅ Implementado

---

### MasteryGauge.svelte

**Propósito:** Widget circular SVG mostrando domínio por matéria (score 0-100).

**Arquivos:** `src/lib/components/study/MasteryGauge.svelte`

**Estado:** ✅ Criado (2026-03-18)

**Integração:** SubjectDrilldown (header + lista de tópicos)

**Histórico de alterações:**

| Data       | Alteração       | Motivação                                                 |
| ---------- | --------------- | --------------------------------------------------------- |
| 2026-03-18 | Criação inicial | Componente previsto no plano Sistemão 2.0 que não existia |

**Props:**

- `score` (0-100)
- `label` (texto abaixo do número)
- `size` ('sm' | 'md' | 'lg')
- `animate` (boolean)

---

### StudyCard.svelte

**Propósito:** Renderização de um card (pergunta + resposta).

**Arquivos:** `src/lib/components/cards/StudyCard.svelte`

**Estado:** ✅ Implementado

---

## Páginas (Routes)

### Dashboard (`/`)

**Arquivos:** `src/routes/+page.svelte`

**Estado:** ✅ Completo

---

### Estudo (`/study`)

**Arquivos:** `src/routes/study/+page.svelte`

**Estado:** ✅ Completo

---

### Edital (`/edital`)

**Arquivos:** `src/routes/edital/+page.svelte`

**Estado:** ✅ Completo

---

## Pendente de Implementação

| Componente                | Status    | Observação                        |
| ------------------------- | --------- | --------------------------------- |
| `MasteryGauge.svelte`     | ✅ Criado | Widget circular de domínio        |
| Settings > Tutor mode UI  | ✅ Criado | Toggle na página de configurações |
| `generateStrictSession()` | ✅ Criado | Sessão dedicada para modo estrito |
