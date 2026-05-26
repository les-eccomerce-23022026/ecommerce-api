# Migration 048: Adicionar Campo Escopo em admin_lojas

## Status: ✅ CONCLUÍDA COM SUCESSO

**Data:** 2025-05-25  
**Número da Migration:** 048  
**Arquivo:** `sql/migrations/048_adicionar_escopo_admin_lojas.sql`

---

## Objetivo

Adicionar suporte a dois níveis de administração na tabela `livraria_gestao.admin_lojas`:

- **SISTEMA**: Administrador do sistema (super admin, acesso global)
- **LOJA**: Administrador de loja (acesso apenas à loja atribuída)

---

## Alterações Realizadas

### 1. Coluna Adicionada

```sql
adl_escopo VARCHAR(20) NOT NULL DEFAULT 'LOJA'
```

- **Tipo:** VARCHAR(20)
- **Nullable:** NOT NULL
- **Padrão:** 'LOJA'
- **Descrição:** Define o escopo de acesso do administrador

### 2. Constraint CHECK

```sql
CONSTRAINT ck_admin_lojas_escopo_valido 
CHECK (adl_escopo IN ('SISTEMA', 'LOJA'))
```

- **Nome:** `ck_admin_lojas_escopo_valido`
- **Validação:** Apenas valores 'SISTEMA' ou 'LOJA' são permitidos
- **Teste:** ✅ Validado com tentativa de inserção de valor inválido

### 3. Índice de Performance

```sql
CREATE INDEX idx_admin_lojas_escopo 
ON livraria_gestao.admin_lojas(adl_escopo)
```

- **Nome:** `idx_admin_lojas_escopo`
- **Tipo:** BTREE
- **Propósito:** Otimizar queries que filtram por escopo

---

## Estrutura Final da Tabela

```
Table "livraria_gestao.admin_lojas"

Colunas:
  adl_id          bigint (PK)
  usu_id          bigint (FK → usuarios)
  loj_id          bigint (FK → lojas)
  adl_papel       character varying(20)
  adl_ativo       boolean (DEFAULT true)
  adl_criado_em   timestamp with time zone (DEFAULT now())
  adl_escopo      character varying(20) (DEFAULT 'LOJA', NOT NULL) ← NOVO

Constraints:
  PRIMARY KEY: admin_lojas_pkey (adl_id)
  UNIQUE: uq_admin_loja (usu_id, loj_id)
  CHECK: ck_admin_lojas_escopo_valido (adl_escopo IN ('SISTEMA', 'LOJA')) ← NOVO

Índices:
  idx_admin_lojas_escopo (btree) ← NOVO
```

---

## Procedimento de Execução

### Pré-Migration
```bash
npm run db:snapshot:historico
# Snapshot: schema_20260525_224833.sql
```

### Execução
```bash
docker exec -i ecm_postgres psql -U ecm_user -d ecm_livraria < sql/migrations/048_adicionar_escopo_admin_lojas.sql
```

**Resultado:**
```
BEGIN
ALTER TABLE
ALTER TABLE
CREATE INDEX
COMMIT
```

### Pós-Migration
```bash
npm run db:snapshot
# Canônico: schema_canonico.sql
# Histórico: schema_20260525_224850.sql
```

---

## Testes Realizados

### ✅ Teste 1: Coluna Criada com Padrão Correto
```sql
SELECT column_name, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'livraria_gestao' 
  AND table_name = 'admin_lojas' 
  AND column_name = 'adl_escopo';
```

**Resultado:**
```
column_name | column_default            | is_nullable
adl_escopo  | 'LOJA'::character varying | NO
```

### ✅ Teste 2: Constraint CHECK Criada
```sql
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_schema = 'livraria_gestao' 
  AND table_name = 'admin_lojas' 
  AND constraint_name LIKE '%escopo%';
```

**Resultado:**
```
constraint_name              | constraint_type
ck_admin_lojas_escopo_valido | CHECK
```

### ✅ Teste 3: Constraint Validando Corretamente
```sql
INSERT INTO livraria_gestao.admin_lojas 
(usu_id, loj_id, adl_papel, adl_escopo) 
VALUES (1, 1, 'GERENTE', 'INVALIDO');
```

