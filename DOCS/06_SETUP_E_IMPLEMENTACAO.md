# BLUEPRINT: Sistema de Estudos de Elite
## Parte 6: Setup do Projeto e Implementação Final

---

## 1. ESTRUTURA DO PROJETO

```
study-system/
├── src/
│   ├── lib/
│   │   ├── db.js                      # Dexie database
│   │   ├── fsrs/
│   │   │   ├── params.js              # Parâmetros FSRS
│   │   │   ├── states.js              # Estados e ratings
│   │   │   ├── fsrs.js                # Motor FSRS principal
│   │   │   └── optimizer.js           # Calibração
│   │   ├── engines/
│   │   │   ├── scheduler.js           # Agendador de revisões
│   │   │   ├── interleaver.js         # Intercalação
│   │   │   ├── sessionGenerator.js    # Gerador de sessão
│   │   │   ├── priorityRanker.js      # Priorização ROI
│   │   │   └── analytics.js           # Análises e projeções
│   │   ├── stores/
│   │   │   ├── config.js
│   │   │   ├── session.js
│   │   │   ├── cards.js
│   │   │   ├── ui.js
│   │   │   └── index.js
│   │   ├── utils/
│   │   │   ├── date.js
│   │   │   ├── format.js
│   │   │   └── keyboard.js
│   │   └── components/
│   │       └── ... (componentes compartilhados)
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +page.svelte               # Dashboard
│   │   ├── study/
│   │   │   └── +page.svelte           # Sessão de estudo
│   │   ├── cards/
│   │   │   ├── +page.svelte           # Lista de cards
│   │   │   └── [id]/+page.svelte      # Editar card
│   │   ├── subjects/
│   │   │   ├── +page.svelte
│   │   │   └── [id]/+page.svelte
│   │   ├── stats/
│   │   │   └── +page.svelte
│   │   └── settings/
│   │       └── +page.svelte
│   ├── app.html
│   ├── app.css
│   └── hooks.server.js
├── static/
│   ├── favicon.png
│   └── manifest.json
├── tests/
│   ├── fsrs.test.js
│   ├── scheduler.test.js
│   └── ...
├── package.json
├── svelte.config.js
├── tailwind.config.js
├── vite.config.js
├── tsconfig.json (opcional)
└── README.md
```

---

## 2. ARQUIVOS DE CONFIGURAÇÃO

### 2.1 package.json

```json
{
  "name": "study-system",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "dependencies": {
    "dexie": "^4.0.1"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.0.1",
    "@sveltejs/kit": "^2.5.0",
    "@sveltejs/vite-plugin-svelte": "^3.0.0",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-plugin-svelte": "^2.35.1",
    "postcss": "^8.4.35",
    "prettier": "^3.2.5",
    "prettier-plugin-svelte": "^3.1.2",
    "svelte": "^4.2.9",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.0",
    "vitest": "^1.2.2"
  }
}
```

### 2.2 svelte.config.js

```javascript
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // Adapter static para app local (sem servidor)
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true
    }),
    
    // Alias para imports
    alias: {
      '$lib': 'src/lib',
      '$components': 'src/lib/components'
    }
  }
};

export default config;
```

### 2.3 vite.config.js

```javascript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  
  // Otimizações de build
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'dexie': ['dexie'],
          'fsrs': [
            'src/lib/fsrs/fsrs.js',
            'src/lib/fsrs/params.js',
            'src/lib/fsrs/states.js'
          ]
        }
      }
    }
  },
  
  // Servidor de desenvolvimento
  server: {
    port: 5173,
    strictPort: false,
    open: true
  },
  
  // Preview (build local)
  preview: {
    port: 4173
  }
});
```

