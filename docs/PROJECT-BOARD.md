# Project Board — LES Backend API

> Atualizado em: 2 de abril de 2026  
> Status: Gestão local das atividades do projeto.

---

## Board Kanban

| 📛 Todo (2)                                 | 🔄 In Progress (0)              | ✅ Done (27)                                          |
| ------------------------------------------- | ------------------------------- | ----------------------------------------------------- |
| B13 · [BACKEND] Módulo de Carrinho          |                                 | B1 · [BACKEND] Setup Inicial e Arquitetura            |
| B14 · [BACKEND] Integração com Meio de Pgto |                                 | B2 · [BACKEND] Dockerização e Ambiente Dev            |
|                                             |                                 | B31 · [VENDAS] Sprint 2: Trocas e Devoluções          |
|                                             |                                 | B28 · [BACKEND] Módulo de Entrega e Logística         |
|                                             |                                 | B26 · [VENDAS] Sprint 1: Base de Vendas               |
|                                             |                                 | B3 · [BACKEND] Modelagem SQL e Normalização (14 tabs) |
|                                             |                                 | B7 · [BACKEND] Testes de Integração e Fluxo           |
|                                             |                                 | B27 · [BACKEND] Reorganização de Testes Unitários    |
|                                             |                                 | B8 · [BACKEND] Governança de Código e Linter          |
|                                             |                                 | B9 · [BACKEND] Isolamento de Testes e Teardown        |
|                                             |                                 | B10 · [BACKEND] Segurança de Identificadores (UUIDs)  |
|                                             |                                 | B12 · [BACKEND] Implementar API de Livros            |
|                                             |                                 | B15 · [BACKEND] Refino do CRUD de Clientes           |
|                                             |                                 | B16 · [BACKEND] CRUD de Endereços/Cartões            |
|                                             |                                 | B17 · [BACKEND] Consulta Administrativa              |
|                                             |                                 | B18 · [BACKEND] Testes Manuais CRUD Clientes         |
|                                             |                                 | B19 · [BACKEND] Correção Violações Segurança         |
|                                             |                                 | B20 · [BACKEND] Otimização de Disco Banco            |
|                                             |                                 | B21 · [BACKEND] Gestão de Administradores            |
|                                             |                                 | B22 · [BACKEND] Evolução de Papéis e Acesso Dual     |
|                                             |                                 | B23 · [BACKEND] Hashing de Senhas (BCrypt)           |
|                                             |                                 | B24 · [BACKEND] Mascaramento de Dados (Privacidade)  |
|                                             |                                 | B25 · [BACKEND] Banco de Teste Isolado e Middleware  |
|                                             |                                 | B29 · [BACKEND] Intenções de Pagamento Persistidas e Rastreio |
|                                             |                                 | B30 · [BACKEND] Módulo de Frete e Cotação (persistência + checkout) |

---

## Detalhamento dos Cards

| ID   | Área    | Card                                 | Status / Evidência                                                                                                                                                                                                                           |
| :--- | :------ | :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B31  | VENDAS  | Sprint 2: Trocas e Devoluções        | **Concluído (2026-04-12):** S2-A (solicitarTroca → status EM TROCA), S2-B (autorizarTroca → TROCA AUTORIZADA → confirmarRecebimento → CONCLUÍDA + cupom), S2-C (rejeitarTroca → TROCA REJEITADA), S2-D (prazo 7 dias a partir de `ven_data_hora_entrega`, migration 028). Eliminados hacks `(repo as any).db`; novo método `obterUsuarioIdInternoPorUuid` em `IRepositorioPagamentos`. 4 testes integração passando; zero regressões em 149 testes. **Testes E2E Cypress adicionados (2026-04-12):** `web/cypress/e2e/user/cliente/checkout/troca-cliente.cy.ts` (S2-A + S2-D, 6 cenários) e `web/cypress/e2e/user/admin/trocas/troca-admin.cy.ts` (S2-B + S2-C, 7 cenários). Fixtures em `web/cypress/fixtures/trocas/`. |
| B26  | VENDAS  | Sprint 1: Base de Vendas             | **Concluído:** Criada infraestrutura de vendas (Repositório, Serviço, Controlador, Rotas e Migração 010). Backend permite criar e consultar vendas. |
| B28  | BACKEND | Módulo de Entrega e Logística        | **Concluído:** Implementação do módulo (DTO, Repository, Service, Controller, Routes). Migration 013 para renomear tabelas; integração automática com alteração de status de venda para 'EM TRÂNSITO'. |
| B21  | BACKEND | Gestão de Administradores            | **Implementado:** CRUD completo de administradores (listagem, criação, inativação/ativação) com trava de segurança de auto-inativação. |
| B22  | BACKEND | Evolução de Papéis e Acesso Dual     | **Implementado:** Independência de registros por papel para o mesmo e-mail; opção de senha na promoção; extensão de papel (admin acessa cliente); perfil unificado (agregado); correção de bug de UUID em cartões. |
| B23  | BACKEND | Hashing de Senhas (BCrypt)           | **Implementado:** Substituição de senhas em texto puro por hashes BCrypt (custo 10). Inclui script de seed para reset de usuários de teste. |
| B24  | BACKEND | Mascaramento de Dados (Privacidade)  | **Implementado:** Mascaramento automático de CPF (`***.XXX.***-**`) e Telefone nas respostas da API de Perfil para conformidade com a LGPD. |
| B25  | BACKEND | Banco de Teste Isolado e Middleware  | **Implementado:** Infraestrutura isolada (porta 5433) e middleware dinâmico para troca de banco via header `x-use-test-db`. Centralização em `.env`. |

