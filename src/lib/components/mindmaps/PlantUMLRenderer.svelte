<script>
  export let puml = '';
  export let collapsed = true;
  export let showRaw = false;

  let rendered = false;
  let imgUrl = '';
  let svgContent = '';
  let loading = false;
  let error = false;
  let offlineMode = false;
  let cachedSvg = null;

  const CACHE_KEY_PREFIX = 'plantuml_svg_';

  function encodePlantUML(source) {
    try {
      const encoded = btoa(unescape(encodeURIComponent(source)));
      return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch {
      return '';
    }
  }

  function getCacheKey(source) {
    return CACHE_KEY_PREFIX + encodePlantUML(source).slice(0, 32);
  }

  function loadFromCache(source) {
    try {
      const key = getCacheKey(source);
      const cached = localStorage.getItem(key);
      if (cached) {
        const { svg, url, ts } = JSON.parse(cached);
        const age = Date.now() - ts;
        if (age < 7 * 24 * 60 * 60 * 1000) {
          return { svg, url };
        }
        localStorage.removeItem(key);
      }
    } catch { /* ignore */ }
    return null;
  }

  function saveToCache(source, svg, url) {
    try {
      const key = getCacheKey(source);
      localStorage.setItem(key, JSON.stringify({
        svg,
        url,
        ts: Date.now(),
      }));
    } catch { /* quota exceeded */ }
  }

  function buildKrokiUrl(source) {
    const encoded = encodePlantUML(source);
    if (!encoded) return '';
    return `https://kroki.io/plantuml/svg/~1${encoded}`;
  }

  async function render() {
    if (!puml?.trim()) return;
    loading = true;
    error = false;
    offlineMode = false;
    cachedSvg = null;

    cachedSvg = loadFromCache(puml);
    if (cachedSvg) {
      imgUrl = cachedSvg.url;
      svgContent = cachedSvg.svg;
      rendered = true;
      loading = false;
      return;
    }

    imgUrl = buildKrokiUrl(puml);
    rendered = true;
    loading = false;
  }

  function handleRenderError() {
    error = true;
    offlineMode = !navigator.onLine;
  }

  function handleLoadSuccess() {
    if (imgUrl && !cachedSvg) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 800;
          canvas.height = img.naturalHeight || 600;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const svg = canvas.toDataURL('image/svg+xml');
          saveToCache(puml, svg, imgUrl);
        } catch { /* ignore */ }
      };
      img.onerror = handleRenderError;
      img.src = imgUrl;
    }
  }

  function toggle() {
    collapsed = !collapsed;
    if (!collapsed && !rendered) {
      render();
    }
  }

  $: if (!collapsed && puml && !rendered) {
    render();
  }

  const TEMPLATES = {
    mindmap: `@startmindmap
* {topicName}
** Subtopico 1
*** Detalhe A
*** Detalhe B
** Subtopico 2
*** Detalhe C
** Subtopico 3
@endmindmap`,
    flow: `@startuml
skinparam backgroundColor #FEFEFE
skinparam activity {
  BackgroundColor #6366F1
  BorderColor #4F46E5
  FontColor white
}
start
:{topicName};
:**Subtopico 1**;
:**Subtopico 2**;
stop
@enduml`,
  };

  export function getTemplate(type = 'mindmap', topicName = '') {
    return TEMPLATES[type]?.replace(/{topicName}/g, topicName) || TEMPLATES.mindmap;
  }
</script>

