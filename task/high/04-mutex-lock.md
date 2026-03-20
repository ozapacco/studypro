# Task: Implementar Mutex/Lock para Operações Críticas

## Metadata

- **Prioridade:** HIGH
- **Complexidade:** Alta
- **Tempo Estimado:** 3-4 horas
- **Arquivos Envolvidos:**
  - `src/lib/utils/lock.js` (criar)
  - `src/lib/stores/session.js`
  - `src/lib/cloud/sync.js`

## Problema Identificado

Race conditions em operações assíncronas críticas - principalmente em `session.js` onde cliques rápidos podem causar estados inconsistentes.

## Solução

Implementar padrão Mutex para proteger seções críticas.

## Implementação

### 1. Criar lock.js

```javascript
// src/lib/utils/lock.js

export class Mutex {
  #locked = false;
  #queue = [];

  async acquire() {
    if (!this.#locked) {
      this.#locked = true;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.#queue.push(resolve));
  }

  release() {
    const next = this.#queue.shift();
    if (next) {
      next();
    } else {
      this.#locked = false;
    }
  }

  async runExclusive(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  get isLocked() {
    return this.#locked;
  }
}

// Instâncias globais para operações específicas
export const sessionLock = new Mutex();
export const syncLock = new Mutex();
export const dbLock = new Mutex();
```

### 2. Aplicar em session.js

```javascript
import { sessionLock } from '$lib/utils/lock.js';

async answer(rating) {
  return sessionLock.runExclusive(async () => {
    const state = get({ subscribe });
    // ... lógica de answer
    await persistProgress(newState);
    return result;
  });
}
```

### 3. Aplicar em sync.js

```javascript
import { syncLock } from '$lib/utils/lock.js';

async syncNow() {
  return syncLock.runExclusive(async () => {
    // ... lógica de sync
  });
}

function scheduleCloudSync(table, action, record) {
  // Remover timer antigo (race condition)
  if (syncTimer) clearTimeout(syncTimer);

  syncTimer = setTimeout(async () => {
    await syncLock.runExclusive(async () => {
      // ... lógica
    });
  }, DEBOUNCE_MS);
}
```

## Critérios de Aceitação

- [ ] Mutex implementada com queue FIFO
- [ ] `runExclusive()` garante execução atômica
- [ ] Session answer() protegido por lock
- [ ] Sync operations protegidas por lock
- [ ] Não há deadlock em nenhuma operação

## Checklist de Testes

- [ ] Clique rápido em rating (3x em 100ms) → apenas 1 processado
- [ ] Sync chamado simultaneamente → serializados
- [ ] Lock é liberado mesmo com erro
- [ ] Performance não degradada significativamente
