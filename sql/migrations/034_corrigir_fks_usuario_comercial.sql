-- Migration 034: Alinha FKs de usuário ao schema canônico livraria_gestao.usuarios
-- Corrige violação fk_venda_usuario e inconsistência gestão vs comercial (BDD 7ª entrega)

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. vendas.usu_id → livraria_gestao.usuarios
-- ---------------------------------------------------------------------------
ALTER TABLE livraria_comercial.vendas
    DROP CONSTRAINT IF EXISTS fk_venda_usuario;

ALTER TABLE livraria_comercial.vendas
    ADD CONSTRAINT fk_venda_usuario
    FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id);

-- ---------------------------------------------------------------------------
-- 2. (removido - ecm_venda foi renomeado para vendas na migration 042)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 3. cartoes.usu_id → livraria_gestao.usuarios
-- ---------------------------------------------------------------------------
ALTER TABLE livraria_financeiro.cartoes
    DROP CONSTRAINT IF EXISTS fk_cartoes_usuarios;

ALTER TABLE livraria_financeiro.cartoes
    ADD CONSTRAINT fk_cartoes_usuarios
    FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id)
    ON UPDATE CASCADE ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 4. enderecos.usu_id → livraria_gestao.usuarios
-- ---------------------------------------------------------------------------
ALTER TABLE livraria_gestao.enderecos
    DROP CONSTRAINT IF EXISTS fk_enderecos_usuarios;

ALTER TABLE livraria_gestao.enderecos
    ADD CONSTRAINT fk_enderecos_usuarios
    FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id)
    ON UPDATE CASCADE ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 5. clientes.usu_id → livraria_gestao.usuarios
-- ---------------------------------------------------------------------------
ALTER TABLE livraria_gestao.clientes
    DROP CONSTRAINT IF EXISTS fk_clientes_usuarios;

ALTER TABLE livraria_gestao.clientes
    ADD CONSTRAINT fk_clientes_usuarios
    FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id)
    ON UPDATE CASCADE ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 6. telefones.usu_id → livraria_gestao.usuarios
-- ---------------------------------------------------------------------------
ALTER TABLE livraria_gestao.telefones
    DROP CONSTRAINT IF EXISTS fk_telefones_usuarios;

ALTER TABLE livraria_gestao.telefones
    ADD CONSTRAINT fk_telefones_usuarios
    FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id)
    ON UPDATE CASCADE ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 7. (removido - schema livraria_catalogo não existe no banco)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 8. (removido - tabela livraria_gestao.lojas não existe no banco)
-- ---------------------------------------------------------------------------

COMMIT;
