-- Migration 060: Vincular administradores existentes à tabela admin_lojas
-- Descrição: Garante que todos os administradores existentes tenham vínculos em admin_lojas
--   - Busca usuários com papel 'admin' ou 'admin_sistema' que não têm vínculo em admin_lojas
--   - Insere registros em admin_lojas usando o loj_id da tabela usuarios
--   - Define escopo 'LOJA' para admins e 'SISTEMA' para admin_sistema
-- Data: 2026-05-26

BEGIN;

-- ============================================
-- PASSO 1: Vincular administradores de loja (papel 'admin')
-- ============================================
INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo, adl_escopo)
SELECT 
    u.usu_id,
    u.loj_id,
    'admin_loja' AS adl_papel,
    TRUE AS adl_ativo,
    'LOJA' AS adl_escopo
FROM livraria_gestao.usuarios u
INNER JOIN livraria_gestao.papeis p ON u.pap_id = p.pap_id
WHERE p.pap_descricao = 'admin'
  AND u.loj_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM livraria_gestao.admin_lojas al
    WHERE al.usu_id = u.usu_id
      AND al.loj_id = u.loj_id
  )
ON CONFLICT (usu_id, loj_id) DO NOTHING;

-- ============================================
-- PASSO 2: Vincular administradores do sistema (papel 'admin_sistema')
-- ============================================
INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo, adl_escopo)
SELECT 
    u.usu_id,
    u.loj_id,
    'admin_sistema' AS adl_papel,
    TRUE AS adl_ativo,
    'SISTEMA' AS adl_escopo
FROM livraria_gestao.usuarios u
INNER JOIN livraria_gestao.papeis p ON u.pap_id = p.pap_id
WHERE p.pap_descricao = 'admin_sistema'
  AND u.loj_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM livraria_gestao.admin_lojas al
    WHERE al.usu_id = u.usu_id
      AND al.loj_id = u.loj_id
  )
ON CONFLICT (usu_id, loj_id) DO NOTHING;

-- ============================================
-- PASSO 3: Log de execução
-- ============================================
DO $$
DECLARE
    v_admins_loja_vinculados INTEGER;
    v_admins_sistema_vinculados INTEGER;
BEGIN
    -- Contar admins de loja vinculados
    SELECT COUNT(*) INTO v_admins_loja_vinculados
    FROM livraria_gestao.admin_lojas al
    INNER JOIN livraria_gestao.usuarios u ON al.usu_id = u.usu_id
    INNER JOIN livraria_gestao.papeis p ON u.pap_id = p.pap_id
    WHERE p.pap_descricao = 'admin'
      AND al.adl_escopo = 'LOJA';

    -- Contar admins de sistema vinculados
    SELECT COUNT(*) INTO v_admins_sistema_vinculados
    FROM livraria_gestao.admin_lojas al
    INNER JOIN livraria_gestao.usuarios u ON al.usu_id = u.usu_id
    INNER JOIN livraria_gestao.papeis p ON u.pap_id = p.pap_id
    WHERE p.pap_descricao = 'admin_sistema'
      AND al.adl_escopo = 'SISTEMA';

    RAISE NOTICE 'Migration 060 executada com sucesso';
    RAISE NOTICE 'Admins de loja vinculados: %', v_admins_loja_vinculados;
    RAISE NOTICE 'Admins de sistema vinculados: %', v_admins_sistema_vinculados;
END $$;

COMMIT;
