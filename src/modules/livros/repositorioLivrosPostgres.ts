import type { ILivroCatalogoDto } from '@/modules/livros/ILivroCatalogo.dto';
import type {
  ICategoriaMenuDto,
  IListagemCatalogoLivros,
  OrdenacaoCatalogo,
} from '@/modules/livros/ICatalogoLivros.dto';
import { montarPartesSqlCatalogo } from '@/modules/livros/repositorioLivrosCatalogoSql';
import type { IConexaoBanco, DbParametro } from '../../shared/infrastructure/database/IConexaoBanco';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';

type RowLivro = {
  liv_uuid: string;
  liv_titulo: string;
  liv_isbn: string;
  liv_sinopse: string | null;
  liv_imagem_url: string | null;
  aut_nome: string;
  etq_preco_venda: number;
  etq_quantidade_disponivel: number;
  liv_ativo: boolean;
  liv_numero_paginas?: number | null;
  liv_ano?: number | null;
  categorias_agregadas?: string | null;
};

function mapRow(r: RowLivro): ILivroCatalogoDto {
  const categoriasLista =
    r.categorias_agregadas?.split('|').map((c) => c.trim()).filter(Boolean) ?? [];
  const categoriaPrincipal = categoriasLista[0];

  return {
    uuid: r.liv_uuid,
    titulo: r.liv_titulo,
    autor: r.aut_nome,
    preco: Number(r.etq_preco_venda),
    imagem: r.liv_imagem_url ?? undefined,
    isbn: r.liv_isbn,
    estoque: r.etq_quantidade_disponivel,
    estoqueDisponivel: r.etq_quantidade_disponivel,
    sinopse: r.liv_sinopse ?? undefined,
    status: r.liv_ativo ? 'Ativo' : 'Inativo',
    estrelas: 5,
    categoria: categoriaPrincipal,
    categorias: categoriasLista.length > 0 ? categoriasLista : undefined,
    numeroPaginas: r.liv_numero_paginas ?? undefined,
    anoPublicacao: r.liv_ano ?? undefined,
    idioma: 'português',
    tags: categoriasLista.map((c) => c.toLowerCase().replace(/\s+/g, '_')),
  };
}

export class RepositorioLivrosPostgres {
  constructor(private readonly db: IConexaoBanco) {}

  /**
   * Obtém o loj_id do contexto de requisição.
   * Se não houver contexto, retorna undefined (compatibilidade com código legado).
   * 
   * NOTA: O middleware contextoLojaMiddleware converte loj_uuid para loj_id
   * e armazena ambos no contexto. Repositórios usam loj_id para performance.
   */
  private obterLojId(): number | undefined {
    return ContextoRequisicao.obterLojId();
  }

  async listarCategoriasComLivrosNoCatalogo(): Promise<ICategoriaMenuDto[]> {
    const sql = `
      SELECT 
        c.cat_slug AS slug, 
        c.cat_nome AS nome,
        COUNT(DISTINCT l.liv_id) AS contador_produtos
      FROM categorias c
      INNER JOIN livro_categorias lc ON lc.cat_id = c.cat_id
      INNER JOIN livros l ON l.liv_id = lc.liv_id AND l.liv_ativo = TRUE
      INNER JOIN estoques e ON e.liv_id = l.liv_id AND e.etq_ativo = TRUE AND e.etq_quantidade_disponivel > 0
      WHERE c.cat_ativo = TRUE AND c.cat_slug IS NOT NULL AND btrim(c.cat_slug) <> ''
      GROUP BY c.cat_slug, c.cat_nome
      ORDER BY c.cat_nome ASC
    `;
    const rows = await this.db.executar<{ slug: string; nome: string; contador_produtos: string }>(sql, []);
    return rows.map((r) => ({ slug: r.slug, nome: r.nome, contadorProdutos: Number(r.contador_produtos) }));
  }

