-- =============================================================================
-- MIGRATION 007: Correção de Triggers para Novo Padrão de Trigramas
-- Sistema: LES – E-Commerce de Livros
-- =============================================================================

BEGIN;

-- 1. LIMPEZA DE TRIGGERS ANTIGOS (Baseados em nomes ecm_ e dat_atualizacao)
--------------------------------------------------------------------------------

DROP TRIGGER IF EXISTS tg_usuario_dat_atualizacao ON usu_usuarios;
DROP TRIGGER IF EXISTS tg_perfil_cliente_dat_atualizacao ON cli_clientes;
DROP TRIGGER IF EXISTS tg_endereco_usuario_dat_atualizacao ON end_enderecos;
DROP TRIGGER IF EXISTS tg_telefone_usuario_dat_atualizacao ON tel_telefones;
DROP TRIGGER IF EXISTS tg_cartao_usuario_dat_atualizacao ON crt_cartoes;
DROP TRIGGER IF EXISTS tg_cartao_dat_atualizacao ON crt_cartoes;

-- 2. CRIAÇÃO DE NOVOS TRIGGERS (Usando fn_atualizar_timestamp e novos nomes)
--------------------------------------------------------------------------------

-- Usuários
CREATE TRIGGER tg_usu_atualizado_em
    BEFORE UPDATE ON usu_usuarios
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();

-- Clientes
CREATE TRIGGER tg_cli_atualizado_em
    BEFORE UPDATE ON cli_clientes
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();

-- Endereços
CREATE TRIGGER tg_end_atualizado_em
    BEFORE UPDATE ON end_enderecos
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();

-- Telefones
CREATE TRIGGER tg_tel_atualizado_em
    BEFORE UPDATE ON tel_telefones
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();

-- Cartões
CREATE TRIGGER tg_crt_atualizado_em
    BEFORE UPDATE ON crt_cartoes
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();

COMMIT;
