# Registro de Decisões — Sistemão

---

## DEC-001: Stack Tecnológico Local-First

**Data:** 2026-03-18

**Problema considerado:** O sistema precisa funcionar offline e sincronizar com cloud quando disponível.

**Opções avaliadas:**

1. PWA com Service Worker + IndexedDB (local-first)
2. Next.js + Prisma + PostgreSQL (full cloud)
3. Tauri desktop app + SQLite
4. SvelteKit + Dexie (IndexedDB) + Supabase opcional

**Decisão tomada:** SvelteKit + Dexie (IndexedDB) + Supabase opcional

**Motivação:**

- Dexie oferece API reativa excelente para Svelte
- IndexedDB funciona offline por padrão
- Supabase é opcional e serve apenas como backup/snapshot
- Sem necessidade de backend server-side para o core
- SvelteKit oferece SSR quando necessário

**Revisões futuras:** Necessário avaliar se Supabase snapshot sync é suficiente ou se precisa de sync bidirecional real.

---

## DEC-002: Motor FSRS nativo (sem dependência externa)

**Data:** 2026-03-18

**Problema considerado:** Qual algoritmo de espaçamento usar? Importar lib `fsrs.js` ou implementar internamente?

**Opções avaliadas:**

1. `spaced` (npm) — implementação JS do SM-2
2. `fsrs.js` (npm) — implementação oficial do FSRS
3. Implementação nativa própria

**Decisão tomada:** Implementação nativa em `src/lib/fsrs/` com modules `fsrs.js`, `params.js`, `states.js`, `optimizer.js`

**Motivação:**

- Permite ajuste fino sem dependência externa
- Código pode ser otimizado para o caso de uso específico
- Facilita debug e personalização de parâmetros

---

## DEC-003: Tutor Ativo — Modos de Intervenção

**Data:** 2026-03-18

**Problema considerado:** Como o tutor deve intervir nas decisões de estudo do aluno?

**Opções avaliadas:**

1. **Passivo:** Apenas sugere — aluno ignora se quiser
2. **Ativo:** Recomenda com peso alto — mostra como "missão recomendada"
3. **Estrito:** Obriga foco — bloqueia outras matérias até atingir 85%+

**Decisão tomada:** Implementados os 3 modos com constante `TUTOR_MODE` em `tutorEngine.js`

**Motivação:**

- Flexibilidade para diferentes perfis de alunos
- Usuário iniciante se beneficia do modo Estrito
- Usuário avançado prefere Passivo para autonomia
- Ativo como padrão oferece equilíbrio

---

## DEC-004: Métrica de Domínio — Composição Ponderada

**Data:** 2026-03-18

**Problema considerado:** Como medir "domínio real" de uma matéria?

**Opções avaliadas:**

1. Apenas % de acerto (accuracy)
2. Apenas cobertura do edital (cards seen/total)
3. Composição: retenção + acerto + cobertura
4. FSRS stability como proxy

**Decisão tomada:** Composição `D = (R × 0.4) + (A × 0.4) + (C × 0.2)`

**Motivação:**

- Retenção (cards maduros) mede memória real
- Acerto mede qualidade de resposta
- Cobertura mede quanto do edital foi visto
- Pesos 40/40/20 refletem importância relativa

**Revisões futuras:** Validar se pesos estão corretos após uso real. Pode ser necessário ajustar baseado em dados.

---

## DEC-005: PreVoo — Ritual Pré-Estudo

**Data:** 2026-03-18

**Problema considerado:** Antes de estudar cards, o aluno precisa de contexto. Mas como garantir sem ser intrusivo?

**Opções avaliadas:**

1. Modal obrigatório antes de cada sessão
2. Banner compacto no topo da página
3. Página dedicada de "aquecimento"
4. Overlay condicional apenas quando há mapa mental ou notas

**Decisão tomada:** `PreVoo.svelte` como overlay condicional, ativado quando `?topicId=` está na URL. Integra:

