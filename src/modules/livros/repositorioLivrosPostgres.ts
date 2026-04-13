import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import type { ILivroCatalogoDto } from '@/modules/livros/ILivroCatalogo.dto';
import type {
  ICategoriaMenuDto,
  IListagemCatalogoLivros,
  OrdenacaoCatalogo,
} from '@/modules/livros/ICatalogoLivros.dto';
import { montarPartesSqlCatalogo } from '@/modules/livros/repositorioLivrosCatalogoSql';

type RowLivro = {
  liv_uuid: string;
  liv_titulo: string;
  liv_isbn: string;
  liv_sinopse: string | null;
  liv_imagem_url: string | null;
  aut_nome: string;
  etq_preco_venda: string;
  etq_quantidade_disponivel: string;
  liv_ativo: boolean;
};

function mapRow(r: RowLivro): ILivroCatalogoDto {
  return {
    uuid: r.liv_uuid,
    titulo: r.liv_titulo,
    autor: r.aut_nome,
    preco: Number(r.etq_preco_venda),
    imagem: r.liv_imagem_url ?? undefined,
    isbn: r.liv_isbn,
    estoque: Number(r.etq_quantidade_disponivel),
    sinopse: r.liv_sinopse ?? undefined,
    status: r.liv_ativo ? 'Ativo' : 'Inativo',
    estrelas: 5,
  };
}

export class RepositorioLivrosPostgres {
  constructor(private readonly db: IConexaoBanco) {}

  async listarCategoriasComLivrosNoCatalogo(): Promise<ICategoriaMenuDto[]> {
    const sql = `
      SELECT DISTINCT c.cat_slug AS slug, c.cat_nome AS nome
      FROM categorias c
      INNER JOIN livro_categorias lc ON lc.cat_id = c.cat_id
      INNER JOIN livros l ON l.liv_id = lc.liv_id AND l.liv_ativo = TRUE
      INNER JOIN estoques e ON e.liv_id = l.liv_id AND e.etq_ativo = TRUE AND e.etq_quantidade_disponivel > 0
      WHERE c.cat_ativo = TRUE AND c.cat_slug IS NOT NULL AND btrim(c.cat_slug) <> ''
      ORDER BY c.cat_nome ASC
    `;
    const rows = await this.db.executar<{ slug: string; nome: string }>(sql, []);
    return rows.map((r) => ({ slug: r.slug, nome: r.nome }));
  }

  async listarCatalogo(opcoes: {
    pagina: number;
    itensPorPagina: number;
    categoriaSlug?: string;
    ordenacao: OrdenacaoCatalogo;
  }): Promise<IListagemCatalogoLivros> {
    const { pagina, itensPorPagina } = opcoes;
    const {
      filtroCategoria,
      joinVendas,
      orderBy,
      paramsCount,
      paramsList,
      limitIdx,
      offsetIdx,
    } = montarPartesSqlCatalogo(opcoes);

    const sqlCount = `
      SELECT COUNT(DISTINCT l.liv_id)::text AS c
      FROM livros l
      INNER JOIN estoques e ON e.liv_id = l.liv_id
      WHERE l.liv_ativo = TRUE AND e.etq_ativo = TRUE AND e.etq_quantidade_disponivel > 0
      ${filtroCategoria}
    `;
    const countRows = await this.db.executar<{ c: string }>(sqlCount, paramsCount);
    const total = countRows.length ? Number(countRows[0].c) : 0;

    const sqlList = `
      SELECT
        l.liv_uuid,
        l.liv_titulo,
        l.liv_isbn,
        l.liv_sinopse,
        l.liv_imagem_url,
        a.aut_nome,
        e.etq_preco_venda::text,
        e.etq_quantidade_disponivel::text,
        l.liv_ativo
      FROM livros l
      INNER JOIN autores a ON l.aut_id = a.aut_id
      INNER JOIN estoques e ON e.liv_id = l.liv_id
      ${joinVendas}
      WHERE l.liv_ativo = TRUE AND e.etq_ativo = TRUE AND e.etq_quantidade_disponivel > 0
      ${filtroCategoria}
      ${orderBy}
      LIMIT ${limitIdx} OFFSET ${offsetIdx}
    `;

    const rows = await this.db.executar<RowLivro>(sqlList, paramsList);

    return {
      livros: rows.map(mapRow),
      total,
      pagina,
      itensPorPagina,
    };
  }

  async obterPorUuid(livUuid: string): Promise<ILivroCatalogoDto | null> {
    const sql = `
      SELECT
        l.liv_uuid,
        l.liv_titulo,
        l.liv_isbn,
        l.liv_sinopse,
        l.liv_imagem_url,
        a.aut_nome,
        e.etq_preco_venda::text,
        e.etq_quantidade_disponivel::text,
        l.liv_ativo
      FROM livros l
      INNER JOIN autores a ON l.aut_id = a.aut_id
      INNER JOIN estoques e ON e.liv_id = l.liv_id
      WHERE l.liv_uuid = $1 AND e.etq_ativo = TRUE
    `;
    const rows = await this.db.executar<RowLivro>(sql, [livUuid] as DbParametro[]);
    if (rows.length === 0) return null;
    return mapRow(rows[0]);
  }

  async listarTodosAdmin(limite: number): Promise<ILivroCatalogoDto[]> {
    const sql = `
      SELECT
        l.liv_uuid,
        l.liv_titulo,
        l.liv_isbn,
        l.liv_sinopse,
        l.liv_imagem_url,
        a.aut_nome,
        e.etq_preco_venda::text,
        e.etq_quantidade_disponivel::text,
        l.liv_ativo
      FROM livros l
      INNER JOIN autores a ON l.aut_id = a.aut_id
      INNER JOIN estoques e ON e.liv_id = l.liv_id
      WHERE e.etq_ativo = TRUE
      ORDER BY l.liv_titulo ASC
      LIMIT $1
    `;
    const rows = await this.db.executar<RowLivro>(sql, [limite] as DbParametro[]);
    return rows.map(mapRow);
  }

  async obterEstoqueDisponivelPorLivId(livId: number): Promise<number | null> {
    const rows = await this.db.executar<{ q: string }>(
      `SELECT etq_quantidade_disponivel::text AS q FROM estoques WHERE liv_id = $1 AND etq_ativo = TRUE LIMIT 1`,
      [livId] as DbParametro[],
    );
    return rows.length ? Number(rows[0].q) : null;
  }

  async obterLivIdPorUuid(livUuid: string): Promise<number | null> {
    const rows = await this.db.executar<{ liv_id: number }>(
      'SELECT liv_id FROM livros WHERE liv_uuid = $1',
      [livUuid] as DbParametro[],
    );
    return rows.length ? rows[0].liv_id : null;
  }
}
