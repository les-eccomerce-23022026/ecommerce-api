# Backend — API LES (Livraria)

API Node.js/TypeScript (Express, PostgreSQL, JWT).

---

## Contexto no monorepo

- Visão geral do projeto: [`../README.md`](../README.md)
- Frontend consumidor da API: [`../web/README.md`](../web/README.md)
- Requisitos e ADRs (SSoT): [`../documentacao-exigida/README.md`](../documentacao-exigida/README.md)

---

## 1. Banco de dados (desenvolvimento)

Na pasta `backend`:

```bash
docker compose up -d
./scripts/setup-db.sh
```

- Postgres: `localhost:5432` — banco `ecm_livraria` (usuário/senha padrão do `docker-compose.yml`: `ecm_user` / `ecm_senha`).

**Ambiente de testes isolado** (Postgres `5433`):

```bash
docker compose -f docker-compose.test.yml up -d
./scripts/setup-test-db.sh
```

Configure no `.env` os hosts/portas de teste (`POSTGRES_HOST_TEST`, etc.) conforme [`.env.example`](.env.example).

### Migração de cotação de frete

Execute no Postgres de dev/teste o script [`sql/migrations/020_cotacao_frete_transportadora.sql`](sql/migrations/020_cotacao_frete_transportadora.sql) (tabelas `cotacao_frete`, `cotacao_frete_simulada`, coluna `vendas.cfr_id`).

No `.env` / `.env.test`, defina **`PROVEDOR_FRETE=simulado`** (obrigatório para subir a API). Opcionais: `FRETE_CEP_ORIGEM_PADRAO`, `FRETE_COTACAO_TTL_MINUTOS`, parâmetros de simulação (`FRETE_SIM_*`).

### PIX simulado (checkout)

Execute [`sql/migrations/024_cobranca_pix_simulada.sql`](sql/migrations/024_cobranca_pix_simulada.sql): tabela `pagamento_pix_simulado`, status de venda `AGUARDANDO PAGAMENTO`.

- `POST /api/pagamentos/selecionar` com `tipoPagamento: pix` devolve `pixCobranca` (copia-e-cola, QR base64, expiração, segredo para testes).
- `POST /api/pagamentos/:uuid/processar` **não** liquida PIX — use `POST /api/webhooks/pagamento-pix-simulado` com `{ pagamentoUuid, segredoConfirmacao }`.
- `GET /api/pagamentos/venda/:vendaUuid/resumo` (autenticado) para polling no frontend.
- Opcional: `PIX_COBRANCA_TTL_MINUTOS` (padrão 30).

---

## 2. Iniciar a aplicação

**⚠️ IMPORTANTE: Este projeto usa Docker Compose para gerenciar o backend em ambiente de desenvolvimento.**

Para instruções detalhadas sobre como usar Docker Compose para gerenciar o backend, consulte [DOCKER.md](DOCKER.md).

### Comandos principais do Docker Compose

```bash
# Iniciar todos os serviços (app + postgres)
docker compose up -d

# Parar todos os serviços
docker compose down

# Reiniciar o backend após alterações
docker compose restart app

# Reconstruir e iniciar (quando há alterações no Dockerfile)
docker compose up -d --build app
```

**NÃO rode o backend diretamente no host com `npm run dev` quando estiver usando Docker.** Isso causa conflitos de porta (3000) e inconsistência entre o código no host e o container.

### Contrato de portas (Docker vs host)

O descompasso mais comum em dev é confundir **a porta em que o Express escuta** com **a porta publicada no host pelo Docker**. Use duas variáveis no `.env` (ver [`.env.example`](.env.example)):

| Variável | Onde vale | Padrão | Uso |
|----------|-----------|--------|-----|
| `PORTA_HTTP` | Container / host sem Docker | `3000` | Porta em que o Express **escuta** (`server.ts`) |
| `PORTA_HTTP_EXTERNA` | Host (Docker dev) | `3002` | Porta para browser, curl, Postman (`localhost:3002`) |
| `PORTA_HTTP_TEST_EXTERNA` | Host (`docker-compose.test.yml`) | `3003` | Stack de testes isolada |