### 2.4 tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        state: {
          new: '#8b5cf6',
          learning: '#f59e0b',
          review: '#10b981',
          relearning: '#ef4444'
        },
        rating: {
          again: '#ef4444',
          hard: '#f97316',
          good: '#22c55e',
          easy: '#3b82f6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    }
  },
  plugins: []
};
```

### 2.5 src/app.css

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply scroll-smooth;
  }
  
  body {
    @apply bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100;
    @apply font-sans antialiased;
  }
  
  /* Esconder scrollbar mas manter funcionalidade */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}

@layer components {
  /* Focus ring consistente */
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
    @apply dark:focus:ring-offset-gray-900;
  }
  
  /* Card base */
  .card {
    @apply bg-white dark:bg-gray-800 rounded-xl;
    @apply border border-gray-200 dark:border-gray-700;
    @apply shadow-sm;
  }
  
  /* Input base */
  .input {
    @apply w-full px-3 py-2 rounded-lg;
    @apply border border-gray-300 dark:border-gray-600;
    @apply bg-white dark:bg-gray-700;
    @apply text-gray-900 dark:text-gray-100;
    @apply placeholder-gray-400 dark:placeholder-gray-500;
    @apply focus:border-primary-500 focus:ring-1 focus:ring-primary-500;
    @apply transition-colors duration-150;
  }
  
  /* Badge de estado */
  .state-badge {
    @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium;
  }
  
  .state-badge.new {
    @apply bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300;
  }
  
  .state-badge.learning {
    @apply bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300;
  }
  
  .state-badge.review {
    @apply bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300;
  }
  
  .state-badge.relearning {
    @apply bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300;
  }
}

@layer utilities {
  /* Truncate com ellipsis */
  .truncate-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .truncate-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
```

### 2.6 src/app.html

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#0ea5e9" />
  <meta name="description" content="Sistema de Estudos de Elite para Concursos Públicos" />
  
  <link rel="icon" type="image/png" href="%sveltekit.assets%/favicon.png" />
  <link rel="manifest" href="%sveltekit.assets%/manifest.json" />
  
  <!-- Preload crítico -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  
  <title>Sistema de Estudos</title>
  
  %sveltekit.head%
</head>
<body data-sveltekit-preload-data="hover">
  <div style="display: contents">%sveltekit.body%</div>
