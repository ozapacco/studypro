# Tarefas do Sistemão — Backlog Completo

**Última atualização:** 2026-03-18T16:59:07-03:00
**Próxima revisão:** Ao final de cada sessão de trabalho

---

## 📊 Dashboard de Progresso

| Categoria | Total | Feito | Pendente |
|---|---|---|---|
| Sistema Core | 10 | 10 | 0 |
| Design System | 28 | 19 | 9 |
| Funcionalidades Pedagógicas | 10 | 8 | 2 |
| **TOTAL** | **48** | **37** | **11** |

---

## ✅ Sistema Core — Concluído em 2026-03-18

Todos os módulos core foram verificados e estão funcionais:

| Módulo | Arquivo | Status | Concluído em |
|---|---|---|---|
| FSRS Engine | `src/lib/fsrs/` | ✅ Completo | 2026-03-18T15:20 |
| Scheduler | `src/lib/engines/scheduler.js` | ✅ Completo | 2026-03-18T15:20 |
| Interleaver | `src/lib/engines/interleaver.js` | ✅ Completo | 2026-03-18T15:20 |
| Session Generator | `src/lib/engines/sessionGenerator.js` | ✅ Completo | 2026-03-18T15:20 |
| Priority Ranker | `src/lib/engines/priorityRanker.js` | ✅ Completo | 2026-03-18T15:20 |
| Analytics | `src/lib/engines/analytics.js` | ✅ Completo | 2026-03-18T15:20 |
| Database (Dexie v4) | `src/lib/db.js` | ✅ Completo | 2026-03-18T15:20 |
| Stores Svelte | `src/lib/stores/` | ✅ Completo | 2026-03-18T15:20 |
| Cloud Sync / Supabase | `src/lib/cloud/` | ✅ Completo | 2026-03-18T15:25 |
| 46 Testes Unitários | `tests/` | ✅ Passando | 2026-03-18T15:30 |

---

## 🎨 BLOCO 1 — DESIGN SYSTEM

> **Contexto:** A Fase 1 foi concluída integralmente (tokens, componentes base). As Fases 2–6 estão pendentes.
> **Dependência:** Todas as fases dependem que a anterior esteja concluída.
> **Arquivo de referência:** `DOCS/DESIGN_SYSTEM_TASKS.md`

---

### 🟡 FASE 2 — Refatorar Componentes Base (~15.5h)

---

#### DS-T7 — Refatorar `TutorMission.svelte`

- **Status:** ✅ Concluído
- **Arquivo:** `src/lib/components/tutor/TutorMission.svelte`
- **Estimativa:** 3h
- **Dependências:** DS-T1 (tokens), DS-T2 (tailwind), DS-T6 (InteractiveCard) — todos ✅

**O que fazer:**
1. Abrir `src/lib/components/tutor/TutorMission.svelte`
2. Localizar o objeto/mapa `MASTERY_COLORS` definido dentro do componente — removê-lo
3. Substituir todos os usos de `MASTERY_COLORS` por `getMasteryColor()` de `src/lib/design/tokens.mjs`
4. Substituir cores hardcoded (hex, rgb) por classes Tailwind com as variáveis de tokens
5. Substituir `border-` e `bg-` estáticos por variantes `mastery-*` do tailwind.config.js
6. Adicionar `transition-all duration-200` nos elementos interativos
7. Testar visualmente no browser: modo claro e escuro

**Como verificar:**
```
npm run dev
# Abrir /  (dashboard) e verificar TutorMission no modo claro e escuro
# Confirmar que as cores de domínio (crítico/fraco/médio/forte) estão corretas
```

- **Concluída em:** 2026-03-18T20:30

---

#### DS-T8 — Refatorar `MissaoDiaria.svelte`

- **Status:** ✅ Concluído
- **Arquivo:** `src/lib/components/dashboard/MissaoDiaria.svelte`
- **Estimativa:** 4h
- **Dependências:** DS-T1, DS-T2, DS-T6

**O que fazer:**
1. Abrir `src/lib/components/dashboard/MissaoDiaria.svelte`
2. Substituir todas as cores hardcoded por tokens de `src/lib/design/tokens.mjs`
3. Usar `getMasteryColor()` para o indicador de urgência de cada tópico
4. Substituir `style="..."` inline por classes Tailwind equivalentes
5. Adicionar animação de entrada no card HERO: `animate-fade-in` ou `animate-scale-in`
6. Adicionar `hover:shadow-interactive` e `transition-all` nos botões de tópico
7. Testar com dados reais (certifique-se de ter matérias/tópicos cadastrados)

