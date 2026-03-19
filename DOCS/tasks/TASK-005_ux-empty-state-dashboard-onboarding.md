# TASK-005 — Criar Empty State com CTA no Dashboard Vazio

> **⚠️ LEIA ANTES DE COMEÇAR:** O dashboard sem dados parece "morto" e não guia o novo usuário. Esta task implementa um estado vazio motivador que orienta o primeiro acesso.

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-005 |
| **Data de criação** | 2026-03-19 |
| **Criado por** | Equipe de Auditoria (3 Agentes) |
| **Categoria** | `UX` `FEATURE` |
| **Prioridade** | 🟡 P1 — Importante |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 3h |
| **Responsável** | — |

---

## 🎯 OBJETIVO

Implementar um estado vazio (Empty State) no Dashboard que detecta quando o usuário não tem matérias/cards cadastrados e exibe uma tela de onboarding motivacional com Call-to-Action (CTA) claro para iniciar o uso.

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual:**
Quando o usuário acessa o dashboard sem nenhuma matéria ou card cadastrado, vê cards em branco com textos como:
- "Última Sessão: —"
- "Próxima Revisão: —"
- "Data da prova não configurada"

Não há nenhuma orientação sobre o que fazer nem botão de ação claro. O usuário fica desorientado.

**Comportamento esperado:**
Detectar o estado "sem dados" e exibir uma tela de boas-vindas com:
1. Mensagem motivacional de boas-vindas
2. Passos rápidos (checklist visual) para configurar o sistema
3. Botão primário de CTA: "Configurar meu Edital" ou "Adicionar minha primeira Matéria"

**Impacto:**
- [ ] Bloqueia fluxo principal do usuário
- [ ] Perde dados do usuário
- [x] Causa erro visual/confusão
- [x] Impede funcionalidade secundária (onboarding)

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/routes/+page.svelte` | `ALTERAR` | Dashboard principal — adicionar lógica de empty state |
| `src/lib/components/common/EmptyState.svelte` | `VERIFICAR/USAR` | Componente já existe — reutilizar se disponível |
| `src/lib/stores/subjects.js` | `VERIFICAR` | Para detectar se há matérias cadastradas |
| `src/lib/stores/cards.js` | `VERIFICAR` | Para detectar se há cards cadastrados |
| `DOCS/tasks/TASK-005.md` | `ATUALIZAR` | Marcar como concluída ao fim |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Implementar lógica de detecção de estado vazio

**Arquivo:** `src/routes/+page.svelte`

```svelte
<script>
  import { subjectsStore } from '$lib/stores/subjects.js';
  import { cardsStore } from '$lib/stores/cards.js';

  // Derivar se o sistema está "vazio"
  $: isEmpty = $subjectsStore.length === 0;
  $: hasNoCards = $cardsStore.length === 0;
  $: isFirstAccess = isEmpty && hasNoCards;
