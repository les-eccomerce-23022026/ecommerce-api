import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { PAPEL_CLIENTE } from '@/shared/types/papeis';

export type IDashboardAdminJson = Record<string, unknown>;

/**
 * Monta o payload do dashboard administrativo no formato esperado pelo frontend (`IDashboardAdminInfo`).
 */
export class ServicoDashboardAdmin {
  constructor(private readonly db: IConexaoBanco) {}

  async obterDashboard(): Promise<IDashboardAdminJson> {
    const agora = new Date();
    const ano = agora.getFullYear();

    const inicioMes = new Date(ano, agora.getMonth(), 1);
    const fimMes = new Date(ano, agora.getMonth() + 1, 0, 23, 59, 59, 999);
    const inicioMesAnterior = new Date(ano, agora.getMonth() - 1, 1);
    const fimMesAnterior = new Date(ano, agora.getMonth(), 0, 23, 59, 59, 999);

    const totalVendasMes = await this.obterScalar(
      `SELECT COALESCE(SUM(ven_total_venda), 0)::numeric AS v
       FROM vendas
       WHERE ven_criado_em >= $1 AND ven_criado_em <= $2`,
      [inicioMes, fimMes],
    );

    const totalVendasMesAnterior = await this.obterScalar(
      `SELECT COALESCE(SUM(ven_total_venda), 0)::numeric AS v
       FROM vendas
       WHERE ven_criado_em >= $1 AND ven_criado_em <= $2`,
      [inicioMesAnterior, fimMesAnterior],
    );

    const percentualCrescimento =
      totalVendasMesAnterior > 0
        ? Math.round((totalVendasMes / totalVendasMesAnterior - 1) * 100)
        : totalVendasMes > 0
          ? 100
          : 0;

    const ticketMedio = await this.obterScalar(
      `SELECT COALESCE(AVG(ven_total_venda), 0)::numeric AS v FROM vendas`,
      [],
    );

    const ticketMedioMesAnterior = await this.obterScalar(
      `SELECT COALESCE(AVG(ven_total_venda), 0)::numeric AS v
       FROM vendas
       WHERE ven_criado_em >= $1 AND ven_criado_em <= $2`,
      [inicioMesAnterior, fimMesAnterior],
    );

    const percentualCrescimentoTicket =
      ticketMedioMesAnterior > 0
        ? Math.round((ticketMedio / ticketMedioMesAnterior - 1) * 100 * 10) / 10
        : 0;

    const pedidosPendentes = await this.obterScalarInt(
      `SELECT COUNT(*)::int AS c
       FROM vendas v
       JOIN status_vendas s ON v.stv_id = s.stv_id
       WHERE s.stv_descricao = 'EM PROCESSAMENTO'`,
      [],
    );

    const trocasSolicitadas = await this.obterScalarInt(
      `SELECT COUNT(*)::int AS c
       FROM vendas v
       JOIN status_vendas s ON v.stv_id = s.stv_id
       WHERE s.stv_descricao IN ('EM TROCA', 'TROCA AUTORIZADA')`,
      [],
    );

    const clientesAtivos = await this.obterScalarInt(
      `SELECT COUNT(*)::int AS c
       FROM usuarios
       WHERE pap_id = $1 AND usu_ativo = TRUE`,
      [PAPEL_CLIENTE.id] as DbParametro[],
    );

    const novosClientesMes = await this.obterScalarInt(
      `SELECT COUNT(*)::int AS c
       FROM usuarios
       WHERE pap_id = $1 AND usu_criado_em >= $2 AND usu_criado_em <= $3`,
      [PAPEL_CLIENTE.id, inicioMes, fimMes] as DbParametro[],
    );

    const novosClientesMesAnterior = await this.obterScalarInt(
      `SELECT COUNT(*)::int AS c
       FROM usuarios
       WHERE pap_id = $1 AND usu_criado_em >= $2 AND usu_criado_em <= $3`,
      [PAPEL_CLIENTE.id, inicioMesAnterior, fimMesAnterior] as DbParametro[],
    );

    const percentualCrescimentoClientes =
      novosClientesMesAnterior > 0
        ? Math.round((novosClientesMes / novosClientesMesAnterior - 1) * 100)
        : novosClientesMes > 0
          ? 100
          : 0;

    const livrosBaixoEstoque = await this.obterScalarInt(
      `SELECT COUNT(*)::int AS c
       FROM estoques e
       WHERE e.etq_ativo = TRUE
         AND e.etq_quantidade_disponivel <= 5`,
      [],
    );

    const statusLabels = ['Entregues', 'Em Trânsito', 'Preparando', 'Pendentes', 'Devoluções'];
    const cntEntregue = await this.contarPorStatus('ENTREGUE');
    const cntTransito = await this.contarPorStatus('EM TRÂNSITO');
    const cntPreparando = await this.contarPorStatus('APROVADA');
    const cntPendentes = await this.contarPorStatus('EM PROCESSAMENTO');
    const cntDevolucoes = await this.obterScalarInt(
      `SELECT COUNT(*)::int AS c
       FROM vendas v
       JOIN status_vendas s ON v.stv_id = s.stv_id
       WHERE s.stv_descricao IN ('EM TROCA', 'REPROVADA')`,
      [],
    );
    const statusData = [cntEntregue, cntTransito, cntPreparando, cntPendentes, cntDevolucoes];

    const labelsMeses: string[] = [];
    const receitaMensal: number[] = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const label = d.toLocaleString('pt-BR', { month: 'short' });
      labelsMeses.push(label.charAt(0).toUpperCase() + label.slice(1));

      const ini = new Date(d.getFullYear(), d.getMonth(), 1);
      const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const r = await this.obterScalar(
        `SELECT COALESCE(SUM(ven_total_venda), 0)::numeric AS v
         FROM vendas
         WHERE ven_criado_em >= $1 AND ven_criado_em <= $2`,
        [ini, fim],
      );
      receitaMensal.push(Number(r));
    }

