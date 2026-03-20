# TASK-001 — Corrigir Dropdown de Matérias Vazio em `/cards`

> **⚠️ LEIA ANTES DE COMEÇAR:** Esta é a tarefa de maior impacto no sistema. Sem ela, nenhum flashcard pode ser criado e toda a cadeia de estudo fica quebrada.

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-001 |
| **Data de criação** | 2026-03-19 |
| **Criado por** | Equipe de Auditoria (3 Agentes) |
| **Categoria** | `BUG` |
| **Prioridade** | 🔴 P0 — Crítico |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 2h |
| **Responsável** | — |

---

## 🎯 OBJETIVO

Corrigir o `<select>` de seleção de matéria na tela de criação de flashcards (`/cards`) que aparece **completamente vazio**, impedindo a criação de qualquer card.

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual:**
Ao acessar `/cards` e tentar criar um novo flashcard, o campo `<select>` de "Matéria" está vazio — não lista nenhuma matéria, mesmo quando existem matérias cadastradas no sistema (visíveis em `/subjects`). O formulário inteiro fica inutilizável.

**Comportamento esperado:**
O `<select>` de matéria deve carregar e exibir todas as matérias existentes no `subjectsStore`, permitindo que o usuário escolha a matéria antes de criar o card.

**Impacto:**
- [x] Bloqueia fluxo principal do usuário
- [ ] Perde dados do usuário
- [x] Causa erro visual/confusão
- [ ] Impede funcionalidade secundária

**Cascata do bug:**
```
/cards (dropdown vazio)
  → Não pode criar cards
    → /study carrega com "CARREGANDO FLUXO..." infinito
      → Sessão de estudo nunca inicia
        → Sistema inteiro travado para usuário novo
```

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/routes/cards/+page.svelte` | `ALTERAR` | Verificar import e subscribe do subjectsStore |
| `src/lib/stores/subjects.js` | `VERIFICAR` | Confirmar que o store exporta os dados corretamente |
| `src/lib/db.js` | `VERIFICAR` | Verificar se a query de subjects retorna dados |
| `DOCS/tasks/TASK-001.md` | `ATUALIZAR` | Marcar como concluída ao fim |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Diagnosticar a causa raiz

Abrir `src/routes/cards/+page.svelte` e verificar:

1. O store `subjectsStore` (ou equivalente) está sendo importado?
2. A variável reativa está sendo criada com `$subjectsStore` ou com `subscribe`?
3. O `<select>` está iterando sobre a variável correta?

Abrir o console do browser em `/cards` e verificar:
- Há erros de `undefined` ou `null` na variável de subjects?
- O store está sendo inicializado antes do componente montar?

---

### Passo 2 — Corrigir o import e binding do store

**Arquivo:** `src/routes/cards/+page.svelte`

**Problema provável:** Store não importado ou iteração sobre variável errada.

```svelte
<!-- VERIFICAR se existe este import no topo do <script>: -->
import { subjectsStore } from '$lib/stores/subjects.js';

<!-- VERIFICAR se o select está usando a variável reativa correta: -->

<!-- ❌ ERRADO (exemplo de causa possível): -->
<select bind:value={selectedSubject}>
  {#each subjects as s}    <!-- 'subjects' pode ser undefined -->
    <option value={s.id}>{s.name}</option>
  {/each}
</select>

<!-- ✅ CORRETO: -->
<select bind:value={selectedSubject}>
  {#each $subjectsStore as s}
    <option value={s.id}>{s.name}</option>
  {/each}
</select>
```

---

### Passo 3 — Garantir que o store carrega antes do render

Se o store usa carregamento assíncrono, adicione um guard:

```svelte
{#if $subjectsStore.length === 0}
  <option disabled value="">Nenhuma matéria cadastrada — vá em Matérias primeiro</option>
{:else}
  {#each $subjectsStore as s}
    <option value={s.id}>{s.name}</option>
  {/each}
{/if}
```

---

### Passo 4 — Testar persistence entre rotas

1. Criar uma matéria em `/subjects`
2. Navegar para `/cards` sem recarregar a página
3. Verificar se o dropdown agora aparece populado

Se só funcionar após reload, o problema está na **inicialização do store** — verificar se `/subjects` inicializa o store e se esse estado persiste ao navegar para `/cards`.

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] O `<select>` de matéria em `/cards` exibe todas as matérias cadastradas em `/subjects`
- [ ] O formulário de criação de card funciona end-to-end (selecionar matéria → tópico → frente → verso → salvar)
- [ ] O card criado aparece na lista de cards da tela `/cards`
- [ ] Ao navegar de `/subjects` para `/cards`, o dropdown já está populado
- [ ] Sem erros no console do browser
- [ ] Após criar o card, a sessão de estudo em `/study` consegue carregar o fluxo

---

## 🔗 DEPENDÊNCIAS

| Tipo | Referência | Obs |
|---|---|---|
| **Bloqueia** | TASK-002 | Sessão de estudo depende de cards existentes |
| **Relacionada** | TASK-003 | Fluxo de finalização de estudo |

---

## 🧪 COMO TESTAR

1. Abrir `http://localhost:5175/`
2. Ir para `/subjects` e confirmar que existem matérias cadastradas (ou criar uma)
3. Navegar para `/cards`
4. Abrir o `<select>` de matéria no formulário de novo card
5. ✅ **Esperado:** Lista de matérias aparece no dropdown
6. Selecionar uma matéria, preencher os campos e clicar em "Criar"
7. ✅ **Esperado:** Card aparece na lista abaixo do formulário
8. Ir para `/study` → Iniciar sessão
9. ✅ **Esperado:** Cards carregam no fluxo de estudo

---

## 📝 REGISTRO DE EXECUÇÃO

| Campo | Valor |
|---|---|
| **Executado por** | — |
| **Data início** | — |
| **Data fim** | — |
| **Tempo real gasto** | — |
| **Status final** | — |

**Observações:**
> —

---

## 🔄 HISTÓRICO DE ALTERAÇÕES

| Data | Alteração | Por |
|---|---|---|
| 2026-03-19 | Task criada após auditoria de 3 agentes | Equipe de Auditoria |
