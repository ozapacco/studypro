<script>
  import { progress, currentBlock, sessionStats } from '$lib/stores';
  import ProgressBar from '../common/ProgressBar.svelte';
  import Badge from '../common/Badge.svelte';
  import { formatDuration } from '$lib/utils/date';

  const blockTypeLabel = {
    urgent_review: 'revisao urgente',
    new_content: 'conteudo novo',
    review: 'revisao',
    questions: 'questoes',
    encoding: 'consolidacao'
  };

  $: correctRate =
    $sessionStats.cardsReviewed > 0
      ? (($sessionStats.correctCount / $sessionStats.cardsReviewed) * 100).toFixed(0)
      : 0;
</script>

<div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
  <div class="flex items-center justify-between mb-2 gap-3 flex-wrap">
    <div class="flex items-center gap-3">
      <Badge>{blockTypeLabel[$currentBlock?.type] || $currentBlock?.type || 'carregando'}</Badge>
      <span class="text-sm text-gray-600 dark:text-gray-400">{$currentBlock?.title || ''}</span>
    </div>

    <div class="flex items-center gap-4 text-sm">
      <span class="text-gray-500"><span class="font-medium text-gray-700 dark:text-gray-300">{$sessionStats.cardsReviewed}</span> cards</span>
      <span class="text-green-600">{correctRate}% acerto</span>
      <span class="text-gray-500">{formatDuration(Math.round($sessionStats.totalTime / 60000))}</span>
    </div>
  </div>

  <div class="flex items-center gap-3">
    <ProgressBar value={$progress.current} max={$progress.total || 1} color="primary" size="md" />
    <span class="text-sm text-gray-500 whitespace-nowrap">{$progress.current}/{$progress.total}</span>
  </div>
</div>
