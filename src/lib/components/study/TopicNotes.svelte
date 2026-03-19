<script>
  import { onMount } from 'svelte';
  import { fade, fly, slide } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { notesStore } from '$lib/stores/notes.js';
  import InteractiveCard from '$lib/components/common/InteractiveCard.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import { COLORS } from '$lib/design/tokens.mjs';

  let topicId = null;
  let topicName = '';

  let noteType = 'bizu';
  let noteContent = '';
  let noteTitle = '';
  let noteComment = '';
  let saving = false;
  let saved = false;

  $: bizus = $notesStore.notes.filter(n => n.type === 'bizu');
  $: errors = $notesStore.notes.filter(n => n.type === 'error');
  $: annotations = $notesStore.notes.filter(n => n.type === 'annotation');

  onMount(async () => {
    topicId = parseInt($page.url.searchParams.get('topicId'));
    topicName = decodeURIComponent($page.url.searchParams.get('topicName') || 'Tópico');

    if (topicId) {
      await notesStore.loadByTopic(topicId);
    }
  });

  async function saveNote() {
    if (!noteContent.trim()) return;
    saving = true;

    await notesStore.addNote(topicId, noteType, noteContent.trim(), noteTitle.trim() || null, noteComment.trim() || null);

    noteContent = '';
    noteTitle = '';
    noteComment = '';
    saving = false;
    saved = true;

    setTimeout(() => saved = false, 2000);
  }

  async function deleteNote(id) {
    if (confirm('Deseja excluir permanentemente esta nota?')) {
      await notesStore.deleteNote(id);
    }
  }

  function goBack() {
    goto(`/study?topicId=${topicId}`);
  }
</script>

