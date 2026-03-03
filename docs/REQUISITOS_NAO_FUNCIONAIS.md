# Requisitos Não-Funcionais (RNF)

Este documento registra todos os Requisitos Não-Funcionais do sistema. Toda **inclusão, alteração ou exclusão** de um RNF deve ser documentada aqui com data e justificativa.

> [!IMPORTANT]
> Ao adicionar ou alterar código que impacte um RNF, atualize o **Status** e o **Histórico** da entrada correspondente neste arquivo.

---

## Convenção de Identificadores

| Prefixo   | Categoria                              |
| --------- | -------------------------------------- |
| `RNF001x` | Segurança                              |
| `RNF002x` | Desempenho e Escalabilidade            |
| `RNF003x` | Disponibilidade e Confiabilidade       |
| `RNF004x` | Manutenibilidade e Qualidade de Código |
| `RNF005x` | Usabilidade e Acessibilidade           |
| `RNF006x` | Portabilidade e Infraestrutura         |
| `RNF007x` | Inteligência Artificial e Dados        |

---

## Legenda de Status

| Status       | Significado                                               |
| ------------ | --------------------------------------------------------- |
| ✅ Atendido  | Requisito completamente satisfeito na implementação atual |
| 🔄 Parcial   | Parcialmente atendido, com lacunas identificadas          |
| 📋 Planejado | Definido, aguardando implementação ou configuração        |
| ❌ Cancelado | Descartado com justificativa registrada                   |

---

## RNF001 — Segurança

| ID      | Descrição                                                                                                                                                                             | Origem        | Status       | Como é Garantido                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | ---------------------------------------------------------------------------------- |
| RNF0011 | O sistema deve usar **JWT com cookies `HttpOnly`, `Secure` e `SameSite=Strict`** para gerenciamento de sessão, impedindo acesso via JavaScript (XSS) e requisições cross-site (CSRF). | **Novo**          | ✅ Atendido  | Configurado em `auth.service.ts` — cookie gerado com todas as flags obrigatórias   |
| RNF0012 | **Senhas** devem ser armazenadas exclusivamente como hash **bcrypt** (fator de custo ≥ 12).                                                                                           | **Obrigatório**   | ✅ Atendido  | Aplicado em `clientes.service.ts` e `admin.service.ts` com `bcryptjs`              |
| RNF0013 | IDs internos do banco de dados (BIGSERIAL) **nunca** devem ser expostos nas respostas da API. Usar apenas UUIDs públicos.                                                             | **Obrigatório**   | ✅ Atendido  | Mapeamento em todos os repositórios; auditado no `CHANGES.md` entrada #28          |
| RNF0014 | O backend deve **validar internamente** todos os preços e quantidades, ignorando valores enviados pelo cliente.                                                                       | **Novo**          | 📋 Planejado | A ser implementado em `carrinho.service.ts` e `checkout.service.ts`                |
| RNF0015 | O sistema deve **sanitizar** inputs do usuário para prevenção de XSS e injeção SQL.                                                                                                   | **Novo**          | 📋 Planejado | Middleware de sanitização a ser desenvolvido em `shared/middlewares/`              |
| RNF0016 | **Números de cartão de crédito** não devem ser armazenados no sistema — usar apenas tokens do gateway de pagamento.                                                                   | **Novo**          | 📋 Planejado | A ser garantido na integração com o gateway                                        |
| RNF0017 | Variáveis de ambiente críticas (senhas, segredos, chaves) **não devem ter fallbacks** em código. O sistema deve lançar erro explícito se ausentes.                                    | **Novo**          | ✅ Atendido  | Implementado em `FabricaConexaoBanco` e `teste.setup.ts` — diretriz no `AGENTS.md` |
| RNF0018 | O sistema deve implementar **rate limiting** nas rotas de autenticação para mitigar ataques de força bruta.                                                                           | **Novo**          | 📋 Planejado | Middleware de rate limiting a ser desenvolvido em `shared/middlewares/`            |

---

## RNF002 — Desempenho e Escalabilidade

