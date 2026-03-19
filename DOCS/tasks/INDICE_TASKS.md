# 📋 ÍNDICE DE TASKS — SISTEMÃO / STUDYPRO

**Data de criação:** 2026-03-19  
**Origem:** Auditoria simultânea de 3 agentes especializados (UX/UI · Operacional · Aprendizagem)  
**Padrão de tasks:** Ver [TASK_TEMPLATE.md](./TASK_TEMPLATE.md)

---

## 🎯 Visão Geral por Prioridade

| ID | Título | Categoria | Prioridade | Estimativa | Status |
|---|---|---|---|---|---|
| [TASK-001](./TASK-001_bug-dropdown-materias-cards.md) | Corrigir Dropdown de Matérias Vazio em `/cards` | BUG | 🔴 P0 Crítico | 2h | ⏸️ Pendente |
| [TASK-002](./TASK-002_bug-campo-peso-concatenacao.md) | Corrigir Concatenação no Campo de Peso | BUG | 🔴 P0 Crítico | 1h | ⏸️ Pendente |
| [TASK-003](./TASK-003_ux-rotulos-duplicados-sidebar.md) | Corrigir Rótulos Duplos na Sidebar | BUG · UX | 🟡 P1 Importante | 30min | ⏸️ Pendente |
| [TASK-004](./TASK-004_ux-adicionar-edital-ao-menu.md) | Adicionar `/edital` ao Menu Lateral | UX · OPERACIONAL | 🟡 P1 Importante | 45min | ⏸️ Pendente |
| [TASK-005](./TASK-005_ux-empty-state-dashboard-onboarding.md) | Empty State com CTA no Dashboard | UX · FEATURE | 🟡 P1 Importante | 3h | ⏸️ Pendente |
| [TASK-006](./TASK-006_ux-acoes-destrutivas-confirmacao.md) | Ações Destrutivas com Confirmação Modal | UX | 🟡 P1 Importante | 1h 30min | ⏸️ Pendente |
| [TASK-007](./TASK-007_ux-resumo-sessao-estudo.md) | Resumo ao Finalizar Sessão de Estudo | UX · OPERACIONAL | 🟡 P1 Importante | 2h | ⏸️ Pendente |
| [TASK-008](./TASK-008_pedagogico-modo-feynman.md) | Implementar Modo Feynman | PEDAGÓGICO · FEATURE | 🟢 P2 Evolutivo | 4h | ⏸️ Pendente |
| [TASK-009](./TASK-009_pedagogico-pomodoro-pausas.md) | Timer Pomodoro com Pausas Inteligentes | PEDAGÓGICO · FEATURE | 🟢 P2 Evolutivo | 3h | ⏸️ Pendente |

**Total estimado:** ~17h 45min

---

## 🔴 P0 — Executar Primeiro (Bloqueiam uso do sistema)

> Estas tasks devem ser resolvidas **antes de qualquer outra**. Sem elas, o fluxo principal de estudo está inoperante.

### TASK-001 · Bug crítico · 2h
**Dropdown de Matérias Vazio em `/cards`**  
O seletor de matéria ao criar flashcards está vazio. Impossível criar cards → impossível estudar.  
→ [Ver task completa](./TASK-001_bug-dropdown-materias-cards.md)

### TASK-002 · Bug crítico · 1h
**Concatenação Indevida no Campo de Peso**  
Digitar "10" no peso salva "1010", corrompendo dados de priorização do edital.  
→ [Ver task completa](./TASK-002_bug-campo-peso-concatenacao.md)

---

## 🟡 P1 — Executar em Sequência (Melhoria significativa de UX)

> Podem ser executadas em paralelo dentro do P1, exceto onde há dependência indicada.

### TASK-003 · UX · 30min
**Rótulos Duplos na Sidebar**  
Itens do menu exibem texto duplicado: "Estudo Estudo". Anomalia visual.  
→ [Ver task completa](./TASK-003_ux-rotulos-duplicados-sidebar.md)

### TASK-004 · UX · 45min *(executar com ou após TASK-003 — mesmo arquivo)*
**Adicionar `/edital` ao Menu Lateral**  
A tela mais informativa do sistema está inacessível pelo menu.  
→ [Ver task completa](./TASK-004_ux-adicionar-edital-ao-menu.md)

### TASK-005 · UX · 3h *(recomendado após TASK-001)*
**Empty State com CTA no Dashboard**  
Usuário novo não recebe orientação. Dashboard vazio parece "morto".  
→ [Ver task completa](./TASK-005_ux-empty-state-dashboard-onboarding.md)

### TASK-006 · UX · 1h 30min
**Ações Destrutivas com Modal de Confirmação**  
"Limpar Tudo" e "Exportar Backup" com mesmo estilo. Risco de perda acidental.  
→ [Ver task completa](./TASK-006_ux-acoes-destrutivas-confirmacao.md)

### TASK-007 · UX · 2h *(recomendado após TASK-001)*
**Tela de Resumo ao Finalizar Sessão**  
Botão "FINALIZAR" deixa o usuário em tela vazia sem feedback algum.  
→ [Ver task completa](./TASK-007_ux-resumo-sessao-estudo.md)

---

## 🟢 P2 — Backlog Evolutivo (Alto valor pedagógico)

> Executar após P0 e P1 estarem resolvidos.

### TASK-008 · Pedagógico · 4h
**Modo Feynman**  
Antes de ver a resposta, aluno explica o conceito com suas palavras. Ativa metacognição.  
→ [Ver task completa](./TASK-008_pedagogico-modo-feynman.md)

### TASK-009 · Pedagógico · 3h
**Pomodoro com Sugestão de Pausas**  
A cada 25 min, sistema sugere pausa. Gestão de carga cognitiva respaldada pela ciência.  
→ [Ver task completa](./TASK-009_pedagogico-pomodoro-pausas.md)

---

## 📊 Estatísticas

| Categoria | Quantidade | Estimativa total |
|---|---|---|
| 🔴 Bugs P0 | 2 | 3h |
| 🟡 UX/Operacional P1 | 5 | 7h 45min |
| 🟢 Pedagógico P2 | 2 | 7h |
| **TOTAL** | **9** | **~17h 45min** |

---

## 📐 Padrão de Tasks deste Projeto

Todo novo task deve seguir o template em [TASK_TEMPLATE.md](./TASK_TEMPLATE.md).

**Convenções de nomenclatura:**
```
TASK-NNN_categoria-descricao-curta.md

Exemplos:
  TASK-010_bug-nome-do-bug.md
  TASK-011_ux-melhoria-de-ux.md
  TASK-012_pedagogico-nova-funcao.md
  TASK-013_feature-nova-feature.md
  TASK-014_refatoracao-componente.md
```

**Categorias disponíveis:** `BUG` · `UX` · `OPERACIONAL` · `PEDAGÓGICO` · `REFATORAÇÃO` · `FEATURE`

**Prioridades:**
- 🔴 **P0 — Crítico:** Bloqueia uso do sistema. Executar imediatamente.
- 🟡 **P1 — Importante:** Melhoria significativa. Executar antes da próxima release.
- 🟢 **P2 — Evolutivo:** Feature de alto valor. Backlog planejado.

---

## 🔄 Log de Atualizações

| Data | Ação | Por |
|---|---|---|
| 2026-03-19 15:44 | Índice criado com 9 tasks da auditoria de 3 agentes | Equipe de Auditoria |
