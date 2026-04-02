# Backend — API LES (Livraria)

API Node.js/TypeScript (Express, PostgreSQL, Redis, JWT).

---

## 1. Banco de dados e Redis (desenvolvimento)

Na pasta `backend`:

```bash
docker compose up -d
./scripts/setup-db.sh
```

- Postgres: `localhost:5432` — banco `ecm_livraria` (usuário/senha padrão do `docker-compose.yml`: `ecm_user` / `ecm_senha`).
- Redis: `localhost:6379`.

**Ambiente de testes isolado** (Postgres `5433`, Redis `6380`):

```bash
docker compose -f docker-compose.test.yml up -d
./scripts/setup-test-db.sh
```

Configure no `.env` os hosts/portas de teste (`POSTGRES_HOST_TEST`, etc.) conforme [`.env.example`](.env.example).

---

## 2. Iniciar a aplicação

```bash
npm install
npm run dev
```

A API sobe em `http://localhost:${PORTA_HTTP:-3000}` (prefixo `/api`). Variáveis: copie [`.env.example`](.env.example) para `.env` e defina pelo menos `JWT_SEGREDO` e `JWT_TEMPO_EXPIRACAO` (ex.: `1h`).

**Só com Docker (app + banco):** `docker compose up -d` (o serviço `app` usa o `.env`).

---

## 3. Credenciais de administrador

| Perfil | E-mail | Senha | Observação |
|--------|--------|-------|------------|
| **Administrador mestre** | `admin@livraria.com.br` | `Admin@123` | Criado pelo seed SQL (`002_seed_usuario_admin_inicial.sql`). `isAdminMestre: true`. |
| **Outro administrador** | `admintest@email.com` | `@asdfJKLÇ123` | Seed de testes (`005_seed_usuarios_teste.sql`). Admin comum (sem mestre). |

**Bootstrap só para testes** (com header `x-use-test-db: true`): `POST /api/admin/bootstrap` — recria/atualiza o mestre `admin@livraria.com.br` com senha `Admin@123`.

**Cliente de teste (seed):** `clientetest@email.com` / `@asdfJKLÇ123`.

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

## 5. Testes e cobertura

```bash
npm test
npm run test:coverage
```

- Relatório texto no terminal; HTML em `backend/coverage/index.html` (abra no navegador).
- Cenários em linguagem de negócio: [`bdd/README.md`](bdd/README.md) (especificação; a automação está em `src/tests/**`, com pastas por domínio em `integracao/`).
- Detalhes de SQL e modelagem: [`sql/README.md`](sql/README.md).

---

## 6. Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor com hot-reload |
| `npm run build` / `npm start` | Build e produção |
| `npm test` | Testes Jest |
| `npm run test:coverage` | Testes + cobertura |
| `./scripts/setup-db.sh` | DDL/DML/migrations no Postgres dev |
| `./scripts/reset-db.sh` | Limpa volumes Docker e recria banco (ver script) |

---

## 7. Referências

- Rotas HTTP de exemplo: pasta `http/`.
- BDD (cenários): pasta `bdd/`.
- Scripts curl (fluxos): `scripts/curl-*-bdd.sh`.
