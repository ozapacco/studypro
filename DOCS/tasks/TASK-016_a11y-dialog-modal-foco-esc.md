# TASK-016 — Dialog/Modal Acessível (foco, ESC, aria)

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-016 |
| **Data de criação** | 2026-03-19 |
| **Categoria** | `A11Y` · `REFATORAÇÃO` |
| **Prioridade** | 🟡 P1 — Importante |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 2h 30min |

---

## 🎯 OBJETIVO

Padronizar modais/overlays com semântica de dialog e controle de foco:
- `role="dialog"`, `aria-modal="true"`,
- foco inicial no modal,
- `ESC` fecha,
- Tab não “vaza” para trás (focus trap simples),
- overlay clicável opcional (com segurança em ações destrutivas).

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual:**
- Existem modais/overlays implementados diretamente em páginas (ex.: confirmação em settings) sem semântica e gestão de foco.

**Comportamento esperado:**
- Um componente `Dialog.svelte` reutilizável em `src/lib/components/common/`.
- Páginas usam esse componente para confirmações e overlays.

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/lib/components/common/Dialog.svelte` | `CRIAR` | Novo componente |
| `src/routes/settings/+page.svelte` | `ALTERAR` | Migrar confirmação “Limpar Tudo” para `Dialog` |
| `src/routes/study/+page.svelte` | `VERIFICAR` | Overlays existentes (avaliar migração em follow-up) |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Criar `Dialog.svelte`

**Arquivo:** `src/lib/components/common/Dialog.svelte`

**Requisitos mínimos:**
- Props sugeridas:
  - `open` (boolean)
  - `title` (string) ou `ariaLabelledby`
  - `onClose` (função)
  - `closeOnBackdrop` (default: true; para destrutivas, pode ser false)
- Estrutura:
  - Backdrop: `div` full-screen
  - Panel: `div role="dialog" aria-modal="true" aria-labelledby=...`
- A11y:
  - Ao abrir: focar no primeiro elemento focável do dialog (ou no botão “Cancelar”).
  - `ESC`: chama `onClose`.
  - Focus trap simples:
    - capturar `Tab` e manter foco dentro do panel.

---

### Passo 2 — Migrar confirmação “Limpar Tudo” em settings

**Arquivo:** `src/routes/settings/+page.svelte`

**O que fazer:**
- Substituir o markup do modal manual por `Dialog`.
- Garantir que:
  - “Cancelar” recebe foco inicial,
  - “Sim, apagar tudo” permanece ação destrutiva (estilo danger),
  - backdrop click fecha apenas se `closeOnBackdrop === true`.

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Modal tem `role="dialog"` e `aria-modal="true"`.
- [ ] Ao abrir, foco está dentro do modal.
- [ ] `ESC` fecha.
- [ ] Tab não sai do modal.
- [ ] Funciona em dark mode.

---

## 🔗 DEPENDÊNCIAS

- Relacionada: `DOCS/tasks/TASK-018_perf-deduplicar-initializeDatabase.md` (reduz “flicker” que piora overlays).

---

## 🧪 COMO TESTAR

1. `npm run dev`
2. Abrir `/settings` e acionar “Limpar Tudo”.
3. Verificar:
   - foco inicial no “Cancelar”
   - Tab cicla apenas dentro do modal
   - ESC fecha

