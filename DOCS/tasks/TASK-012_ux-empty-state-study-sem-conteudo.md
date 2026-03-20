# TASK-012 — Guard/Empty State no `/study` quando não há conteúdo

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-012 |
| **Data de criação** | 2026-03-19 |
| **Categoria** | `UX` · `OPERACIONAL` |
| **Prioridade** | 🔴 P0 — Crítico |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 1h 30min |

---

## 🎯 OBJETIVO

Impedir que o usuário caia em uma experiência confusa no `/study` quando ainda não existe base mínima (matérias/tópicos/cards), exibindo um **Empty State com CTAs** claros.

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual:**
- Usuário pode acessar `/study` mesmo sem matérias/cards e o fluxo tenta iniciar sessão.
- Para iniciante, isso parece bug/loop (principalmente se o gerador não encontrar conteúdo).

**Comportamento esperado:**
- Se não houver dados mínimos, `/study` mostra:
  - explicação curta (1–2 frases),
  - botões para “Cadastrar matérias” e “Criar cards”,
  - opcional: CTA para “Criar dados demo” (se suportado sem duplicar lógica).

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/routes/study/+page.svelte` | `ALTERAR` | Adicionar guard + empty state |
| `src/lib/components/common/EmptyState.svelte` | `REUTILIZAR` | Componente já existe |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Criar estado “blocked”

**Arquivo:** `src/routes/study/+page.svelte`

**O que fazer:**
1. Adicionar estado:
   - `let blockedReason = '';`
   - `let blocked = false;`
2. No `onMount`, após `initializeDatabase()` e `configStore.load()`, carregar contagens:
   - `subjectsCount = await db.subjects.count()`
   - `topicsCount = await db.topics.count()`
   - `cardsCount = await db.cards.count()`
3. Definir regra mínima (recomendada):
   - Se `subjectsCount === 0` → bloquear (“Cadastre matérias do edital…”).
   - Se `topicsCount === 0` → bloquear (“Crie tópicos em uma matéria…”).
   - Se `cardsCount === 0` → bloquear (“Crie pelo menos 1 card…”).
4. Se bloquear:
   - não chamar `loadSession()`;
   - não registrar handlers de teclado;
   - renderizar EmptyState.

---

### Passo 2 — Renderizar EmptyState com CTAs

**Arquivo:** `src/routes/study/+page.svelte`

**O que fazer:**
- Quando `blocked === true`:
  - exibir `EmptyState` com icon e texto;
  - incluir CTAs:
    - Link/botão para `/subjects`
    - Link/botão para `/cards`

**Direção (exemplo):**
```svelte
{#if blocked}
  <div class="max-w-2xl mx-auto px-4 py-10">
    <EmptyState
      icon="🚀"
      title="Antes de começar o estudo"
      description={blockedReason}
      size="lg"
    >
      <div slot="action" class="flex flex-col sm:flex-row gap-3 mt-4">
        <a class="..." href="/subjects">Cadastrar matérias</a>
        <a class="..." href="/cards">Criar cards</a>
      </div>
    </EmptyState>
  </div>
{:else}
  <!-- fluxo normal do estudo -->
{/if}
```

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Em banco vazio, `/study` mostra EmptyState com CTAs (sem travar).
- [ ] Em banco com conteúdo, `/study` mantém o fluxo atual.
- [ ] Não há listeners de teclado ativos quando bloqueado.
- [ ] Sem erros no console.

---

## 🔗 DEPENDÊNCIAS

- Recomendada junto: `DOCS/tasks/TASK-010_ux-navegacao-mobile-e-menu-ativo.md` (CTAs e navegação no mobile).

---

## 🧪 COMO TESTAR

1. Caso de banco vazio:
   - Abrir `/settings` e usar “Limpar Tudo” (ou apagar IndexedDB no DevTools).
   - Acessar `/study` → deve aparecer o EmptyState com CTAs.
2. Caso com dados:
   - Criar 1 matéria + 1 tópico + 1 card.
   - Acessar `/study` → deve iniciar sessão normalmente.

