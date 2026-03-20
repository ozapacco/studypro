# Task: Extrair Magic Numbers para Constantes Nomeadas

## Metadata

- **Prioridade:** MEDIUM
- **Complexidade:** Média
- **Tempo Estimado:** 3-4 horas
- **Arquivos Envolvidos:**
  - `src/lib/engines/tutorEngine.js`
  - `src/lib/engines/scheduler.js`
  - `src/lib/engines/analytics.js`
  - `src/lib/config/thresholds.js` (criar)

## Problema Identificado

Magic numbers espalhados no código (ex: `overdue > 1`, `weight > 100`, `Math.sqrt`) sem explicação.

## Solução

Criar arquivo de constantes/thresholds e substituir.

## Implementação

### 1. Criar src/lib/config/thresholds.js

```javascript
// src/lib/config/thresholds.js

export const SESSION = {
  XP_PER_CARD: 10,
  XP_BONUS_GOOD: 5,
  XP_BONUS_EASY: 2,
  XP_PENALTY_AGAIN: 3,
  XP_SPEED_BONUS_THRESHOLD_SECONDS: 10,
  XP_STREAK_BONUS_THRESHOLD: 5,
  XP_STREAK_BONUS_AMOUNT: 2,

  MIN_SESSION_MINUTES: 1,
  MIN_CARDS_FOR_SESSION: 1,
};

export const MASTERY = {
  CRITICAL_THRESHOLD: 40,
  WEAK_THRESHOLD: 60,
  MEDIUM_THRESHOLD: 85,
  CRITICAL_LABEL: "crítico",
  WEAK_LABEL: "fraco",
  MEDIUM_LABEL: "médio",
  STRONG_LABEL: "forte",
};

export const SCHEDULING = {
  OVERDUE_THRESHOLD_DAYS: 1,
  URGENT_REVIEW_THRESHOLD_HOURS: 24,
  PRE_VOO_INTERVAL_HOURS: 18,
  PRE_VOO_MAX_INTERVAL_HOURS: 24,
  MIN_CARDS_FOR_BLOCK: 5,
  MAX_CARDS_PER_BLOCK: 50,
};

export const FSRS = {
  DEFAULT_STABILITY: 100,
  DEFAULT_DIFFICULTY: 2500,
  MIN_STABILITY: 1,
  MAX_STABILITY: 10000,
  MIN_DIFFICULTY: 1000,
  MAX_DIFFICULTY: 4000,
  LEECH_THRESHOLD: 8,
};

export const SUBJECTS = {
  MIN_WEIGHT: 1,
  MAX_WEIGHT: 100,
  DEFAULT_WEIGHT: 50,
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 100,
};

export const CARDS = {
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 5000,
  MAX_NOTES_LENGTH: 2000,
};

export const XP = {
  BASE_PER_LEVEL: 100,
  XP_MULTIPLIER: "sqrt", // função
};

export function calculateLevel(totalXP) {
  return Math.floor(Math.sqrt(totalXP / XP.BASE_PER_LEVEL)) + 1;
}

export function calculateXPForLevel(level) {
  return Math.pow(level - 1, 2) * XP.BASE_PER_LEVEL;
}
```

### 2. Atualizar tutorEngine.js

```javascript
// ANTES
if (urgentCards.length > 0) {
  const urgentTopic = await db.topics.get(urgentCards[0].topicId);
}

// DEPOIS
import { SCHEDULING } from "$lib/config/thresholds.js";

const urgentCards = dueCards.filter((c) => {
  const overdue = (today.getTime() - new Date(c.due).getTime()) / 86400000;
  return (
    overdue > SCHEDULING.OVERDUE_THRESHOLD_DAYS ||
    c.state === "learning" ||
    c.state === "relearning"
  );
});

if (urgentCards.length > 0) {
  const urgentTopic = await db.topics.get(urgentCards[0].topicId);
}
```

### 3. Atualizar analytics.js

```javascript
// ANTES
const mastery = Math.round((mature / total) * 100);

// DEPOIS
import { calculateLevel } from "$lib/config/thresholds.js";

const level = calculateLevel(totalXP);
```

## Critérios de Aceitação

- [ ] Arquivo thresholds.js criado
- [ ] Todos magic numbers substituídos
- [ ] Nomes auto-explicativos
- [ ] Código mais legível

## Checklist de Testes

- [ ] Cálculos idênticos antes/depois
- [ ] Nenhum magic number restante
- [ ] Código documentado