<div class="puml-renderer">
  {#if collapsed}
    <button class="toggle-btn" on:click={toggle}>
      <span class="toggle-icon">🧠</span>
      <span>Ver mapa mental</span>
      <span class="toggle-arrow">▼</span>
    </button>
  {:else}
    <div class="map-container">
      <div class="map-header">
        <span class="map-label">🧠 Mapa Mental</span>
        <div class="map-actions">
          {#if imgUrl}
            <button class="action-btn" on:click={() => { navigator.clipboard.writeText(imgUrl); }} title="Copiar link da imagem">🔗 Link</button>
          {/if}
          {#if showRaw}
            <button class="action-btn" on:click={() => showRaw = false} title="Ocultar codigo">👁️ Visualizar</button>
          {:else}
            <button class="action-btn" on:click={() => showRaw = true} title="Ver codigo PlantUML">📝 Codigo</button>
          {/if}
          <button class="action-btn" on:click={toggle} title="Fechar mapa">✕</button>
        </div>
      </div>

      {#if showRaw}
        <pre class="raw-code">{puml}</pre>
      {:else if loading}
        <div class="map-loading">
          <div class="spinner"></div>
          <span>Gerando mapa...</span>
        </div>
      {:else if imgUrl}
        <div class="map-img-wrap">
          {#if error}
            <div class="map-error">
              <span class="error-icon">{offlineMode ? '📴' : '⚠️'}</span>
              <p class="error-msg">
                {offlineMode
                  ? 'Sem conexao. O mapa mental nao esta em cache.'
                  : 'Nao foi possivel carregar o mapa. Tente novamente.'}
              </p>
              {#if cachedSvg}
                <p class="cache-note">Ha uma versao em cache antiga disponivel.</p>
              {:else}
                <p class="cache-note">Edite o mapa mental para gerar novamente quando estiver online.</p>
              {/if}
            </div>
          {:else}
            <img
              src={imgUrl}
              alt="Mapa mental do topico"
              class="map-img"
              on:error={handleRenderError}
              on:load={handleLoadSuccess}
            />
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .puml-renderer { font-family: inherit; }

  .toggle-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 14px;
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    color: #6366f1;
    transition: all 0.15s;
    text-align: left;
  }
  :global(.dark) .toggle-btn { background: #1e293b; border-color: #334155; }
  .toggle-btn:hover {
    border-color: #6366f1;
    background: rgba(99,102,241,0.05);
  }
  .toggle-icon { font-size: 1rem; }
  .toggle-arrow { margin-left: auto; font-size: 0.7rem; color: #94a3b8; }

  .map-container {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    background: #f8fafc;
  }
  :global(.dark) .map-container { border-color: #334155; background: #0f172a; }

  .map-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: white;
    border-bottom: 1px solid #e2e8f0;
  }
  :global(.dark) .map-header { background: #1e293b; border-color: #334155; }
  .map-label { font-size: 0.75rem; font-weight: 700; color: #475569; }
  :global(.dark) .map-label { color: #94a3b8; }
  .map-actions { display: flex; gap: 6px; }
  .action-btn {
    padding: 3px 8px;
    font-size: 0.7rem;
    background: none;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    cursor: pointer;
    color: #64748b;
    transition: all 0.15s;
  }
  :global(.dark) .action-btn { border-color: #334155; color: #94a3b8; }
  .action-btn:hover { border-color: #6366f1; color: #6366f1; }

  .map-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 2rem;
    color: #64748b;
    font-size: 0.85rem;
  }
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #e2e8f0;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .map-img-wrap {
    padding: 12px;
    display: flex;
    justify-content: center;
    background: white;
    overflow-x: auto;
  }
  :global(.dark) .map-img-wrap { background: #1e293b; }

  .map-img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
  }

  .map-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 2rem;
    text-align: center;
    color: #64748b;
  }
  .error-icon { font-size: 2rem; }
  .error-msg { font-size: 0.85rem; font-weight: 600; color: #475569; }
  :global(.dark) .error-msg { color: #94a3b8; }
  .cache-note { font-size: 0.75rem; color: #94a3b8; }

  .raw-code {
    margin: 0;
    padding: 12px;
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 0.7rem;
    line-height: 1.5;
    color: #475569;
    background: white;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 300px;
    overflow-y: auto;
  }
  :global(.dark) .raw-code { background: #0f172a; color: #94a3b8; }
</style>
