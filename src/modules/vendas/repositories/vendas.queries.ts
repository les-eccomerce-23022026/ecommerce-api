/**
 * Queries SQL para o repositório de vendas.
 * Extrai queries dinâmicas para melhor manutenibilidade.
 */

export const VENDAS_QUERIES = {
  SELECT_USUARIO_POR_UUID: 'SELECT usu_id FROM livraria_gestao.usuarios WHERE usu_uuid = $1',
  
  SELECT_STATUS_POR_DESCRICAO: 'SELECT stv_id FROM livraria_comercial.status_venda WHERE stv_descricao = $1',
  
  INSERT_VENDA_BASE: `
    INSERT INTO livraria_comercial.vendas (usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda, cfr_id
  `,
  
  INSERT_VENDA_COM_LOJA: `, loj_id`,
  
  INSERT_VENDA_VALUES_BASE: `) VALUES ($1, $2, $3, $4, $5, $6`,
  
  INSERT_VENDA_VALUES_COM_LOJA: `, $7`,
  
  INSERT_VENDA_RETORNO: `) RETURNING ven_id, ven_uuid, ven_criado_em`,
  
  INSERT_ITEM_VENDA_BASE: `
    INSERT INTO livraria_comercial.itens_venda (ven_id, liv_uuid, itv_quantidade, itv_preco_unitario
  `,
  
  INSERT_ITEM_VENDA_COM_LOJA: `, loj_id`,
  
  INSERT_ITEM_VENDA_VALUES_BASE: `) VALUES ($1, $2, $3, $4`,
  
  INSERT_ITEM_VENDA_VALUES_COM_LOJA: `, $5`,
  
  INSERT_ITEM_VENDA_RETORNO: `) RETURNING itv_uuid`,
  
  SELECT_VENDA_POR_UUID: `
    SELECT 
      v.ven_uuid, v.ven_total_itens, v.ven_frete, v.ven_total_venda,
      v.ven_criado_em, v.ven_data_hora_entrega, s.stv_descricao as status,
      u.usu_uuid as "usuarioUuid", v.ven_motivo_troca as "motivoTroca",
      i.itv_uuid as id, i.liv_uuid as "livroUuid", i.itv_quantidade as quantidade,
      i.itv_preco_unitario as "precoUnitario", i.itv_em_troca as "emTroca"
    FROM livraria_comercial.vendas v
    JOIN livraria_comercial.status_venda s ON v.stv_id = s.stv_id
    JOIN livraria_gestao.usuarios u ON v.usu_id = u.usu_id
    LEFT JOIN livraria_comercial.itens_venda i ON v.ven_id = i.ven_id
    WHERE v.ven_uuid = $1
  `,
  
  FILTRO_LOJ_ID: ` AND v.loj_id = $2`,
  
  SELECT_VENDAS_POR_USUARIO: `
    SELECT 
      v.ven_uuid, v.ven_total_itens, v.ven_frete, v.ven_total_venda,
      v.ven_criado_em, v.ven_data_hora_entrega, s.stv_descricao as status,
      u.usu_uuid as "usuarioUuid", v.ven_motivo_troca as "motivoTroca",
      i.itv_uuid as "itv_id", i.liv_uuid as "itv_livroUuid", 
      i.itv_quantidade as "itv_quantidade", i.itv_preco_unitario as "itv_precoUnitario",
      i.itv_em_troca as "itv_emTroca"
    FROM livraria_comercial.vendas v
    JOIN livraria_comercial.status_venda s ON v.stv_id = s.stv_id
    JOIN livraria_gestao.usuarios u ON v.usu_id = u.usu_id
    LEFT JOIN livraria_comercial.itens_venda i ON v.ven_id = i.ven_id
    WHERE u.usu_uuid = $1
  `,
  
  SELECT_TODAS_VENDAS: `
    SELECT 
      v.ven_uuid, v.ven_total_itens, v.ven_frete, v.ven_total_venda,
      v.ven_criado_em, v.ven_data_hora_entrega, s.stv_descricao as status,
      u.usu_uuid as "usuarioUuid", v.ven_motivo_troca as "motivoTroca",
      i.itv_uuid as "itv_id", i.liv_uuid as "itv_livroUuid", 
      i.itv_quantidade as "itv_quantidade", i.itv_preco_unitario as "itv_precoUnitario",
      i.itv_em_troca as "itv_emTroca"
    FROM livraria_comercial.vendas v
    JOIN livraria_comercial.status_venda s ON v.stv_id = s.stv_id
    JOIN livraria_gestao.usuarios u ON v.usu_id = u.usu_id
    LEFT JOIN livraria_comercial.itens_venda i ON v.ven_id = i.ven_id
  `,
  
  WHERE_LOJ_ID: ` WHERE v.loj_id = $1`,
  
  ORDER_BY_CRIADO_EM_DESC: ` ORDER BY v.ven_criado_em DESC`,
  
  UPDATE_SolicitacaoTroca: `
    UPDATE livraria_comercial.vendas 
    SET ven_motivo_troca = $1, 
        stv_id = (SELECT stv_id FROM livraria_comercial.status_venda WHERE stv_descricao = $2),
        ven_atualizado_em = NOW()
    WHERE ven_uuid = $3
  `,
  
  UPDATE_ITENS_TROCA: `
    UPDATE livraria_comercial.itens_venda
    SET itv_em_troca = TRUE, itv_atualizado_em = NOW()
    WHERE itv_uuid = ANY($1::uuid[])
  `,
  
  UPDATE_STATUS_ENTREGUE: `
    UPDATE livraria_comercial.vendas SET stv_id = $1, ven_atualizado_em = NOW(), ven_data_hora_entrega = NOW() WHERE ven_uuid = $2
  `,
  
  UPDATE_STATUS_PADRAO: `
    UPDATE livraria_comercial.vendas SET stv_id = $1, ven_atualizado_em = NOW() WHERE ven_uuid = $2
  `,
  
  SELECT_EMAIL_USUARIO_POR_VENDA: `
    SELECT u.usu_email as email
    FROM livraria_comercial.vendas v
    JOIN livraria_gestao.usuarios u ON v.usu_id = u.usu_id
    WHERE v.ven_uuid = $1
  `,
};
