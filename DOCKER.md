# Docker Compose - Backend

Este projeto usa Docker Compose para gerenciar o backend em ambiente de desenvolvimento.

## Serviços

- **ecm_app**: Container do backend Node/Express (porta 3000)
- **ecm_postgres**: Container do PostgreSQL (porta 5432)
- **ecm_redis**: Container do Redis (porta 6379)

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
