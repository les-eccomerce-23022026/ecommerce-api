# Project Board — LES Backend API

> Atualizado em: 16 de março de 2026  
> Status: Gestão local das atividades do projeto.

---

## Board Kanban

| 📛 Todo (3)                                 | 🔄 In Progress (0)              | ✅ Done (19)                                          |
| ------------------------------------------- | ------------------------------- | ----------------------------------------------------- |
| B12 · [BACKEND] Implementar API de Livros   |                                 | B1 · [BACKEND] Setup Inicial e Arquitetura            |
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
|                                             |                                 | B21 · [BACKEND] Gestão de Administradores            |
|                                             |                                 | B22 · [BACKEND] Evolução de Papéis e Acesso Dual     |
|                                             |                                 | B23 · [BACKEND] Hashing de Senhas (BCrypt)           |
|                                             |                                 | B24 · [BACKEND] Mascaramento de Dados (Privacidade)  |

---

## Detalhamento dos Cards

...
| B21  | BACKEND | Gestão de Administradores            | **Implementado:** CRUD completo de administradores (listagem, criação, inativação/ativação) com trava de segurança de auto-inativação. |
| B22  | BACKEND | Evolução de Papéis e Acesso Dual     | **Implementado:** Independência de registros por papel para o mesmo e-mail; opção de senha na promoção; extensão de papel (admin acessa cliente); perfil unificado (agregado); correção de bug de UUID em cartões. |
| B23  | BACKEND | Hashing de Senhas (BCrypt)           | **Implementado:** Substituição de senhas em texto puro por hashes BCrypt (custo 10). Inclui script de seed para reset de usuários de teste. |
| B24  | BACKEND | Mascaramento de Dados (Privacidade)  | **Implementado:** Mascaramento automático de CPF (`***.XXX.***-**`) e Telefone nas respostas da API de Perfil para conformidade com a LGPD. |

| B1   | BACKEND | Setup Inicial e Arquitetura          | Definir estrutura de módulos, injeção de dependência manual e padrões SOLID/DDD.                 |
| B2   | BACKEND | Dockerização e Ambiente Dev          | Criar Dockerfile multi-stage; configurar docker-compose com Node.js + Postgres + Redis; hot reload com ts-node-dev. |
| B3   | BACKEND | Modelagem SQL e Normalização         | Criar 14 tabelas normalizadas (DDR/DML); triggers de atualização; diagramas ER PlantUML.    |
| B4   | BACKEND | Infraestrutura de Repositórios PG    | Implementar Pool de conexões, Transações seguras e Repositórios para Usuários, Endereços, Perfis e Telefones.       |
| B5   | BACKEND | Auth com JWT e Cookies HttpOnly      | **Implementado:** Sistema de autenticação completo com login seguro e proteção de rotas via middlewares. |
| B6   | BACKEND | Módulo de Usuários e Perfis          | **Implementado:** Gestão completa de perfis de clientes, incluindo cadastro inicial, edição, inativação e alteração de senha. |
| B7   | BACKEND | Testes de Integração e Fluxo         | **Implementado:** Cobertura abrangente de testes automatizados (25 testes passando) para validar fluxos de autenticação e clientes. |
| B8   | BACKEND | Governança de Código e Linter        | Configurar ESLint (Airbnb) e Prettier; proibir switch/case via AGENTS.md; comentários em Português.    |
| B9   | BACKEND | Isolamento de Testes e Teardown      | Garantir fechamento de handles TCP (Redis/PG) e isolamento entre testes usando TRUNCATE.          |
| B10  | BACKEND | Segurança de Identificadores (UUIDs) | Impedir exposição de IDs internos (BIGSERIAL); mapear para UUIDs públicos nas respostas e tokens.             |
| B11  | BACKEND | Gestão de Board e Documentação       | Implementar PROJECT-BOARD.md e alinhar skills com o padrão de governança do projeto.              |
| B12  | BACKEND | Implementar API de Livros            | Criar rota GET /livros; busca por parâmetros; filtros avançados; ordenação; paginação robusta.            |
| B13  | BACKEND | Módulo de Carrinho de Compras        | Manter estado do carrinho no Redis; sincronizar com banco se usuário logado; regras de estoque.                     |
| B14  | BACKEND | Integração com Meio de Pagamento     | Simular ou integrar gateway; validação de dados de cartão (sem salvar no BD); webhook.               |
| B15  | BACKEND | Refino do CRUD de Clientes          | **Implementado:** Corrigidos gaps de validação (BCrypt custo 10), middlewares de autorização e segurança. |
| B16  | BACKEND | CRUD de Endereços e Cartões         | **Implementado:** CRUD completo de cartões tokenizados e endereços mascarados. Inclui inclusão, remoção e alteração de perfil. |
| B17  | BACKEND | Consulta Administrativa de Clientes | **Implementado:** Rota GET /api/clientes com filtros administrativos (nome, CPF, e-mail) e paginação para admins. |
| B18  | BACKEND | Testes Manuais CRUD Clientes        | **Implementado:** Testes completos via curl/http das rotas CRUD: registro; login JWT; perfil; cartões; inativação. |
| B19  | BACKEND | Correção Violações Segurança        | **Implementado:** Correção crítica de 4 violações: JWT via HttpOnly; remoção de IDs internos; switch/case por Record; privacidade de CPF. |
| B20  | BACKEND | Otimização de Disco Banco           | **Implementado:** Otimização de esquema reduzindo índices redundantes e redimensionando tipos VARCHAR. |
| B21  | BACKEND | Gestão de Administradores            | **Implementado:** CRUD completo de administradores (listagem, criação, inativação/ativação) com trava de segurança de auto-inativação. |

---

> **Nota:** Este board é mantido localmente e serve como a fonte de verdade para o status das atividades de desenvolvimento do Backend.
