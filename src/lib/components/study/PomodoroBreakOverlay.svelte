<script>
  export let isLong = false;
  export let onSkip;
  export let onStartBreak;

  const breakMinutes = isLong ? 15 : 5;
</script>

<div class="fixed inset-0 bg-indigo-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-in">
    
    <div class="text-6xl mb-4">{isLong ? '🌿' : '☕'}</div>
    
    <h2 class="text-2xl font-black text-slate-800 dark:text-white mb-2">
      {isLong ? 'Pausa Longa!' : 'Hora da Pausa!'}
    </h2>
    
    <p class="text-slate-500 dark:text-slate-400 text-sm mb-6 font-medium">
      {#if isLong}
        Você completou 4 blocos de estudo! Faça uma pausa de 15 minutos — levante, coma algo leve, descanse os olhos.
      {:else}
        Você estudou por 25 minutos. Uma pausa curta de 5 minutos melhora a retenção em até 20%!
      {/if}
    </p>

    <div class="flex gap-3">
      <button 
        on:click={onSkip}
        class="flex-1 border-2 border-slate-200 dark:border-slate-700 rounded-xl py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
      >
        Continuar estudando
      </button>
      <button 
        on:click={onStartBreak}
        class="flex-1 bg-primary-600 text-white rounded-xl py-3 text-sm font-black shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all"
      >
        Fazer pausa ({breakMinutes} min)
      </button>
    </div>
  </div>
</div>

<style>
  @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>