O `docker-compose.yml` publica **`${PORTA_HTTP_EXTERNA}:${PORTA_HTTP}`** (ex.: `3002:3000`). Se alterar `PORTA_HTTP` no `.env`, não edite o compose manualmente — recrie o serviço:

```bash
docker compose up -d app
```

**URLs da API:**

| Modo | Base URL |
|------|----------|
| Com Docker (recomendado) | `http://localhost:${PORTA_HTTP_EXTERNA:-3002}/api` |
| Sem Docker (`npm run dev`) | `http://localhost:${PORTA_HTTP:-3000}/api` |

O healthcheck do serviço `app` valida HTTP na `PORTA_HTTP` **dentro** do container. O script [`iniciar-docker.sh`](iniciar-docker.sh) confere a resposta na porta externa após subir os containers.

**Diagnóstico rápido** (`curl: (56) Conexão fechada`):

```bash
docker port ecm_app
# Esperado: 3000/tcp -> 0.0.0.0:3002

docker logs ecm_app --tail 5
# Esperado: Servidor iniciado na porta 3000

curl -I http://localhost:3002/api
```

Mais detalhes e troubleshooting: [DOCKER.md](DOCKER.md).

---

### Iniciar localmente (sem Docker - não recomendado)

Se preferir rodar localmente (apenas para desenvolvimento rápido):

```bash
npm install
npm run dev
```

A API sobe em `http://localhost:${PORTA_HTTP:-3000}` (prefixo `/api`). Variáveis: copie [`.env.example`](.env.example) para `.env` e defina pelo menos `JWT_SEGREDO`, `JWT_TEMPO_EXPIRACAO` (ex.: `1h`) e `CORS_ORIGIN` (origens do frontend com credenciais, ex.: `http://localhost:5173,http://127.0.0.1:5173`).

### Sessão (JWT + cookie HttpOnly)

- `POST /api/auth/login` define cookie `les_token` (HttpOnly, `SameSite=Lax`; nome configurável com `AUTH_COOKIE_NAME`). Em produção o corpo **não** inclui o JWT; em `NODE_ENV=test` o token também vem em `dados.token` para supertest.
- `POST /api/auth/logout` remove o cookie.
- `GET /api/auth/me` aceita o JWT pelo cookie **ou** pelo header `Authorization: Bearer` (útil em testes).
- CORS usa `credentials: true`; a origem precisa estar em `CORS_ORIGIN`.

**Só com Docker (app + banco):** `docker compose up -d` (o serviço `app` usa o `.env`).

### Contrato com frontend

- Base de API consumida pelo frontend: `/api`.
- Sessão principal via cookie HttpOnly (`les_token` por padrão).
- Com backend em Docker, o frontend deve apontar para `http://localhost:3002` (ou `PORTA_HTTP_EXTERNA`); sem Docker, para `http://localhost:3000` (`PORTA_HTTP`). Ver contrato de portas acima.
- Para detalhes do cliente web, proxy Next e variáveis de ambiente: [`../web/README.md`](../web/README.md).

---

## 3. Credenciais de login (desenvolvimento e BDD)

Usuários criados pelos seeds em `sql/modelagem-dados/dml/` e migrations (`008_seed_dados_teste_bdd.sql`, `025`–`038`). Após `./scripts/setup-db.sh`, use `POST /api/auth/login` com `{ "email", "senha" }`.

### Clientes

| Nome | E-mail | Senha | Origem | Dados extras (após setup) |
|------|--------|-------|--------|---------------------------|
| **Cliente Teste** | `clientetest@email.com` | `@asdfJKLÇ123` | `005_seed_usuarios_teste.sql`, `008_seed_dados_teste_bdd.sql` | Endereço principal, cartões salvos (`025`, `026`), massa de checkout BDD (`035`, `038`) |

### Administradores

