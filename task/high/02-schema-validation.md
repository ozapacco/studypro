# Task: Implementar Schema Validation com Zod

## Metadata

- **Prioridade:** HIGH
- **Complexidade:** Alta
- **Tempo Estimado:** 4-6 horas
- **Arquivos Envolvidos:**
  - `src/lib/stores/subjects.js`
  - `src/lib/stores/cards.js`
  - `src/lib/stores/config.js`
  - `src/lib/utils/validation.js` (criar)
- **Dependências:** `zod` (adicionar ao package.json se não existir)

## Problema Identificado

Não há validação de inputs em nenhuma store. Qualquer dado inválido pode ser persistido, causando erros em cascata.

## Solução

Criar schemas Zod centralizados e aplicar validação em todas as operações de escrita.

## Schemas Necessários

```javascript
// src/lib/utils/validation.js

import { z } from "zod";

export const SubjectSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  weight: z.number().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
  dailyGoalMinutes: z.number().min(1).max(480).optional(),
  icon: z.string().optional(),
  enabled: z.boolean().default(true),
});

export const CardSchema = z.object({
  subjectId: z.string().uuid(),
  topicId: z.string().uuid().optional(),
  front: z.string().min(1).max(5000),
  back: z.string().min(1).max(5000),
  notes: z.string().max(2000).optional(),
  state: z.enum(["new", "learning", "review", "relearning"]).default("new"),
  tags: z.array(z.string()).optional(),
});

export const ConfigSchema = z.object({
  dailyGoalMinutes: z.number().min(1).max(1440),
  autoSync: z.boolean(),
  darkMode: z.boolean(),
  showStudyTips: z.boolean(),
  pomodoroLength: z.number().min(1).max(60),
  shortBreakLength: z.number().min(1).max(30),
  longBreakLength: z.number().min(1).max(60),
  soundEnabled: z.boolean(),
  vibrationEnabled: z.boolean(),
});
```

## Critérios de Aceitação

- [ ] Schemas definidos para Subject, Card, Config
- [ ] Validação em `add()` de todas as stores
- [ ] Validação em `update()` de todas as stores
- [ ] Erros amigáveis retornados ao usuário
- [ ] Performance não degradada (validação rápida)

## Implementação nas Stores

```javascript
// Exemplo em subjects.js
import { SubjectSchema } from "$lib/utils/validation.js";

async function add(data) {
  const validated = SubjectSchema.parse(data); // Lança ZodError se inválido
  const id = await db.subjects.add({
    ...validated,
    createdAt: new Date().toISOString(),
  });
  subjects.update((s) => [...s, { id, ...validated }]);
  return id;
}
```

## Checklist de Testes

- [ ] Subject com nome vazio → erro
- [ ] Subject com weight > 100 → erro
- [ ] Card com front vazio → erro
- [ ] Card com subjectId inválido → erro
- [ ] Dados válidos passam sem erro
