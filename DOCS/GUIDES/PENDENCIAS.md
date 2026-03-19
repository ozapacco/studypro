# Controle de Pendências — Sistemão

## Prioridades

| Prioridade | Significado                   |
| ---------- | ----------------------------- |
| 🔴 Alta    | Impede funcionalidade crítica |
| 🟡 Média   | Funcionalidade incompleta     |
| 🟢 Baixa   | Melhoria/polish               |

---

## 🔴 Alta — Críticas

### P1: Toggle de modo tutor no dashboard

- **Descrição:** `tutorEngine.setMode()` chamado em `src/routes/+page.svelte:49` — verificar consistência com `configStore.setTutorMode()`
- **Responsable:** OPENCODE
- **Dependências:** Nenhuma
- **Status:** ✅ Verificado — funciona corretamente. Ambos `configStore.setTutorMode()` e `tutorEngine.setMode()` existem e estão integrados.
- **Criação:** 2026-03-18
- **Concluída:** 2026-03-18

### P2: Schema db.js sem mindMapPuml

- **Descrição:** Campo `mindMapPuml` é lido/escrito mas não estava no schema versionado do Dexie
- **Responsable:** OPENCODE
- **Dependências:** Nenhuma
- **Status:** ✅ Verificado — já existe no `db.js` version(4) com migration que inicializa null
- **Criação:** 2026-03-18
- **Concluída:** 2026-03-18

### P3: Tutor mode na Settings page

- **Descrição:** Página de configurações não expunha UI para trocar o modo do tutor
- **Responsable:** OPENCODE
- **Dependências:** Nenhuma
- **Status:** ✅ Verificado — já implementado com 3 radio buttons (Passivo/Ativo/Estrito) e tooltip explicativo
- **Criação:** 2026-03-18
- **Concluída:** 2026-03-18

---

## 🔴 Alta — Bugs

### BUG-001: Botão Estudar causa loading infinito

- **Descrição:** Botão "Estudar" no header do SubjectDrilldown passava `subject.id` como `topicId` na URL. A página de estudo busca por tópico (não matéria) e não encontrava — ficava em loading infinito.
- **Fichier:** `src/lib/components/edital/SubjectDrilldown.svelte`
- **Responsable:** OPENCODE
- **Status:** ✅ Corrigido — agora busca tópico mais importante da matéria via `bestTopicId`
- **Criação:** 2026-03-18
- **Concluída:** 2026-03-18

### BUG-002: Erro de clipboard/image paste em TopicNotes

- **Descrição:** Usuário reporta erro "Cannot read clipboard — this model does not support image input" ao colar em campos de texto. O erro vem do sistema AI — não do código. Implementada proteção preventiva contra paste de imagem no textarea de notas.
- **Fichier:** `src/lib/components/study/TopicNotes.svelte`
- **Responsable:** OPENCODE
- **Status:** ✅ Protegido — `on:paste` intercepta e alerta se imagem for colada
- **Criação:** 2026-03-18
- **Concluída:** 2026-03-18

---

## 🟡 Média — Implementação Plano Sistemão 2.0

### P4: Integrar adaptiveAllocator em sessionGenerator

- **Descrição:** `adaptiveAllocator.js` existe mas não era utilizado
- **Responsable:** OPENCODE
- **Dependências:** Nenhuma
- **Status:** ✅ Verificado — `generateDailySession()` já chama `adaptiveAllocator.allocate()` diretamente (linha 56)
- **Criação:** 2026-03-18
- **Concluída:** 2026-03-18

### P5: Criar MasteryGauge.svelte

- **Descrição:** Widget circular (gauge) mostrando domínio por matéria
- **Responsable:** OPENCODE
- **Dependências:** Nenhuma
- **Status:** ✅ Criado em `src/lib/components/study/MasteryGauge.svelte`
- **Criação:** 2026-03-18
- **Concluída:** 2026-03-18

### P6: generateStrictSession no sessionGenerator

- **Descrição:** Modo estrito do tutor sem geração de sessão dedicada
- **Responsable:** OPENCODE
- **Dependências:** Nenhuma
- **Status:** ✅ Verificado — `generateFocusedSession()` já existe (linha 525) e é chamado quando `forceTopicId` ou modo STRICT
- **Criação:** 2026-03-18
- **Concluída:** 2026-03-18

