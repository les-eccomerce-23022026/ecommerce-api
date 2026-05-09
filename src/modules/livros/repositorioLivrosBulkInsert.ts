/* eslint-disable max-lines */
import type { IConexaoBanco, DbParametro } from '../../shared/infrastructure/database/IConexaoBanco';

export class RepositorioLivrosBulkInsert {
  constructor(private readonly db: IConexaoBanco) {}

  async inserirLivrosEmLote(dadosLivros: Array<{
    uuid: string;
    titulo: string;
    isbn: string;
    sinopse?: string;
    imagemUrl?: string;
    autorId: number;
    editoraId: number;
    grupoPrecificacaoId: number;
    ano: number;
    edicao: string;
    numeroPaginas: number;
    altura: number;
    largura: number;
    peso: number;
    profundidade: number;
    codigoBarras: string;
  }>): Promise<number[]> {
    if (dadosLivros.length === 0) return [];

    const sql = `
      INSERT INTO livros (
        liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
        liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
        aut_id, edi_id, gpr_id
      ) VALUES 
    `;

    const values: string[] = [];
    const params: DbParametro[] = [];
    let paramIndex = 1;

    dadosLivros.forEach((livro) => {
      const baseIndex = paramIndex;
      values.push(`($${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, $${baseIndex + 13}, $${baseIndex + 14}, $${baseIndex + 15})`);
      
      params.push(
        livro.uuid,
        livro.titulo,
        livro.ano,
        livro.edicao,
        livro.isbn,
        livro.numeroPaginas,
        livro.sinopse || null,
        livro.altura,
        livro.largura,
        livro.peso,
        livro.profundidade,
        livro.codigoBarras,
        livro.imagemUrl || null,
        livro.autorId,
        livro.editoraId,
        livro.grupoPrecificacaoId,
      );

      paramIndex += 16;
    });

    const finalSql = `${sql + values.join(', ')  } RETURNING liv_id`;
    const rows = await this.db.executar<{ liv_id: number }>(finalSql, params);
    return rows.map((r) => r.liv_id);
  }

  async inserirEstoquesEmLote(dadosEstoques: Array<{
    livId: number;
    quantidadeDisponivel: number;
    precoVenda: number;
    valorCustoAtual: number;
  }>): Promise<void> {
    if (dadosEstoques.length === 0) return;

    const sql = `
      INSERT INTO estoques (
        liv_id, etq_quantidade_disponivel, etq_quantidade_reservada,
        etq_preco_venda, etq_valor_custo_atual
      ) VALUES 
    `;

    const values: string[] = [];
    const params: DbParametro[] = [];
    let paramIndex = 1;

    dadosEstoques.forEach((estoque) => {
      const baseIndex = paramIndex;
      values.push(`($${baseIndex}, $${baseIndex + 1}, 0, $${baseIndex + 2}, $${baseIndex + 3})`);
      
      params.push(
        estoque.livId,
        estoque.quantidadeDisponivel,
        estoque.precoVenda,
        estoque.valorCustoAtual,
      );

      paramIndex += 4;
    });

    const finalSql = sql + values.join(', ');
    await this.db.executar(finalSql, params);
  }

  async vincularCategoriasEmLote(vinculos: Array<{ livId: number; catId: number }>): Promise<void> {
    if (vinculos.length === 0) return;

    const sql = `
      INSERT INTO livro_categorias (liv_id, cat_id) VALUES 
    `;

    const values: string[] = [];
    const params: DbParametro[] = [];
    let paramIndex = 1;

    vinculos.forEach((vinculo) => {
      const baseIndex = paramIndex;
      values.push(`($${baseIndex}, $${baseIndex + 1})`);
      
      params.push(vinculo.livId, vinculo.catId);
      paramIndex += 2;
    });

    const finalSql = `${sql + values.join(', ')  } ON CONFLICT (liv_id, cat_id) DO NOTHING`;
    await this.db.executar(finalSql, params);
  }

