# TASK-019 — Glossário leve (FSRS/ROI/Domínio/etc.)

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-019 |
| **Data de criação** | 2026-03-19 |
| **Categoria** | `PEDAGÓGICO` · `UX` |
| **Prioridade** | 🟢 P2 — Evolutivo |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 2h 30min |

---

## 🎯 OBJETIVO

Reduzir carga cognitiva sem poluir a UI, criando um glossário “just-in-time” para termos avançados (FSRS, retenção, ROI score, domínio, suspenso/enterrado).

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual:**
- Termos avançados aparecem em Settings/Stats/Edital/Study sem definição.
- Iniciante interpreta errado ou evita mexer.

**Comportamento esperado:**
- Ícone/ação “O que é isso?” abre explicação curta (2–3 linhas) + bullets.
- Conteúdo deve ser consistente com o comportamento real do sistema.

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação | Observação |
|---|---|---|
| `src/lib/components/common/HelpDetails.svelte` | `CRIAR` | Componente leve via `<details>` |
| `src/routes/settings/+page.svelte` | `ALTERAR` | Inserir glossário em FSRS/Tutor |
| `src/routes/stats/+page.svelte` | `ALTERAR` | Inserir em ROI/urgência |
| `src/routes/edital/+page.svelte` | `ALTERAR` | Inserir em domínio/cobertura |
| `src/routes/cards/+page.svelte` | `ALTERAR` | Inserir em “suspenso/enterrado” (onde aparecer) |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Criar `HelpDetails.svelte`

**Arquivo:** `src/lib/components/common/HelpDetails.svelte`

**O que fazer:**
- Um wrapper acessível com `<details>` / `<summary>`:
  - summary curto: “O que é isso?”
  - slot para conteúdo (texto + bullets)
- Estilos discretos (não “gritar” na UI).

---

### Passo 2 — Inserir nos pontos de maior confusão

**Arquivos:** rotas listadas acima

**O que fazer:**
1. Escolher 6–10 termos máximos para primeira versão.
2. Em cada tela, colocar o help próximo do termo (não no rodapé).
3. Texto padrão (direção):
   - **FSRS**: “Modelo de repetição espaçada que ajusta o intervalo com base na sua lembrança.”
   - **Retenção**: “Probabilidade alvo de lembrar no próximo review.”
   - **ROI score**: “Prioriza o que dá mais ganho por minuto (não é nota).”
   - **Domínio**: “Cobertura + consistência do edital, não é só acerto.”
   - **Suspenso**: “Não entra na fila até você reativar.”
   - **Enterrado**: “Adiado temporariamente para reduzir repetição.”

> Ajustar textos conforme lógica real do sistema.

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Glossário aparece apenas onde necessário (sem poluição).
- [ ] Conteúdo é curto e acionável (não vira aula longa).
- [ ] Acessível por teclado.
- [ ] Consistente com regras reais do engine.

---

## 🔗 DEPENDÊNCIAS

- Recomendada após: `DOCS/tasks/TASK-013_pedagogico-explicar-modos-tutor.md`.
- Recomendada com: `DOCS/tasks/TASK-020_ux-hub-ajuda-primeiros-passos.md` (para leitura mais longa, linkar para o hub).

---

## 🧪 COMO TESTAR

1. Abrir `/settings`, `/stats`, `/edital` e expandir o help.
2. Verificar:
   - navegação por teclado
   - conteúdo não quebra layout mobile

