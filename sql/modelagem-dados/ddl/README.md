# DDLs do Sistema E-Commerce de Livros (LES)

Este diretório contém os scripts de definição de dados (DDL) para o sistema de e-commerce de livros.

## Visão Geral

Os DDLs são responsáveis por criar a estrutura de tabelas e objetos do banco de dados, seguindo o padrão DDD (Domain-Driven Design) com schemas separados por domínio.

## DDLs Atuais

### 012_criar_tabelas_motivos_troca_devolucao.sql
**Descrição:** Cria tabelas de motivos de troca e devolução
**Schema:** livraria_comercial
**Tabelas criadas:**
- `motivos_troca` - Motivos pelos quais clientes podem solicitar troca
- `motivos_devolucao` - Motivos pelos quais clientes podem solicitar devolução

**Campos principais:**
- UUID público (mtr_uuid, mde_uuid)
- Descrição do motivo
- Status ativo/inativo
- Timestamp de criação

**Dependências:** Nenhuma

---

### 013_criar_tabela_transportadoras.sql
**Descrição:** Cria tabela de transportadoras
**Schema:** livraria_logistica
**Tabelas criadas:**
- `transportadoras` - Transportadoras disponíveis para entrega

**Campos principais:**
- UUID público (tra_uuid)
- Nome da transportadora
- Código interno (ex: COR, SED, LOG)
- Status ativo/inativo
- Timestamp de criação

**Dependências:** Nenhuma

---

### 014_criar_tabela_status_rastreamento.sql
**Descrição:** Cria tabela de status de rastreamento
**Schema:** livraria_logistica
**Tabelas criadas:**
- `status_rastreamento` - Status possíveis para rastreamento de entregas

**Campos principais:**
- UUID público (sra_uuid)
- Código do status (ex: POSTADO, EM_TRANSITO)
- Descrição do status
- Ordem na timeline (para ordenação)
- Status ativo/inativo
- Timestamp de criação

**Dependências:** Nenhuma

---

### 015_criar_tabela_tipos_cupom.sql
**Descrição:** Cria tabela de tipos de cupom
**Schema:** livraria_comercial
**Tabelas criadas:**
- `tipos_cupom` - Tipos de cupom disponíveis no sistema

**Campos principais:**
- UUID público (tpc_uuid)
- Código do tipo (ex: PERCENTUAL, FIXO, FRETE_GRATIS)
- Descrição do tipo
- Status ativo/inativo
- Timestamp de criação

**Dependências:** Nenhuma

---

### 016_criar_tabela_status_cupom.sql
**Descrição:** Cria tabela de status de cupom
**Schema:** livraria_comercial
**Tabelas criadas:**
- `status_cupom` - Status possíveis para cupons de desconto

**Campos principais:**
- UUID público (scu_uuid)
- Código do status (ex: ATIVO, EXPIRADO, USADO, CANCELADO)
- Descrição do status
- Status ativo/inativo
- Timestamp de criação

**Dependências:** Nenhuma

---

## Ordem de Execução

Os DDLs devem ser executados em ordem numérica para respeitar dependências:

1. `000_instalar_extensoes.sql`
2. `001_criar_tipos_referencia.sql`
3. `002_criar_tabela_usuario.sql`
4. `003_criar_tabela_perfil_cliente.sql`
5. `004_criar_tabela_telefone_usuario.sql`
6. `005_criar_tabela_cidade_bairro.sql`
7. `006_criar_tabelas_normalizacao_extra.sql`
8. `007_criar_tabela_endereco_usuario.sql`
9. `008_criar_tabela_bandeira_cartao.sql`
10. `009_criar_tabela_cartao_usuario.sql`
11. `010_criar_tabela_configuracoes.sql`
12. `011_remover_coluna_ddd_telefone.sql`
13. `012_criar_tabelas_motivos_troca_devolucao.sql` ⭐ NOVO
14. `013_criar_tabela_transportadoras.sql` ⭐ NOVO
15. `014_criar_tabela_status_rastreamento.sql` ⭐ NOVO
16. `015_criar_tabela_tipos_cupom.sql` ⭐ NOVO
17. `016_criar_tabela_status_cupom.sql` ⭐ NOVO

## Padrões de Implementação

Todos os DDLs seguem os seguintes padrões:

- **UUID Público:** Todas as tabelas têm um campo UUID público gerado com `gen_random_uuid()`
- **Índices:** Índices criados para campos frequentemente consultados
- **Comentários:** Tabelas e colunas têm comentários descritivos
- **IF NOT EXISTS:** Tabelas são criadas apenas se não existirem (idempotência)
- **Schemas DDD:** Tabelas organizadas por domínio (livraria_comercial, livraria_logistica, etc.)

## Execução Automática

Use o script de implantação consolidado para executar todos os DDLs em ordem:

```bash
./scripts/implantar-sistema-completo.sh --env dev
```

Ou execute individualmente:

```bash
docker exec -i ecm_postgres psql -U ecm_user -d ecm_livraria < sql/modelagem-dados/ddl/012_criar_tabelas_motivos_troca_devolucao.sql
```
