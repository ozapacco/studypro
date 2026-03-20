# TASK-010 — Navegação Mobile + Estado Ativo no Menu Global

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-010 |
| **Data de criação** | 2026-03-19 |
| **Categoria** | `UX` · `A11Y` |
| **Prioridade** | 🔴 P0 — Crítico |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 2h 30min |

---

## 🎯 OBJETIVO

Garantir que o usuário consiga navegar no sistema **no mobile** e entenda **onde está** (estado ativo), com acessibilidade básica (`aria-current`, foco visível).

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual:**
- A navegação principal só existe como sidebar desktop (`hidden md:flex`) e some no mobile.
- Links do menu não apresentam estado “ativo”; o usuário perde orientação (“onde estou?”).

**Comportamento esperado:**
- Em telas pequenas, exibir uma navegação mobile (recomendado: **bottom nav**) com os principais itens.
- Em desktop, manter sidebar, mas com estado ativo e `aria-current="page"`.
- Em ambos: foco visível e sem sobreposição do conteúdo (main com padding adequado).

**Impacto:**
- Bloqueia navegação no mobile (abandono rápido).
- Dificulta onboarding (“agora vá em Ajustes…”) por falta de orientação.

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/routes/+layout.svelte` | `ALTERAR` | Menu desktop + criar nav mobile + estado ativo |
| `src/app.css` | `VERIFICAR` | Caso seja necessário ajustar safe-area/padding global |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Derivar rota atual e aplicar estado ativo (desktop)

**Arquivo:** `src/routes/+layout.svelte`

**O que fazer:**
1. Importar `page` de `$app/stores`.
2. Criar função utilitária `isActive(href)` para comparar com `$page.url.pathname`.
   - Regra simples: `href === '/'` só ativa em `'/'`.
   - Para rotas com prefixo: `pathname.startsWith('/study')`, etc.
3. No link do menu, aplicar:
   - `aria-current={isActive(item.href) ? 'page' : undefined}`
   - classes ativas (ex.: bg/foreground + indicador) quando ativo.
4. Garantir foco visível em links (`focus-visible:ring` ou equivalente).

**Exemplo (direção):**
```svelte
import { page } from '$app/stores';

function isActive(href) {
  const path = $page.url.pathname;
  if (href === '/') return path === '/';
  return path === href || path.startsWith(`${href}/`);
}
```

---

### Passo 2 — Implementar navegação mobile (bottom nav)

**Arquivo:** `src/routes/+layout.svelte`

**O que fazer:**
1. Criar uma `<nav class="md:hidden ...">` fixa no bottom (`fixed bottom-0 inset-x-0`).
2. Reaproveitar `navItems` com `icon` + `label` (ou adicionar `icon` caso ainda não exista).
3. Garantir área clicável confortável (mínimo ~44px de altura por item).
4. Aplicar o mesmo estado ativo do Passo 1.
5. Ajustar o `<main>` para não ficar “por baixo” da bottom nav:
   - Opção A: adicionar `pb-20` no container do `<main>` apenas em mobile.
   - Opção B: envolver slot com padding condicional via store `isMobile`.
6. Tratar “safe area” (iPhone) se necessário:
   - usar padding-bottom extra: `pb-[calc(…+env(safe-area-inset-bottom))]` (quando suportado).

**Checklist de A11y:**
- `aria-label="Navegação principal"` na `<nav>`.
- Cada item é `<a>` (não `div`) com texto visível (mesmo que pequeno).
- `aria-current="page"` no item ativo.

---

### Passo 3 — Garantir que o layout não degrade o desktop

**Arquivo:** `src/routes/+layout.svelte`

**O que fazer:**
- Confirmar que a sidebar continua funcionando em `md+`.
- Confirmar que a bottom nav só aparece em `< md`.

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Em largura < 768px, existe navegação visível e funcional (bottom nav).
- [ ] Em largura ≥ 768px, sidebar permanece funcional.
- [ ] Item ativo fica destacado e tem `aria-current="page"` (desktop e mobile).
- [ ] O conteúdo não fica escondido atrás da bottom nav.
- [ ] Navegação funciona via teclado (Tab/Enter) e foco é visível.
- [ ] Sem erros no console.

---

## 🔗 DEPENDÊNCIAS

- Relacionada: `DOCS/tasks/completed/TASK-003_ux-rotulos-duplicados-sidebar.md` (se ainda existir problema visual no menu).
- Recomendada antes de P2: `DOCS/tasks/TASK-020_ux-hub-ajuda-primeiros-passos.md` (help precisa ser encontrável no mobile).

---

## 🧪 COMO TESTAR

1. `npm run dev`
2. Abrir `http://localhost:5175/` (ou a porta exibida pelo Vite).
3. Teste desktop:
   - Navegar por `/`, `/study`, `/cards`, `/subjects`, `/stats`, `/edital`, `/settings`.
   - Verificar highlight do item ativo.
4. Teste mobile (DevTools em 390×844 ou similar):
   - Confirmar bottom nav visível.
   - Clicar em todos os itens.
   - Confirmar que o conteúdo não fica coberto.
5. Teclado:
   - Tab até o menu e navegar apenas com Enter.

