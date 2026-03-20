<script>
  import Card from '$lib/components/common/Card.svelte';
  import Button from '$lib/components/common/Button.svelte';
</script>

<svelte:head>
  <title>Ajuda | Sistemão</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8 space-y-8">
  <header class="text-center">
    <h1 class="text-3xl font-black text-slate-800 dark:text-white mb-2">Central de Ajuda</h1>
    <p class="text-slate-500 dark:text-slate-400">Tudo o que você precisa para começar a estudar.</p>
  </header>

  <!-- Primeiros Passos -->
  <section>
    <h2 class="text-lg font-black text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
      <span>🚀</span> Primeiros Passos
    </h2>
    <Card padding="lg">
      <ol class="space-y-4">
        <li class="flex items-start gap-3">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-black flex items-center justify-center">1</span>
          <div>
            <p class="font-bold text-slate-700 dark:text-slate-200">Configure sua prova</p>
            <p class="text-sm text-slate-500">Em <a href="/settings" class="text-primary-500 hover:underline">Ajustes</a>, informe o nome e data do seu concurso ou prova.</p>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-black flex items-center justify-center">2</span>
          <div>
            <p class="font-bold text-slate-700 dark:text-slate-200">Cadastre suas matérias</p>
            <p class="text-sm text-slate-500">Em <a href="/subjects" class="text-primary-500 hover:underline">Matérias</a>, adicione os temas do seu edital com peso relativo.</p>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-black flex items-center justify-center">3</span>
          <div>
            <p class="font-bold text-slate-700 dark:text-slate-200">Crie seus flashcards</p>
            <p class="text-sm text-slate-500">Em <a href="/cards" class="text-primary-500 hover:underline">Cartões</a>, escreva perguntas e respostas parafixar o conteúdo.</p>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-black flex items-center justify-center">4</span>
          <div>
            <p class="font-bold text-slate-700 dark:text-slate-200">Estude com a missão recomendada</p>
            <p class="text-sm text-slate-500">Em <a href="/study" class="text-primary-500 hover:underline">Estudo</a>, o tutor sugere o melhor próximo passo baseado no seu desempenho.</p>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-black flex items-center justify-center">5</span>
          <div>
            <p class="font-bold text-slate-700 dark:text-slate-200">Acompanhe seu progresso</p>
            <p class="text-sm text-slate-500">Veja estatísticas em <a href="/stats" class="text-primary-500 hover:underline">Estatísticas</a> e o domínio do edital em <a href="/edital" class="text-primary-500 hover:underline">Edital</a>.</p>
          </div>
        </li>
      </ol>
    </Card>
  </section>

  <!-- Modos do Tutor -->
  <section>
    <h2 class="text-lg font-black text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
      <span>🧠</span> Como Funciona o Tutor
    </h2>
    <Card padding="lg">
      <div class="space-y-4">
        <div>
          <h3 class="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span>💡</span> Passivo
          </h3>
          <p class="text-sm text-slate-500 mt-1">Sugere tópicos, mas você decide. Ideal para quem está conhecendo o sistema.</p>
        </div>
        <div>
          <h3 class="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span>🧠</span> Ativo <span class="text-xs px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded">Recomendado</span>
          </h3>
          <p class="text-sm text-slate-500 mt-1">Recomenda a missão ideal e alerta se você pular muito conteúdo. Melhor para estudo consistente.</p>
        </div>
        <div>
          <h3 class="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span>🎯</span> Estrito
          </h3>
          <p class="text-sm text-slate-500 mt-1">Bloqueia se você pular etapas. Para quem quer mastery de um assunto antes de avançar.</p>
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <p class="text-xs text-slate-400">Configure o modo em <a href="/settings" class="text-primary-500 hover:underline">Ajustes</a> → Inteligência do Tutor.</p>
      </div>
    </Card>
  </section>

  <!-- Estados do Card -->
  <section>
    <h2 class="text-lg font-black text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
      <span>📇</span> Estados dos Cards
    </h2>
    <Card padding="lg">
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black rounded">NOVO</span>
          <span class="text-sm text-slate-600 dark:text-slate-300">Card que você ainda não viu</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-black rounded">APRENDENDO</span>
          <span class="text-sm text-slate-600 dark:text-slate-300">Em fase de memorização (intervalos curtos)</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-black rounded">REVISÃO</span>
          <span class="text-sm text-slate-600 dark:text-slate-300">Em复习 programada pelo FSRS</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-black rounded">REAPRENDENDO</span>
          <span class="text-sm text-slate-600 dark:text-slate-300">Você esqueceu e está reaprendendo</span>
        </div>
      </div>
    </Card>
  </section>

  <!-- Cloud e Backup -->
  <section>
    <h2 class="text-lg font-black text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
      <span>☁️</span> Nuvem e Backup
    </h2>
    <Card padding="lg">
      <div class="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
        <p class="text-sm font-bold text-amber-700 dark:text-amber-400">⚠️ Experimental</p>
        <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">A sincronização na nuvem é um <strong>snapshot</strong>, não um backup em tempo real. Não há login/conta.</p>
      </div>
      <p class="text-sm text-slate-500">Para segurança extra, exporte seus dados regularmente em <a href="/settings" class="text-primary-500 hover:underline">Ajustes</a>.</p>
    </Card>
  </section>

  <!-- Footer -->
  <footer class="text-center pt-8 border-t border-slate-200 dark:border-slate-700">
    <a href="/" class="text-sm text-slate-400 hover:text-primary-500">
      ← Voltar ao painel
    </a>
  </footer>
</div>
