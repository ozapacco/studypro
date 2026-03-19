# TASK-008 — Implementar Modo Feynman (Ensino antes da Revisão)

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-008 |
| **Data de criação** | 2026-03-19 |
| **Categoria** | `PEDAGÓGICO` `FEATURE` |
| **Prioridade** | 🟢 P2 — Evolutivo |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 4h |

---

## 🎯 OBJETIVO

Adicionar um "Modo Feynman" opcional na criação de cards e na sessão de estudo: antes de ver a resposta, o aluno deve tentar **explicar o conceito com suas próprias palavras**. Isso ativa metacognição e melhora a retenção de longo prazo.

---

## 🔍 CONTEXTO E PROBLEMA

**Lacuna pedagógica identificada:** O sistema atual foca em repetição espaçada (revisão), mas não oferece suporte ao momento de **instrução/compreensão inicial**. O aluno pula direto para os flashcards sem processar o conceito profundamente.

**Técnica pedagógica:** A Técnica de Feynman consiste em:
1. Ler/estudar um conceito
2. Tentar explicar com palavras simples (sem olhar o material)
3. Identificar gaps de compreensão
4. Revisar e simplificar

**Impacto esperado:** Melhora na retenção de longo prazo (+15-20% estimado) por força de processamento profundo do material.

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação |
|---|---|
| `src/routes/study/+page.svelte` | `ALTERAR` — adicionar etapa Feynman ao fluxo |
| `src/routes/cards/+page.svelte` | `ALTERAR` — campo opcional "Conceito a dominar" |
| `src/lib/components/study/` | `CRIAR` — novo componente `FeynmanStep.svelte` |
| `src/lib/stores/session.js` | `VERIFICAR` — salvar se aluno usou modo Feynman |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Criar componente `FeynmanStep.svelte`

**Arquivo:** `src/lib/components/study/FeynmanStep.svelte`

```svelte
<script>
  export let concept = '';   // O conceito do card atual
  export let onContinue;     // Callback quando aluno termina

  let explanation = '';
  let showHint = false;
</script>

<div class="max-w-xl mx-auto text-center py-8 px-4 flex flex-col gap-6">
  
  <div class="text-4xl">🧠</div>
  
  <h2 class="text-xl font-bold text-primary">Modo Feynman Ativado</h2>
  <p class="text-slate-500 text-sm">
    Antes de ver a resposta, tente explicar <strong>"{concept}"</strong>
    com suas próprias palavras — como explicaria para uma criança de 10 anos.
  </p>

  <textarea
    bind:value={explanation}
    placeholder="Escreva aqui sua explicação..."
    rows="5"
    class="w-full rounded-xl border border-slate-300 dark:border-slate-600 p-3
           bg-white dark:bg-slate-800 text-sm resize-none focus:outline-none
           focus:border-primary transition-colors"
  />

  {#if !showHint}
    <button on:click={() => showHint = true}
            class="text-xs text-slate-400 hover:text-primary transition-colors">
      Preciso de uma dica →
    </button>
  {:else}
    <p class="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20
              rounded-lg p-3">
      💡 Tente lembrar: quais são os elementos principais? Quais são as consequências?
      Como este conceito se relaciona com outros que você já conhece?
    </p>
  {/if}

  <button
    on:click={() => onContinue(explanation)}
    disabled={explanation.trim().length < 10}
    class="px-6 py-3 bg-primary text-white rounded-xl font-bold
           hover:bg-primary/90 transition-all
           disabled:opacity-40 disabled:cursor-not-allowed">
    Ver Resposta e Comparar →
  </button>

</div>
```

### Passo 2 — Integrar ao fluxo de estudo (como etapa opcional)

**Arquivo:** `src/routes/study/+page.svelte`

Adicionar toggle "Modo Feynman" e inserir a etapa antes de mostrar o verso do card:

```svelte
<script>
  import FeynmanStep from '$lib/components/study/FeynmanStep.svelte';

  let feynmanMode = false;     // configurado pelo usuário
  let showFeynman = false;     // controle de exibição no fluxo
  let feynmanExplanation = ''; // guarda o que o aluno escreveu

  function onCardFront() {
    if (feynmanMode) {
      showFeynman = true;
    } else {
      showRecto(); // fluxo normal existente
    }
  }

  function onFeynmanContinue(explanation) {
    feynmanExplanation = explanation;
    showFeynman = false;
    showCardBack(); // mostrar o verso do card para comparação
  }
</script>

{#if showFeynman}
  <FeynmanStep
    concept={currentCard.front}
    onContinue={onFeynmanContinue}
  />
{:else}
  <!-- interface normal do card -->
{/if}
```

### Passo 3 — Toggle de Feynman nas configurações de sessão

Adicionar opção em `/settings` ou no Ritual de Foco (PreVoo):

```svelte
<label class="flex items-center gap-2 text-sm">
  <input type="checkbox" bind:checked={feynmanMode} class="rounded" />
  <span>Ativar Modo Feynman (explique antes de ver a resposta)</span>
</label>
```

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Toggle "Modo Feynman" disponível antes de iniciar sessão
- [ ] Quando ativado, aparece tela de explicação antes do verso do card
- [ ] A textare exige mínimo de 10 caracteres para continuar
- [ ] O botão "Ver Resposta" só aparece após mínimo de texto
- [ ] A explicação do aluno é exibida lado a lado com a resposta do card (para comparação)
- [ ] Quando desativado, o fluxo é exatamente o mesmo de antes
- [ ] Funciona em dark mode

---

## 🔗 DEPENDÊNCIAS

| Tipo | Referência | Obs |
|---|---|---|
| **Depende de** | TASK-001 | Cards precisam estar funcionando |

---

## 🧪 COMO TESTAR

1. Ativar "Modo Feynman" antes de iniciar sessão
2. Iniciar estudo
3. ✅ Antes de ver o verso, aparecer tela de "explique com suas palavras"
4. Escrever menos de 10 caracteres → ✅ Botão desabilitado
5. Escrever uma explicação → ✅ Botão habilita
6. Clicar "Ver Resposta" → ✅ Verso do card aparece para comparação

---

## 📝 REGISTRO DE EXECUÇÃO

| Campo | Valor |
|---|---|
| **Executado por** | — |
| **Data início** | — |
| **Data fim** | — |
| **Status final** | — |

---

## 🔄 HISTÓRICO

| Data | Alteração | Por |
|---|---|---|
| 2026-03-19 | Task criada — recomendação pedagógica da auditoria | Equipe de Auditoria |
