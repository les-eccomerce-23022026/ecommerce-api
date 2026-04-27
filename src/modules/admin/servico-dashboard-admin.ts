import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { PAPEL_CLIENTE } from '@/shared/types/papeis';

export type IDashboardAdminJson = Record<string, unknown>;

export class ServicoDashboardAdmin {
  constructor(private readonly db: IConexaoBanco) {}

  async obterDashboard(): Promise<IDashboardAdminJson> {
    const agora = new Date();
    const ano = agora.getFullYear();
    const inicioMes = new Date(ano, agora.getMonth(), 1);
    const fimMes = new Date(ano, agora.getMonth() + 1, 0, 23, 59, 59, 999);
    const inicioMesAnterior = new Date(ano, agora.getMonth() - 1, 1);
    const fimMesAnterior = new Date(ano, agora.getMonth(), 0, 23, 59, 59, 999);

    const [
      totalVendasMes, totalVendasMesAnterior, ticketMedio, ticketMedioMesAnterior,
      pedidosPendentes, trocasSolicitadas, clientesAtivos, novosClientesMes,
      novosClientesMesAnterior, livrosBaixoEstoque, cntEntregue, cntTransito,
      cntPreparando, cntPendentes, cntDevolucoes, categoriasTop, atividadesRecentes,
    ] = await Promise.all([
      this.obterScalar(`SELECT COALESCE(SUM(ven_total_venda), 0)::numeric AS v FROM vendas WHERE ven_criado_em >= $1 AND ven_criado_em <= $2`, [inicioMes, fimMes]),
      this.obterScalar(`SELECT COALESCE(SUM(ven_total_venda), 0)::numeric AS v FROM vendas WHERE ven_criado_em >= $1 AND ven_criado_em <= $2`, [inicioMesAnterior, fimMesAnterior]),
      this.obterScalar(`SELECT COALESCE(AVG(ven_total_venda), 0)::numeric AS v FROM vendas`, []),
      this.obterScalar(`SELECT COALESCE(AVG(ven_total_venda), 0)::numeric AS v FROM vendas WHERE ven_criado_em >= $1 AND ven_criado_em <= $2`, [inicioMesAnterior, fimMesAnterior]),
      this.obterScalarInt(`SELECT COUNT(*)::int AS c FROM vendas v JOIN status_vendas s ON v.stv_id = s.stv_id WHERE s.stv_descricao = 'EM PROCESSAMENTO'`, []),
      this.obterScalarInt(`SELECT COUNT(*)::int AS c FROM vendas v JOIN status_vendas s ON v.stv_id = s.stv_id WHERE s.stv_descricao IN ('EM TROCA', 'TROCA AUTORIZADA')`, []),
      this.obterScalarInt(`SELECT COUNT(*)::int AS c FROM usuarios WHERE pap_id = $1 AND usu_ativo = TRUE`, [PAPEL_CLIENTE.id] as DbParametro[]),
      this.obterScalarInt(`SELECT COUNT(*)::int AS c FROM usuarios WHERE pap_id = $1 AND usu_criado_em >= $2 AND usu_criado_em <= $3`, [PAPEL_CLIENTE.id, inicioMes, fimMes] as DbParametro[]),
      this.obterScalarInt(`SELECT COUNT(*)::int AS c FROM usuarios WHERE pap_id = $1 AND usu_criado_em >= $2 AND usu_criado_em <= $3`, [PAPEL_CLIENTE.id, inicioMesAnterior, fimMesAnterior] as DbParametro[]),
      this.obterScalarInt(`SELECT COUNT(*)::int AS c FROM estoques e WHERE e.etq_ativo = TRUE AND e.etq_quantidade_disponivel <= 5`, []),
      this.contarPorStatus('ENTREGUE'),
      this.contarPorStatus('EM TRÂNSITO'),
      this.contarPorStatus('APROVADA'),
      this.contarPorStatus('EM PROCESSAMENTO'),
      this.obterScalarInt(`SELECT COUNT(*)::int AS c FROM vendas v JOIN status_vendas s ON v.stv_id = s.stv_id WHERE s.stv_descricao IN ('EM TROCA', 'REPROVADA')`, []),
      this.obterDuasCategorias(),
      this.obterAtividadesRecentes(),
    ]);

    const percentualCrescimento = ServicoDashboardAdmin.calcularPercentual(totalVendasMes, totalVendasMesAnterior);
    const percentualCrescimentoTicket = ServicoDashboardAdmin.calcularPercentual(ticketMedio, ticketMedioMesAnterior, 1);
    const percentualCrescimentoClientes = ServicoDashboardAdmin.calcularPercentual(novosClientesMes, novosClientesMesAnterior);

    const mesesParaGrafico = [2, 1, 0];
    const labelsMeses = mesesParaGrafico.map((i) => {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const label = d.toLocaleString('pt-BR', { month: 'short' });
      return label.charAt(0).toUpperCase() + label.slice(1);
    });

    const receitaMensal = await Promise.all(mesesParaGrafico.map((i) => {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const ini = new Date(d.getFullYear(), d.getMonth(), 1);
      const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      return this.obterScalar(`SELECT COALESCE(SUM(ven_total_venda), 0)::numeric AS v FROM vendas WHERE ven_criado_em >= $1 AND ven_criado_em <= $2`, [ini, fim]);
    }));

    const datasetsCategoria = await Promise.all(categoriasTop.map(async (catNome, idx) => {
      const borderColor = idx === 0 ? 'rgb(15, 76, 58)' : 'rgb(210, 180, 140)';
      const backgroundColor = idx === 0 ? 'rgba(15, 76, 58, 0.5)' : 'rgba(210, 180, 140, 0.5)';
      const data = await Promise.all(mesesParaGrafico.map((j) => {
        const d = new Date(agora.getFullYear(), agora.getMonth() - j, 1);
        return this.contarItensVendidosPorCategoriaMes(catNome, d.getFullYear(), d.getMonth() + 1);
      }));
      return { label: catNome, data, borderColor, backgroundColor };
    }));

    return {
      metricas: { totalVendasMes: Number(totalVendasMes), percentualCrescimento, pedidosPendentes, trocasSolicitadas, ticketMedio: Number(ticketMedio), percentualCrescimentoTicket, clientesAtivos, percentualCrescimentoClientes, livrosBaixoEstoque },
      graficoVendasPorCategoria: { labels: labelsMeses, datasets: datasetsCategoria },
      graficoReceitaAnual: { labels: labelsMeses, datasets: [{ label: `Receita (R$) ${ano}`, data: receitaMensal.map((r) => Number(r)), borderColor: 'rgb(46, 139, 87)', backgroundColor: 'rgba(46, 139, 87, 0.2)', fill: true, tension: 0.4 }] },
      graficoStatusPedidos: { labels: ['Entregues', 'Em Trânsito', 'Preparando', 'Pendentes', 'Devoluções'], datasets: [{ label: 'Status dos Pedidos', data: [cntEntregue, cntTransito, cntPreparando, cntPendentes, cntDevolucoes], backgroundColor: ['rgba(15, 76, 58, 0.8)', 'rgba(46, 139, 87, 0.8)', 'rgba(210, 180, 140, 0.8)', 'rgba(255, 165, 0, 0.8)', 'rgba(201, 48, 44, 0.8)'] }] },
      atividadesRecentes,
    };
  }