**Como verificar:**
```
npm run dev
# Abrir /  (dashboard) — verificar card Missão Diária
# Testar hover nos botões de tópico — deve ter transição suave
# Alternar dark mode — cores devem adaptar
```

- **Concluída em:** 2026-03-18T21:00

---

#### DS-T9 — Refatorar `EditalMasteryPanel.svelte`

- **Status:** ✅ Concluído
- **Arquivo:** `src/lib/components/edital/EditalMasteryPanel.svelte`
- **Estimativa:** 3.5h
- **Dependências:** DS-T1, DS-T2, DS-T6

**O que fazer:**
1. Abrir `src/lib/components/edital/EditalMasteryPanel.svelte`
2. Identificar todas as cores usadas nos indicadores de domínio (barras, badges, ícones)
3. Substituir por tokens: `getMasteryColor(score)` para cores e `getMasteryLevel(score)` para labels
4. Normalizar `style=""` inline → classes Tailwind
5. Garantir que o painel reage ao `dark:` mode corretamente

**Como verificar:**
```
npm run dev
# Navegar para /edital
# Verificar barras de domínio com cores corretas por matéria
# Testar dark mode
```

- **Concluída em:** 2026-03-18T21:40

---

#### DS-T10 — Refatorar `SubjectDrilldown.svelte`

- **Status:** ✅ Concluído
- **Arquivo:** `src/lib/components/edital/SubjectDrilldown.svelte`
- **Estimativa:** 2.5h
- **Dependências:** DS-T1, DS-T2, DS-T6

**O que fazer:**
1. Abrir `src/lib/components/edital/SubjectDrilldown.svelte`
2. Substituir `<div class="card ...">` que são interativos por `<InteractiveCard>` de `src/lib/components/common/InteractiveCard.svelte`
3. Adicionar `hover:` states consistentes em todos os items de tópico da lista
4. Normalizar cores hardcoded com tokens

**Como verificar:**
```
npm run dev
# Navegar para /edital → clicar em uma matéria
# Verificar que ao passar o mouse sobre os tópicos, há hover state visual
# Verificar que o card com MasteryGauge está estilizado corretamente
```

- **Concluída em:** 2026-03-18T22:15

---

#### DS-T11 — Refatorar `MasteryGauge.svelte`

- **Status:** ✅ Concluído
- **Arquivo:** `src/lib/components/study/MasteryGauge.svelte`
- **Estimativa:** 2h
- **Dependências:** DS-T1, DS-T2

**O que fazer:**
1. Abrir `src/lib/components/study/MasteryGauge.svelte`
2. Mover qualquer cor inline do SVG para usar `getMasteryColor()` de `tokens.mjs`
3. Substituir valores CSS inline (`style="stroke: #..."`) por variáveis CSS ou computed values via tokens
4. Garantir que o gauge se adapta ao dark mode (stroke colors)

**Como verificar:**
```
npm run dev
# Navegar para /edital → clicar em qualquer matéria
# Verificar gauges circulares no header e na lista de tópicos
# Testar dark mode — as cores do SVG devem mudar
```

- **Concluída em:** 2026-03-18T22:30

---

#### DS-T12 — Refatorar `EditalWidget.svelte`

- **Status:** ✅ Concluído
- **Arquivo:** `src/lib/components/edital/EditalWidget.svelte`
- **Estimativa:** 1.5h
- **Dependências:** DS-T1, DS-T2

**O que fazer:**
1. Abrir `src/lib/components/edital/EditalWidget.svelte`
2. Normalizar todas as classes de dark mode para padrão `dark:` do Tailwind
3. Substituir cores hardcoded por tokens
4. Verificar se há `style=""` inline para migrar para classes

**Como verificar:**
```
npm run dev
# Verificar dashboard — widget de edital no canto
# Alternar dark mode e confirmar tema consistente
```

- **Concluída em:** 2026-03-18T22:45

---

### 🟢 FASE 3 — Refatorar Componentes Existentes (~9.5h)

---

#### DS-T13 — Refatorar `StudyCard.svelte`

