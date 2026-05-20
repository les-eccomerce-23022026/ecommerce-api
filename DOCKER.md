# Docker Compose - Backend

Este projeto usa Docker Compose para gerenciar o backend em ambiente de desenvolvimento.

## Serviços

- **ecm_app**: Container do backend Node/Express
- **ecm_postgres**: Container do PostgreSQL (porta 5432)

## Contrato de portas (evitar descompasso)

| Variável | Onde vale | Padrão | Uso |
|----------|-----------|--------|-----|
| `PORTA_HTTP` | Container / host sem Docker | `3000` | Porta em que o Express **escuta** (`server.ts`) |
| `PORTA_HTTP_EXTERNA` | Host (Docker dev) | `3002` | Porta que você usa no browser/curl (`localhost:3002`) |
| `PORTA_HTTP_TEST_EXTERNA` | Host (Docker test) | `3003` | Stack `docker-compose.test.yml` |

O `docker-compose.yml` publica **`${PORTA_HTTP_EXTERNA}:${PORTA_HTTP}`** (ex.: `3002:3000`).  
Se alterar `PORTA_HTTP` no `.env`, **não** é preciso editar o compose — só recriar o container.

**URLs:**

- API com Docker: `http://localhost:${PORTA_HTTP_EXTERNA:-3002}/api`
- API sem Docker (host): `http://localhost:${PORTA_HTTP:-3000}/api`

O healthcheck do serviço `app` valida HTTP na `PORTA_HTTP` **dentro** do container; se o mapeamento estiver errado, o container fica `unhealthy`.

## Comandos Principais

### Iniciar todos os serviços
```bash
docker compose up -d
```

### Parar todos os serviços
```bash
docker compose down
```

### Reiniciar o backend após alterações
```bash
docker compose restart app
```

### Reconstruir e iniciar (quando há alterações no Dockerfile)
```bash
docker compose up -d --build app
```

### Ver logs do backend
```bash
docker logs ecm_app -f
```

### Executar comandos dentro do container
```bash
docker exec -it ecm_app sh
```

## Importante

**NÃO rode o backend diretamente no host com `npm run dev` quando estiver usando Docker.** Isso causa conflitos de porta (3000) e inconsistência entre o código no host e o container.

Sempre use `docker compose` para gerenciar o backend em ambiente de desenvolvimento.

## Troubleshooting

### `curl` retorna "Conexão fechada" na porta externa

Quase sempre é **mapeamento host ≠ porta do Express**:

```bash
docker port ecm_app
# Deve mostrar: 3000/tcp -> 0.0.0.0:3002 (ou sua PORTA_HTTP_EXTERNA)

docker logs ecm_app | tail -5
# Deve mostrar: Servidor iniciado na porta 3000 (ou seu PORTA_HTTP)
```

Confira `.env`: `PORTA_HTTP` (dentro do container) e `PORTA_HTTP_EXTERNA` (no host). Após mudar:

```bash
docker compose up -d app
```

### Porta 3000 já em uso
Se receber erro "address already in use", significa que o backend está rodando diretamente no host. Pare o processo:
```bash
pkill -f "ts-node-dev.*server.ts"
```

Depois inicie o container:
```bash
docker compose up -d app
```

### Alterações no código não são refletidas
O container usa volumes para montar o código do host, então alterações devem ser refletidas automaticamente. Se não estiverem, reinicie o container:
```bash
docker compose restart app
```

### Erro de permissão no PostgreSQL
Se houver erro de permissão ao acessar o banco, verifique se o container `ecm_postgres` está rodando:
```bash
docker ps | grep ecm_postgres
```

Se não estiver, inicie todos os serviços:
```bash
docker compose up -d
```
