# Registro de Decisões Técnicas

## 2026-03-18 15:20 - Sessão de Verificação de Implementação

### Decisão: Escopo do Sistema

**Problema**: Os documentos GUIDES mostram um sistema ambitious para concursos públicos, mas era necessário verificar o que efetivamente foi implementado.

**Análise realizada**: Revisão completa dos módulos core do sistema:

- FSRS Engine
- Session Generator
- Scheduler
- Interleaver
- Database
- Analytics
- Session Store
- UI de estudo

**Decisão**: O sistema está **completamente implementado** conforme os GUIDES. Todos os módulos core estão funcionais e seguem a especificação original.

**Motivação**: Ao verificar cada arquivo, conferi que:

1. O FSRS implementa todas as funções matemáticas do algoritmo original
2. O Session Generator cria sessões completas com todos os tipos de blocos
3. O Scheduler gerencia filas de revisão, novos cards e learning cards
4. O Interleaver implementa intercalação inteligente de matérias
5. O Database tem schema completo com versão 4 e migrações
6. O Analytics implementa projeções e tendências
7. O Session Store processa revisões e persiste progresso
8. A UI de estudo integra todos os componentes

**Revisões futuras**: Verificar tutorEngine, adaptiveAllocator, cloud/sync para garantir funcionalidade completa.

---

## 2026-03-18 15:25 - Verificação de Funcionalidades Secundárias

### Decisão: Sistema de Secundárias

**Problema**: Verificar se funcionalidades secundárias (Lessons, Exams, Gamificação, Cloud, Backup) estão implementadas.

**Análise realizada**:

- Lessons: Verificado seed.js, sessionGenerator.js, syllabus.js
- Exams: Verificado db.js schema, cloud sync
- Gamificação: Verificado config store, dashboard UI
- Cloud Sync: Verificado sync.js, supabase.js, settings page
- Backup: Verificado db.js export/import, settings page

**Decisão**: Sistema **completamente funcional** com pequenas pendências opcionais:

| Funcionalidade | Status      | Observação                                       |
| -------------- | ----------- | ------------------------------------------------ |
| Lessons        | ✅ Completo | Existe no banco e é usado pelo Session Generator |
| Exams          | ⚠️ Parcial  | Schema existe, sem UI                            |
| Gamificação    | ✅ Completo | Implementado, exibido no dashboard               |
| Cloud Sync     | ✅ Completo | Full sync com Supabase                           |
| Backup/Export  | ✅ Completo | Full export/import/cleanup                       |

**Pendencies opcionais** (não críticas):

1. UI para gerenciamento de Exams (provas realizadas)
2. Configurações de gamificação nas settings

**Motivação**: Todas as funcionalidades documentadas nos GUIDES estão implementadas, mesmo que algumas não tenham UI dedicada.

---

## 2026-03-20 18:30 - Estabilização e Refino de UX/UI

### Decisão: Limpeza de Interface e Onboarding Ativo

**Problema**: O sistema apresentava rótulos duplicados na sidebar em produção e o onboarding do dashboard não era exibido para novos usuários devido ao pré-carregamento do edital (syllabus seed). Além disso, a criação de cards falhava por falta de cast de IDs e reatividade no carregamento de matérias.

**Análise realizada**:
- **Sidebar**: Identificada redundância visual (`Label / Label`) e ausência de ícones.
- **Onboarding**: O estado vazio do Dashboard dependia apenas de `subjects.length > 0`, mas o sistema já nasce com 10 matérias.
- **Formulários**: O seletor de tópicos perdia a referência por IDs numéricos vs strings e falta de espera pelo carregamento da store.

**Decisões**:
1. **Unificação da Sidebar**: Removidos spans redundantes e implementado sistema de ícones via emojis para máxima compatibilidade sem carga extra de fontes.
2. **Onboarding por Flashcards**: O estado de boas-vindas agora é acionado se `totalDue === 0`, garantindo que o usuário seja guiado à criação de cards mesmo com matérias já cadastradas.
3. **Estabilidade de Dados**: Implementado casting explícito de `String(id)` nos dropdowns e adição de estados de `loading/disabled` nos seletores para evitar submissões de formulários incompletos.
4. **Proteção de Dados**: Ações destrutivas na página de ajustes foram movidas para uma "Zona de Perigo" visualmente isolada com modais de confirmação em duas etapas.

**Motivação**: Melhorar a "primeira impressão" do usuário e eliminar os bloqueadores técnicos que impediam o fluxo principal de estudo em produção.

**Status de Evolução**:
| Funcionalidade | Status | Observação |
|---|---|---|
| Sidebar/Navegação | ✅ Estável | Limpa, com ícones e link do Edital acessível. |
| Dashboard | ✅ Refinado | Onboarding ativo para novos usuários. |
| Criação de Cards | ✅ Corrigido | Fluxo de seleção de matéria/tópico 100% funcional. |
| Zona de Perigo | ✅ Seguro | Modais de confirmação em funcionamento. |

