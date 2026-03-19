# TASK-007 — Redirecionar para Resumo ao Finalizar Sessão de Estudo

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-007 |
| **Data de criação** | 2026-03-19 |
| **Categoria** | `UX` `OPERACIONAL` |
| **Prioridade** | 🟡 P1 — Importante |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 2h |

---

## 🎯 OBJETIVO

Ao clicar em "FINALIZAR" na tela de estudo, o usuário deve ser redirecionado para uma tela de resumo da sessão (ou para o Dashboard) ao invés de permanecer em uma tela em branco.

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual:** Ao clicar em "FINALIZAR" na `/study`, o timer para e o usuário **permanece na tela vazia**. Não há feedback de conclusão, sem resumo de desempenho, sem redirecionamento.

**Comportamento esperado:** Ao finalizar, exibir um **resumo da sessão** com:
- Total de cards revisados
- Taxa de acerto
- Tempo total de estudo
- Botão para voltar ao Dashboard ou iniciar nova sessão

**Impacto:**
- [x] Causa erro visual/confusão
- [x] Impede funcionalidade secundária (fechar o loop de aprendizagem)

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação |
|---|---|
| `src/routes/study/+page.svelte` | `ALTERAR` |
| `src/lib/stores/session.js` | `VERIFICAR` — verificar dados disponíveis pós-sessão |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Criar estado de "sessão encerrada"

**Arquivo:** `src/routes/study/+page.svelte`

```svelte
<script>
  let sessionFinished = false;
  let sessionSummary = null;

  function finishSession() {
    // ... lógica existente de finalizar
    sessionSummary = {
      totalCards: $sessionStore.reviewed ?? 0,
      correctAnswers: $sessionStore.correct ?? 0,
      durationMinutes: Math.round(elapsedSeconds / 60),
    };
    sessionFinished = true;
  }
</script>
```

### Passo 2 — Renderizar tela de resumo condicionalmente

```svelte
{#if sessionFinished && sessionSummary}
  <div class="flex flex-col items-center justify-center min-h-screen text-center gap-6 px-4">
    
    <div class="text-6xl">🎯</div>
    
    <h1 class="text-3xl font-bold text-primary">Sessão Concluída!</h1>
    
    <div class="grid grid-cols-3 gap-4 w-full max-w-sm">
      <div class="bg-slate-100 dark:bg-slate-800 rounded-xl p-4">
        <div class="text-2xl font-bold text-primary">{sessionSummary.totalCards}</div>
        <div class="text-xs text-slate-500">Cards revisados</div>
      </div>
      <div class="bg-slate-100 dark:bg-slate-800 rounded-xl p-4">
        <div class="text-2xl font-bold text-green-500">
          {sessionSummary.totalCards > 0
            ? Math.round((sessionSummary.correctAnswers / sessionSummary.totalCards) * 100)
            : 0}%
        </div>
        <div class="text-xs text-slate-500">Acertos</div>
      </div>
      <div class="bg-slate-100 dark:bg-slate-800 rounded-xl p-4">
        <div class="text-2xl font-bold text-blue-500">{sessionSummary.durationMinutes}min</div>
        <div class="text-xs text-slate-500">Tempo total</div>
      </div>
    </div>

    <div class="flex gap-3 mt-4">
      <a href="/"
         class="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50">
        ← Voltar ao Início
      </a>
      <button on:click={restartSession}
              class="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90">
        Nova Sessão 🚀
      </button>
    </div>
  </div>

{:else}
  <!-- Interface de estudo normal (existente) -->
{/if}
```

### Passo 3 — Conectar à função `finishSession` existente

Localizar onde o botão "FINALIZAR" chama sua função e garantir que `sessionFinished = true` é setado corretamente com os dados da sessão.

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Clicar em "FINALIZAR" exibe tela de resumo (não tela em branco)
- [ ] Resumo exibe: total de cards, taxa de acerto e tempo
- [ ] Botão "Voltar ao Início" navega para `/`
- [ ] Botão "Nova Sessão" reinicia o fluxo de estudo
- [ ] Funciona em dark mode
- [ ] Sem erros no console

---

## 🔗 DEPENDÊNCIAS

| Tipo | Referência | Obs |
|---|---|---|
| **Depende de** | TASK-001 | Mais impactante quando cards existem |

---

## 🧪 COMO TESTAR

1. Iniciar sessão em `/study` (com cards criados — depende de TASK-001)
2. Clicar em "FINALIZAR" ou aguardar fim da fila
3. ✅ **Esperado:** Tela de resumo com métricas da sessão
4. Clicar "Voltar ao Início" → ✅ Dashboard
5. Clicar "Nova Sessão" → ✅ Reinicia estudo

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
| 2026-03-19 | Task criada após auditoria | Equipe de Auditoria |
