import type { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';

export interface IItemEstoque {
  uuid: string;
  livroUuid: string;
  livroTitulo: string;
  livroIsbn: string;
  quantidadeDisponivel: number;
  quantidadeReservada: number;
  precoVenda: number;
  valorCustoAtual: number;
  ativo: boolean;
}

export interface IEntradaEstoque {
  livroUuid: string;
  quantidade: number;
  custoUnitario: number;
  fornecedorUuid?: string;
  numeroNotaFiscal?: string;
  observacoes?: string;
  dataEntrada?: Date;
}

export class RepositorioEstoque {
  constructor(private readonly db: IConexaoBanco) {}

  private obterLojId(): number | undefined {
    return ContextoRequisicao.obterLojId();
  }

  async listarEstoque(limite = 500): Promise<IItemEstoque[]> {
    const lojId = this.obterLojId();

    let sql = `
      SELECT 
        e.etq_uuid AS uuid,
        l.liv_uuid AS livro_uuid,
        l.liv_titulo AS livro_titulo,
        l.liv_isbn AS livro_isbn,
        e.etq_quantidade_disponivel AS quantidade_disponivel,
        e.etq_quantidade_reservada AS quantidade_reservada,
        e.etq_preco_venda AS preco_venda,
        e.etq_valor_custo_atual AS valor_custo_atual,
        e.etq_ativo AS ativo
      FROM estoques e
      INNER JOIN livros l ON l.liv_id = e.liv_id
      WHERE e.etq_ativo = TRUE
    `;

    const params: any[] = [];

    if (lojId) {
      sql += ` AND e.loj_id = $${params.length + 1}`;
      params.push(lojId);
    }

    sql += ` ORDER BY l.liv_titulo ASC LIMIT $${params.length + 1}`;
    params.push(limite);

    const rows = await this.db.executar<any>(sql, params);

    return rows.map((row) => ({
      uuid: row.uuid,
      livroUuid: row.livro_uuid,
      livroTitulo: row.livro_titulo,
      livroIsbn: row.livro_isbn,
      quantidadeDisponivel: Number(row.quantidade_disponivel),
      quantidadeReservada: Number(row.quantidade_reservada),
      precoVenda: Number(row.preco_venda),
      valorCustoAtual: Number(row.valor_custo_atual) || 0,
      ativo: row.ativo,
    }));
  }

  async obterEstoqueCritico(limite = 5): Promise<IItemEstoque[]> {
    const lojId = this.obterLojId();

    let sql = `
      SELECT 
        e.etq_uuid AS uuid,
        l.liv_uuid AS livro_uuid,
        l.liv_titulo AS livro_titulo,
        l.liv_isbn AS livro_isbn,
        e.etq_quantidade_disponivel AS quantidade_disponivel,
        e.etq_quantidade_reservada AS quantidade_reservada,
        e.etq_preco_venda AS preco_venda,
        e.etq_valor_custo_atual AS valor_custo_atual,
        e.etq_ativo AS ativo
      FROM estoques e
      INNER JOIN livros l ON l.liv_id = e.liv_id
      WHERE e.etq_ativo = TRUE
        AND e.etq_quantidade_disponivel <= $1
    `;

    const params: any[] = [limite];

    if (lojId) {
      sql += ` AND e.loj_id = $${params.length + 1}`;
      params.push(lojId);
    }

    sql += ` ORDER BY e.etq_quantidade_disponivel ASC`;

    const rows = await this.db.executar<any>(sql, params);

    return rows.map((row) => ({
      uuid: row.uuid,
      livroUuid: row.livro_uuid,
      livroTitulo: row.livro_titulo,
      livroIsbn: row.livro_isbn,
      quantidadeDisponivel: Number(row.quantidade_disponivel),
      quantidadeReservada: Number(row.quantidade_reservada),
      precoVenda: Number(row.preco_venda),
      valorCustoAtual: Number(row.valor_custo_atual) || 0,
      ativo: row.ativo,
    }));
  }

  async registrarEntrada(dados: IEntradaEstoque): Promise<void> {
    const lojId = this.obterLojId() || 1;

    await this.db.executar(`
      BEGIN;
    `);

    try {
      // Buscar o liv_id pelo uuid
      const livroRows = await this.db.executar<{ liv_id: number }>(
        'SELECT liv_id FROM livros WHERE liv_uuid = $1',
        [dados.livroUuid]
      );

      if (livroRows.length === 0) {
        throw new Error('Livro não encontrado.');
      }

      const livId = livroRows[0].liv_id;

      // Buscar ou criar fornecedor
      let fornecedorId: number | null = null;
      if (dados.fornecedorUuid) {
        const fornecedorRows = await this.db.executar<{ for_id: number }>(
          'SELECT for_id FROM fornecedores WHERE for_uuid = $1 AND for_ativo = TRUE',
          [dados.fornecedorUuid]
        );
        if (fornecedorRows.length > 0) {
          fornecedorId = fornecedorRows[0].for_id;
        }
      }

      // Registrar entrada no histórico
      if (fornecedorId) {
        await this.db.executar(`
          INSERT INTO historico_entradas_estoque (
            liv_id, for_id, hee_quantidade, hee_valor_custo_unitario,
            hee_valor_total, hee_data_entrada, hee_numero_nota_fiscal, hee_observacoes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          livId,
          fornecedorId,
          dados.quantidade,
          dados.custoUnitario,
          dados.quantidade * dados.custoUnitario,
          dados.dataEntrada || new Date(),
          dados.numeroNotaFiscal || null,
          dados.observacoes || null,
        ]);
      }

      // Atualizar estoque
      await this.db.executar(`
        UPDATE estoques
        SET 
          etq_quantidade_disponivel = etq_quantidade_disponivel + $1,
          etq_valor_custo_atual = $2,
          etq_atualizado_em = CURRENT_TIMESTAMP
        WHERE liv_id = $3 AND etq_ativo = TRUE
      `, [dados.quantidade, dados.custoUnitario, livId]);

      await this.db.executar(`
        COMMIT;
      `);
    } catch (erro) {
      await this.db.executar(`
        ROLLBACK;
      `);
      throw erro;
    }
  }

  async contarEstoqueCritico(limite = 5): Promise<number> {
    const lojId = this.obterLojId();

    let sql = `
      SELECT COUNT(*) AS total
      FROM estoques e
      WHERE e.etq_ativo = TRUE
        AND e.etq_quantidade_disponivel <= $1
    `;

    const params: any[] = [limite];

    if (lojId) {
      sql += ` AND e.loj_id = $${params.length + 1}`;
      params.push(lojId);
    }

    const result = await this.db.executar<{ total: string }>(sql, params);
    return Number(result[0].total);
  }

  async contarTotalEstoque(): Promise<number> {
    const lojId = this.obterLojId();

    let sql = `
      SELECT COUNT(*) AS total
      FROM estoques e
      WHERE e.etq_ativo = TRUE
    `;

    const params: any[] = [];

    if (lojId) {
      sql += ` AND e.loj_id = $${params.length + 1}`;
      params.push(lojId);
    }

    const result = await this.db.executar<{ total: string }>(sql, params);
    return Number(result[0].total);
  }

  async baixarEstoque(livroUuid: string, quantidade: number): Promise<void> {
    const lojId = this.obterLojId() || 1;

    await this.db.executar(`
      UPDATE estoques
      SET etq_quantidade_disponivel = etq_quantidade_disponivel - $1,
          etq_atualizado_em = CURRENT_TIMESTAMP
      WHERE liv_id = (SELECT liv_id FROM livros WHERE liv_uuid = $2)
        AND etq_ativo = TRUE
        AND loj_id = $3
    `, [quantidade, livroUuid, lojId]);
  }

  async calcularValorTotalEstoque(): Promise<number> {
    const lojId = this.obterLojId();

    let sql = `
      SELECT COALESCE(SUM(etq_quantidade_disponivel * etq_preco_venda), 0) AS valor_total
      FROM estoques e
      WHERE e.etq_ativo = TRUE
    `;

    const params: any[] = [];

    if (lojId) {
      sql += ` AND e.loj_id = $${params.length + 1}`;
      params.push(lojId);
    }

    const result = await this.db.executar<{ valor_total: string }>(sql, params);
    return Number(result[0].valor_total);
  }

  async calcularValorTotalCusto(): Promise<number> {
    const lojId = this.obterLojId();

    let sql = `
      SELECT COALESCE(SUM(etq_quantidade_disponivel * etq_valor_custo_atual), 0) AS valor_total
      FROM estoques e
      WHERE e.etq_ativo = TRUE
        AND e.etq_valor_custo_atual IS NOT NULL
    `;

    const params: any[] = [];

    if (lojId) {
      sql += ` AND e.loj_id = $${params.length + 1}`;
      params.push(lojId);
    }

    const result = await this.db.executar<{ valor_total: string }>(sql, params);
    return Number(result[0].valor_total);
  }

  async calcularQuantidadeTotalReservada(): Promise<number> {
    const lojId = this.obterLojId();

    let sql = `
      SELECT COALESCE(SUM(etq_quantidade_reservada), 0) AS total
      FROM estoques e
      WHERE e.etq_ativo = TRUE
    `;

    const params: any[] = [];

    if (lojId) {
      sql += ` AND e.loj_id = $${params.length + 1}`;
      params.push(lojId);
    }

    const result = await this.db.executar<{ total: string }>(sql, params);
    return Number(result[0].total);
  }

  async calcularQuantidadeTotalDisponivel(): Promise<number> {
    const lojId = this.obterLojId();

    let sql = `
      SELECT COALESCE(SUM(etq_quantidade_disponivel), 0) AS total
      FROM estoques e
      WHERE e.etq_ativo = TRUE
    `;

    const params: any[] = [];

    if (lojId) {
      sql += ` AND e.loj_id = $${params.length + 1}`;
      params.push(lojId);
    }

    const result = await this.db.executar<{ total: string }>(sql, params);
    return Number(result[0].total);
  }
}
