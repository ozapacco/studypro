<script>
  import { onMount } from 'svelte';
  import { subjectsStore, toast } from '$lib/stores';
  import { db, initializeDatabase } from '$lib/db.js';
  import { seedStarterData } from '$lib/seed.js';
  import { clearDraft, loadDraft, saveDraft } from '$lib/utils/draft.js';
  import Card from '$lib/components/common/Card.svelte';
  import Button from '$lib/components/common/Button.svelte';

  const SUBJECT_FORM_DRAFT_KEY = 'study.subjects.form.v1';

  let loading = true;
  let enableDraftSave = false;
  let name = '';
  let weight = 10;
  let color = '#0ea5e9';
  let editingId = null;
  let editingName = '';
  let editingWeight = 10;

  $: if (enableDraftSave) {
    saveDraft(SUBJECT_FORM_DRAFT_KEY, { name, weight, color });
  }

  onMount(async () => {
    const draft = loadDraft(SUBJECT_FORM_DRAFT_KEY, null);
    if (draft) {
      name = draft.name || '';
      weight = Number(draft.weight || 10);
      color = draft.color || '#0ea5e9';
    }

    await initializeDatabase();
    await subjectsStore.load();
    loading = false;
    enableDraftSave = true;
  });

  async function addSubject() {
    if (!name.trim()) {
      toast('Informe o nome da materia.', 'warning');
      return;
    }

    const id = await subjectsStore.add({
      name: name.trim(),
      shortName: name.trim().slice(0, 8),
      color,
      weight: Number(weight),
      questionCount: 0,
      cycleMinutes: 60
    });

    const topicId = await db.topics.add({
      subjectId: id,
      name: 'Geral',
      order: 1,
      theory: { totalLessons: 0, completedLessons: 0 },
      importance: 3,
      difficulty: 3,
      tags: [],
      stats: { totalCards: 0, averageRetention: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await db.lessons.add({
      topicId,
      order: 1,
      title: 'Introducao',
      completed: false,
      createdAt: new Date().toISOString()
    });

    name = '';
    weight = 10;
    color = '#0ea5e9';
    clearDraft(SUBJECT_FORM_DRAFT_KEY);
    await subjectsStore.load();
    toast('Materia criada.', 'success');
  }

  function startEdit(subject) {
    editingId = subject.id;
    editingName = subject.name;
    editingWeight = Number(subject.weight) || 10;
  }

  async function saveEdit(id) {
    if (!editingName.trim()) return;
    await subjectsStore.update(id, {
      name: editingName.trim(),
      shortName: editingName.trim().slice(0, 8),
      weight: Math.max(0, Math.min(100, Number(editingWeight) || 0))
    });
    editingId = null;
    toast('Materia atualizada.', 'success');
  }

  async function removeSubject(id) {
    if (!confirm('Remover materia, topicos, aulas e cards relacionados?')) return;
    await subjectsStore.remove(id);
    toast('Materia removida.', 'success');
  }

  async function createDemoData() {
    const result = await seedStarterData();
    if (!result.created) {
      toast('Ja existem materias cadastradas.', 'info');
      return;
    }
    await subjectsStore.load();
    toast(`Demo criada: ${result.subjects} materias e ${result.cards} cards.`, 'success');
  }
</script>

<svelte:head>
  <title>Materias | Sistema de Estudos</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8 space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Materias</h1>
    <Button variant="secondary" on:click={createDemoData}>Criar dados demo</Button>
  </div>

  <Card padding="lg">
    <h2 class="text-lg font-semibold mb-4">Nova materia</h2>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <input class="input" bind:value={name} placeholder="Nome da materia" />
      <input class="input" type="number" min="1" max="100" bind:value={weight} placeholder="Peso no edital (%)" />
      <input class="input" type="color" bind:value={color} />
      <Button on:click={addSubject}>Adicionar</Button>
    </div>
  </Card>

  <Card padding="lg">
    <h2 class="text-lg font-semibold mb-4">Lista</h2>
    {#if loading}
      <div class="h-20 flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    {:else if $subjectsStore.length === 0}
      <p class="text-sm text-gray-500">Nenhuma materia ainda.</p>
    {:else}
      <div class="space-y-2">
        {#each $subjectsStore as subject}
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full" style={`background-color: ${subject.color || '#0ea5e9'}`}></div>

                {#if editingId === subject.id}
                  <div class="flex items-center gap-2">
                    <input class="input" bind:value={editingName} />
                    <input class="input w-24" type="number" min="0" max="100" bind:value={editingWeight} on:focus={(e) => e.target instanceof HTMLInputElement && e.target.select()} />
                  </div>
                {:else}
                  <div>
                    <div class="font-medium">{subject.name}</div>
                    <div class="text-xs text-gray-500">
                      peso {subject.weight}% · {subject.stats?.totalCards || 0} cards · proficiencia {subject.proficiencyLevel || 0}%
                    </div>
                  </div>
                {/if}
              </div>

              <div class="flex items-center gap-2">
                <a class="text-sm text-primary-600 hover:text-primary-700" href={`/subjects/${subject.id}`}>Abrir</a>
                {#if editingId === subject.id}
                  <Button size="sm" on:click={() => saveEdit(subject.id)}>Salvar</Button>
                  <Button size="sm" variant="secondary" on:click={() => (editingId = null)}>Cancelar</Button>
                {:else}
                  <Button size="sm" variant="ghost" on:click={() => startEdit(subject)}>Editar</Button>
                  <Button size="sm" variant="danger" on:click={() => removeSubject(subject.id)}>Excluir</Button>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Card>
</div>
