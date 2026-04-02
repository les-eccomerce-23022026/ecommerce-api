# Implementação do Módulo de Livros e Estoque

## Visão Geral

Esta implementação adiciona o catálogo de livros e controle de estoque ao sistema de e-commerce, seguindo os princípios:

- **3NF**: Normalização completa dos dados
- **Separação Catálogo/Operação**: Dados imutáveis (catálogo) separados de dados mutáveis (estoque, preços)
- **Trigramas**: Busca fuzzy em colunas de texto
- **Nomenclatura**: Tabelas no plural, sem prefixo `ecm_`

---

## Arquivos Criados

### 1. Migration 014 - Tabelas de Livros e Estoque

**Arquivo:** `backend/sql/migrations/014_criar_tabelas_livros_e_estoque.sql`

**Tabelas Criadas:**

| Tabela | Domínio | Descrição |
|--------|---------|-----------|
| `autores` | Catálogo | Autores de livros |
| `editoras` | Catálogo | Editoras de livros |
| `categorias` | Catálogo | Categorias de livros |
| `grupos_precificacao` | Catálogo | Grupos de margem de lucro |
| `fornecedores` | Operação | Fornecedores para entrada de estoque |
| `livros` | Catálogo | Entidade central de catálogo |
| `livro_categorias` | Catálogo | Relacionamento N:N livros-categorias |
| `estoques` | Operação | Controle de estoque e preços (1:1 com livros) |
| `historico_entradas_estoque` | Operação | Histórico para cálculo de custo médio (RN0051) |
| `avaliacoes_livro` | Catálogo | Avaliações de usuários (RN0068) |

**Triggers Implementadas:**

- `tg_autores_normalizar` - Normaliza nome de autor
- `tg_editoras_normalizar` - Normaliza nome de editora
- `tg_categorias_normalizar` - Normaliza nome de categoria
- `tg_livros_normalizar` - Normaliza título de livro
- `tg_fornecedores_normalizar` - Normaliza nome de fornecedor
- `tg_*_atualizado_em` - Atualiza timestamp automaticamente

**Índices Gin (Trigramas):**

- `idx_autores_nome_norm`
- `idx_editoras_nome_norm`
- `idx_categorias_nome_norm`
- `idx_livros_titulo_norm`
- `idx_fornecedores_nome_norm`

---

### 2. Seed 007 - Dados Iniciais de Livros

**Arquivo:** `backend/sql/modelagem-dados/dml/007_seed_livros_mock.sql`

**Dados Inseridos:**

| Entidade | Quantidade |
|----------|------------|
| Grupos de Precificação | 4 (Varejo, Atacado, Técnico, Promocional) |
| Autores | 7 (Tolkien, Machado de Assis, Frank Herbert, George Orwell, J.K. Rowling, Markus Zusak, Robert C. Martin) |
| Editoras | 6 (HarperCollins, Penguin Classics, Intrínseca, Companhia das Letras, Rocco, Alta Books) |
| Categorias | 9 (Fantasia, Ficção Científica, Clássicos, Distopia, Literatura Brasileira, Negócios, Tecnologia, Aventura, Young Adult) |
| Fornecedores | 3 |
| Livros | 10 (do mock `homeCatalogoMock.json`) |
| Relacionamento Livro-Categorias | 20 (2 categorias por livro) |
| Estoques | 10 (1 por livro) |
| Histórico de Entradas | 10 (entrada inicial por livro) |

**Livros Inseridos:**

1. O Senhor dos Anéis: A Sociedade do Anel - R$ 79,90
2. Dom Casmurro - R$ 29,90
3. Duna - R$ 79,90
4. 1984 - R$ 39,90
5. O Hobbit - R$ 49,90
6. O Silmarillion - R$ 59,90
7. A Revolução dos Bichos - R$ 34,90
8. Código Limpo - R$ 85,00
9. Harry Potter e a Pedra Filosofal - R$ 44,90
10. A Menina que Roubava Livros - R$ 49,90

---

### 3. Migration 015 - Padronização de Vendas

**Arquivo:** `backend/sql/migrations/015_padronizar_nomenclatura_vendas.sql`

**Alterações:**

1. Renomeação de tabelas:
   - `ecm_venda` → `vendas`
   - `ecm_item_venda` → `itens_venda`

2. Adição de FK direta:
   - `itens_venda.liv_id` → `livros.liv_id`