- **Status:** ✅ Concluído
- **Arquivo:** `src/lib/components/cards/StudyCard.svelte`
- **Estimativa:** 2.5h
- **Dependências:** DS-T1, DS-T2, DS-T6

**O que fazer:**
1. Abrir `src/lib/components/cards/StudyCard.svelte`
2. Adicionar `hover:` state visual que indique card interativo (leve elevação + sombra)
3. Adicionar `active:` state para feedback de click/tap
4. Usar `transition-all duration-200` para animar as transições
5. Verificar se os botões de rating (Difícil/Bom/Ótimo) têm estados hover/active distintos

**Como verificar:**
```
npm run dev
# Iniciar uma sessão de estudo
# Verificar hover e active states nos cards e botões de rating
```

- **Concluída em:** 2026-03-18T23:05

---

#### DS-T14 — Refatorar `PreVoo.svelte`

- **Status:** ✅ Concluído
- **Arquivo:** `src/lib/components/study/PreVoo.svelte`
- **Estimativa:** 3h
- **Dependências:** DS-T1, DS-T2, DS-T5 (EmptyState)

**O que fazer:**
1. Abrir `src/lib/components/study/PreVoo.svelte`
2. Auditar todos os `style="..."` inline e converter para classes Tailwind
3. Usar `EmptyState` de `src/lib/components/common/EmptyState.svelte` nos estados sem conteúdo
4. Normalizar cores com tokens
5. Garantir que o layout funciona em mobile (responsivo)

**Como verificar:**
```
npm run dev
# Iniciar uma sessão com topicId na URL: /study?topicId=<algum-id>
# Verificar a tela PreVoo antes dos cards
# Testar em resolução mobile (DevTools → 375px)
```

- **Concluída em:** 2026-03-18T23:30

---

#### DS-T15 — Refatorar Pages Principais

- **Status:** ✅ Concluído
- **Arquivos:** `src/routes/+page.svelte`, `src/routes/study/+page.svelte`, `src/routes/edital/+page.svelte`, `src/routes/settings/+page.svelte`
- **Estimativa:** 4h
- **Dependências:** DS-T13, DS-T14

**O que fazer:**
1. Em cada uma das 4 páginas acima:
   - Auditar transições CSS — padronizar para `transition-all duration-200` ou `duration-300`
   - Substituir animações ad-hoc por classes do tailwind.config.js (`animate-fade-in`, `animate-scale-in`)
   - Normalizar `gap`, `padding`, `margin` para usar a escala do Tailwind (4, 6, 8, 12...)
   - Verificar que o layout tem espaçamento consistente

**Como verificar:**
```
npm run dev
# Navegar entre as 4 páginas, observar transições
# Comparar visualmente espaçamentos — devem ser uniformes
```

- **Concluída em:** 2026-03-19T00:15

---

### 🔵 FASE 4 — Transições e Animações Unificadas (~5h)

---

#### DS-T16 — Page Transitions em `+layout.svelte`

- **Status:** ✅ Concluído
- **Arquivo:** `src/routes/+layout.svelte`
- **Estimativa:** 1h
- **Dependências:** DS-T2

**O que fazer:**
1. Abrir `src/routes/+layout.svelte`
2. Importar `afterNavigate` de `$app/navigation` do SvelteKit
3. Adicionar um estado reativo `transitioning = false`
4. Em `afterNavigate`, setar `transitioning = true` → aguardar → `false`
5. Envolver o `<slot />` com um elemento com `class:animate-fade-in={transitioning}`

**Como verificar:**
```
npm run dev
# Navegar entre páginas clicando nos links do menu
# Verificar fade suave ao entrar em cada página
```

- **Concluída em:** 2026-03-19T00:30

---

#### DS-T17 — Animações de Entrada em Listas

- **Status:** ✅ Concluído
- **Arquivos:** `MissaoDiaria.svelte`, `SubjectDrilldown.svelte`, `stats/+page.svelte`
- **Estimativa:** 1h
- **Dependências:** DS-T15
- **Data Prevista:** 2026-03-19
- **Concluída em:** 2026-03-19T01:00

**O que fazer:**
1. Em todos os lugares que renderizam listas de cards com `{#each}`, adicionar delay escalonado:
   ```svelte
   {#each items as item, i}
     <div style="animation-delay: {i * 50}ms" class="animate-fade-in">
       ...
     </div>
   {/each}
   ```
