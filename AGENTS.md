# Projeto: E-Commerce de Livros (LES) - Diretrizes e Arquitetura

Este documento estabelece as diretrizes obrigatórias para o desenvolvimento do projeto. Todos os agentes e desenvolvedores devem seguir rigorosamente estes padrões para garantir a consistência, manutenibilidade e qualidade do software.

## 1. Stack Tecnológica e Restrições
### 1.1 Tecnologias Base
- **Linguagem:** JavaScript (Node.js).
- **Servidor/Roteamento:** Express.js.

### 1.2 Limitações de Frameworks
- **Core do Projeto:** É proibido o uso de frameworks de front-end (como React, Vue ou Angular) ou frameworks de back-end "pesados" que automatizem o core do negócio (como NestJS ou Spring Boot) para a realização deste laboratório.
- **Desenvolvimento:** O projeto deve ser focado na implementação manual dos padrões de projeto e engenharia de software solicitados na disciplina.

## 2. Padrões de Arquitetura e Design
### 2.1 Princípios Fundamentais
- **SOLID:** Aplicação rigorosa dos cinco princípios SOLID.
- **DDD (Domain-Driven Design):** O projeto deve ser orientado ao domínio, garantindo que a lógica de negócio esteja isolada e bem definida.
- **Design Patterns:** Utilização de padrões somente quando for adequado usar no projeto para resolver problemas comuns de design (Command, Strategy, Factory, etc., conforme a necessidade do LES).

### 2.2 Organização de Código
- **Estruturação por Domínio:** O código deve ser organizado em pastas que representem os domínios do sistema (ex: `cliente`, `livro`, `venda`).
- **Camadas de Responsabilidade:** Cada arquivo deve ter uma única responsabilidade clara:
  - **Controller:** Tratamento de requisições e respostas.
  - **Service:** Orquestração da lógica de negócio.
  - **DTO (Data Transfer Object):** Estrutura de dados para tráfego entre camadas.
  - **Repository:** Interface/Implementação de persistência de dados.

## 3. Padrões de Implementação
### 3.1 Idioma e Nomenclatura
- **Idioma:** Todo o código — incluindo nomes de variáveis, funções, classes, arquivos e comentários — deve ser escrito em **Português**.
- **Nomenclatura:** Nomes devem ser descritivos, específicos ao contexto e seguir as convenções de cada camada (ex: `CadastrarLivroService`, `UsuarioController`).
  - Funções/métodos: nomes verbais no infinitivo ou presente (`calcularTotalPedido`, `validarCpfCliente`).
  - Variáveis/atributos: nomes substantivos claros (`quantidadeItens`, `precoUnitario`, `clienteEncontrado`).
  - Evitar abreviações não óbvias, siglas ambíguas e nomes genéricos como `data`, `info`, `temp`, `obj`.

### 3.2 Estilo de Código e Melhores Práticas
- **Early Returns:** Priorize o uso de retornos antecipados para reduzir a complexidade ciclomática.
  - Evite cadeias profundas de `if/else if/else`. Prefira *guard clauses* no início da função para tratar casos inválidos ou de borda.
  - Quando apropriado, prefira polimorfismo, padrões de projeto (Strategy, Command, etc.) ou tabelas de decisão em vez de múltiplos `if/else`.
- **Decomposição de Funções:** Funções devem ser pequenas e realizar apenas uma tarefa.
  - Extrair trechos de lógica complexa para funções auxiliares nomeadas de forma clara.
  - Evitar funções com muitas responsabilidades ou muitos parâmetros.
- **Manipulação de Dados:** Manipule e retorne sempre **Objetos Estruturados**. Nunca retorne representações em string de arrays ou dados sem estrutura clara.
- **Tipagem Documentada:** Utilize JSDoc para documentar as assinaturas de funções, tipos de parâmetros e retornos esperados.
- **Legibilidade e Manutenibilidade:** O código deve priorizar a clareza sobre “esperteza”.
  - Prefira soluções simples, explícitas e alinhadas aos princípios **SOLID**.
  - Evite otimizações prematuras; otimize apenas com evidência (métricas, perfis).
  - Comente apenas o que não é óbvio pelo próprio código (decisões, regras de negócio, trade-offs).

