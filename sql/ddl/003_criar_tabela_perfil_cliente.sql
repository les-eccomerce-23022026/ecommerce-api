-- =============================================================================
-- DDL 003 — Tabela de perfil do cliente
-- Sistema: LES – E-Commerce de Livros
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ecm_perfil_cliente
-- Extensão 1:1 de ecm_usuario para clientes.
-- Armazena atributos exclusivos do papel "cliente" que não fazem parte
-- da identidade de autenticação e, portanto, não cabem em ecm_usuario.
--
-- Decisões de modelagem:
--   • Relação 1:1 com ecm_usuario via UNIQUE na FK id_usuario.
--   • Só existirá uma linha aqui se o usuário tiver id_papel = 'cliente'.
--     A integridade é responsabilidade da camada de serviço (ServicoClientes).
--   • Campos opcionais (dsc_genero, dat_nascimento) admitem NULL: o cadastro
--     mínimo do cliente não obriga esses campos (ICriarClienteMinimoDto).
--   • uuid_perfil_cliente segue o mesmo contrato de id + uuid das demais tabelas.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ecm_perfil_cliente (
    id_perfil_cliente       BIGSERIAL   PRIMARY KEY,
    uuid_perfil_cliente     UUID        NOT NULL    DEFAULT gen_random_uuid(),
    id_usuario              BIGINT      NOT NULL,
    dsc_genero              VARCHAR(30),
    dat_nascimento          DATE,
    dat_criacao             TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    dat_atualizacao         TIMESTAMPTZ NOT NULL    DEFAULT NOW(),

    CONSTRAINT uq_perfil_cliente_uuid       UNIQUE (uuid_perfil_cliente),
    CONSTRAINT uq_perfil_cliente_usuario    UNIQUE (id_usuario),

    CONSTRAINT fk_perfil_cliente_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES ecm_usuario (id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

COMMENT ON TABLE  ecm_perfil_cliente                       IS 'Perfil 1:1 com ecm_usuario, restrito a usuários com papel cliente. Armazena dados complementares não utilizados na autenticação.';
COMMENT ON COLUMN ecm_perfil_cliente.id_perfil_cliente     IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';
COMMENT ON COLUMN ecm_perfil_cliente.uuid_perfil_cliente   IS 'Identificador público (UUID v4). Retornado nas rotas HTTP quando necessário.';
COMMENT ON COLUMN ecm_perfil_cliente.id_usuario            IS 'FK única para ecm_usuario — garante relação 1:1.';
COMMENT ON COLUMN ecm_perfil_cliente.dsc_genero            IS 'Gênero autodeclarado pelo cliente (opcional). Sem restrição de domínio para suportar diversidade.';
COMMENT ON COLUMN ecm_perfil_cliente.dat_nascimento        IS 'Data de nascimento do cliente (opcional).';
COMMENT ON COLUMN ecm_perfil_cliente.dat_criacao           IS 'Timestamp de criação do perfil.';
COMMENT ON COLUMN ecm_perfil_cliente.dat_atualizacao       IS 'Timestamp da última atualização (mantido via trigger).';


-- Índice para facilitar join por usuario
CREATE INDEX IF NOT EXISTS idx_perfil_cliente_usuario ON ecm_perfil_cliente (id_usuario);
CREATE INDEX IF NOT EXISTS idx_perfil_cliente_uuid    ON ecm_perfil_cliente (uuid_perfil_cliente);


-- Trigger reutiliza a função genérica criada em 002_criar_tabela_usuario.sql
DROP TRIGGER IF EXISTS tg_perfil_cliente_dat_atualizacao ON ecm_perfil_cliente;
CREATE TRIGGER tg_perfil_cliente_dat_atualizacao
    BEFORE UPDATE ON ecm_perfil_cliente
    FOR EACH ROW
    EXECUTE FUNCTION ecm_fn_atualizar_dat_atualizacao();
