<script>
  import { createEventDispatcher } from 'svelte';
  import { db } from '$lib/db.js';
  import PlantUMLRenderer from './PlantUMLRenderer.svelte';

  export let topic;

  const dispatch = createEventDispatcher();

  let editing = false;
  let pumlCode = topic?.mindMapPuml || '';
  let preview = false;
  let saving = false;
  let hasChanges = false;

  $: hasChanges = pumlCode !== (topic?.mindMapPuml || '');

  async function generateSmartTemplate() {
    if (!topic?.id) return;
    const lessons = await db.lessons.where('topicId').equals(topic.id).sortBy('order');
    
    let base = `@startmindmap\n* ${topic?.name || 'Topico'}\n`;
    
    if (lessons.length > 0) {
      lessons.forEach(l => {
        base += `** ${l.title}\n`;
      });
    } else {
      base += `** Conceito 1\n*** Sub-conceito A\n*** Sub-conceito B\n** Conceito 2\n`;
    }
    
    base += `@endmindmap`;
    pumlCode = base;
  }

  function generateFlowTemplate() {
    pumlCode = `@startuml
skinparam backgroundColor #FEFEFE
start
: ${topic?.name || 'Topico'};
:**Passo 1**;
:**Passo 2**;
:**Passo 3**;
stop
@enduml`;
  }

  function generateTimelineTemplate() {
    pumlCode = `@startuml
scale 2
title ${topic?.name || 'Topico'}
:<<event>> **Marco 1**;
:atividade;
:<<event>> **Marco 2**;
@enduml`;
  }

  async function save() {
    if (!topic?.id) return;
    saving = true;
    await db.topics.update(topic.id, {
      mindMapPuml: pumlCode.trim() || null,
      updatedAt: new Date().toISOString()
    });
    topic = { ...topic, mindMapPuml: pumlCode.trim() || null };
    editing = false;
    saving = false;
    dispatch('saved', { topic });
  }

  function cancel() {
    pumlCode = topic?.mindMapPuml || '';
    editing = false;
  }

  function startEdit() {
    editing = true;
    preview = false;
  }

  function clearMap() {
    pumlCode = '';
  }
</script>

