# Task: Substituir confirm() Nativo por Modal Estilizado

## Metadata

- **Prioridade:** HIGH
- **Complexidade:** Média
- **Tempo Estimado:** 2-3 horas
- **Arquivos Envolvidos:**
  - `src/lib/components/common/ConfirmDialog.svelte` (criar)
  - `src/routes/settings/+page.svelte`
  - `src/lib/stores/ui.js` (adicionar método)

## Problema Identificado

`window.confirm()` nativo quebra UX e não é estilizável. Usado em `settings/+page.svelte` para ações destrutivas.

## Solução

Criar componente ConfirmDialog reutilizável.

## Implementação

### 1. Criar ConfirmDialog.svelte

```svelte
<!-- src/lib/components/common/ConfirmDialog.svelte -->
<script>
  export let open = false;
  export let title = 'Confirmar';
  export let message = 'Tem certeza?';
  export let confirmLabel = 'Confirmar';
  export let cancelLabel = 'Cancelar';
  export let variant = 'danger'; // 'danger' | 'warning' | 'info'
  export let onConfirm = () => {};
  export let onCancel = () => {};

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function handleConfirm() {
    onConfirm();
    dispatch('confirm');
    open = false;
  }

  function handleCancel() {
    onCancel();
    dispatch('cancel');
    open = false;
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') handleCancel();
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    on:click={handleCancel}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
      on:click|stopPropagation
    >
      <h3 class="text-lg font-bold mb-2">{title}</h3>
      <p class="text-slate-600 dark:text-slate-300 mb-6">{message}</p>

      <div class="flex gap-3 justify-end">
        <button
          class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
          on:click={handleCancel}
        >
          {cancelLabel}
        </button>
        <button
          class="px-4 py-2 rounded-lg font-medium {variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700 text-white' : variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'}"
          on:click={handleConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
{/if}
```

### 2. Atualizar settings/+page.svelte

Substituir:

```javascript
const confirmed = confirm("Tem certeza que deseja limpar todos os dados?");
if (confirmed) {
  // ... limpar dados
}
```

Por:

```svelte
<ConfirmDialog
  bind:open={showClearDialog}
  title="Limpar Dados"
  message="Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita."
  confirmLabel="Limpar Tudo"
  variant="danger"
  onConfirm={handleClearData}
/>
```

### 3. Adicionar helper no ui.js

```javascript
export async function confirm(message, options = {}) {
  return new Promise((resolve) => {
    // Para casos simples, usar o componente
    // Esta função pode ser usada como fallback
    resolve(window.confirm(message));
  });
}
```

## Critérios de Aceitação

- [ ] Modal estilizado com backdrop
- [ ] Botões Confirmar/Cancelar funcionais
- [ ] Fechar com ESC ou click fora
- [ ] Variantes de cor (danger, warning, info)
- [ ] Acessibilidade (focus trap, aria)
- [ ] Animação de entrada/saída

## Checklist de Testes

- [ ] Modal abre ao chamar
- [ ] Click em Confirmar executa ação
- [ ] Click em Cancelar fecha sem ação
- [ ] ESC fecha modal
- [ ] Click fora fecha modal
- [ ] Focus fica preso no modal
- [ ] Funciona em mobile
