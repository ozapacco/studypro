# Task: Implementar Auto-save com Indicator Visual

## Metadata

- **Prioridade:** LOW
- **Complexidade:** Média
- **Tempo Estimado:** 2-3 horas
- **Arquivos Envolvidos:**
  - `src/lib/components/common/AutoSaveIndicator.svelte` (criar)
  - `src/routes/subjects/[id]/+page.svelte`
  - `src/routes/cards/[id]/+page.svelte`

## Problema Identificado

Formulários longos não salvam automaticamente, usuário não sabe se suas mudanças foram salvas.

## Solução

Implementar auto-save com indicador visual.

## Implementação

### 1. Criar AutoSaveIndicator.svelte

```svelte
<!-- src/lib/components/common/AutoSaveIndicator.svelte -->
<script>
  export let status = 'idle'; // 'idle' | 'saving' | 'saved' | 'error'

  const statusConfig = {
    idle: { icon: '', label: '', color: 'transparent' },
    saving: { icon: '⏳', label: 'Salvando...', color: 'text-slate-500' },
    saved: { icon: '✓', label: 'Salvo', color: 'text-emerald-600' },
    error: { icon: '✗', label: 'Erro ao salvar', color: 'text-rose-600' },
  };

  $: config = statusConfig[status] || statusConfig.idle;
</script>

{#if status !== 'idle'}
  <div class="flex items-center gap-2 text-sm {config.color} transition-colors">
    <span class="text-base">{config.icon}</span>
    <span>{config.label}</span>
  </div>
{/if}
```

### 2. Criar useAutoSave composable

```javascript
// src/lib/utils/useAutoSave.js
import { debounce } from "$lib/utils/format.js";

export function useAutoSave(saveFn, options = {}) {
  const { delay = 1000 } = options;

  let status = writable("idle");
  let lastSaved = writable(null);

  const debouncedSave = debounce(async (data) => {
    try {
      status.set("saving");
      await saveFn(data);
      status.set("saved");
      lastSaved.set(new Date());

      setTimeout(() => status.set("idle"), 2000);
    } catch (e) {
      status.set("error");
      console.error("Auto-save failed:", e);
    }
  }, delay);

  function trigger(data) {
    debouncedSave(data);
  }

  return { status, lastSaved, trigger };
}
```

### 3. Usar em forms

```svelte
<script>
  import AutoSaveIndicator from '$lib/components/common/AutoSaveIndicator.svelte';
  import { useAutoSave } from '$lib/utils/useAutoSave.js';

  const { status, trigger, save } = useAutoSave(async (data) => {
    await db.subjects.update(id, data);
  });

  function handleChange() {
    trigger($form);
  }
</script>

<form on:submit|preventDefault={save}>
  <div class="flex justify-between items-center mb-4">
    <h1>Editar Matéria</h1>
    <AutoSaveIndicator status={$status} />
  </div>

  <input bind:value={form.name} on:input={handleChange} />
  <!-- ... -->
</form>
```

## Critérios de Aceitação

- [ ] Indicador aparece ao modificar
- [ ] Status "Salvando..." durante save
- [ ] Status "Salvo" após sucesso
- [ ] Status "Erro" em falha
- [ ] Auto-save após delay configurado

## Checklist de Testes

- [ ] Modificação trigger auto-save
- [ ] Indicador atualiza corretamente
- [ ] Erro tratado graceful
- [ ] Debounce funciona (não salva demais)
