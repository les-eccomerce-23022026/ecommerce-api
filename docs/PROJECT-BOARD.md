# Project Board — LES Backend API

> Atualizado em: 27 de abril de 2026  
> Status: Gestão local das atividades do projeto.

---

## Board Kanban

| 📛 Todo (0) | 🔄 In Progress (0) | ✅ Done (37) |
| --- | --- | --- |
|  |  | B14 · [BACKEND] Gateway Real (Stripe) |
|  |  | B2 · [BACKEND] Dockerização e Ambiente Dev |
|  |  | B3 · [BACKEND] Modelagem SQL e Normalização |
|  |  | B4 · [BACKEND] Infraestrutura de Repositórios PG |
|  |  | B13 · [BACKEND] Módulo de Carrinho |
|  |  | B5 · [BACKEND] Auth com JWT (Bearer) |
|  |  | B6 · [BACKEND] Módulo de Usuários e Perfis |
|  |  | B7 · [BACKEND] Testes de Integração e Fluxo |
|  |  | B8 · [BACKEND] Governança de Código e Linter |
|  |  | B9 · [BACKEND] Isolamento de Testes e Teardown |
|  |  | B10 · [BACKEND] Segurança de Identificadores (UUIDs) |
|  |  | B11 · [BACKEND] Gestão de Board e Documentação |
|  |  | B12 · [BACKEND] Implementar API de Livros |
|  |  | B14 · [BACKEND] Integração com Meio de Pgto (PIX) |
|  |  | B15 · [BACKEND] Refino do CRUD de Clientes |
|  |  | B16 · [BACKEND] CRUD de Endereços/Cartões |
|  |  | B17 · [BACKEND] Consulta Administrativa |
|  |  | B18 · [BACKEND] Testes Manuais CRUD Clientes |
|  |  | B19 · [BACKEND] Correção Violações Segurança |
|  |  | B20 · [BACKEND] Otimização de Disco Banco |
|  |  | B21 · [BACKEND] Gestão de Administradores |
|  |  | B22 · [BACKEND] Evolução de Papéis e Acesso Dual |
|  |  | B23 · [BACKEND] Hashing de Senhas (BCrypt) |
|  |  | B24 · [BACKEND] Mascaramento de Dados (Privacidade) |
|  |  | B25 · [BACKEND] Banco de Teste Isolado e Middleware |
|  |  | B26 · [VENDAS] Sprint 1: Base de Vendas |
|  |  | B27 · [BACKEND] Reorganização de Testes Unitários |
|  |  | B28 · [BACKEND] Módulo de Entrega e Logística |
|  |  | B29 · [BACKEND] Intenções de Pagamento Persistidas e Rastreio |
|  |  | B30 · [BACKEND] Módulo de Frete e Cotação (persistência + checkout) |
|  |  | B31 · [BACKEND] Modularização de Serviços (DDD) |
|  |  | B32 · [BACKEND] Validação de Roles em Vendas |
|  |  | B33 · [BACKEND] Módulo de Trocas e Devoluções |
|  |  | B34 · [BACKEND] Fortalecimento da Segurança |
|  |  | B35 · [BACKEND] Infraestrutura de Testes Avançada |
|  |  | B36 · [BACKEND] Schema `les` e Padrões Arquiteturais |
|  |  | B37 · [BACKEND] Sandbox de Falhas Determinística |

---

## Detalhamento dos Cards

