# Task: Adicionar Mobile Navigation

## Metadata

- **Prioridade:** HIGH
- **Complexidade:** Média
- **Tempo Estimado:** 2-3 horas
- **Arquivos Envolvidos:** `src/routes/+layout.svelte`
- **Dependências:** Nenhuma

## Problema Identificado

A navegação lateral está oculta em mobile (`hidden md:flex`), deixando usuários mobile sem acesso fácil às rotas principais.

## Solução

Implementar bottom navigation bar para mobile com os principais itens:

- Dashboard
- Estudar
- Cards
- Matérias
- Mais (Stats, Settings)

## Critérios de Aceitação

- [ ] Bottom nav visível apenas em mobile (< md)
- [ ] Ícones claros com labels
- [ ] Indicador de rota ativa
- [ ] Feedback visual no tap
- [ ] Não sobrepõe conteúdo principal (safe area)
- [ ] Animações suaves de transição

## Implementação Sugerida

```svelte
<!-- Em +layout.svelte, adicionar após aside -->
<nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-slate-200 dark:border-slate-700 z-50 pb-safe">
  <div class="flex justify-around items-center h-16">
    {#each navItems as item}
      <a href={item.href} class="flex flex-col items-center justify-center gap-1 px-3 py-2 {isActive(item.href) ? 'text-primary-500' : 'text-slate-500'}">
        <Icon name={item.icon} size={20} />
        <span class="text-xs font-medium">{item.label}</span>
      </a>
    {/each}
  </div>
</nav>
```

## Checklist de Testes

- [ ] Navegação funcional em viewport mobile (375px)
- [ ] Navegação funcional em viewport tablet (768px) - deve ocultar
- [ ] Roteamento funciona corretamente
- [ ] Tema dark mode 적용
- [ ] Safe area em iPhones com notch
