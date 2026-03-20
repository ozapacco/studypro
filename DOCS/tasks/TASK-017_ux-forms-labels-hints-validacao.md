# TASK-017 — Forms com Labels/Hints (Cards/Matérias)

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-017 |
| **Data de criação** | 2026-03-19 |
| **Categoria** | `UX` · `REFATORAÇÃO` |
| **Prioridade** | 🟡 P1 — Importante |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 2h |

---

## 🎯 OBJETIVO

Melhorar clareza e reduzir erros em criação/edição:
- substituir dependência de placeholder por **labels**,
- adicionar **hints** curtos (1 linha),
- padronizar mensagens de validação (pt-BR, acentos).

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual (exemplos):**
- Cards: campos dependem de placeholder e validação usa toast genérico (“Preencha frente, materia e topico.”).
- Matérias: “Nome da materia” e “Peso no edital (%)” sem label/hint; termos sem acento.

**Comportamento esperado:**
- Cada campo tem `<label for=...>` e `id`.
- Hints curtos e específicos (ex.: o que significa “peso”).
- Mensagens de erro apontam exatamente o campo faltante.

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/routes/cards/+page.svelte` | `ALTERAR` | Labels + hints + validação |
| `src/routes/subjects/+page.svelte` | `ALTERAR` | Labels + hints + microcopy |
| `src/app.css` | `VERIFICAR` | Estilos `.input` e espaçamentos |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Cards: labels + validação específica

**Arquivo:** `src/routes/cards/+page.svelte`

**O que fazer:**
1. Adicionar `id` e `<label>` para:
   - tipo do card
   - matéria
   - tópico
   - frente/pergunta
   - verso/explicação
2. Substituir o toast genérico de validação por mensagens direcionadas:
   - “Selecione uma matéria.”
   - “Selecione um tópico.”
   - “Preencha a frente do card.”
3. Corrigir microcopy (acentos):
   - “matéria”, “tópico”, “questão”, “revisão”.

---

### Passo 2 — Matérias: labels + hint do peso

**Arquivo:** `src/routes/subjects/+page.svelte`

**O que fazer:**
1. Adicionar `<label>` para nome, peso e cor.
2. Adicionar hint do peso:
   - Ex.: “Peso (%) define prioridade no tutor e no edital.”
3. Corrigir microcopy:
   - “Matérias”, “matéria”, “proficiência”, “introdução”.

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Campos principais têm labels (não só placeholder).
- [ ] Validação indica o próximo passo com clareza.
- [ ] Microcopy em pt-BR com acentos consistentes.
- [ ] Sem regressão visual.

---

## 🔗 DEPENDÊNCIAS

- Recomendada com: `DOCS/tasks/TASK-015_a11y-toasts-aria-live-dismiss.md` (feedback de validação via toast deve ser acessível).

---

## 🧪 COMO TESTAR

1. Abrir `/subjects`:
   - criar matéria
   - verificar labels/hints
2. Abrir `/cards`:
   - tentar criar card com campos faltando → mensagens corretas
   - criar card completo → sucesso