  async inserirAutoresEmLote(autores: Array<{ nome: string; descricao?: string }>): Promise<number[]> {
    if (autores.length === 0) return [];

    const sql = `
      INSERT INTO autores (aut_nome, aut_descricao) VALUES 
    `;

    const values: string[] = [];
    const params: DbParametro[] = [];
    let paramIndex = 1;

    autores.forEach((autor) => {
      const baseIndex = paramIndex;
      values.push(`($${baseIndex}, $${baseIndex + 1})`);
      
      params.push(autor.nome, autor.descricao || null);
      paramIndex += 2;
    });

    const finalSql = `${sql + values.join(', ')  } ON CONFLICT (aut_nome) DO UPDATE SET aut_descricao = EXCLUDED.aut_descricao RETURNING aut_id`;
    const rows = await this.db.executar<{ aut_id: number }>(finalSql, params);
    return rows.map((r) => r.aut_id);
  }

  async inserirEditorasEmLote(editoras: Array<{ nome: string; cnpj: string }>): Promise<number[]> {
    if (editoras.length === 0) return [];

    const sql = `
      INSERT INTO editoras (edi_nome, edi_cnpj) VALUES 
    `;

    const values: string[] = [];
    const params: DbParametro[] = [];
    let paramIndex = 1;

    editoras.forEach((editora) => {
      const baseIndex = paramIndex;
      values.push(`($${baseIndex}, $${baseIndex + 1})`);
      
      params.push(editora.nome, editora.cnpj);
      paramIndex += 2;
    });

    const finalSql = `${sql + values.join(', ')  } ON CONFLICT (edi_nome) DO NOTHING RETURNING edi_id`;
    const rows = await this.db.executar<{ edi_id: number }>(finalSql, params);
    return rows.map((r) => r.edi_id);
  }

  async buscarIdsPorNomes(tabela: string, campoNome: string, campoId: string, nomes: string[]): Promise<Map<string, number>> {
    if (nomes.length === 0) return new Map();

    const sql = `
      SELECT ${campoId} as id, ${campoNome} as nome 
      FROM ${tabela} 
      WHERE ${campoNome} = ANY($1)
    `;

    const rows = await this.db.executar<{ id: number; nome: string }>(sql, [nomes] as DbParametro[]);
    const mapa = new Map<string, number>();
    rows.forEach((r) => mapa.set(r.nome, r.id));
    return mapa;
  }

  async criarLivroComTransacao(dados: {
    uuid: string;
    titulo: string;
    isbn: string;
    sinopse?: string;
    imagemUrl?: string;
    autorId: number;
    editoraId: number;
    grupoPrecificacaoId: number;
    ano: number;
    edicao: string;
    numeroPaginas: number;
    altura: number;
    largura: number;
    peso: number;
    profundidade: number;
    codigoBarras: string;
    quantidadeEstoque: number;
    precoVenda: number;
    valorCusto: number;
    categoriaId?: number;
  }): Promise<{ livId: number; livroUuid: string }> {
    return this.db.transacao(async (client) => {
      // Inserir livro
      const livroSql = `
        INSERT INTO livros (
          liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
          liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
          aut_id, edi_id, gpr_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING liv_id
      `;
      const livroParams = [
        dados.uuid,
        dados.titulo,
        dados.ano,
        dados.edicao,
        dados.isbn,
        dados.numeroPaginas,
        dados.sinopse || null,
        dados.altura,
        dados.largura,
        dados.peso,
        dados.profundidade,
        dados.codigoBarras,
        dados.imagemUrl || null,
        dados.autorId,
        dados.editoraId,
        dados.grupoPrecificacaoId,
      ] as DbParametro[];

      const livroRows = await client.executar<{ liv_id: number }>(livroSql, livroParams);
      const livId = livroRows[0].liv_id;

      // Inserir estoque
      const estoqueSql = `
        INSERT INTO estoques (
          liv_id, etq_quantidade_disponivel, etq_quantidade_reservada,
          etq_preco_venda, etq_valor_custo_atual
        ) VALUES ($1, $2, 0, $3, $4)
      `;
      const estoqueParams = [
        livId,
        dados.quantidadeEstoque,
        dados.precoVenda,
        dados.valorCusto,
      ] as DbParametro[];
      await client.executar(estoqueSql, estoqueParams);

      // Vincular categoria se fornecida
      if (dados.categoriaId) {
        const categoriaSql = `
          INSERT INTO livro_categorias (liv_id, cat_id) VALUES ($1, $2)
          ON CONFLICT (liv_id, cat_id) DO NOTHING
        `;
        await client.executar(categoriaSql, [livId, dados.categoriaId] as DbParametro[]);
      }

      return { livId, livroUuid: dados.uuid };
    });
  }