| ID      | Descrição                                                                                                              | Origem        | Status       | Como é Garantido                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | -------------------------------------------------------------------------------------- |
| RNF0021 | As respostas da API devem ter tempo médio inferior a **500ms** para operações de leitura simples (catálogo, perfil).   | **Obrigatório**   | 📋 Planejado | Indexação de colunas críticas definida nos DDLs; pool de conexões Postgres configurado |
| RNF0022 | O sistema deve usar **pool de conexões** com o banco de dados para evitar sobrecarga por reconexões.                   | **Novo**          | ✅ Atendido  | Implementado em `ConexaoPostgres.ts` com `pg.Pool`                                     |
| RNF0023 | Operações de listagem de catálogo (livros) devem suportar **paginação** para limitar o volume de dados por requisição. | **Novo**          | 📋 Planejado | A ser implementado no domínio `livros`                                                 |
| RNF0024 | O sistema deve implementar **cache** (Redis) para dados frequentemente consultados (catálogo, configurações).          | **Novo**          | 📋 Planejado | Infraestrutura Redis disponível via Docker; estratégia de cache a definir              |

---

## RNF003 — Disponibilidade e Confiabilidade

| ID      | Descrição                                                                                                                 | Origem        | Status       | Como é Garantido                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| RNF0031 | O sistema deve ter disponibilidade mínima de **99%** em ambiente de produção.                                             | **Novo**          | 📋 Planejado | A ser garantido via CI/CD e monitoramento (Railway/Render)                                            |
| RNF0032 | O sistema deve tratar **erros globalmente** retornando respostas JSON estruturadas (sem stack trace exposto em produção). | **Novo**          | 🔄 Parcial   | Middleware de erro global em `shared/middlewares/`; sem definição de body padrão em todos os cenários |
| RNF0033 | O banco de dados deve ter **backups automáticos** configurados no provedor de hospedagem.                                 | **Novo**          | 📋 Planejado | A ser configurado na plataforma Railway/Render                                                        |
| RNF0034 | Transações de **pedido, pagamento e estoque** devem ser atômicas (rollback em caso de falha parcial).                     | **Novo**          | 📋 Planejado | Uso de transações Postgres (`BEGIN`/`COMMIT`/`ROLLBACK`) nos services                                 |

---

## RNF004 — Manutenibilidade e Qualidade de Código

| ID      | Descrição                                                                                                                                  | Origem        | Status      | Como é Garantido                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ----------- | --------------------------------------------------------------------------------- |
| RNF0041 | O código deve seguir os princípios **SOLID** e **DDD** com separação clara de responsabilidades (Controller, Service, Repository, DTO).    | **Novo**          | ✅ Atendido | Definido na skill `architecture-patterns`; revisado em cada PR                    |
| RNF0042 | Todo o código (variáveis, funções, classes, comentários) deve ser escrito em **Português**.                                                | **Novo**          | ✅ Atendido | Definido na skill `coding-style`; violações identificadas via ESLint customizado  |
| RNF0043 | O projeto deve ter **cobertura de testes de integração** cobrindo os fluxos felizes e de falha dos domínios implementados.                 | **Novo**          | 🔄 Parcial  | Testes implementados para `auth`, `clientes` e `admin`; demais domínios pendentes |
| RNF0044 | O código deve passar em **linting (ESLint Airbnb + Security)** sem erros antes do commit (via Husky `pre-commit`).                         | **Novo**          | ✅ Atendido | Configurado em `.eslintrc`, `.husky/pre-commit` e `prettier.config.js`            |
| RNF0045 | É **proibido** o uso de `switch/case`. Usar tabelas de despacho (`Record<chave, função>`) ou polimorfismo.                                 | **Novo**          | ✅ Atendido | Diretriz definida na skill `coding-style` e no `AGENTS.md`                        |
| RNF0046 | Toda alteração de código deve ser **registrada** em `CHANGES.md`, planejada em `TASKS.md` e commitada com mensagem semântica em Português. | **Novo**          | ✅ Atendido | Processo documentado na skill `workflow-automation`                               |
| RNF0047 | As respostas HTTP da API devem seguir um **padrão consistente de estrutura JSON** (status, mensagem, dados).                               | **Novo**          | 🔄 Parcial  | Parcialmente padronizado; body de erro ainda inconsistente em alguns endpoints    |

---

## RNF005 — Usabilidade e Acessibilidade

