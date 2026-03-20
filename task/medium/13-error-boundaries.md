# Task: Criar Error Boundaries e AppError Class

## Metadata

- **Prioridade:** MEDIUM
- **Complexidade:** Média
- **Tempo Estimado:** 3-4 horas
- **Arquivos Envolvidos:**
  - `src/lib/errors.js` (criar)
  - `src/lib/stores/` (atualizar)
  - `src/lib/components/common/ErrorBoundary.svelte` (criar)

## Problema Identificado

Erros são tratados com try-catch genéricos, sem códigos de erro estruturados ou recovery hints.

## Solução

Criar sistema de erros estruturado com AppError e ErrorBoundary component.

## Implementação

### 1. Criar src/lib/errors.js

```javascript
// src/lib/errors.js

export class AppError extends Error {
  constructor(code, message, context = {}, severity = "error") {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.context = context;
    this.severity = severity; // 'error' | 'warning' | 'info'
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      severity: this.severity,
      timestamp: this.timestamp,
    };
  }
}

// Códigos de erro predefinidos
export const ErrorCodes = {
  // Session
  SESSION_NOT_FOUND: "SESSION_001",
  SESSION_ALREADY_ACTIVE: "SESSION_002",
  SESSION_ANSWER_FAILED: "SESSION_003",

  // Card
  CARD_NOT_FOUND: "CARD_001",
  CARD_CREATE_FAILED: "CARD_002",
  CARD_UPDATE_FAILED: "CARD_003",
  CARD_DELETE_FAILED: "CARD_004",

  // Subject
  SUBJECT_NOT_FOUND: "SUBJECT_001",
  SUBJECT_CREATE_FAILED: "SUBJECT_002",

  // Sync
  SYNC_FAILED: "SYNC_001",
  SYNC_CONFLICT: "SYNC_002",

  // Validation
  VALIDATION_FAILED: "VAL_001",
  INVALID_INPUT: "VAL_002",

  // Database
  DB_ERROR: "DB_001",
  DB_MIGRATION_FAILED: "DB_002",
};

// Helper functions
export function sessionError(code, message, context = {}) {
  return new AppError(code, message, context, "error");
}

export function syncError(code, message, context = {}) {
  return new AppError(code, message, context, "warning");
}

export function validationError(message, context = {}) {
  return new AppError(
    ErrorCodes.VALIDATION_FAILED,
    message,
    context,
    "warning",
  );
}
```

### 2. Criar ErrorBoundary.svelte

```svelte
<!-- src/lib/components/common/ErrorBoundary.svelte -->
<script>
  import { toast } from '$lib/stores/ui.js';
  import * as Sentry from '@sentry/browser'; // Opcional: Sentry

  export let fallback = null; // Componente fallback customizado

  let hasError = false;
  let error = null;

  export function handleError(err, context = {}) {
    hasError = true;
    error = err;

    // Log estruturado
    console.error({
      ...err.toJSON?.() || { message: err.message },
      context,
    });

    // Sentry (se configurado)
    if (typeof Sentry !== 'undefined') {
      Sentry.captureException(err, { extra: context });
    }

    // Toast amigável
    const userMessage = getUserFriendlyMessage(err.code);
    toast(userMessage, 'error', { duration: 5000 });
  }

  function getUserFriendlyMessage(code) {
    const messages = {
      'SESSION_001': 'Não foi possível carregar a sessão.',
      'CARD_003': 'Erro ao salvar cartão. Tente novamente.',
      'SYNC_001': 'Erro de sincronização. Verifique sua conexão.',
    };
    return messages[code] || 'Algo deu errado. Tente novamente.';
  }

  function retry() {
    hasError = false;
    error = null;
    // Trigger parent re-render
  }
</script>

{#if hasError && fallback}
  <svelte:component this={fallback} {error} onRetry={retry} />
{:else if hasError}
  <div class="p-6 bg-rose-50 rounded-xl text-center">
    <p class="text-rose-600 mb-4">{error?.message || 'Erro inesperado'}</p>
    <button
      class="px-4 py-2 bg-rose-600 text-white rounded-lg"
      on:click={retry}
    >
      Tentar Novamente
    </button>
  </div>
{:else}
  <slot />
{/if}
```

### 3. Usar em stores

```javascript
// cards.js
import { AppError, ErrorCodes } from "$lib/errors.js";

async function update(id, changes) {
  try {
    await db.cards.update(id, changes);
  } catch (e) {
    throw new AppError(
      ErrorCodes.CARD_UPDATE_FAILED,
      "Erro ao atualizar cartão",
      { id, changes },
    );
  }
}
```

## Critérios de Aceitação

- [ ] AppError com código, mensagem e contexto
- [ ] ErrorBoundary component reutilizável
- [ ] Códigos de erro predefinidos
- [ ] Mensagens amigáveis ao usuário
- [ ] Logging estruturado

## Checklist de Testes

- [ ] Erro lançado com código correto
- [ ] ErrorBoundary captura erro
- [ ] Mensagem amigável exibida
- [ ] Retry funciona
- [ ] Console log estruturado
