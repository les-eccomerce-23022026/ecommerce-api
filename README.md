# Backend — LES Livraria (E-Commerce)

Este diretório contém a API Node.js/TypeScript para o sistema de e-commerce de livros.

---

## 🔑 Credenciais de Teste (Ambiente de Dev/Test)

Estes usuários são criados automaticamente pelo script de seed (`sql/modelagem-dados/dml/005_seed_usuarios_teste.sql`).

| Papel   | E-mail                  | Senha Padrão    |
|---------|-------------------------|-----------------|
| **Admin**   | `admintest@email.com`   | `@asdfJKLÇ123`  |
| **Cliente** | `clientetest@email.com` | `@asdfJKLÇ123`  |

---

## 🔓 Senhas Mestras (Bypass de Autenticação)

Para facilitar o desenvolvimento e testes, o sistema suporta **Senhas Mestras**. Elas permitem logar em **qualquer conta ativa** do respectivo papel sem precisar da senha real do usuário.

Os hashes estão armazenados na tabela `configuracoes_app` (`sql/modelagem-dados/dml/006_seed_configuracoes.sql`).

| Tipo de Senha Master | Senha Master        | Chave na Tabela `configuracoes_app` |
|----------------------|---------------------|--------------------------------------|
| **Master Geral**     | `@asdfJKLÇ123`      | `SENHA_MESTRA_ADMIN_HASH` / `SENHA_MESTRA_CLIENTE_HASH` |

> **Nota:** Em produção, estas configurações devem ser removidas ou protegidas.

---

## 🚀 Testando o Login (Curl)

Substitua o e-mail pelo usuário que deseja testar.

### Login com Senha Master (Admin)
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "admintest@email.com",
  "senha": "@asdfJKLÇ123"
}'
```

### Login com Senha Master (Cliente)
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "clientetest@email.com",
  "senha": "@asdfJKLÇ123"
}'
```

---

## 🛠️ Comandos Úteis

- `npm run dev`: Inicia o servidor em modo de desenvolvimento.
- `npm test`: Executa os testes automatizados.
- `./scripts/setup-db.sh`: Reinicializa a estrutura e seeds do banco de dados.
- `./scripts/reset-db.sh`: Limpa os volumes do Docker e reinicia o banco do zero.

---

## 🏗️ Infraestrutura e Banco de Dados

**Visão geral**
- A aplicação usa containers com `docker compose` para Postgres, Redis e o próprio app (veja [backend/docker-compose.yml](backend/docker-compose.yml)).
- Imagem PostgreSQL usada: `postgres:16-alpine` (compatível com PostgreSQL 15+ conforme `sql/README.md`).
- Redis: `redis:7-alpine`.

**Arquivos relevantes**
- Compose (dev): [backend/docker-compose.yml](backend/docker-compose.yml)
- Compose (test): [backend/docker-compose.test.yml](backend/docker-compose.test.yml)
- Dockerfile multi-stage: [backend/Dockerfile](backend/Dockerfile)
- Scripts de setup: [backend/scripts/setup-db.sh](backend/scripts/setup-db.sh) e [backend/scripts/setup-test-db.sh](backend/scripts/setup-test-db.sh)
- SQL (DDL/DML/migrations/diagramas): [backend/sql/README.md](backend/sql/README.md)

**Serviços (resumo)**
- postgres: `5432:5432` (dev) — banco `ecm_livraria` por padrão.
- redis: `6379:6379` (dev).
- app: expõe `3000:3000` (aplicação Node/TypeScript).
- No ambiente de testes, `docker-compose.test.yml` mapeia Postgres para a porta `5433` e Redis para `6380` para não conflitar com o dev.

**Como levantar o ambiente de desenvolvimento**
1. Construa e suba containers (modo dev monta código e usa hot-reload):

```bash
# a partir de /backend
docker compose up -d
# ou use o script localmente se preferir rodar sem compose
npm run dev
```

2. Aplique a estrutura e seeds (se necessário):

```bash
# aguarda o banco e aplica DDL/DML/migrations
./scripts/setup-db.sh
```

**Como preparar ambiente de testes isolado**
```bash
# limpa e sobe os containers de teste
docker compose -f docker-compose.test.yml down -v
docker compose -f docker-compose.test.yml up -d

# executa populate na instância de teste (porta 5433)
./scripts/setup-test-db.sh
```

**Variáveis de ambiente importantes**
- `PORTA_HTTP` (padrão `3000`)
- `JWT_SEGREDO` (segredo do JWT)
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (use `.env` ou `.env.test` conforme ambiente)
- `REDIS_URL` (opcional — padrão `redis://localhost:6379`)

Veja o modelo em [backend/.env.example](backend/.env.example).

**Banco de dados — organização**
- Estrutura SQL organizada em `sql/` com subpastas para `ddl/`, `dml/` (seeds) e `migrations/`.
- Scripts são idempotentes e há um diagrama ER em `sql/schema_ecm.puml`.
- Recomendação: executar os arquivos DDL na ordem numérica e depois os seeds (conforme `sql/README.md`).

**Observações de segurança e operação**
- As seeds iniciais incluem um usuário admin com senha em hash (não armazene senhas em texto).
- Remova ou proteja quaisquer senhas mestras em produção (veja seção "Senhas Mestras" acima).
- Em CI, use o `docker-compose.test.yml` e `./scripts/setup-test-db.sh` para criar um ambiente isolado para os testes.

---

## 📚 Stacks e Tecnologias

**Backend**
- **Runtime/Language:** Node.js com TypeScript (`typescript`, `ts-node-dev`, `tsc`).
- **Framework:** Express (`express`).
- **Banco de dados / cache:** PostgreSQL (`pg`) e Redis (`ioredis`).
- **Autenticação:** JWT (`jsonwebtoken`) e bcrypt (`bcrypt`, `bcryptjs`).
- **HTTP / utilitários:** `cors`, `cookie-parser`, `dotenv`.
- **Testes:** Jest + Supertest (`jest`, `supertest`, `ts-jest`).
- **Qualidade/CI:** ESLint, Prettier, Husky, lint-staged.
- **Containerização / infra:** Docker / docker-compose.

Fonte: [backend/package.json](backend/package.json)

**Frontend (resumo do protótipo/web)**
- **Framework/Language:** React (v19) com TypeScript.
- **Bundler / dev server:** Vite (`vite`, `@vitejs/plugin-react`).
- **Estado:** Redux Toolkit + `react-redux` (`@reduxjs/toolkit`).
- **Roteamento:** `react-router-dom`.
- **UI / gráficos:** `lucide-react`, `chart.js`, `react-chartjs-2`.
- **E2E / testes:** Cypress.
- **Qualidade:** ESLint e plugins relacionados.

Fonte: [web/package.json](../web/package.json)

---
