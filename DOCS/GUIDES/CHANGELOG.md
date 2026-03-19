# Changelog — Sistemão

## 2026-03-18 (Sessão 3 - Bugfix)

### Corrigido

- **`src/lib/components/edital/SubjectDrilldown.svelte`**
  - Bug BUG-001: Botão "Estudar" no header passava `subject.id` como `topicId`, mas a página de estudo espera ID de tópico. Corrigido para buscar o tópico mais importante (por `importance`) da matéria e redirecionar para `/study?topicId={bestTopicId}`.
  - Adicionado `bestTopicId` calculado no `onMount` (primeiro tópico após ordenação por importância).

- **`src/lib/components/study/TopicNotes.svelte`**
  - Proteção contra colagem de imagem no textarea — intercepta paste e mostra alerta se houver imagem na clipboard.

---

## 2026-03-18 (Sessão 3)

- **`tests/tutorEngine.test.js`**
  - 14 testes: thresholds, modes, mastery labels, calculateSubjectMastery, actionToBlockType, estimateTime

- **`tests/adaptiveAllocator.test.js`**
  - 19 testes: allocate, getStudyProfile, calculateTimeAllocation, getRecommendedFocus

### Alterado

- **`src/lib/components/edital/SubjectDrilldown.svelte`**
  - Importado e integrado MasteryGauge
  - Header da matéria agora exibe gauge circular grande com domínio geral
  - Lista de tópicos exibe gauge circular pequeno em cada tópico
  - Adicionadas métricas de retenção/acerto/cobertura abaixo do nome da matéria

---

## 2026-03-18 (Sessão 2)

### Adicionado

- **`src/lib/components/study/MasteryGauge.svelte`**
  - Widget circular SVG com animação de preenchimento
  - Cores dinâmicas por domínio: verde (≥85%), amarelo (60-84%), laranja (40-59%), vermelho (<40%)
  - 3 tamanhos: sm/md/lg

- **`src/lib/cloud/sync.js`**
  - `getCloudStatus()` agora retorna `lastSyncAt` (timestamp ISO)
  - `syncNow()` salva última sync no localStorage após sucesso

### Alterado

- **`src/lib/components/mindmaps/PlantUMLRenderer.svelte`**
  - Adicionado cache em localStorage (7 dias) via `loadFromCache()`/`saveToCache()`
  - Adicionado `handleLoadSuccess()` para cache assíncrono
  - Adicionado `handleRenderError()` com detecção offline
  - Adicionado estado `offlineMode` com mensagem informativa
  - Template HTML refatorado para mostrar estado de erro

- **`src/routes/settings/+page.svelte`**
  - UI de sincronização Supabase redesenhada com indicador visual (dot)
  - Mostra timestamp da última sync
  - Mostra status: Online / Offline / Sincronizando
  - Adicionados estilos CSS para `.sync-status-row` e `.status-dot`

---

## Histórico

### Pré-existente (antes de 2026-03-18)

- Tutor engine completo (tutorEngine.js)
- Domínio do edital (EditalMasteryPanel, SubjectDrilldown, EditalWidget)
- PreVoo com ritual pré-estudo
- PlantUML renderer + editor
- Adaptive allocator
- Session generator com generateFocusedSession
- finishWithRecalc no session store
- Dashboard com toggle de modo tutor
- Settings com tutor mode UI
- Schema db.js v4 com mindMapPuml