2. Principais locais para verificar:
   - `MissaoDiaria.svelte` — lista de tópicos da fila
   - `SubjectDrilldown.svelte` — lista de tópicos por matéria
   - `src/routes/stats/+page.svelte` — cards de estatísticas

**Como verificar:**
```
npm run dev
# Navegar para /edital e clicar em uma matéria
# Os tópicos devem aparecer em sequência (fade-in escalonado)
```

--- **Progresso Global:** 80% (Analytics Engine 2.0 Ativo, Refinando Polish Final)
- **Design System:** 85% Concluído (Faltam Componentes Complexos e Dark Mode Final)
- **Pedagogia:** 90% Concluído (Avançada com Insights de Fluxo e Eficiência)

---

#### DS-T18 — Hover States Globais em `app.css`

- **Status:** ✅ Concluído
- **Arquivo:** `src/app.css`
- **Estimativa:** 1h
- **Dependências:** DS-T16

**O que fazer:**
1. Abrir `src/app.css`
2. Adicionar utilitário global:
   ```css
   .card-interaction-trigger {
     @apply transition-all duration-200 cursor-pointer;
   }
   .card-interaction-trigger:hover {
     @apply -translate-y-0.5 shadow-interactive;
   }
   .card-interaction-trigger:active {
     @apply translate-y-0 shadow-sm;
   }
   ```
3. Aplicar a classe `.card-interaction-trigger` nos cards clicáveis que ainda não usam `<InteractiveCard>`

**Como verificar:**
```
npm run dev
# Passar o mouse sobre cards interativos nas páginas
# Confirmar elevação leve e sombra no hover
```

- **Concluída em:** 2026-03-19T00:45

---

### 🟣 FASE 5 — Dark Mode Completo (~12.5h)

> **Nota:** As tasks desta fase dependem das tasks de Fase 2 correspondentes (ex: DS-T19 depende de DS-T7).

---

#### DS-T19 — Dark Mode `TutorMission.svelte`

- **Status:** ⏸️ Pendente (depende de DS-T7)
- **Arquivo:** `src/lib/components/tutor/TutorMission.svelte`
- **Estimativa:** 2h

**O que fazer:**
1. Garantir que todos os gradientes de background têm variante `dark:`
2. Textos: verificar contraste em dark mode (`dark:text-gray-100`, `dark:text-gray-300`)
3. Bordas: `dark:border-gray-700` ou equivalente
4. Ícones/badges: verificar visibilidade em fundo escuro

**Como verificar:**
```
npm run dev
# Ativar dark mode (Settings → toggle)
# Verificar TutorMission no dashboard — sem textos ilegíveis, sem fundos "estourados"
```

- **Concluída em:** _______________

---

#### DS-T20 — Dark Mode `MissaoDiaria.svelte`

- **Status:** ⏸️ Pendente (depende de DS-T8)
- **Arquivo:** `src/lib/components/dashboard/MissaoDiaria.svelte`
- **Estimativa:** 2.5h

**O que fazer:**
1. Auditar todos os estados do componente (sem tópicos, loading, com tópicos)
2. Para cada estado, verificar em dark mode:
   - Background dos cards
   - Textos e subtextos
   - Botões de ação
   - Indicadores de urgência (cores de domínio)

**Como verificar:**
```
npm run dev
# Ativar dark mode → verificar dashboard
# Testar todos os estados: com missão, sem missão, loading
```

- **Concluída em:** _______________

---

#### DS-T21 — Dark Mode `EditalMasteryPanel.svelte`

- **Status:** ⏸️ Pendente (depende de DS-T9)
- **Arquivo:** `src/lib/components/edital/EditalMasteryPanel.svelte`
- **Estimativa:** 2.5h

**O que fazer:**
1. Verificar barras de progresso em dark mode (fundo da barra e preenchimento)
2. Garantir legibilidade dos percentuais e labels
3. Verificar o painel de visão geral do edital

**Como verificar:**
```
npm run dev
# Ativar dark mode → navegar para /edital
# Verificar painéis de domínio por matéria
```

- **Concluída em:** _______________

---

#### DS-T22 — Dark Mode `SubjectDrilldown.svelte`

