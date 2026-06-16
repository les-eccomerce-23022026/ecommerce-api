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

const CHAVE_CACHE_DASHBOARD = 'dashboard:admin:metricas:v2';

export class ServicoDashboardAdmin {
  private readonly consultas: DashboardAdminConsultas;
  private readonly cache: ServicoCacheArquivo;

  constructor(private readonly db: IConexaoBanco) {
    this.consultas = new DashboardAdminConsultas(db);
    this.cache = new ServicoCacheArquivo('./cache/dashboard', 300); // 5 minutos
  }

  async obterDashboard(filtros?: { periodo?: string; status?: string }): Promise<IDashboardAdminJson> {
    const chaveCache = filtros 
      ? `${CHAVE_CACHE_DASHBOARD}:${filtros.periodo || 'todos'}:${filtros.status || 'todos'}`
      : CHAVE_CACHE_DASHBOARD;
    
    const dadosCache = await this.cache.obter<IDashboardAdminJson>(chaveCache);
    if (dadosCache) {
      return dadosCache;
    }

    const agora = new Date();
    const ano = agora.getFullYear();
    
    // Calcular datas baseadas no filtro de período
    let inicioPeriodo: Date;
    let fimPeriodo: Date;
    
    if (filtros?.periodo && filtros.periodo !== 'todos') {
      const periodo = filtros.periodo;
      inicioPeriodo = new Date();
      fimPeriodo = new Date();
      
      switch (periodo) {
        case '7d':
          inicioPeriodo.setDate(agora.getDate() - 7);
          break;
        case '30d':
          inicioPeriodo.setDate(agora.getDate() - 30);
          break;
        case '1w':
          inicioPeriodo.setDate(agora.getDate() - 7);
          break;
        case '2w':
          inicioPeriodo.setDate(agora.getDate() - 14);
          break;
        case '1m':
          inicioPeriodo.setMonth(agora.getMonth() - 1);
          break;
        case '3m':
          inicioPeriodo.setMonth(agora.getMonth() - 3);
          break;
        case '6m':
          inicioPeriodo.setMonth(agora.getMonth() - 6);
          break;
        case '1a':
          inicioPeriodo.setFullYear(agora.getFullYear() - 1);
          break;
        default:
          inicioPeriodo.setDate(agora.getDate() - 7);
      }
    } else {
      inicioPeriodo = new Date(ano, agora.getMonth() - 2, 1); // Últimos 3 meses por padrão
    }
    
    fimPeriodo = new Date();
    fimPeriodo.setHours(23, 59, 59, 999);
    
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

    // Aplicar filtro de status se fornecido
    let statusLabels = ['Entregues', 'Em Trânsito', 'Preparando', 'Pendentes', 'Devoluções'];
    let statusData = [cntEntregue, cntTransito, cntPreparando, cntPendentes, cntDevolucoes];
    
    if (filtros?.status && filtros.status !== 'todos') {
      const statusFiltro = filtros.status;
      const statusMap: Record<string, { label: string; valor: number }> = {
        'entregue': { label: 'Entregues', valor: cntEntregue },
        'transito': { label: 'Em Trânsito', valor: cntTransito },
        'preparando': { label: 'Preparando', valor: cntPreparando },
        'pendente': { label: 'Pendentes', valor: cntPendentes },
        'devolucao': { label: 'Devoluções', valor: cntDevolucoes },
      };
      
      const statusSelecionado = statusMap[statusFiltro];
      if (statusSelecionado) {
        statusLabels = [statusSelecionado.label];
        statusData = [statusSelecionado.valor];
      }
    }

    const mesesReceita = await Promise.all(
      indicesUltimosMeses(3).map(async (i) => {
        const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        const label = d.toLocaleString('pt-BR', { month: 'short' });
        const labelFmt = label.charAt(0).toUpperCase() + label.slice(1);
        const { ini, fim } = inicioFimMes(d.getFullYear(), d.getMonth());
        
        // Se houver filtro de período, usar o período filtrado
        // Caso contrário, usar o mês específico
        let dataInicio: Date;
        let dataFim: Date;
        
        if (filtros?.periodo && filtros.periodo !== 'todos') {
          // Calcular o início e fim do período baseado no mês atual
          const mesInicio = new Date(d.getFullYear(), d.getMonth(), 1);
          const mesFim = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
          
          // Intersecção entre o período filtrado e o mês específico
          dataInicio = inicioPeriodo > mesInicio ? inicioPeriodo : mesInicio;
          dataFim = fimPeriodo < mesFim ? fimPeriodo : mesFim;
          
          // Se não houver intersecção, retornar 0
          if (dataInicio > dataFim) {
            return { labelFmt, valor: 0 };
          }
        } else {
          dataInicio = ini;
          dataFim = fim;
        }
        
        const r = await this.consultas.obterScalar(
          `SELECT COALESCE(SUM(ven_total_venda), 0)::numeric AS v
           FROM livraria_comercial.vendas
           WHERE ven_criado_em >= $1 AND ven_criado_em <= $2`,
          [dataInicio, dataFim],
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

    await this.cache.definir(chaveCache, dadosDashboard);

    return dadosDashboard;
  }
}
