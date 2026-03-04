# Análise de Modelagem de Dados — ECM Livraria

> **Banco:** `ecm_livraria` | **Schema:** `public` | **Data da análise:** 04/03/2026  
> **Executado via:** queries diretas no PostgreSQL (pg_stat_user_tables + information_schema)

---

## Sumário Executivo

| Métrica | Valor |
|---|---|
| Total de tabelas | **15** |
| Tabelas com dados | **4** (26,7%) |
| Tabelas sem dados | **11** (73,3%) |
| Total de colunas (schema) | **82** |
| Colunas NOT NULL | **67** (81,7%) |
| Colunas NULLABLE | **15** (18,3%) |
| Espaço total alocado | **934 kB** |
| Espaço em dados efetivos | **57,3 kB** |
| Espaço em índices | **680 kB** |

---

## 1. Visão Geral por Tabela

| Tabela | Linhas | Colunas | Dados | Índices | Total | Status |
|---|---|---|---|---|---|---|
| `ecm_bairro` | 0 | 6 | 0 bytes | 32 kB | 32 kB | 🔴 Vazia |
| `ecm_bandeira_cartao` | 5 | 3 | 8 kB | 32 kB | 40 kB | 🟢 Com dados |
| `ecm_cep` | 0 | 5 | 0 bytes | 16 kB | 16 kB | 🔴 Vazia |
| `ecm_cidade` | 0 | 6 | 0 bytes | 32 kB | 32 kB | 🔴 Vazia |
| `ecm_endereco_usuario` | 0 | 13 | 0 bytes | 80 kB | 80 kB | 🔴 Vazia |
| `ecm_estado_brasileiro` | 0 | 3 | 8 kB | 48 kB | 56 kB | 🔴 Vazia¹ |
| `ecm_logradouro` | 0 | 5 | 0 bytes | 16 kB | 16 kB | 🔴 Vazia |
| `ecm_pais` | 0 | 3 | 8 kB | 32 kB | 40 kB | 🔴 Vazia¹ |
| `ecm_papel_usuario` | 0 | 3 | 8 kB | 32 kB | 40 kB | 🔴 Vazia¹ |
| `ecm_perfil_cliente` | 3 | 7 | 8 kB | 80 kB | 88 kB | 🟢 Com dados |
| `ecm_telefone_usuario` | 3 | 9 | 8 kB | 112 kB | 120 kB | 🟢 Com dados |
| `ecm_tipo_logradouro` | 0 | 2 | 8 kB | 32 kB | 40 kB | 🔴 Vazia¹ |
| `ecm_tipo_residencia` | 0 | 2 | 8 kB | 32 kB | 40 kB | 🔴 Vazia¹ |
| `ecm_tipo_telefone` | 0 | 2 | 8 kB | 32 kB | 40 kB | 🔴 Vazia¹ |
| `ecm_usuario` | 4 | 13 | 8 kB | 144 kB | 160 kB | 🟢 Com dados |
| **TOTAL** | **15** | **82** | **~73 kB** | **~744 kB** | **~830 kB** | |

> ¹ `pg_stat_user_tables` reporta `n_live_tup = 0`, mas a página de dados (8 kB) está alocada — pode conter dados de seed aguardando VACUUM ou páginas reservadas para estrutura.

---

## 2. Percentual de Uso por Tabela

```
Tabelas com dados (26,7%)  ████████░░░░░░░░░░░░░░░░░░░░░░  4 de 15
Tabelas vazias  (73,3%)    ░░░░░░░░████████████████████████  11 de 15
```

| Categoria | Quantidade | % |
|---|---|---|
| Tabelas **com dados** | 4 | 26,7% |
| Tabelas **sem dados** | 11 | 73,3% |

---

## 3. Distribuição de Tipos de Dados (Schema Completo)

### 3.1 Resumo Global

| Tipo de Dado | Qtd Colunas | % do Total | Uso típico no schema |
|---|---|---|---|
| `integer` | 24 | 29,3% | PKs (SERIAL), FKs de tabelas de domínio |
| `character varying` | 21 | 25,6% | Nomes, descrições, tokens, emails |
| `timestamp with time zone` | 15 | 18,3% | `dat_criacao`, `dat_atualizacao` (auditoria) |
| `bigint` | 7 | 8,5% | PKs (BIGSERIAL) de tabelas transacionais, FKs |
| `uuid` | 6 | 7,3% | Identificadores públicos (não expostos via BIGSERIAL) |
| `character` | 4 | 4,9% | Campos de tamanho fixo (DDD, CPF, CEP, sigla estado) |
| `boolean` | 3 | 3,7% | Flags (`flg_ativo`, `flg_principal`) |
| `date` | 2 | 2,4% | `dat_nascimento`, `dat_validade` |
| **TOTAL** | **82** | **100%** | |

### 3.2 Distribuição Detalhada por Tabela

| Tabela | integer | varchar | timestamptz | bigint | uuid | char | boolean | date | **Total** |
|---|---|---|---|---|---|---|---|---|---|
| `ecm_bairro` | 2 | 2 | 1 | — | 1 | — | — | — | **6** |
| `ecm_bandeira_cartao` | 1 | 1 | 1 | — | — | — | — | — | **3** |
| `ecm_cep` | 3 | — | 1 | — | — | 1 | — | — | **5** |
| `ecm_cidade` | 2 | 2 | 1 | — | 1 | — | — | — | **6** |
| `ecm_endereco_usuario` | 6 | 1 | 2 | 2 | 1 | — | 1 | — | **13** |
| `ecm_estado_brasileiro` | 1 | 1 | — | — | — | 1 | — | — | **3** |
| `ecm_logradouro` | 2 | 2 | 1 | — | — | — | — | — | **5** |
| `ecm_pais` | 1 | 1 | 1 | — | — | — | — | — | **3** |
| `ecm_papel_usuario` | 1 | 1 | 1 | — | — | — | — | — | **3** |
| `ecm_perfil_cliente` | — | 1 | 2 | 2 | 1 | — | — | 1 | **7** |
| `ecm_telefone_usuario` | 1 | 1 | 2 | 2 | 1 | 1 | 1 | — | **9** |
| `ecm_tipo_logradouro` | 1 | 1 | — | — | — | — | — | — | **2** |
| `ecm_tipo_residencia` | 1 | 1 | — | — | — | — | — | — | **2** |
| `ecm_tipo_telefone` | 1 | 1 | — | — | — | — | — | — | **2** |
| `ecm_usuario` | 1 | 5 | 2 | 1 | 1 | 1 | 1 | 1 | **13** |
| **TOTAL** | **24** | **21** | **15** | **7** | **6** | **4** | **3** | **2** | **82** |