| B1   | BACKEND | Setup Inicial e Arquitetura          | Definir estrutura de módulos, injeção de dependência manual e padrões SOLID/DDD.                 |
| B2   | BACKEND | Dockerização e Ambiente Dev          | Criar Dockerfile multi-stage; configurar docker-compose com Node.js + Postgres + Redis; hot reload com ts-node-dev. |
| B3   | BACKEND | Modelagem SQL e Normalização         | Criar 14 tabelas normalizadas (DDR/DML); triggers de atualização; diagramas ER PlantUML.    |
| B4   | BACKEND | Infraestrutura de Repositórios PG    | Implementar Pool de conexões, Transações seguras e Repositórios para Usuários, Endereços, Perfis e Telefones.       |
| B5   | BACKEND | Auth com JWT (Bearer)                | **Implementado:** Sistema de autenticação completo com login seguro e proteção de rotas via middlewares (JWT no header Authorization). |
| B6   | BACKEND | Módulo de Usuários e Perfis          | **Implementado:** Gestão completa de perfis de clientes, incluindo cadastro inicial, edição, inativação e alteração de senha. |
| B7   | BACKEND | Testes de Integração e Fluxo         | **Implementado:** Cobertura abrangente de testes automatizados (25 testes passando) para validar fluxos de autenticação e clientes. |
| B8   | BACKEND | Governança de Código e Linter        | Configurar ESLint (Airbnb) e Prettier; proibir switch/case via AGENTS.md; comentários em Português.    |
| B9   | BACKEND | Isolamento de Testes e Teardown      | Garantir fechamento de handles TCP (Redis/PG) e isolamento entre testes usando TRUNCATE.          |
| B10  | BACKEND | Segurança de Identificadores (UUIDs) | Impedir exposição de IDs internos (BIGSERIAL); mapear para UUIDs públicos nas respostas e tokens.             |
| B11  | BACKEND | Gestão de Board e Documentação       | Implementar PROJECT-BOARD.md e alinhar skills com o padrão de governança do projeto.              |
| B12  | BACKEND | Implementar API de Livros            | Criar rota GET /livros; busca por parâmetros; filtros avançados; ordenação; paginação robusta.            |
| B13  | BACKEND | Módulo de Carrinho de Compras        | Manter estado do carrinho no Redis; sincronizar com banco se usuário logado; regras de estoque.                     |
| B14  | BACKEND | Integração com Meio de Pagamento     | **Próximo:** gateway real (Stripe etc.), webhooks. **Já parcial:** simulação com intenção em PostgreSQL, HMAC do segredo, TTL, vínculo venda/`pagamento.inp_id` (ver B29). |
| B29  | BACKEND | Intenções de Pagamento Persistidas e Rastreio | **Concluído (2026-04):** Tabelas `intencao_pagamento` (018), `pagamento.inp_id` (019); `SEGREDO_HMAC_INTENCAO` + `INTENCAO_PAGAMENTO_TTL_MINUTOS`; `PATCH /pagamentos/intencao-pagamento/:inpUuid/venda`; `POST /pagamento/processar` com `vendaUuid` opcional; testes em `pagamentos.integracao.test.ts`. Job em lote `EXPIRADA` opcional (método no repositório). |
| B30  | BACKEND | Módulo de Frete e Cotação (persistência + checkout) | **Concluído (2026-04):** Migração 020 (`cotacao_frete`, `cotacao_frete_simulada`, `vendas.cfr_id`); `POST /api/frete/cotar`; `ServicoFrete`, `FabricaProvedorFrete`, `ProvedorFreteSimulado` / `ProvedorFreteStubExterno`; `GET /api/pagamento/info` delega cotação; `ServicoVendas` valida total + `cotacaoUuid`; `ServicoEntrega` exige custo alinhado a `ven_frete`; env `PROVEDOR_FRETE`; testes `frete.integracao.test.ts`, `ProvedorFreteSimulado.spec.ts`. |
| B15  | BACKEND | Refino do CRUD de Clientes          | **Implementado:** Corrigidos gaps de validação (BCrypt custo 10), middlewares de autorização e segurança. |
| B16  | BACKEND | CRUD de Endereços e Cartões         | **Implementado:** CRUD completo de cartões tokenizados e endereços mascarados. Inclui inclusão, remoção e alteração de perfil. |
| B17  | BACKEND | Consulta Administrativa de Clientes | **Implementado:** Rota GET /api/clientes com filtros administrativos (nome, CPF, e-mail) e paginação para admins. |
| B18  | BACKEND | Testes Manuais CRUD Clientes        | **Implementado:** Testes completos via curl/http das rotas CRUD: registro; login JWT; perfil; cartões; inativação. |
| B19  | BACKEND | Correção Violações Segurança        | **Implementado:** Correção crítica de 4 violações: transporte seguro de JWT; remoção de IDs internos; switch/case por Record; privacidade de CPF. |
| B20  | BACKEND | Otimização de Disco Banco           | **Implementado:** Otimização de esquema reduzindo índices redundantes e redimensionando tipos VARCHAR. |
| B27 | BACKEND | Reorganização de Testes Unitários    | **Concluído:** Centralização de testes de Value Objects (`entrega` e `pagamentos`) em `src/tests/unitarios` para alinhar com a pirâmide de testes. |
| B21  | BACKEND | Gestão de Administradores            | **Implementado:** CRUD completo de administradores (listagem, criação, inativação/ativação) com trava de segurança de auto-inativação. |

---

> **Nota:** Este board é mantido localmente e serve como a fonte de verdade para o status das atividades de desenvolvimento do Backend.
