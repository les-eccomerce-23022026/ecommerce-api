-- Migration 066: Vincular admintest@email.com à loja E2E (admin_lojas)
-- Corrige login admin nos testes Cypress quando o seed 005 rodou sem vínculo em admin_lojas.

BEGIN;

DO $$
DECLARE
  v_usu_id BIGINT;
  v_loj_id BIGINT;
BEGIN
  SELECT usu_id INTO v_usu_id
  FROM livraria_gestao.usuarios
  WHERE usu_email = 'admintest@email.com'
  LIMIT 1;

  SELECT l.loj_id INTO v_loj_id
  FROM livraria_gestao.lojas l
  WHERE l.loj_slug IN ('loja-padrao', 'livraria-teste', 'livraria-padrao')
  ORDER BY CASE l.loj_slug
    WHEN 'loja-padrao' THEN 1
    WHEN 'livraria-teste' THEN 2
    WHEN 'livraria-padrao' THEN 3
    ELSE 99
  END,
  l.loj_id
  LIMIT 1;

  IF v_loj_id IS NULL THEN
    SELECT loj_id INTO v_loj_id
    FROM livraria_gestao.lojas
    WHERE loj_ativo = TRUE
    ORDER BY loj_id
    LIMIT 1;
  END IF;

  IF v_usu_id IS NULL OR v_loj_id IS NULL THEN
    RAISE NOTICE 'Migration 066: admintest ou loja não encontrados (usu=%, loj=%)', v_usu_id, v_loj_id;
    RETURN;
  END IF;

  UPDATE livraria_gestao.usuarios
  SET loj_id = v_loj_id
  WHERE usu_id = v_usu_id
    AND (loj_id IS NULL OR loj_id <> v_loj_id);

  INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_ativo, adl_escopo)
  VALUES (v_usu_id, v_loj_id, 'admin_principal', TRUE, 'LOJA')
  ON CONFLICT (usu_id, loj_id) DO UPDATE
    SET adl_ativo = TRUE,
        adl_papel = EXCLUDED.adl_papel,
        adl_escopo = EXCLUDED.adl_escopo;

  RAISE NOTICE 'Migration 066: admintest (usu_id=%) vinculado à loja loj_id=%', v_usu_id, v_loj_id;
END $$;

COMMIT;
