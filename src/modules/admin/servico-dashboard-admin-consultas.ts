import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';

/** Consultas auxiliares do dashboard (extraídas para respeitar max-lines). */
export class DashboardAdminConsultas {
  constructor(private readonly db: IConexaoBanco) {}

  public async contarPorStatus(descricao: string): Promise<number> {
    return this.obterScalarInt(
      `SELECT COUNT(*)::int AS c
       FROM vendas v
       JOIN status_vendas s ON v.stv_id = s.stv_id
       WHERE s.stv_descricao = $1`,
      [descricao],
    );
  }

  public async obterDuasCategorias(): Promise<string[]> {
    const rows = await this.db.executar<{ cat_nome: string }>(
      `SELECT cat_nome FROM categorias WHERE cat_ativo = TRUE ORDER BY cat_nome ASC LIMIT 2`,
      [],
    );
    if (rows.length >= 2) {
      return [rows[0].cat_nome, rows[1].cat_nome];
    }
    if (rows.length === 1) {
      return [rows[0].cat_nome, 'Outros'];
    }
    return ['Catálogo', 'Outros'];
  }

  public async contarItensVendidosPorCategoriaMes(
    catNome: string,
    anoRef: number,
    mesRef: number,
  ): Promise<number> {
    if (catNome === 'Outros' || catNome === 'Catálogo') {
      return 0;
    }
    const rows = await this.db.executar<{ c: number }>(
      `SELECT COALESCE(SUM(iv.itv_quantidade), 0)::int AS c
       FROM itens_venda iv
       INNER JOIN vendas ven ON iv.ven_id = ven.ven_id
       INNER JOIN livros l ON l.liv_uuid = iv.liv_uuid
       INNER JOIN livro_categorias lc ON lc.liv_id = l.liv_id
       INNER JOIN categorias cat ON cat.cat_id = lc.cat_id
       WHERE cat.cat_nome = $1
         AND EXTRACT(YEAR FROM ven.ven_criado_em) = $2
         AND EXTRACT(MONTH FROM ven.ven_criado_em) = $3`,
      [catNome, anoRef, mesRef] as DbParametro[],
    );
    return rows[0]?.c ?? 0;
  }

  public async obterAtividadesRecentes(): Promise<Record<string, unknown>[]> {
    const rows = await this.db.executar<{
      ven_uuid: string;
      ven_total_venda: string;
      ven_criado_em: string;
    }>(
      `SELECT ven_uuid, ven_total_venda::text, ven_criado_em::text
       FROM vendas
       ORDER BY ven_criado_em DESC
       LIMIT 5`,
      [],
    );
    return rows.map((r) => {
      const part = r.ven_uuid.split('-')[1] ?? r.ven_uuid;
      const total = Number(r.ven_total_venda);
      const dataFmt = new Date(r.ven_criado_em).toLocaleString('pt-BR');
      return {
        uuid: r.ven_uuid,
        tipo: 'Venda',
        descricao: `Pedido #${part.toUpperCase()} — Total R$ ${total.toFixed(2)}`,
        data: dataFmt,
        sucesso: true,
      };
    });
  }

  public async obterScalar(sql: string, params: DbParametro[]): Promise<number> {
    const rows = await this.db.executar<{ v: string }>(sql, params);
    return Number(rows[0]?.v ?? 0);
  }

  public async obterScalarInt(sql: string, params: DbParametro[]): Promise<number> {
    const rows = await this.db.executar<{ c: number }>(sql, params);
    return Number(rows[0]?.c ?? 0);
  }
}
