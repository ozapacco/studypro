# Task: Padronizar Nomenclatura PT-BR em Todo o App

## Metadata

- **Prioridade:** LOW
- **Complexidade:** Baixa
- **Tempo Estimado:** 2-3 horas
- **Arquivos Envolvidos:** Todo o codebase

## Problema Identificado

Inconsistências de nomenclatura: "materia" vs "Matéria", "card" vs "Cartão".

## Solução

Criar guia de estilo e aplicar consistentemente.

## Regras de Nomenclatura

| Contexto     | Termo                 | Evitar                  |
| ------------ | --------------------- | ----------------------- |
| UI Labels    | "Matéria"             | "materia", "Disciplina" |
| UI Labels    | "Card" ou "Cartão"    | "flashcard" (em PT)     |
| UI Labels    | "Tópico"              | "topico", "Assunto"     |
| Variáveis JS | `subject`, `subjects` | `materia`, `materias`   |
| Tabelas DB   | `subjects`            | `materias`              |
| Funções      | `createSubject()`     | `criarMateria()`        |
| Labels UI    | "Criar Matéria"       | "Adicionar materia"     |

## Checklist de Revisão

### src/routes/

- [ ] Labels em todos os botões
- [ ] Títulos de páginas
- [ ] Placeholders de inputs
- [ ] Mensagens de empty state
- [ ] Tooltips

### src/lib/stores/

- [ ] Nomes de funções em inglês (create, update, delete)
- [ ] Parâmetros em camelCase
- [ ] Comentários em PT ou EN

### src/lib/components/

- [ ] Props names em camelCase
- [ ] Events em camelCase

## Critérios de Aceitação

- [ ] Guia de estilo documentado
- [ ] Nenhuma inconsistência restante
- [ ] Labels capitalizados corretamente
