# Seed de Vendas Históricas - Guia de Execução

## Visão Geral

Este documento descreve como executar o seed de vendas históricas de forma consistente e determinística, garantindo que os dados de vendas sempre sejam criados na mesma loja, independente do ambiente ou estado atual do banco.

## Arquitetura de Multi-Tenancy

O sistema usa multi-tenancy com lojas (loj_id) para isolar dados. Cada venda, item de venda e estoque está vinculado a uma loja específica.

### Problema Original

Antes da correção, o seed de vendas históricas usava a primeira loja ativa (`loj_ativo = TRUE`) como destino dos dados. Isso causava inconsistências:

- **Ambiente A**: Loja ativa = loj_id 4 → vendas criadas na loja 4
- **Ambiente B**: Loja ativa = loj_id 12 → vendas criadas na loja 12
- **Resultado**: Dados inconsistentes entre ambientes

### Solução Implementada

**UUID Fixo Determinístico para Loja Padrão**

- **UUID da Loja Padrão**: `82c0a24c-4cf4-4b12-823a-f1a8b9a086c3`
- **Nome**: Loja Padrão
- **Slug**: `loja-padrao`

O seed de vendas históricas (`070_seed_vendas_historicas_13_meses.sql`) agora:

1. Busca a loja pelo UUID fixo (não pela primeira loja ativa)
2. Garante que a Loja Padrão esteja ativa
3. Cria todas as vendas históricas na Loja Padrão
4. Loga o UUID e loj_id para rastreabilidade

## Execução do Seed

### Pré-requisitos

1. **Banco de dados rodando**: Docker container `ecm_postgres` deve estar ativo
2. **Migration de lojas executada**: A migration `050_seed_multi_tenant_completo.sql` deve ter sido executada para criar a Loja Padrão
3. **Dados de referência**: Categorias, livros e usuários devem existir

### Execução

```bash
cd backend

# Executar o seed de vendas históricas
docker exec -i ecm_postgres psql -U ecm_user -d ecm_livraria < sql/migrations/070_seed_vendas_historicas_13_meses.sql
```

### Saída Esperada

```
BEGIN
NOTICE:  Usando loj_id=4 (UUID: 82c0a24c-4cf4-4b12-823a-f1a8b9a086c3) para seed de vendas históricas
DO
INSERT 0 325
INSERT 0 630
UPDATE 325
NOTICE:  Seed concluído: 325 vendas e 630 itens gerados (loj_id=4, UUID=82c0a24c-4cf4-4b12-823a-f1a8b9a086c3)
DO
COMMIT
```

### Limpeza (Reexecução)

Para reexecutar o seed, primeiro limpe os dados existentes:

```bash
# Limpar itens de venda e vendas do período
docker exec ecm_postgres psql -U ecm_user -d ecm_livraria -c "
  DELETE FROM livraria_comercial.itens_venda 
  WHERE ven_id IN (
    SELECT ven_id FROM livraria_comercial.vendas 
    WHERE ven_criado_em >= '2025-05-01' 
      AND ven_criado_em <= '2026-05-31'
  );
  DELETE FROM livraria_comercial.vendas 
  WHERE ven_criado_em >= '2025-05-01' 
    AND ven_criado_em <= '2026-05-31';
"
```

## Verificação

### Verificar Loja Padrão

```bash
docker exec ecm_postgres psql -U ecm_user -d ecm_livraria -c "
  SELECT loj_id, loj_uuid, loj_nome, loj_ativo 
  FROM livraria_gestao.lojas 
  WHERE loj_uuid = '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3';
"
```

### Verificar Vendas Criadas

```bash
docker exec ecm_postgres psql -U ecm_user -d ecm_livraria -c "
  SELECT COUNT(*) 
  FROM livraria_comercial.vendas 
  WHERE ven_criado_em >= '2025-05-01' 
    AND ven_criado_em <= '2026-05-31' 
    AND loj_id = 4;
"
```

### Verificar Status das Vendas

```bash
docker exec ecm_postgres psql -U ecm_user -d ecm_livraria -c "
  SELECT stv_descricao, COUNT(*) 
  FROM livraria_comercial.vendas v
  JOIN livraria_comercial.status_venda s ON v.stv_id = s.stv_id
  WHERE v.ven_criado_em >= '2025-05-01' 
    AND v.ven_criado_em <= '2026-05-31' 
    AND v.loj_id = 4
  GROUP BY stv_descricao;
"
```

## Configuração do Frontend

Para que o frontend use a Loja Padrão, configure o cookie `x-loja-uuid`:

```javascript
// No frontend (Next.js)
document.cookie = 'x-loja-uuid=82c0a24c-4cf4-4b12-823a-f1a8b9a086c3; path=/; max-age=31536000';
```

Ou configure via header em requisições API:

```javascript
headers: {
  'x-loja-uuid': '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'
}
```

## Migrações Relacionadas

- **050_seed_multi_tenant_completo.sql**: Cria a Loja Padrão com UUID fixo
- **070_seed_vendas_historicas_13_meses.sql**: Cria vendas históricas na Loja Padrão

## Boas Práticas

1. **Sempre use o UUID fixo**: Não altere o UUID da Loja Padrão
2. **Execute migrations em ordem**: 050 → 070
3. **Verifique logs**: O seed loga o loj_id e UUID usados
4. **Teste após execução**: Verifique se os dados foram criados corretamente
5. **Documente alterações**: Se precisar alterar o UUID, atualize este documento e todas as migrations dependentes

## Troubleshooting

### Erro: "Loja Padrão não encontrada"

**Causa**: A migration 050 não foi executada

**Solução**: Execute a migration 050 primeiro

```bash
docker exec -i ecm_postgres psql -U ecm_user -d ecm_livraria < sql/migrations/050_seed_multi_tenant_completo.sql
```

### Erro: "Nenhuma loja ativa encontrada"

**Causa**: A Loja Padrão foi desativada

**Solução**: Reative a Loja Padrão

```bash
docker exec ecm_postgres psql -U ecm_user -d ecm_livraria -c "
  UPDATE livraria_gestao.lojas 
  SET loj_ativo = TRUE 
  WHERE loj_uuid = '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3';
"
```

### Dados não aparecem no frontend

**Causa**: O cookie `x-loja-uuid` está configurado para outra loja

**Solução**: Configure o cookie para o UUID da Loja Padrão

```javascript
document.cookie = 'x-loja-uuid=82c0a24c-4cf4-4b12-823a-f1a8b9a086c3; path=/; max-age=31536000';
```

## Referências

- Migration de lojas: `sql/migrations/050_seed_multi_tenant_completo.sql`
- Migration de vendas: `sql/migrations/070_seed_vendas_historicas_13_meses.sql`
- Middleware de contexto: `src/shared/middlewares/contextoLoja.middleware.ts`
- Repositório de vendas: `src/modules/vendas/repositories/RepositorioVendasPostgres.ts`