**Resultado (Esperado - Erro):**
```
ERROR: new row for relation "admin_lojas" violates check constraint "ck_admin_lojas_escopo_valido"
DETAIL: Failing row contains (8, 1, 1, GERENTE, t, 2026-05-26 01:49:31.65017+00, INVALIDO).
```

---

## Rollback

Se necessário restaurar o estado anterior:

```bash
# 1. Limpar banco
docker exec ecm_postgres psql -U ecm_user -d postgres -c "DROP DATABASE ecm_livraria;"
docker exec ecm_postgres psql -U ecm_user -d postgres -c "CREATE DATABASE ecm_livraria;"

# 2. Restaurar snapshot histórico
cat sql/snapshots/historico/schema_20260525_224833.sql | \
  docker exec -i ecm_postgres psql -U ecm_user -d ecm_livraria
```

---

## Próximos Passos

### Backend (TypeScript)

1. **Criar constantes de escopo:**
   ```typescript
   // src/shared/constants/escopoAdmin.ts
   export const ESCOPO_ADMIN = {
     SISTEMA: 'SISTEMA',
     LOJA: 'LOJA',
   } as const;
   
   export type EscopoAdmin = typeof ESCOPO_ADMIN[keyof typeof ESCOPO_ADMIN];
   ```

2. **Implementar validação em repositório:**
   ```typescript
   // src/modules/admin/repositorios/RepositorioAdminLojas.ts
   async obterPorId(adlId: number): Promise<AdminLoja | null> {
     const resultado = await this.pool.query(
       'SELECT * FROM livraria_gestao.admin_lojas WHERE adl_id = $1',
       [adlId]
     );
     return resultado.rows[0] || null;
   }
   ```

3. **Implementar middleware de autorização:**
   ```typescript
   // src/shared/middlewares/autorizacaoAdmin.ts
   export function autorizacaoAdmin(escopoRequerido: EscopoAdmin) {
     return (req: Request, res: Response, next: NextFunction) => {
       const adminLojas = req.usuario.adminLojas;
       
       if (escopoRequerido === ESCOPO_ADMIN.SISTEMA) {
         if (!adminLojas.some(al => al.adlEscopo === ESCOPO_ADMIN.SISTEMA)) {
           return res.status(403).json({ erro: 'Acesso negado' });
         }
       }
       
       next();
     };
   }
   ```

4. **Criar testes:**
   - Testes unitários para validação de escopo
   - Testes de integração para endpoints de admin
   - Testes de autorização com diferentes escopos

### Documentação

1. Atualizar `documentacao-exigida/REGRAS-NEGOCIOS.md` com:
   - Definição de ESCOPO_SISTEMA vs ESCOPO_LOJA
   - Regras de acesso por escopo
   - Exemplos de uso

2. Criar ADR em `documentacao-exigida/adr/` documentando:
   - Decisão de usar VARCHAR(20) vs ENUM
   - Justificativa para dois níveis de escopo
   - Impacto em autorização

---

## Artefatos Gerados

- ✅ `sql/migrations/048_adicionar_escopo_admin_lojas.sql` — Migration
- ✅ `sql/migrations/048_adicionar_escopo_admin_lojas.txt` — Log de execução
- ✅ `sql/migrations/048_EXECUTION_LOG.txt` — Log detalhado
- ✅ `sql/migrations/048_SUMMARY.md` — Este arquivo
- ✅ `sql/snapshots/historico/schema_20260525_224833.sql` — Snapshot pré-migration
- ✅ `sql/snapshots/historico/schema_20260525_224850.sql` — Snapshot pós-migration
- ✅ `sql/snapshots/schema_canonico.sql` — Schema atualizado

---

## Conformidade com Padrões

- ✅ **backend/sql/AGENTS.md**: Snapshot preventivo realizado
- ✅ **Código em Português**: Nomes de colunas, constraints e índices em português
- ✅ **Linguagem Ubíqua**: Uso de termos de domínio (admin, escopo, loja)
- ✅ **Segurança**: Constraint CHECK garante integridade de dados
- ✅ **Performance**: Índice criado para otimizar queries
- ✅ **Documentação**: Logs e resumo detalhado gerados

---

**Executado por:** Backend Agent (Node.js/Express)  
**Data:** 2025-05-25 22:48:50 UTC  
**Versão do PostgreSQL:** 15.x  
**Status Final:** ✅ PRONTO PARA PRODUÇÃO
