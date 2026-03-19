<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { cardsStore, subjectsStore, toast } from '$lib/stores';
  import { db, initializeDatabase } from '$lib/db.js';
  import { clearDraft, loadDraft, saveDraft } from '$lib/utils/draft.js';
  import Card from '$lib/components/common/Card.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import Badge from '$lib/components/common/Badge.svelte';

  let loading = true;
  let card = null;
  let subjects = [];
  let topics = [];
  let enableDraftSave = false;
  let draftKey = '';

  let form = {
    type: 'flashcard',
    subjectId: '',
    topicId: '',
    front: '',
    back: '',
    state: 'new',
    suspended: false,
    buried: false
  };

  const stateLabel = {
    new: 'novo',
    learning: 'aprendendo',
    review: 'revisao',
    relearning: 'reaprendendo'
  };

  $: if (enableDraftSave && draftKey) {
    saveDraft(draftKey, form);
  }

  onMount(async () => {
    await initializeDatabase();
    const id = Number($page.params.id);
    draftKey = `study.cards.edit.${id}.v1`;

    subjects = await subjectsStore.load();
    card = await cardsStore.getById(id);

    if (!card) {
      loading = false;
      return;
    }

    form = {
      type: card.type || 'flashcard',
      subjectId: String(card.subjectId || ''),
      topicId: String(card.topicId || ''),
      front: card.content?.question || card.content?.front || '',
      back: card.content?.explanation || card.content?.back || '',
      state: card.state || 'new',
      suspended: Boolean(card.suspended),
      buried: Boolean(card.buried)
    };

    const draft = loadDraft(draftKey, null);
    if (draft) {
      form = { ...form, ...draft };
    }

    await loadTopics();
    loading = false;
    enableDraftSave = true;
  });

  async function loadTopics() {
    if (!form.subjectId) {
      topics = [];
      form.topicId = '';
      return;
    }

    topics = await db.topics.where('subjectId').equals(Number(form.subjectId)).toArray();
    if (!topics.some((topic) => String(topic.id) === form.topicId)) {
      form.topicId = topics[0] ? String(topics[0].id) : '';
    }
  }

  async function save() {
    if (!card) return;
    if (!form.front.trim() || !form.subjectId || !form.topicId) {
      toast('Preencha frente/pergunta, materia e topico.', 'warning');
      return;
    }

    const content =
      form.type === 'question'
        ? { question: form.front.trim(), explanation: form.back.trim() }
        : { front: form.front.trim(), back: form.back.trim() };

    await cardsStore.update(card.id, {
      type: form.type,
      subjectId: Number(form.subjectId),
      topicId: Number(form.topicId),
      content,
      state: form.state,
      suspended: form.suspended,
      buried: form.buried
    });

    await cardsStore.updateSubjectStats(Number(form.subjectId));
    clearDraft(draftKey);
    toast('Card atualizado.', 'success');
  }

  async function removeCard() {
    if (!card) return;
    if (!confirm('Deseja remover este card?')) return;
    await cardsStore.remove(card.id);
    clearDraft(draftKey);
    toast('Card removido.', 'success');
    goto('/cards');
  }

  function discardDraft() {
    if (!draftKey || !card) return;
    clearDraft(draftKey);
    form = {
      type: card.type || 'flashcard',
      subjectId: String(card.subjectId || ''),
      topicId: String(card.topicId || ''),
      front: card.content?.question || card.content?.front || '',
      back: card.content?.explanation || card.content?.back || '',
      state: card.state || 'new',
      suspended: Boolean(card.suspended),
      buried: Boolean(card.buried)
    };
    loadTopics();
  }
</script>

<svelte:head>
  <title>Editar Card | Sistema de Estudos</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8 space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Editar card</h1>
    <a class="text-sm text-primary-600 hover:text-primary-700" href="/cards">Voltar para cards</a>
  </div>

  <Card padding="lg">
    {#if loading}
      <div class="h-20 flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    {:else if !card}
      <p class="text-sm text-gray-500">Card nao encontrado.</p>
    {:else}
      <div class="flex items-center gap-2 mb-4">
        <Badge variant="default">#{card.id}</Badge>
        <Badge variant="info">{card.type}</Badge>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select class="input" bind:value={form.type}>
          <option value="flashcard">Flashcard</option>
          <option value="question">Questao</option>
        </select>

        <select
          class="input"
          bind:value={form.subjectId}
          on:change={async () => {
            await loadTopics();
          }}
        >
          <option value="">Materia</option>
          {#each subjects as subject}
            <option value={subject.id}>{subject.name}</option>
          {/each}
        </select>

        <select class="input" bind:value={form.topicId}>
          <option value="">Topico</option>
          {#each topics as topic}
            <option value={topic.id}>{topic.name}</option>
          {/each}
        </select>

        <select class="input" bind:value={form.state}>
          <option value="new">novo</option>
          <option value="learning">aprendendo</option>
          <option value="review">revisao</option>
          <option value="relearning">reaprendendo</option>
        </select>
      </div>

      <div class="mt-3 space-y-3">
        <input class="input" bind:value={form.front} placeholder={form.type === 'question' ? 'Pergunta' : 'Frente'} />
        <textarea class="input min-h-28" bind:value={form.back} placeholder={form.type === 'question' ? 'Explicacao' : 'Verso'}></textarea>
      </div>

      <div class="mt-4 flex items-center gap-5">
        <label class="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" bind:checked={form.suspended} />
          Suspenso
        </label>
        <label class="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" bind:checked={form.buried} />
          Enterrado
        </label>
      </div>

      <div class="mt-6 flex gap-2 flex-wrap">
        <Button on:click={save}>Salvar alteracoes</Button>
        <Button variant="ghost" on:click={discardDraft}>Descartar rascunho</Button>
        <Button variant="secondary" on:click={() => goto('/cards')}>Cancelar</Button>
        <Button variant="danger" on:click={removeCard}>Excluir card</Button>
      </div>
    {/if}
  </Card>
</div>
