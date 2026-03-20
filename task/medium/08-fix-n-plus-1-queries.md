# Task: Corrigir N+1 Queries em updateSubjectStats

## Metadata

- **Prioridade:** MEDIUM
- **Complexidade:** Média
- **Tempo Estimado:** 2-3 horas
- **Arquivos Envolvidos:**
  - `src/lib/stores/cards.js`

## Problema Identificado

`updateSubjectStats` faz 6 queries separadas para o mesmo subjectId, causando lentidão.

## Solução

Consolidar em uma query com pós-processamento em memória.

## Código Atual (PROBLEM)

```javascript
async updateSubjectStats(subjectId) {
  const [total, mature, learning, newCount, reviewCount, nonLapsedReviewCount,
         totalDifficulty] = await Promise.all([
    db.cards.where('subjectId').equals(subjectId).count(),
    db.cards.where('subjectId').equals(subjectId).filter(c => c.state === 'review').count(),
    db.cards.where('subjectId').equals(subjectId).filter(c => c.state === 'learning').count(),
    db.cards.where('subjectId').equals(subjectId).filter(c => c.state === 'new').count(),
    db.cards.where('subjectId').equals(subjectId).filter(c => c.type === 'review').count(),
    db.cards.where('subjectId').equals(subjectId).filter(c => c.type === 'review' && c.lapses === 0).count(),
    // IIFE para soma...
  ]);
}
```

## Código Novo (SOLUTION)

```javascript
async updateSubjectStats(subjectId) {
  // Uma query única
  const cards = await db.cards
    .where('subjectId')
    .equals(subjectId)
    .toArray();

  // Processamento em memória
  const stats = cards.reduce((acc, card) => {
    acc.total++;

    if (card.state === 'review') acc.mature++;
    else if (card.state === 'learning') acc.learning++;
    else if (card.state === 'new') acc.newCount++;

    if (card.type === 'review') {
      acc.reviewCount++;
      if (card.lapses === 0) acc.nonLapsedReviewCount++;
    }

    acc.totalDifficulty += card.difficulty || 1500;

    return acc;
  }, {
    total: 0,
    mature: 0,
    learning: 0,
    newCount: 0,
    reviewCount: 0,
    nonLapsedReviewCount: 0,
    totalDifficulty: 0
  });

  // Calcular média
  const avgDifficulty = stats.total > 0
    ? stats.totalDifficulty / stats.total
    : 1500;

  // Persistir
  await db.subjects.update(subjectId, {
    totalCards: stats.total,
    matureCards: stats.mature,
    learningCards: stats.learning,
    newCards: stats.newCount,
    averageDifficulty: avgDifficulty,
    mastery: calculateMastery(stats),
    updatedAt: new Date().toISOString()
  });
}
```

## Adicionar Índice Composto (db.js)

```javascript
// Para queries futuras mais eficientes
db.version(5).stores({
  cards:
    "++id, subjectId, topicId, state, type, due, createdAt, [subjectId+state], [subjectId+type]",
});
```

## Critérios de Aceitação

- [ ] Query única em vez de 6
- [ ] Mesma funcionalidade
- [ ] Performance melhorada (benchmark)
- [ ] Código mais legível

## Checklist de Testes

- [ ] Stats atualiza corretamente para subject com 0 cards
- [ ] Stats atualiza corretamente para subject com 100+ cards
- [ ] Cálculos de média corretos
- [ ] Performance melhor medido (dev tools)
