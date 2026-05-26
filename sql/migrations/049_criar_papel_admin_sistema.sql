-- Migration 049: Criar papel admin_sistema
-- Descrição: Adiciona novo papel de administrador do sistema para substituir admin mestre
--   - Este papel permite acesso global a todas as lojas e funcionalidades administrativas
--   - Substitui a verificação por email hardcoded (admin@livraria.com.br)
-- Data: 2025-05-25

BEGIN;

-- Inserir novo papel admin_sistema na tabela papeis
INSERT INTO livraria_gestao.papeis (pap_descricao)
VALUES ('admin_sistema')
ON CONFLICT (pap_descricao) DO NOTHING;

COMMIT;
