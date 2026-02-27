# sql/ — Administração do Banco de Dados

Diretório centralizado para todos os scripts SQL do projeto ECM (e-commerce de livros).  
Banco de dados alvo: **PostgreSQL 15+**.

---

## Estrutura de diretórios

```
sql/
├── ddl/          ← Criação de estruturas (tabelas, índices, triggers, constraints)
│   ├── 001_criar_tipos_referencia.sql
│   ├── 002_criar_tabela_usuario.sql
│   ├── 003_criar_tabela_perfil_cliente.sql
│   ├── 004_criar_tabela_telefone_usuario.sql
│   ├── 005_criar_tabela_endereco_usuario.sql
│   ├── 006_criar_tabela_cidade_bairro.sql
│   └── 007_criar_tabelas_normalizacao_extra.sql
├── dml/          ← Dados iniciais / seeds
│   ├── 001_seeds_tipos_referencia.sql
│   ├── 002_seed_usuario_admin_inicial.sql
│   └── 003_seeds_normalizacao_extra.sql
├── migrations/   ← Scripts de migração para alterações de schema
│   └── 001_migra_cidade_bairro_backfill.sql
├── schema_ecm.puml ← Diagrama ER do schema em PlantUML
└── README.md
```

---

## Convenção de nomenclatura (trigrama `ecm_`)

Todas as tabelas usam o prefixo **`ecm_`** (iniciais do sistema).  
As colunas seguem um prefixo semântico de tipo:

| Prefixo | Tipo                              | Exemplo                        |
|---------|-----------------------------------|--------------------------------|
| `id_`   | Chave primária interna (serial)   | `id_usuario`, `id_papel`       |
| `uuid_` | Identificador público (UUID v4)   | `uuid_usuario`, `uuid_endereco`|
| `nom_`  | Nome próprio de pessoa ou lugar   | `nom_usuario`, `nom_cidade`    |
| `dsc_`  | Texto descritivo / valor canônico | `dsc_email`, `dsc_senha_hash`  |
| `num_`  | Número (CEP, DDD, número)         | `num_cep`, `num_ddd`           |
| `dat_`  | Data ou timestamp                 | `dat_criacao`, `dat_nascimento`|
| `flg_`  | Booleano / flag                   | `flg_ativo`, `flg_principal`   |
| `sig_`  | Sigla / abreviatura               | `sig_estado`                   |

> **Regra de ouro:** `id_*` é **interno** — nunca exposto nas rotas HTTP.  
> `uuid_*` é **público** — único valor de identidade retornado pela API.

---

## Modelo de entidades (ER textual)

```
ecm_papel_usuario ──────────────────────────────┐
                                                 │ 1:N
ecm_usuario (id, uuid, nome, email, cpf, hash) ◄─┘
        │
        ├── 1:1 ──► ecm_perfil_cliente  (genero, data_nascimento)
        │
        ├── 1:N ──► ecm_telefone_usuario (ddd, numero, tipo_telefone)
        │                   FK ──► ecm_tipo_telefone
        │
        └── 1:N ──► ecm_endereco_usuario (logradouro, complemento, cidade, bairro, cep, pais)
                        FK ──► ecm_tipo_residencia
                        FK ──► ecm_logradouro
                        FK ──► ecm_cidade
                        FK ──► ecm_bairro
                        FK ──► ecm_cep
                        FK ──► ecm_pais
                        FK ──► ecm_pais
                        FK ──► ecm_cep
                        FK ──► ecm_logradouro
```

### Decisões de normalização

- **Sem grupos de repetição:** telefones e endereços são tabelas separadas com FK para `ecm_usuario`, não colunas multi-valoradas.
- **Sem strings de domínio fixo:** `tipo_telefone`, `tipo_logradouro`, `tipo_residencia`, `estado` e `papel_usuario` são normalizados em tabelas de referência — eliminando `'celular'`, `'SP'`, `'admin'` espalhados como literais.
- **Normalização completa de endereços:** Todos os componentes textuais do endereço (logradouro, cidade, bairro, CEP, país) foram movidos para tabelas separadas (`ecm_logradouro`, `ecm_cidade`, `ecm_bairro`, `ecm_cep`, `ecm_pais`) para eliminar redundância total e garantir consistência de dados.
- **Soft delete via flag:** `flg_ativo` em `ecm_usuario` implementa inativação sem apagar dados (RF0023).
- **Trigger de auditoria:** `ecm_fn_atualizar_dat_atualizacao()` mantém `dat_atualizacao` sincronizado automaticamente em toda tabela que precise de auditoria.

---

## Ordem de execução

Execute os scripts **na ordem numérica**:

```bash
# DDL — cria estrutura
psql $DATABASE_URL -f sql/ddl/001_criar_tipos_referencia.sql
psql $DATABASE_URL -f sql/ddl/002_criar_tabela_usuario.sql
psql $DATABASE_URL -f sql/ddl/003_criar_tabela_perfil_cliente.sql
psql $DATABASE_URL -f sql/ddl/004_criar_tabela_telefone_usuario.sql
psql $DATABASE_URL -f sql/ddl/005_criar_tabela_endereco_usuario.sql
psql $DATABASE_URL -f sql/ddl/006_criar_tabela_cidade_bairro.sql
psql $DATABASE_URL -f sql/ddl/007_criar_tabelas_normalizacao_extra.sql

# DML — popula referências e admin inicial
psql $DATABASE_URL -f sql/dml/001_seeds_tipos_referencia.sql
psql $DATABASE_URL -f sql/dml/002_seed_usuario_admin_inicial.sql
psql $DATABASE_URL -f sql/dml/003_seeds_normalizacao_extra.sql

# Migrations — aplicam alterações de schema (opcional, se houver dados existentes)
psql $DATABASE_URL -f sql/migrations/001_migra_cidade_bairro_backfill.sql
```

Todos os scripts são **idempotentes** (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).

---

## Diagrama ER (PlantUML)

O arquivo `schema_ecm.puml` contém o diagrama entidade-relacionamento completo do banco de dados em formato PlantUML. Para visualizar:

```bash
# Instalar PlantUML (se não tiver)
sudo apt install plantuml

# Gerar PNG do diagrama
plantuml sql/schema_ecm.puml

# Ou usar online: https://www.plantuml.com/plantuml
```

O diagrama mostra todas as 14 tabelas com seus relacionamentos, chaves primárias, estrangeiras e restrições de unicidade.

---

## Segurança

- O arquivo `002_seed_usuario_admin_inicial.sql` contém apenas o **hash bcrypt** da senha de bootstrap (`Admin@123`). A senha nunca é armazenada em texto plano.
- Após o primeiro deploy, o administrador deve alterar a senha via rota autenticada.
- Variáveis de conexão (`POSTGRES_URL` ou individuais) devem ser configuradas via `.env` e nunca versionadas.
