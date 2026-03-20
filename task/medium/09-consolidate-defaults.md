# Task: Consolidar Valores Default em Config Centralizado

## Metadata

- **Prioridade:** MEDIUM
- **Complexidade:** Média
- **Tempo Estimado:** 2-3 horas
- **Arquivos Envolvidos:**
  - `src/lib/db.js`
  - `src/lib/stores/config.js`
  - `src/lib/seed.js`
  - `src/lib/config/defaultConfig.js` (criar)

## Problema Identificado

Valores default estão duplicados em 3 lugares: db.js, config.js e seed.js. Manutenção propensa a erros.

## Solução

Criar arquivo único de configuração default.

## Implementação

### 1. Criar src/lib/config/defaultConfig.js

```javascript
// Único lugar para todos os valores default
export const DEFAULT_CONFIG = {
  dailyGoalMinutes: 60,
  autoSync: true,
  darkMode: false,
  showStudyTips: true,
  pomodoroLength: 25,
  shortBreakLength: 5,
  longBreakLength: 15,
  soundEnabled: true,
  vibrationEnabled: true,
  maxCardsPerDay: 100,
  newCardsPerDay: 20,
  leechThreshold: 8,
  fsrs: {
    desiredRetention: 0.9,
    maximumInterval: 365,
    initialStability: 100,
    initialDifficulty: 2500,
  },
};

export const DEFAULT_SESSION = {
  type: "regular",
  status: "active",
  xpPerCard: 10,
};

export const FSRS_CONSTANTS = {
  DECAY: -0.5,
  FACTOR: 9,
};
```

### 2. Atualizar db.js

```javascript
import { DEFAULT_CONFIG } from '$lib/config/defaultConfig.js';

db.version(4).stores({...}).upgrade(async () => {
  const existing = await db.config.get(1);
  if (!existing) {
    await db.config.add({ id: 1, ...DEFAULT_CONFIG });
  }
});
```

### 3. Atualizar config.js

```javascript
import { DEFAULT_CONFIG } from "$lib/config/defaultConfig.js";

async function load() {
  let config = await db.config.get(1);
  if (!config) {
    config = { id: 1, ...DEFAULT_CONFIG };
    await db.config.add(config);
  }
  set(config);
}

// reset() também usa DEFAULT_CONFIG
```

### 4. Atualizar seed.js

```javascript
import { DEFAULT_CONFIG, DEFAULT_SESSION } from "$lib/config/defaultConfig.js";

// Não redefinir, apenas importar
```

## Critérios de Aceitação

- [ ] Arquivo único de default existe
- [ ] Todos os 3 arquivos importam dele
- [ ] Nenhuma redefinição de valores
- [ ] Tipo de export consistente

## Checklist de Testes

- [ ] Novo usuário recebe config default correta
- [ ] Reset de config volta para defaults
- [ ] Valores em todas as telas corretos
