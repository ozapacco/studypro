# TASK-009 — Integrar Timer Pomodoro com Sugestão de Pausas

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-009 |
| **Data de criação** | 2026-03-19 |
| **Categoria** | `PEDAGÓGICO` `FEATURE` |
| **Prioridade** | 🟢 P2 — Evolutivo |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 3h |

---

## 🎯 OBJETIVO

Integrar a técnica Pomodoro ao timer de estudo existente em `/study`: após blocos de 25 minutos de sessão, o sistema sugere uma pausa curta (5 min) e, a cada 4 blocos, uma pausa longa (15 min).

---

## 🔍 CONTEXTO E PROBLEMA

**Lacuna pedagógica identificada:** O sistema tem um timer de estudo, mas não há gestão de carga cognitiva. Sessões muito longas sem pausa prejudicam a retenção. A técnica Pomodoro é respaldada pela ciência da aprendizagem (carga cognitiva, curva do esquecimento, vigilância sustentada).

**Comportamento esperado:**
- Timer conta normalmente na sessão
- A cada 25 min, aparece overlay sugerindo pausa de 5 min
- A cada 4 pomodoros completos, sugere pausa de 15 min
- O aluno pode ignorar ou aceitar a sugestão (não é obrigatória)

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação |
|---|---|
| `src/routes/study/+page.svelte` | `ALTERAR` — integrar lógica Pomodoro |
| `src/lib/components/study/` | `CRIAR` — `PomodoroBreakOverlay.svelte` |
| `src/lib/stores/config.js` | `ALTERAR` — salvar preferência de Pomodoro |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Criar `PomodoroBreakOverlay.svelte`

```svelte
<script>
  export let isLong = false;   // true = pausa longa (15 min)
  export let onSkip;
  export let onStartBreak;

  const breakMinutes = isLong ? 15 : 5;
</script>

<div class="fixed inset-0 bg-indigo-900/80 backdrop-blur z-50 flex items-center justify-center">
  <div class="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl">
    
    <div class="text-5xl mb-4">{isLong ? '🌿' : '☕'}</div>
    
    <h2 class="text-2xl font-bold mb-2">
      {isLong ? 'Pausa Longa!' : 'Hora da Pausa!'}
    </h2>
    
    <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">
      {isLong
        ? 'Você completou 4 blocos de estudo! Faça uma pausa de 15 minutos — levante, coma algo leve, descanse os olhos.'
        : 'Você estudou por 25 minutos. Uma pausa curta de 5 minutos melhora a retenção em até 20%!'}
    </p>

    <div class="flex gap-3">
      <button on:click={onSkip}
              class="flex-1 border rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50">
        Continuar estudando
      </button>
      <button on:click={onStartBreak}
              class="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-bold">
        Fazer pausa ({breakMinutes} min)
      </button>
    </div>
  </div>
</div>
```

### Passo 2 — Integrar lógica Pomodoro ao estudo

**Arquivo:** `src/routes/study/+page.svelte`

```svelte
<script>
  import PomodoroBreakOverlay from '$lib/components/study/PomodoroBreakOverlay.svelte';

  const POMODORO_DURATION = 25 * 60;   // 25 min em segundos
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;

  let pomodoroCount = 0;
  let showBreakOverlay = false;
  let isLongBreak = false;
  let pomodoroMode = true;   // configurável via settings

  // No watch do timer:
  $: if (pomodoroMode && elapsedSeconds > 0 && elapsedSeconds % POMODORO_DURATION === 0) {
    pomodoroCount++;
    isLongBreak = pomodoroCount % 4 === 0;
    showBreakOverlay = true;
    pauseTimer();
  }

  function skipBreak() {
    showBreakOverlay = false;
    resumeTimer();
  }

  function startBreak() {
    showBreakOverlay = false;
    // Iniciar countdown de pausa...
  }
</script>

{#if showBreakOverlay}
  <PomodoroBreakOverlay
    {isLongBreak}
    onSkip={skipBreak}
    onStartBreak={startBreak}
  />
{/if}
```

### Passo 3 — Adicionar toggle em configurações

Em `/settings` ou no Ritual de Foco, adicionar:

```svelte
<label class="flex items-center gap-2 text-sm">
  <input type="checkbox" bind:checked={pomodoroMode} />
  <span>Ativar Pomodoro (pausas a cada 25 min)</span>
</label>
```

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Após 25 min de estudo ativo, overlay de pausa aparece
- [ ] O aluno pode optar por ignorar ou fazer a pausa
- [ ] A cada 4 pomodoros, pausa longa de 15 min é sugerida
- [ ] Contador de pomodoros visível durante a sessão
- [ ] Toggle nas configurações para ativar/desativar
- [ ] Funciona em dark mode

---

## 🔗 DEPENDÊNCIAS

| Tipo | Referência | Obs |
|---|---|---|
| **Depende de** | TASK-001 | Sessões só são úteis com cards |
| **Relacionada** | TASK-007 | Ambas melhoram o fluxo de estudo |

---

## 🧪 COMO TESTAR

> Para testar sem aguardar 25 min, altere temporariamente `POMODORO_DURATION = 60` (1 min).

1. Ativar modo Pomodoro
2. Iniciar sessão de estudo
3. Aguardar 1 min (com POMODORO_DURATION = 60)
4. ✅ Overlay de pausa aparece automaticamente
5. Clicar "Continuar estudando" → ✅ Timer retoma
6. Clicar "Fazer pausa" → ✅ Timer pausa

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
