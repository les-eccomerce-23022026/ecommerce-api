import { IRepositorioVendas } from '../repositories/IRepositorioVendas';
import { FiltroAnaliseVendas, RespostaAnaliseVendas, DadoAnaliseVendas } from '../dtos/AnaliseVendas.dto';

/**
 * Serviço de orquestração para análise de vendas por categoria.
 * Responsável por validações e transformação de dados.
 */
export class ServicoAnaliseVendas {
  private readonly PERIODO_MAXIMO_MESES = 24;
  private readonly PERIODO_MINIMO_DIAS = 1;

  constructor(private readonly repositorioVendas: IRepositorioVendas) {}

  /**
   * Executa análise de vendas por categoria com validações.
   */
  public async analisarVendasPorCategoria(filtro: FiltroAnaliseVendas): Promise<RespostaAnaliseVendas> {
    this.validarFiltro(filtro);

    const dadosBrutos = await this.repositorioVendas.analiseVendasPorCategoria(filtro);

    return this.transformarResposta(dadosBrutos, filtro);
  }

  /**
   * Valida os filtros de análise.
   */
  private validarFiltro(filtro: FiltroAnaliseVendas): void {
    const { dataInicio, dataFim } = filtro;

    if (!dataInicio || !(dataInicio instanceof Date)) {
      throw new Error('Data de início inválida');
    }

    if (!dataFim || !(dataFim instanceof Date)) {
      throw new Error('Data de fim inválida');
    }

    if (dataInicio > dataFim) {
      throw new Error('Data de início deve ser anterior ou igual à data de fim');
    }

    const periodoDias = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
    const periodoMeses = periodoDias / 30;

    if (periodoDias < this.PERIODO_MINIMO_DIAS) {
      throw new Error(`Período mínimo de ${this.PERIODO_MINIMO_DIAS} dia(s)`);
    }

    if (periodoMeses > this.PERIODO_MAXIMO_MESES) {
      throw new Error(`Período máximo de ${this.PERIODO_MAXIMO_MESES} meses excedido`);
    }
  }

  /**
   * Transforma dados brutos em resposta formatada.
   */
  private transformarResposta(dadosBrutos: DadoAnaliseVendas[], filtro: FiltroAnaliseVendas): RespostaAnaliseVendas {
    const categoriasUnicas = new Set(dadosBrutos.map(d => d.categoria));
    const totalVendas = dadosBrutos.reduce((acc, d) => acc + d.quantidade, 0);

    return {
      dados: dadosBrutos,
      periodo: {
        inicio: filtro.dataInicio,
        fim: filtro.dataFim,
      },
      metadados: {
        totalVendas,
        totalCategorias: categoriasUnicas.size,
      },
    };
  }
}