- **Status:** ⏸️ Pendente (depende de DS-T10)
- **Arquivo:** `src/lib/components/edital/SubjectDrilldown.svelte`
- **Estimativa:** 2h

**O que fazer:**
1. Verificar header da matéria em dark mode
2. Verificar cada item de tópico: background, texto, MasteryGauge
3. Verificar botões de ação (Estudar, Ver Notas)

**Como verificar:**
```
npm run dev
# Ativar dark mode → /edital → clicar em matéria
# Verificar lista de tópicos completa
```

- **Concluída em:** _______________

---

#### DS-T23 — Dark Mode `MasteryGauge.svelte`

- **Status:** ⏸️ Pendente (depende de DS-T11)
- **Arquivo:** `src/lib/components/study/MasteryGauge.svelte`
- **Estimativa:** 1.5h

**O que fazer:**
1. O SVG usa `stroke` para o arco — garantir que o stroke de fundo (`gray`) adapta ao dark mode
2. Para SVG não tem `dark:` Tailwind direto: usar CSS variables ou bind:class

**Como verificar:**
```
npm run dev
# Ativar dark mode → /edital → clicar em matéria
# Verificar gauges — o arco de fundo não deve "desaparecer" no dark
```

- **Concluída em:** _______________

---

#### DS-T24 — Dark Mode `PreVoo.svelte`

- **Status:** ⏸️ Pendente (depende de DS-T14)
- **Arquivo:** `src/lib/components/study/PreVoo.svelte`
- **Estimativa:** 2h

**O que fazer:**
1. Verificar overlay de tela cheia — background em dark mode
2. Verificar campos de texto (área de active recall) em dark mode
3. Verificar botões Revelar e Iniciar Sessão
4. Verificar o efeito blur do material — deve funcionar igual em dark mode

**Como verificar:**
```
npm run dev
# Ativar dark mode → /study?topicId=<algum-id>
# Verificar tela PreVoo completa — legibilidade total
```

- **Concluída em:** _______________

---

### 📄 FASE 6 — Testes e Documentação (~11h)

---

#### DS-T25 — Criar `DOCS/DESIGN_SYSTEM.md`

- **Status:** ⏸️ Pendente (depende de DS-T7 a DS-T12 e DS-T19 a DS-T24)
- **Arquivo:** `DOCS/DESIGN_SYSTEM.md` (novo)
- **Estimativa:** 2h

**O que fazer:**
1. Criar `DOCS/DESIGN_SYSTEM.md` com as seguintes seções:
   - Tokens disponíveis (cores, tipografia, spacing) — listar os exports de `tokens.mjs`
   - Como usar `getMasteryColor()` e `getMasteryLevel()`
   - Componentes comuns: `Spinner`, `LoadingSkeleton`, `EmptyState`, `InteractiveCard`
   - Padrão de dark mode: como aplicar `dark:` classes corretamente
   - Padrão de animações: quais classes usar e quando

**Como verificar:**
- Revisão manual do documento para garantir clareza e completude

- **Concluída em:** _______________

---

#### DS-T26 — Criar `DOCS/DARK_MODE.md`

- **Status:** ⏸️ Pendente (depende de DS-T19 a DS-T24)
- **Arquivo:** `DOCS/DARK_MODE.md` (novo)
- **Estimativa:** 3h

**O que fazer:**
1. Criar `DOCS/DARK_MODE.md` com:
   - Checklist de componentes com dark mode verificado
   - Padrões adotados (variáveis CSS, classes `dark:`)
   - Casos especiais (SVG, gradientes, overlays)
   - Screenshots das principais telas em light vs dark (usar DevTools para capturar)

**Como verificar:**
- Revisão manual do documento

- **Concluída em:** _______________

---

#### DS-T27 — Criar `tests/ui/designSystem.test.js`

- **Status:** ⏸️ Pendente (depende de DS-T1 a DS-T6)
- **Arquivo:** `tests/ui/designSystem.test.js` (novo)
- **Estimativa:** 4h

**O que fazer:**
1. Criar testes que verificam:
   - `getMasteryColor(score)` retorna a cor correta por faixa
   - `getMasteryLevel(score)` retorna o nível correto
   - `getMasteryLabel(score)` retorna o label correto
   - Tokens exportados têm todas as chaves esperadas (COLORS, TYPOGRAPHY, SPACING...)