### 3.3 Convenções de Commits Git
- **Idioma dos commits:** As mensagens de commit devem ser escritas em **Português**, de forma clara e objetiva.
- **Formato recomendado:**
  - `tipo: descrição resumida da mudança`
  - Exemplos de `tipo`: `feat` (nova funcionalidade), `fix` (correção de bug), `refactor` (refatoração sem mudança de comportamento), `chore` (tarefas de manutenção), `docs` (documentação), `test` (testes), `style` (ajustes de estilo sem impacto funcional).
  - Exemplos:
    - `feat: adicionar cadastro de cliente`
    - `fix: corrigir cálculo de frete para região sul`
    - `refactor: simplificar validação de CPF`
- **Boa prática:** Cada commit deve representar uma unidade lógica de mudança, pequena e coesa, facilitando a leitura do histórico e a revisão de código.

### 3.4 Registro de mudanças (CHANGES.md)

- **Obrigatoriedade:** Toda alteração, inclusão ou exclusão feita no projeto deve ser listada no arquivo **`CHANGES.md`** na raiz do repositório.
- **Conteúdo de cada entrada:** Mensagem resumida do que foi (ou será) feito.
- **Identificação:** Cada entrada deve ser **enumerada** e identificada por **data, hora, minutos e segundos** no formato `[AAAAMMDD-HHMMSS]` (ex.: `[20250226-143045]`).
- **Ordem:** As entradas devem ser ordenadas da mais recente para a mais antiga (a mais nova no topo do arquivo).
- **Exemplo de formato:**
  - `[20250226-143045] 1. Resumo da alteração feita no módulo X.`
  - `[20250226-120000] 2. Inclusão do arquivo Y para Z.`

### 3.5 Planejamento de tarefas (TASKS.md)

- **Obrigatoriedade:** Toda alteração, inclusão ou exclusão deve ser **planejada** em tarefas relevantes no arquivo **`TASKS.md`** na raiz do repositório, antes da implementação e dos commits.
- **Objetivo:** Servir como referência para sequenciar o trabalho e para associar cada commit a uma tarefa enumerada.
- **Formato:** Cada tarefa deve ser **enumerada em sequência** (1, 2, 3, …), com descrição resumida e, quando aplicável, indicação de tipo (alteração, inclusão, exclusão).
- **Uso:** Consultar `TASKS.md` ao planejar e ao commitar; manter a lista atualizada (marcar concluídas ou mover para histórico conforme o fluxo do projeto).


## 4. Segurança e Infraestrutura
### 4.1 Ambiente de Execução
- **Segurança:** Todas as operações devem ser validadas e protegidas contra falhas comuns de segurança.
- **Infraestrutura:** O desenvolvimento deve respeitar os limites operacionais do ambiente (ex: Oracle Cloud Free Tier), garantindo que a solução não comprometa a integridade ou exceda custos.

## 5. Configuração do Ambiente & Ferramentas

### 5.1 TypeScript
- **Compilador (`tsconfig.json`):**
  - `strict: true`
  - `target: ES2022`
  - `module: NodeNext`
  - `moduleResolution: NodeNext`
  - `skipLibCheck: true`
  - `forceConsistentCasingInFileNames: true`
- **Aliases de caminho (`paths`):**
  - `@/* → src/*`

### 5.2 Scripts npm principais
- **`dev`**: `ts-node-dev` + `tsconfig-paths`
- **`build`**: `tsc && tsc-alias`
- **`start`**: `node dist/server.js`

### 5.3 Linter, Formatter e Hooks
- **ESLint**:
  - Extensões: `airbnb-base`, `security`, `prettier`
- **Prettier** para formatação consistente.
- **Husky + lint-staged**:
  - Hook `pre-commit` deve executar lint e formatação nos arquivos alterados.
- **EditorConfig + VS Code**:
  - `formatOnSave` habilitado.
  - `editor.codeActionsOnSave` com `source.fixAll.eslint`.

## 6. Estrutura de Pastas (por domínio – flat)

Toda a organização de código de aplicação deve seguir uma estrutura por domínio, mantendo as responsabilidades bem separadas.

- **`src/`**
  - **`modules/`**
    - **`[domínio]/`**
      - `[domínio].controller.ts`        ← controllers HTTP/REST
      - `[domínio].service.ts`           ← orquestração da lógica de negócio
      - `[domínio].repository.ts`        ← interface/implementação de persistência
      - `[domínio].dto.ts`               ← DTOs + Value Objects + tipos
      - `[domínio].routes.ts`            ← definição de rotas
      - `index.ts` (opcional – barrel)
  - **`shared/`**
    - `infrastructure/`                 ← conexões, clients (db, cache, queue…)
    - `middlewares/`
    - `errors/`
    - `utils/`                          ← funções utilitárias puras
