# Project Board — LES Backend API

> Atualizado em: 27 de abril de 2026  
> Status: Gestão local das atividades do projeto.

---

## Board Kanban

| 📛 Todo (0)                                 | 🔄 In Progress (1)              | ✅ Done (36)                                                          |
| ------------------------------------------- | ------------------------------- | --------------------------------------------------------------------- |
|                                             | B14 · [BACKEND] Gateway Real (Stripe) | B1 · [BACKEND] Setup Inicial e Arquitetura                            |
|                                             |                                 | B2 · [BACKEND] Dockerização e Ambiente Dev                            |
|                                             |                                 | B3 · [BACKEND] Modelagem SQL e Normalização                           |
|                                             |                                 | B4 · [BACKEND] Infraestrutura de Repositórios PG                      |
|                                             |                                 | B13 · [BACKEND] Módulo de Carrinho                                    |
|                                             |                                 | B5 · [BACKEND] Auth com JWT (Bearer)                                  |
|                                             |                                 | B6 · [BACKEND] Módulo de Usuários e Perfis                            |
|                                             |                                 | B7 · [BACKEND] Testes de Integração e Fluxo                           |
|                                             |                                 | B8 · [BACKEND] Governança de Código e Linter                          |
|                                             |                                 | B9 · [BACKEND] Isolamento de Testes e Teardown                        |
|                                             |                                 | B10 · [BACKEND] Segurança de Identificadores (UUIDs)                  |
|                                             |                                 | B11 · [BACKEND] Gestão de Board e Documentação                        |
|                                             |                                 | B12 · [BACKEND] Implementar API de Livros                             |
|                                             |                                 | B14 · [BACKEND] Integração com Meio de Pgto (PIX)                     |
|                                             |                                 | B15 · [BACKEND] Refino do CRUD de Clientes                            |
|                                             |                                 | B16 · [BACKEND] CRUD de Endereços/Cartões                             |
|                                             |                                 | B17 · [BACKEND] Consulta Administrativa                               |
|                                             |                                 | B18 · [BACKEND] Testes Manuais CRUD Clientes                          |
|                                             |                                 | B19 · [BACKEND] Correção Violações Segurança                          |
|                                             |                                 | B20 · [BACKEND] Otimização de Disco Banco                             |
|                                             |                                 | B21 · [BACKEND] Gestão de Administradores                             |
|                                             |                                 | B22 · [BACKEND] Evolução de Papéis e Acesso Dual                      |
|                                             |                                 | B23 · [BACKEND] Hashing de Senhas (BCrypt)                            |
|                                             |                                 | B24 · [BACKEND] Mascaramento de Dados (Privacidade)                   |
|                                             |                                 | B25 · [BACKEND] Banco de Teste Isolado e Middleware                   |
|                                             |                                 | B26 · [VENDAS] Sprint 1: Base de Vendas                               |
|                                             |                                 | B27 · [BACKEND] Reorganização de Testes Unitários                     |
|                                             |                                 | B28 · [BACKEND] Módulo de Entrega e Logística                         |
|                                             |                                 | B29 · [BACKEND] Intenções de Pagamento Persistidas e Rastreio         |
|                                             |                                 | B30 · [BACKEND] Módulo de Frete e Cotação (persistência + checkout)   |
|                                             |                                 | B31 · [BACKEND] Modularização de Serviços (DDD)                       |
|                                             |                                 | B32 · [BACKEND] Validação de Roles em Vendas                          |
|                                             |                                 | B33 · [BACKEND] Módulo de Trocas e Devoluções                         |
|                                             |                                 | B34 · [BACKEND] Fortalecimento da Segurança                           |
|                                             |                                 | B35 · [BACKEND] Infraestrutura de Testes Avançada                     |
|                                             |                                 | B36 · [BACKEND] Schema `les` e Padrões Arquiteturais                  |

---

## Detalhamento dos Cards

