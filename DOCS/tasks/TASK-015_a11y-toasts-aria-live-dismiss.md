# TASK-015 — Toasts Acessíveis (aria-live + fechar)

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-015 |
| **Data de criação** | 2026-03-19 |
| **Categoria** | `A11Y` · `UX` |
| **Prioridade** | 🟡 P1 — Importante |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 1h |

---

## 🎯 OBJETIVO

Tornar toasts acessíveis e controláveis:
- Anúncio para leitores de tela (`aria-live`),
- Possibilidade de fechar (dismiss),
- Evitar que feedback “passe batido”.

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual:**
- Toasts são apenas `div`s no layout, sem `aria-live`.
- Não há botão de fechar, apesar de existir `uiStore.dismissToast(id)`.

**Comportamento esperado:**
- Container dos toasts com `aria-live="polite"` e `aria-relevant="additions text"`.
- Cada toast pode ser fechado via botão (X), com `aria-label`.
- Toast de erro deve anunciar imediatamente (`role="alert"`).

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/routes/+layout.svelte` | `ALTERAR` | Render e semântica dos toasts |
| `src/lib/stores/ui.js` | `REUTILIZAR` | Já possui `dismissToast` |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Adicionar `aria-live` e close button por toast

**Arquivo:** `src/routes/+layout.svelte`

**O que fazer:**
1. Envolver a lista de toasts em um container com:
   - `aria-live="polite"`
   - `aria-relevant="additions text"`
2. Para cada toast:
   - adicionar botão de fechar chamando `uiStore.dismissToast(item.id)`;
   - definir `role` por tipo:
     - `error`/`warning`: `role="alert"`
     - `info`/`success`: `role="status"`

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Toasts são anunciados (aria-live).
- [ ] Cada toast tem botão “Fechar” acessível.
- [ ] Toast de erro usa `role="alert"`.
- [ ] Sem quebra visual em dark mode.

---

## 🔗 DEPENDÊNCIAS

- Recomendada com: `DOCS/tasks/TASK-016_a11y-dialog-modal-foco-esc.md` (padrão de componentes acessíveis).

---

## 🧪 COMO TESTAR

1. Disparar um toast (ex.: salvar settings).
2. Verificar:
   - botão de fechar remove o toast
   - tipos diferentes aplicam roles corretos

