# TASK-011 — Tornar `Card` Clicável Acessível (Teclado/Foco)

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-011 |
| **Data de criação** | 2026-03-19 |
| **Categoria** | `A11Y` · `REFATORAÇÃO` |
| **Prioridade** | 🔴 P0 — Crítico |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 1h |

---

## 🎯 OBJETIVO

Quando `Card` estiver com `clickable={true}`, ele deve ser **focável**, **ativável por teclado (Enter/Espaço)** e com **foco visível**, sem quebrar uso atual.

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual:**
- `Card` usa `<div on:click role="button">` quando clicável, mas:
  - não possui `tabindex="0"`;
  - não trata teclado (`keydown`);
  - não tem estilo de foco consistente.

**Comportamento esperado:**
- Card clicável funciona com mouse e teclado.
- Card não clicável continua sendo apenas container (sem role/tabindex).

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/lib/components/common/Card.svelte` | `ALTERAR` | Implementar teclado + foco visível |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Adicionar foco e teclado apenas quando `clickable`

**Arquivo:** `src/lib/components/common/Card.svelte`

**O que fazer:**
1. Se `clickable`:
   - adicionar `tabindex="0"`;
   - manter `role="button"`;
   - implementar `on:keydown`:
     - `Enter` e `Space` devem disparar a mesma ação do click.
     - Para `Space`, prevenir scroll (`event.preventDefault()`).
2. Se **não** clicável:
   - `role` deve ser `undefined`;
   - `tabindex` deve ser `undefined`;
   - não adicionar handler de teclado.

**Direção (pseudocódigo):**
```svelte
function onKeydown(event) {
  if (!clickable) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    event.currentTarget?.click?.();
  }
}
```

---

### Passo 2 — Foco visível (sem poluir quando não clicável)

**Arquivo:** `src/lib/components/common/Card.svelte`

**O que fazer:**
- Quando `clickable`, adicionar classes de foco:
  - `focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500` (ou equivalente no design system).
- Garantir que o foco apareça também em dark mode.

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] `Card` com `clickable={true}` entra no Tab.
- [ ] `Enter` e `Espaço` ativam o click.
- [ ] Foco é visível (desktop e dark mode).
- [ ] `Card` sem `clickable` não entra no Tab e não tem `role`.
- [ ] Sem warnings A11y no console.

---

## 🔗 DEPENDÊNCIAS

- Recomendada após: `DOCS/tasks/TASK-010_ux-navegacao-mobile-e-menu-ativo.md` (padronização de foco/teclado no app).

---

## 🧪 COMO TESTAR

1. `npm run dev`
2. Abrir telas que usam cards clicáveis (ex.: `src/routes/stats/+page.svelte`, `src/routes/edital/+page.svelte`).
3. Tab até um card clicável:
   - foco aparece
   - Enter dispara a ação
   - Espaço dispara a ação (sem rolar a página)