  async listarCatalogo(opcoes: {
    pagina: number;
    itensPorPagina: number;
    categoriaSlug?: string;
    ordenacao: OrdenacaoCatalogo;
  }): Promise<IListagemCatalogoLivros> {
    const { pagina, itensPorPagina } = opcoes;
    const loj_id = this.obterLojId();

    const {
      filtroCategoria,
      joinVendas,
      orderBy,
      paramsCount,
      paramsList,
      limit,
      offset,
    } = montarPartesSqlCatalogo(opcoes);

    const filtroLoja = loj_id ? ` AND e.loj_id = $${paramsCount.length + 1}` : '';
    const filtroLojaList = loj_id ? ` AND e.loj_id = $${paramsList.length + 1}` : '';
    const paramsCountLoja = loj_id ? [...paramsCount, loj_id] : paramsCount;
    const paramsListLoja = loj_id ? [...paramsList, loj_id] : paramsList;

    const sqlCount = `
      SELECT COUNT(DISTINCT l.liv_id)::text AS c
      FROM livraria_comercial.livros l
      INNER JOIN livraria_comercial.estoques e ON e.liv_id = l.liv_id
      WHERE l.liv_ativo = TRUE AND e.etq_ativo = TRUE AND e.etq_quantidade_disponivel > 0
      ${filtroCategoria}
      ${filtroLoja}
    `;
    const countRows = await this.db.executar<{ c: string }>(sqlCount, paramsCountLoja);
    const total = countRows.length ? Number(countRows[0].c) : 0;

    const sqlList = `
      SELECT
        l.liv_uuid,
        l.liv_titulo,
        l.liv_isbn,
        l.liv_sinopse,
        l.liv_imagem_url,
        a.aut_nome,
        e.etq_preco_venda,
        e.etq_quantidade_disponivel,
        l.liv_ativo
      FROM livraria_comercial.livros l
      INNER JOIN livraria_comercial.autores a ON l.aut_id = a.aut_id
      INNER JOIN livraria_comercial.estoques e ON e.liv_id = l.liv_id
      ${joinVendas}
      WHERE l.liv_ativo = TRUE AND e.etq_ativo = TRUE AND e.etq_quantidade_disponivel > 0
      ${filtroCategoria}
      ${filtroLojaList}
      ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const rows = await this.db.executar<RowLivro>(sqlList, paramsListLoja);

    return {
      livros: rows.map(mapRow),
      total,
      pagina,
      itensPorPagina,
    };
  }

  async obterPorUuid(livUuid: string): Promise<ILivroCatalogoDto | null> {
    const loj_id = this.obterLojId();
    
    let sql = `
      SELECT
        l.liv_uuid,
        l.liv_titulo,
        l.liv_isbn,
        l.liv_sinopse,
        l.liv_imagem_url,
        a.aut_nome,
        e.etq_preco_venda,
        e.etq_quantidade_disponivel,
        l.liv_ativo
      FROM livraria_comercial.livros l
      INNER JOIN livraria_comercial.autores a ON l.aut_id = a.aut_id
      INNER JOIN livraria_comercial.estoques e ON e.liv_id = l.liv_id
      WHERE l.liv_uuid = $1 AND e.etq_ativo = TRUE
    `;
    
    const parametros: DbParametro[] = [livUuid];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id no estoque
    if (loj_id) {
      sql += ` AND e.loj_id = $2`;
      parametros.push(loj_id);
    } else {
      // Se não há loj_id, ordenar por loj_id DESC para pegar o registro mais recente
      sql += ` ORDER BY e.loj_id DESC`;
    }

    const rows = await this.db.executar<RowLivro>(sql, parametros);
    if (rows.length === 0) return null;
    return mapRow(rows[0]);
  }

  async listarTodosAdmin(limite: number): Promise<ILivroCatalogoDto[]> {
    const loj_id = this.obterLojId();
    
    let sql = `
      SELECT
        l.liv_uuid,
        l.liv_titulo,
        l.liv_isbn,
        l.liv_sinopse,
        l.liv_imagem_url,
        a.aut_nome,
        e.etq_preco_venda,
        e.etq_quantidade_disponivel,
        l.liv_ativo,
        l.liv_numero_paginas,
        l.liv_ano,
        (
          SELECT string_agg(DISTINCT c.cat_nome, '|' ORDER BY c.cat_nome)
          FROM livraria_comercial.livro_categorias lc
          INNER JOIN livraria_comercial.categorias c ON lc.cat_id = c.cat_id AND c.cat_ativo = TRUE
          WHERE lc.liv_id = l.liv_id
        ) AS categorias_agregadas
      FROM livraria_comercial.livros l
      INNER JOIN livraria_comercial.autores a ON l.aut_id = a.aut_id
      INNER JOIN livraria_comercial.estoques e ON e.liv_id = l.liv_id
      WHERE e.etq_ativo = TRUE
    `;
    
    const parametros: DbParametro[] = [];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id no estoque
    // Admin vê apenas livros com estoque na loja dele
    if (loj_id) {
      sql += ` AND e.loj_id = $1`;
      parametros.push(loj_id);
    }

    sql += ` ORDER BY l.liv_titulo ASC`;
    
    const contador = parametros.length + 1;
    sql += ` LIMIT $${contador}`;
    parametros.push(limite);

    const rows = await this.db.executar<RowLivro>(sql, parametros);
    return rows.map(mapRow);
  }

  async obterEstoqueDisponivelPorLivId(livId: number): Promise<number | null> {
    const loj_id = this.obterLojId();
    
    let sql = `SELECT etq_quantidade_disponivel FROM livraria_comercial.estoques WHERE liv_id = $1 AND etq_ativo = TRUE`;
    const parametros: DbParametro[] = [livId];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id no estoque
    if (loj_id) {
      sql += ` AND loj_id = $2`;
      parametros.push(loj_id);
    }

    sql += ` ORDER BY etq_id LIMIT 1`;

    const rows = await this.db.executar<{ etq_quantidade_disponivel: number }>(sql, parametros);
    return rows.length ? rows[0].etq_quantidade_disponivel : null;
  }

  async obterLivIdPorUuid(livUuid: string): Promise<number | null> {
    const rows = await this.db.executar<{ liv_id: number }>(
      'SELECT liv_id FROM livraria_comercial.livros WHERE liv_uuid = $1',
      [livUuid] as DbParametro[],
    );
    return rows.length ? rows[0].liv_id : null;
  }

  async atualizarLivroParcial(livUuid: string, dados: {
    titulo?: string;
    sinopse?: string;
    imagemUrl?: string;
    ano?: number;
    edicao?: string;
    numeroPaginas?: number;
    altura?: number;
    largura?: number;
    peso?: number;
    profundidade?: number;
    codigoBarras?: string;
    quantidadeEstoque?: number;
    precoVenda?: number;
    valorCusto?: number;
  }): Promise<ILivroCatalogoDto> {
    const livId = await this.obterLivIdPorUuid(livUuid);
    if (!livId) {
      throw new Error('Livro não encontrado.');
    }

    // Construir SET dinâmico com parâmetros independentes por tabela (livros vs estoques)
    const camposLivro: string[] = [];
    const valoresLivro: DbParametro[] = [];
    let contadorLivro = 1;

    if (dados.titulo !== undefined) {
      camposLivro.push(`liv_titulo = $${contadorLivro++}`);
      valoresLivro.push(dados.titulo);
    }
    if (dados.sinopse !== undefined) {
      camposLivro.push(`liv_sinopse = $${contadorLivro++}`);
      valoresLivro.push(dados.sinopse);
    }
    if (dados.imagemUrl !== undefined) {
      camposLivro.push(`liv_imagem_url = $${contadorLivro++}`);
      valoresLivro.push(dados.imagemUrl);
    }
    if (dados.ano !== undefined) {
      camposLivro.push(`liv_ano = $${contadorLivro++}`);
      valoresLivro.push(dados.ano);
    }
    if (dados.edicao !== undefined) {
      camposLivro.push(`liv_edicao = $${contadorLivro++}`);
      valoresLivro.push(dados.edicao);
    }
    if (dados.numeroPaginas !== undefined) {
      camposLivro.push(`liv_numero_paginas = $${contadorLivro++}`);
      valoresLivro.push(dados.numeroPaginas);
    }
    if (dados.altura !== undefined) {
      camposLivro.push(`liv_altura = $${contadorLivro++}`);
      valoresLivro.push(dados.altura);
    }
    if (dados.largura !== undefined) {
      camposLivro.push(`liv_largura = $${contadorLivro++}`);
      valoresLivro.push(dados.largura);
    }
    if (dados.peso !== undefined) {
      camposLivro.push(`liv_peso = $${contadorLivro++}`);
      valoresLivro.push(dados.peso);
    }
    if (dados.profundidade !== undefined) {
      camposLivro.push(`liv_profundidade = $${contadorLivro++}`);
      valoresLivro.push(dados.profundidade);
    }
    if (dados.codigoBarras !== undefined) {
      camposLivro.push(`liv_codigo_barras = $${contadorLivro++}`);
      valoresLivro.push(dados.codigoBarras);
    }

    const camposEstoque: string[] = [];
    const valoresEstoque: DbParametro[] = [];
    let contadorEstoque = 1;

    if (dados.quantidadeEstoque !== undefined) {
      camposEstoque.push(`etq_quantidade_disponivel = $${contadorEstoque++}`);
      valoresEstoque.push(dados.quantidadeEstoque);
    }
    if (dados.precoVenda !== undefined) {
      camposEstoque.push(`etq_preco_venda = $${contadorEstoque++}`);
      valoresEstoque.push(dados.precoVenda);
    }
    if (dados.valorCusto !== undefined) {
      camposEstoque.push(`etq_valor_custo = $${contadorEstoque++}`);
      valoresEstoque.push(dados.valorCusto);
    }

    if (camposLivro.length === 0 && camposEstoque.length === 0) {
      throw new Error('Nenhum dado válido fornecido para atualização.');
    }

    if (camposLivro.length > 0) {
      const sqlLivro = `
        UPDATE livros
        SET ${camposLivro.join(', ')}
        WHERE liv_id = $${contadorLivro}
      `;
      valoresLivro.push(livId);
      await this.db.executar(sqlLivro, valoresLivro);
    }

    if (camposEstoque.length > 0) {
      const sqlEstoque = `
        UPDATE estoques
        SET ${camposEstoque.join(', ')}
        WHERE liv_id = $${contadorEstoque}
        AND etq_ativo = TRUE
        RETURNING liv_id
      `;
      valoresEstoque.push(livId);

      const resultado = await this.db.executar<{ liv_id: number }>(sqlEstoque, valoresEstoque);
      if (resultado.length === 0) {
        throw new Error('Nenhum registro de estoque encontrado para atualização.');
      }
    }

    // Retornar livro atualizado
    const livroAtualizado = await this.obterPorUuid(livUuid);
    if (!livroAtualizado) {
      throw new Error('Erro ao carregar livro atualizado.');
    }
    return livroAtualizado;
  }

  async inativarLivro(uuid: string): Promise<void> {
    const sql = `
      UPDATE livros
      SET liv_ativo = FALSE, liv_atualizado_em = CURRENT_TIMESTAMP
      WHERE liv_uuid = $1
    `;
    await this.db.executar(sql, [uuid]);
  }

  async ativarLivro(uuid: string): Promise<void> {
    const sql = `
      UPDATE livros
      SET liv_ativo = TRUE, liv_atualizado_em = CURRENT_TIMESTAMP
      WHERE liv_uuid = $1
    `;
    await this.db.executar(sql, [uuid]);
  }
}
