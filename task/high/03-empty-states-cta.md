# Task: Melhorar Empty States com CTAs

## Metadata

- **Prioridade:** HIGH
- **Complexidade:** Baixa
- **Tempo Estimado:** 2-3 horas
- **Arquivos Envolvidos:**
  - `src/routes/subjects/+page.svelte`
  - `src/routes/cards/+page.svelte`
  - `src/lib/components/common/EmptyState.svelte`

## Problema Identificado

Empty states em Subjects e Cards mostram apenas texto sem call-to-action, diminuindo conversão de novos usuários.

## Solução

Melhorar componente EmptyState para aceitar action prop e atualizar páginas.

## Alterações Necessárias

### 1. Atualizar EmptyState.svelte

```svelte
<!-- Adicionar props -->
export let action = null; // { label: string, href?: string, onClick?: function }
export let actionLabel = '';
export let actionHref = '';
export let onAction = null;
```

### 2. Atualizar subjects/+page.svelte

Localizar:

```svelte
{:else}
  <EmptyState
    icon="📚"
    title="Nenhuma matéria cadastrada"
    description="Comece adicionando uma matéria para organizar seus estudos."
  />
{/if}
```

Alterar para:

```svelte
{:else}
  <EmptyState
    icon="📚"
    title="Nenhuma matéria cadastrada"
    description="Comece adicionando uma matéria para organizar seus estudos."
    actionLabel="Adicionar Matéria"
    actionHref="/subjects/new"
  />
{/if}
```

### 3. Atualizar cards/+page.svelte

Mesma estrutura para empty state de cards.

## Critérios de Aceitação

- [ ] EmptyState com botão de ação quando definido
- [ ] Navegação para página correta ao clicar
- [ ] Consistência visual com design system
- [ ] Estados: hover, active, disabled do botão

## Checklist de Testes

- [ ] Empty state subjects com CTA visível
- [ ] Empty state cards com CTA visível
- [ ] Click no CTA navega para página correta
- [ ] CTA funciona em mobile
- [ ] Estilos consistentes com botões do app
