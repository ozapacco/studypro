# Progresso - 2026-03-18

## Sessão

- **Início:** 09:07
- **Fim:** -
- **Duração:** Em andamento (primeira sessão)

## Objetivos

- [ ] Varredura completa do codebase
- [ ] Criar primeiro documento de progresso conforme diretrizes
- [x] Mapear o que foi implementado
- [x] Mapear o que ainda está pendente
- [x] Identificar decisões técnicas

## Concluído

### Decisão: Sistema "Sistemão" - Sistema de Estudos com FSRS

O projeto é um **sistema de estudos local-first** baseado em SvelteKit + Dexie (IndexedDB), com as seguintes camadas já implementadas:

#### Stack Técnico

- **Frontend:** SvelteKit + TailwindCSS
- **Storage:** Dexie (IndexedDB) + opcional Supabase cloud sync
- **Scheduler:** Algoritmo FSRS (Free Spaced Repetition Scheduler)
- **Testes:** Vitest

#### Arquitetura de Componentes (23 arquivos Svelte)

| Componente           | Caminho                                                 | Estado          |
| -------------------- | ------------------------------------------------------- | --------------- |
| `Card`               | `src/lib/components/common/Card.svelte`                 | ✅ Implementado |
| `Button`             | `src/lib/components/common/Button.svelte`               | ✅ Implementado |
| `Badge`              | `src/lib/components/common/Badge.svelte`                | ✅ Implementado |
| `ProgressBar`        | `src/lib/components/common/ProgressBar.svelte`          | ✅ Implementado |
| `StudyCard`          | `src/lib/components/cards/StudyCard.svelte`             | ✅ Implementado |
| `SessionTimer`       | `src/lib/components/session/SessionTimer.svelte`        | ✅ Implementado |
| `SessionProgress`    | `src/lib/components/session/SessionProgress.svelte`     | ✅ Implementado |
| `MissaoDiaria`       | `src/lib/components/dashboard/MissaoDiaria.svelte`      | ✅ Implementado |
| `TutorMission`       | `src/lib/components/tutor/TutorMission.svelte`          | ✅ Implementado |
| `EditalMasteryPanel` | `src/lib/components/edital/EditalMasteryPanel.svelte`   | ✅ Implementado |
| `EditalWidget`       | `src/lib/components/edital/EditalWidget.svelte`         | ✅ Implementado |
| `SubjectDrilldown`   | `src/lib/components/edital/SubjectDrilldown.svelte`     | ✅ Implementado |
| `PreVoo`             | `src/lib/components/study/PreVoo.svelte`                | ✅ Implementado |
| `TopicNotes`         | `src/lib/components/study/TopicNotes.svelte`            | ✅ Implementado |
| `PlantUMLRenderer`   | `src/lib/components/mindmaps/PlantUMLRenderer.svelte`   | ✅ Implementado |
| `TopicMindMapEditor` | `src/lib/components/mindmaps/TopicMindMapEditor.svelte` | ✅ Implementado |

#### Arquitetura de Stores (6 arquivos)

| Store           | Arquivo                      | Estado          |
| --------------- | ---------------------------- | --------------- |
| `sessionStore`  | `src/lib/stores/session.js`  | ✅ Implementado |
| `configStore`   | `src/lib/stores/config.js`   | ✅ Implementado |
| `cardsStore`    | `src/lib/stores/cards.js`    | ✅ Implementado |
| `subjectsStore` | `src/lib/stores/subjects.js` | ✅ Implementado |
| `notesStore`    | `src/lib/stores/notes.js`    | ✅ Implementado |
| `uiStore`       | `src/lib/stores/ui.js`       | ✅ Implementado |

#### Arquitetura de Engines (7 arquivos)