- Active Recall (esforço de recuperação)
- Mapa mental PlantUML (toggle)
- Bizus e erros do tópico
- Ritual básico (celular longe, água, foco)

**Motivação:**

- Só aparece quando há contexto relevante (tópico específico)
- Não atrapalha fluxo de revisão rápida
- Enriquecimento pedagógico quando necessário

---

## DEC-006: Fluxo Fechado — Recalcular Após Sessão

**Data:** 2026-03-18

**Problema considerado:** Após uma sessão de estudo, o tutor deve recalcular a próxima missão ou manter o plano original?

**Opções avaliadas:**

1. Plano fixo — recalcula apenas no dia seguinte
2. Recalcula após cada bloco
3. Recalcula apenas ao final da sessão completa
4. Recalcula ao final + mostra "Próxima Missão" na tela de resumo

**Decisão tomada:** Opção 4 — `finishWithRecalc()` no session store. Ao finalizar sessão, recalcula missão e exibe na tela de resumo com opção "Continuar".

**Motivação:**

- Feedback imediato do impacto da sessão
- Encadeamento natural de missões
- Não interrompe sessão no meio (menor carga cognitiva)

---

## DEC-007: PlantUML via API Pública

**Data:** 2026-03-18

**Problema considerado:** Como renderizar mapas mentais PlantUML sem servidor próprio?

**Opções avaliadas:**

1. `plantuml-encoder` + API plantuml.com pública
2. Kroki.io API (tem tier free)
3. `plantuml-encoder` + `@anthropic-ai/plantuml-server` local
4. Editor visual de mapas mentais customizado

**Decisão tomada:** `PlantUMLRenderer.svelte` usa API pública `plantuml.com/plantuml/png/~1{encoded}`. Também criado `TopicMindMapEditor.svelte` para edição integrada.

**Motivação:**

- Sem dependência de servidor próprio
- Funciona imediatamente
- Editor permite criar sem conhecer sintaxe PlantUML

**Revisões futuras:** Para ambiente offline, migrar para Kroki.io ou servidor local.

---

## DEC-008: Supabase como Snapshot (não sync bidirecional)

**Data:** 2026-03-18

**Problema considerado:** Como integrar Supabase para backup cloud?

**Opções avaliadas:**

1. Sync bidirecional real (polling ou subscriptions)
2. Snapshot manual (export/import JSON)
3. Snapshot automático on-change
4. Snapshot apenas no startup e shutdown

**Decisão tomada:** Snapshot table no Supabase com auto-sync on-change e restore on startup quando local vazio.

**Motivação:**

- Simples de implementar
- Adequado para uso individual
- Sem necessidade de resolver conflitos de merge

---

## DEC-009: XP e Gamificação

**Data:** 2026-03-18

**Problema considerado:** Como motivar o aluno com gamificação sem poluir a UX?

**Decisão tomada:**

- XP por resposta: base 10, bônus por rating alto (+5/+2/-3), bônus por velocidade (<10s = +3), streak (+2)
- Nível: `floor(sqrt(totalXP / 100)) + 1`
- Sequência: contador de dias consecutivos com revisões

**Motivação:**

- Fórmulas simples e compreensíveis
- Bônus por qualidade (não apenas quantidade)
- Streak cria hábito sem ser excessivamente punitivo

---

## DEC-010: Benção de Bugfix — Contextualização de Cards

**Data:** 2026-03-18

**Problema:** Cards eram exibidos sem matéria/tópico — violava princípio de encoding contextual.

**Solução:**

- `loadQueueByIds()` agora enriquece cards com `subjectName` e `topicName`
- Banner de contexto no topo da página de estudo
- Bulk lookups paralelos para performance

**Motivação:** Sem contexto, o cérebro não consegue criar ganchos de memória adequados. O estudante precisa saber O QUE está estudando antes de responder.

---

**Última atualização:** 2026-03-18