</body>
</html>
```

### 2.7 static/manifest.json (PWA)

```json
{
  "name": "Sistema de Estudos de Elite",
  "short_name": "Estudos",
  "description": "Sistema de estudos para concursos com repetição espaçada FSRS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f9fafb",
  "theme_color": "#0ea5e9",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/favicon.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/favicon.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 3. LAYOUT PRINCIPAL

### 3.1 src/routes/+layout.svelte

```svelte
<script>
  import { onMount } from 'svelte';
  import { uiStore } from '$lib/stores';
  import '../app.css';
  
  // Sidebar navigation items
  const navItems = [
    { href: '/', icon: '🏠', label: 'Dashboard' },
    { href: '/study', icon: '📖', label: 'Estudar' },
    { href: '/cards', icon: '🃏', label: 'Cards' },
    { href: '/subjects', icon: '📚', label: 'Matérias' },
    { href: '/stats', icon: '📊', label: 'Estatísticas' },
    { href: '/settings', icon: '⚙️', label: 'Configurações' }
  ];
  
  onMount(() => {
    uiStore.init();
  });
</script>

<div class="min-h-screen flex">
  <!-- Sidebar -->
  <aside 
    class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 
           dark:border-gray-700 flex-shrink-0 hidden md:flex flex-col"
  >
    <!-- Logo -->
    <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
      <span class="text-xl font-bold text-primary-600">📚 StudyPro</span>
    </div>
    
    <!-- Navigation -->
    <nav class="flex-1 p-4 space-y-1">
      {#each navItems as item}
        <a 
          href={item.href}
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 
                 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
                 transition-colors duration-150"
        >
          <span class="text-xl">{item.icon}</span>
          <span class="font-medium">{item.label}</span>
        </a>
      {/each}
    </nav>
    
    <!-- Footer -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <button 
        class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700
               dark:hover:text-gray-300"
        on:click={() => uiStore.toggleDarkMode()}
      >
        <span>🌙</span>
        <span>Alternar tema</span>
      </button>
    </div>
  </aside>
  
  <!-- Main content -->
  <main class="flex-1 overflow-auto">
    <slot />
  </main>
</div>

<!-- Toast notifications -->
{#if $uiStore.toasts.length > 0}
  <div class="fixed bottom-4 right-4 space-y-2 z-50">
    {#each $uiStore.toasts as toast (toast.id)}
      <div 
        class="px-4 py-3 rounded-lg shadow-lg text-white
          {toast.type === 'success' ? 'bg-green-500' : ''}
          {toast.type === 'error' ? 'bg-red-500' : ''}
          {toast.type === 'warning' ? 'bg-yellow-500' : ''}
          {toast.type === 'info' ? 'bg-blue-500' : ''}"
      >
        {toast.message}
      </div>
    {/each}
  </div>
{/if}
```

---

## 4. INICIALIZAÇÃO DO BANCO DE DADOS

### 4.1 src/lib/db.js (Completo)

```javascript
import Dexie from 'dexie';

export const db = new Dexie('StudySystemDB');

// Schema do banco de dados
db.version(1).stores({
  config: '++id',
  subjects: '++id, name, weight, &order',
  topics: '++id, subjectId, name, &[subjectId+order]',
  cards: '++id, topicId, subjectId, type, state, due, [state+due], [subjectId+state]',
  reviewLogs: '++id, cardId, timestamp, [cardId+timestamp]',
  sessions: '++id, date, status, [date+status]',
  lessons: '++id, topicId, &[topicId+order], completed',
  dailyStats: '++id, &date',
  exams: '++id, date',
  backups: '++id, timestamp'
});

// Hooks para timestamps automáticos
db.cards.hook('creating', (primKey, obj) => {
  obj.createdAt = new Date().toISOString();
  obj.updatedAt = new Date().toISOString();
});

db.cards.hook('updating', (modifications) => {
  modifications.updatedAt = new Date().toISOString();
});

// Função de inicialização
export async function initializeDatabase() {
  try {
    // Verificar se já existe configuração
    const existingConfig = await db.config.get(1);
    
    if (!existingConfig) {
      console.log('Criando configuração inicial...');
      
      // Criar configuração padrão
      await db.config.add({
        id: 1,
        userName: '',
        targetExam: {
          name: '',
          date: null,
          institution: '',
          positions: 0
        },
        schedule: {
          weeklyHours: 20,
          dailyDistribution: {
            monday: 3, tuesday: 3, wednesday: 3,
            thursday: 3, friday: 3, saturday: 3, sunday: 2
          },
          preferredStartTime: '06:00',
          breakDuration: 10,
          sessionBlockMinutes: 50
        },
        fsrsParams: {
          w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
          requestRetention: 0.85,
          maximumInterval: 365,
          enableFuzz: true
        },
        preferences: {
          newCardsPerDay: 20,
          maxReviewsPerDay: 200,
          interleaveSubjects: true,
          showAnswerTime: true,
          enableSound: true,
          theme: 'system'
        },
        gamification: {
          currentStreak: 0,
          longestStreak: 0,
          totalXP: 0,
          level: 1
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    console.log('Banco de dados inicializado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

// Funções de backup
export async function exportDatabase() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {}
  };
  
  // Exportar todas as tabelas
  const tableNames = ['config', 'subjects', 'topics', 'cards', 'reviewLogs', 'sessions', 'lessons', 'dailyStats', 'exams'];
  
  for (const tableName of tableNames) {
    data.tables[tableName] = await db[tableName].toArray();
  }
  
  // Registrar backup
  await db.backups.add({
    timestamp: new Date().toISOString(),
    type: 'export',
    destination: 'file',
    sizeBytes: JSON.stringify(data).length,
    counts: {
      cards: data.tables.cards.length,
      reviewLogs: data.tables.reviewLogs.length,
      sessions: data.tables.sessions.length
    },
    status: 'success'
  });
  
  return data;
}

export async function importDatabase(data) {
  if (!data || !data.tables) {
    throw new Error('Formato de backup inválido');
  }
  
  // Limpar banco atual
  await db.delete();
  await db.open();
  
  // Importar cada tabela
  for (const [tableName, records] of Object.entries(data.tables)) {
    if (records.length > 0 && db[tableName]) {
      await db[tableName].bulkAdd(records);
    }
  }
  
  console.log('Banco de dados importado com sucesso!');
  return true;
}

// Função para limpar dados antigos
export async function cleanupOldData(daysToKeep = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffISO = cutoffDate.toISOString();
  
  // Remover logs de revisão antigos
  const deletedLogs = await db.reviewLogs
    .where('timestamp')
    .below(cutoffISO)
    .delete();
  
  console.log(`Removidos ${deletedLogs} logs de revisão antigos`);
  
  return { deletedLogs };
}
```

---

## 5. INSTRUÇÕES DE INSTALAÇÃO

### 5.1 Requisitos
- Node.js 18+ 
- npm ou pnpm

### 5.2 Passos de Instalação

```bash
# 1. Criar projeto
npm create svelte@latest study-system
cd study-system

# 2. Instalar dependências
npm install dexie
npm install -D tailwindcss postcss autoprefixer
npm install -D @sveltejs/adapter-static

# 3. Inicializar Tailwind
npx tailwindcss init -p

# 4. Copiar arquivos do blueprint para a estrutura

# 5. Rodar em desenvolvimento
npm run dev

# 6. Build para produção
npm run build

# 7. Preview do build
npm run preview
```

---

## 6. CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Core (Semana 1)
- [ ] Setup do projeto SvelteKit
- [ ] Configurar Tailwind CSS
- [ ] Implementar Dexie e schema do banco
- [ ] Implementar motor FSRS completo
- [ ] Testes unitários do FSRS

### Fase 2: Engines (Semana 2)
- [ ] Scheduler Engine
- [ ] Interleaver Engine
- [ ] Session Generator
- [ ] Priority Ranker
- [ ] Analytics Engine

### Fase 3: Stores e Estado (Semana 3)
- [ ] Config Store
- [ ] Session Store
- [ ] Cards Store
- [ ] Subjects Store
- [ ] UI Store

### Fase 4: Componentes Base (Semana 4)
- [ ] Button, Card, Badge, ProgressBar
- [ ] Input, Select, Modal
- [ ] Toast notifications
- [ ] Loading states

### Fase 5: Telas Principais (Semanas 5-6)
- [ ] Dashboard
- [ ] Tela de Estudo (StudyCard)
- [ ] Gerenciamento de Cards
- [ ] Gerenciamento de Matérias/Tópicos
- [ ] Estatísticas
- [ ] Configurações

### Fase 6: Polish (Semana 7)
- [ ] Atalhos de teclado
- [ ] Dark mode
- [ ] Animações e transições
- [ ] Responsividade mobile
- [ ] PWA manifest

### Fase 7: Testes e Deploy (Semana 8)
- [ ] Testes de integração
- [ ] Testes E2E (opcional)
- [ ] Documentação
- [ ] Build de produção
- [ ] Deploy (Vercel/Netlify/local)

---

## 7. COMANDOS ÚTEIS

```bash
# Desenvolvimento
npm run dev           # Inicia servidor de dev
npm run build         # Build para produção
npm run preview       # Preview do build

# Testes
npm run test          # Roda testes
npm run test:ui       # Testes com UI

# Qualidade
npm run lint          # Lint do código
npm run format        # Formata código

# Database (via console do navegador)
# Exportar: 
#   const data = await exportDatabase(); 
#   console.log(JSON.stringify(data));

# Importar:
#   await importDatabase(JSON.parse('...'));

# Limpar dados antigos:
#   await cleanupOldData(365);
```

---

## 8. PRÓXIMOS PASSOS E EVOLUÇÃO

### Funcionalidades Futuras
1. **Sync na nuvem** - Sincronização com Google Drive/Dropbox
2. **Import de Anki** - Importar decks .apkg
3. **OCR de PDFs** - Extrair questões automaticamente
4. **Modo colaborativo** - Compartilhar decks
5. **App mobile** - React Native ou Capacitor
6. **Integração com bancas** - APIs de questões (QConcursos, etc.)

### Melhorias de Performance
1. Web Workers para FSRS pesado
2. IndexedDB com cursors para grandes volumes
3. Virtualização de listas longas
4. Service Worker para offline completo

---

## RESUMO FINAL

Este blueprint contém **TUDO** necessário para implementar o sistema:

| Documento | Conteúdo |
|-----------|----------|
| **Parte 1** | Visão geral + Schema completo do banco de dados |
| **Parte 2** | Motor FSRS com todas as fórmulas e implementação |
| **Parte 3** | Engines de negócio (Scheduler, Interleaver, SessionGenerator, PriorityRanker, Analytics) |
| **Parte 4** | Svelte Stores e gerenciamento de estado reativo |
| **Parte 5** | UI/UX completo com componentes e telas |
| **Parte 6** | Setup do projeto, configurações e checklist de implementação |

**Total aproximado de código**: ~3.500 linhas

**Tempo estimado de implementação**: 6-8 semanas (1 dev)

**Stack final**: SvelteKit + Dexie.js + TailwindCSS

---

*Blueprint criado para concurso público brasileiro, focado em ciência cognitiva e máxima eficiência de estudo.*