| ID | Área | Card | Status / Evidência |
| :--- | :------ | :-------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1 | BACKEND | Setup Inicial e Arquitetura | Definir estrutura de módulos, injeção de dependência manual e padrões SOLID/DDD. |
| B2 | BACKEND | Dockerização e Ambiente Dev | Criar Dockerfile multi-stage; configurar docker-compose com Node.js + Postgres + Redis; hot reload com ts-node-dev. |
| B3 | BACKEND | Modelagem SQL e Normalização | Criar 14 tabelas normalizadas (DDR/DML); triggers de atualização; diagramas ER PlantUML. |
| B4 | BACKEND | Infraestrutura de Repositórios PG | Implementar Pool de conexões, Transações seguras e Repositórios para Usuários, Endereços, Perfis e Telefones. |
| B5 | BACKEND | Auth com JWT (Bearer) | Implementado: autenticação completa com login seguro e proteção de rotas. |
| B6 | BACKEND | Módulo de Usuários e Perfis | Implementado: cadastro, edição, inativação e alteração de senha. |
| B7 | BACKEND | Testes de Integração e Fluxo | Implementado: cobertura de testes para fluxos de autenticação e clientes. |
| B8 | BACKEND | Governança de Código e Linter | ESLint/Prettier, sem switch/case, comentários em Português. |
| B9 | BACKEND | Isolamento de Testes e Teardown | Fechamento de handles TCP e isolamento entre testes usando TRUNCATE. |
| B10 | BACKEND | Segurança de Identificadores (UUIDs) | Impedir exposição de IDs internos e mapear para UUIDs públicos. |
| B11 | BACKEND | Gestão de Board e Documentação | Implementar `PROJECT-BOARD.md` e alinhar skills de governança. |
| B12 | BACKEND | Implementar API de Livros | Rota GET `/livros` com busca, filtros, ordenação e paginação. |
| B13 | BACKEND | Módulo de Carrinho de Compras | Recuperação de vendas e conveniência com trava de estoque. |
| B14 | BACKEND | Integração com Meio de Pagamento | Habilitação de PIX para acelerar ciclo de caixa. |
| B15 | BACKEND | Refino do CRUD de Clientes | Correções de validação, autorização e segurança. |
| B16 | BACKEND | CRUD de Endereços e Cartões | CRUD completo de cartões tokenizados e endereços mascarados. |
| B17 | BACKEND | Consulta Administrativa de Clientes | Rota GET `/api/clientes` com filtros e paginação. |
| B18 | BACKEND | Testes Manuais CRUD Clientes | Testes completos via curl/http das rotas CRUD. |
| B19 | BACKEND | Correção Violações Segurança | Correções críticas de segurança e privacidade. |
| B20 | BACKEND | Otimização de Disco Banco | Otimização de esquema e índices redundantes. |
| B21 | BACKEND | Gestão de Administradores | CRUD completo de administradores com trava de auto-inativação. |
| B22 | BACKEND | Evolução de Papéis e Acesso Dual | Independência por papel e correções de promoção/acesso. |
| B23 | BACKEND | Hashing de Senhas (BCrypt) | Migração para hash BCrypt custo 10. |
| B24 | BACKEND | Mascaramento de Dados (Privacidade) | Máscara de CPF e telefone nas respostas da API. |
| B25 | BACKEND | Banco de Teste Isolado e Middleware | Ambiente isolado e middleware `x-use-test-db`. |
| B26 | VENDAS | Sprint 1: Base de Vendas | Infraestrutura de vendas concluída (repositório, serviço, controlador, rotas). |
| B27 | BACKEND | Reorganização de Testes Unitários | Centralização de testes de Value Objects em `src/tests/unitarios`. |
| B28 | BACKEND | Módulo de Entrega e Logística | Módulo completo de entrega/logística com integração automática. |
| B29 | BACKEND | Intenções de Pagamento Persistidas e Rastreio | Integridade financeira com travamento de valor e validação HMAC. |
| B30 | BACKEND | Módulo de Frete e Cotação | Alinhamento entre frete cotado e valor cobrado no checkout. |
| B31 | BACKEND | Modularização de Serviços (DDD) | Isolamento de responsabilidades para acelerar evolução. |
| B32 | BACKEND | Validação de Roles em Vendas | Proteção de privacidade e acesso autorizado a pedidos. |
| B33 | BACKEND | Módulo de Trocas e Devoluções | Fluxo de pós-venda de trocas para reduzir custo operacional. |
| B34 | BACKEND | Fortalecimento da Segurança | Medidas adicionais para proteção de dados sensíveis. |
| B35 | BACKEND | Infraestrutura de Testes Avançada | Base resiliente para prevenir regressões em produção. |
| B36 | BACKEND | Schema `les` e Padrões Arquiteturais | Organização patrimonial dos dados e padronização técnica. |
| B37 | BACKEND | Sandbox de Falhas Determinística | Gatilhos de falha determinística para testes E2E resilientes. |

---

> **Nota:** Este board é mantido localmente e serve como fonte de verdade do status das atividades do Backend.
