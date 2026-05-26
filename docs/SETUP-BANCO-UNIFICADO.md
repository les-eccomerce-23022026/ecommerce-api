# Setup Unificado do Banco de Dados

## Visão Geral

Este projeto agora utiliza um script unificado de setup do banco de dados que funciona tanto para o ambiente de desenvolvimento quanto para o ambiente de teste. As migrations são compartilhadas entre ambos os ambientes - você só precisa alterar o parâmetro de ambiente.

## Como Usar

### Setup do Banco de Desenvolvimento

```bash
cd backend
./scripts/setup-db.sh --env dev
```

### Setup do Banco de Testes

```bash
cd backend
./scripts/setup-db.sh --env test
```

Ou usando o wrapper simplificado:

```bash
cd backend
./scripts/setup-test-db.sh
```

## Como Funciona

O script `setup-db.sh` agora aceita o parâmetro `--env` que define qual banco configurar:

- `--env dev`: Configura o banco `ecm_livraria` (localhost:5432)
- `--env test`: Configura o banco `ecm_livraria_test` (localhost:5433)

Baseado no ambiente selecionado, o script usa automaticamente as credenciais corretas definidas em `scripts/config/credentials.sh`.

## Vantagens

1. **Migrations Compartilhadas**: As migrations em `sql/migrations/` são aplicadas em ambos os ambientes. Quando você corrige uma migration, a correção se aplica automaticamente a ambos.

2. **Sem Scripts de Sincronização**: Não é mais necessário usar `sync-db-test.sh` para copiar o banco de desenvolvimento para o teste. Cada ambiente aplica as mesmas migrations independentemente.

3. **Paridade Garantida**: Como ambos os ambientes aplicam as mesmas migrations, você garante que o schema do teste espelha exatamente o desenvolvimento.

4. **Simplicidade**: Um único comando para configurar qualquer ambiente.

## Estrutura de Arquivos

```
backend/
├── scripts/
│   ├── setup-db.sh              # Script unificado (aceita --env dev/test)
│   ├── setup-test-db.sh         # Wrapper que chama setup-db.sh --env test
│   ├── config/
│   │   └── credentials.sh       # Credenciais de ambos os ambientes
│   └── lib/
│       ├── db-utils.sh          # Funções utilitárias de banco
│       ├── colors.sh            # Cores para output
│       └── logger.sh            # Logging
└── sql/
    └── migrations/              # Migrations compartilhadas (dev + test)
```

## Troubleshooting

### Erro: "Banco de dados não está pronto após timeout"

Verifique se o container Docker do banco está rodando:

```bash
# Banco de desenvolvimento
docker ps | grep ecm_postgres

# Banco de testes
docker ps | grep ecm_postgres_test
```

### Erro: "Ambiente inválido: X. Use 'dev' ou 'test'."

Certifique-se de usar exatamente `dev` ou `test` como valor do parâmetro `--env`.

### Migration Falhou

Se uma migration falhar, verifique o log gerado em `logs/setup-db-{env}-{timestamp}.log` para detalhes do erro.

## Próximos Passos

Após configurar o banco:

1. **Desenvolvimento**: Inicie a aplicação com `npm run dev`
2. **Testes**: Execute os testes com `npm test` ou os scripts de teste E2E

## Nota sobre sync-db-test.sh

O script `sync-db-test.sh` foi removido pois não é mais necessário. Use `setup-db.sh --env test` para configurar o banco de testes com as migrations mais recentes.
