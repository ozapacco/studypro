<script>
  export let concept = '';
  export let onContinue;

  let explanation = '';
  let showHint = false;
</script>

<div class="max-w-xl mx-auto text-center py-8 px-4 flex flex-col gap-6">
  
  <div class="text-5xl">🧠</div>
  
  <div>
    <h2 class="text-2xl font-black text-slate-800 dark:text-white mb-2">Modo Feynman</h2>
    <p class="text-slate-500 dark:text-slate-400 text-sm">
      Antes de ver a resposta, tente explicar <strong class="text-primary-600">"{concept}"</strong>
      com suas próprias palavras — como explicaria para uma criança de 10 anos.
    </p>
  </div>

  <textarea
    bind:value={explanation}
    placeholder="Escreva aqui sua explicação..."
    rows="5"
    class="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4
           bg-white dark:bg-slate-800 text-sm resize-none focus:outline-none
           focus:border-primary-500 transition-colors font-medium"
  ></textarea>

  {#if !showHint}
    <button 
      on:click={() => showHint = true}
      class="text-xs text-slate-400 hover:text-primary-500 transition-colors underline"
    >
      Preciso de uma dica →
    </button>
  {:else}
    <div class="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20
                rounded-xl p-4 text-left">
      <span class="font-bold">💡 Dica:</span> Tente lembrar: quais são os elementos principais? 
      Quais são as consequências? Como este conceito se relaciona com outros que você já conhece?
    </div>
  {/if}

  <button
    on:click={() => onContinue(explanation)}
    disabled={explanation.trim().length < 10}
    class="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-primary-500/20
           hover:bg-primary-700 hover:scale-105 transition-all
           disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
  >
    Ver Resposta e Comparar →
  </button>

  <p class="text-[10px] text-slate-400 font-bold">
    Mínimo 10 caracteres para continuar
  </p>

</div>