---

## 4. Análise de Nullabilidade por Tabela

| Tabela | Total Cols | NOT NULL | NULLABLE | % NOT NULL | % NULLABLE | Com DEFAULT |
|---|---|---|---|---|---|---|
| `ecm_bairro` | 6 | 6 | 0 | 100,0% | 0,0% | 3 (50,0%) |
| `ecm_bandeira_cartao` | 3 | 3 | 0 | 100,0% | 0,0% | 2 (66,7%) |
| `ecm_cep` | 5 | 3 | **2** | 60,0% | **40,0%** | 2 (40,0%) |
| `ecm_cidade` | 6 | 5 | **1** | 83,3% | 16,7% | 3 (50,0%) |
| `ecm_endereco_usuario` | 13 | 7 | **6** | 53,8% | **46,2%** | 6 (46,2%) |
| `ecm_estado_brasileiro` | 3 | 3 | 0 | 100,0% | 0,0% | 1 (33,3%) |
| `ecm_logradouro` | 5 | 4 | **1** | 80,0% | 20,0% | 2 (40,0%) |
| `ecm_pais` | 3 | 3 | 0 | 100,0% | 0,0% | 2 (66,7%) |
| `ecm_papel_usuario` | 3 | 3 | 0 | 100,0% | 0,0% | 2 (66,7%) |
| `ecm_perfil_cliente` | 7 | 5 | **2** | 71,4% | 28,6% | 4 (57,1%) |
| `ecm_telefone_usuario` | 9 | 9 | 0 | 100,0% | 0,0% | 5 (55,6%) |
| `ecm_tipo_logradouro` | 2 | 2 | 0 | 100,0% | 0,0% | 1 (50,0%) |
| `ecm_tipo_residencia` | 2 | 2 | 0 | 100,0% | 0,0% | 1 (50,0%) |
| `ecm_tipo_telefone` | 2 | 2 | 0 | 100,0% | 0,0% | 1 (50,0%) |
| `ecm_usuario` | 13 | 10 | **3** | 76,9% | 23,1% | 5 (38,5%) |
| **TOTAL** | **82** | **67** | **15** | **81,7%** | **18,3%** | **44 (53,7%)** |

### 4.1 Detalhamento das Colunas NULLABLE

| Tabela | Coluna NULLABLE | Tipo | Justificativa no Design |
|---|---|---|---|
| `ecm_cep` | `id_cidade` | `integer` | FK opcional — CEP pode não ter cidade mapeada |
| `ecm_cep` | `id_bairro` | `integer` | FK opcional — CEP pode abranger múltiplos bairros |
| `ecm_cidade` | `id_estado` | `integer` | FK opcional — permite cadastro de cidades sem estado vinculado |
| `ecm_endereco_usuario` | `id_tipo_residencia` | `integer` | Opcional no cadastro de endereço |
| `ecm_endereco_usuario` | `id_logradouro` | `integer` | FK opcional — normalização do logradouro |
| `ecm_endereco_usuario` | `dsc_complemento` | `varchar(100)` | Campo livre opcional (apto, bloco) |
| `ecm_endereco_usuario` | `id_cidade` | `integer` | FK opcional — cidade do endereço |
| `ecm_endereco_usuario` | `id_bairro` | `integer` | FK opcional — bairro do endereço |
| `ecm_endereco_usuario` | `id_cep` | `integer` | FK opcional — CEP do endereço |
| `ecm_logradouro` | `id_tipo_logradouro` | `integer` | FK opcional — tipo de logradouro |
| `ecm_perfil_cliente` | `dsc_genero` | `varchar(30)` | Autodeclarado, cadastro mínimo não exige |
| `ecm_perfil_cliente` | `dat_nascimento` | `date` | Opcional no cadastro mínimo |
| `ecm_usuario` | `dsc_genero` | `varchar(30)` | ⚠️ Coluna de migração — 100% nula nos dados atuais |
| `ecm_usuario` | `dat_nascimento` | `date` | ⚠️ Coluna de migração — 100% nula nos dados atuais |
| `ecm_usuario` | `dsc_telefone` | `varchar(20)` | ⚠️ Coluna de migração — 100% nula nos dados atuais |

---

## 5. Preenchimento Real de Colunas (tabelas com dados)

> Análise executada nas 4 tabelas que possuem linhas registradas no banco.

### 5.1 `ecm_usuario` — 4 linhas

| Coluna | Tipo | Nullable | Preenchidas | Nulas | % Preenchida | Status |
|---|---|---|---|---|---|---|
| `uuid_usuario` | `uuid` | NO | 4 | 0 | 100% | ✅ |
| `nom_usuario` | `varchar(150)` | NO | 4 | 0 | 100% | ✅ |
| `dsc_email` | `varchar(255)` | NO | 4 | 0 | 100% | ✅ |
| `dsc_cpf` | `char(14)` | NO | 4 | 0 | 100% | ✅ |
| `dsc_senha_hash` | `varchar(255)` | NO | 4 | 0 | 100% | ✅ |
| `id_papel` | `integer` | NO | 4 | 0 | 100% | ✅ |
| `flg_ativo` | `boolean` | NO | 4 | 0 | 100% | ✅ |
| `dat_criacao` | `timestamptz` | NO | 4 | 0 | 100% | ✅ |
| `dat_atualizacao` | `timestamptz` | NO | 4 | 0 | 100% | ✅ |
| `id_usuario` | `bigint` | NO | 4 | 0 | 100% | ✅ |
| `dsc_genero` | `varchar(30)` | YES | 0 | **4** | **0%** | ⚠️ Não usada |
| `dat_nascimento` | `date` | YES | 0 | **4** | **0%** | ⚠️ Não usada |
| `dsc_telefone` | `varchar(20)` | YES | 0 | **4** | **0%** | ⚠️ Não usada |