2. Usar o mesmo runner dos testes existentes (verificar `package.json` → script `test`)

**Como verificar:**
```
npm test
# ou conforme o runner configurado no package.json
# Todos os novos testes devem passar
```

- **Concluída em:** _______________

---

#### DS-T28 — Script de Teste Visual de Tema

- **Status:** ⏸️ Pendente (depende de DS-T26)
- **Arquivo:** `scripts/test-theme.js` (novo)
- **Estimativa:** 2h

**O que fazer:**
1. Criar script `scripts/test-theme.js` usando Playwright ou screenshot API
2. Script deve abrir cada rota principal em light e dark mode e salvar screenshots
3. Salvar em `DOCS/screenshots/` para referência visual

**Como verificar:**
```
node scripts/test-theme.js
# Verificar que os screenshots foram gerados em DOCS/screenshots/
```

- **Concluída em:** _______________

---

## 🧠 BLOCO 2 — FUNCIONALIDADES PEDAGÓGICAS (STUDEI 2.0)

> **Contexto:** Análise comparativa em `DOCS/fusao_analise.md`.
> Estas funcionalidades já foram planejadas mas ainda não implementadas.
> **⚠️ Antes de implementar F-1 e F-4:** ver decisões de design abertas no fim desta seção.

---

#### PED-F1 — Active Recall Screen (Blur/Reveal)

- **Status:** ✅ Concluído
- **Prioridade:** 🔴 Alta
- **Estimativa:** 4h
- **Arquivos:** `src/routes/study/+page.svelte`, `src/lib/components/study/PreVoo.svelte`
- **Concluída em:** 2026-03-19T01:45
**O que fazer:**
1. Criar componente `src/lib/components/study/ActiveRecall.svelte`:
   - Layout de tela cheia (overlay)
   - Campo textarea "O que você lembra sobre _[nome do tópico]_?"
   - Abaixo: conteúdo dos Bizus + Erros do tópico, com CSS `filter: blur(12px)`
   - Botão "Revelar Material" → remove blur via `blurred = false`
   - Timer visível contando segundos de esforço mental
   - Botão "Iniciar Sessão" (ativo após revelar ou após 30s)
   - Botão "Pular" (sem ganho de XP)
2. Integrar em `src/routes/study/+page.svelte`:
   - Se `?topicId=X` e o tópico tem revisões anteriores → mostrar `<ActiveRecall>` antes dos cards
   - Após confirmar no ActiveRecall → iniciar sessão normalmente

**Decisão de design necessária antes:**
> Active Recall deve ser **obrigatório** ou **opcional** (toggle nas settings)?

**Como verificar:**
```
npm run dev
# Com dados de estudo existentes, navegar para /study?topicId=<id de tópico revisado>
# Verificar que a tela de ActiveRecall aparece antes dos cards
# Verificar que o blur some ao clicar Revelar
# Verificar que os cards FSRS aparecem após confirmar
```

- **Concluída em:** _______________

---

#### PED-F2 — Missão Diária com HERO no Dashboard

- **Status:** ✅ Concluído
- **Prioridade:** 🔴 Alta
- **Estimativa:** 3h
- **Arquivos:** `src/routes/+page.svelte`, `src/lib/components/dashboard/MissaoDiaria.svelte`, `src/lib/engines/sessionGenerator.js`
- **Concluída em:** 2026-03-19T01:15
**O que fazer:**
1. Em `src/lib/engines/sessionGenerator.js`:
   - Criar função `getDailyMission(limit = 4)`:
     - Retorna array de tópicos com interleaving por matéria
     - Cada item: `{ topicId, topicName, subjectName, subjectColor, actionType: 'Novo'|'Revisão'|'Urgente', cardCount, urgencyScore }`
     - O primeiro item é o HERO (maior urgência)
2. Em `src/lib/components/dashboard/MissaoDiaria.svelte`:
   - Card HERO em destaque: grande, com botão "▶ Estudar agora"
   - Abaixo: lista compacta dos próximos 3 tópicos
   - Badge por `actionType` (cor diferente: Urgente=vermelho, Revisão=azul, Novo=verde)
   - Estado de loading com `LoadingSkeleton`