| Nome | E-mail | Senha | Perfil | Origem |
|------|--------|-------|--------|--------|
| **Administrador Mestre** | `admin@livraria.com.br` | `Admin@123` | `isAdminMestre: true` — gestão de outros admins | `002_seed_usuario_admin_inicial.sql` |
| **Admin Teste** | `admintest@email.com` | `@asdfJKLÇ123` | Admin comum (sem mestre) | `005_seed_usuarios_teste.sql`, `008_seed_dados_teste_bdd.sql` |

### Multi-Tenancy (após migration 050)

| Nome | E-mail | Senha | Papel | Escopo | Origem |
|------|--------|-------|-------|--------|--------|
| **Admin Sistema** | `admin_sistema@livraria.com.br` | `SenhaForte@123` | `admin_sistema` + `admin` | Global (todas lojas) | `050_seed_multi_tenant_completo.sql` |
| **Admin Tenant (Centro)** | `admin_centro@livraria.com.br` | `SenhaForte@123` | `admin` | Apenas Livraria Centro | `050_seed_multi_tenant_completo.sql` |
| **Admin Tenant (Norte)** | `admin_norte@livraria.com.br` | `SenhaForte@123` | `admin` | Apenas Livraria Norte | `050_seed_multi_tenant_completo.sql` |
| **Admin Tenant (Sul)** | `admin_sul@livraria.com.br` | `SenhaForte@123` | `admin` | Apenas Livraria Sul | `050_seed_multi_tenant_completo.sql` |
| **Cliente** | `maria.silva@email.com` | `SenhaForte@123` | `cliente` | Global (catálogo) | `050_seed_multi_tenant_completo.sql` |

> **Nota:** Para detalhes sobre a arquitetura multi-tenancy, permissões e implementação técnica, consulte [`docs/MULTI-TENANCY-QUICK-REFERENCE.md`](docs/MULTI-TENANCY-QUICK-REFERENCE.md) ou [`docs/MULTI-TENANCY-IMPLEMENTACAO.md`](docs/MULTI-TENANCY-IMPLEMENTACAO.md).

### Exemplo de login

Com Docker (`PORTA_HTTP_EXTERNA=3002`):

```bash
# Cliente
curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"clientetest@email.com","senha":"@asdfJKLÇ123"}'

# Administrador (comum ou mestre)
curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admintest@email.com","senha":"@asdfJKLÇ123"}'
```

Sem Docker, troque `3002` por `3000` (ou o valor de `PORTA_HTTP` no `.env`).

### Cypress e CI

Os testes E2E usam por padrão `clientetest@email.com` e `admintest@email.com` (senha `@asdfJKLÇ123`). Sobrescreva com `CYPRESS_CLIENTE_EMAIL`, `CYPRESS_CLIENTE_SENHA`, `CYPRESS_ADMIN_EMAIL`, `CYPRESS_ADMIN_SENHA`.

### Bootstrap (somente `NODE_ENV=test`)

`POST /api/admin/bootstrap` — recria/atualiza o mestre `admin@livraria.com.br` com senha `Admin@123`. Exige header `x-test-bootstrap-key` igual a `TEST_BOOTSTRAP_KEY` e, em integração, `x-use-test-db: true` com `ENABLE_TEST_DB_SWITCH=true`.

> **Segurança:** senhas acima são apenas para ambiente local/CI. Altere o mestre após o primeiro deploy em produção.

---

## 4. CPFs válidos para testes (dígitos verificadores)

A API valida CPF em cadastro de cliente (ambiente não-test). Use CPFs distintos por cadastro. Lista com **dígitos verificadores corretos**:

1. `245.699.622-46`
2. `019.364.721-47`
3. `747.200.643-29`
4. `371.568.753-37`
5. `497.592.260-65`
6. `283.323.987-46`
7. `206.903.522-04`
8. `824.477.504-12`
9. `989.888.819-90`
10. `267.905.031-29`
11. `684.262.887-31`
12. `802.563.243-10`
13. `087.098.018-12`
14. `707.848.056-28`
15. `952.426.835-38`

