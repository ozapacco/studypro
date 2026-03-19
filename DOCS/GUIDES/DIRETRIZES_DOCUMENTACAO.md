# Diretrizes de Documentação para Desenvolvimento de Sistema

## Visão Geral

Este documento estabelece as diretrizes para documentação contínua do desenvolvimento do sistema. O objetivo é manter um registro claro e atualizado de todas as atividades, decisões e pendências, garantindo que nenhum contexto seja perdido ao longo do projeto.

## Responsabilidades

### OPENCODE (Agente de IA)

- Revisar e validar a documentação criada
- Fornecer feedback sobre precisão e completude
- Manter comunicação clara sobre prioridades e necessidades
riar documentos de progresso após cada sessão de trabalho
- Documentar todas as decisões técnicas e ajustes realizados
- Manter atualizado o registro de pendências e próximos passos
- Criar registos de alterações (changelogs) para cada componente modificado

### Kilocode (Usuário/Desenvolvedor)

- Revisar e validar a documentação criada
- Fornecer feedback sobre precisão e completude
- Manter comunicação clara sobre prioridades e necessidades
riar documentos de progresso após cada sessão de trabalho
- Documentar todas as decisões técnicas e ajustes realizados
- Manter atualizado o registro de pendências e próximos passos
- Criar registos de alterações (changelogs) para cada componente modificado

## Estrutura de Documentação

### 1. Documentos de Progresso (PROGRESSO\_\*.md)

Após cada sessão de trabalho, criar um documento com o seguinte formato:
DENTRO DA PASTA GUIDES
```
PROGRESSO_AAAAMM-DD_[breve-descricao].md
```

**Conteúdo obrigatório:**

- Data e hora da sessão
- Objetivos planejados para a sessão
- O que foi concluído
- O que foi ajustado (modificações de decisões anteriores)
- O que permanece pendente
- Decisões técnicas tomadas
- Problemas encontrados e soluções aplicadas
- Próximos passos planejados

### 2. Registro de Componentes (REGISTRO\_\*.md)

Para cada componente significativo do sistema, manter documentação atualizada:

- Nome e propósito do componente
- Arquivos relacionados
- Estado atual (em desenvolvimento, completo, pendente)
- Histórico de alterações
- Dependências e integrações

### 3. Controle de Pendências (PENDENCIAS.md)

Manter um documento central com todas as pendências do projeto:

- Lista priorizada de tarefas
- Status de cada item
- Data de criação e última atualização
- Responsable (OPENCODE ou Kilocode)
- Bloqueios e dependências

### 4. Registro de Decisões (DECISOES.md)

Documentar todas as decisões técnicas significativas:

- Problema considerado
- Opções avaliadas
- Decisão tomada
- Motivação e justificativa
- Data da decisão
- Revisões futuras necessárias

## Convenções de Nomenclatura

### Documentos de Sessão

```
PROGRESSO_YYYY-MM-DD_[tema].md
Exemplo: PROGRESSO_2026-03-18_autenticacao.md
```

### Documentos de Componente

```
COMPONENTE_[nome].md
Exemplo: COMPONENTE_auth.md
```

### Registros de Alteração

```
CHANGELOG_[componente].md
Exemplo: CHANGELOG_database.md
```

## Processo de Documentação

### Antes de Iniciar uma Tarefa

1. Verificar documentos existentes para entender contexto atual
2. Identificar se há pendências relacionadas à tarefa
3. Atualizar o documento de pendências se necessário

### Durante o Desenvolvimento

1. Registrar decisões técnicas no momento em que são tomadas
2. Documentar problemas encontrados imediatamente
3. Manter registro de arquivos modificados

### Ao Concluir uma Sessão

1. Criar documento de progresso detalhado
2. Atualizar registro de componentes afetados
3. Atualizar pendências com itens concluídos e próximos passos
4. Verificar se todas as decisões foram documentadas

### Manutenção Contínua

1. Revisar documentos semanalmente para garantir atualidade
2. Consolidar documentos obsoletos ou duplicados
3. Atualizar índices e referências cruzadas

## Conteúdo Obrigatório por Documento

### Documento de Progresso

```
# Progresso - [Data]

## Sessão
- Início: [hora]
- Fim: [hora]
- Duração: [minutos]

## Objetivos
- [ ] Objetivo 1
- [ ] Objetivo 2

## Concluído
- [Item 1]
- [Item 2]

## Ajustes Realizados
| Antes | Depois | Motivação |
|-------|--------|-----------|
| ...   | ...   | ...       |

## Pendências Identificadas
- [Pendencia 1]
- [Pendencia 2]

## Próximos Passos
1. [Próximo passo 1]
2. [Próximo passo 2]
```

### Registro de Componente

```
# [Nome do Componente]

## Descrição
[Descrição clara do propósito]

## Arquivos
- `caminho/arquivo1.js`
- `caminho/arquivo2.svelte`

## Estado
- [ ] Em desenvolvimento
- [x] Completo
- [ ] Pendente

## Histórico de Alterações
| Data | Alteração | Motivação |
|------|-----------|-----------|
| ...  | ...       | ...       |

## Dependências
- [Dependência 1]
- [Dependência 2]

## Integrações
- [Integração 1]
```

## Regras de Ouro

1. **Nada fica sem documentação**: Cada tarefa, decisão e alteração deve ser registrada.

2. **Sem surpresas**: O documento de progresso deve permitir que qualquer pessoa entenda o que foi feito sem precisar perguntar.

3. **Contexto sempre disponível**: Ao continuar um trabalho, o primeiro passo deve sempre ser revisar a documentação existente.

4. **Rastreabilidade**: Cada alteração deve poder ser rastreada até sua origem e justificativa.

5. **Atualização imediata**: Documentação não pode ficar defasada - atualizar no momento da ocorrência.

6. **Clareza sobre pendências**: O que falta fazer deve estar explícito e prioritizado.

## Integração com workflow

1. Ao iniciar conversa nova, OPENCODE deve primeiro verificar documentação existente
2. Ao apresentar resultados, incluir referência aos documentos relevantes
3. Ao propor novas tarefas, verificar pendências existentes primeiro
4. Ao identificar problemas, documentar antes de propor soluções

## Validação

Ao final de cada sessão, verificar se:

- [ ] Documento de progresso foi criado
- [ ] Pendências foram atualizadas
- [ ] Componentes afetados têm registro atualizado
- [ ] Decisões foram documentadas
- [ ] Próximos passos estão claros

---

**Última atualização**: [DATA]
**Próxima revisão**: Semanalmente