<svelte:head>
  <title>Notas: {topicName} | Sistemão</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 md:py-16">
  <div class="max-w-3xl mx-auto">
    <!-- Header -->
    <header class="flex items-center gap-6 mb-10 animate-fade-in">
      <button 
        on:click={goBack} 
        class="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-primary-500 hover:border-primary-500 transition-all shadow-sm active:scale-90"
        aria-label="Voltar para o estudo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      </button>
      <div>
        <h1 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white leading-tight">Notas do Tópico</h1>
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">"{topicName}"</p>
      </div>
    </header>

    <!-- Entry Form -->
    <section class="mb-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <InteractiveCard padding="lg">
        <h2 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Capturar Novo Insight</h2>
        
        <div class="grid grid-cols-3 gap-3 mb-8">
          {#each [
            { id: 'bizu', label: 'Bizu', icon: '💡', color: 'bg-amber-500', active: 'ring-amber-500 bg-amber-500 text-white' },
            { id: 'error', label: 'Erro', icon: '📕', color: 'bg-rose-500', active: 'ring-rose-500 bg-rose-500 text-white' },
            { id: 'annotation', label: 'Nota', icon: '📋', color: 'bg-indigo-500', active: 'ring-indigo-500 bg-indigo-500 text-white' }
          ] as type}
            <button
              class="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 {noteType === type.id ? type.active : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300'}"
              on:click={() => noteType = type.id}
            >
              <span class="text-xl">{type.icon}</span>
              <span class="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
            </button>
          {/each}
        </div>

        <div class="space-y-4">
          {#if noteType === 'bizu'}
            <div in:slide={{ duration: 300 }}>
              <label class="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1" for="note-title">Título (opcional)</label>
              <input
                id="note-title"
                type="text"
                class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white text-sm font-bold focus:border-primary-500 transition-all outline-none"
                placeholder="Ex: Mnemônico para Poderes"
                bind:value={noteTitle}
              />
            </div>
          {/if}

          <div>
            <label class="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1" for="note-content">Conteúdo</label>
            <textarea
              id="note-content"
              class="w-full px-4 py-3 min-h-[120px] rounded-xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white text-sm font-bold focus:border-primary-500 transition-all outline-none resize-none"
              placeholder={noteType === 'bizu' ? 'Qual é o bizu ou macete para nunca mais esquecer?' : noteType === 'error' ? 'Qual foi a pegadinha ou confusão que te fez errar?' : 'Escreva aqui sua anotação ou resumo rápido...'}
              bind:value={noteContent}
            ></textarea>
          </div>

          {#if noteType === 'error'}
            <div in:slide={{ duration: 300 }}>
              <label class="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1" for="note-comment">Causa do Erro (opcional)</label>
              <input
                id="note-comment"
                type="text"
                class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white text-sm font-bold focus:border-rose-500 transition-all outline-none"
                placeholder="Ex: Confundi competência privativa com exclusiva"
                bind:value={noteComment}
              />
            </div>
          {/if}

          <div class="flex items-center gap-4 pt-2">
            <button 
              on:click={saveNote} 
              disabled={saving || !noteContent.trim()}
              class="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
            >
              {saving ? 'PROCESSANDO...' : '💾 SALVAR AGORA'}
            </button>
            {#if saved}
              <span class="text-emerald-500 text-[10px] font-black uppercase tracking-tighter" in:fade>✓ Sincronizado</span>
            {/if}
          </div>
        </div>
      </InteractiveCard>
    </section>

    <!-- Display History -->
    {#if $notesStore.loading}
      <div class="flex flex-col items-center justify-center py-20 gap-4">
        <div class="w-10 h-10 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin"></div>
        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recuperando histórico...</span>
      </div>
    {:else}
      <div class="space-y-12">
        <!-- ERRORS SECTION -->
        {#if errors.length > 0}
          <section>
            <h3 class="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4 text-center">📕 ALERTA: ERROS MONITORADOS ({errors.length})</h3>
            <div class="space-y-4">
              {#each errors as err, i}
                <div class="animate-in fade-in slide-in-from-right-4 duration-500" style="animation-delay: {i * 100}ms">
                  <InteractiveCard padding="none">
                    <div class="flex items-stretch">
                       <div class="w-2 bg-rose-500 shrink-0"></div>
                       <div class="p-5 flex-1 bg-rose-50/20 dark:bg-rose-950/10">
                          <p class="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed italic">"{err.content}"</p>
                          {#if err.comment}
                            <div class="mt-3 pt-3 border-t border-rose-100 dark:border-rose-900/30 flex items-start gap-2">
                              <span class="text-rose-400 text-xs">💬</span>
                              <p class="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight leading-tight">{err.comment}</p>
                            </div>
                          {/if}
                       </div>
                       <button 
                        on:click={() => deleteNote(err.id)}
                        class="px-4 text-slate-300 hover:text-rose-500 transition-colors"
                        aria-label="Excluir erro"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                       </button>
                    </div>
                  </InteractiveCard>
                </div>
              {/each}
            </div>
          </section>
        {/if}

        <!-- BIZUS SECTION -->
        {#if bizus.length > 0}
          <section>
             <h3 class="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4 text-center">💡 BIBLIOTECA DE BIZUS ({bizus.length})</h3>
             <div class="space-y-4">
              {#each bizus as bizu, i}
                <div class="animate-in fade-in slide-in-from-right-4 duration-500" style="animation-delay: {i * 100}ms">
                  <InteractiveCard padding="none">
                    <div class="flex items-stretch">
                       <div class="w-2 bg-amber-500 shrink-0"></div>
                       <div class="p-5 flex-1 bg-amber-50/20 dark:bg-amber-950/10">
                          {#if bizu.title}
                            <h4 class="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight mb-2">{bizu.title}</h4>
                          {/if}
                          <p class="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed italic">"{bizu.content}"</p>
                       </div>
                       <button 
                        on:click={() => deleteNote(bizu.id)}
                        class="px-4 text-slate-300 hover:text-amber-500 transition-colors"
                        aria-label="Excluir bizu"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                       </button>
                    </div>
                  </InteractiveCard>
                </div>
              {/each}
            </div>
          </section>
        {/if}

        <!-- ANNOTATIONS SECTION -->
        {#if annotations.length > 0}
          <section>
             <h3 class="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 text-center">📋 ANOTAÇÕES E RESUMOS ({annotations.length})</h3>
             <div class="space-y-4">
              {#each annotations as ann, i}
                <div class="animate-in fade-in slide-in-from-right-4 duration-500" style="animation-delay: {i * 100}ms">
                  <InteractiveCard padding="none">
                    <div class="flex items-stretch">
                       <div class="w-2 bg-indigo-500 shrink-0"></div>
                       <div class="p-5 flex-1">
                          <p class="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-line">{ann.content}</p>
                       </div>
                       <button 
                        on:click={() => deleteNote(ann.id)}
                        class="px-4 text-slate-300 hover:text-indigo-500 transition-colors"
                        aria-label="Excluir anotação"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                       </button>
                    </div>
                  </InteractiveCard>
                </div>
              {/each}
            </div>
          </section>
        {/if}

        {#if bizus.length === 0 && errors.length === 0 && annotations.length === 0}
          <div class="text-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
             <div class="text-5xl mb-6 grayscale opacity-30">✍️</div>
             <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">
               O caderno está vazio.<br/>Capriche nas anotações durante o estudo!
             </p>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>
