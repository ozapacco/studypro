# TASK-003 — Corrigir Rótulos Duplos na Sidebar de Navegação

> **⚠️ LEIA ANTES DE COMEÇAR:** Bug visual — itens do menu lateral exibem o rótulo duas vezes (ex: "Estudo Estudo"). É uma anomalia de componente que prejudica a credibilidade do sistema.

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-003 |
| **Data de criação** | 2026-03-19 |
| **Criado por** | Equipe de Auditoria (3 Agentes) |
| **Categoria** | `BUG` `UX` |
| **Prioridade** | 🟡 P1 — Importante |
| **Status** | ✅ Concluída (2026-03-20) |
| **Estimativa** | 30min |
| **Responsável** | — |

---

## 🎯 OBJETIVO

Remover o texto duplicado que aparece em cada item da sidebar de navegação. Atualmente cada item exibe seu rótulo duas vezes: "Estudo Estudo", "Cartoes Cartoes", "Configuracoes Ajustes", etc.

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual:**
Cada item do menu lateral da aplicação exibe texto duplicado:
- "Estudo Estudo"
- "Cartoes Cartoes"
- "Configuracoes Ajustes"
- E assim por diante para todos os itens

**Comportamento esperado:**
Cada item deve exibir apenas um rótulo limpo:
- "Estudo"
- "Cartões"
- "Ajustes"

**Impacto:**
- [ ] Bloqueia fluxo principal do usuário
- [ ] Perde dados do usuário
- [x] Causa erro visual/confusão
- [ ] Impede funcionalidade secundária

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/routes/+layout.svelte` | `ALTERAR` | Principal suspeito — contém o layout com sidebar |
| `src/lib/components/` (qualquer `Sidebar.svelte` ou `NavItem.svelte`) | `ALTERAR` | Se sidebar for componentizada |
| `DOCS/tasks/TASK-003.md` | `ATUALIZAR` | Marcar como concluída ao fim |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Localizar o componente da sidebar

**Arquivo:** `src/routes/+layout.svelte`

Buscar por algum dos rótulos duplicados: `"Estudo"`, `"Cartoes"`, `"Configuracoes"`.

---

### Passo 2 — Identificar a causa da duplicação

**Causa A — Rótulo no slot E como prop:**
```svelte
<!-- ❌ ERRADO: rótulo aparece como prop E dentro do slot -->
<NavItem label="Estudo" href="/study">
  Estudo   <!-- ← este texto aqui está duplicando o label -->
</NavItem>

<!-- ✅ CORRETO: usar apenas prop ou apenas slot, não os dois -->
<NavItem label="Estudo" href="/study" />
<!-- ou -->
<NavItem href="/study">Estudo</NavItem>
```

**Causa B — Componente renderiza label + children:**
```svelte
<!-- Dentro de NavItem.svelte: -->

<!-- ❌ ERRADO: -->
<a href={href}>
  {label}     <!-- ← label como prop -->
  <slot />    <!-- ← slot também recebe o mesmo texto -->
</a>

<!-- ✅ CORRETO: usar apenas um dos dois -->
<a href={href}>
  {#if label}
    {label}
  {:else}
    <slot />
  {/if}
</a>
```

**Causa C — Ícone tem `aria-label` ou `title` visível:**
```svelte
<!-- ❌ ERRADO: title visível como tooltip duplica rótulo -->
<span title="Estudo">{icon}</span>
<span>Estudo</span>

<!-- ✅ CORRETO: title apenas para acessibilidade, escondido visualmente -->
<span aria-hidden="true">{icon}</span>
<span>Estudo</span>
```

---

### Passo 3 — Corrigir e testar em todos os itens

Após identificar a causa, garantir que a correção se aplica a **todos** os itens:
- Início / Dashboard
- Estudo
- Cartões
- Matérias
- Estatísticas
- Configurações / Ajustes
- Edital (se aparecer após TASK-004)

---

### Passo 4 — Atualizar rótulos para português correto

Aproveitar a correção para garantir que os rótulos usam acentuação e grafia correta:

| Atual (com bug) | Correto |
|---|---|
| Estudo Estudo | Estudo |
| Cartoes Cartoes | Cartões |
| Configuracoes Ajustes | Ajustes |
| Materias Materias | Matérias |
| Estatisticas | Estatísticas |

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Nenhum item da sidebar exibe rótulo duplicado
- [ ] Todos os rótulos usam a grafia correta em português (com acentos)
- [ ] Os ícones de cada item estão alinhados corretamente com o texto
- [ ] A navegação funcionando normalmente (nenhum link quebrado)
- [ ] Sem erros no console do browser

---

## 🔗 DEPENDÊNCIAS

| Tipo | Referência | Obs |
|---|---|---|
| **Relacionada** | TASK-004 | TASK-004 adiciona novo item ao menu — executar após esta |

---

## 🧪 COMO TESTAR

1. Abrir `http://localhost:5175/`
2. Observar os itens da sidebar lateral
3. ✅ **Esperado:** Cada item exibe apenas 1 rótulo limpo
4. Clicar em cada item para confirmar que a navegação ainda funciona
5. ✅ **Esperado:** Todos os links da sidebar navegam corretamente

---

## 📝 REGISTRO DE EXECUÇÃO

| Campo | Valor |
|---|---|
| **Executado por** | Codex (GPT-5) |
| **Data início** | 2026-03-20 |
| **Data fim** | 2026-03-20 |
| **Tempo real gasto** | ~20min |
| **Status final** | ✅ Concluída |

**Observações:**
> —

---

## 🔄 HISTÓRICO DE ALTERAÇÕES

| Data | Alteração | Por |
|---|---|---|
| 2026-03-19 | Task criada após auditoria de 3 agentes | Equipe de Auditoria |
| 2026-03-20 | Correção aplicada em src/routes/+layout.svelte para remover rótulos duplicados e normalizar ícones/rótulos | Codex (GPT-5) |
