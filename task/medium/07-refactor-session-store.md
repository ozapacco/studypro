# Task: Refatorar session.js em Módulos Menores

## Metadata

- **Prioridade:** MEDIUM
- **Complexidade:** Muito Alta
- **Tempo Estimado:** 8-10 horas
- **Arquivos Envolvidos:**
  - `src/lib/stores/session.js` (refatorar)
  - `src/lib/stores/sessionQueue.js` (criar)
  - `src/lib/stores/sessionStats.js` (criar)
  - `src/lib/stores/sessionPersistence.js` (criar)

## Problema Identificado

session.js tem 525 linhas com múltiplas responsabilidades: gestão de estado, persistência, cálculo de XP, controle de pausa, etc.

## Solução

Separar em módulos coesos seguindo Single Responsibility Principle.

## Estrutura Proposta

```
src/lib/stores/
├── session.js           # Store principal + métodos públicos
├── sessionQueue.js      # Lógica de fila de cards
├── sessionStats.js      # Cálculos de estatísticas
├── sessionPersistence.js # Sync com DB
└── sessionXP.js         # Cálculo de XP e gamificação
```

### 1. sessionQueue.js

```javascript
// Gerencia fila de cards da sessão
export function createSessionQueue() {
  let queue = [];
  let currentIndex = 0;

  return {
    setQueue(cards) {
      queue = cards;
      currentIndex = 0;
    },

    getCurrent() {
      return queue[currentIndex] || null;
    },

    next() {
      currentIndex++;
      return this.getCurrent();
    },

    previous() {
      currentIndex = Math.max(0, currentIndex - 1);
      return this.getCurrent();
    },

    hasNext() {
      return currentIndex < queue.length - 1;
    },

    getProgress() {
      return { current: currentIndex + 1, total: queue.length };
    },

    shuffle() {
      queue = shuffleArray([...queue]);
      currentIndex = 0;
    },
  };
}
```

### 2. sessionStats.js

```javascript
// Cálculos de estatísticas da sessão
export function calculateSessionStats(sessions) {
  const totalTime = sessions.reduce(
    (sum, s) => sum + (s.actualMinutes || 0),
    0,
  );
  const cardsStudied = sessions.reduce(
    (sum, s) => sum + (s.reviewedCards || 0),
    0,
  );
  const avgRetention = calculateRetention(sessions);

  return { totalTime, cardsStudied, avgRetention };
}
```

### 3. sessionPersistence.js

```javascript
// Lógica de persistência no DB
export async function persistSessionState(state) {
  await db.transaction("rw", db.sessions, async () => {
    await db.sessions.update(state.id, {
      currentBlockIndex: state.currentBlockIndex,
      reviewedCards: state.reviewedCards,
      correctCards: state.correctCards,
      status: state.status,
    });
  });
}
```

### 4. session.js (refatorado)

```javascript
// Apenas orquestração
import { writable, get } from "svelte/store";
import { sessionQueue } from "./sessionQueue.js";
import { calculateSessionStats } from "./sessionStats.js";
import { persistSessionState } from "./sessionPersistence.js";
import { sessionLock } from "$lib/utils/lock.js";

function createSessionStore() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,

    async start(session) {
      return sessionLock.runExclusive(async () => {
        sessionQueue.setQueue(session.cards);
        // ... setup
        await persistSessionState(newState);
      });
    },

    async answer(rating) {
      return sessionLock.runExclusive(async () => {
        const card = sessionQueue.getCurrent();
        // ... lógica
        sessionQueue.next();
        await persistSessionState(state);
      });
    },

    // ... outros métodos delegando para módulos específicos
  };
}
```

## Critérios de Aceitação

- [ ] session.js < 200 linhas
- [ ] Cada módulo com responsabilidade única
- [ ] Sem código duplicado (finish/finishWithRecalc)
- [ ] Testabilidade de cada módulo
- [ ] Backwards compatibility com código existente

## Checklist de Testes

- [ ] Sessão inicia corretamente
- [ ] Resposta avança card corretamente
- [ ] Estatísticas calculadas corretamente
- [ ] Persistência funciona
- [ ] Bloqueio por lock funciona
