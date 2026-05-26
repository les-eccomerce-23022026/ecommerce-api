export const COTACAO_FRETE_QUERIES = {
  INSERT_BASE: `
    INSERT INTO cotacao_frete (
      cfr_provedor, cfr_estado, cfr_cep_origem, cfr_cep_destino, cfr_peso_kg, cfr_valor_itens,
      cfr_tipo_servico, cfr_valor, cfr_prazo_texto, cfr_expira_em, loj_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING cfr_id, cfr_uuid
  `,
  INSERT_SIMULADA: `
    INSERT INTO cotacao_frete_simulada (cfr_id, cfs_fator_regiao, cfs_peso_arredondado)
    VALUES ($1, $2, $3)
  `,
  SELECT_BY_UUID: `
    SELECT cfr_id, cfr_uuid, cfr_provedor, cfr_estado, cfr_tipo_servico, cfr_valor, cfr_prazo_texto, cfr_expira_em, ven_id
    FROM cotacao_frete
    WHERE cfr_uuid = $1
  `,
  MARCAR_CONSUMIDA: `
    UPDATE cotacao_frete
    SET cfr_estado = $1, ven_id = $2
    WHERE cfr_uuid = $3 AND cfr_estado = $4
  `,
  MARCAR_EXPIRADAS: `
    UPDATE cotacao_frete
    SET cfr_estado = $1
    WHERE cfr_estado = $2 AND cfr_expira_em < NOW()
    RETURNING cfr_id
  `,
};