    const categoriasTop = await this.obterDuasCategorias();
    const datasetsCategoria = await Promise.all(
      categoriasTop.map(async (catNome, idx) => {
        const borderColor = idx === 0 ? 'rgb(15, 76, 58)' : 'rgb(210, 180, 140)';
        const backgroundColor = idx === 0 ? 'rgba(15, 76, 58, 0.5)' : 'rgba(210, 180, 140, 0.5)';
        const data: number[] = [];
        for (let j = 2; j >= 0; j--) {
          const d = new Date(agora.getFullYear(), agora.getMonth() - j, 1);
          const q = await this.contarItensVendidosPorCategoriaMes(
            catNome,
            d.getFullYear(),
            d.getMonth() + 1,
          );
          data.push(q);
        }
        return {
          label: catNome,
          data,
          borderColor,
          backgroundColor,
        };
      }),
    );

    const atividadesRecentes = await this.obterAtividadesRecentes();

    return {
      metricas: {
        totalVendasMes: Number(totalVendasMes),
        percentualCrescimento,
        pedidosPendentes,
        trocasSolicitadas,
        ticketMedio: Number(ticketMedio),
        percentualCrescimentoTicket,
        clientesAtivos,
        percentualCrescimentoClientes,
        livrosBaixoEstoque,
      },
      graficoVendasPorCategoria: {
        labels: labelsMeses,
        datasets: datasetsCategoria,
      },
      graficoReceitaAnual: {
        labels: labelsMeses,
        datasets: [
          {
            label: `Receita (R$) ${ano}`,
            data: receitaMensal,
            borderColor: 'rgb(46, 139, 87)',
            backgroundColor: 'rgba(46, 139, 87, 0.2)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      graficoStatusPedidos: {
        labels: statusLabels,
        datasets: [
          {
            label: 'Status dos Pedidos',
            data: statusData,
            backgroundColor: [
              'rgba(15, 76, 58, 0.8)',
              'rgba(46, 139, 87, 0.8)',
              'rgba(210, 180, 140, 0.8)',
              'rgba(255, 165, 0, 0.8)',
              'rgba(201, 48, 44, 0.8)',
            ],
          },
        ],
      },
      atividadesRecentes,
    };
  }

  private async contarPorStatus(descricao: string): Promise<number> {
    return this.obterScalarInt(
      `SELECT COUNT(*)::int AS c
       FROM vendas v
       JOIN status_vendas s ON v.stv_id = s.stv_id
       WHERE s.stv_descricao = $1`,
      [descricao],
    );
  }

  private async obterDuasCategorias(): Promise<string[]> {
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

  private async contarItensVendidosPorCategoriaMes(
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

  private async obterAtividadesRecentes(): Promise<Record<string, unknown>[]> {
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

  private async obterScalar(sql: string, params: DbParametro[]): Promise<number> {
    const rows = await this.db.executar<{ v: string }>(sql, params);
    return Number(rows[0]?.v ?? 0);
  }

  private async obterScalarInt(sql: string, params: DbParametro[]): Promise<number> {
    const rows = await this.db.executar<{ c: number }>(sql, params);
    return Number(rows[0]?.c ?? 0);
  }
}