3. Em `src/routes/+page.svelte`:
   - Substituir card genérico de "Sessão de hoje" por `<MissaoDiaria>`
   - Ao clicar Estudar: `goto('/study?topicId=' + topicId)`

**Como verificar:**
```
npm run dev
# Abrir / (dashboard)
# Verificar card Missão Diária com 1 HERO + fila de 3 tópicos
# Clicar em Estudar → deve navegar para /study?topicId=X
```

- **Concluída em:** _______________

---

#### PED-F3 — Ritual Pré-Sessão com Bizus/Erros no PreVoo

- **Status:** ✅ Concluído
- **Prioridade:** 🔴 Alta
- **Estimativa:** 2h
- **Arquivos:** `src/lib/components/study/PreVoo.svelte`, `src/lib/stores/notes.js`
- **Concluída em:** 2026-03-19T01:50
**O que fazer:**
1. Garantir que `src/lib/stores/notes.js` tem função `getNotesByTopic(topicId)` retornando bizus e erros separados
2. Em `PreVoo.svelte`:
   - Carregar notas do tópico atual via `getNotesByTopic(topicId)`
   - Se existem bizus: exibir seção "Seus Bizus" com lista
   - Se existem erros: exibir seção "Erros Anteriores" com lista
   - Se o tópico é revisão E tem bizus/erros → ativar modo blur (integrar com PED-F1 ou usar aqui mesmo)
   - Se o tópico é novo → ritual simples: checkboxes (celular guardado ✓, água ✓, foco ✓)

**Como verificar:**
```
npm run dev
# Adicionar manualmente um bizu via TopicNotes durante uma sessão
# Na próxima visita ao mesmo tópico via /study?topicId=X
# Verificar que o PreVoo mostra o bizu salvo
```

- **Concluída em:** _______________

---

#### PED-F4 — Bloqueios de Fluxo com Feedback Pedagógico

- **Status:** ✅ Concluído
- **Prioridade:** 🟡 Média
- **Estimativa:** 3h
- **Arquivos:** `src/lib/engines/tutorEngine.js`, `src/routes/study/+page.svelte`
- **Concluída em:** 2026-03-19T02:00
**O que fazer:**
1. Definir estados válidos de ação por tópico:
   - Tópico novo → apenas `Estudo` permitido
   - Aguardando validação (estudado há <24h) → apenas `Questões` permitido
   - Em revisão programada → apenas `Revisão` permitida
2. Em `session.js`: validar antes de iniciar sessão e retornar erro descritivo
3. Em `study/+page.svelte`: se ação bloqueada, mostrar modal/toast com explicação pedagógica:
   - "Você estudou este tópico há 3 horas. Para consolidar a memória, volte amanhã para fazer questões."

**Decisão de design necessária antes:**
> O intervalo de consolidação de 24h deve sobrescrever o FSRS se o FSRS disser para revisar antes?

**Como verificar:**
```
npm run dev
# Estudar um tópico e tentar revisá-lo imediatamente
# Deve aparecer mensaje pedagógica explicando o bloqueio
```

- **Concluída em:** _______________

---

#### PED-F5 — Caderno de Bizus e Erros

- **Status:** ✅ Concluído
- **Prioridade:** 🟡 Média
- **Estimativa:** 3h
- **Arquivos:** `src/lib/components/study/TopicNotes.svelte`
- **Concluída em:** 2026-03-19T02:05
**O que fazer:**
1. **`src/lib/db.js`:** Verificar se a tabela `notes` já existe com schema `++id, topicId, type, content, createdAt`. Se não, adicionar como nova versão do Dexie
2. **`src/lib/stores/notes.js`:** Verificar/criar com métodos:
   - `addNote(topicId, type, content)` — `type`: `'bizu'` | `'error'` | `'annotation'`
   - `getNotesByTopic(topicId)` — retorna `{ bizus: [], errors: [], annotations: [] }`
   - `deleteNote(noteId)`
3. **`src/lib/components/study/TopicNotes.svelte`:** Verificar se existe e está funcional:
   - UI para adicionar Bizu ou Erro
   - Lista de notas do tópico atual
   - Botão de deleção
   - Acessível via botão flutuante no `study/+page.svelte`

**Como verificar:**
```
npm run dev
# Durante uma sessão, clicar no botão flutuante de notas
# Adicionar um bizu: "Mnemônico XYZ"
# Adicionar um erro: "Confundi X com Y"
# Finalizar sessão → abrir a mesma matéria novamente
# No PreVoo, verificar que bizu e erro aparecem
```

