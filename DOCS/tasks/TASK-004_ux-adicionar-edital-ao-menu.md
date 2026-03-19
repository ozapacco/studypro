# TASK-004 — Adicionar Rota `/edital` ao Menu Lateral (Sidebar)

> **⚠️ LEIA ANTES DE COMEÇAR:** A tela `/edital` é uma das mais ricas e informativas do sistema, mas está completamente inacessível pelo menu. O usuário só a encontra por URL direta.

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-004 |
| **Data de criação** | 2026-03-19 |
| **Criado por** | Equipe de Auditoria (3 Agentes) |
| **Categoria** | `UX` `OPERACIONAL` |
| **Prioridade** | 🟡 P1 — Importante |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 45min |
| **Responsável** | — |

---

## 🎯 OBJETIVO

Adicionar o item "Domínio do Edital" (apontando para `/edital`) ao menu lateral de navegação, tornando essa tela acessível para o usuário sem precisar digitar a URL manualmente.

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual:**
A rota `/edital` existe e está completamente implementada (avaliada como 9/10 visualmente pela auditoria), mas não há nenhum link para ela no menu lateral. O usuário só chega nela via:
- URL direta: `http://localhost:5175/edital`
- Links scattered no Dashboard (não evidentes)

**Comportamento esperado:**
A sidebar deve ter um item "Domínio do Edital" com ícone adequado que leva o usuário a `/edital`.

**Impacto:**
- [ ] Bloqueia fluxo principal do usuário
- [ ] Perde dados do usuário
- [x] Causa erro visual/confusão
- [x] Impede funcionalidade secundária

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/routes/+layout.svelte` | `ALTERAR` | Adicionar novo item de navegação na sidebar |
| `DOCS/tasks/TASK-004.md` | `ATUALIZAR` | Marcar como concluída ao fim |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Abrir o layout e localizar os itens de navegação

**Arquivo:** `src/routes/+layout.svelte`

Buscar pelos itens existentes do menu (ex: buscar por `href="/study"` ou `href="/stats"`) para entender o padrão do componente/estrutura usada.

---

### Passo 2 — Adicionar o item de Edital seguindo o padrão existente

**Posicionamento recomendado:** Entre "Estatísticas" e "Ajustes" (último antes das configurações).

**Ícone sugerido:** `📋` (clipboard/document) ou equivalente em Heroicons/Phosphor dependendo da biblioteca usada.

```svelte
<!-- Exemplo de como adicionar (adaptar ao padrão do projeto): -->

<!-- Se for um array de rotas: -->
const navItems = [
  { href: '/', label: 'Início', icon: HomeIcon },
  { href: '/study', label: 'Estudo', icon: BookIcon },
  { href: '/cards', label: 'Cartões', icon: CardIcon },
  { href: '/subjects', label: 'Matérias', icon: ListIcon },
  { href: '/stats', label: 'Estatísticas', icon: ChartIcon },
  // ✅ ADICIONAR:
  { href: '/edital', label: 'Domínio do Edital', icon: ClipboardIcon },
  { href: '/settings', label: 'Ajustes', icon: GearIcon },
];
```

```svelte
<!-- Se for markup direto, adicionar item antes do de configurações: -->

<!-- Item EXISTENTE (referência de posição): -->
<a href="/stats" class="nav-item ...">
  {ícone}
  <span>Estatísticas</span>
</a>

<!-- ✅ ADICIONAR ESTE: -->
<a href="/edital" class="nav-item ...">
  {ícone de documento/mapa}
  <span>Domínio do Edital</span>
</a>

<!-- Item EXISTENTE (configurações, vai depois): -->
<a href="/settings" class="nav-item ...">
  {ícone}
  <span>Ajustes</span>
</a>
```

---

### Passo 3 — Garantir active state na rota `/edital`

A sidebar provavelmente usa `$page.url.pathname` para destacar o item ativo. Verificar que o novo item recebe o highlight correto ao estar em `/edital`:

```svelte
<!-- Verificar que a classe ativa é aplicada: -->
class:active={$page.url.pathname === '/edital'}
<!-- ou -->
class:active={$page.url.pathname.startsWith('/edital')}
```

---

### Passo 4 — Executar TASK-003 antes ou junto

> ⚠️ Recomendado: executar TASK-003 (rótulos duplos) junto com esta task, pois ambas alteram o mesmo arquivo (`+layout.svelte`).

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Item "Domínio do Edital" visível na sidebar em todas as telas
- [ ] Clicar no item navega corretamente para `/edital`
- [ ] O item fica destacado (active state) quando o usuário está em `/edital`
- [ ] O ícone do item é coerente com a função (documento/mapa/clipboard)
- [ ] O texto usa português com acento correto ("Edital" ou "Domínio do Edital")
- [ ] A ordem dos itens segue lógica de fluxo do usuário

---

## 🔗 DEPENDÊNCIAS

| Tipo | Referência | Obs |
|---|---|---|
| **Relacionada** | TASK-003 | Ambas alteram `+layout.svelte` — executar juntas |

---

## 🧪 COMO TESTAR

1. Abrir `http://localhost:5175/`
2. Observar a sidebar lateral
3. ✅ **Esperado:** Novo item "Domínio do Edital" visível no menu
4. Clicar no item
5. ✅ **Esperado:** Navega para `/edital` com a tela completa carregando
6. Verificar que o item fica destacado na sidebar enquanto em `/edital`
7. Navegar para outras telas e voltar
8. ✅ **Esperado:** Funciona como os outros itens do menu

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
