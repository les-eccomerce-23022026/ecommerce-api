import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { PAPEL_CLIENTE } from '@/shared/types/papeis';
import {
  percentualCrescimento,
  indicesUltimosMeses,
  inicioFimMes,
} from '@/modules/admin/servicoDashboardAdminHelpers';
import { DashboardAdminConsultas } from '@/modules/admin/servicoDashboardAdminConsultas';
import { ServicoCacheArquivo } from '@/shared/infrastructure/cache/ServicoCacheArquivo';

export type IDashboardAdminJson = Record<string, unknown>;

const CHAVE_CACHE_DASHBOARD = 'dashboard:admin:metricas';

export class ServicoDashboardAdmin {
  private readonly consultas: DashboardAdminConsultas;
  private readonly cache: ServicoCacheArquivo;

  constructor(private readonly db: IConexaoBanco) {
    this.consultas = new DashboardAdminConsultas(db);
    this.cache = new ServicoCacheArquivo('./cache/dashboard', 300); // 5 minutos
  }

  async obterDashboard(): Promise<IDashboardAdminJson> {
    const dadosCache = await this.cache.obter<IDashboardAdminJson>(CHAVE_CACHE_DASHBOARD);
    if (dadosCache) {
      return dadosCache;
    }

    const agora = new Date();
    const ano = agora.getFullYear();
    const inicioMes = new Date(ano, agora.getMonth(), 1);
    const fimMes = new Date(ano, agora.getMonth() + 1, 0, 23, 59, 59, 999);
    const inicioMesAnterior = new Date(ano, agora.getMonth() - 1, 1);
    const fimMesAnterior = new Date(ano, agora.getMonth(), 0, 23, 59, 59, 999);
    const [
      totalVendasMes,
      totalVendasMesAnterior,
      ticketMedio,
      ticketMedioMesAnterior,
      pedidosPendentes,
      trocasSolicitadas,
      clientesAtivos,
      novosClientesMes,
      novosClientesMesAnterior,
      livrosBaixoEstoque,
      cntEntregue,
      cntTransito,
      cntPreparando,
      cntPendentes,
      cntDevolucoes,
    ] = await Promise.all([
      this.consultas.obterScalar(
        `SELECT COALESCE(SUM(ven_total_venda), 0)::numeric AS v
         FROM livraria_comercial.vendas
         WHERE ven_criado_em >= $1 AND ven_criado_em <= $2`,
        [inicioMes, fimMes],
      ),
      this.consultas.obterScalar(
        `SELECT COALESCE(SUM(ven_total_venda), 0)::numeric AS v
         FROM livraria_comercial.vendas
         WHERE ven_criado_em >= $1 AND ven_criado_em <= $2`,
        [inicioMesAnterior, fimMesAnterior],
      ),
      this.consultas.obterScalar(
        `SELECT COALESCE(AVG(ven_total_venda), 0)::numeric AS v FROM livraria_comercial.vendas`,
        [],
      ),
      this.consultas.obterScalar(
        `SELECT COALESCE(AVG(ven_total_venda), 0)::numeric AS v
         FROM livraria_comercial.vendas
         WHERE ven_criado_em >= $1 AND ven_criado_em <= $2`,
        [inicioMesAnterior, fimMesAnterior],
      ),
      this.consultas.obterScalarInt(
        `SELECT COUNT(*)::int AS c
         FROM livraria_comercial.vendas v
         JOIN livraria_comercial.status_venda s ON v.stv_id = s.stv_id
         WHERE s.stv_descricao = 'EM_PROCESSAMENTO'`,
        [],
      ),
      this.consultas.obterScalarInt(
        `SELECT COUNT(*)::int AS c
         FROM livraria_comercial.vendas v
         JOIN livraria_comercial.status_venda s ON v.stv_id = s.stv_id
         WHERE s.stv_descricao IN ('EM_TROCA', 'TROCA_AUTORIZADA')`,
        [],
      ),
      this.consultas.obterScalarInt(
        `SELECT COUNT(*)::int AS c
         FROM livraria_gestao.usuarios
         WHERE pap_id = $1 AND usu_ativo = TRUE`,
        [PAPEL_CLIENTE.id] as DbParametro[],
      ),
      this.consultas.obterScalarInt(
        `SELECT COUNT(*)::int AS c
         FROM livraria_gestao.usuarios
         WHERE pap_id = $1 AND usu_criado_em >= $2 AND usu_criado_em <= $3`,
        [PAPEL_CLIENTE.id, inicioMes, fimMes] as DbParametro[],
      ),
      this.consultas.obterScalarInt(
        `SELECT COUNT(*)::int AS c
         FROM livraria_gestao.usuarios
         WHERE pap_id = $1 AND usu_criado_em >= $2 AND usu_criado_em <= $3`,
        [PAPEL_CLIENTE.id, inicioMesAnterior, fimMesAnterior] as DbParametro[],
      ),
      this.consultas.obterScalarInt(
        `SELECT COUNT(*)::int AS c
         FROM livraria_comercial.estoques e
         WHERE e.etq_ativo = TRUE
           AND e.etq_quantidade_disponivel <= 5`,
        [],
      ),
      this.consultas.contarPorStatus('ENTREGUE'),
      this.consultas.contarPorStatus('EM_TRANSITO'),
      this.consultas.contarPorStatus('APROVADA'),
      this.consultas.contarPorStatus('EM_PROCESSAMENTO'),
      this.consultas.obterScalarInt(
        `SELECT COUNT(*)::int AS c
         FROM livraria_comercial.vendas v
         JOIN livraria_comercial.status_venda s ON v.stv_id = s.stv_id
         WHERE s.stv_descricao IN ('EM_TROCA', 'REPROVADA')`,
        [],
      ),
    ]);

    const pctCrescimentoVendas = percentualCrescimento(totalVendasMes, totalVendasMesAnterior);
    const percentualCrescimentoTicket =
      ticketMedioMesAnterior > 0
        ? Math.round((ticketMedio / ticketMedioMesAnterior - 1) * 100 * 10) / 10
        : 0;
    const pctCrescimentoClientes = percentualCrescimento(novosClientesMes, novosClientesMesAnterior);

    const statusLabels = ['Entregues', 'Em Trânsito', 'Preparando', 'Pendentes', 'Devoluções'];
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
      categoriasTop.map(async (catNome) => {
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
        };
      }),
    );

    const atividadesRecentes = await this.consultas.obterAtividadesRecentes();

    const dadosDashboard = {
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
          },
        ],
      },
      atividadesRecentes,
    };

    await this.cache.definir(CHAVE_CACHE_DASHBOARD, dadosDashboard);

    return dadosDashboard;
  }
}
