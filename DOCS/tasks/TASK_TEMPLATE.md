# TASK-XXX — [Título Curto e Claro da Tarefa]

> **⚠️ LEIA ANTES DE COMEÇAR:** Siga este template à risca. Não pule seções. Ao concluir, preencha o Registro de Execução e atualize o status.

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-XXX |
| **Data de criação** | AAAA-MM-DD |
| **Criado por** | [Nome do responsável] |
| **Categoria** | `BUG` \| `UX` \| `OPERACIONAL` \| `PEDAGÓGICO` \| `REFATORAÇÃO` \| `FEATURE` |
| **Prioridade** | `🔴 P0 — Crítico` \| `🟡 P1 — Importante` \| `🟢 P2 — Evolutivo` |
| **Status** | `⏸️ Pendente` \| `🔄 Em andamento` \| `✅ Concluída` \| `❌ Cancelada` |
| **Estimativa** | Xh |
| **Responsável** | [Nome ou time] |

---

## 🎯 OBJETIVO

> Descreva em 1–3 frases o que esta task deve alcançar e por que é importante.

[Ex: Corrigir o dropdown de matérias na tela `/cards` que está retornando vazio, impedindo a criação de flashcards.]

---

## 🔍 CONTEXTO E PROBLEMA

> Descreva o problema atual, comportamento observado e impacto.

**Comportamento atual:**
[O que acontece hoje]

**Comportamento esperado:**
[O que deveria acontecer]

**Impacto:**
- [ ] Bloqueia fluxo principal do usuário
- [ ] Perde dados do usuário
- [ ] Causa erro visual/confusão
- [ ] Impede funcionalidade secundária
- [ ] Melhoria de experiência

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/routes/example/+page.svelte` | `ALTERAR` | … |
| `src/lib/stores/example.js` | `VERIFICAR` | … |
| `DOCS/tasks/TASK-XXX.md` | `ATUALIZAR` | Marcar como concluída |

---

## 🛠️ PASSOS DE EXECUÇÃO

> Siga na ordem. Não altere o que não está listado.

### Passo 1 — [Nome do passo]

**Arquivo:** `caminho/do/arquivo.svelte`

**O que fazer:**
[Descrição clara e direta]

```svelte
// Exemplo de código ANTES:
<select bind:value={selectedSubject}>
  <!-- vazio -->
</select>

// Exemplo de código DEPOIS:
<select bind:value={selectedSubject}>
  {#each $subjects as s}
    <option value={s.id}>{s.name}</option>
  {/each}
</select>
```

---

### Passo 2 — [Nome do passo]

**Arquivo:** `caminho/do/outro/arquivo.js`

**O que fazer:**
[Descrição]

---

## ✅ CRITÉRIOS DE ACEITE

> A task só pode ser marcada como **Concluída** se TODOS os itens abaixo estiverem satisfeitos.

- [ ] [Critério 1 — algo verificável e objetivo]
- [ ] [Critério 2]
- [ ] [Critério 3]
- [ ] Sem erros no console do browser
- [ ] Funciona em modo claro e escuro (se UI)
- [ ] Não quebrou nenhuma outra funcionalidade

---

## 🔗 DEPENDÊNCIAS

| Tipo | Referência | Obs |
|---|---|---|
| **Depende de** | TASK-YYY | Esta task precisa que YYY esteja concluída primeiro |
| **Bloqueia** | TASK-ZZZ | ZZZ não pode iniciar enquanto esta estiver pendente |
| **Relacionada** | TASK-AAA | Contexto complementar |

---

## 🧪 COMO TESTAR

> Passos exatos para verificar se a task foi executada com sucesso.

1. Abrir o sistema em `http://localhost:5175/`
2. Navegar até [tela]
3. Realizar a ação [X]
4. Verificar que [resultado esperado]

---

## 📝 REGISTRO DE EXECUÇÃO

> Preenchido por quem executa a task.

| Campo | Valor |
|---|---|
| **Executado por** | — |
| **Data início** | — |
| **Data fim** | — |
| **Tempo real gasto** | — |
| **Status final** | — |

**Observações / Dificuldades encontradas:**
> [Espaço livre para notas de quem executou]

---

## 🔄 HISTÓRICO DE ALTERAÇÕES

| Data | Alteração | Por |
|---|---|---|
| AAAA-MM-DD | Task criada | [Nome] |