| Engine              | Arquivo                                | Estado          |
| ------------------- | -------------------------------------- | --------------- |
| `tutorEngine`       | `src/lib/engines/tutorEngine.js`       | ✅ Implementado |
| `scheduler`         | `src/lib/engines/scheduler.js`         | ✅ Implementado |
| `sessionGenerator`  | `src/lib/engines/sessionGenerator.js`  | ✅ Implementado |
| `adaptiveAllocator` | `src/lib/engines/adaptiveAllocator.js` | ✅ Implementado |
| `analytics`         | `src/lib/engines/analytics.js`         | ✅ Implementado |
| `priorityRanker`    | `src/lib/engines/priorityRanker.js`    | ✅ Implementado |
| `interleaver`       | `src/lib/engines/interleaver.js`       | ✅ Implementado |

#### Rotas (9 páginas)

| Rota               | Arquivo                                 | Estado          |
| ------------------ | --------------------------------------- | --------------- |
| Dashboard          | `src/routes/+page.svelte`               | ✅ Implementado |
| Estudo             | `src/routes/study/+page.svelte`         | ✅ Implementado |
| Notas de estudo    | `src/routes/study/notes/+page.svelte`   | ✅ Implementado |
| Edital             | `src/routes/edital/+page.svelte`        | ✅ Implementado |
| Cartões            | `src/routes/cards/+page.svelte`         | ✅ Implementado |
| Cartão individual  | `src/routes/cards/[id]/+page.svelte`    | ✅ Implementado |
| Matérias           | `src/routes/subjects/+page.svelte`      | ✅ Implementado |
| Matéria individual | `src/routes/subjects/[id]/+page.svelte` | ✅ Implementado |
| Estatísticas       | `src/routes/stats/+page.svelte`         | ✅ Implementado |
| Configurações      | `src/routes/settings/+page.svelte`      | ✅ Implementado |

### Decisão: Plano de Implementação — Sistemão 2.0 (5 fases)

O documento `PLAN0__IMPLEMENTACAO_COMPLETO.md` define 5 fases:

#### Fase 1 — Tutor Ativo (Motor de Decisão) — **PARCIALMENTE IMPLEMENTADA**

- ✅ `tutorEngine.js` criado com `decideNextMission()`
- ✅ `calculateSubjectMastery()` implementado
- ✅ `getStrictFocus()` e `getROIFocus()` implementados
- ✅ `TUTOR_MODE` (passive/active/strict) implementado
- ✅ `TutorMission.svelte` criado e integrado no dashboard
- ✅ Toggle de modo no header do dashboard
- ✅ `setMode()`, `getMode()` no tutor engine
- ❌ `tutorEngine.setMode()` integrado no dashboard toggle — **PENDENTE**
- ⚠️ Não existe schema v4 no `db.js` ainda — `mindMapPuml` não está no schema

#### Fase 2 — Domínio do Edital — **IMPLEMENTADA**

- ✅ `EditalMasteryPanel.svelte` criado
- ✅ `SubjectDrilldown.svelte` criado
- ✅ Página `/edital` criada com layout completo
- ✅ `EditalWidget.svelte` criado (widget compacto para dashboard)
- ✅ Integração com `tutorEngine.calculateSubjectMastery()`
- ✅ Score geral, barras de domínio, legendas de cores

#### Fase 3 — Mapas Mentais PlantUML — **PARCIALMENTE IMPLEMENTADA**

- ✅ `PlantUMLRenderer.svelte` criado (usa API plantuml.com pública)
- ✅ `TopicMindMapEditor.svelte` criado (editor de mapas)
- ✅ `PreVoo.svelte` integrado com mapa mental (renderização condicional)
- ⚠️ `mindMapPuml` referenciado no código mas **schema do DB não tem** — o campo é lido do IndexedDB mesmo sem estar no schema (Dexie permite campos extras)
- ❌ Schema `db.js` não foi atualizado para version(4) com `mindMapPuml`

#### Fase 4 — Fluxo Fechado (Loop Completo) — **PARCIALMENTE IMPLEMENTADA**