---

## 5. Números de cartão para testes (Luhn)

A validação de cartão na API usa comprimento (13–19 dígitos) e **algoritmo de Luhn**. Os números abaixo são **apenas para desenvolvimento** (não são cartões reais); qualquer CVV de 3 dígitos e validade futura (`MM/AA`) costuma bastar onde o fluxo exigir.

| Bandeira (exemplo) | Número (16 dígitos) |
|----------------------|---------------------|
| Visa | `4111111111111111` |
| Visa | `4242424242424242` |
| Mastercard | `5555555555554444` |

---

## 6. Testes e cobertura

```bash
npm test
npm run test:coverage
```

- Relatório texto no terminal; HTML em `backend/coverage/index.html` (abra no navegador).
- Cenários em linguagem de negócio: [`bdd/README.md`](bdd/README.md) (especificação; a automação está em `src/tests/**`, com pastas por domínio em `integracao/`).
- Detalhes de SQL e modelagem: [`sql/README.md`](sql/README.md).

### Guia rápido de testes por estratégia e domínio

#### Estratégia

| Comando | Escopo |
|---------|--------|
| `npm test` | Suite completa (unitários + integração + auditoria) |
| `npm run test:unit` | Apenas testes unitários (`src/tests/unitarios`) |
| `npm run test:int` | Apenas testes de integração (`src/tests/integracao`) |
| `npm run test:coverage` | Suite completa com cobertura |

#### Domínio de negócio

| Domínio | Unitário | Integração | Completo do domínio |
|--------|----------|------------|---------------------|
| Admin | `npm run test:unit:admin` | `npm run test:int:admin` | `npm run test:dominio:admin` |
| Clientes | `npm run test:unit:clientes` | `npm run test:int:clientes` | `npm run test:dominio:clientes` |
| Vendas | `npm run test:unit:vendas` | `npm run test:int:vendas` | `npm run test:dominio:vendas` |
| Pagamentos | `npm run test:unit:pagamentos` | `npm run test:int:pagamentos` | `npm run test:dominio:pagamentos` |
| Entrega | `npm run test:unit:entrega` | `npm run test:int:entrega` | `npm run test:dominio:entrega` |
| Frete | `npm run test:unit:frete` | `npm run test:int:frete` | `npm run test:dominio:frete` |

#### Complementares

| Comando | Escopo |
|---------|--------|
| `npm run test:unit:usuarios` | Repositório de usuários |
| `npm run test:unit:utils` | Utilitários (`utils` + formatação) |
| `npm run test:unit:infra` | Infra/middlewares |
| `npm run test:auditoria` | Auditoria de condicionais |

---

## 7. Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor com hot-reload |
| `npm run build` / `npm start` | Build e produção |
| `npm test` | Testes Jest |
| `npm run test:coverage` | Testes + cobertura |
| `./scripts/setup-db.sh` | DDL/DML/migrations no Postgres dev |
| `./scripts/reset-db.sh` | Limpa volumes Docker e recria banco (ver script) |
| `./iniciar-docker.sh` | Sobe compose, valida API na `PORTA_HTTP_EXTERNA` e roda setup do banco |

---

## 8. Documentação (SSoT e quadro local)

- Especificação e ADRs: [`../documentacao-exigida/README.md`](../documentacao-exigida/README.md)
- Kanban backend: [`docs/PROJECT-BOARD.md`](docs/PROJECT-BOARD.md)
- Protocolo SQL/migrations: [`sql/AGENTS.md`](sql/AGENTS.md)

---

## 9. Referências

- Rotas HTTP de exemplo: pasta `http/`.
- BDD (cenários): pasta `bdd/`.
- Scripts curl (fluxos): `scripts/curl-*-bdd.sh`.

---

## 10. Segurança no ambiente de testes

