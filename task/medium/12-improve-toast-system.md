# Task: Melhorar Toast System

## Metadata

- **Prioridade:** MEDIUM
- **Complexidade:** Média
- **Tempo Estimado:** 2-3 horas
- **Arquivos Envolvidos:**
  - `src/lib/stores/ui.js`
  - `src/routes/+layout.svelte`

## Problema Identificado

Toast system atual: posição fixa pode cobrir conteúdo, sem dismiss manual, sem limite de stack.

## Solução

Melhorar com dismiss manual, limite de stack e progress bar.

## Implementação

```javascript
// src/lib/stores/ui.js

class UIStore {
  // ... existing code ...

  #MAX_TOASTS = 3;
  #activeToasts = new Map();

  toast(message, type = "info", options = {}) {
    const {
      duration = 3000,
      dismissible = true,
      action = null, // { label: string, onClick: function }
    } = options;

    // Limitar número de toasts
    this.toasts.update((t) => {
      const limited =
        t.length >= this.#MAX_TOASTS
          ? t.slice(t.length - this.#MAX_TOASTS + 1)
          : t;
      return [
        ...limited,
        { id, message, type, dismissible, action, progress: 100 },
      ];
    });

    // Progress bar countdown
    if (duration > 0) {
      const startTime = Date.now();
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);

        this.toasts.update((t) =>
          t.map((toast) =>
            toast.id === id ? { ...toast, progress: remaining } : toast,
          ),
        );

        if (remaining > 0 && this.#activeToasts.has(id)) {
          requestAnimationFrame(updateProgress);
        }
      };

      requestAnimationFrame(updateProgress);

      const timeout = setTimeout(() => {
        this.dismissToast(id);
        this.#activeToasts.delete(id);
      }, duration);

      this.#activeToasts.set(id, timeout);
    }

    return id;
  }

  dismissToast(id) {
    if (this.#activeToasts.has(id)) {
      clearTimeout(this.#activeToasts.get(id));
      this.#activeToasts.delete(id);
    }
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }
}
```

### Atualizar layout.svelte

```svelte
<!-- Toast container com progress bar -->
<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
  {#each $uiStore.toasts as toast (toast.id)}
    <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border-l-4 {getBorderColor(toast.type)}">
      <!-- Progress bar -->
      {#if toast.progress > 0}
        <div
          class="absolute bottom-0 left-0 h-1 bg-current opacity-30 transition-all"
          style="width: {toast.progress}%"
        />
      {/if}

      <div class="flex items-start gap-3">
        <span class="flex-shrink-0">{getIcon(toast.type)}</span>
        <p class="flex-1 text-sm">{toast.message}</p>

        {#if toast.dismissible}
          <button
            class="text-slate-400 hover:text-slate-600"
            on:click={() => uiStore.dismissToast(toast.id)}
          >
            ✕
          </button>
        {/if}
      </div>

      {#if toast.action}
        <button
          class="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          on:click={() => { toast.action.onClick(); dismissToast(toast.id); }}
        >
          {toast.action.label}
        </button>
      {/if}
    </div>
  {/each}
</div>
```

## Critérios de Aceitação

- [ ] Máximo 3 toasts simultâneos
- [ ] Botão dismiss visível
- [ ] Progress bar funciona
- [ ] Não cobre conteúdo importante em mobile
- [ ] Toasts antigos removidos automaticamente

## Checklist de Testes

- [ ] 5 toasts disparados → apenas 3 visíveis
- [ ] Click em X remove toast
- [ ] Progress bar diminui
- [ ] Toast auto-dismiss funciona
- [ ] Mobile não cobre conteúdo
