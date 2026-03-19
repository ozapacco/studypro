# Registro de Componentes do Sistema

## Atualização: 2026-03-18 15:25

---

## Motor FSRS

**Estado**: ✅ Completo

### Arquivos

- `src/lib/fsrs/params.js` - Parâmetros default e constantes
- `src/lib/fsrs/states.js` - Estados (NEW, LEARNING, REVIEW, RELEARNING) e Ratings (1-4)
- `src/lib/fsrs/fsrs.js` - Motor principal com todas as funções matemáticas
- `src/lib/fsrs/optimizer.js` - Otimizador de parâmetros

### Funcionalidades

- Retrievability calculation
- Interval calculation
- Stability/Difficulty calculation
- Review processing
- Rating preview

---

## Session Generator

**Estado**: ✅ Completo

### Arquivos

- `src/lib/engines/sessionGenerator.js`

### Funcionalidades

- Geração de sessão diária
- Suporte a modo STRICT do tutor
- 5 tipos de blocos (urgent_review, new_content, review, questions, encoding)
- Daily Mission e Subject Health Panel
- Geração de sessão focada

---

## Scheduler

**Estado**: ✅ Completo

### Arquivos

- `src/lib/engines/scheduler.js`

### Funcionalidades

- getDueCards - Cards vencidos
- getNewCards - Cards novos (com limite diário)
- getLearningCards - Cards em aprendizado
- sortByPriority - Ordenação
- getQueueStats - Estatísticas
- estimateStudyTime - Estimativa de tempo

---

## Interleaver

**Estado**: ✅ Completo

### Arquivos

- `src/lib/engines/interleaver.js`

### Funcionalidades

- Intercalação de cards por matéria
- Seleção de próxima matéria
- Criação de ciclo de estudo
- Embaralhamento de blocos

---

## Database

**Estado**: ✅ Completo

### Arquivos

- `src/lib/db.js`

### Schema (Versão 4)

- config
- subjects
- topics
- cards
- reviewLogs
- sessions
- lessons
- dailyStats
- exams
- backups
- notes

---

## Analytics

**Estado**: ✅ Completo

### Arquivos

- `src/lib/engines/analytics.js`

### Funcionalidades

- Estatísticas por período
- Cálculo de sequência (streak)
- Tendência de performance
- Projeção de probabilidade de aprovação
- Cobertura do edital

---

## Session Store

**Estado**: ✅ Completo

### Arquivos

- `src/lib/stores/session.js`

### Funcionalidades

- Gerenciamento de sessão
- Processamento de respostas (usa FSRS)
- Persistência de progresso
- Estatísticas em tempo real
- Atalhos de teclado

---

## UI - Study Page

**Estado**: ✅ Completo

### Arquivos

- `src/routes/study/+page.svelte`

### Funcionalidades

- Pre-Voo overlay
- Tutor bar
- Session timer/progress
- StudyCard component
- Resumo de sessão
- Botão de notas

---

## UI - Dashboard (Home)

**Estado**: ✅ Completo

### Arquivos

- `src/routes/+page.svelte`

### Funcionalidades

- Tutor mission
- Queue stats (new, learning, review, overdue)
- Subject list with progress
- Projeção de aprovação
- Gamificação (streak, XP, nível)
- Edital widget

---

## UI - Settings

**Estado**: ✅ Completo

### Arquivos

- `src/routes/settings/+page.svelte`

### Funcionalidades

- Perfil e prova
- Rotina de estudo
- FSRS avançado
- Tutor mode
- Backup e importação
- Cloud sync com Supabase

---

## Cloud Sync

**Estado**: ✅ Completo

### Arquivos

- `src/lib/cloud/sync.js` - Sync logic
- `src/lib/cloud/supabase.js` - Supabase client

### Funcionalidades

- Snapshot collection
- Auto-sync em mudanças
- Sync manual
- Restore from cloud
- Status online/offline

---

## Backup/Export

**Estado**: ✅ Completo

### Funcionalidades (em db.js e settings)

- exportDatabase() - Exporta JSON
- importDatabase() - Importa backup
- cleanupOldData() - Remove logs antigos
- UI de export/import no settings

---

## Gamificação

**Estado**: ✅ Completo (Parcial)

### Funcionalidades

- Sistema de XP (configStore.addXP)
- Sistema de níveis (sqrt do XP)
- Streak tracking (incrementStreak, resetStreak)
- Dashboard exibe streak, XP, nível

**Pendente**: UI de configuração de gamificação

---

## Tabela de Exams

**Estado**: ⚠️ Parcial

### Status

- Schema existe no banco
- Cloud sync suporta
- Sem UI para gerenciar

---

**Última atualização**: 2026-03-18 15:25
