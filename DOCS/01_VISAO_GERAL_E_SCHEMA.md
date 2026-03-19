# BLUEPRINT: Sistema de Estudos de Elite
## Parte 1: Visão Geral e Schema do Banco de Dados

---

## 1. VISÃO GERAL DO SISTEMA

### 1.1 Propósito
Sistema local de estudos para concursos públicos, baseado em ciência cognitiva, que implementa:
- Repetição espaçada com algoritmo FSRS (Free Spaced Repetition Scheduler)
- Intercalação inteligente de matérias
- Calibração automática de dificuldade (zona ótima: 85% acerto)
- Geração automática de sessões diárias otimizadas
- Tracking completo de progresso e projeções

### 1.2 Stack Tecnológica
```
Frontend:     Svelte + SvelteKit
Persistência: Dexie.js (wrapper IndexedDB)
Estilização:  TailwindCSS
Build:        Vite
```

### 1.3 Princípios Arquiteturais
- **Offline-first**: Funciona 100% sem internet
- **Dados locais**: Usuário é dono dos seus dados
- **Performance**: Bundle < 100kb gzipped
- **Modular**: Cada módulo é independente e testável

---

## 2. ARQUITETURA DE ALTO NÍVEL

```
┌─────────────────────────────────────────────────────────────┐
│                        UI LAYER                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │Dashboard│ │ Sessão  │ │Questões │ │Progresso│           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       └───────────┴───────────┴───────────┘                 │
│                        │                                     │
├────────────────────────┼─────────────────────────────────────┤
│                   STATE LAYER                                │
│  ┌─────────────────────┴─────────────────────┐              │
│  │              Svelte Stores                 │              │
│  │  ┌────────┐ ┌────────┐ ┌────────┐        │              │
│  │  │userStore│ │cardStore│ │sessionStore│   │              │
│  │  └────────┘ └────────┘ └────────┘        │              │
│  └───────────────────────────────────────────┘              │
│                        │                                     │
├────────────────────────┼─────────────────────────────────────┤
│                  LOGIC LAYER                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  FSRS   │ │Scheduler│ │Interleav│ │Analytics│           │
│  │ Engine  │ │ Engine  │ │  Engine │ │ Engine  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                        │                                     │
├────────────────────────┼─────────────────────────────────────┤
│                   DATA LAYER                                 │
│  ┌─────────────────────┴─────────────────────┐              │
│  │              Dexie.js                      │              │
│  │         (IndexedDB wrapper)                │              │
│  └───────────────────────────────────────────┘              │
│                        │                                     │
│  ┌─────────────────────┴─────────────────────┐              │
│  │              IndexedDB                     │              │
│  │           (Browser Storage)                │              │
│  └───────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. SCHEMA DO BANCO DE DADOS (Dexie.js)

### 3.1 Inicialização do Dexie

```javascript
// src/lib/db.js
import Dexie from 'dexie';

export const db = new Dexie('StudySystemDB');

