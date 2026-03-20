# Task: Adicionar Índices Compostos no Dexie

## Metadata

- **Prioridade:** LOW
- **Complexidade:** Baixa
- **Tempo Estimado:** 1-2 horas
- **Arquivos Envolvidos:**
  - `src/lib/db.js`

## Problema Identificado

Queries frequentes não usam índices, fazendo full table scan.

## Solução

Adicionar índices compostos para queries comuns.

## Índices Necessários

```javascript
// Em db.version(4).stores({})

// Cards - queries frequentes
cards: '++id, subjectId, topicId, state, type, due, createdAt,
       [subjectId+state],
       [subjectId+type],
       [subjectId+due],
       [topicId+state]'

// Review logs - analytics
reviewLogs: '++id, cardId, timestamp, rating,
            [cardId+timestamp]'

// Sessions - histórico
sessions: '++id, subjectId, topicId, startedAt, endedAt, status,
          [subjectId+startedAt]'

// Daily stats - agregações
dailyStats: '++id, date, [date+subjectId]'
```

## Critérios de Aceitação

- [ ] Índices adicionados no schema
- [ ] Queries usam índices automaticamente
- [ ] Performance melhor medido

## Checklist de Testes

- [ ] Queries não quebraram
- [ ] Performance melhorou (dev tools)