| ID   | Área    | Card                                                | Status / Evidência                                                                                                                                                                                                                           |
| :--- | :------ | :-------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1   | BACKEND | Setup Inicial e Arquitetura                         | Definir estrutura de módulos, injeção de dependência manual e padrões SOLID/DDD.                                                                                                                                                             |
| B2   | BACKEND | Dockerização e Ambiente Dev                         | Criar Dockerfile multi-stage; configurar docker-compose com Node.js + Postgres + Redis; hot reload com ts-node-dev.                                                                                                                          |
| B3   | BACKEND | Modelagem SQL e Normalização                        | Criar 14 tabelas normalizadas (DDR/DML); triggers de atualização; diagramas ER PlantUML.                                                                                                                                                     |
| B4   | BACKEND | Infraestrutura de Repositórios PG                   | Implementar Pool de conexões, Transações seguras e Repositórios para Usuários, Endereços, Perfis e Telefones.                                                                                                                                |
| B5   | BACKEND | Auth com JWT (Bearer)                               | **Implementado:** Sistema de autenticação completo com login seguro e proteção de rotas via middlewares (JWT no header Authorization).                                                                                                       |
| B6   | BACKEND | Módulo de Usuários e Perfis                         | **Implementado:** Gestão completa de perfis de clientes, incluindo cadastro inicial, edição, inativação e alteração de senha.                                                                                                                |
| B7   | BACKEND | Testes de Integração e Fluxo                        | **Implementado:** Cobertura abrangente de testes automatizados (25 testes passando) para validar fluxos de autenticação e clientes.                                                                                                          |
| B8   | BACKEND | Governança de Código e Linter                       | Configurar ESLint (Airbnb) e Prettier; proibir switch/case via AGENTS.md; comentários em Português.                                                                                                                                          |
| B9   | BACKEND | Isolamento de Testes e Teardown                     | Garantir fechamento de handles TCP (Redis/PG) e isolamento entre testes usando TRUNCATE.                                                                                                                                                     |
| B10  | BACKEND | Segurança de Identificadores (UUIDs)                | Impedir exposição de IDs internos (BIGSERIAL); mapear para UUIDs públicos nas respostas e tokens.                                                                                                                                            |
| B11  | BACKEND | Gestão de Board e Documentação                      | Implementar PROJECT-BOARD.md e alinhar skills com o padrão de governança do projeto.                                                                                                                                                         |
| B12  | BACKEND | Implementar API de Livros                           | Criar rota GET /livros; busca por parâmetros; filtros avançados; ordenação; paginação robusta.                                                                                                                                               |
| B13  | BACKEND | Módulo de Carrinho de Compras                       | **Negócio:** Recuperação de vendas perdidas e conveniência para o cliente ao manter itens salvos entre sessões, com trava de estoque para evitar overselling. **Arquivos:** `servicoCarrinho.ts`, `controladorCarrinho.ts`, `ecm_carrinho_itens`. |
| B14  | BACKEND | Integração com Meio de Pagamento                    | **Negócio:** Habilitação de pagamentos instantâneos (PIX) para acelerar o ciclo de caixa e reduzir custos de transação. **Arquivos:** `ServicoPixPagamentos.ts`, `webhookPagamento.ts`. |
| B15  | BACKEND | Refino do CRUD de Clientes                          | **Implementado:** Corrigidos gaps de validação (BCrypt custo 10), middlewares de autorização e segurança.                                                                                                                                    |
| B16  | BACKEND | CRUD de Endereços e Cartões                         | **Implementado:** CRUD completo de cartões tokenizados e endereços mascarados. Inclui inclusão, remoção e alteração de perfil.                                                                                                               |
| B17  | BACKEND | Consulta Administrativa de Clientes                 | **Implementado:** Rota GET /api/clientes com filtros administrativos (nome, CPF, e-mail) e paginação para admins.                                                                                                                            |
| B18  | BACKEND | Testes Manuais CRUD Clientes                        | **Implementado:** Testes completos via curl/http das rotas CRUD: registro; login JWT; perfil; cartões; inativação.                                                                                                                           |
| B19  | BACKEND | Correção Violações Segurança                        | **Implementado:** Correção crítica de 4 violações: transporte seguro de JWT; remoção de IDs internos; switch/case por Record; privacidade de CPF.                                                                                            |
| B20  | BACKEND | Otimização de Disco Banco                           | **Implementado:** Otimização de esquema reduzindo índices redundantes e redimensionando tipos VARCHAR.                                                                                                                                       |
| B21  | BACKEND | Gestão de Administradores                           | **Implementado:** CRUD completo de administradores (listagem, criação, inativação/ativação) com trava de segurança de auto-inativação.                                                                                                       |
| B22  | BACKEND | Evolução de Papéis e Acesso Dual                    | **Implementado:** Independência de registros por papel para mesmo e-mail; senha na promoção; extensão de papel; correção de bug de UUID em cartões.                                                                                          |
| B23  | BACKEND | Hashing de Senhas (BCrypt)                          | **Implementado:** Substituição de senhas em texto puro por hashes BCrypt (custo 10). Inclui script de seed para reset de usuários de teste.                                                                                                  |
| B24  | BACKEND | Mascaramento de Dados (Privacidade)                 | **Implementado:** Mascaramento automático de CPF (`***.XXX.***-**`) e Telefone nas respostas da API de Perfil para conformidade com a LGPD.                                                                                                  |
| B25  | BACKEND | Banco de Teste Isolado e Middleware                 | **Implementado:** Infraestrutura isolada (porta 5433) e middleware dinâmico para troca de banco via header `x-use-test-db`. Centralização em `.env`.                                                                                         |
| B26  | VENDAS  | Sprint 1: Base de Vendas                            | **Concluído:** Criada infraestrutura de vendas (Repositório, Serviço, Controlador, Rotas e Migração 010). Backend permite criar e consultar vendas.                                                                                          |
| B27  | BACKEND | Reorganização de Testes Unitários                   | **Concluído:** Centralização de testes de Value Objects (`entrega` e `pagamentos`) em `src/tests/unitarios` para alinhar com a pirâmide de testes.                                                                                           |
| B28  | BACKEND | Módulo de Entrega e Logística                       | **Concluído:** Implementação do módulo (DTO, Repository, Service, Controller, Routes). Migration 013 para renomear tabelas; integração automática.                                                                                           |
| B29  | BACKEND | Intenções de Pagamento Persistidas e Rastreio       | **Negócio:** Garante a integridade financeira ao travar o valor da transação e validar a autenticidade via HMAC, prevenindo alterações maliciosas no checkout. **Arquivos:** `RepositorioIntencaoPagamentoPostgres.ts`, `ServicoPagamentos.ts`. |
| B30  | BACKEND | Módulo de Frete e Cotação (persistência + checkout) | **Negócio:** Elimina discrepâncias entre o valor cobrado do cliente e o custo logístico real, garantindo a margem de lucro da operação. **Arquivos:** `ServicoFrete.ts`, `ProvedorFreteSimulado.ts`. |
| B31  | BACKEND | Modularização de Serviços (DDD)                     | **Negócio:** Aumenta a agilidade no lançamento de novas features ao isolar responsabilidades, permitindo manutenções sem impacto em outras áreas do sistema. **Arquivos:** `ServicoIdentidade.ts`, `ServicoPagamentos.ts`. |
| B32  | BACKEND | Validação de Roles em Vendas                        | **Negócio:** Protege a privacidade dos dados e evita o acesso não autorizado a pedidos de terceiros, garantindo conformidade com regras de sigilo. **Arquivos:** `ControladorVendas.ts`, `validadorPapel.ts`. |
| B33  | BACKEND | Módulo de Trocas e Devoluções                       | **Negócio:** Automação do pós-venda para redução de custos operacionais e fidelização do cliente através de um processo de troca transparente e ágil. **Arquivos:** `ControladorVendas.ts`, `ServicoVendas.ts`, `CupomService.ts`. |
| B34  | BACKEND | Fortalecimento da Segurança                         | **Negócio:** Protege o ativo mais valioso da empresa (dados dos clientes) contra ataques e vazamentos, minimizando riscos jurídicos e de imagem. **Arquivos:** `FiltroSeguranca.ts`, `HmacUtil.ts`. |
| B35  | BACKEND | Infraestrutura de Testes Avançada                   | **Negócio:** Garante a continuidade do negócio e a estabilidade da plataforma em cada atualização, prevenindo bugs críticos em produção. **Arquivos:** `teste.setup.ts`, `BancoTesteIsolado.ts`. |
| B36  | BACKEND | Schema `les` e Padrões Arquiteturais                | **Negócio:** Organização patrimonial dos dados e padronização técnica que facilita o escalonamento da equipe e do sistema. **Arquivos:** `ConexaoPostgres.ts`, `001_schema_les.sql`. |

---

> **Nota:** Este board é mantido localmente e serve como a fonte de verdade para o status das atividades de desenvolvimento do Backend.