- ✅ `finishWithRecalc()` implementado no session store — ao terminar sessão, recalcula missão do tutor
- ✅ Página de estudo com barra do tutor no topo
- ✅ Tela pós-sessão com resumo + "Próxima Missão" (continua → próxima missão)
- ✅ `PreVoo` integrado antes de iniciar cards (quando `?topicId=` está na URL)
- ✅ `sessionGenerator.generateDailySession({ forceTopicId })` para forçar tópico
- ⚠️ Hook `sessionGenerator.generateStrictSession()` não existe

#### Fase 5 — Tempo Diferenciado (Forte vs Fraco) — **PARCIALMENTE IMPLEMENTADA**

- ✅ `adaptiveAllocator.js` criado com `allocate()` e distribuição por crítico/fraco/médio/forte
- ✅ `PreVoo.svelte` exibe badge de domínio (forte/fraco) com cores
- ✅ Métricas de domínio (retention/accuracy/coverage) expostas no `tutorEngine`
- ⚠️ `sessionGenerator.allocateTime()` **não usa** `adaptiveAllocator` ainda
- ⚠️ `sessionGenerator.getDailyMission()` não tem ordenação por nível de domínio
- ❌ `MasteryGauge.svelte` não foi criado (widget circular)

### Correções de Bug Documentadas

O arquivo `DOCS/implementation_plan.md` (data: 2026-03-18) documenta um bugfix:

- **Problema:** Cards não exibiam `subjectName`/`topicName` — estudante não sabia qual matéria/tópico estava estudando
- **Solução aplicada:**
  - `loadQueueByIds()` no session store agora enriquece cards com `subjectName` e `topicName` via bulk lookups
  - Banner de contexto adicionado na página de estudo (`study/+page.svelte:244-253`)
  - Badge de matéria+tópico no `StudyCard.svelte`
  - Bloco de questões no `sessionGenerator` agora inclui `topicId` e `topicName`

## Ajustes Realizados

| Antes                     | Depois                                          | Motivação                               |
| ------------------------- | ----------------------------------------------- | --------------------------------------- |
| Sem documentação          | Criado `docs/guides/DIRETRIZES_DOCUMENTACAO.md` | Estabelecer padrões de documentação     |
| Sem registro de progresso | Criado `PROGRESSO_2026-03-18_inicio_projeto.md` | Primeira varredura completa do codebase |

## Pendências Identificadas

### Críticas (impedem funcionamento completo)

1. **Dashboard toggle de modo tutor** — `tutorEngine.setMode()` chamado mas não existe método `setMode` no engine (existe `setMode` no engine, mas a integração no dashboard pode ter bug — `src/routes/+page.svelte:49` chama `tutorEngine.setMode(nextMode)`)
2. **Schema db.js v4** — `mindMapPuml` não está registrado no schema, pode causar inconsistências
3. **Settings tutor mode** — Página de configurações não tem UI para trocar modo do tutor

### Implementação Plano Sistemão 2.0

4. **`sessionGenerator.allocateTime()`** — não integra com `adaptiveAllocator.js`
5. **MasteryGauge.svelte** — componente circular de domínio não criado
6. **`sessionGenerator.generateStrictSession()`** — modo estrito não tem geração dedicada
7. **Ordenação por domínio no `getDailyMission()`** — críticos primeiro não implementado

### Melhorias / Polish

8. **Testes end-to-end** — falta cobertura de testes para fluxo completo
9. **Dependência `plantuml-encoder`** — `PlantUMLRenderer` usa API pública (pode falhar offline)
10. **Supabase sync** — funcional mas sem UI de status detalhado

## Próximos Passos

1. Verificar e corrigir integração do toggle de modo tutor no dashboard
2. Atualizar schema do `db.js` para version(4) com `mindMapPuml`
3. Adicionar seção de Tutor nas Configurações (Settings)
4. Integrar `adaptiveAllocator` em `sessionGenerator.allocateTime()`
5. Criar `MasteryGauge.svelte`
6. Criar documento `PENDENCIAS.md` centralizado
7. Criar documento `DECISOES.md` com decisões técnicas documentadas