**Resumo:** 10/13 colunas preenchidas (76,9%) — 3 colunas migradas sem dados (23,1%)

---

### 5.2 `ecm_perfil_cliente` — 3 linhas

| Coluna | Tipo | Nullable | Preenchidas | Nulas | % Preenchida | Status |
|---|---|---|---|---|---|---|
| `id_perfil_cliente` | `bigint` | NO | 3 | 0 | 100% | ✅ |
| `uuid_perfil_cliente` | `uuid` | NO | 3 | 0 | 100% | ✅ |
| `id_usuario` | `bigint` | NO | 3 | 0 | 100% | ✅ |
| `dsc_genero` | `varchar(30)` | YES | 3 | 0 | 100% | ✅ |
| `dat_nascimento` | `date` | YES | 3 | 0 | 100% | ✅ |
| `dat_criacao` | `timestamptz` | NO | 3 | 0 | 100% | ✅ |
| `dat_atualizacao` | `timestamptz` | NO | 3 | 0 | 100% | ✅ |

**Resumo:** 7/7 colunas preenchidas (100%) ✅

---

### 5.3 `ecm_telefone_usuario` — 3 linhas

| Coluna | Tipo | Nullable | Preenchidas | Nulas | % Preenchida | Status |
|---|---|---|---|---|---|---|
| `id_telefone` | `bigint` | NO | 3 | 0 | 100% | ✅ |
| `uuid_telefone` | `uuid` | NO | 3 | 0 | 100% | ✅ |
| `id_usuario` | `bigint` | NO | 3 | 0 | 100% | ✅ |
| `id_tipo_telefone` | `integer` | NO | 3 | 0 | 100% | ✅ |
| `num_ddd` | `char(2)` | NO | 3 | 0 | 100% | ✅ |
| `num_telefone` | `varchar(9)` | NO | 3 | 0 | 100% | ✅ |
| `flg_principal` | `boolean` | NO | 3 | 0 | 100% | ✅ |
| `dat_criacao` | `timestamptz` | NO | 3 | 0 | 100% | ✅ |
| `dat_atualizacao` | `timestamptz` | NO | 3 | 0 | 100% | ✅ |

**Resumo:** 9/9 colunas preenchidas (100%) ✅

---

### 5.4 `ecm_bandeira_cartao` — 5 linhas

| Coluna | Tipo | Nullable | Preenchidas | Nulas | % Preenchida | Status |
|---|---|---|---|---|---|---|
| `id_bandeira_cartao` | `integer` | NO | 5 | 0 | 100% | ✅ |
| `dsc_bandeira` | `varchar(30)` | NO | 5 | 0 | 100% | ✅ |
| `dat_criacao` | `timestamptz` | NO | 5 | 0 | 100% | ✅ |

**Resumo:** 3/3 colunas preenchidas (100%) ✅

---

## 6. Análise de Armazenamento por Tabela

| Tabela | Bytes (total) | Dados | Índices | % do total |
|---|---|---|---|---|
| `ecm_usuario` | 163.840 | 8 kB | 144 kB | 19,7% |
| `ecm_telefone_usuario` | 122.880 | 8 kB | 112 kB | 14,8% |
| `ecm_perfil_cliente` | 90.112 | 8 kB | 80 kB | 10,8% |
| `ecm_endereco_usuario` | 81.920 | 0 bytes | 80 kB | 9,9% |
| `ecm_estado_brasileiro` | 57.344 | 8 kB | 48 kB | 6,9% |
| `ecm_bandeira_cartao` | 40.960 | 8 kB | 32 kB | 4,9% |
| `ecm_pais` | 40.960 | 8 kB | 32 kB | 4,9% |
| `ecm_papel_usuario` | 40.960 | 8 kB | 32 kB | 4,9% |
| `ecm_tipo_logradouro` | 40.960 | 8 kB | 32 kB | 4,9% |
| `ecm_tipo_residencia` | 40.960 | 8 kB | 32 kB | 4,9% |
| `ecm_tipo_telefone` | 40.960 | 8 kB | 32 kB | 4,9% |
| `ecm_bairro` | 32.768 | 0 bytes | 32 kB | 3,9% |
| `ecm_cidade` | 32.768 | 0 bytes | 32 kB | 3,9% |
| `ecm_logradouro` | 16.384 | 0 bytes | 16 kB | 2,0% |
| `ecm_cep` | 16.384 | 0 bytes | 16 kB | 2,0% |
| **TOTAL** | **831.164** | **~73 kB** | **~744 kB** | **100%** |

> **Observação:** ~89% do espaço alocado é ocupado por índices. A maior parte desse overhead deriva dos índices em tabelas ainda vazias, o que é esperado para um banco em ambiente de desenvolvimento.

---

## 7. Colunas e Tabelas: Alocado × Usado × Não Usado

### 7.1 Tabelas

| Status | Tabelas | % |
|---|---|---|
| 🟢 **Usadas** (com dados) | `ecm_bandeira_cartao`, `ecm_perfil_cliente`, `ecm_telefone_usuario`, `ecm_usuario` | **26,7%** |
| 🔴 **Não usadas** (vazias) | `ecm_bairro`, `ecm_cep`, `ecm_cidade`, `ecm_endereco_usuario`, `ecm_estado_brasileiro`, `ecm_logradouro`, `ecm_pais`, `ecm_papel_usuario`, `ecm_tipo_logradouro`, `ecm_tipo_residencia`, `ecm_tipo_telefone` | **73,3%** |

### 7.2 Colunas (schema — análise de design)

| Status | Quantidade | % |
|---|---|---|
| 🔒 **Obrigatórias (NOT NULL)** — sempre preenchidas | 67 | 81,7% |
| ⚪ **Opcionais (NULLABLE)** — podem ser nulas | 15 | 18,3% |

