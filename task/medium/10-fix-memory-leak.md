# Task: Corrigir Memory Leak em ui.js

## Metadata

- **Prioridade:** MEDIUM
- **Complexidade:** Baixa
- **Tempo Estimado:** 1-2 horas
- **Arquivos Envolvidos:**
  - `src/lib/stores/ui.js`

## Problema Identificado

Event listener de resize é adicionado mas nunca removido. Se a store for recriada, listeners acumulam.

## Solução

Adicionar método cleanup e garantir remoção do listener.

## Código Atual (PROBLEM)

```javascript
class UIStore {
  init() {
    window.addEventListener("resize", () => this.checkMobile());
    // NUNCA REMOVIDO!
  }

  toast(message, type = "info", duration = 3000) {
    setTimeout(() => {
      // Toast removal logic
    }, duration);
    // setTimeout continua se componente desmontar
  }
}
```

## Código Novo (SOLUTION)

```javascript
class UIStore {
  #resizeHandler = null;
  #activeToasts = new Map();

  init() {
    this.#resizeHandler = () => this.checkMobile();
    window.addEventListener("resize", this.#resizeHandler);
    this.checkMobile(); // Executar uma vez
  }

  destroy() {
    if (this.#resizeHandler) {
      window.removeEventListener("resize", this.#resizeHandler);
      this.#resizeHandler = null;
    }

    // Limpar timeouts pendentes
    for (const timeout of this.#activeToasts.values()) {
      clearTimeout(timeout);
    }
    this.#activeToasts.clear();
  }

  toast(message, type = "info", duration = 3000) {
    const id = crypto.randomUUID();
    const toast = { id, message, type };

    this.toasts.update((t) => [...t, toast]);

    const timeout = setTimeout(() => {
      this.dismissToast(id);
      this.#activeToasts.delete(id);
    }, duration);

    this.#activeToasts.set(id, timeout);

    return id;
  }

  dismissToast(id) {
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }
}
```

## Alternativa: Exportar destroy para ser chamado

```javascript
// Em +layout.svelte
import { onDestroy } from "svelte";
import { uiStore } from "$lib/stores/ui.js";

onDestroy(() => {
  if (uiStore.destroy) uiStore.destroy();
});
```

## Critérios de Aceitação

- [ ] Resize listener removido em destroy
- [ ] Toasts timeouts cancelados em destroy
- [ ] Memória não cresce em hot reloads
- [ ] Funcionalidade mantida

## Checklist de Testes

- [ ] Memory leak corrigido (dev tools)
- [ ] Resize continua funcionando
- [ ] Toasts dismiss funcionam
- [ ] Fast refresh não acumula listeners
