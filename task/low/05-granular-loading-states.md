# Task: Adicionar Loading State Granular em Operações Menores

## Metadata

- **Prioridade:** LOW
- **Complexidade:** Baixa
- **Tempo Estimado:** 2-3 horas
- **Arquivos Envolvidos:**
  - Vários componentes de botões e ações

## Problema Identificado

Botões de ações menores (delete, toggle) não mostram loading state.

## Solução

Padrão de loading state granular em botões.

## Padrão de Implementação

```svelte
<!-- Botão com loading state -->
<button
  on:click={handleDelete}
  disabled={loading}
  class="relative"
>
  {#if loading}
    <span class="absolute inset-0 flex items-center justify-center">
      <Spinner size="sm" />
    </span>
  {/if}
  <span class={loading ? 'invisible' : ''}>Excluir</span>
</button>
```

## Critérios de Aceitação

- [ ] Botão desabilitado durante loading
- [ ] Spinner visível
- [ ] Texto não pula durante loading
- [ ] Erro tratado (loading para)

## Checklist de Testes

- [ ] Loading state visível
- [ ] Clique não funciona durante loading
- [ ] Erro não deixa em loading eterno
