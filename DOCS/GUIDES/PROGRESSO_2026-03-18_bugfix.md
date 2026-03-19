# Progresso - 2026-03-18 (Bugfix)

## Sessão

- **Início:** ~15:28
- **Fim:** ~15:32
- **Duração:** ~4 minutos

## Bugs Reportados

### BUG-001: Botão "Estudar" causa loading infinito

**Sintoma:** Ao clicar em "Estudar" na página de domínio do edital (SubjectDrilldown), a página ficava num estado de carregamento sem resolução.

**Causa Raiz:** O botão passava `subject.id` como parâmetro `topicId` na URL (`/study?topicId=X`). A página de estudo (`study/+page.svelte`) faz `db.topics.get(topicIdNum)` — buscando um tópico pelo ID de matéria, que não existe. Resultado: `topic` fica `null` e o PreVoo nunca aparece, mas o loading também não resolve.

**Correção:**

- No `onMount`, calcular `bestTopicId` — o primeiro tópico da matéria ordenado por importância (`importance` descendente)
- Botão "Estudar" agora redireciona para `/study?topicId=${bestTopicId}`
- Se a matéria não tiver tópicos, o botão não é renderizado

**Arquivo:** `src/lib/components/edital/SubjectDrilldown.svelte`

---

### BUG-002: Erro "Cannot read clipboard — this model does not support image input"

**Sintoma:** Ao colar conteúdo em campos de texto do sistema, o usuário recebia erro relacionado ao clipboard.

**Causa Raiz:** O erro vem do sistema AI (opencode) que tenta usar o clipboard do browser para processamento de imagem. Não é um bug do código da aplicação.

**Correção (preventiva):**

- Adicionado `on:paste` handler no `<textarea>` do TopicNotes
- Intercepta paste events e verifica se há items de imagem na clipboard
- Se houver imagem, `preventDefault()` + alerta "Colagem de imagem não é permitida"

**Arquivo:** `src/lib/components/study/TopicNotes.svelte`

---

## Resultado

- Build: ✅ OK
- Testes: ✅ 46/46 passando
- Bug BUG-001: ✅ Corrigido
- Bug BUG-002: ✅ Protegido
