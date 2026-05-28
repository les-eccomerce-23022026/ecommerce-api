import { IContextoRecomendacao } from '../entities/IContextoRecomendacao.entity';

/**
 * Interface de Repositório de Recomendação
 * 
 * Define operações para gerenciar recomendações e métricas de avaliação.
 */
export interface IRepositorioRecomendacao {
  /**
   * Busca o contexto de recomendação de um cliente
   */
  buscarContexto(clienteUuid: string): Promise<IContextoRecomendacao | null>;

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