- **Concluída em:** _______________

---

### 📈 FASE 6 — Relatórios Avançados (~12h)

#### PED-F6 — Heatmap de Consistência (GitHub Style)

- **Status:** ✅ Concluído
- **Prioridade:** 🟡 Média
- **Estimativa:** 3h
- **Arquivos:** `src/routes/stats/+page.svelte`, `src/lib/engines/analytics.js`, `src/lib/components/stats/ConsistencyHeatmap.svelte`
- **Concluída em:** 2026-03-19T02:30

#### PED-F7 — Projeção de Carga de Trabalho Futura

- **Status:** ✅ Concluído
- **Prioridade:** 🔴 Alta
- **Estimativa:** 3h
- **Arquivos:** `src/lib/engines/scheduler.js`, `src/routes/stats/+page.svelte`, `src/lib/components/stats/FutureWorkloadChart.svelte`
- **Concluída em:** 2026-03-19T02:40

#### PED-F8 — Análise de Velocidade e Eficiência

- **Status:** ✅ Concluído
- **Prioridade:** 🟡 Média
- **Estimativa:** 4h
- **Arquivos:** `src/lib/engines/analytics.js`, `src/lib/components/stats/EfficiencyAnalysis.svelte`
- **Concluída em:** 2026-03-19T02:50

#### PED-F9 — Exportação de Relatório PDF/CSV

- **Status:** ⏸️ Pendente
- **Prioridade:** 🔵 Baixa
- **Estimativa:** 2h
- **O que fazer:** Permitir baixar os dados brutos de desempenho.

---

## ❓ Decisões de Design em Aberto

Antes de implementar PED-F1 e PED-F4, as seguintes decisões precisam ser tomadas:

| # | Decisão | Opções |
|---|---|---|
| D-1 | Active Recall: obrigatório ou opcional? | (A) Sempre obrigatório / (B) Toggle nas Settings |
| D-2 | Consolidação 24h sobrepõe FSRS? | (A) Sim, bloqueia / (B) Não, FSRS decide |
| D-3 | Missão Diária substitui ou complementa? | (A) Substitui a tela de sessão / (B) Complementa (ambos coexistem) |

---

## 📋 Checklist Rápido — Próximas Ações

```
[ ] Tomar decisões D-1, D-2, D-3 (conversar com o usuário)
[ ] DS-T7 — Refatorar TutorMission.svelte
[ ] DS-T8 — Refatorar MissaoDiaria.svelte
[ ] DS-T9 — Refatorar EditalMasteryPanel.svelte
[ ] DS-T10 — Refatorar SubjectDrilldown.svelte
[ ] DS-T11 — Refatorar MasteryGauge.svelte
[ ] DS-T12 — Refatorar EditalWidget.svelte
[ ] DS-T13 — Refatorar StudyCard.svelte
[ ] DS-T14 — Refatorar PreVoo.svelte
[ ] DS-T15 — Refatorar pages principais
[ ] DS-T16 — Page transitions layout
[ ] DS-T17 — Animações entrada em listas
[ ] DS-T18 — Hover states globais app.css
[ ] DS-T19 — Dark Mode TutorMission
[ ] DS-T20 — Dark Mode MissaoDiaria
[ ] DS-T21 — Dark Mode EditalMasteryPanel
[ ] DS-T22 — Dark Mode SubjectDrilldown
[ ] DS-T23 — Dark Mode MasteryGauge
[ ] DS-T24 — Dark Mode PreVoo
[ ] DS-T25 — Criar DOCS/DESIGN_SYSTEM.md
[ ] DS-T26 — Criar DOCS/DARK_MODE.md
[ ] DS-T27 — Criar tests/ui/designSystem.test.js
[ ] DS-T28 — Criar scripts/test-theme.js
[ ] PED-F1 — Active Recall Screen
[ ] PED-F2 — Missão Diária com HERO
[ ] PED-F3 — Ritual Pré-Sessão com Bizus/Erros
[ ] PED-F4 — Bloqueios de fluxo pedagógicos
[ ] PED-F5 — Caderno de Bizus e Erros
```

---

**Última atualização:** 2026-03-18T16:59:07-03:00