3. Atualização de FKs dependentes:
   - `pagamento.ven_id` agora referencia `vendas.ven_id`
   - `entregas.ven_id` agora referencia `vendas.ven_id`

---

### 4. Diagrama ER Atualizado

**Arquivo:** `backend/sql/schema_ecm_v2.puml`

**Novos Domínios Adicionados:**

- `catalogo` (#E8D5FF) - Tabelas de catálogo (Read-Heavy)
- `operacao` (#FFE5CC) - Tabelas de operação (Write-Heavy)
- `vendas_pagamentos_entregas` (#E8F5E9) - Módulo de vendas

---

## Ordem de Execução

```bash
# 1. Executar migration 014 (cria tabelas de livros)
psql -d ecm_db -f backend/sql/migrations/014_criar_tabelas_livros_e_estoque.sql

# 2. Executar seed 007 (popula dados de livros)
psql -d ecm_db -f backend/sql/modelagem-dados/dml/007_seed_livros_mock.sql

# 3. Executar migration 015 (padroniza vendas)
psql -d ecm_db -f backend/sql/migrations/015_padronizar_nomenclatura_vendas.sql
```

---

## Regras de Negócio Atendidas

| RN | Descrição | Implementação |
|----|-----------|---------------|
| RN0013 | Cálculo de preço de venda | Campo `gpr_margem_lucro_percentual` em `grupos_precificacao` |
| RN0051 | Custo médio de estoque | Tabela `historico_entradas_estoque` para cálculo |
| RN0068 | Avaliação de livros | Tabela `avaliacoes_livro` com nota 1-5 |

---

## Estrutura de Dados

### Separação Catálogo vs Operação

```
┌─────────────────────────────────────────────────────────────┐
│                    CATÁLOGO (Read-Heavy)                    │
│  autores, editoras, categorias, livros, livro_categorias    │
│  → Dados imutáveis, alta leitura, baixa escrita             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   OPERAÇÃO (Write-Heavy)                    │
│  estoques, historico_entradas_estoque, fornecedores         │
│  → Dados mutáveis, transações financeiras, concorrência     │
└─────────────────────────────────────────────────────────────┘
```

### Relacionamentos Principais

```
autores (1) ──< livros (1) >── editoras
                         │
                         ├──> grupos_precificacao
                         │
                         ├──> livro_categorias >── categorias
                         │
                         ├──> estoques (1:1)
                         │
                         ├──> historico_entradas_estoque
                         │
                         └──> avaliacoes_livro >── usuarios

livros (1) ──< itens_venda >── vendas >── usuarios
```

---

## Validação Pós-Execução

```sql
-- Verificar quantidade de registros por tabela
SELECT 
    'autores' as tabela, COUNT(*) as registros FROM autores
UNION ALL SELECT 'editoras', COUNT(*) FROM editoras
UNION ALL SELECT 'categorias', COUNT(*) FROM categorias
UNION ALL SELECT 'grupos_precificacao', COUNT(*) FROM grupos_precificacao
UNION ALL SELECT 'fornecedores', COUNT(*) FROM fornecedores
UNION ALL SELECT 'livros', COUNT(*) FROM livros
UNION ALL SELECT 'livro_categorias', COUNT(*) FROM livro_categorias
UNION ALL SELECT 'estoques', COUNT(*) FROM estoques
UNION ALL SELECT 'historico_entradas_estoque', COUNT(*) FROM historico_entradas_estoque
UNION ALL SELECT 'avaliacoes_livro', COUNT(*) FROM avaliacoes_livro;

-- Testar busca fuzzy com trigrama
SELECT liv_titulo, liv_isbn 
FROM livros 
WHERE liv_titulo_norm ILIKE '%SENHOR DOS ANEIS%';

-- Verificar estoque de um livro específico
SELECT 
    l.liv_titulo,
    e.etq_quantidade_disponivel,
    e.etq_preco_venda,
    e.etq_valor_custo_atual
FROM livros l
JOIN estoques e ON l.liv_id = e.liv_id
WHERE l.liv_titulo ILIKE '%harry potter%';
```

---

## Próximos Passos

1. Implementar triggers para cálculo automático de custo médio (RN0051)
2. Criar views para consultas frequentes do catálogo
3. Implementar API endpoints para CRUD de livros
4. Adicionar testes de integração para o módulo
