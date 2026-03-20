<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { db, initializeDatabase } from '$lib/db.js';
  import { cardsStore, subjectsStore, toast, uiStore } from '$lib/stores';
  import Card from '$lib/components/common/Card.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import TopicMindMapEditor from '$lib/components/mindmaps/TopicMindMapEditor.svelte';

  let loading = true;
  let subjectId = null;
  let subject = null;
  let topics = [];
  let lessonsByTopic = {};
  let newTopicName = '';
  let newLessonByTopic = {};

  onMount(async () => {
    await initializeDatabase();
    subjectId = Number($page.params.id);
    await refresh();
    loading = false;
  });

  async function refresh() {
    subject = await db.subjects.get(subjectId);
    topics = await db.topics.where('subjectId').equals(subjectId).sortBy('order');

    const lessonEntries = await Promise.all(
      topics.map(async (topic) => [topic.id, await db.lessons.where('topicId').equals(topic.id).sortBy('order')])
    );

    lessonsByTopic = Object.fromEntries(lessonEntries);
  }

  async function addTopic() {
    if (!newTopicName.trim()) {
      toast('Informe o nome do tópico.', 'warning');
      return;
    }

    await db.topics.add({
      subjectId,
      name: newTopicName.trim(),
      order: topics.length + 1,
      theory: { totalLessons: 0, completedLessons: 0 },
      importance: 3,
      difficulty: 3,
      tags: [],
      stats: { totalCards: 0, averageRetention: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    newTopicName = '';
    await refresh();
    toast('Tópico adicionado.', 'success');
  }

  async function removeTopic(topic) {
    const confirmed = await uiStore.confirm(
      `Isso removerá o tópico "${topic.name}" e todas as aulas e cards vinculados a ele.`,
      { title: 'Remover Tópico?', variant: 'danger', confirmLabel: 'Sim, Remover' }
    );
    if (!confirmed) return;
    
    await db.lessons.where('topicId').equals(topic.id).delete();
    await db.cards.where('topicId').equals(topic.id).delete();
    await db.topics.delete(topic.id);
    await cardsStore.updateSubjectStats(subjectId);
    await refresh();
    toast('Tópico removido.', 'success');
  }

  async function addLesson(topicId) {
    const title = (newLessonByTopic[topicId] || '').trim();
    if (!title) return;

    const existing = lessonsByTopic[topicId] || [];
    await db.lessons.add({
      topicId,
      order: existing.length + 1,
      title,
      completed: false,
      createdAt: new Date().toISOString()
    });

    newLessonByTopic = { ...newLessonByTopic, [topicId]: '' };
    await refresh();
  }

  async function toggleLesson(lesson) {
    await db.lessons.update(lesson.id, { completed: !lesson.completed });
    await refresh();
  }

  async function removeLesson(lesson) {
    await db.lessons.delete(lesson.id);
    await refresh();
  }

  async function updateSubjectName() {
    if (!subject?.name?.trim()) {
      toast('O nome da matéria não pode ser vazio.', 'error');
      return;
    }
    await subjectsStore.update(subject.id, {
      name: subject.name.trim(),
      shortName: (subject.shortName || subject.name.trim()).slice(0, 8),
      weight: Number(subject.weight || 1),
      color: subject.color
    });
    await refresh();
    toast('Matéria atualizada.', 'success');
  }
</script>

<svelte:head>
  <title>Detalhe da Materia | Sistema de Estudos</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8 space-y-4">
  {#if loading}
    <div class="h-20 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
  {:else if !subject}
    <Card padding="lg">
      <p class="text-sm text-gray-500">Matéria não encontrada.</p>
    </Card>
  {:else}
    <Card padding="lg">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <h1 class="text-2xl font-bold">Matéria</h1>
        <a class="text-sm text-primary-600 hover:text-primary-700" href="/subjects">Voltar</a>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
        <input class="input md:col-span-2" bind:value={subject.name} />
        <input class="input" type="number" min="1" max="100" bind:value={subject.weight} />
        <input class="input" type="color" bind:value={subject.color} />
      </div>

      <div class="mt-3">
        <Button on:click={updateSubjectName}>Salvar matéria</Button>
      </div>
    </Card>

    <Card padding="lg">
      <h2 class="text-lg font-semibold mb-3">Adicionar tópico</h2>
      <div class="flex gap-2">
        <input class="input" bind:value={newTopicName} placeholder="Nome do tópico" />
        <Button on:click={addTopic}>Adicionar</Button>
      </div>
    </Card>

    <Card padding="lg">
      <h2 class="text-lg font-semibold mb-3">Tópicos e aulas</h2>

      {#if topics.length === 0}
        <p class="text-sm text-gray-500">Nenhum tópico cadastrado.</p>
      {:else}
        <div class="space-y-3">
          {#each topics as topic}
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div class="font-medium">{topic.name}</div>
                  <div class="text-xs text-gray-500">importância {topic.importance || 3} · dificuldade {topic.difficulty || 3}</div>
                </div>
                <Button size="sm" variant="danger" on:click={() => removeTopic(topic)}>Excluir tópico</Button>
              </div>

              <div class="mt-3 space-y-2">
                {#if (lessonsByTopic[topic.id] || []).length === 0}
                  <p class="text-xs text-gray-500">Sem aulas.</p>
                {:else}
                  {#each lessonsByTopic[topic.id] as lesson}
                    <div class="flex items-center justify-between gap-2 p-2 rounded border border-gray-200 dark:border-gray-700">
                      <label class="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={lesson.completed} on:change={() => toggleLesson(lesson)} />
                        <span class:line-through={lesson.completed}>{lesson.title}</span>
                      </label>
                      <button class="text-xs text-red-500 hover:text-red-600" on:click={() => removeLesson(lesson)}>remover</button>
                    </div>
                  {/each}
                {/if}
              </div>

              <div class="mt-3 flex gap-2">
                <input
                  class="input"
                  bind:value={newLessonByTopic[topic.id]}
                  placeholder="Nova aula/PDF"
                />
                <Button size="sm" on:click={() => addLesson(topic.id)}>Adicionar aula</Button>
              </div>

              <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <TopicMindMapEditor topic={topic} />
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Card>
  {/if}
</div>
