# TASK-018 — Evitar `initializeDatabase()` repetido (flicker)

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-018 |
| **Data de criação** | 2026-03-19 |
| **Categoria** | `PERF` · `REFATORAÇÃO` |
| **Prioridade** | 🟡 P1 — Importante |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 2h |

---

## 🎯 OBJETIVO

Reduzir latência e “flicker” percebido evitando inicialização duplicada do banco/config em várias rotas.

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual:**
- `initializeDatabase()` é chamado no layout **e** em páginas como `/`, `/study`, `/cards`, `/subjects`, `/stats`, `/settings`…
- Isso pode gerar:
  - esperas repetidas,
  - renderizações com `loading` desnecessárias,
  - custos extras de seed/hydrate.

**Comportamento esperado:**
- Um único ponto de inicialização por boot (ou cache por Promise).
- Páginas assumem “db pronta” ou aguardam uma função idempotente.

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/lib/db.js` | `ALTERAR` | Tornar init idempotente (Promise cache) |
| `src/routes/+layout.svelte` | `VERIFICAR` | Manter init central |
| `src/routes/+page.svelte` | `ALTERAR` | Remover init redundante (se possível) |
| `src/routes/study/+page.svelte` | `ALTERAR` | Remover init redundante (se possível) |
| `src/routes/cards/+page.svelte` | `ALTERAR` | Remover init redundante |
| `src/routes/subjects/+page.svelte` | `ALTERAR` | Remover init redundante |
| `src/routes/stats/+page.svelte` | `ALTERAR` | Remover init redundante |
| `src/routes/settings/+page.svelte` | `ALTERAR` | Remover init redundante |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Tornar `initializeDatabase()` idempotente

**Arquivo:** `src/lib/db.js`

**O que fazer:**
1. Criar um cache de Promise no módulo:
   - `let initPromise = null;`
2. Se `initPromise` já existe, retornar ela.
3. Se não existe, setar `initPromise = (async () => { ... })()` com o conteúdo atual.
4. Garantir que erros limpem o cache (para permitir retry):
   - `catch(e) { initPromise = null; throw e; }`

---

### Passo 2 — Centralizar init no layout e remover duplicações

**Arquivos:** `src/routes/+layout.svelte` e páginas que chamam init

**O que fazer:**
- Manter `initializeDatabase()` no layout como “ponto único”.
- Nas páginas:
  - remover chamadas redundantes quando não forem necessárias;
  - quando uma página depende de config, aguardar `configStore.load()` (se isso também for idempotente) ou mover para layout.

> Se alguma página for acessada diretamente antes do layout terminar, a idempotência do Passo 1 garante segurança.

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] A aplicação funciona normalmente ao abrir qualquer rota diretamente.
- [ ] `initializeDatabase()` não executa seed/config múltiplas vezes por navegação.
- [ ] Redução perceptível de “loading” repetido em navegações.
- [ ] Sem regressões em sync cloud e import/export.

---

## 🔗 DEPENDÊNCIAS

- Recomendada após: `DOCS/tasks/TASK-010_ux-navegacao-mobile-e-menu-ativo.md` (para validar navegação rápida sem flicker).

---

## 🧪 COMO TESTAR

1. `npm run dev`
2. Abrir diretamente:
   - `/study`, `/cards`, `/subjects`, `/settings`
3. Navegar entre páginas e observar:
   - ausência de “loading” desnecessário
4. Rodar:
   - `npm run test`
   - `npm run check`