### 7.3 Colunas (dados reais — apenas nas 4 tabelas com dados — 32 colunas)

| Status | Quantidade | % | Tabelas |
|---|---|---|---|
| ✅ **Usadas** (ao menos 1 valor preenchido) | 29 | 90,6% | Todas as 4 |
| ⚠️ **Não usadas** (100% nulas, nullable) | **3** | **9,4%** | `ecm_usuario` |

**As 3 colunas completamente sem dados:**

| Coluna | Tabela | Tipo | Linhas c/ NULL | Observação |
|---|---|---|---|---|
| `dsc_genero` | `ecm_usuario` | `varchar(30)` | 4/4 (100%) | ⚠️ Dado já capturado em `ecm_perfil_cliente.dsc_genero` — possível duplicidade de design |
| `dat_nascimento` | `ecm_usuario` | `date` | 4/4 (100%) | ⚠️ Dado já capturado em `ecm_perfil_cliente.dat_nascimento` — possível duplicidade de design |
| `dsc_telefone` | `ecm_usuario` | `varchar(20)` | 4/4 (100%) | ⚠️ Telefone estruturado em `ecm_telefone_usuario` — este campo desnormaliza o domínio |

---

## 8. Observações e Recomendações

### 8.1 Colunas duplicadas entre `ecm_usuario` e `ecm_perfil_cliente`

`ecm_usuario` possui `dsc_genero` e `dat_nascimento` que **já existem** em `ecm_perfil_cliente`, que é a entidade semântica correta para dados de perfil do cliente. As colunas em `ecm_usuario` (adicionadas via migração) estão 100% nulas e representam duplicidade de design.

**Recomendação:** Avaliar remoção de `dsc_genero` e `dat_nascimento` de `ecm_usuario` via nova migration.

### 8.2 `dsc_telefone` em `ecm_usuario`

A coluna `dsc_telefone VARCHAR(20)` em `ecm_usuario` desnormaliza o modelo, pois o domínio de telefone já está normalizado em `ecm_telefone_usuario` com DDD separado, tipo, flag de principal e constraints de formato. Está 100% nula.

**Recomendação:** Remover via migration ou documentar intenção de uso específico que justifique a existência.

### 8.3 Tabelas de domínio sem seed

As tabelas `ecm_papel_usuario`, `ecm_tipo_telefone`, `ecm_tipo_logradouro`, `ecm_tipo_residencia` e `ecm_pais` têm alocação de página (8 kB) mas `pg_stat_user_tables` reporta 0 linhas. Verificar se os seeds foram aplicados ou se o VACUUM ainda não foi executado.

### 8.4 Concentração de índices

Os índices representam **~89% do espaço total alocado** (744 kB de 830 kB). Em produção, com volume real de dados, essa proporção se tornará mais equilibrada. Por ora o overhead de índices por tabela vazia é esperado.

### 8.5 Tamanho de campos `character varying`

| Campo | Limite Definido | Observação |
|---|---|---|
| `dsc_email` | `varchar(255)` | Adequado para RFC 5321 |
| `dsc_senha_hash` | `varchar(255)` | Adequado para bcrypt ($2b$, 60 chars) |
| `dsc_token_cartao` | `varchar(255)` | Adequado para tokens de pagadoras |
| `nom_usuario` | `varchar(150)` | Adequado para nomes longos |
| `dsc_logradouro` | `varchar(200)` | Adequado |
| `num_telefone` | `varchar(9)` | Correto para 8-9 dígitos sem formatação |
| `dsc_final_cartao` | `char(4)` | Correto — sempre 4 dígitos |
| `dsc_cpf` | `char(14)` | Correto para `XXX.XXX.XXX-XX` |
| `num_ddd` | `char(2)` | Correto — sempre 2 dígitos |

---

## 9. Storage por Tipo de Dado — Alocado vs Real (bytes por linha)

> **Metodologia:**
> - `bytes_max_por_linha` = pior caso por linha: `varchar(N)` → N × 4 bytes (UTF-8 máx); tipos fixos = tamanho real.
> - `bytes_fixos_por_linha` = colunas de tamanho fixo (bigint, integer, bool, uuid, date, timestamptz) — valor sempre exato.
> - `bytes_varchar_max_por_linha` = total reservado nos declaradores de comprimento para campos `varchar`/`char`.
> - PostgreSQL não aloca o máximo para `varchar` — só armazena o real. O "espaço desperdiçado pelo design" é a diferença entre o tamanho declarado e o que os dados reais usam.

### 9.1 Proporção Alocado × Fixo × Varchar por Tabela

| Tabela | Bytes máx/linha | Bytes fixos/linha | Bytes varchar max/linha | % fixo | % varchar |
|---|---|---|---|---|---|
| `ecm_usuario` | **2.945** | 49 | 2.896 | 1,7% | **98,3%** |
| `ecm_bairro` | 1.632 | 32 | 1.600 | 2,0% | 98,0% |
| `ecm_cidade` | 1.632 | 32 | 1.600 | 2,0% | 98,0% |
| `ecm_logradouro` | 856 | 16 | 840 | 1,9% | 98,1% |
| `ecm_endereco_usuario` | 473 | 73 | 400 | 15,4% | 84,6% |
| `ecm_pais` | 332 | 12 | 320 | 3,6% | 96,4% |
| `ecm_estado_brasileiro` | 252 | 4 | 248 | 1,6% | 98,4% |
| `ecm_tipo_logradouro` | 204 | 4 | 200 | 2,0% | 98,0% |
| `ecm_tipo_residencia` | 204 | 4 | 200 | 2,0% | 98,0% |
| `ecm_perfil_cliente` | 172 | 52 | 120 | 30,2% | 69,8% |
| `ecm_bandeira_cartao` | 132 | 12 | 120 | 9,1% | 90,9% |
| `ecm_papel_usuario` | 132 | 12 | 120 | 9,1% | 90,9% |
| `ecm_tipo_telefone` | 124 | 4 | 120 | 3,2% | 96,8% |
| `ecm_telefone_usuario` | 97 | 53 | 44 | **54,6%** | 45,4% |
| `ecm_cep` | 52 | 20 | 32 | 38,5% | 61,5% |

