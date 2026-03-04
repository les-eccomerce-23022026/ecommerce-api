# Project Board — LES Backend API

> Atualizado em: 4 de março de 2026  
> Status: Gestão local das atividades do projeto.

---

## Board Kanban

| 📋 Todo (3)                                 | 🔄 In Progress (1)              | ✅ Done (10)                                          |
| ------------------------------------------- | ------------------------------- | ----------------------------------------------------- |
| B12 · [BACKEND] Implementar API de Livros   | B11 · [BACKEND] Gestão de Board | B1 · [BACKEND] Setup Inicial e Arquitetura            |
| B13 · [BACKEND] Módulo de Carrinho          |                                 | B2 · [BACKEND] Dockerização e Ambiente Dev            |
| B14 · [BACKEND] Integração com Meio de Pgto |                                 | B3 · [BACKEND] Modelagem SQL e Normalização (14 tabs) |
|                                             |                                 | B4 · [BACKEND] Infraestrutura de Repositórios PG      |
|                                             |                                 | B5 · [BACKEND] Auth com JWT e Cookies HttpOnly        |
|                                             |                                 | B6 · [BACKEND] Módulo de Usuários e Perfis            |
|                                             |                                 | B7 · [BACKEND] Testes de Integração e Fluxo           |
|                                             |                                 | B8 · [BACKEND] Governança de Código e Linter          |
|                                             |                                 | B9 · [BACKEND] Isolamento de Testes e Teardown        |
|                                             |                                 | B10 · [BACKEND] Segurança de Identificadores (UUIDs)  |

---

## Detalhamento dos Cards

| Card | Tipo    | Título                               | Tarefas / Descrição                                                                                                 |
| ---- | ------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| B1   | BACKEND | Setup Inicial e Arquitetura          | Definir estrutura de módulos, injeção de dependência manual (Inversify/Manual) e padrões SOLID/DDD.                 |
| B2   | BACKEND | Dockerização e Ambiente Dev          | Criar Dockerfile multi-stage; configurar docker-compose com Node.js + Postgres + Redis; hot reload com ts-node-dev. |
| B3   | BACKEND | Modelagem SQL e Normalização         | Criar 14 tabelas normalizadas (DDR/DML); triggers de atualização; diagramas ER PlantUML; convenção de trigramas.    |
| B4   | BACKEND | Infraestrutura de Repositórios PG    | Implementar Pool de conexões, Transações seguras e Repositórios para Usuários, Endereços, Perfis e Telefones.       |
| B5   | BACKEND | Auth com JWT e Cookies HttpOnly      | Implementar login, geração de token, middlewares de autenticação e autorização (admin-only) com cookies seguros.    |
| B6   | BACKEND | Módulo de Usuários e Perfis          | CRUD de clientes, inativação (soft delete), alteração de senha e gestão de perfis extensíveis.                      |
| B7   | BACKEND | Testes de Integração e Fluxo         | Configurar Jest + Supertest; testes atomizados por rota e testes de fuxo E2E (auth → cadastro → edição).            |
| B8   | BACKEND | Governança de Código e Linter        | Configurar ESLint (Airbnb) e Prettier; proibir switch/case via AGENTS.md; comentários obrigatórios em Português.    |
| B9   | BACKEND | Isolamento de Testes e Teardown      | Garantir fechamento de handles TCP (Redis/PG) e isolamento entre testes usando BEGIN/ROLLBACK ou TRUNCATE.          |
| B10  | BACKEND | Segurança de Identificadores (UUIDs) | Impedir exposição de IDs internos (BIGSERIAL); mapear para UUIDs públicos nas respostas e payloads JWT.             |
| B11  | BACKEND | Gestão de Board e Documentação       | Implementar PROJECT-BOARD.md e alinhar skills com o padrão de governança do projeto (cross-repo sync).              |
| B12  | BACKEND | Implementar API de Livros            | Criar rota GET /livros; busca por parâmetros; filtros avançados; ordenação; paginação robusta via banco.            |
| B13  | BACKEND | Módulo de Carrinho de Compras        | Manter estado do carrinho no Redis; sincronizar com banco se usuário logado; regras de estoque.                     |
| B14  | BACKEND | Integração com Meio de Pagamento     | Simular ou integrar gateway; validação de dados de cartão (sem salvar no BD); webhook de confirmação.               |

---

> **Nota:** Este board é mantido localmente e serve como a fonte de verdade para o status das atividades de desenvolvimento do Backend.
