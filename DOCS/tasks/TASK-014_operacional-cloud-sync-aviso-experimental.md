# TASK-014 — Cloud Sync: Aviso de Segurança + “Experimental”

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-014 |
| **Data de criação** | 2026-03-19 |
| **Categoria** | `OPERACIONAL` · `UX` |
| **Prioridade** | 🔴 P0 — Crítico |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 1h 30min |

---

## 🎯 OBJETIVO

Evitar que a UI passe uma sensação falsa de “backup seguro / conta / privacidade”, deixando explícito que:
- é **snapshot**,
- pode ser **experimental**,
- e que, sem Auth/RLS real, não deve ser tratado como “seguro para usuários comuns”.

---

## 🔍 CONTEXTO E PROBLEMA

**Fato técnico relevante (hoje):**
- As policies do Supabase estão abertas para `anon` com `using (true)` e `with check (true)`, permitindo leitura/escrita geral se alguém tiver a anon key (ver `SUPABASE_SETUP.sql`).

**Comportamento atual:**
- Settings mostra “Supabase Connected” e exibe UID, com aparência de confiável.

**Comportamento esperado:**
- Settings renomeia a seção para **“Sincronização na Nuvem (experimental)”**.
- Exibe um “callout de segurança” com linguagem simples, cobrindo:
  - snapshot completo (o que sincroniza),
  - ausência de login/conta,
  - “UID é segredo” (se for a estratégia),
  - recomendação: exportar backup local também.

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/routes/settings/+page.svelte` | `ALTERAR` | Inserir callout e microcopy |
| `SUPABASE_SETUP.sql` | `REFERÊNCIA` | Não alterar nesta task (hardening é outra task) |
| `README.md` | `REFERÊNCIA` | Garantir consistência do texto com a documentação |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Renomear a seção e inserir callout (enabled)

**Arquivo:** `src/routes/settings/+page.svelte`

**O que fazer:**
1. Mudar o título da seção para: `Sincronização na Nuvem (experimental)`.
2. Quando `cloudStatus.enabled === true`, renderizar um callout (ex.: card com borda amarela/laranja) acima dos botões:
   - “O que é sincronizado” (snapshot)
   - “Sem login / sem conta”
   - “Não trate como backup seguro”
   - “Exportar backup local” (CTA para botão existente)
3. Quando `cloudStatus.enabled === false`, manter a mensagem de `.env`, mas adicionar link “Como habilitar” apontando para `README.md` (ou para o futuro hub).

---

### Passo 2 — Revisar microcopy “Supabase Connected”

**Arquivo:** `src/routes/settings/+page.svelte`

**O que fazer:**
- Trocar “Supabase Connected” por texto em pt-BR (ex.: “Supabase conectado”).
- Trocar “UID” por “Chave/ID” (ou manter UID, mas explicar que é segredo).

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Se Cloud Sync estiver habilitado, existe callout de segurança claro.
- [ ] O texto não promete privacidade/conta que não existe.
- [ ] O usuário entende que é **experimental** e que deve exportar backup.
- [ ] Sem erros no console.

---

## 🔗 DEPENDÊNCIAS

- Bloqueia/abre caminho para segurança real: `DOCS/tasks/TASK-021_operacional-cloud-sync-seguro-com-auth.md`.

---

## 🧪 COMO TESTAR

1. Configurar `.env` conforme `README.md` para habilitar cloud.
2. Abrir `/settings`:
   - Callout aparece quando enabled.
   - Textos estão em pt-BR.
3. Remover env vars e reiniciar:
   - Mensagem de “não configurado” aparece + link “Como habilitar”.