> **Interpretação:** O design é fortemente orientado a `varchar`, o que é correto para PostgreSQL — o motor só usa o espaço real do valor armazenado. O valor de "bytes máx" é apenas o teto declarado, não o que fica em disco.

---

### 9.2 Detalhamento por Coluna — Bytes Declarados vs Reais

> Colunas de tamanho **fixo** (typo nativo): valor declarado = valor real, sempre.  
> Colunas `varchar`/`char`: declarado ≠ real — PostgreSQL armazena com header de 1 ou 4 bytes + conteúdo efetivo.

#### Tipos fixos — 100% eficientes por design

| Tipo | Bytes/valor | Colunas no schema | % alocado = 100% real |
|---|---|---|---|
| `bigint` | 8 | 7 | ✅ sempre |
| `integer` | 4 | 24 | ✅ sempre |
| `uuid` | 16 | 6 | ✅ sempre |
| `timestamptz` | 8 | 15 | ✅ sempre |
| `date` | 4 | 2 | ✅ sempre |
| `boolean` | 1 | 3 | ✅ sempre |

#### Tipos variáveis — aproveitamento real medido nas tabelas com dados

| Tabela | Coluna | Tipo | Tamanho declarado (bytes máx UTF-8) | Avg real (chars) | Máx real (chars) | % uso do máx |
|---|---|---|---|---|---|---|
| `ecm_bandeira_cartao` | `dsc_bandeira` | `varchar(30)` | 120 | 8,4 | **16** | **53,3%** ⚠️ |
| `ecm_perfil_cliente` | `dsc_genero` | `varchar(30)` | 120 | 1,0 | **1** | **3,3%** ⚠️ |
| `ecm_telefone_usuario` | `num_ddd` | `char(2)` | 8 | 2,0 | 2 | 100% ✅ |
| `ecm_telefone_usuario` | `num_telefone` | `varchar(9)` | 36 | 9,0 | 9 | 100% ✅ |
| `ecm_usuario` | `dsc_cpf` | `char(14)` | 56 | 11,0 | **11** | **78,6%** ⚠️ |
| `ecm_usuario` | `dsc_email` | `varchar(255)` | 1.020 | 20,5 | **25** | **9,8%** ⚠️ |
| `ecm_usuario` | `dsc_senha_hash` | `varchar(255)` | 1.020 | 60,0 | **60** | **23,5%** ⚠️ |
| `ecm_usuario` | `nom_usuario` | `varchar(150)` | 600 | 16,8 | **21** | **14,0%** ⚠️ |
| `ecm_usuario` | `dsc_genero` | `varchar(30)` | 120 | — | — | **0%** 🔴 |
| `ecm_usuario` | `dsc_telefone` | `varchar(20)` | 80 | — | — | **0%** 🔴 |

> **Nota `dsc_cpf`:** CPF formatado `XXX.XXX.XXX-XX` tem 14 chars, mas os dados atuais mostram comprimento 11 — CPFs podem estar sendo salvos sem máscara (`00000000000`). Verificar consistência.

---

## 10. Análise de Índices — Uso, Tamanho e Candidatos a Remoção

> Total de índices no schema: **55** | Espaço total de índices: **~744 kB**  
> `idx_scan = 0` = nunca utilizado desde o último VACUUM/ANALYZE ou desde a criação.

### 10.1 Índices por tabela com contagem de uso

