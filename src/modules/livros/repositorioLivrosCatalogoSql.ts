import type { DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import type { OrdenacaoCatalogo } from '@/modules/livros/ICatalogoLivros.dto';

export type PartesSqlCatalogo = {
  filtroCategoria: string;
  joinVendas: string;
  orderBy: string;
  paramsCount: DbParametro[];
  paramsList: DbParametro[];
  filtroIdx: string;
  limit: number;
  offset: number;
};

const FILTRO_CATEGORIA_SQL = `AND EXISTS (
          SELECT 1 FROM livro_categorias lc
          INNER JOIN categorias c ON c.cat_id = lc.cat_id AND c.cat_ativo = TRUE
          WHERE lc.liv_id = l.liv_id AND c.cat_slug = $1
        )`;

function joinEVendaPorOrdenacao(ordenacao: OrdenacaoCatalogo): { joinVendas: string; orderBy: string } {
  if (ordenacao !== 'mais-vendidos') {
    return { joinVendas: '', orderBy: 'ORDER BY l.liv_criado_em DESC NULLS LAST' };
  }
  return {
    joinVendas: `LEFT JOIN (
            SELECT liv_id, SUM(itv_quantidade)::numeric AS qtd_vendida
            FROM itens_venda
            GROUP BY liv_id
          ) vendas_agg ON vendas_agg.liv_id = l.liv_id`,
    orderBy: 'ORDER BY COALESCE(vendas_agg.qtd_vendida, 0) DESC, l.liv_criado_em DESC NULLS LAST',
  };
}

export function montarPartesSqlCatalogo(opcoes: {
  pagina: number;
  itensPorPagina: number;
  categoriaSlug?: string;
  ordenacao: OrdenacaoCatalogo;
}): PartesSqlCatalogo {
  const { pagina, itensPorPagina, categoriaSlug, ordenacao } = opcoes;
  const offset = (pagina - 1) * itensPorPagina;
  const { joinVendas, orderBy } = joinEVendaPorOrdenacao(ordenacao);
  if (!categoriaSlug) {
    return {
      filtroCategoria: '',
      joinVendas,
      orderBy,
      paramsCount: [],
      paramsList: [],
      filtroIdx: '',
      limit: itensPorPagina,
      offset,
    };
  }
  return {
    filtroCategoria: FILTRO_CATEGORIA_SQL,
    joinVendas,
    orderBy,
    paramsCount: [categoriaSlug],
    paramsList: [categoriaSlug],
    filtroIdx: '$1',
    limit: itensPorPagina,
    offset,
  };
}