db.version(1).stores({
  // Configuração do usuário e concurso
  config: '++id',
  
  // Matérias do edital
  subjects: '++id, name, weight, &order',
  
  // Tópicos dentro de cada matéria
  topics: '++id, subjectId, name, &[subjectId+order]',
  
  // Cards de estudo (questões, flashcards, conceitos)
  cards: '++id, topicId, subjectId, type, state, due, [state+due], [subjectId+state]',
  
  // Logs de revisão (histórico completo)
  reviewLogs: '++id, cardId, timestamp, [cardId+timestamp]',
  
  // Sessões de estudo
  sessions: '++id, date, status, [date+status]',
  
  // Aulas/PDFs de cada tópico
  lessons: '++id, topicId, &[topicId+order], completed',
  
  // Estatísticas diárias agregadas
  dailyStats: '++id, &date',
  
  // Provas realizadas
  exams: '++id, date',
  
  // Backup metadata
  backups: '++id, timestamp'
});
```

### 3.2 Tabela: config (Configuração Global)

```javascript
// Estrutura do registro único de configuração
{
  id: 1, // Sempre 1 (registro único)
  
  // Dados pessoais
  userName: "João Silva",
  
  // Concurso alvo
  targetExam: {
    name: "SEFAZ-MG",
    date: "2025-06-15", // ISO date
    institution: "Secretaria da Fazenda de Minas Gerais",
    positions: 50, // vagas
    registrationDeadline: "2025-04-01"
  },
  
  // Disponibilidade
  schedule: {
    weeklyHours: 25, // horas semanais totais
    dailyDistribution: {
      monday: 4,
      tuesday: 4,
      wednesday: 4,
      thursday: 4,
      friday: 4,
      saturday: 3,
      sunday: 2
    },
    preferredStartTime: "06:00", // HH:mm
    breakDuration: 10, // minutos entre blocos
    sessionBlockMinutes: 50 // duração de cada bloco (Pomodoro-like)
  },
  
  // Parâmetros FSRS personalizados (calibrados com o tempo)
  fsrsParams: {
    w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
    requestRetention: 0.85, // 85% de retenção desejada
    maximumInterval: 365, // máximo de dias entre revisões
    enableFuzz: true
  },
  
  // Preferências de estudo
  preferences: {
    newCardsPerDay: 20, // novos cards por dia
    maxReviewsPerDay: 200, // limite de revisões
    interleaveSubjects: true, // misturar matérias
    showAnswerTime: true, // mostrar tempo de resposta
    enableSound: true,
    theme: "system" // "light" | "dark" | "system"
  },
  
  // Gamificação
  gamification: {
    allies: [], // até 5 strings
    villains: [], // até 25 strings
    powerUps: [], // até 30 strings
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    level: 1
  },
  
  // Metadados
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-03-20T14:22:00Z"
}
```

### 3.3 Tabela: subjects (Matérias)

```javascript
{
  id: 1,
  
  // Identificação
  name: "Direito Tributário",
  shortName: "DTrib", // para exibição compacta
  color: "#7C3AED", // cor hex para UI
  icon: "scale", // nome do ícone (opcional)
  
  // Peso no edital
  weight: 15, // percentual do edital (1-100)
  questionCount: 12, // quantidade de questões na prova
  
  // Ciclo de estudo
  cycleMinutes: 60, // minutos por ciclo nesta matéria
  order: 1, // ordem no ciclo (1, 2, 3...)
  
  // Nível atual do usuário (0-100)
  proficiencyLevel: 35,
  
  // Estatísticas agregadas
  stats: {
    totalCards: 450,
    matureCards: 120, // cards com intervalo > 21 dias
    learningCards: 80,
    newCards: 250,
    averageEase: 2.4,
    retention: 0.82 // taxa de retenção real
  },
  
  // Metadados
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-03-20T14:22:00Z"
}
```

### 3.4 Tabela: topics (Tópicos)

```javascript
{
  id: 1,
  subjectId: 1, // FK para subjects
  
  // Identificação
  name: "Limitações Constitucionais ao Poder de Tributar",
  order: 3, // ordem dentro da matéria
  
  // Progresso no conteúdo teórico
  theory: {
    totalLessons: 8, // total de aulas/PDFs
    completedLessons: 5,
    lastLessonAt: "2024-03-18T16:00:00Z",
    currentPage: 45,
    totalPages: 120,
    notes: "Revisar imunidades recíprocas" // anotação livre
  },
  
  // Importância relativa (1-5)
  importance: 5, // 5 = muito cobrado
  
  // Dificuldade percebida (1-5)
  difficulty: 4,
  
  // Tags para filtragem
  tags: ["imunidades", "princípios", "CF88"],
  
  // Estatísticas do tópico
  stats: {
    totalCards: 45,
    averageRetention: 0.78,
    lastReviewAt: "2024-03-19T08:30:00Z"
  },
  
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-03-20T14:22:00Z"
}
```

### 3.5 Tabela: cards (Cards de Estudo) — CORE DO SISTEMA

```javascript
{
  id: 1,
  topicId: 1, // FK para topics
  subjectId: 1, // FK para subjects (desnormalizado para queries)
  
  // Tipo de card
  type: "question", // "question" | "flashcard" | "cloze" | "concept"
  
  // Conteúdo
  content: {
    // Para questões
    question: "De acordo com a CF/88, qual das alternativas...",
    options: [
      { id: "a", text: "Os Estados podem instituir...", isCorrect: false },
      { id: "b", text: "A imunidade recíproca...", isCorrect: true },
      { id: "c", text: "Os Municípios têm competência...", isCorrect: false },
      { id: "d", text: "A União pode tributar...", isCorrect: false }
    ],
    explanation: "A alternativa B está correta porque...",
    
    // Para flashcards
    front: null,
    back: null,
    
    // Metadados da questão
    source: "FCC", // banca
    year: 2023,
    exam: "SEFAZ-SP",
    difficulty: "medium" // "easy" | "medium" | "hard"
  },
  
  // ═══════════════════════════════════════════════════════════
  // ESTADO FSRS — Núcleo do algoritmo de repetição espaçada
  // ═══════════════════════════════════════════════════════════
  
  state: "new", // "new" | "learning" | "review" | "relearning"
  
  // Data de vencimento (quando deve ser revisado)
  due: "2024-03-21T00:00:00Z", // ISO timestamp
  
  // Estabilidade: tempo (em dias) para retenção cair para 90%
  stability: 0.0,
  
  // Dificuldade: quão difícil é lembrar (0-10, inicia em 5)
  difficulty: 5.0,
  
  // Número de revisões no estado atual de "review"
  reps: 0,
  
  // Número de lapsos (esquecimentos após virar "review")
  lapses: 0,
  
  // Último intervalo usado (em dias)
  lastInterval: 0,
  
  // Última resposta
  lastReview: null, // timestamp ou null
  lastRating: null, // 1=Again, 2=Hard, 3=Good, 4=Easy
  
  // ═══════════════════════════════════════════════════════════
  
  // Flags
  suspended: false, // card suspenso (não aparece)
  buried: false, // enterrado até amanhã
  flagged: false, // marcado para revisão manual
  
  // Estatísticas do card
  stats: {
    totalReviews: 12,
    correctCount: 9,
    incorrectCount: 3,
    averageTime: 45, // segundos
    streak: 3 // acertos consecutivos
  },
  
  createdAt: "2024-01-20T11:00:00Z",
  updatedAt: "2024-03-20T14:22:00Z"
}
```

### 3.6 Tabela: reviewLogs (Histórico de Revisões)

```javascript
{
  id: 1,
  cardId: 1, // FK para cards
  
  // Timestamp exato da revisão
  timestamp: "2024-03-20T08:45:32Z",
  
  // Rating dado (1-4)
  rating: 3, // 1=Again, 2=Hard, 3=Good, 4=Easy
  
  // Estado do card ANTES desta revisão
  stateBefore: "learning",
  
  // Estado do card DEPOIS desta revisão
  stateAfter: "review",
  
  // Tempo de resposta em milissegundos
  responseTime: 23400, // ~23 segundos
  
  // Intervalo anterior (em dias)
  intervalBefore: 1,
  
  // Novo intervalo calculado (em dias)
  intervalAfter: 4,
  
  // Parâmetros FSRS do momento
  stabilityBefore: 1.2,
  stabilityAfter: 4.8,
  difficultyBefore: 5.2,
  difficultyAfter: 5.0,
  
  // Contexto da sessão
  sessionId: 42, // FK para sessions
  
  // Flag se foi revisão manual (fora da sessão)
  isManualReview: false
}
```

### 3.7 Tabela: sessions (Sessões de Estudo)

```javascript
{
  id: 42,
  
  // Data da sessão
  date: "2024-03-20", // YYYY-MM-DD
  
  // Status
  status: "completed", // "planned" | "in_progress" | "completed" | "skipped"
  
  // Horários
  plannedStartTime: "06:00",
  actualStartTime: "06:15",
  actualEndTime: "09:30",
  
  // Planejamento da sessão (gerado pelo scheduler)
  plan: {
    totalMinutes: 210,
    blocks: [
      {
        type: "review",
        subjectIds: [1, 3, 5], // matérias intercaladas
        durationMinutes: 45,
        cardCount: 60,
        completed: true
      },
      {
        type: "new_content",
        subjectId: 2,
        topicId: 15,
        lessonId: 8,
        durationMinutes: 50,
        completed: true
      },
      {
        type: "questions",
        subjectIds: [2],
        durationMinutes: 60,
        cardCount: 30,
        targetNewCards: 15,
        completed: true
      },
      {
        type: "encoding",
        durationMinutes: 15,
        description: "Revisão do dia + mapas mentais",
        completed: false
      }
    ]
  },
  
  // Execução real
  execution: {
    reviewsDone: 58,
    newCardsDone: 12,
    correctAnswers: 52,
    incorrectAnswers: 18,
    averageResponseTime: 28500, // ms
    totalActiveTime: 185, // minutos efetivos
    pauseTime: 25 // minutos em pausa
  },
  
  // Métricas de qualidade
  quality: {
    focusScore: 0.85, // baseado em padrões de resposta
    consistencyScore: 0.78, // variação no tempo de resposta
    difficultyCalibration: 0.82 // quão bem a dificuldade está calibrada
  },
  
  // Notas do dia
  notes: "Dificuldade em tributário, revisar imunidades",
  
  createdAt: "2024-03-20T05:00:00Z",
  updatedAt: "2024-03-20T09:35:00Z"
}
```

### 3.8 Tabela: lessons (Aulas/PDFs)

```javascript
{
  id: 8,
  topicId: 15, // FK para topics
  
  // Identificação
  title: "Aula 08 - Imunidades Tributárias",
  order: 8, // ordem dentro do tópico
  
  // Fonte
  source: {
    type: "pdf", // "pdf" | "video" | "article"
    provider: "Estratégia Concursos",
    professor: "Ricardo Alexandre",
    url: null, // opcional, se online
    localPath: null // opcional, se arquivo local
  },
  
  // Progresso
  completed: false,
  progress: {
    currentPage: 23,
    totalPages: 45,
    currentTime: null, // para vídeos (em segundos)
    totalDuration: null,
    completedAt: null
  },
  
  // Tempo estimado e real
  estimatedMinutes: 60,
  actualMinutes: 45, // tempo já gasto
  
  // Anotações
  notes: "Atenção especial ao art. 150, VI",
  highlights: [
    { page: 12, text: "Imunidade recíproca é cláusula pétrea" },
    { page: 28, text: "STF: interpretação extensiva das imunidades" }
  ],
  
  // Questões vinculadas a esta aula
  linkedCardIds: [101, 102, 103, 104, 105],
  
  createdAt: "2024-02-01T10:00:00Z",
  updatedAt: "2024-03-19T16:30:00Z"
}
```

### 3.9 Tabela: dailyStats (Estatísticas Diárias)

```javascript
{
  id: 1,
  date: "2024-03-20", // YYYY-MM-DD (unique)
  
  // Tempo de estudo
  time: {
    planned: 210, // minutos planejados
    actual: 185, // minutos efetivos
    breaks: 25
  },
  
  // Cards
  cards: {
    reviewed: 58,
    newLearned: 12,
    relearned: 5,
    matured: 3, // cards que passaram para "mature"
    lapsed: 2 // cards que foram esquecidos
  },
  
  // Performance
  performance: {
    correctRate: 0.84,
    againRate: 0.06,
    hardRate: 0.10,
    goodRate: 0.68,
    easyRate: 0.16,
    averageTime: 28500 // ms
  },
  
  // Por matéria
  bySubject: {
    1: { reviewed: 20, correct: 17, time: 45 },
    2: { reviewed: 15, correct: 12, time: 35 },
    3: { reviewed: 23, correct: 20, time: 55 }
  },
  
  // Retenção estimada (calculada pelo FSRS)
  estimatedRetention: 0.83,
  
  // Gamificação
  xpEarned: 580,
  streakDay: 15,
  
  createdAt: "2024-03-20T23:59:00Z"
}
```

### 3.10 Tabela: exams (Provas Realizadas)

```javascript
{
  id: 1,
  
  // Identificação da prova
  name: "TJ-SP - Escrevente Técnico",
  institution: "Tribunal de Justiça de São Paulo",
  organizer: "VUNESP",
  date: "2024-02-18",
  
  // Resultado
  result: {
    totalQuestions: 80,
    correctAnswers: 62,
    percentage: 0.775,
    ranking: 1250,
    totalCandidates: 45000,
    percentile: 0.972,
    cutoffScore: 0.70,
    passed: true
  },
  
  // Por matéria
  bySubject: {
    "Português": { total: 15, correct: 13 },
    "Direito Constitucional": { total: 10, correct: 8 },
    "Direito Administrativo": { total: 10, correct: 7 },
    "Direito Penal": { total: 10, correct: 8 },
    "Direito Processual Penal": { total: 10, correct: 7 },
    "Direito Civil": { total: 10, correct: 8 },
    "Direito Processual Civil": { total: 10, correct: 7 },
    "Normas da Corregedoria": { total: 5, correct: 4 }
  },
  
  // Contexto
  wasFocusedStudy: false, // estudou especificamente para este concurso?
  monthsOfPreparation: 8,
  
  // Análise
  analysis: {
    strongSubjects: ["Português", "Direito Constitucional"],
    weakSubjects: ["Direito Processual Civil"],
    surprises: "Questões de Penal mais difíceis que esperado",
    lessonsLearned: "Preciso focar mais em processo"
  },
  
  createdAt: "2024-02-20T10:00:00Z"
}
```

### 3.11 Tabela: backups (Metadados de Backup)

```javascript
{
  id: 1,
  
  timestamp: "2024-03-20T03:00:00Z",
  
  // Tipo de backup
  type: "auto", // "auto" | "manual" | "export"
  
  // Onde foi salvo
  destination: "local", // "local" | "file" | "cloud"
  
  // Tamanho
  sizeBytes: 2450000,
  
  // Contagens para verificação
  counts: {
    cards: 1250,
    reviewLogs: 15000,
    sessions: 120
  },
  
  // Status
  status: "success", // "success" | "failed"
  errorMessage: null,
  
  // Arquivo (se exportado)
  fileName: "backup_2024-03-20.json"
}
```

---

## 4. ÍNDICES E QUERIES IMPORTANTES

### 4.1 Queries Críticas para Performance

```javascript
// 1. Cards para revisão hoje (mais importante)
// Índice: [state+due]
db.cards
  .where('[state+due]')
  .between(['review', Dexie.minKey], ['review', today])
  .toArray();

