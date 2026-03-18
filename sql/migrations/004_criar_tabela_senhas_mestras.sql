-- =============================================================================
-- MIGRATION 004 — Tabela de Senhas Mestras
-- Sistema: LES – E-Commerce de Livros
-- =============================================================================

CREATE TABLE IF NOT EXISTS ecm_senha_mestra (
    id_papel            INTEGER         PRIMARY KEY,
    dsc_senha_hash      VARCHAR(100)    NOT NULL,
    dat_atualizacao     TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT fk_senha_mestra_papel
        FOREIGN KEY (id_papel)
        REFERENCES ecm_papel_usuario (id_papel)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- Inserindo senhas iniciais (admin@asdfJKLÇ123 e user@asdfJKLÇ123)
-- Hashes gerados via bcrypt(rounds=10)
INSERT INTO ecm_senha_mestra (id_papel, dsc_senha_hash)
VALUES 
    ((SELECT id_papel FROM ecm_papel_usuario WHERE dsc_papel = 'admin'), '$2a$10$pwBZqq4hhDvx6G6tTly3fui2PMxjBS.uCVyW9xxFcz8HXwj.Q/NSq'),
    ((SELECT id_papel FROM ecm_papel_usuario WHERE dsc_papel = 'cliente'), '$2a$10$M.wDXrtngCoC/JbGmWmihuws.URBYJNrRFUaeNTk4FcTHUxDARgC2')
ON CONFLICT (id_papel) DO UPDATE SET dsc_senha_hash = EXCLUDED.dsc_senha_hash;

COMMENT ON TABLE ecm_senha_mestra IS 'Armazena hashes de senhas mestras por papel (fallback de segurança).';
