-- Migration 061: Vincular usuários a papéis em usuario_papeis
-- Problema: Usuários criados com pap_id em usuarios mas sem vínculo em usuario_papeis
-- Solução: Copiar pap_id de usuarios para usuario_papeis para usuários sem vínculo

BEGIN;

-- Vincular usuários com pap_id definido mas sem vínculo em usuario_papeis
INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id)
SELECT u.usu_id, u.pap_id
FROM livraria_gestao.usuarios u
WHERE u.pap_id IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM livraria_gestao.usuario_papeis up 
    WHERE up.usu_id = u.usu_id AND up.pap_id = u.pap_id
)
ON CONFLICT (usu_id, pap_id) DO NOTHING;

-- Log de execução
DO $$
DECLARE
    qtd_vinculados INTEGER;
BEGIN
    SELECT COUNT(*) INTO qtd_vinculados
    FROM livraria_gestao.usuario_papeis up
    JOIN livraria_gestao.usuarios u ON up.usu_id = u.usu_id
    WHERE u.pap_id IS NOT NULL;
    
    RAISE NOTICE 'Migration 061 executada com sucesso';
    RAISE NOTICE 'Total de usuários vinculados a papéis: %', qtd_vinculados;
END $$;

COMMIT;
