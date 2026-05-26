import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { PAPEL_CLIENTE } from '@/shared/types/papeis';
import {
  percentualCrescimento,
  indicesUltimosMeses,
  inicioFimMes,
} from '@/modules/admin/servicoDashboardAdminHelpers';
import { DashboardAdminConsultas } from '@/modules/admin/servicoDashboardAdminConsultas';

export type IDashboardAdminJson = Record<string, unknown>;

export class ServicoDashboardAdmin {
  private readonly consultas: DashboardAdminConsultas;

  constructor(private readonly db: IConexaoBanco) {
    this.consultas = new DashboardAdminConsultas(db);
  }

  async obterDashboard(): Promise<IDashboardAdminJson> {
    const agora = new Date();
    const ano = agora.getFullYear();
    const inicioMes = new Date(ano, agora.getMonth(), 1);
    const fimMes = new Date(ano, agora.getMonth() + 1, 0, 23, 59, 59, 999);
    const inicioMesAnterior = new Date(ano, agora.getMonth() - 1, 1);
    const fimMesAnterior = new Date(ano, agora.getMonth(), 0, 23, 59, 59, 999);
    const totalVendasMes = await this.consultas.obterScalar(
      `SELECT COALESCE(SUM(ven_total_venda), 0)::numeric AS v
       FROM livraria_comercial.vendas
       WHERE ven_criado_em >= $1 AND ven_criado_em <= $2`,
      [inicioMes, fimMes],
    );

    const totalVendasMesAnterior = await this.consultas.obterScalar(
      `SELECT COALESCE(SUM(ven_total_venda), 0)::numeric AS v
       FROM livraria_comercial.vendas
       WHERE ven_criado_em >= $1 AND ven_criado_em <= $2`,
      [inicioMesAnterior, fimMesAnterior],
    );

    const pctCrescimentoVendas = percentualCrescimento(totalVendasMes, totalVendasMesAnterior);

    const ticketMedio = await this.consultas.obterScalar(
      `SELECT COALESCE(AVG(ven_total_venda), 0)::numeric AS v FROM livraria_comercial.vendas`,
      [],
    );

    const ticketMedioMesAnterior = await this.consultas.obterScalar(
      `SELECT COALESCE(AVG(ven_total_venda), 0)::numeric AS v
       FROM livraria_comercial.vendas
       WHERE ven_criado_em >= $1 AND ven_criado_em <= $2`,
      [inicioMesAnterior, fimMesAnterior],
    );

    const percentualCrescimentoTicket =
      ticketMedioMesAnterior > 0
        ? Math.round((ticketMedio / ticketMedioMesAnterior - 1) * 100 * 10) / 10
        : 0;

    const pedidosPendentes = await this.consultas.obterScalarInt(
      `SELECT COUNT(*)::int AS c
       FROM livraria_comercial.vendas v
       JOIN livraria_comercial.status_venda s ON v.stv_id = s.stv_id
       WHERE s.stv_descricao = 'EM PROCESSAMENTO'`,
      [],
    );

    const trocasSolicitadas = await this.consultas.obterScalarInt(
      `SELECT COUNT(*)::int AS c
       FROM livraria_comercial.vendas v
       JOIN livraria_comercial.status_venda s ON v.stv_id = s.stv_id
       WHERE s.stv_descricao IN ('EM TROCA', 'TROCA AUTORIZADA')`,
      [],
    );

    const clientesAtivos = await this.consultas.obterScalarInt(
      `SELECT COUNT(*)::int AS c
       FROM livraria_gestao.usuarios
       WHERE pap_id = $1 AND usu_ativo = TRUE`,
      [PAPEL_CLIENTE.id] as DbParametro[],
    );

    const novosClientesMes = await this.consultas.obterScalarInt(
      `SELECT COUNT(*)::int AS c
       FROM livraria_gestao.usuarios
       WHERE pap_id = $1 AND usu_criado_em >= $2 AND usu_criado_em <= $3`,
      [PAPEL_CLIENTE.id, inicioMes, fimMes] as DbParametro[],
    );

    const novosClientesMesAnterior = await this.consultas.obterScalarInt(
      `SELECT COUNT(*)::int AS c
       FROM livraria_gestao.usuarios
       WHERE pap_id = $1 AND usu_criado_em >= $2 AND usu_criado_em <= $3`,
      [PAPEL_CLIENTE.id, inicioMesAnterior, fimMesAnterior] as DbParametro[],
    );

    const pctCrescimentoClientes = percentualCrescimento(novosClientesMes, novosClientesMesAnterior);

    const livrosBaixoEstoque = await this.consultas.obterScalarInt(
      `SELECT COUNT(*)::int AS c
       FROM livraria_comercial.estoques e
       WHERE e.etq_ativo = TRUE
         AND e.etq_quantidade_disponivel <= 5`,
      [],
    );

    const statusLabels = ['Entregues', 'Em Trânsito', 'Preparando', 'Pendentes', 'Devoluções'];
    const cntEntregue = await this.consultas.contarPorStatus('ENTREGUE');
    const cntTransito = await this.consultas.contarPorStatus('EM TRÂNSITO');
    const cntPreparando = await this.consultas.contarPorStatus('APROVADA');
    const cntPendentes = await this.consultas.contarPorStatus('EM PROCESSAMENTO');
    const cntDevolucoes = await this.consultas.obterScalarInt(
      `SELECT COUNT(*)::int AS c
       FROM livraria_comercial.vendas v
       JOIN livraria_comercial.status_venda s ON v.stv_id = s.stv_id
       WHERE s.stv_descricao IN ('EM TROCA', 'REPROVADA')`,
      [],
    );
    const statusData = [cntEntregue, cntTransito, cntPreparando, cntPendentes, cntDevolucoes];

    const mesesReceita = await Promise.all(
      indicesUltimosMeses(3).map(async (i) => {
        const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        const label = d.toLocaleString('pt-BR', { month: 'short' });
        const labelFmt = label.charAt(0).toUpperCase() + label.slice(1);
        const { ini, fim } = inicioFimMes(d.getFullYear(), d.getMonth());
        const r = await this.consultas.obterScalar(
          `SELECT COALESCE(SUM(ven_total_venda), 0)::numeric AS v
           FROM livraria_comercial.vendas
           WHERE ven_criado_em >= $1 AND ven_criado_em <= $2`,
          [ini, fim],
        );
        return { labelFmt, valor: Number(r) };
      }),
    );
    const labelsMeses = mesesReceita.map((m) => m.labelFmt);
    const receitaMensal = mesesReceita.map((m) => m.valor);

    const categoriasTop = await this.consultas.obterDuasCategorias();
    const datasetsCategoria = await Promise.all(
      categoriasTop.map(async (catNome, idx) => {
        const borderColor = idx === 0 ? 'rgb(15, 76, 58)' : 'rgb(210, 180, 140)';
        const backgroundColor = idx === 0 ? 'rgba(15, 76, 58, 0.5)' : 'rgba(210, 180, 140, 0.5)';
        const contagens = await Promise.all(
          indicesUltimosMeses(3).map(async (j) => {
            const d = new Date(agora.getFullYear(), agora.getMonth() - j, 1);
            return this.consultas.contarItensVendidosPorCategoriaMes(
              catNome,
              d.getFullYear(),
              d.getMonth() + 1,
            );
          }),
        );
        return {
          label: catNome,
          data: contagens,
          borderColor,
          backgroundColor,
        };
      }),
    );

    const atividadesRecentes = await this.consultas.obterAtividadesRecentes();

    return {
      metricas: {
        totalVendasMes: Number(totalVendasMes),
        percentualCrescimento: pctCrescimentoVendas,
        pedidosPendentes,
        trocasSolicitadas,
        ticketMedio: Number(ticketMedio),
        percentualCrescimentoTicket,
        clientesAtivos,
        percentualCrescimentoClientes: pctCrescimentoClientes,
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
}
