# TASK-002 — Corrigir Concatenação Indevida no Campo de Peso em `/subjects`

> **⚠️ LEIA ANTES DE COMEÇAR:** Bug de dados — ao editar o peso de uma matéria, o sistema concatena o novo valor ao antigo, corrompendo os dados de priorização do edital.

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-002 |
| **Data de criação** | 2026-03-19 |
| **Criado por** | Equipe de Auditoria (3 Agentes) |
| **Categoria** | `BUG` |
| **Prioridade** | 🔴 P0 — Crítico |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 1h |
| **Responsável** | — |

---

## 🎯 OBJETIVO

Corrigir o campo de "Peso" em `/subjects` que, ao receber um valor numérico, concatena o novo valor ao valor anterior (digitando "10" resulta em "1010%"), corrompendo os dados de priorização de matérias.

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual:**
Ao editar o campo de peso de uma matéria em `/subjects`:
- Digitar "10" no campo resulta no valor "1010" sendo salvo
- O sistema parece estar somando o novo input ao valor existente sem limpar o campo primeiro
- Isso gera a exibição "1010%" na lista de matérias

**Comportamento esperado:**
O campo deve aceitar o valor digitado como um número limpo, substituindo o valor anterior completamente.

**Impacto:**
- [ ] Bloqueia fluxo principal do usuário
- [x] Perde dados do usuário (dados de peso corrompidos)
- [x] Causa erro visual/confusão
- [ ] Impede funcionalidade secundária

**Cascata do bug:**
```
Peso corrompido (ex: "1010")
  → ROI Strategy List calcula prioridade errada
    → Tutor Engine sugere matérias erradas
      → Sessão de estudo não otimizada
```

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/routes/subjects/+page.svelte` | `ALTERAR` | Localizar o input de peso e corrigir o binding |
| `src/lib/stores/subjects.js` | `VERIFICAR` | Verificar se a função de update usa replace ou concat |
| `src/lib/db.js` | `VERIFICAR` | Verificar função de update de matéria |
| `DOCS/tasks/TASK-002.md` | `ATUALIZAR` | Marcar como concluída ao fim |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Localizar o input de peso

**Arquivo:** `src/routes/subjects/+page.svelte`

Buscar por: `peso`, `weight`, `input type="number"`, ou o campo de edição de matéria.

---

### Passo 2 — Identificar a causa da concatenação

**Causas prováveis:**

**Causa A — Bind em string em vez de number:**
```svelte
<!-- ❌ ERRADO: bind em string concatena -->
<input type="text" bind:value={subject.weight} />

<!-- ✅ CORRETO: garantir tipo numérico -->
<input type="number" bind:value={subject.weight} min="0" max="100" step="1" />
```

**Causa B — Handler acumula valor:**
```javascript
// ❌ ERRADO:
function updateWeight(id, newValue) {
  subjects = subjects.map(s =>
    s.id === id ? { ...s, weight: s.weight + newValue } : s  // concatena!
  )
}

// ✅ CORRETO:
function updateWeight(id, newValue) {
  subjects = subjects.map(s =>
    s.id === id ? { ...s, weight: Number(newValue) } : s  // substitui
  )
}
```

**Causa C — Input não limpa ao focar:**
```svelte
<!-- ✅ Adicionar: seleciona o conteúdo ao focar para facilitar substituição -->
<input
  type="number"
  bind:value={subject.weight}
  on:focus={(e) => e.target.select()}
  min="0" max="100"
/>
```

---

### Passo 3 — Garantir conversão de tipo antes de salvar

**Arquivo:** `src/lib/stores/subjects.js` ou equivalente

```javascript
// Onde a matéria é salva/atualizada, garantir:
const weightValue = parseInt(newWeight, 10) || 0;
// ou
const weightValue = Math.max(0, Math.min(100, Number(newWeight)));
```

---

### Passo 4 — Verificar exibição do valor

Na lista de matérias, verificar que o valor é exibido como número e não com "%" concatenado indevidamente:

```svelte
<!-- ✅ Exibir apenas o número: -->
<span>{subject.weight}</span>

<!-- ✅ Ou com % formatado: -->
<span>{subject.weight}%</span>
```

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Digitar "10" no campo de peso salva exatamente `10`, não `1010`
- [ ] A lista de matérias exibe o peso correto após edição
- [ ] Editar o peso múltiplas vezes consecutivas não acumula valores
- [ ] O campo aceita apenas números inteiros entre 0 e 100
- [ ] Sem erros no console do browser
- [ ] O ROI/priorização no tutor reflete os pesos corretos

---

## 🔗 DEPENDÊNCIAS

| Tipo | Referência | Obs |
|---|---|---|
| **Relacionada** | TASK-001 | Ambas são P0 — podem ser resolvidas em paralelo |

---

## 🧪 COMO TESTAR

1. Abrir `http://localhost:5175/subjects`
2. Ver o peso atual de uma matéria (ex: "5")
3. Clicar para editar o campo de peso
4. Limpar o campo e digitar "10"
5. Salvar / pressionar Enter
6. ✅ **Esperado:** A matéria exibe peso "10" (não "510" ou "1010")
7. Editar novamente, mudar para "7"
8. ✅ **Esperado:** A matéria exibe peso "7"

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