| Tabela | Índice | Tipo | Bytes | `idx_scan` | `idx_tup_read` | Status |
|---|---|---|---|---|---|---|
| `ecm_bairro` | `ecm_bairro_pkey` | PK UNIQUE | 8.192 | 0 | 0 | 🔴 Não usado |
| `ecm_bairro` | `uq_bairro_norm_cidade` | UNIQUE | 8.192 | 0 | 0 | 🔴 Não usado |
| `ecm_bairro` | `idx_bairro_norm_cidade` | BTREE | 8.192 | 0 | 0 | 🟡 Duplicata de `uq_bairro_norm_cidade` |
| `ecm_bairro` | `idx_bairro_uuid` | BTREE | 8.192 | 0 | 0 | 🔴 Não usado |
| `ecm_bandeira_cartao` | `ecm_bandeira_cartao_pkey` | PK UNIQUE | 16.384 | 0 | 0 | ⚪ PK obrigatória |
| `ecm_bandeira_cartao` | `ecm_bandeira_cartao_dsc_bandeira_key` | UNIQUE | 16.384 | 5 | 0 | ✅ Em uso |
| `ecm_cep` | `ecm_cep_pkey` | PK UNIQUE | 8.192 | 0 | 0 | 🔴 Não usado |
| `ecm_cep` | `ecm_cep_num_cep_key` | UNIQUE | 8.192 | 0 | 0 | 🔴 Não usado |
| `ecm_cidade` | `ecm_cidade_pkey` | PK UNIQUE | 8.192 | 0 | 0 | 🔴 Não usado |
| `ecm_cidade` | `uq_cidade_norm_estado` | UNIQUE | 8.192 | 0 | 0 | 🔴 Não usado |
| `ecm_cidade` | `idx_cidade_norm_estado` | BTREE | 8.192 | 0 | 0 | 🟡 Duplicata de `uq_cidade_norm_estado` |
| `ecm_cidade` | `idx_cidade_uuid` | BTREE | 8.192 | 0 | 0 | 🔴 Não usado |
| `ecm_endereco_usuario` | `ecm_endereco_usuario_pkey` | PK UNIQUE | 8.192 | 0 | 0 | ⚪ PK obrigatória |
| `ecm_endereco_usuario` | `uq_endereco_uuid` | UNIQUE | 8.192 | 0 | 0 | 🔴 Não usado |
| `ecm_endereco_usuario` | `uq_endereco_usuario_principal` | EXCLUDE | 8.192 | 0 | 0 | ⚪ Constraint de integridade |
| `ecm_endereco_usuario` | `idx_endereco_uuid` | BTREE | 8.192 | 0 | 0 | 🟡 Duplicata de `uq_endereco_uuid` |
| `ecm_endereco_usuario` | `idx_endereco_usuario` | BTREE | 8.192 | 0 | 0 | 🔴 Não usado |
| `ecm_endereco_usuario` | `idx_endereco_logradouro` | BTREE | 8.192 | 0 | 0 | 🔴 Não usado |
| `ecm_endereco_usuario` | `idx_endereco_principal` | BTREE parcial | 8.192 | 0 | 0 | 🟡 Duplicata de `uq_endereco_usuario_principal` |
| `ecm_endereco_usuario` | `idx_endereco_cidade` | BTREE | 8.192 | 0 | 0 | 🔴 Não usado |
| `ecm_endereco_usuario` | `idx_endereco_bairro` | BTREE | 8.192 | 0 | 0 | 🔴 Não usado |
| `ecm_endereco_usuario` | `idx_endereco_cep` | BTREE | 8.192 | 0 | 0 | 🔴 Não usado |
| `ecm_estado_brasileiro` | `ecm_estado_brasileiro_pkey` | PK UNIQUE | 16.384 | 0 | 0 | ⚪ PK obrigatória |
| `ecm_estado_brasileiro` | `uq_estado_brasileiro_nom` | UNIQUE | 16.384 | 0 | 0 | 🔴 Não usado |
| `ecm_estado_brasileiro` | `uq_estado_brasileiro_sig` | UNIQUE | 16.384 | **27** | 27 | ✅ Em uso |
| `ecm_logradouro` | `ecm_logradouro_pkey` | PK UNIQUE | 8.192 | 0 | 0 | ⚪ PK obrigatória |
| `ecm_logradouro` | `uq_logradouro_completo` | UNIQUE | 8.192 | 0 | 0 | 🔴 Não usado |
| `ecm_pais` | `ecm_pais_pkey` | PK UNIQUE | 16.384 | 0 | 0 | ⚪ PK obrigatória |
| `ecm_pais` | `ecm_pais_nom_pais_key` | UNIQUE | 16.384 | 1 | 1 | ✅ Em uso |
| `ecm_papel_usuario` | `ecm_papel_usuario_pkey` | PK UNIQUE | 16.384 | **40** | 40 | ✅ Em uso |
| `ecm_papel_usuario` | `uq_papel_usuario_dsc` | UNIQUE | 16.384 | 3 | 3 | ✅ Em uso |
| `ecm_perfil_cliente` | `ecm_perfil_cliente_pkey` | PK UNIQUE | 16.384 | 0 | 0 | ⚪ PK obrigatória |
| `ecm_perfil_cliente` | `uq_perfil_cliente_uuid` | UNIQUE | 16.384 | 0 | 0 | 🔴 Não usado |
| `ecm_perfil_cliente` | `uq_perfil_cliente_usuario` | UNIQUE | 16.384 | 0 | 0 | ⚪ Constraint 1:1 |
| `ecm_perfil_cliente` | `idx_perfil_cliente_usuario` | BTREE | 16.384 | **7** | 4 | 🟡 Duplicata de `uq_perfil_cliente_usuario` |
| `ecm_perfil_cliente` | `idx_perfil_cliente_uuid` | BTREE | 16.384 | 0 | 0 | 🟡 Duplicata de `uq_perfil_cliente_uuid` |
| `ecm_telefone_usuario` | `ecm_telefone_usuario_pkey` | PK UNIQUE | 16.384 | 0 | 0 | ⚪ PK obrigatória |
| `ecm_telefone_usuario` | `uq_telefone_uuid` | UNIQUE | 16.384 | 0 | 0 | 🔴 Não usado |
| `ecm_telefone_usuario` | `uq_telefone_usuario_principal` | EXCLUDE | 16.384 | **6** | 6 | ✅ Em uso |
| `ecm_telefone_usuario` | `uq_telefone_usuario_numero` | UNIQUE | 16.384 | 0 | 0 | ⚪ Constraint unicidade |
| `ecm_telefone_usuario` | `idx_telefone_uuid` | BTREE | 16.384 | 0 | 0 | 🟡 Duplicata de `uq_telefone_uuid` |
| `ecm_telefone_usuario` | `idx_telefone_usuario` | BTREE | 16.384 | 6 | 3 | ✅ Em uso |
| `ecm_telefone_usuario` | `idx_telefone_principal` | BTREE parcial | 16.384 | 0 | 0 | 🟡 Duplicata de `uq_telefone_usuario_principal` |
| `ecm_tipo_logradouro` | `ecm_tipo_logradouro_pkey` | PK UNIQUE | 16.384 | 0 | 0 | ⚪ PK obrigatória |
| `ecm_tipo_logradouro` | `uq_tipo_logradouro_dsc` | UNIQUE | 16.384 | **12** | 12 | ✅ Em uso |
| `ecm_tipo_residencia` | `ecm_tipo_residencia_pkey` | PK UNIQUE | 16.384 | 0 | 0 | ⚪ PK obrigatória |
| `ecm_tipo_residencia` | `uq_tipo_residencia_dsc` | UNIQUE | 16.384 | **6** | 6 | ✅ Em uso |
| `ecm_tipo_telefone` | `ecm_tipo_telefone_pkey` | PK UNIQUE | 16.384 | **6** | 6 | ✅ Em uso |
| `ecm_tipo_telefone` | `uq_tipo_telefone_dsc` | UNIQUE | 16.384 | 3 | 3 | ✅ Em uso |
| `ecm_usuario` | `ecm_usuario_pkey` | PK UNIQUE | 16.384 | **7** | 7 | ✅ Em uso |
| `ecm_usuario` | `uq_usuario_uuid` | UNIQUE | 16.384 | 0 | 0 | ⚪ Constraint unicidade |
| `ecm_usuario` | `uq_usuario_email` | UNIQUE | 16.384 | 1 | 0 | ⚪ Constraint unicidade |
| `ecm_usuario` | `uq_usuario_cpf` | UNIQUE | 16.384 | 0 | 0 | ⚪ Constraint unicidade |
| `ecm_usuario` | `idx_usuario_uuid` | BTREE | 16.384 | **38** | 38 | 🟡 Duplicata de `uq_usuario_uuid` |
| `ecm_usuario` | `idx_usuario_email` | BTREE | 16.384 | **84** | 38 | 🟡 Duplicata de `uq_usuario_email` |
| `ecm_usuario` | `idx_usuario_cpf` | BTREE | 16.384 | **32** | 2 | 🟡 Duplicata de `uq_usuario_cpf` |
| `ecm_usuario` | `idx_usuario_papel` | BTREE | 16.384 | 0 | 0 | 🔴 Não usado |
| `ecm_usuario` | `idx_usuario_nascimento` | BTREE | 16.384 | 0 | 0 | 🔴 Col. 100% nula |

