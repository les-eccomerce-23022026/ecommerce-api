-- Migration: 041_migrar_pap_id_para_usuario_papeis.sql
-- Descrição: Migrar dados do pap_id na tabela usuarios para a tabela usuario_papeis
-- Contexto: Após criar a tabela usuario_papeis (migration 040), migrar os papéis existentes
-- Schema: livraria_gestao

-- Migrar dados existentes de pap_id para usuario_papeis
-- Esta migration copia o pap_id de cada usuário para a tabela usuario_papeis
-- garantindo que os dados existentes não sejam perdidos

INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo, usp_criado_em, usp_atualizado_em)
SELECT 
    usu_id,
    pap_id,
    TRUE as usp_ativo,
    usu_criado_em as usp_criado_em,
    usu_atualizado_em as usp_atualizado_em
FROM livraria_gestao.usuarios
WHERE NOT EXISTS (
    SELECT 1 FROM livraria_gestao.usuario_papeis 
    WHERE usuario_papeis.usu_id = usuarios.usu_id 
    AND usuario_papeis.pap_id = usuarios.pap_id
);

-- Comentário sobre a migration
COMMENT ON DATABASE ecm_livraria IS 'Migration 041 executada: pap_id migrado para usuario_papeis';
