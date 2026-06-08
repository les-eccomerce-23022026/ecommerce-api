-- Migration: 073_restaurar_estoque_loja_padrao.sql
-- Descrição: Definir estoque aleatório dos livros na Loja Padrão
-- Data: 2026-06-08
-- Justificativa: Estoque ficou zerado após seed de vendas variadas
-- Estratégia: Definir estoque aleatório (1-50) para permitir vendas

BEGIN;

-- UUID fixo da Loja Padrão
DO $$
DECLARE
  v_loj_uuid UUID := '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'::UUID;
  v_loj_id BIGINT;
BEGIN
  SELECT loj_id INTO v_loj_id 
  FROM livraria_gestao.lojas 
  WHERE loj_uuid = v_loj_uuid;
  
  IF v_loj_id IS NULL THEN
    RAISE EXCEPTION 'Loja Padrão (UUID: %) não encontrada.', v_loj_uuid;
  END IF;
  
  -- Definir estoque aleatório (1-50)
  UPDATE livraria_comercial.estoques
  SET 
    etq_quantidade_disponivel = 1 + (FLOOR(RANDOM() * 49))::integer,
    etq_quantidade_reservada = 0,
    etq_atualizado_em = CURRENT_TIMESTAMP
  WHERE loj_id = v_loj_id;
  
  RAISE NOTICE 'Estoque definido para valores aleatórios (1-50) na loj_id=%', v_loj_id;
END $$;

-- Relatório de execução
DO $$
DECLARE
  v_loj_id BIGINT;
  v_loj_uuid UUID := '82c0a24c-4cf4-4b12-823a-f1a8b9a086c3'::UUID;
  estoque_medio NUMERIC;
  estoque_minimo INTEGER;
  estoque_maximo INTEGER;
  total_livros INTEGER;
BEGIN
  SELECT loj_id INTO v_loj_id 
  FROM livraria_gestao.lojas 
  WHERE loj_uuid = v_loj_uuid;
  
  SELECT COUNT(*) INTO total_livros
  FROM livraria_comercial.estoques
  WHERE loj_id = v_loj_id;
  
  SELECT 
    AVG(etq_quantidade_disponivel),
    MIN(etq_quantidade_disponivel),
    MAX(etq_quantidade_disponivel)
  INTO estoque_medio, estoque_minimo, estoque_maximo
  FROM livraria_comercial.estoques
  WHERE loj_id = v_loj_id;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Definição de estoque aleatório concluída';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Loja: loj_id=%, UUID=%', v_loj_id, v_loj_uuid;
  RAISE NOTICE 'Total de livros: %', total_livros;
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'ESTOQUE ATUAL:';
  RAISE NOTICE 'Estoque médio: %', ROUND(estoque_medio, 2);
  RAISE NOTICE 'Estoque mínimo: %', estoque_minimo;
  RAISE NOTICE 'Estoque máximo: %', estoque_maximo;
  RAISE NOTICE '========================================';
END $$;

COMMIT;
