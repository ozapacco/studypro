# Task: Adicionar Keyboard Shortcuts para Power Users

## Metadata

- **Prioridade:** LOW
- **Complexidade:** Média
- **Tempo Estimado:** 3-4 horas
- **Arquivos Envolvidos:**
  - `src/lib/stores/config.js` (atalhos)
  - `src/lib/utils/keyboard.js` (criar)
  - `src/routes/+layout.svelte`

## Problema Identificado

Usuários power user não têm atalhos de teclado para navegação rápida.

## Solução

Implementar sistema de shortcuts globais.

## Implementação

### 1. Criar src/lib/utils/keyboard.js

```javascript
// src/lib/utils/keyboard.js

export const SHORTCUTS = {
  // Navegação (G + key)
  NAV_DASHBOARD: { key: "d", mod: "g", description: "Ir para Dashboard" },
  NAV_STUDY: { key: "s", mod: "g", description: "Ir para Sessão de Estudo" },
  NAV_CARDS: { key: "c", mod: "g", description: "Ir para Cards" },
  NAV_SUBJECTS: { key: "m", mod: "g", description: "Ir para Matérias" },
  NAV_STATS: { key: "a", mod: "g", description: "Ir para Estatísticas" },
  NAV_SETTINGS: { key: "o", mod: "g", description: "Ir para Configurações" },

  // Sessão de estudo
  STUDY_REVEAL: { key: " ", description: "Revelar resposta" },
  STUDY_AGAIN: { key: "1", description: "Avaliar: Again" },
  STUDY_HARD: { key: "2", description: "Avaliar: Hard" },
  STUDY_GOOD: { key: "3", description: "Avaliar: Good" },
  STUDY_EASY: { key: "4", description: "Avaliar: Easy" },

  // Geral
  CLOSE_MODAL: { key: "Escape", description: "Fechar modal" },
  SEARCH: { key: "/", description: "Abrir busca" },
};

let handler = null;
let pendingG = false;

export function initKeyboardShortcuts(router) {
  handler = (e) => {
    // Ignorar se em input
    if (e.target.matches("input, textarea, select")) return;

    const key = e.key.toLowerCase();

    // Sequence: G then key
    if (pendingG && e.key !== "g") {
      pendingG = false;
      if (key === SHORTCUTS.NAV_DASHBOARD.key) router.push("/");
      else if (key === SHORTCUTS.NAV_STUDY.key) router.push("/study");
      else if (key === SHORTCUTS.NAV_CARDS.key) router.push("/cards");
      else if (key === SHORTCUTS.NAV_SUBJECTS.key) router.push("/subjects");
      else if (key === SHORTCUTS.NAV_STATS.key) router.push("/stats");
      else if (key === SHORTCUTS.NAV_SETTINGS.key) router.push("/settings");
    }

    if (key === "g") {
      pendingG = true;
      setTimeout(() => {
        pendingG = false;
      }, 1000);
    }
  };

  window.addEventListener("keydown", handler);
}

export function destroyKeyboardShortcuts() {
  if (handler) {
    window.removeEventListener("keydown", handler);
    handler = null;
  }
}
```

### 2. Usar em +layout.svelte

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { initKeyboardShortcuts, destroyKeyboardShortcuts } from '$lib/utils/keyboard.js';

  onMount(() => initKeyboardShortcuts({ push: goto }));
  onDestroy(() => destroyKeyboardShortcuts());
</script>
```

## Critérios de Aceitação

- [ ] G+D → Dashboard
- [ ] G+S → Study
- [ ] Space → Revelar resposta
- [ ] 1-4 → Rating
- [ ] ESC → Fechar modal
- [ ] Hint visual (atalhos visíveis)

## Checklist de Testes

- [ ] Todos atalhos funcionais
- [ ] Não conflitam com inputs
- [ ] Sequência G+key funciona
- [ ] Timeout de sequência funciona
