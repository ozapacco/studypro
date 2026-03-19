# Análise da Dinâmica de Estudo — STUDEI 2.0 vs Sistemão
**Data:** 2026-03-18

---

## 🔍 O que o STUDEI 2.0 faz diferente

### A Dinâmica Completa de uma Sessão de Estudo no STUDEI 2.0

O coração do sistema é a [SessaoGuiada](file:///c:/Dev/Sistem%C3%A3o/index.html#3626-4476). Quando você clica em estudar um tópico, o fluxo é este:

```
[DASHBOARD]
     │
     ▼
🎯 Missão Diária → HERO item em destaque + fila visual de "próximos"
     │
     ▼
[Iniciar Tópico]
     │
     ├─ Se é REVISÃO e tem Bizus/Erros → ACTIVE RECALL SCREEN
     │       • Exibe o nome do tópico
     │       • Campo de texto ("o que você lembra?")  ← Blurting / Dumping
     │       • Conteúdo dos Bizus + Erros fica BORRADO (blur: 12px)
     │       • Timer conta esforço mental (+XP por segundo pensado)
     │       • Botão "Revelar": desborra o material
     │       └─ → startSession()
     │
     ├─ Se tem Bizus/Erros (mas não é revisão elegível) → RECALL CLÁSSICO
     │       • Ritual de Preparação (checkboxes: celular, água, foco)
     │       • Mostra Bizus linkados ao tópico
     │       • Mostra Erros anteriores linkados ao tópico
     │       │ (tudo visível, sem blur)
     │       └─ Botão "Li tudo e Cumpri o Ritual" → startSession()
     │
     └─ Sem material prévio → startSession() direto
               │
               ▼
         [SESSÃO ATIVA]
               │
               ├─ Timer cronômetro visível
               ├─ Informações do tópico (disciplina, ciclo atual)
               ├─ Pausa / Retomar
               ├─ +tempo manual
               └─ Formulário de finalização por tipo:
                       ├─ ESTUDO: checkbox "finalizei" + páginas estudadas
                       ├─ QUESTÕES: campo "certas/total" → valida ≥10 perguntas, ≥75%
                       ├─ REVISÃO: confirma leitura → avança ciclo
                       └─ BLITZ: 15min, ≥75% pula ciclo inteiro
               │
               ▼
         [RESULTADO / FEEDBACK]
               │
               ├─ APROVADO: avança status, agenda próxima revisão com SRS
               ├─ REPROVADO: regressão inteligente (proporcional ao acerto)
               └─ DOMÍNIO: 5 ciclos completos sem falha
```

---

## 💡 Os 5 Diferenciais Reais da Dinâmica

### 1. **Active Recall com Blur + Reveal** ← O mais poderoso
Antes de começar a revisão, o sistema exige que o aluno tente lembrar o conteúdo *antes* de ver o material. O Resumão fica desfocado. Só depois de "trabalhar mentalmente" o botão Revelar aparece.

> **Por que é superior:** Isso é *Retrieval Practice* puro — a técnica com maior evidência científica (>0.6 effect size). O Sistemão atual pula isso completamente e já mostra o card.

### 2. **Ritual de Preparação** (Bizus + Erros pré-voo)
Antes de começar a estudar um tópico que já tem histórico, o sistema mostra:
- Seus **Bizus** (macetes salvos): "o que eu marquei como importante da última vez"
- Seus **Erros anteriores**: "no que eu me enganei antes"

> **Por que é superior:** Contextualiza a sessão antes de começar. O aluno chega "aquecido" para o conteúdo. O Sistemão joga o card sem contexto histórico.

### 3. **Bloqueios de Fluxo Obrigatórios**
O sistema bloqueia ações incompatíveis com o estado do tópico:
- `aguardando-validacao` → só aceita `questoes`
- `revisao-N` → só aceita `revisao`
- Mostra modal explicando *por que* o bloqueio existe (pedagogia explícita)

> **Por que é superior:** Impede que o aluno "fique no conforto" e avance sem validar. O Sistemão permite fazer qualquer tipo de review a qualquer momento.

### 4. **Ciclo com Intervalo Forçado de 24h (Consolidação)**
Após o estudo inicial, o sistema marca o tópico como "resfriando" e só permite fazer questões no dia seguinte. Fundamentado em que o cérebro consolida memória durante o sono.

> **Por que é superior:** Garante que o aluno não faça questões "quentes" logo após ler (o que dá falsa sensação de aprendizado).

### 5. **Fila Visual da Missão Diária com HERO**
O dashboard não lista todos os tópicos — mostra 4 por dia com UX clara:
- Um **HERO item** em destaque com botão grande "▶ ESTUDAR"
- Uma fila de "próximos" em cards compactos
- Progresso do dia visível (2/4 concluídos)

> **Por que é superior:** O aluno nunca fica perdido sobre "o que fazer agora". O Sistemão atual não tem essa camada de direcionamento claro.

---

## 📊 Comparação Direta

| Dinâmica | STUDEI 2.0 | Sistemão Atual |
|----------|-----------|----------------|
| Active Recall (Blur/Reveal) | ✅ Blur + Timer de esforço | ❌ Não tem |
| Ritual Pré-Sessão (Bizus/Erros) | ✅ Obrigatório | ❌ Não tem |
| Bloqueio de fluxo forçado | ✅ Por status do tópico | ❌ Não tem |
| Intervalo de consolidação 24h | ✅ Após primeiro estudo | ❌ FSRS decide livremente |
| Missão Diária HERO + Fila | ✅ Dashboard principal | ⚠️ Sessão existe mas sem HERO |
| Timer de sessão visível | ✅ Com pausa | ✅ Tem |
| Feedback pós-sessão explicado | ✅ Pedagógico com coach | ⚠️ Parcial |
| SRS adaptativo | ⚠️ Básico (Ebbinghaus manual) | ✅ FSRS completo |
| Algoritmo de prioridade | ✅ Urgência × Peso × Incidência | ✅ Partial |
| Interleaving por disciplina | ✅ Round-robin | ⚠️ Não explícito |

---

## 🎯 O que Precisa Ser Implementado no Sistemão

Em ordem de prioridade e impacto:

### 🔴 Alta Prioridade (Dinâmica core)

1. **Active Recall Screen** — Antes de iniciar uma revisão, mostrar tela de "o que você lembra?" com blur no conteúdo. Revelar após tentativa.

2. **Missão Diária com HERO** — Dashboard com 4-6 tópicos priorizados, 1 em destaque com botão grande, fila visual dos próximos.

3. **Ritual Pré-Sessão com Bizus/Erros** — Antes de qualquer revisão, mostrar histórico relevante do tópico (erros e macetes).

### 🟡 Média Prioridade

4. **Bloqueios de fluxo com feedback pedagógico** — Impedir sequência de carta errada, explicar o porquê.

5. **Caderno de Bizus/Erros** — Infraestrutura para salvar Bizus e Erros por tópico (alimenta o ritual pré-sessão).

### 🟢 Baixa Prioridade

6. **Timer de sessão com pausa visível** — Já existe parcialmente, melhorar UX.

7. **Blitz Mode** — Sessão express de 15 min para pular ciclo.

---

## Decisão para Validação

Antes de implementar, precisa de aprovação nas seguintes escolhas de design:

1. O **Active Recall (Blur/Reveal)** deve ser **obrigatório** ou **opcional** (toggle pelo usuário)?
2. O ciclo de **consolidação de 24h** deve ser aplicado mesmo que o FSRS diga para revisar antes? (ex: FSRS diz revisar hoje mas aluno acabou de estudar há 2h)
3. A **Missão Diária** deve substituir ou complementar a tela de sessão atual?
