---
description: Identifica e executa subtarefas em paralelo usando worktrees do Windsurf Cascade
metadata:
  neural_context:
    triggers:
      - "paralelo"
      - "simultâneo"
      - "ao mesmo tempo"
      - "worktree"
      - "branch separado"
    priority: high
  dependencies:
    - architecture-patterns
    - coding-style
---

# Skill: Parallel Execution com Worktrees

## Objetivo
Identificar automaticamente subtarefas independentes que podem ser executadas em paralelo usando worktrees do Windsurf Cascade, antecipando problemas e otimizando o desenvolvimento.

## Quando Usar
- Tarefas complexas com múltiplas subtarefas
- Refatorações que podem ser divididas
- Features que envolvem múltiplos módulos
- Quando solicitado explicitamente execução paralela

## Processo de Identificação de Paralelismo

### 1. Análise da Tarefa
Ao receber uma tarefa, siga este processo:

```
1. Liste todas as subtarefas necessárias
2. Identifique dependências entre subtarefas
3. Separe em:
   - Subtarefas independentes (podem rodar em paralelo)
   - Subtarefas dependentes (devem rodar sequencialmente)
4. Para cada subtarefa independente:
   - Liste arquivos/contexto necessário
   - Identifique testes necessários
   - Liste possíveis riscos
```

### 2. Estrutura de Prompt para Paralelismo

Use este template quando identificar paralelismo:

```
Esta tarefa pode ser dividida em subtarefas independentes:

SUBTAREFAS INDEPENDENTES (executar em paralelo):
1. [Descrição] - Contexto: @arquivos - Riscos: [lista]
2. [Descrição] - Contexto: @arquivos - Riscos: [lista]
3. [Descrição] - Contexto: @arquivos - Riscos: [lista]

SUBTAREFAS DEPENDENTES (executar sequencialmente):
1. [Descrição] - Depende de: [subtarefas anteriores]
2. [Descrição] - Depende de: [subtarefas anteriores]

SUGESTÃO DE EXECUÇÃO:
- Use worktrees separados para cada subtarefa independente
- Nomeie worktrees com: [feature]-[subtarefa]
- Execute testes unitários em cada worktree
- Merge após conclusão de todas as subtarefas
- Execute testes de integração no merge

ANTICIPAÇÃO DE PROBLEMAS:
- Possíveis conflitos de merge: [lista]
- Dependências que podem quebrar: [lista]
- Refatorizações preventivas necessárias: [lista]
```

### 3. Uso de Worktrees

Para cada subtarefa independente:

```
1. Ative "Worktree" mode no Cascade (canto inferior direito)
2. Cascade criará worktree isolado automaticamente
3. Implemente a subtarefa no worktree
4. Execute testes unitários
5. Documente mudanças
6. Após concluir, clique em "merge" para integrar
```

### 4. Hooks de Configuração

Se necessário, use o hook `post_setup_worktree` para configurar arquivos:

```json
{
  "post_setup_worktree": {
    "command": "cp $ROOT_WORKSPACE_PATH/.env . && npm install",
    "description": "Copia .env e instala dependências no worktree"
  }
}
```

## Antecipação de Problemas

### Checklist de Riscos
Antes de executar em paralelo, verifique:

- **Conflitos de Merge:**
  - Mesmos arquivos sendo modificados
  - Mesmas funções sendo alteradas
  - Configurações compartilhadas

- **Dependências:**
  - Módulos que dependem de mudanças em outros
  - Interfaces que estão sendo alteradas
  - Schemas de banco de dados em migração

- **Refatorizações Preventivas:**
  - Código compartilhado que precisa ser extraído
  - Interfaces que precisam ser estabilizadas
  - Configurações que precisam ser centralizadas

### Estratégias de Mitigação

```
Para conflitos de merge:
- Extrair código compartilhado em módulos separados
- Definir interfaces claras entre módulos
- Usar feature flags para mudanças breaking

Para dependências:
- Identificar dependências críticas primeiro
- Criar contratos/interfaces estáveis
- Usar versionamento de APIs

Para refatorizações:
- Executar refatorações antes de paralelizar
- Criar skills de refatoração reutilizáveis
- Documentar padrões de refatoração
```

## Exemplos Práticos

### Exemplo 1: API de Cupons

```
Tarefa: Implementar sistema de cupons de desconto

Análise:
Subtarefas independentes:
1. Backend: API endpoints de cupoms
   - Contexto: @src/modules/cupoms @src/shared
   - Riscos: Validação de regras de negócio
2. Backend: Validação e regras de negócio
   - Contexto: @src/modules/cupoms @documentacao-exigida/REGRAS-NEGOCIOS.md
   - Riscos: Lógica complexa de desconto
3. Frontend: Formulário de aplicação
   - Contexto: @web/src/components @web/src/hooks
   - Riscos: UX de formulário
4. Frontend: Listagem de cupons ativos
   - Contexto: @web/src/pages @web/src/services
   - Riscos: Performance de listagem
5. Testes: E2E completos
   - Contexto: @backend/bdd @web/cypress
   - Riscos: Flaky tests

Subtarefas dependentes:
1. Testes de integração (depende de 1, 2, 3, 4)
2. Documentação (depende de todas)

Execução:
- Worktree 1: backend-cupoms-api
- Worktree 2: backend-cupoms-regras
- Worktree 3: frontend-cupoms-form
- Worktree 4: frontend-cupoms-lista
- Worktree 5: testes-cupoms-e2e
```

### Exemplo 2: Refatoração de Autenticação

```
Tarefa: Refatorar módulo de autenticação

Análise:
Subtarefas independentes:
1. Backend: Refatorar endpoints de autenticação
   - Contexto: @src/modules/auth @src/shared
   - Riscos: Breaking changes na API
2. Backend: Adicionar validações
   - Contexto: @src/modules/auth @.agents/skills/backend-security
   - Riscos: Validações muito restritivas
3. Frontend: Atualizar componentes React
   - Contexto: @web/src/components @web/src/hooks
   - Riscos: UX de autenticação
4. Frontend: Melhorar UX
   - Contexto: @web/src/components @.agents/skills/frontend-ui-ux
   - Riscos: Mudanças drásticas na UX
5. Docs: Atualizar documentação API
   - Contexto: @documentacao-exigida @docs
   - Riscos: Documentação desatualizada
6. Security: Review de segurança
   - Contexto: @.agents/skills/backend-security @src/modules/auth
   - Riscos: Vulnerabilidades não identificadas

Subtarefas dependentes:
1. Testes E2E (depende de 1, 2, 3, 4)
2. ADR (depende de todas)

Execução:
- Worktree 1: auth-endpoints
- Worktree 2: auth-validations
- Worktree 3: auth-components
- Worktree 4: auth-ux
- Worktree 5: auth-docs
- Worktree 6: auth-security
```

## Integração com Workflows

Esta skill pode ser invocada automaticamente por workflows como:
- `/backend-feature` - para novas features backend
- `/frontend-feature` - para novas features frontend

## Verificação Final

Antes de considerar completa a execução paralela:

1. **Merge de Worktrees:**
   - Todos os worktrees foram mergeados?
   - Não há conflitos pendentes?

2. **Testes:**
   - Testes unitários passaram em cada worktree?
   - Testes de integração passaram após merge?
   - Testes E2E passaram?

3. **Documentação:**
   - ADR criado se aplicável?
   - Documentação atualizada?
   - PROJECT-BOARD atualizado?

4. **Qualidade:**
   - Lint passou?
   - Código segue padrões do projeto?
   - Nomenclatura em Português?