</script>
```

---

### Passo 2 — Criar o componente de Onboarding Welcome

No arquivo `src/routes/+page.svelte`, adicionar condicionalmente o empty state:

```svelte
{#if isFirstAccess}
  <!-- EMPTY STATE DE ONBOARDING -->
  <div class="flex flex-col items-center justify-center min-h-[60vh] text-center gap-8 px-4">
    
    <!-- Ícone motivacional -->
    <div class="text-6xl">🚀</div>
    
    <!-- Título -->
    <div>
      <h1 class="text-3xl font-bold text-primary mb-2">
        Bem-vindo ao StudyPro!
      </h1>
      <p class="text-slate-500 dark:text-slate-400 text-lg max-w-md">
        Você está a 3 passos de ter um sistema de estudos inteligente funcionando.
      </p>
    </div>

    <!-- Checklist de passos -->
    <div class="flex flex-col gap-3 w-full max-w-sm text-left">
      
      <a href="/subjects" class="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed
         border-primary/40 hover:border-primary hover:bg-primary/5 transition-all group">
        <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center
                    font-bold group-hover:bg-primary group-hover:text-white transition-all">
          1
        </div>
        <div>
          <div class="font-semibold text-sm">Cadastrar Matérias do Edital</div>
          <div class="text-xs text-slate-400">Defina as matérias e seus pesos</div>
        </div>
        <span class="ml-auto text-slate-400 group-hover:text-primary">→</span>
      </a>

      <div class="flex items-center gap-3 p-4 rounded-xl border border-slate-200
                  dark:border-slate-700 opacity-60">
        <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center
                    justify-center font-bold text-slate-400">2</div>
        <div>
          <div class="font-semibold text-sm text-slate-500">Criar Flashcards</div>
          <div class="text-xs text-slate-400">Adicione perguntas e respostas</div>
        </div>
      </div>

      <div class="flex items-center gap-3 p-4 rounded-xl border border-slate-200
                  dark:border-slate-700 opacity-60">
        <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center
                    justify-center font-bold text-slate-400">3</div>
        <div>
          <div class="font-semibold text-sm text-slate-500">Iniciar a Missão</div>
          <div class="text-xs text-slate-400">O sistema cuida do resto</div>
        </div>
      </div>
    </div>

    <!-- CTA Principal -->
    <a href="/subjects"
       class="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg
              hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/30">
      Começar Agora → Configurar Matérias
    </a>

  </div>

{:else}
  <!-- DASHBOARD NORMAL (conteúdo existente) -->
  <!-- ... resto do dashboard atual ... -->
{/if}
```

---

### Passo 3 — Ajuste progressivo (matérias mas sem cards)

```svelte
{:else if hasNoCards && !isEmpty}
  <!-- Tem matérias mas sem cards — guiar para criar cards -->
  <div class="...">
    <p>Ótimo! Matérias configuradas. Agora crie seus primeiros flashcards.</p>
    <a href="/cards">Criar primeiro Flashcard →</a>
  </div>
{:else}
  <!-- Dashboard normal -->
{/if}
```

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Usuário sem matérias vê o empty state de onboarding ao acessar `/`
- [ ] O empty state exibe os 3 passos de configuração visualmente
- [ ] O botão/link do Passo 1 navega para `/subjects`
- [ ] Após cadastrar matérias, o empty state não aparece mais
- [ ] O dashboard normal (com dados) não é afetado
- [ ] Funciona em modo claro e escuro
- [ ] Sem erros no console do browser

---

## 🔗 DEPENDÊNCIAS

| Tipo | Referência | Obs |
|---|---|---|
| **Depende de** | TASK-001 | Recomendado: corrigir cards antes de guiar usuário para criar cards |
| **Relacionada** | TASK-006 | Ações destrutivas — ambas melhoram configurações |

---

## 🧪 COMO TESTAR

**Teste 1 — Estado vazio:**
1. Abrir `/settings` e usar "Limpar Tudo" (backup antes!)
2. Navegar para `/`
3. ✅ **Esperado:** Empty state com os 3 passos aparece

**Teste 2 — CTA funcional:**
4. Clicar no passo 1 "Cadastrar Matérias"
5. ✅ **Esperado:** Navega para `/subjects`

**Teste 3 — Transição para dashboard normal:**
6. Criar uma matéria em `/subjects`
7. Criar um card em `/cards`
8. Voltar para `/`
9. ✅ **Esperado:** Dashboard normal aparece (sem o empty state)

---

## 📝 REGISTRO DE EXECUÇÃO

| Campo | Valor |
|---|---|
| **Executado por** | — |
| **Data início** | — |
| **Data fim** | — |
| **Tempo real gasto** | — |
| **Status final** | — |

**Observações:**
> —

---

## 🔄 HISTÓRICO DE ALTERAÇÕES

| Data | Alteração | Por |
|---|---|---|
| 2026-03-19 | Task criada após auditoria de 3 agentes | Equipe de Auditoria |