// 2. Cards novos por matéria
// Índice: [subjectId+state]
db.cards
  .where('[subjectId+state]')
  .equals([subjectId, 'new'])
  .limit(20)
  .toArray();

// 3. Histórico de revisões de um card
// Índice: [cardId+timestamp]
db.reviewLogs
  .where('[cardId+timestamp]')
  .between([cardId, Dexie.minKey], [cardId, Dexie.maxKey])
  .reverse()
  .toArray();

// 4. Tópicos de uma matéria em ordem
// Índice: [subjectId+order]
db.topics
  .where('[subjectId+order]')
  .between([subjectId, Dexie.minKey], [subjectId, Dexie.maxKey])
  .toArray();

// 5. Estatísticas de um período
// Índice: date
db.dailyStats
  .where('date')
  .between('2024-03-01', '2024-03-31')
  .toArray();
```

---

## 5. MIGRAÇÕES E VERSIONAMENTO

```javascript
// Futuras versões do schema
db.version(2).stores({
  // Adicionar nova tabela
  achievements: '++id, type, unlockedAt',
}).upgrade(tx => {
  // Migração de dados se necessário
});

db.version(3).stores({
  // Adicionar índice
  cards: '++id, topicId, subjectId, type, state, due, [state+due], [subjectId+state], [topicId+state]',
});
```

---

## PRÓXIMO DOCUMENTO

**Parte 2: Motor FSRS** — Implementação completa do algoritmo de repetição espaçada, incluindo:
- Funções matemáticas core
- Cálculo de intervalos
- Calibração de parâmetros
- Predição de esquecimento
