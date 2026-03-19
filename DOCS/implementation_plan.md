# Fix: Sistema exibindo questões sem informar o assunto/tópico

**Data:** 2026-03-18

O sistema viola um princípio fundamental de aprendizagem: **o aluno precisa saber O QUE está estudando antes de responder qualquer questão**. Sem contexto, o cervéu não consegue criar os "ganchos" de memória corretos (encoding contextual), prejudicando diretamente a retenção.

## Diagnóstico Técnico

Foram identificados **3 bugs** na cadeia de exibição de um card:

1. **Cards não carregam `subjectName`/`topicName`** → a badge de matéria em [StudyCard.svelte](file:///c:/Dev/Sistem%C3%A3o/src/lib/components/cards/StudyCard.svelte) condicional `{#if safeCard.subjectName}` **nunca renderiza**, pois os dados não estão no objeto card do IndexedDB.

2. **Nenhum cabeçalho de contexto de bloco** → em [study/+page.svelte](file:///c:/Dev/Sistem%C3%A3o/src/routes/study/+page.svelte), o `<StudyCard>` é carregado direto sem mostrar ao estudante em qual bloco (matéria + tópico) ele está. O estudante vê apenas a questão, sem saber o assunto.

3. **Bloco `questions`** no [sessionGenerator.js](file:///c:/Dev/Sistem%C3%A3o/src/lib/engines/sessionGenerator.js) tem `subjectId` mas não `topicId` nem `topicName` — o estudante não sabe qual tópico específico dentro da matéria está sendo treinado.

## Proposed Changes

### Componente: Session Store (enriquecimento de dados)

#### [MODIFY] [session.js](file:///c:/Dev/Sistemão/src/lib/stores/session.js)

A função [loadQueueByIds](file:///c:/Dev/Sistem%C3%A3o/src/lib/stores/session.js#29-35) carrega cards "crus" do IndexedDB. Ela precisa enriquecer cada card com `subjectName` e `topicName` consultando as tabelas `subjects` e `topics`.

```diff
- async function loadQueueByIds(ids = []) {
-   if (!Array.isArray(ids) || ids.length === 0) return [];
-   const cards = await db.cards.bulkGet(ids);
-   const byId = new Map(cards.filter(Boolean).map((card) => [card.id, card]));
-   return ids.map((id) => byId.get(id)).filter(Boolean);
- }
+ async function loadQueueByIds(ids = []) {
+   if (!Array.isArray(ids) || ids.length === 0) return [];
+   const cards = await db.cards.bulkGet(ids);
+   const validCards = cards.filter(Boolean);
+
+   // Enrich com nomes de matéria e tópico (lookup em paralelo por IDs únicos)
+   const subjectIds = [...new Set(validCards.map((c) => c.subjectId).filter(Boolean))];
+   const topicIds = [...new Set(validCards.map((c) => c.topicId).filter(Boolean))];
+   const [subjects, topics] = await Promise.all([
+     db.subjects.bulkGet(subjectIds),
+     db.topics.bulkGet(topicIds)
+   ]);
+   const subjectMap = new Map(subjects.filter(Boolean).map((s) => [s.id, s.name]));
+   const topicMap = new Map(topics.filter(Boolean).map((t) => [t.id, t.name]));
+
+   const byId = new Map(validCards.map((card) => [card.id, {
+     ...card,
+     subjectName: subjectMap.get(card.subjectId) || null,
+     topicName: topicMap.get(card.topicId) || null
+   }]));
+   return ids.map((id) => byId.get(id)).filter(Boolean);
+ }
```

---

### Componente: UI da Sessão (contexto do bloco atual)

#### [MODIFY] [+page.svelte (study)](file:///c:/Dev/Sistemão/src/routes/study/+page.svelte)

Adicionar um **banner de contexto** acima do `<StudyCard>` que exiba: **"Estudando agora: [Matéria] › [Tópico]"** — aparece sempre que há um card ativo para revisão ou questão.

```diff
  {:else if $sessionStore.currentCard}
    <div class="h-full max-w-3xl mx-auto p-4">
+     <!-- Banner de contexto pedagógico -->
+     <div class="mb-3 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg flex items-center gap-2">
+       <span class="text-indigo-500 text-sm">📚</span>
+       <span class="text-sm font-medium text-indigo-800 dark:text-indigo-200">
+         {$currentBlock?.title || 'Sessão de estudo'}
+         {#if $sessionStore.currentCard?.topicName}
+           <span class="font-normal text-indigo-500"> › {$sessionStore.currentCard.topicName}</span>
+         {/if}
+       </span>
+     </div>
      <Card padding="lg" class="h-full">
        <StudyCard card={$sessionStore.currentCard} showAnswer={$sessionStore.showingAnswer} />
      </Card>
    </div>
```

---

#### [MODIFY] [StudyCard.svelte](file:///c:/Dev/Sistemão/src/lib/components/cards/StudyCard.svelte)

Tornar a exibição de matéria + tópico **sempre visível e proeminente**, não apenas quando `subjectName` existe. Se não existir no card, usar o bloco atual como fallback.

```diff
  <div class="flex items-center gap-2">
    <Badge variant={safeCard.state === 'new' ? 'info' : safeCard.state === 'learning' ? 'warning' : 'success'}>
      {stateLabel[safeCard.state] || safeCard.state}
    </Badge>
-   {#if safeCard.subjectName}
-     <Badge variant="secondary">{safeCard.subjectName}</Badge>
-   {/if}
+   {#if safeCard.subjectName}
+     <Badge variant="secondary">{safeCard.subjectName}</Badge>
+   {/if}
+   {#if safeCard.topicName}
+     <span class="text-xs text-gray-500 dark:text-gray-400">› {safeCard.topicName}</span>
+   {/if}
    {#if safeCard.content?.source}
      <span class="text-sm text-gray-500">{safeCard.content.source}</span>
    {/if}
  </div>
```

---

### Componente: Session Generator (enriquecer bloco de questões)

#### [MODIFY] [sessionGenerator.js](file:///c:/Dev/Sistemão/src/lib/engines/sessionGenerator.js)

O bloco `questions` precisa incluir `topicId`, `topicName` e um `description` mais específico para que o estudante saiba qual assunto dentro da matéria está sendo treinado.

```diff
  for (const subject of weakSubjects) {
+   // Pegar o tópico mais fraco da matéria para dar contexto ao estudante
+   const weakTopic = await db.topics.where('subjectId').equals(subject.id).first();
    blocks.push({
      type: 'questions',
      title: `Questões: ${subject.name}`,
-     description: 'Prática ativa de questões focada em fraquezas',
+     description: weakTopic ? `Foco: ${weakTopic.name}` : 'Prática ativa de questões focada em fraquezas',
      durationMinutes: perSubjectDuration,
      subjectId: subject.id,
+     topicId: weakTopic?.id || null,
+     topicName: weakTopic?.name || null,
      targetCount: Math.floor(perSubjectDuration * 1.5)
    });
  }
```

## Verification Plan

### Testes Existentes

```bash
# Rodar testes existentes (FSRS e scheduler não cobrem UI, mas garantem que nada quebrou no core)
cd c:\Dev\Sistemão
npm test
```

### Teste Manual (passo a passo)

1. Abrir o app em `http://localhost:5173`
2. Ir para **Sessão de Estudo**
3. ✅ Verificar que **acima de cada card** aparece um banner azul com o nome da matéria (ex: "Revisões: Direito Penal")
4. ✅ Verificar que **dentro do card** aparece uma badge com o nome da matéria E o tópico (ex: "Crimes contra a vida › Homicídio Doloso")
5. ✅ Verificar que **blocos de questões** mostram o tópico específico no banner e na descrição do bloco
6. ✅ Trocar de card e confirmar que o contexto se mantém correto para cada card
