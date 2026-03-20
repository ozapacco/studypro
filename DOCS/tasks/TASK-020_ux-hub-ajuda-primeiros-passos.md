# TASK-020 — Hub de Ajuda / Primeiros Passos (linkável)

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-020 |
| **Data de criação** | 2026-03-19 |
| **Categoria** | `UX` · `PEDAGÓGICO` |
| **Prioridade** | 🟢 P2 — Evolutivo |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 3h |

---

## 🎯 OBJETIVO

Criar um ponto único e linkável de ajuda (“Primeiros passos”) para consolidar explicações e reduzir repetição de microcopy espalhada.

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual:**
- Ajuda e explicações ficam dispersas em toasts, placeholders e pequenos textos.
- Usuário não tem um lugar para “entender o sistema” quando travar.

**Comportamento esperado:**
- Criar rota `/help` com:
  - “Primeiros passos” (passos 1–5)
  - “Como funciona a missão / tutor”
  - “O que significam estados do card”
  - “Backup e nuvem (com avisos)”
- Link em Settings (e opcionalmente no layout).

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/routes/help/+page.svelte` | `CRIAR` | Nova rota |
| `src/routes/+layout.svelte` | `ALTERAR` | Adicionar link “Ajuda” (opcional) |
| `src/routes/settings/+page.svelte` | `ALTERAR` | Link “Primeiros passos” |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Criar a página `/help`

**Arquivo:** `src/routes/help/+page.svelte`

**O que fazer:**
- Conteúdo inicial enxuto (máx. 1 tela, com seções colapsáveis):
  1. **Primeiros passos**:
     - Configurar prova (Ajustes)
     - Cadastrar matérias e tópicos
     - Criar cards
     - Iniciar uma missão no Estudo
     - Acompanhar Stats/Edital
  2. **Tutor**:
     - modos + recomendado
  3. **Cloud/Backup**:
     - diferença de snapshot vs backup local
- Incluir links diretos para as rotas (`/settings`, `/subjects`, `/cards`, `/study`).

---

### Passo 2 — Linkar o hub de lugares estratégicos

**Arquivos:** `src/routes/settings/+page.svelte` (e opcional `src/routes/+layout.svelte`)

**O que fazer:**
- Inserir um botão/link “Primeiros passos / Ajuda” em Settings.
- Opcional: no layout, adicionar um item/ícone de ajuda (principalmente útil no mobile depois da TASK-010).

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Existe rota `/help` com conteúdo útil e curto.
- [ ] Há link acessível para `/help` em Settings.
- [ ] Conteúdo funciona no mobile.

---

## 🔗 DEPENDÊNCIAS

- Recomendada após: `DOCS/tasks/TASK-010_ux-navegacao-mobile-e-menu-ativo.md` (ajuda precisa ser encontrável no mobile).

---

## 🧪 COMO TESTAR

1. `npm run dev`
2. Abrir `/help` e clicar em todos os links.
3. Verificar layout mobile (DevTools).

