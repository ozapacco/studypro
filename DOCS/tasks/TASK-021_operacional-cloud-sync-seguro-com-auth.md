# TASK-021 — Cloud Sync seguro (Supabase Auth + RLS real)

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-021 |
| **Data de criação** | 2026-03-19 |
| **Categoria** | `OPERACIONAL` · `ARQUITETURA` |
| **Prioridade** | 🟢 P2 — Evolutivo |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 6h |

---

## 🎯 OBJETIVO

Transformar o “Cloud Sync” em algo realmente seguro para usuários comuns:
- login (Supabase Auth),
- RLS restringindo leitura/escrita por usuário (`auth.uid()`),
- remover dependência de “UID secreto”.

---

## 🔍 CONTEXTO E PROBLEMA

**Situação atual (não segura):**
- `SUPABASE_SETUP.sql` cria policies para `anon` com `using (true)` / `with check (true)`.
- Com isso, quem tiver o anon key pode ler/escrever snapshots (dependendo do endpoint e configuração).

**Resultado desejado:**
- Acesso por usuário autenticado.
- Policies RLS por `auth.uid()`.

> Esta task é intencionalmente P2 porque envolve produto (conta/login) e mudanças de arquitetura.

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `SUPABASE_SETUP.sql` | `ALTERAR` | Migrar owner_id para uuid/auth |
| `src/lib/cloud/sync.js` | `ALTERAR` | Passar token/auth; ajustar payload |
| `src/routes/settings/+page.svelte` | `ALTERAR` | UI de login/conectar |
| `README.md` | `ALTERAR` | Setup com Auth |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Definir modelo de conta (mínimo viável)

**Decisão necessária:**
- Email magic link? OAuth? Anônimo? (Supabase suporta “anonymous sign-in” também).

**Recomendação para MVP:**
- Email + magic link (mais simples) OU OAuth Google (menor fricção).

---

### Passo 2 — Alterar schema e RLS

**Arquivo:** `SUPABASE_SETUP.sql`

**O que fazer:**
1. Trocar `owner_id text` por `owner_id uuid` (ou adicionar coluna nova e migrar).
2. Criar policies:
   - SELECT: `owner_id = auth.uid()`
   - INSERT/UPDATE/DELETE: `owner_id = auth.uid()`
3. Remover policies abertas para `anon`.

---

### Passo 3 — Implementar Auth no app

**Arquivos:** `src/lib/cloud/sync.js`, `src/routes/settings/+page.svelte`

**O que fazer:**
- Implementar login/logout.
- Exibir status do usuário (logado/deslogado).
- Somente habilitar sync quando logado.

---

### Passo 4 — Ajustar UX e documentação

**Arquivos:** `src/routes/settings/+page.svelte`, `README.md`

**O que fazer:**
- Remover linguagem de “UID segredo”.
- Documentar setup end-to-end.

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Usuário precisa estar autenticado para sincronizar.
- [ ] RLS impede acesso entre usuários.
- [ ] Sync/restore funciona e não perde dados.
- [ ] Documentação atualizada.

---

## 🔗 DEPENDÊNCIAS

- Recomendada após: `DOCS/tasks/TASK-014_operacional-cloud-sync-aviso-experimental.md` (avisos e linguagem correta).

---

## 🧪 COMO TESTAR

1. Criar 2 contas no Supabase Auth.
2. Usuário A sincroniza dados.
3. Usuário B tenta restaurar snapshot do A:
   - deve falhar (sem acesso).
4. Usuário A restaura:
   - deve funcionar.