<div class="mindmap-editor">
  {#if !editing}
    {#if topic?.mindMapPuml}
      <PlantUMLRenderer puml={topic.mindMapPuml} collapsed={false} />
      <button class="btn-edit-top" on:click={startEdit}>
        ✏️ Editar mapa
      </button>
    {:else}
      <div class="empty-map">
        <span class="empty-icon">🧠</span>
        <p>Nenhum mapa mental definido para este topico.</p>
        <button class="btn-create" on:click={startEdit}>
          + Criar mapa mental
        </button>
      </div>
    {/if}
  {:else}
    <div class="editor-panel">
      <div class="editor-header">
        <h4 class="editor-title">✏️ Editor de Mapa Mental</h4>
        <div class="editor-actions">
          <button class="action-btn" on:click={() => preview = !preview}>
            {preview ? '📝 Editar' : '👁️ Preview'}
          </button>
          <button class="action-btn" on:click={cancel}>Cancelar</button>
          <button class="action-btn primary" on:click={save} disabled={saving || !hasChanges}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <!-- Templates -->
      <div class="templates-bar">
        <span class="templates-label">Templates:</span>
        <button class="tpl-btn smart" on:click={generateSmartTemplate} title="Gerar baseado nas aulas">✨ Smart</button>
        <button class="tpl-btn" on:click={() => generateSmartTemplate()}>🧠 Mapa Mental</button>
        <button class="tpl-btn" on:click={generateFlowTemplate}>🔄 Fluxo</button>
        <button class="tpl-btn" on:click={generateTimelineTemplate}>📅 Linha do Tempo</button>
        <button class="tpl-btn danger" on:click={clearMap}>🗑️ Limpar</button>
      </div>

      {#if preview}
        <PlantUMLRenderer puml={pumlCode} collapsed={false} />
      {:else}
        <textarea
          class="code-editor"
          bind:value={pumlCode}
          placeholder="@startmindmap
* Meu Topico
** Subtopico 1
*** Detalhe A
** Subtopico 2
@endmindmap"
          spellcheck="false"
        ></textarea>
      {/if}

      <!-- Ajuda rapida -->
      <details class="help-section">
        <summary class="help-toggle">📖 Como usar PlantUML</summary>
        <div class="help-content">
          <pre class="help-code">Sintaxe Mapa Mental:

* Topico raiz
** Subtopico nivel 2
*** Subtopico nivel 3

Sintaxe Fluxo:

start
:acao;
if (condicao) then (sim)
  :passo A;
else (nao)
  :passo B;
endif
stop

Links uteis:
- https://plantuml.com/cheat-sheet
- https://kroki.io (renderizacao online)</pre>
        </div>
      </details>
    </div>
  {/if}
</div>

<style>
  .mindmap-editor { font-family: inherit; }

  .btn-edit-top {
    display: block;
    width: 100%;
    margin-top: 8px;
    padding: 8px;
    background: none;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    color: #6366f1;
    transition: all 0.15s;
  }
  .btn-edit-top:hover { border-color: #6366f1; background: rgba(99,102,241,0.05); }

  .empty-map {
    text-align: center;
    padding: 1.5rem;
    background: #f8fafc;
    border: 1px dashed #e2e8f0;
    border-radius: 8px;
  }
  :global(.dark) .empty-map { background: #1e293b; border-color: #334155; }
  .empty-icon { font-size: 1.5rem; display: block; margin-bottom: 6px; }
  .empty-map p { font-size: 0.85rem; color: #64748b; margin-bottom: 10px; }
  .btn-create {
    padding: 8px 20px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    transition: transform 0.15s;
  }
  .btn-create:hover { transform: translateY(-1px); }

  /* Editor */
  .editor-panel {
    border: 2px solid #6366f1;
    border-radius: 8px;
    overflow: hidden;
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    flex-wrap: wrap;
    gap: 8px;
  }
  :global(.dark) .editor-header { background: #1e293b; border-color: #334155; }
  .editor-title { font-size: 0.85rem; font-weight: 700; color: #475569; margin: 0; }
  :global(.dark) .editor-title { color: #94a3b8; }
  .editor-actions { display: flex; gap: 6px; flex-wrap: wrap; }

  .action-btn {
    padding: 4px 10px;
    font-size: 0.75rem;
    font-weight: 600;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    color: #64748b;
    transition: all 0.15s;
  }
  :global(.dark) .action-btn { background: #273548; border-color: #334155; color: #94a3b8; }
  .action-btn:hover { border-color: #6366f1; color: #6366f1; }
  .action-btn.primary {
    background: #6366f1;
    border-color: #6366f1;
    color: white;
  }
  .action-btn.primary:hover { background: #4f46e5; }
  .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Templates */
  .templates-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #f1f5f9;
    border-bottom: 1px solid #e2e8f0;
    flex-wrap: wrap;
  }
  :global(.dark) .templates-bar { background: #0f172a; border-color: #1e293b; }
  .templates-label { font-size: 0.7rem; font-weight: 600; color: #94a3b8; flex-shrink: 0; }
  .tpl-btn {
    padding: 3px 8px;
    font-size: 0.7rem;
    font-weight: 600;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    cursor: pointer;
    color: #475569;
    transition: all 0.15s;
    white-space: nowrap;
  }
  :global(.dark) .tpl-btn { background: #1e293b; border-color: #334155; color: #94a3b8; }
  .tpl-btn:hover { border-color: #6366f1; color: #6366f1; }
  .tpl-btn.smart { border-color: #10b981; color: #10b981; background: rgba(16, 185, 129, 0.05); }
  .tpl-btn.smart:hover { background: rgba(16, 185, 129, 0.1); border-color: #059669; }
  .tpl-btn.danger:hover { border-color: #ef4444; color: #ef4444; }

  /* Code editor */
  .code-editor {
    width: 100%;
    min-height: 200px;
    max-height: 350px;
    padding: 12px;
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 0.75rem;
    line-height: 1.6;
    border: none;
    border-top: 1px solid #e2e8f0;
    resize: vertical;
    background: #0f172a;
    color: #94a3b8;
    outline: none;
    tab-size: 2;
  }
  .code-editor::placeholder { color: #475569; }

  /* Help */
  .help-section {
    border-top: 1px solid #e2e8f0;
  }
  :global(.dark) .help-section { border-color: #1e293b; }
  .help-toggle {
    padding: 8px 12px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    background: #f8fafc;
  }
  :global(.dark) .help-toggle { background: #1e293b; color: #94a3b8; }
  .help-content {
    padding: 0;
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.3s ease, padding 0.3s ease;
  }
  details[open] .help-content {
    padding: 12px;
    max-height: 300px;
  }
  .help-code {
    font-family: 'Fira Code', monospace;
    font-size: 0.7rem;
    line-height: 1.6;
    color: #475569;
    background: white;
    margin: 0;
    white-space: pre-wrap;
  }
  :global(.dark) .help-code { background: #0f172a; color: #94a3b8; }
</style>
