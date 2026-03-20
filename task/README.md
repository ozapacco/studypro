# 📋 Tasks - Sistemão

Tarefas de refatoração e melhoria identificadas pelos agentes forenses.

## Estrutura

```
task/
├── high/       # Prioridade Alta (6 tasks)
├── medium/     # Prioridade Média (7 tasks)
├── low/        # Prioridade Baixa (5 tasks)
└── README.md
```

## Sumário

| Prioridade | Qtd    | Tempo Est.    |
| ---------- | ------ | ------------- |
| 🔴 High    | 6      | ~25 horas     |
| 🟡 Medium  | 7      | ~25 horas     |
| 🟢 Low     | 5      | ~12 horas     |
| **Total**  | **18** | **~62 horas** |

## Prioridade Alta (High)

| #   | Task                                                      | Complexidade | Arquivos                        |
| --- | --------------------------------------------------------- | ------------ | ------------------------------- |
| 01  | [Mobile Navigation](./high/01-mobile-navigation.md)       | Média        | `+layout.svelte`                |
| 02  | [Schema Validation (Zod)](./high/02-schema-validation.md) | Alta         | `stores/*.js`                   |
| 03  | [Empty States com CTAs](./high/03-empty-states-cta.md)    | Baixa        | pages, `EmptyState.svelte`      |
| 04  | [Mutex/Lock Pattern](./high/04-mutex-lock.md)             | Alta         | `session.js`, `sync.js`         |
| 05  | [Confirm Dialog Estilizado](./high/05-confirm-dialog.md)  | Média        | `ConfirmDialog.svelte`          |
| 06  | [Sync Merge Strategy](./high/06-sync-merge-strategy.md)   | Muito Alta   | `sync.js`, `mergeStrategies.js` |

## Prioridade Média (Medium)

| #   | Task                                                                 | Complexidade |
| --- | -------------------------------------------------------------------- | ------------ |
| 07  | [Refatorar session.js](./medium/07-refactor-session-store.md)        | Muito Alta   |
| 08  | [Corrigir N+1 Queries](./medium/08-fix-n-plus-1-queries.md)          | Média        |
| 09  | [Consolidar Defaults](./medium/09-consolidate-defaults.md)           | Média        |
| 10  | [Memory Leak ui.js](./medium/10-fix-memory-leak.md)                  | Baixa        |
| 11  | [Magic Numbers → Constantes](./medium/11-magic-numbers-constants.md) | Média        |
| 12  | [Melhorar Toast System](./medium/12-improve-toast-system.md)         | Média        |
| 13  | [Error Boundaries](./medium/13-error-boundaries.md)                  | Média        |

## Prioridade Baixa (Low)

| #   | Task                                                           | Complexidade |
| --- | -------------------------------------------------------------- | ------------ |
| 01  | [Padronizar Nomenclatura](./low/01-nomenclature-standard.md)   | Baixa        |
| 02  | [Keyboard Shortcuts](./low/02-keyboard-shortcuts.md)           | Média        |
| 03  | [Auto-save Indicator](./low/03-auto-save-indicator.md)         | Média        |
| 04  | [Índices Compostos Dexie](./low/04-dexie-compound-indexes.md)  | Baixa        |
| 05  | [Granular Loading States](./low/05-granular-loading-states.md) | Baixa        |

---

## Como Usar

1. Escolha uma task pela prioridade
2. Leia o arquivo `.md` correspondente
3. Execute os critérios de aceite
4. Marque os checkboxes ao completar

## Dica de Execução

Recomenda-se executar na ordem:

1. Tasks de **High** primeiro (maior impacto)
2. Dentro de cada nível, começar pelas **mais simples** para ganhar momentum
3. Tasks dependentes têm notas sobre dependências

---

_Gerado em Thu Mar 19 2026_
_Fonte: Análise Forense de 3 Agentes Especializados_