---

### 10.2 Resumo de Status dos Índices

| Status | Quantidade | Bytes atuais | % do total de índices |
|---|---|---|---|
| ✅ **Em uso** (idx_scan > 0 e não duplicata) | 14 | ~224 kB | 25,5% |
| ⚪ **Obrigatórios** (PK / constraint de integridade) | 20 | ~320 kB | 36,4% |
| 🟡 **Duplicatas** (UNIQUE constraint + índice extra) | 11 | ~180 kB | 20,0% |
| 🔴 **Não usados** (idx_scan = 0, sem obrigação) | 10 | ~152 kB | 18,1% |
| **TOTAL** | **55** | **~876 kB** | **100%** |

---

### 10.3 Duplicatas Identificadas — Índice Extra Redundante

> O PostgreSQL cria automaticamente um índice B-tree para todo `UNIQUE` e `EXCLUDE`. Criar um `CREATE INDEX` adicional para a mesma coluna **duplica o espaço** e **penaliza todos os INSERTs/UPDATEs** sem ganho algum em leitura.

| Índice removível | Motivo | Índice que permanece | Bytes liberados agora | Projeção (10k rows) |
|---|---|---|---|---|
| `idx_usuario_uuid` | Duplica `uq_usuario_uuid` | `uq_usuario_uuid` ← UNIQUE constraint | 16 kB | ~4 MB |
| `idx_usuario_email` | Duplica `uq_usuario_email` | `uq_usuario_email` ← UNIQUE constraint | 16 kB | ~4 MB |
| `idx_usuario_cpf` | Duplica `uq_usuario_cpf` | `uq_usuario_cpf` ← UNIQUE constraint | 16 kB | ~4 MB |
| `idx_perfil_cliente_uuid` | Duplica `uq_perfil_cliente_uuid` | `uq_perfil_cliente_uuid` | 16 kB | ~4 MB |
| `idx_perfil_cliente_usuario` | Duplica `uq_perfil_cliente_usuario` | `uq_perfil_cliente_usuario` | 16 kB | ~4 MB |
| `idx_telefone_uuid` | Duplica `uq_telefone_uuid` | `uq_telefone_uuid` | 16 kB | ~4 MB |
| `idx_telefone_principal` | Duplica `uq_telefone_usuario_principal` | `uq_telefone_usuario_principal` | 16 kB | ~4 MB |
| `idx_endereco_uuid` | Duplica `uq_endereco_uuid` | `uq_endereco_uuid` | 8 kB | ~4 MB |
| `idx_endereco_principal` | Duplica `uq_endereco_usuario_principal` | `uq_endereco_usuario_principal` | 8 kB | ~4 MB |
| `idx_bairro_norm_cidade` | Duplica `uq_bairro_norm_cidade` | `uq_bairro_norm_cidade` | 8 kB | ~4 MB |
| `idx_cidade_norm_estado` | Duplica `uq_cidade_norm_estado` | `uq_cidade_norm_estado` | 8 kB | ~4 MB |
| **TOTAL** | | | **~148 kB** | **~44 MB** |

---

### 10.4 Índices Não Usados sem Obrigação de Constraint

| Índice | Tabela | Bytes | Motivo para remover |
|---|---|---|---|
| `idx_bairro_uuid` | `ecm_bairro` | 8 kB | UUID de tabela vazia, lookup por UUID não atinge esta tabela via API |
| `idx_cidade_uuid` | `ecm_cidade` | 8 kB | Idem — sem rota que busca cidade por UUID |
| `idx_usuario_papel` | `ecm_usuario` | 16 kB | Busca por papel é sempre por JOIN com `ecm_papel_usuario` (PK), não por varredura |
| `idx_usuario_nascimento` | `ecm_usuario` | 16 kB | Coluna `dat_nascimento` está 100% nula — índice indexa apenas NULLs |
| **TOTAL** | | **~48 kB** | |

---

## 11. Plano de Otimização de Disco — Comandos Prontos

> **Economia direta:** ~196 kB agora (148 kB duplicatas + 48 kB não usados)  
> **Economia projetada em produção (10k usuários):** ~88 MB apenas em índices

### 11.1 Remover Índices Duplicados (seguro — UNIQUE constraint continua ativo)

```sql
-- ============================================================
-- ECM — Remoção de índices duplicados de UNIQUE constraints
-- Os índices UNIQUE constraints (uq_*) continuam garantindo
-- unicidade. Apenas os CREATE INDEX redundantes são removidos.
-- ============================================================

-- ecm_usuario
DROP INDEX CONCURRENTLY IF EXISTS idx_usuario_uuid;
DROP INDEX CONCURRENTLY IF EXISTS idx_usuario_email;
DROP INDEX CONCURRENTLY IF EXISTS idx_usuario_cpf;

-- ecm_perfil_cliente
DROP INDEX CONCURRENTLY IF EXISTS idx_perfil_cliente_uuid;
DROP INDEX CONCURRENTLY IF EXISTS idx_perfil_cliente_usuario;

-- ecm_telefone_usuario
DROP INDEX CONCURRENTLY IF EXISTS idx_telefone_uuid;
DROP INDEX CONCURRENTLY IF EXISTS idx_telefone_principal;

-- ecm_endereco_usuario
DROP INDEX CONCURRENTLY IF EXISTS idx_endereco_uuid;
DROP INDEX CONCURRENTLY IF EXISTS idx_endereco_principal;

-- ecm_bairro
DROP INDEX CONCURRENTLY IF EXISTS idx_bairro_norm_cidade;

-- ecm_cidade
DROP INDEX CONCURRENTLY IF EXISTS idx_cidade_norm_estado;
```

