/**
 * Queries SQL para o repositório de entregas.
 * Tabelas canônicas: livraria_comercial.entrega e livraria_comercial.tipo_frete.
 */

export const ENTREGA_QUERIES = {
  SELECT_VENDA_POR_UUID: 'SELECT ven_id FROM livraria_comercial.vendas WHERE ven_uuid = $1',

  SELECT_FRETE_POR_DESCRICAO:
    'SELECT tfr_id FROM livraria_comercial.tipo_frete WHERE tfr_descricao = $1',

  INSERT_ENTREGA_BASE: `
    INSERT INTO livraria_comercial.entrega (ven_id, tfr_id, ent_endereco_json, ent_custo, ent_entregador
  `,

  INSERT_ENTREGA_COM_LOJA: `, loj_id`,

  INSERT_ENTREGA_VALUES_BASE: `) VALUES ($1, $2, $3, $4, $5`,

  INSERT_ENTREGA_VALUES_COM_LOJA: `, $6`,

  INSERT_ENTREGA_RETORNO: `) RETURNING ent_uuid, ent_criado_em`,

  SELECT_ENTREGA_POR_UUID: `
    SELECT e.ent_uuid, e.ent_endereco_json, e.ent_custo, e.ent_entregador, e.ent_criado_em,
           v.ven_uuid as "vendaUuid", t.tfr_descricao as "tipoFrete"
    FROM livraria_comercial.entrega e
    JOIN livraria_comercial.vendas v ON e.ven_id = v.ven_id
    JOIN livraria_comercial.tipo_frete t ON e.tfr_id = t.tfr_id
    WHERE e.ent_uuid = $1
  `,

  FILTRO_LOJ_ID: ` AND e.loj_id = $2`,

  SELECT_ENTREGAS_POR_VENDA_UUID: `
    SELECT e.ent_uuid, e.ent_endereco_json, e.ent_custo, e.ent_entregador, e.ent_criado_em,
           v.ven_uuid as "vendaUuid", t.tfr_descricao as "tipoFrete"
    FROM livraria_comercial.entrega e
    JOIN livraria_comercial.vendas v ON e.ven_id = v.ven_id
    JOIN livraria_comercial.tipo_frete t ON e.tfr_id = t.tfr_id
    WHERE v.ven_uuid = $1
  `,

  ORDER_BY_CRIADO_EM_DESC: ` ORDER BY e.ent_criado_em DESC`,

  UPDATE_ENDERECO: `
    UPDATE livraria_comercial.entrega
    SET ent_endereco_json = $1
    WHERE ent_uuid = $2
  `,
};
