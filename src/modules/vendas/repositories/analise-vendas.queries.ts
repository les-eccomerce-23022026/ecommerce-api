/**
 * Queries SQL para análise de vendas por categoria e período
 * Otimizada para performance com GROUP BY e índices compostos
 */

export const ANALISE_VENDAS_POR_CATEGORIA = `
SELECT 
  cat.cat_nome as categoria,
  DATE_TRUNC('month', v.ven_criado_em)::date as mes,
  SUM(iv.itv_quantidade) as quantidade
FROM livraria_comercial.vendas v
JOIN livraria_comercial.itens_venda iv ON iv.ven_id = v.ven_id
JOIN livraria_comercial.livros l ON l.liv_uuid = iv.liv_uuid
JOIN livraria_comercial.livro_categorias lc ON lc.liv_id = l.liv_id
JOIN livraria_comercial.categorias cat ON cat.cat_id = lc.cat_id
WHERE v.ven_criado_em >= $1 
  AND v.ven_criado_em <= $2
  AND v.loj_id = $3
  AND v.stv_id = 5 -- ENTREGUE (status 5)
  AND ($4::text[] IS NULL OR cat.cat_nome = ANY($4::text[]))
GROUP BY cat.cat_nome, DATE_TRUNC('month', v.ven_criado_em)
ORDER BY mes, cat.cat_nome;
`;