| ID      | Descrição                                                                                                                              | Origem        | Status       | Como é Garantido                                                               |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | ------------------------------------------------------------------------------ |
| RNF0051 | O frontend deve ser **responsivo**, adaptando-se corretamente para dispositivos móveis e desktops.                                     | **Novo**          | 🔄 Parcial   | Layout base responsivo implementado; ajustes finais planejados (FE-7)          |
| RNF0052 | Mensagens de erro para o usuário devem ser **claras e em Português**, sem expor detalhes técnicos internos.                            | **Novo**          | 🔄 Parcial   | Parcialmente atendido nas telas de login e cadastro                            |
| RNF0053 | O sistema deve exibir **estados de loading** durante operações assíncronas (chamadas à API).                                           | **Novo**          | 🔄 Parcial   | Implementado nas telas de catálogo e carrinho; pendente em algumas telas admin |
| RNF0054 | O sistema deve permitir a **alteração de dados modulares** (como apenas adicionar endereço) sem exigir a edição do restante do perfil. | **Obrigatório**   | 📋 Planejado | Formulários modulares na tela de perfil do cliente                             |
| RNF0055 | O carrinho deve alertar sobre **itens retirados** por expiração de tempo, mantendo a opção de compra desabilitada até sua re-adição.   | **Obrigatório**   | 📋 Planejado | A ser implementado no controle do carrinho                                     |
| RNF0056 | O histórico de vendas no painel administrativo deve exibir resultados preferencialmente em um **gráfico de linhas**.                   | **Obrigatório**   | 📋 Planejado | A ser implementado no Dashboard do Admin usando biblioteca de gráficos         |

---

## RNF006 — Portabilidade e Infraestrutura

| ID      | Descrição                                                                                                      | Origem        | Status       | Como é Garantido                                            |
| ------- | -------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | ----------------------------------------------------------- |
| RNF0061 | O ambiente de desenvolvimento deve ser **containerizado via Docker Compose** (app + Postgres + Redis).         | **Novo**          | ✅ Atendido  | `docker-compose.yml` com serviços configurados e funcionais |
| RNF0062 | O projeto deve suportar **deploy contínuo** via GitHub Actions (CI/CD) com testes automáticos antes do deploy. | **Novo**          | 📋 Planejado | Pipeline CI/CD a ser configurado (DI-1)                     |
| RNF0063 | O backend deve rodar no ambiente **Node.js com módulo NodeNext e target ES2022**.                              | **Novo**          | ✅ Atendido  | Configurado em `tsconfig.json`                              |
| RNF0064 | O frontend deve ser **deployado na Vercel** e o backend no **Railway ou Render**.                              | **Novo**          | 📋 Planejado | Planejado para sprint de Deploy e Integração (DI-2)         |
| RNF0065 | O sistema deve incluir **scripts de implantação/seed** para popular registros de domínios (precificação, etc). | **Obrigatório**   | 📋 Planejado | A ser implementado em script automatizado                   |

---

## RNF007 — Inteligência Artificial e Dados

| ID      | Descrição                                                                                                                              | Origem        | Status       | Como é Garantido                                   |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | -------------------------------------------------- |
| RNF0071 | O sistema deve integrar **IA Generativa** para recomendações personalizadas baseadas no histórico do cliente e um chatbot para vendas. | **Obrigatório**   | 📋 Planejado | A ser implementado via integração com provedor LLM |

---

## Histórico de Alterações

| Data       | RNF              | Tipo      | Descrição                                                                  | Responsável |
| ---------- | ---------------- | --------- | -------------------------------------------------------------------------- | ----------- |
| 2026-02-26 | RNF0011, RNF0012 | Inclusão  | Segurança de autenticação implementada (JWT cookie, bcrypt)                | Equipe      |
| 2026-02-26 | RNF0013          | Inclusão  | Proibição de exposição de IDs internos implementada e auditada             | Equipe      |
| 2026-02-27 | RNF0017          | Inclusão  | Proibição de fallbacks em variáveis de ambiente implementada               | Equipe      |
| 2026-02-27 | RNF0022          | Inclusão  | Pool de conexões Postgres implementado em `ConexaoPostgres.ts`             | Equipe      |
| 2026-02-27 | RNF0045          | Inclusão  | Proibição de `switch/case` e exigência de tabelas de despacho implementada | Equipe      |
| 2026-02-27 | RNF0061          | Inclusão  | Docker Compose configurado com app, Postgres e Redis                       | Equipe      |
| 2026-03-03 | Todos            | Inclusão  | Documentação inicial completa dos RNFs extraída do contexto do projeto     | Agente      |
| 2026-03-03 | Vários           | Alteração | Inclusão de RNFs faltantes mapeados do doc original (uso de gráficos, IA)  | Agente      |