- `x-use-test-db` só deve ser usado em ambiente controlado (CI/local) com `ENABLE_TEST_DB_SWITCH=true`.
- Endpoint `POST /api/admin/bootstrap` só funciona em `NODE_ENV=test` e exige header `x-test-bootstrap-key` igual a `TEST_BOOTSTRAP_KEY`.
- Não versionar segredos reais em `.env`, `cypress.env.json` ou scripts.
- Para Cypress, defina credenciais via variáveis de ambiente:
  - `CYPRESS_ADMIN_EMAIL`, `CYPRESS_ADMIN_SENHA`
  - `CYPRESS_CLIENTE_EMAIL`, `CYPRESS_CLIENTE_SENHA`
- Pipeline de segurança recomendada (workflow `security-ci`):
  - secret scan (`gitleaks`)
  - SAST (`semgrep` + lint)
  - config lint (`yamllint`, `shellcheck`, `hadolint`)
  - testes backend/frontend
- Política de gate incremental:
  - checks rodam por escopo alterado (`backend/**`, `web/**`, `.github/**`);
  - lint e SAST focam arquivos alterados no PR para não bloquear por dívida histórica fora do diff;
  - E2E Cypress não entra no gate padrão neste estágio (somente unit/integration + segurança).
- Validação operacional no GitHub:
  - rode o workflow `security-ci` por `workflow_dispatch` com `full_gate=true` para execução completa (sem filtro incremental);
  - mantenha `check_secrets=true` para validar os secrets obrigatórios antes de promover mudanças para `main/master`;
  - use o modo incremental no dia a dia e o `full_gate` como checklist de release/hardening.
- Secrets obrigatórios no repositório remoto (Settings → Secrets and variables → Actions):
  - `TEST_BOOTSTRAP_KEY`
  - `CYPRESS_ADMIN_EMAIL`, `CYPRESS_ADMIN_SENHA`
  - `CYPRESS_CLIENTE_EMAIL`, `CYPRESS_CLIENTE_SENHA`

---

## 11. Operações de Banco de Dados (Schema `livraria` e Índices)

### Schema de aplicação (`livraria`)

A partir da versão 1.0.1, o banco de dados utiliza o schema **`livraria`** para objetos de negócio (tabelas, triggers, funções). A partir de 2026-05-17, o schema foi reestruturado com subdivisões por contexto limitado DDD (ver ADR 0006). Extensões como `pg_trgm` e `unaccent` permanecem no schema `public`.

A aplicação configura automaticamente o `search_path=livraria_comercial, livraria_logistica, livraria_financeiro, livraria_catalogo, livraria_gestao, livraria_ref, livraria_audit, livraria, public` via pool de conexão (variável `POSTGRES_SCHEMA`).

### Scripts de Banco

| Script | Quando usar |
|--------|-------------|
| `./scripts/setup-db.sh` | **Estrutura + Seeds**: Reconstrói o banco a partir dos arquivos SQL (DDL, DML e Migrations). Ideal para novos ambientes ou reset total. |
| `./scripts/setup-test-db.sh` | **Ambiente de Teste**: Equivalente ao `setup-db.sh` mas direcionado ao banco de testes (`:5433`). |
| `./scripts/sync-db-test.sh` | **Espelhamento**: Realiza um clone lógico dos dados do banco de desenvolvimento para o banco de testes. Útil para debugar falhas com massa de dados real. |

### Backup e Restauração

Para gerar um backup compactado do schema `les`:

```bash
docker exec ecm_postgres pg_dump -U ecm_user -d ecm_livraria -n les -Fc > backup_les_$(date +%Y%m%d).dump
```

Para restaurar:

```bash
docker exec -i ecm_postgres pg_restore -U ecm_user -d ecm_livraria --clean --if-exists < backup_les_...dump
```

### Análise de Índices e Performance

Query para listar o tamanho dos índices e identificar candidatos a otimização:

```sql
SELECT indexrelid::regclass AS indice,
       pg_size_pretty(pg_relation_size(indexrelid)) AS tamanho
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 30;
```

