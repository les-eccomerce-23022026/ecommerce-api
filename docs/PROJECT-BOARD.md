# Project Board — LES Backend API

> Atualizado em: 4 de março de 2026  
> Status: Gestão local das atividades do projeto.

---

## Board Kanban

| 📋 Todo (3)                                 | 🔄 In Progress (1)              | ✅ Done (15)                                          |
| ------------------------------------------- | ------------------------------- | ----------------------------------------------------- |
| B12 · [BACKEND] Implementar API de Livros   | B11 · [BACKEND] Gestão de Board | B1 · [BACKEND] Setup Inicial e Arquitetura            |
| B13 · [BACKEND] Módulo de Carrinho          |                                 | B2 · [BACKEND] Dockerização e Ambiente Dev            |
| B14 · [BACKEND] Integração com Meio de Pgto |                                 | B3 · [BACKEND] Modelagem SQL e Normalização (14 tabs) |
|                                             |                                 | B7 · [BACKEND] Testes de Integração e Fluxo           |
|                                             |                                 | B8 · [BACKEND] Governança de Código e Linter          |
|                                             |                                 | B9 · [BACKEND] Isolamento de Testes e Teardown        |
|                                             |                                 | B10 · [BACKEND] Segurança de Identificadores (UUIDs)  |
|                                             |                                 | B15 · [BACKEND] Refino do CRUD de Clientes           |
|                                             |                                 | B16 · [BACKEND] CRUD de Endereços/Cartões            |
|                                             |                                 | B17 · [BACKEND] Consulta Administrativa              |
|                                             |                                 | B18 · [BACKEND] Testes Manuais CRUD Clientes         |
|                                             |                                 | B19 · [BACKEND] Correção Violações Segurança         |
|                                             |                                 | B20 · [BACKEND] Otimização de Disco Banco            |

---

## Detalhamento dos Cards

| Card | Tipo    | Título                               | Tarefas / Descrição                                                                                                 |
| ---- | ------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| B1   | BACKEND | Setup Inicial e Arquitetura          | Definir estrutura de módulos, injeção de dependência manual (Inversify/Manual) e padrões SOLID/DDD.                 |
| B2   | BACKEND | Dockerização e Ambiente Dev          | Criar Dockerfile multi-stage; configurar docker-compose com Node.js + Postgres + Redis; hot reload com ts-node-dev. |
| B3   | BACKEND | Modelagem SQL e Normalização         | Criar 14 tabelas normalizadas (DDR/DML); triggers de atualização; diagramas ER PlantUML; convenção de trigramas.    |
| B4   | BACKEND | Infraestrutura de Repositórios PG    | Implementar Pool de conexões, Transações seguras e Repositórios para Usuários, Endereços, Perfis e Telefones.       |
| B5   | BACKEND | Auth com JWT e Cookies HttpOnly      | **Implementado:** Sistema de autenticação completo com login seguro, geração de tokens JWT e proteção de rotas via middlewares, utilizando cookies seguros para armazenamento de sessão. |
| B6   | BACKEND | Módulo de Usuários e Perfis          | **Implementado:** Gestão completa de perfis de clientes, incluindo cadastro inicial, edição de dados pessoais, inativação de conta e alteração segura de senha. |
| B7   | BACKEND | Testes de Integração e Fluxo         | **Implementado:** Cobertura abrangente de testes automatizados para validar fluxos de autenticação e operações de clientes, garantindo estabilidade e correção do sistema. |
| B8   | BACKEND | Governança de Código e Linter        | Configurar ESLint (Airbnb) e Prettier; proibir switch/case via AGENTS.md; comentários obrigatórios em Português.    |
| B9   | BACKEND | Isolamento de Testes e Teardown      | Garantir fechamento de handles TCP (Redis/PG) e isolamento entre testes usando BEGIN/ROLLBACK ou TRUNCATE.          |
| B10  | BACKEND | Segurança de Identificadores (UUIDs) | Impedir exposição de IDs internos (BIGSERIAL); mapear para UUIDs públicos nas respostas e payloads JWT.             |
| B11  | BACKEND | Gestão de Board e Documentação       | Implementar PROJECT-BOARD.md e alinhar skills com o padrão de governança do projeto (cross-repo sync).              |
| B12  | BACKEND | Implementar API de Livros            | Criar rota GET /livros; busca por parâmetros; filtros avançados; ordenação; paginação robusta via banco.            |
| B13  | BACKEND | Módulo de Carrinho de Compras        | Manter estado do carrinho no Redis; sincronizar com banco se usuário logado; regras de estoque.                     |
| B14  | BACKEND | Integração com Meio de Pagamento     | Simular ou integrar gateway; validação de dados de cartão (sem salvar no BD); webhook de confirmação.               |
| B15  | BACKEND | Refino do CRUD de Clientes          | **Implementado:** Corrigidos gaps de validação (BCrypt custo 12, campos obrigatórios de perfil, restrição de alteração de e-mail), middlewares de autorização e verificações de segurança. |
| B16  | BACKEND | CRUD de Endereços e Cartões         | **Implementado:** CRUD completo de cartões tokenizados com tabelas normalizadas, validações de segurança e único cartão principal por usuário. |
| B17  | BACKEND | Consulta Administrativa de Clientes | **Implementado:** Rota GET /api/clientes com filtros administrativos (nome, CPF, e-mail), paginação e listagem completa de clientes. |
| B18  | BACKEND | Testes Manuais CRUD Clientes        | **Implementado:** Testes completos via curl das rotas CRUD: registro com validação CPF único; login JWT; atualização perfil; alteração senha com validações; inativação impedindo login. |
| B19  | BACKEND | Correção Violações Segurança        | **Implementado:** Correção crítica de 4 violações: JWT via HttpOnly cookie (não mais no body); remoção de IDs internos do payload JWT; substituição de switch/case por Record<string, fn>; remoção de dados sensíveis (CPF) das respostas públicas. Configuração de cookie-parser e atualização do middleware de autenticação. |
| B20  | BACKEND | Otimização de Disco Banco           | **Implementado:** Removidos 11 índices duplicados (UNIQUE constraints mantidos), 4 índices não usados e 3 colunas nulas (dsc_genero, dat_nascimento, dsc_telefone); redimensionados VARCHAR nom_usuario (150→80) e dsc_senha_hash (255→100); entidades, repositórios, DTOs e testes atualizados para refletir mudanças; economia ~196 kB imediatos e ~60 MB em produção (10k usuários). Banco dropado e recriado com DDLs otimizados. |

---

> **Nota:** Este board é mantido localmente e serve como a fonte de verdade para o status das atividades de desenvolvimento do Backend.
