<script>
  import { onMount } from 'svelte';
  import { cardsStore, subjectsStore, toast } from '$lib/stores';
  import { db, initializeDatabase } from '$lib/db.js';
  import { clearDraft, loadDraft, saveDraft } from '$lib/utils/draft.js';
  import Card from '$lib/components/common/Card.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import Badge from '$lib/components/common/Badge.svelte';

  const FORM_DRAFT_KEY = 'study.cards.form.v1';
  const FILTER_DRAFT_KEY = 'study.cards.filters.v1';

  let loading = true;
  let enableDraftSave = false;
  let topics = [];

  let form = {
    type: 'flashcard',
    subjectId: '',
    topicId: '',
    front: '',
    back: ''
  };

  let filters = {
    subjectId: '',
    state: '',
    searchQuery: ''
  };

  const stateVariant = {
    new: 'info',
    learning: 'warning',
    review: 'success',
    relearning: 'danger'
  };

  const stateLabel = {
    new: 'novo',
    learning: 'aprendendo',
    review: 'revisao',
    relearning: 'reaprendendo'
  };

  $: if (enableDraftSave) {
    saveDraft(FORM_DRAFT_KEY, form);
    saveDraft(FILTER_DRAFT_KEY, filters);
  }

  onMount(async () => {
    await initializeDatabase();
    const formDraft = loadDraft(FORM_DRAFT_KEY, null);
    const filterDraft = loadDraft(FILTER_DRAFT_KEY, null);

    if (formDraft) {
      form = { ...form, ...formDraft };
    }
    if (filterDraft) {
      filters = { ...filters, ...filterDraft };
    }

    const currentSubjects = await subjectsStore.load();

    if (!form.subjectId && currentSubjects.length > 0) {
      form.subjectId = String(currentSubjects[0].id);
    }
    await loadTopics();

    await applyFilters();
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
    if (!topics.some((topic) => String(topic.id) === String(form.topicId))) {
      form.topicId = topics[0] ? String(topics[0].id) : '';
    }
  }

  async function applyFilters() {
    await cardsStore.load({
      subjectId: filters.subjectId ? Number(filters.subjectId) : null,
      state: filters.state || null,
      searchQuery: filters.searchQuery || ''
    });
  }

  async function createCard() {
    if (!form.front.trim() || !form.subjectId || !form.topicId) {
      toast('Preencha frente, materia e topico.', 'warning');
      return;
    }

    const content =
      form.type === 'question'
        ? { question: form.front.trim(), explanation: form.back.trim() }
        : { front: form.front.trim(), back: form.back.trim() };

    await cardsStore.add({
      subjectId: Number(form.subjectId),
      topicId: Number(form.topicId),
      type: form.type,
      content
    });

    form.front = '';
    form.back = '';
    await applyFilters();
    toast('Card criado com sucesso.', 'success');
  }

  async function clearFilters() {
    filters = { subjectId: '', state: '', searchQuery: '' };
    clearDraft(FILTER_DRAFT_KEY);
    await applyFilters();
  }

  async function toggleSuspend(card) {
    await cardsStore.toggleSuspend(card.id);
    await applyFilters();
  }

  async function resetCard(card) {
    await cardsStore.reset(card.id);
    await applyFilters();
  }

  async function deleteCard(card) {
    if (!confirm('Remover este card?')) return;
    await cardsStore.remove(card.id);
    await applyFilters();
    toast('Card removido.', 'success');
  }
</script>

<svelte:head>
  <title>Cards | Sistema de Estudos</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Cards</h1>
    <a class="text-sm text-primary-600 hover:text-primary-700" href="/subjects">Gerenciar materias</a>
  </div>

  <Card padding="lg">
    <h2 class="text-lg font-semibold mb-4">Novo card</h2>
    <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
      <select class="input" bind:value={form.type}>
        <option value="flashcard">Flashcard</option>
        <option value="question">Questao</option>
      </select>

      <select
        class="input"
        bind:value={form.subjectId}
        disabled={loading || $subjectsStore.length === 0}
        on:change={async () => {
          await loadTopics();
        }}
      >
        <option value="">{loading ? 'Carregando...' : 'Materia'}</option>
        {#each $subjectsStore as subject}
          <option value={String(subject.id)}>{subject.name}</option>
        {/each}
      </select>

      <select class="input" bind:value={form.topicId} disabled={!form.subjectId || topics.length === 0}>
        <option value="">{form.subjectId ? (topics.length === 0 ? 'Sem tópicos' : 'Topico') : 'Selecione materia'}</option>
        {#each topics as topic}
          <option value={String(topic.id)}>{topic.name}</option>
        {/each}
      </select>

      <input class="input" bind:value={form.front} placeholder={form.type === 'question' ? 'Pergunta' : 'Frente'} />
      <input class="input" bind:value={form.back} placeholder={form.type === 'question' ? 'Explicacao' : 'Verso'} />
    </div>
    <div class="mt-4">
      <Button on:click={createCard}>Criar card</Button>
    </div>
  </Card>

  <Card padding="lg">
    <div class="flex items-center justify-between gap-3 flex-wrap mb-4">
      <h2 class="text-lg font-semibold">Lista de cards</h2>
      <div class="flex items-center gap-2 flex-wrap">
        <input
          class="input w-52"
          placeholder="Buscar..."
          bind:value={filters.searchQuery}
          on:input={applyFilters}
        />
        <select class="input w-44" bind:value={filters.subjectId} on:change={applyFilters}>
          <option value="">Todas materias</option>
          {#each $subjectsStore as subject}
            <option value={subject.id}>{subject.name}</option>
          {/each}
        </select>
        <select class="input w-40" bind:value={filters.state} on:change={applyFilters}>
          <option value="">Todos estados</option>
          <option value="new">novo</option>
          <option value="learning">aprendendo</option>
          <option value="review">revisao</option>
          <option value="relearning">reaprendendo</option>
        </select>
        <Button size="sm" variant="ghost" on:click={clearFilters}>Limpar filtros</Button>
      </div>
    </div>

    {#if loading || $cardsStore.loading}
      <div class="h-20 flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    {:else if $cardsStore.cards.length === 0}
      <p class="text-sm text-gray-500">Nenhum card encontrado para os filtros.</p>
    {:else}
      <div class="space-y-2">
        {#each $cardsStore.cards as card}
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{card.content?.question || card.content?.front || 'Sem conteudo'}</div>
                <div class="text-xs text-gray-500 mt-1">
                  vencimento {card.due?.split('T')[0] || '-'} - tipo {card.type} - dificuldade {Number(card.difficulty || 0).toFixed(1)}
                </div>
                <div class="mt-2">
                  <Badge variant={stateVariant[card.state] || 'default'}>{stateLabel[card.state] || card.state}</Badge>
                  {#if card.suspended}
                    <Badge variant="warning" size="sm">suspenso</Badge>
                  {/if}
                </div>
              </div>

              <div class="flex items-center gap-2 flex-wrap justify-end">
                <a class="text-sm text-primary-600 hover:text-primary-700" href={`/cards/${card.id}`}>Editar</a>
                <Button size="sm" variant="ghost" on:click={() => toggleSuspend(card)}>
                  {card.suspended ? 'Reativar' : 'Suspender'}
                </Button>
                <Button size="sm" variant="secondary" on:click={() => resetCard(card)}>Reiniciar</Button>
                <Button size="sm" variant="danger" on:click={() => deleteCard(card)}>Excluir</Button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Card>
</div>