  async criarLivrosEmLoteComTransacao(dadosLivros: Array<{
    uuid: string;
    titulo: string;
    isbn: string;
    sinopse?: string;
    imagemUrl?: string;
    autorId: number;
    editoraId: number;
    grupoPrecificacaoId: number;
    categoriaId?: number;
    ano: number;
    edicao: string;
    numeroPaginas: number;
    altura: number;
    largura: number;
    peso: number;
    profundidade: number;
    codigoBarras: string;
    quantidadeEstoque: number;
    precoVenda: number;
    valorCusto: number;
  }>): Promise<Array<{ livId: number; livroUuid: string }>> {
    if (dadosLivros.length === 0) return [];

    return this.db.transacao(async (client) => {
      // Inserir livros em lote
      const livroSql = `
        INSERT INTO livros (
          liv_uuid, liv_titulo, liv_ano, liv_edicao, liv_isbn, liv_numero_paginas, liv_sinopse,
          liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_imagem_url,
          aut_id, edi_id, gpr_id
        ) VALUES 
      `;

      const livroValues: string[] = [];
      const livroParams: DbParametro[] = [];
      let paramIndex = 1;

      dadosLivros.forEach((livro) => {
        const baseIndex = paramIndex;
        livroValues.push(`($${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, $${baseIndex + 13}, $${baseIndex + 14}, $${baseIndex + 15})`);
        
        livroParams.push(
          livro.uuid,
          livro.titulo,
          livro.ano,
          livro.edicao,
          livro.isbn,
          livro.numeroPaginas,
          livro.sinopse || null,
          livro.altura,
          livro.largura,
          livro.peso,
          livro.profundidade,
          livro.codigoBarras,
          livro.imagemUrl || null,
          livro.autorId,
          livro.editoraId,
          livro.grupoPrecificacaoId,
        );

        paramIndex += 16;
      });

      const livroFinalSql = `${livroSql + livroValues.join(', ')  } RETURNING liv_id, liv_uuid`;
      const livroRows = await client.executar<{ liv_id: number; liv_uuid: string }>(livroFinalSql, livroParams);
      const livrosCriados = livroRows.map((r) => ({ livId: r.liv_id, livroUuid: r.liv_uuid }));

      // Inserir estoques em lote
      const estoqueSql = `
        INSERT INTO estoques (
          liv_id, etq_quantidade_disponivel, etq_quantidade_reservada,
          etq_preco_venda, etq_valor_custo_atual
        ) VALUES 
      `;

      const estoqueValues: string[] = [];
      const estoqueParams: DbParametro[] = [];
      paramIndex = 1;

      dadosLivros.forEach((livro, index) => {
        const baseIndex = paramIndex;
        estoqueValues.push(`($${baseIndex}, $${baseIndex + 1}, 0, $${baseIndex + 2}, $${baseIndex + 3})`);
        
        estoqueParams.push(
          livrosCriados[index].livId,
          livro.quantidadeEstoque,
          livro.precoVenda,
          livro.valorCusto,
        );

        paramIndex += 4;
      });

      const estoqueFinalSql = estoqueSql + estoqueValues.join(', ');
      await client.executar(estoqueFinalSql, estoqueParams);

      // Vincular categorias em lote
      const vinculos = dadosLivros
        .map((livro, index) => ({
          livId: livrosCriados[index].livId,
          catId: livro.categoriaId,
        }))
        .filter((v) => v.catId !== undefined);

      if (vinculos.length > 0) {
        const categoriaSql = `
          INSERT INTO livro_categorias (liv_id, cat_id) VALUES 
        `;

        const categoriaValues: string[] = [];
        const categoriaParams: DbParametro[] = [];
        paramIndex = 1;

        vinculos.forEach((vinculo) => {
          const baseIndex = paramIndex;
          categoriaValues.push(`($${baseIndex}, $${baseIndex + 1})`);
          
          categoriaParams.push(vinculo.livId, vinculo.catId!);
          paramIndex += 2;
        });

        const categoriaFinalSql = `${categoriaSql + categoriaValues.join(', ')  } ON CONFLICT (liv_id, cat_id) DO NOTHING`;
        await client.executar(categoriaFinalSql, categoriaParams);
      }

      return livrosCriados;
    });
  }
}
