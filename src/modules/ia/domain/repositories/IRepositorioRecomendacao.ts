import { IContextoRecomendacao } from '../entities/IContextoRecomendacao.entity';

/**
 * Contrato de repositório para busca do contexto personalizado do cliente.
 *
 * Segregado conforme ISP: consumidores que apenas precisam do contexto de
 * recomendação não dependem das operações de métricas.
 */
export interface IRepositorioContextoCliente {
  /**
   * Busca o contexto de recomendação de um cliente
   */
  buscarContexto(clienteUuid: string): Promise<IContextoRecomendacao | null>;
}

/**
 * Contrato de repositório para persistência e consulta de métricas de recomendação.
 *
 * Segregado conforme ISP: consumidores que apenas precisam de métricas
 * não dependem das operações de contexto de clientes.
 */
export interface IRepositorioMetricasRecomendacao {
  /**
   * Salva uma métrica de avaliação de recomendação
   */
  salvarMetrica(metrica: IMetricaRecomendacao): Promise<void>;

  /**
   * Busca métricas de recomendação por período
   */
  buscarMetricas(periodo: PeriodoMetrica): Promise<IMetricaRecomendacao[]>;

  /**
   * Busca métricas agregadas por período
   */
  buscarMetricasAgregadas(periodo: PeriodoMetrica): Promise<IMetricasAgregadas>;
}

/**
 * Interface de Repositório de Recomendação
 *
 * Composição de IRepositorioContextoCliente e IRepositorioMetricasRecomendacao.
 * Mantida para backward compatibility — implementações e consumidores existentes
 * continuam funcionando sem nenhuma alteração de assinatura.
 */
export interface IRepositorioRecomendacao
  extends IRepositorioContextoCliente,
    IRepositorioMetricasRecomendacao {}

export interface IMetricaRecomendacao {
  id: number;
  clienteUuid: string;
  query: string;
  produtosRecomendados: string[];
  tempoRespostaMs: number;
  precisao: number;
  recall: number;
  f1Score: number;
  relevanciaSemantica: number;
  dataCriacao: Date;
}

export interface ICriarMetricaRecomendacaoDto {
  clienteUuid: string;
  query: string;
  produtosRecomendados: string[];
  tempoRespostaMs: number;
  precisao: number;
  recall: number;
  f1Score: number;
  relevanciaSemantica: number;
  lojId: number;
}

export type PeriodoMetrica = 'hoje' | 'semana' | 'mes' | 'todos';

export interface IMetricasAgregadas {
  periodo: PeriodoMetrica;
  totalRecomendacoes: number;
  tempoRespostaMedio: number;
  precisaoMedia: number;
  recallMedio: number;
  f1ScoreMedio: number;
  relevanciaSemanticaMedia: number;
  taxaErro: number;
}