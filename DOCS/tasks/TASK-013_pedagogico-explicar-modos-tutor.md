# TASK-013 — Explicar Modos do Tutor (Active/Passive/Strict)

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-013 |
| **Data de criação** | 2026-03-19 |
| **Categoria** | `PEDAGÓGICO` · `UX` |
| **Prioridade** | 🔴 P0 — Crítico |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 1h 30min |

---

## 🎯 OBJETIVO

Reduzir escolhas erradas e “efeito mágico” do tutor, explicando claramente o que muda em cada modo (com **progressive disclosure**: 1 linha + “Saiba mais”).

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual:**
- Usuário escolhe `passive/active/strict` sem saber impacto real.
- Quando o tutor bloqueia (strict), a experiência pode parecer bug/punição.

**Comportamento esperado:**
- Em `settings`, cada modo tem:
  - 1 descrição de linha curta (já existe `mode.desc`),
  - um bloco “Saiba mais” com 3 bullets (o que muda, para quem é, quando usar).
- Em `/study`, quando houver bloqueio pedagógico:
  - o usuário entende o motivo e sabe o próximo passo.

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/routes/settings/+page.svelte` | `ALTERAR` | UI de modos + “Saiba mais” |
| `src/routes/study/+page.svelte` | `ALTERAR` | Mensagem contextual quando bloquear |
| `src/lib/engines/tutorEngine.js` | `VERIFICAR` | Confirmar semântica real de cada modo |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Confirmar semântica real dos modos

**Arquivo:** `src/lib/engines/tutorEngine.js`

**O que fazer:**
- Localizar como `mode` altera decisões/bloqueios.
- Anotar (para copiar no microcopy) quais são as diferenças reais:
  - `passive`: sugere/observa?
  - `active`: recomenda e calcula missão?
  - `strict`: bloqueia navegação/força foco?

> Importante: o texto do app deve refletir o comportamento real (sem marketing enganoso).

---

### Passo 2 — “Saiba mais” em Settings (progressive disclosure)

**Arquivo:** `src/routes/settings/+page.svelte`

**O que fazer:**
1. Abaixo da seleção de modos, adicionar um `<details>` (acessível) com um resumo curto:
   - `summary`: “O que muda em cada modo?”
2. Conteúdo com 3 blocos curtos (1 por modo), com:
   - “Quando usar”
   - “O que o tutor faz”
   - “Risco / cuidado” (especialmente no strict)
3. Marcar um modo como recomendado (provável: `active`) com um badge “Recomendado”.

---

### Passo 3 — Mensagem contextual no bloqueio do strict

**Arquivo:** `src/routes/study/+page.svelte`

**O que fazer:**
- Onde já existe:
  - `const pedagogicalBlock = await tutorEngine.checkPedagogicalBlock(...)`
  - `toast(pedagogicalBlock.reason, 'warning')`
  - redirecionamento para `'/'` no strict
- Complementar UX:
  - Se `strict`, mostrar um texto que explique o que fazer agora:
    - “Vá para o Painel e escolha a missão recomendada” **ou**
    - “Desative o modo estrito em Ajustes” (com link/CTA).

> A mensagem deve ser curta e acionável (“Próximo passo”).

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] `settings` tem explicação clara e acessível dos modos (não só rótulo).
- [ ] Existe indicação de modo recomendado.
- [ ] No bloqueio (strict), usuário recebe orientação do próximo passo.
- [ ] Sem poluir a UI (explicação longa fica escondida por `<details>`).

---

## 🔗 DEPENDÊNCIAS

- Recomendada após: `DOCS/tasks/TASK-010_ux-navegacao-mobile-e-menu-ativo.md` (links/CTAs precisam funcionar no mobile).

---

## 🧪 COMO TESTAR

1. Abrir `/settings` e alternar entre modos.
2. Expandir “Saiba mais” e verificar coerência do texto.
3. Forçar um bloqueio (configurar strict e disparar `checkPedagogicalBlock` em `/study?topicId=...`).
4. Confirmar que o usuário entende o motivo e o próximo passo.

