-- Migration: 014_criar_tabelas_livros_e_estoque.sql
-- Descrição: Cria tabelas para catálogo de livros e controle de estoque (Sprint 4)
-- Data: 2026-03-26
--
-- Padrão de nomenclatura adotado:
--   - Tabelas no plural, sem prefixo 'ecm_'
--   - Prefixos de colunas: aut_ (autor), edi_ (editora), cat_ (categoria),
--     liv_ (livro), lct_ (livro_categoria), gpr_ (grupo_precificacao),
--     etq_ (estoque — evita colisão com estados.est_), hee_ (historico_entrada), for_ (fornecedor), avl_ (avaliacao)
--
-- Princípios:
--   - 3NF: Separação de entidades (autores, editoras, categorias)
--   - Separação Catálogo (Read-Heavy) vs Operação (Write-Heavy)
--   - Trigramas em colunas de texto para busca fuzzy
--   - FK direta de itens_venda.liv_id para livros.liv_id

-- =============================================================================
-- Tabela: autores
-- =============================================================================
CREATE TABLE IF NOT EXISTS livraria_comercial.autores (
    aut_id          SERIAL          PRIMARY KEY,
    aut_uuid        UUID            NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    aut_nome        VARCHAR(200)    NOT NULL,
    aut_nome_norm   VARCHAR(200)    NOT NULL,
    aut_descricao   TEXT,
    aut_ativo       BOOLEAN         NOT NULL DEFAULT TRUE,
    aut_criado_em   TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    aut_atualizado_em TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE livraria_comercial.autores                    IS 'Catálogo de autores de livros.';
COMMENT ON COLUMN livraria_comercial.autores.aut_id            IS 'Identificador interno do autor.';
COMMENT ON COLUMN livraria_comercial.autores.aut_uuid          IS 'Identificador público UUID do autor.';
COMMENT ON COLUMN livraria_comercial.autores.aut_nome          IS 'Nome completo do autor.';
COMMENT ON COLUMN livraria_comercial.autores.aut_nome_norm     IS 'Nome normalizado para busca (sem acentos, maiúsculas).';
COMMENT ON COLUMN livraria_comercial.autores.aut_descricao     IS 'Biografia/descrição do autor.';
COMMENT ON COLUMN livraria_comercial.autores.aut_ativo         IS 'Flag indicando se autor está ativo no catálogo.';

CREATE INDEX IF NOT EXISTS idx_autores_nome_norm ON livraria_comercial.autores USING gin (aut_nome_norm gin_trgm_ops);


-- =============================================================================
-- Tabela: editoras
-- =============================================================================
CREATE TABLE IF NOT EXISTS livraria_comercial.editoras (
    edi_id          SERIAL          PRIMARY KEY,
    edi_uuid        UUID            NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    edi_nome        VARCHAR(200)    NOT NULL,
    edi_nome_norm   VARCHAR(200)    NOT NULL,
    edi_cnpj        VARCHAR(18),
    edi_ativo       BOOLEAN         NOT NULL DEFAULT TRUE,
    edi_criado_em   TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    edi_atualizado_em TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE livraria_comercial.editoras                     IS 'Catálogo de editoras de livros.';
COMMENT ON COLUMN livraria_comercial.editoras.edi_id             IS 'Identificador interno da editora.';
COMMENT ON COLUMN livraria_comercial.editoras.edi_uuid           IS 'Identificador público UUID da editora.';
COMMENT ON COLUMN livraria_comercial.editoras.edi_nome           IS 'Nome da editora.';
COMMENT ON COLUMN livraria_comercial.editoras.edi_nome_norm      IS 'Nome normalizado para busca (sem acentos, maiúsculas).';
COMMENT ON COLUMN livraria_comercial.editoras.edi_cnpj           IS 'CNPJ da editora.';
COMMENT ON COLUMN livraria_comercial.editoras.edi_ativo          IS 'Flag indicando se editora está ativa no catálogo.';

CREATE INDEX IF NOT EXISTS idx_editoras_nome_norm ON livraria_comercial.editoras USING gin (edi_nome_norm gin_trgm_ops);


-- =============================================================================
-- Tabela: categorias
-- =============================================================================
CREATE TABLE IF NOT EXISTS livraria_comercial.categorias (
    cat_id          SERIAL          PRIMARY KEY,
    cat_uuid        UUID            NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    cat_nome        VARCHAR(100)    NOT NULL UNIQUE,
    cat_nome_norm   VARCHAR(100)    NOT NULL,
    cat_descricao   VARCHAR(500),
    cat_ativo       BOOLEAN         NOT NULL DEFAULT TRUE,
    cat_criado_em   TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE livraria_comercial.categorias                   IS 'Catálogo de categorias de livros.';
COMMENT ON COLUMN livraria_comercial.categorias.cat_id           IS 'Identificador interno da categoria.';
COMMENT ON COLUMN livraria_comercial.categorias.cat_uuid         IS 'Identificador público UUID da categoria.';
COMMENT ON COLUMN livraria_comercial.categorias.cat_nome         IS 'Nome da categoria.';
COMMENT ON COLUMN livraria_comercial.categorias.cat_nome_norm    IS 'Nome normalizado para busca (sem acentos, maiúsculas).';
COMMENT ON COLUMN livraria_comercial.categorias.cat_descricao    IS 'Descrição da categoria.';
COMMENT ON COLUMN livraria_comercial.categorias.cat_ativo        IS 'Flag indicando se categoria está ativa.';

CREATE INDEX IF NOT EXISTS idx_categorias_nome_norm ON livraria_comercial.categorias USING gin (cat_nome_norm gin_trgm_ops);


-- =============================================================================
-- Tabela: grupos_precificacao
-- =============================================================================
CREATE TABLE IF NOT EXISTS livraria_comercial.grupos_precificacao (
    gpr_id                  SERIAL          PRIMARY KEY,
    gpr_uuid                UUID            NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    gpr_descricao           VARCHAR(100)    NOT NULL UNIQUE,
    gpr_margem_lucro_percentual DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (gpr_margem_lucro_percentual >= 0),
    gpr_ativo               BOOLEAN         NOT NULL DEFAULT TRUE,
    gpr_criado_em           TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE livraria_comercial.grupos_precificacao                  IS 'Grupos de precificação para cálculo de preços de venda.';
COMMENT ON COLUMN livraria_comercial.grupos_precificacao.gpr_id          IS 'Identificador interno do grupo.';
COMMENT ON COLUMN livraria_comercial.grupos_precificacao.gpr_uuid        IS 'Identificador público UUID do grupo.';
COMMENT ON COLUMN livraria_comercial.grupos_precificacao.gpr_descricao   IS 'Descrição do grupo (ex.: Varejo, Atacado, Técnico).';
COMMENT ON COLUMN livraria_comercial.grupos_precificacao.gpr_margem_lucro_percentual IS 'Margem de lucro percentual padrão do grupo.';
COMMENT ON COLUMN livraria_comercial.grupos_precificacao.gpr_ativo       IS 'Flag indicando se grupo está ativo.';


-- =============================================================================
-- Tabela: fornecedores
-- =============================================================================
CREATE TABLE IF NOT EXISTS livraria_comercial.fornecedores (
    for_id          SERIAL          PRIMARY KEY,
    for_uuid        UUID            NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    for_nome        VARCHAR(200)    NOT NULL,
    for_nome_norm   VARCHAR(200)    NOT NULL,
    for_cnpj        VARCHAR(18),
    for_email       VARCHAR(255),
    for_telefone    VARCHAR(20),
    for_ativo       BOOLEAN         NOT NULL DEFAULT TRUE,
    for_criado_em   TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    for_atualizado_em TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE livraria_comercial.fornecedores                 IS 'Cadastro de fornecedores para entrada de estoque.';
COMMENT ON COLUMN livraria_comercial.fornecedores.for_id         IS 'Identificador interno do fornecedor.';
COMMENT ON COLUMN livraria_comercial.fornecedores.for_uuid       IS 'Identificador público UUID do fornecedor.';
COMMENT ON COLUMN livraria_comercial.fornecedores.for_nome       IS 'Nome do fornecedor.';
COMMENT ON COLUMN livraria_comercial.fornecedores.for_nome_norm  IS 'Nome normalizado para busca.';
COMMENT ON COLUMN livraria_comercial.fornecedores.for_cnpj       IS 'CNPJ do fornecedor.';
COMMENT ON COLUMN livraria_comercial.fornecedores.for_email      IS 'Email para contato.';
COMMENT ON COLUMN livraria_comercial.fornecedores.for_telefone   IS 'Telefone para contato.';
COMMENT ON COLUMN livraria_comercial.fornecedores.for_ativo      IS 'Flag indicando se fornecedor está ativo.';

CREATE INDEX IF NOT EXISTS idx_fornecedores_nome_norm ON livraria_comercial.fornecedores USING gin (for_nome_norm gin_trgm_ops);


-- =============================================================================
-- Tabela: livros (Entidade central de catálogo - Read-Heavy)
-- =============================================================================
CREATE TABLE IF NOT EXISTS livraria_comercial.livros (
    liv_id              BIGSERIAL       PRIMARY KEY,
    liv_uuid            UUID            NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    liv_titulo          VARCHAR(300)    NOT NULL,
    liv_titulo_norm     VARCHAR(300)    NOT NULL,
    liv_ano             INTEGER         NOT NULL CHECK (liv_ano >= 1900 AND liv_ano <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    liv_edicao          VARCHAR(50),
    liv_isbn            VARCHAR(20)     NOT NULL UNIQUE,
    liv_numero_paginas  INTEGER         CHECK (liv_numero_paginas > 0),
    liv_sinopse         TEXT,
    liv_altura          DECIMAL(5,2)    CHECK (liv_altura > 0),  -- em cm
    liv_largura         DECIMAL(5,2)    CHECK (liv_largura > 0), -- em cm
    liv_peso            DECIMAL(6,3)    CHECK (liv_peso > 0),    -- em kg
    liv_profundidade    DECIMAL(5,2)    CHECK (liv_profundidade > 0), -- em cm
    liv_codigo_barras   VARCHAR(20)     UNIQUE,
    
    -- FKs para tabelas de apoio
    aut_id              INTEGER         NOT NULL REFERENCES livraria_comercial.autores(aut_id),
    edi_id              INTEGER         NOT NULL REFERENCES livraria_comercial.editoras(edi_id),
    gpr_id              INTEGER         NOT NULL REFERENCES livraria_comercial.grupos_precificacao(gpr_id),
    
    liv_ativo           BOOLEAN         NOT NULL DEFAULT TRUE,
    liv_imagem_url      VARCHAR(500),
    liv_criado_em       TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    liv_atualizado_em   TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE livraria_comercial.livros                       IS 'Catálogo central de livros (dados imutáveis do produto).';
COMMENT ON COLUMN livraria_comercial.livros.liv_id               IS 'Identificador interno do livro.';
COMMENT ON COLUMN livraria_comercial.livros.liv_uuid             IS 'Identificador público UUID do livro.';
COMMENT ON COLUMN livraria_comercial.livros.liv_titulo           IS 'Título completo do livro.';
COMMENT ON COLUMN livraria_comercial.livros.liv_titulo_norm      IS 'Título normalizado para busca (sem acentos, maiúsculas).';
COMMENT ON COLUMN livraria_comercial.livros.liv_ano              IS 'Ano de publicação.';
COMMENT ON COLUMN livraria_comercial.livros.liv_edicao           IS 'Número/ano da edição (ex.: "3ª edição").';
COMMENT ON COLUMN livraria_comercial.livros.liv_isbn             IS 'ISBN do livro (único).';
COMMENT ON COLUMN livraria_comercial.livros.liv_numero_paginas   IS 'Número total de páginas.';
COMMENT ON COLUMN livraria_comercial.livros.liv_sinopse          IS 'Sinopse/descrição do livro.';
COMMENT ON COLUMN livraria_comercial.livros.liv_altura           IS 'Altura do livro em cm.';
COMMENT ON COLUMN livraria_comercial.livros.liv_largura          IS 'Largura do livro em cm.';
COMMENT ON COLUMN livraria_comercial.livros.liv_peso             IS 'Peso do livro em kg.';
COMMENT ON COLUMN livraria_comercial.livros.liv_profundidade     IS 'Profundidade do livro em cm.';
COMMENT ON COLUMN livraria_comercial.livros.liv_codigo_barras    IS 'Código de barras EAN/UPC.';
COMMENT ON COLUMN livraria_comercial.livros.aut_id               IS 'FK para autor principal.';
COMMENT ON COLUMN livraria_comercial.livros.edi_id               IS 'FK para editora.';
COMMENT ON COLUMN livraria_comercial.livros.gpr_id               IS 'FK para grupo de precificação.';
COMMENT ON COLUMN livraria_comercial.livros.liv_ativo            IS 'Flag indicando se livro está ativo no catálogo.';
COMMENT ON COLUMN livraria_comercial.livros.liv_imagem_url       IS 'URL da imagem de capa do livro.';

CREATE INDEX IF NOT EXISTS idx_livros_titulo_norm ON livraria_comercial.livros USING gin (liv_titulo_norm gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_livros_isbn ON livraria_comercial.livros(liv_isbn);
CREATE INDEX IF NOT EXISTS idx_livros_autor ON livraria_comercial.livros(aut_id);
CREATE INDEX IF NOT EXISTS idx_livros_editora ON livraria_comercial.livros(edi_id);
CREATE INDEX IF NOT EXISTS idx_livros_grupo_precificacao ON livraria_comercial.livros(gpr_id);


-- =============================================================================
-- Tabela: livro_categorias (Tabela associativa N:N)
-- =============================================================================
CREATE TABLE IF NOT EXISTS livraria_comercial.livro_categorias (
    lct_id          SERIAL          PRIMARY KEY,
    liv_id          BIGINT          NOT NULL REFERENCES livraria_comercial.livros(liv_id) ON DELETE CASCADE,
    cat_id          INTEGER         NOT NULL REFERENCES livraria_comercial.categorias(cat_id) ON DELETE CASCADE,
    lct_criado_em   TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_livro_categoria UNIQUE (liv_id, cat_id)
);

COMMENT ON TABLE livraria_comercial.livro_categorias           IS 'Tabela associativa para relacionamento N:N entre livros e categorias.';
COMMENT ON COLUMN livraria_comercial.livro_categorias.lct_id   IS 'Identificador interno do relacionamento.';
COMMENT ON COLUMN livraria_comercial.livro_categorias.liv_id   IS 'FK para livro.';
COMMENT ON COLUMN livraria_comercial.livro_categorias.cat_id   IS 'FK para categoria.';

CREATE INDEX IF NOT EXISTS idx_livro_categorias_livro ON livraria_comercial.livro_categorias(liv_id);
CREATE INDEX IF NOT EXISTS idx_livro_categorias_categoria ON livraria_comercial.livro_categorias(cat_id);


-- =============================================================================
-- Tabela: estoques (Operação - Write-Heavy)
-- =============================================================================
CREATE TABLE IF NOT EXISTS livraria_comercial.estoques (
    etq_id                      BIGSERIAL       PRIMARY KEY,
    etq_uuid                    UUID            NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    liv_id                      BIGINT          NOT NULL UNIQUE REFERENCES livraria_comercial.livros(liv_id) ON DELETE CASCADE,
    etq_quantidade_disponivel   INTEGER         NOT NULL DEFAULT 0 CHECK (etq_quantidade_disponivel >= 0),
    etq_quantidade_reservada    INTEGER         NOT NULL DEFAULT 0 CHECK (etq_quantidade_reservada >= 0),
    etq_preco_venda             DECIMAL(10,2)   NOT NULL CHECK (etq_preco_venda >= 0),
    etq_valor_custo_atual       DECIMAL(10,2)   CHECK (etq_valor_custo_atual >= 0),
    etq_ultimo_custo_calculado  TIMESTAMPTZ,
    etq_ativo                   BOOLEAN         NOT NULL DEFAULT TRUE,
    etq_criado_em               TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    etq_atualizado_em           TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE livraria_comercial.estoques                         IS 'Controle de estoque e preços por livro (dados operacionais mutáveis).';
COMMENT ON COLUMN livraria_comercial.estoques.etq_id                 IS 'Identificador interno do estoque.';
COMMENT ON COLUMN livraria_comercial.estoques.etq_uuid               IS 'Identificador público UUID do estoque.';
COMMENT ON COLUMN livraria_comercial.estoques.liv_id                 IS 'FK única para livro (relacionamento 1:1).';
COMMENT ON COLUMN livraria_comercial.estoques.etq_quantidade_disponivel IS 'Quantidade disponível para venda.';
COMMENT ON COLUMN livraria_comercial.estoques.etq_quantidade_reservada  IS 'Quantidade reservada para pedidos em andamento.';
COMMENT ON COLUMN livraria_comercial.estoques.etq_preco_venda        IS 'Preço de venda atual (calculado via RN0013).';
COMMENT ON COLUMN livraria_comercial.estoques.etq_valor_custo_atual  IS 'Custo unitário atual do livro.';
COMMENT ON COLUMN livraria_comercial.estoques.etq_ultimo_custo_calculado IS 'Data do último cálculo de custo (média ponderada).';
COMMENT ON COLUMN livraria_comercial.estoques.etq_ativo              IS 'Flag indicando se registro de estoque está ativo.';

CREATE INDEX IF NOT EXISTS idx_estoques_livro ON livraria_comercial.estoques(liv_id);


-- =============================================================================
-- Tabela: historico_entradas_estoque (Suporte RN0051)
-- =============================================================================
CREATE TABLE IF NOT EXISTS livraria_comercial.historico_entradas_estoque (
    hee_id              BIGSERIAL       PRIMARY KEY,
    hee_uuid            UUID            NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    liv_id              BIGINT          NOT NULL REFERENCES livraria_comercial.livros(liv_id),
    for_id              INTEGER         NOT NULL REFERENCES livraria_comercial.fornecedores(for_id),
    hee_quantidade      INTEGER         NOT NULL CHECK (hee_quantidade > 0),
    hee_valor_custo_unitario DECIMAL(10,2) NOT NULL CHECK (hee_valor_custo_unitario >= 0),
    hee_valor_total     DECIMAL(10,2)   NOT NULL CHECK (hee_valor_total >= 0),
    hee_data_entrada    TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hee_numero_nota_fiscal VARCHAR(50),
    hee_observacoes     TEXT,
    hee_criado_em       TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE livraria_comercial.historico_entradas_estoque         IS 'Histórico de entradas de estoque para cálculo de custo médio (RN0051).';
COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.hee_id         IS 'Identificador interno do registro.';
COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.hee_uuid       IS 'Identificador público UUID do registro.';
COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.liv_id         IS 'FK para livro.';
COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.for_id         IS 'FK para fornecedor.';
COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.hee_quantidade IS 'Quantidade recebida.';
COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.hee_valor_custo_unitario IS 'Custo unitário na entrada.';
COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.hee_valor_total IS 'Valor total da entrada (quantidade * custo).';
COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.hee_data_entrada IS 'Data da entrada do estoque.';
COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.hee_numero_nota_fiscal IS 'Número da nota fiscal.';
COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.hee_observacoes IS 'Observações adicionais.';

CREATE INDEX IF NOT EXISTS idx_historico_entradas_livro ON livraria_comercial.historico_entradas_estoque(liv_id);
CREATE INDEX IF NOT EXISTS idx_historico_entradas_fornecedor ON livraria_comercial.historico_entradas_estoque(for_id);
CREATE INDEX IF NOT EXISTS idx_historico_entradas_data ON livraria_comercial.historico_entradas_estoque(hee_data_entrada);


-- =============================================================================
-- Tabela: avaliacoes_livro (Para RN0068)
-- =============================================================================
CREATE TABLE IF NOT EXISTS livraria_comercial.avaliacoes_livro (
    avl_id              BIGSERIAL       PRIMARY KEY,
    avl_uuid            UUID            NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    liv_id              BIGINT          NOT NULL REFERENCES livraria_comercial.livros(liv_id) ON DELETE CASCADE,
    usu_id              BIGINT          NOT NULL REFERENCES livraria_gestao.usuarios(usu_id),
    avl_nota            INTEGER         NOT NULL CHECK (avl_nota >= 1 AND avl_nota <= 5),
    avl_comentario      VARCHAR(1000),
    avl_aprovado        BOOLEAN         NOT NULL DEFAULT FALSE,
    avl_criado_em       TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    avl_atualizado_em   TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_usuario_livro_avaliacao UNIQUE (usu_id, liv_id)
);

COMMENT ON TABLE livraria_comercial.avaliacoes_livro               IS 'Avaliações de usuários para livros (RN0068).';
COMMENT ON COLUMN livraria_comercial.avaliacoes_livro.avl_id       IS 'Identificador interno da avaliação.';
COMMENT ON COLUMN livraria_comercial.avaliacoes_livro.avl_uuid     IS 'Identificador público UUID da avaliação.';
COMMENT ON COLUMN livraria_comercial.avaliacoes_livro.liv_id       IS 'FK para livro avaliado.';
COMMENT ON COLUMN livraria_comercial.avaliacoes_livro.usu_id       IS 'FK para usuário que avaliou.';
COMMENT ON COLUMN livraria_comercial.avaliacoes_livro.avl_nota     IS 'Nota de 1 a 5 estrelas.';
COMMENT ON COLUMN livraria_comercial.avaliacoes_livro.avl_comentario IS 'Comentário opcional do usuário.';
COMMENT ON COLUMN livraria_comercial.avaliacoes_livro.avl_aprovado IS 'Flag indicando se avaliação foi aprovada para exibição.';

CREATE INDEX IF NOT EXISTS idx_avaliacoes_livro ON livraria_comercial.avaliacoes_livro(liv_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_usuario ON livraria_comercial.avaliacoes_livro(usu_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_aprovado ON livraria_comercial.avaliacoes_livro(avl_aprovado);


-- =============================================================================
-- Triggers de Trigramas para normalização de texto
-- =============================================================================

-- Função para normalizar texto (remove acentos, converte para maiúsculas)
CREATE OR REPLACE FUNCTION livraria_comercial.fn_normalizar_texto(input_text TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    RETURN UPPER(UNACCENT(input_text));
END;
$$;

-- Trigger: normalizar nome de autor
CREATE OR REPLACE FUNCTION livraria_comercial.fn_gerar_trigrama_autores()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.aut_nome_norm := livraria_comercial.fn_normalizar_texto(NEW.aut_nome);
    NEW.aut_uuid := COALESCE(NEW.aut_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_autores_normalizar ON livraria_comercial.autores;
CREATE TRIGGER tg_autores_normalizar
    BEFORE INSERT OR UPDATE ON livraria_comercial.autores
    FOR EACH ROW
    EXECUTE FUNCTION livraria_comercial.fn_gerar_trigrama_autores();


-- Trigger: normalizar nome de editora
CREATE OR REPLACE FUNCTION livraria_comercial.fn_gerar_trigrama_editoras()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.edi_nome_norm := livraria_comercial.fn_normalizar_texto(NEW.edi_nome);
    NEW.edi_uuid := COALESCE(NEW.edi_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_editoras_normalizar ON livraria_comercial.editoras;
CREATE TRIGGER tg_editoras_normalizar
    BEFORE INSERT OR UPDATE ON livraria_comercial.editoras
    FOR EACH ROW
    EXECUTE FUNCTION livraria_comercial.fn_gerar_trigrama_editoras();


-- Trigger: normalizar nome de categoria
CREATE OR REPLACE FUNCTION livraria_comercial.fn_gerar_trigrama_categorias()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.cat_nome_norm := livraria_comercial.fn_normalizar_texto(NEW.cat_nome);
    NEW.cat_uuid := COALESCE(NEW.cat_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_categorias_normalizar ON livraria_comercial.categorias;
CREATE TRIGGER tg_categorias_normalizar
    BEFORE INSERT OR UPDATE ON livraria_comercial.categorias
    FOR EACH ROW
    EXECUTE FUNCTION livraria_comercial.fn_gerar_trigrama_categorias();


-- Trigger: normalizar título de livro
CREATE OR REPLACE FUNCTION livraria_comercial.fn_gerar_trigrama_livros()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.liv_titulo_norm := livraria_comercial.fn_normalizar_texto(NEW.liv_titulo);
    NEW.liv_uuid := COALESCE(NEW.liv_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_livros_normalizar ON livraria_comercial.livros;
CREATE TRIGGER tg_livros_normalizar
    BEFORE INSERT OR UPDATE ON livraria_comercial.livros
    FOR EACH ROW
    EXECUTE FUNCTION livraria_comercial.fn_gerar_trigrama_livros();


-- Trigger: normalizar nome de fornecedor
CREATE OR REPLACE FUNCTION livraria_comercial.fn_gerar_trigrama_fornecedores()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.for_nome_norm := livraria_comercial.fn_normalizar_texto(NEW.for_nome);
    NEW.for_uuid := COALESCE(NEW.for_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_fornecedores_normalizar ON livraria_comercial.fornecedores;
CREATE TRIGGER tg_fornecedores_normalizar
    BEFORE INSERT OR UPDATE ON livraria_comercial.fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION livraria_comercial.fn_gerar_trigrama_fornecedores();


-- =============================================================================
-- Trigger: atualizar timestamp automaticamente
-- =============================================================================
CREATE OR REPLACE FUNCTION livraria_comercial.fn_atualizar_timestamp_livros_estoque()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_TABLE_NAME = 'autores' THEN NEW.aut_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'editoras' THEN NEW.edi_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'livros' THEN NEW.liv_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'estoques' THEN NEW.etq_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'fornecedores' THEN NEW.for_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'avaliacoes_livro' THEN NEW.avl_atualizado_em := NOW(); END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_autores_atualizado_em ON livraria_comercial.autores;
CREATE TRIGGER tg_autores_atualizado_em
    BEFORE UPDATE ON livraria_comercial.autores
    FOR EACH ROW
    EXECUTE FUNCTION livraria_comercial.fn_atualizar_timestamp_livros_estoque();

DROP TRIGGER IF EXISTS tg_editoras_atualizado_em ON livraria_comercial.editoras;
CREATE TRIGGER tg_editoras_atualizado_em
    BEFORE UPDATE ON livraria_comercial.editoras
    FOR EACH ROW
    EXECUTE FUNCTION livraria_comercial.fn_atualizar_timestamp_livros_estoque();

DROP TRIGGER IF EXISTS tg_livros_atualizado_em ON livraria_comercial.livros;
CREATE TRIGGER tg_livros_atualizado_em
    BEFORE UPDATE ON livraria_comercial.livros
    FOR EACH ROW
    EXECUTE FUNCTION livraria_comercial.fn_atualizar_timestamp_livros_estoque();

DROP TRIGGER IF EXISTS tg_estoques_atualizado_em ON livraria_comercial.estoques;
CREATE TRIGGER tg_estoques_atualizado_em
    BEFORE UPDATE ON livraria_comercial.estoques
    FOR EACH ROW
    EXECUTE FUNCTION livraria_comercial.fn_atualizar_timestamp_livros_estoque();

DROP TRIGGER IF EXISTS tg_fornecedores_atualizado_em ON livraria_comercial.fornecedores;
CREATE TRIGGER tg_fornecedores_atualizado_em
    BEFORE UPDATE ON livraria_comercial.fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION livraria_comercial.fn_atualizar_timestamp_livros_estoque();

DROP TRIGGER IF EXISTS tg_avaliacoes_livro_atualizado_em ON livraria_comercial.avaliacoes_livro;
CREATE TRIGGER tg_avaliacoes_livro_atualizado_em
    BEFORE UPDATE ON livraria_comercial.avaliacoes_livro
    FOR EACH ROW
    EXECUTE FUNCTION livraria_comercial.fn_atualizar_timestamp_livros_estoque();