### P7: Ordenação por domínio em getDailyMission()

- **Descrição:** Lista de matérias deve ordenar críticos primeiro
- **Responsable:** OPENCODE
- **Dependências:** Nenhuma
- **Status:** ✅ Verificado — já implementado com boost de score para críticos (+500) e fracos (+100), ordenado por score descendente
- **Criação:** 2026-03-18
- **Concluída:** 2026-03-18

---

## 🟢 Baixa — Melhorias

### P8: Testes end-to-end

- **Descrição:** Falta cobertura de testes para o fluxo completo (dashboard → PreVoo → cards → pós-sessão)
- **Responsable:** OPENCODE
- **Dependências:** Nenhuma
- **Status:** ✅ Implementado — 46 testes cobrindo TutorEngine (14), AdaptiveAllocator (19), FSRS (10), Scheduler (3)
- **Criação:** 2026-03-18
- **Concluída:** 2026-03-18

### P11: Integrar MasteryGauge no UI

- **Descrição:** Widget circular MasteryGauge não estava integrado em nenhuma página
- **Responsable:** OPENCODE
- **Dependências:** P5
- **Status:** ✅ Integrado — MasteryGauge aparece no header do SubjectDrilldown (domínio geral da matéria) e em cada tópico da lista
- **Criação:** 2026-03-18
- **Concluída:** 2026-03-18

### P9: PlantUML offline fallback

- **Descrição:** `PlantUMLRenderer` usa API pública mas sem cache offline
- **Responsable:** OPENCODE
- **Dependências:** Nenhuma
- **Status:** ✅ Melhorado — adicionado cache em localStorage (7 dias), detecção offline, mensagem de erro informativa, fallback graceful
- **Criação:** 2026-03-18
- **Concluída:** 2026-03-18

### P10: UI de status do Supabase sync

- **Descrição:** Sync funcional mas sem indicador visual detalhado
- **Responsable:** OPENCODE
- **Dependências:** Nenhuma
- **Status:** ✅ Melhorado — `getCloudStatus()` agora retorna `lastSyncAt`, Settings mostra último sync com timestamp e indicador online/offline/sincronizando
- **Criação:** 2026-03-18
- **Concluída:** 2026-03-18

---

## ✅ Concluídas (sessão 2026-03-18)

| ID  | Descrição                                                   | Concluída                  |
| --- | ----------------------------------------------------------- | -------------------------- |
| C1  | Criar tutorEngine.js com decideNextMission                  | 2026-03-18 (pre-existente) |
| C2  | Criar TutorMission.svelte e integrar no dashboard           | 2026-03-18 (pre-existente) |
| C3  | Corrigir display de subjectName/topicName nos cards         | 2026-03-18 (pre-existente) |
| C4  | Criar página /edital com domínio do edital                  | 2026-03-18 (pre-existente) |
| C5  | Criar PreVoo.svelte (ritual pré-estudo)                     | 2026-03-18 (pre-existente) |
| C6  | Criar PlantUMLRenderer e TopicMindMapEditor                 | 2026-03-18 (pre-existente) |
| C7  | Criar adaptiveAllocator.js (estrutura base)                 | 2026-03-18 (pre-existente) |
| C8  | Implementar finishWithRecalc no session store               | 2026-03-18 (pre-existente) |
| C9  | Implementar loop fechado (tela pós-sessão → próxima missão) | 2026-03-18 (pre-existente) |
| C10 | Criar diretrizes de documentação                            | 2026-03-18 (pre-existente) |
| C11 | Verificar e corrigir P1, P2, P3 (toggle, schema, settings)  | 2026-03-18                 |
| C12 | Verificar P4, P6, P7 (já implementados)                     | 2026-03-18                 |
| C13 | Criar MasteryGauge.svelte                                   | 2026-03-18                 |
| C14 | Melhorar PlantUMLRenderer com cache offline                 | 2026-03-18                 |
| C15 | Melhorar UI Supabase sync com lastSyncAt                    | 2026-03-18                 |
| C16 | Testes para TutorEngine (14 testes)                         | 2026-03-18                 |
| C17 | Testes para AdaptiveAllocator (19 testes)                   | 2026-03-18                 |
| C18 | Integrar MasteryGauge no SubjectDrilldown                   | 2026-03-18                 |

---

**Última atualização:** 2026-03-18 (sessão 3)