  private static calcularPercentual(atual: number, anterior: number, precisao = 0): number {
    if (anterior <= 0) return atual > 0 ? 100 : 0;
    const fator = 10 ** precisao;
    return Math.round(((atual / anterior) - 1) * 100 * fator) / fator;
  }

  private async contarPorStatus(descricao: string): Promise<number> {
    return this.obterScalarInt(`SELECT COUNT(*)::int AS c FROM vendas v JOIN status_vendas s ON v.stv_id = s.stv_id WHERE s.stv_descricao = $1`, [descricao]);
  }

  private async obterDuasCategorias(): Promise<string[]> {
    const rows = await this.db.executar<{ cat_nome: string }>(`SELECT cat_nome FROM categorias WHERE cat_ativo = TRUE ORDER BY cat_nome ASC LIMIT 2`, []);
    if (rows.length >= 2) return [rows[0].cat_nome, rows[1].cat_nome];
    return rows.length === 1 ? [rows[0].cat_nome, 'Outros'] : ['Catálogo', 'Outros'];
  }

  private async contarItensVendidosPorCategoriaMes(catNome: string, anoRef: number, mesRef: number): Promise<number> {
    if (catNome === 'Outros' || catNome === 'Catálogo') return 0;
    const rows = await this.db.executar<{ c: number }>(`SELECT COALESCE(SUM(iv.itv_quantidade), 0)::int AS c FROM itens_venda iv INNER JOIN vendas ven ON iv.ven_id = ven.ven_id INNER JOIN livros l ON l.liv_uuid = iv.liv_uuid INNER JOIN livro_categorias lc ON lc.liv_id = l.liv_id INNER JOIN categorias cat ON cat.cat_id = lc.cat_id WHERE cat.cat_nome = $1 AND EXTRACT(YEAR FROM ven.ven_criado_em) = $2 AND EXTRACT(MONTH FROM ven.ven_criado_em) = $3`, [catNome, anoRef, mesRef] as DbParametro[]);
    return rows[0]?.c ?? 0;
  }

  private async obterAtividadesRecentes(): Promise<Record<string, unknown>[]> {
    const rows = await this.db.executar<{ ven_uuid: string; ven_total_venda: string; ven_criado_em: string; }>(`SELECT ven_uuid, ven_total_venda::text, ven_criado_em::text FROM vendas ORDER BY ven_criado_em DESC LIMIT 5`, []);
    return rows.map((r) => {
      const part = r.ven_uuid.split('-')[1] ?? r.ven_uuid;
      return { uuid: r.ven_uuid, tipo: 'Venda', descricao: `Pedido #${part.toUpperCase()} — Total R$ ${Number(r.ven_total_venda).toFixed(2)}`, data: new Date(r.ven_criado_em).toLocaleString('pt-BR'), sucesso: true };
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