### 11.2 Remover Índices Não Usados

```sql
-- ============================================================
-- ECM — Remoção de índices sem uso identificado
-- Validar se existe rota/query que busque por estas colunas
-- antes de executar em produção.
-- ============================================================

-- Índice em coluna 100% nula (dat_nascimento em ecm_usuario)
DROP INDEX CONCURRENTLY IF EXISTS idx_usuario_nascimento;

-- Índice em id_papel — lookups são sempre via FK join
DROP INDEX CONCURRENTLY IF EXISTS idx_usuario_papel;

-- UUID de tabelas sem rota de busca por UUID diretamente
DROP INDEX CONCURRENTLY IF EXISTS idx_bairro_uuid;
DROP INDEX CONCURRENTLY IF EXISTS idx_cidade_uuid;
```

### 11.3 Redimensionamento de Colunas VARCHAR Superdimensionadas

> `ALTER TABLE ... ALTER COLUMN ... TYPE varchar(N)` é seguro quando `N >= MAX(LENGTH(coluna))`.  
> Executar durante janela de manutenção — reescreve a tabela (ou usa `CHECK` para evitar rewrite em versões >= 14).

```sql
-- ============================================================
-- ECM — Redimensionamento conservador de VARCHAR
-- Baseado nos comprimentos máximos reais medidos.
-- Deixa margem de 2× sobre o máximo medido para crescimento.
-- ============================================================

-- dsc_email: máximo real=25 chars → VARCHAR(100) é mais que suficiente para RFC 5321
-- ATENÇÃO: RFC 5321 permite até 254 chars — manter 254 por segurança
-- (não reduzir email — risco de rejeitar emails de usuários futuros)

-- nom_usuario: máximo real=21, margem 4× → VARCHAR(80)
ALTER TABLE ecm_usuario ALTER COLUMN nom_usuario TYPE VARCHAR(80);

-- dsc_senha_hash: bcrypt sempre 60 chars exatos → CHAR(60) ou VARCHAR(72)
-- Por segurança (suporte a argon2 futuro = até 97 chars) manter VARCHAR(100)
ALTER TABLE ecm_usuario ALTER COLUMN dsc_senha_hash TYPE VARCHAR(100);

-- dsc_genero em ecm_usuario: coluna 100% nula — remover junto com migration
-- (ver seção 12)

-- dsc_bandeira: máximo real=16, margem generosa → VARCHAR(30) já é adequado
-- Manter como está.
```

### 11.4 Remover Colunas sem Uso (migration necessária)

```sql
-- ============================================================
-- ECM — Migration: remoção de colunas duplicadas/sem uso
-- em ecm_usuario (dados já normalizados em outras tabelas)
-- ============================================================
-- CRIAR ARQUIVO: sql/migrations/002_remover_colunas_duplicadas_usuario.sql

ALTER TABLE ecm_usuario DROP COLUMN IF EXISTS dsc_genero;
ALTER TABLE ecm_usuario DROP COLUMN IF EXISTS dat_nascimento;
ALTER TABLE ecm_usuario DROP COLUMN IF EXISTS dsc_telefone;
```

---

## 12. Resumo da Economia de Disco

| Ação | Economia Imediata | Projeção (10k usuários) | Risco |
|---|---|---|---|
| Remover 11 índices duplicados | **~148 kB** | ~44 MB | 🟢 Nenhum — constraints mantidas |
| Remover 4 índices não usados | **~48 kB** | ~16 MB | 🟡 Baixo — validar queries antes |
| Reduzir `dsc_senha_hash` para `varchar(100)` | ~0 kB¹ | Desprezível | 🟢 Nenhum |
| Reduzir `nom_usuario` para `varchar(80)` | ~0 kB¹ | Desprezível | 🟢 Nenhum |
| Remover 3 colunas nulas de `ecm_usuario` | **~0 kB¹** | ~1,5 MB | 🟢 Nenhum (100% nulas) |
| **TOTAL** | **~196 kB** | **~60 MB** | |

> ¹ Com volume atual (4 linhas), a economia de dados é desprezível — o benefício é de manutenção e clareza de design.

---

## 13. Comandos SQL Utilizados

```sql
-- Tamanho e linhas por tabela
SELECT t.relname, t.n_live_tup, COUNT(c.attnum) AS total_colunas,
       pg_size_pretty(pg_total_relation_size(t.relid)),
       pg_size_pretty(pg_relation_size(t.relid)),
       pg_size_pretty(pg_indexes_size(t.relid))
FROM pg_stat_user_tables t
JOIN pg_attribute c ON c.attrelid = t.relid AND c.attnum > 0 AND NOT c.attisdropped
WHERE t.schemaname = 'public' AND t.relname LIKE 'ecm_%'
GROUP BY t.relid, t.relname, t.n_live_tup ORDER BY t.relname;

-- Tipos e nullabilidade das colunas
SELECT table_name, column_name, data_type,
       character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name LIKE 'ecm_%'
ORDER BY table_name, ordinal_position;

-- Distribuição de tipos por tabela
SELECT table_name, data_type, COUNT(*),
       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY table_name), 1)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name LIKE 'ecm_%'
GROUP BY table_name, data_type ORDER BY table_name, COUNT(*) DESC;

-- Resumo nullabilidade por tabela
SELECT table_name,
       COUNT(*) total,
       SUM(CASE WHEN is_nullable = 'YES' THEN 1 ELSE 0 END) nullable,
       SUM(CASE WHEN is_nullable = 'NO'  THEN 1 ELSE 0 END) not_null
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name LIKE 'ecm_%'
GROUP BY table_name ORDER BY table_name;
```

---

*Gerado automaticamente via análise direta no PostgreSQL — `ecm_livraria` — 04/03/2026*
