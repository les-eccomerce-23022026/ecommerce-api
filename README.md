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
# Iniciar todos os serviços (app + postgres + redis)
docker compose up -d

# Parar todos os serviços
docker compose down

# Reiniciar o backend após alterações
docker compose restart app

# Reconstruir e iniciar (quando há alterações no Dockerfile)
docker compose up -d --build app
```

**NÃO rode o backend diretamente no host com `npm run dev` quando estiver usando Docker.** Isso causa conflitos de porta (3000) e inconsistência entre o código no host e o container.

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
