import { IContextoRecomendacao } from './IContextoRecomendacao.entity';
import {
  IPedidoRecenteContexto,
  ITendenciaCategoriaContexto,
  ITendenciaFaixaEtariaContexto,
} from './IContextoRecomendacao.entity';

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
 * Contrato de repositório para dados de tendências e pós-venda do assistente.
 *
 * Segregado conforme ISP: consumidores que precisam de tendências e pedidos
 * não dependem das operações de recomendação ou métricas.
 */
export interface IRepositorioTendencias {
  /**
   * Retorna os últimos pedidos realizados pelo cliente (máx. 10),
   * usados no modo pós-venda para responder dúvidas de status e entrega.
   */
  buscarPedidosRecentes(clienteUuid: string): Promise<IPedidoRecenteContexto[]>;

  /**
   * Retorna os livros mais vendidos por categoria (vendas APROVADA/ENTREGUE).
   * @param categorias - Filtro opcional de categorias; sem filtro retorna top 5 categorias gerais.
   */
  buscarTendenciasPorCategoria(categorias?: string[]): Promise<ITendenciaCategoriaContexto[]>;

  /**
   * Retorna os livros mais vendidos por faixa etária dos compradores.
   * Faixas: 0-12 / 13-17 / 18-24 / 25-39 / 40-54 / 55+
   */
  buscarTendenciasPorFaixaEtaria(): Promise<ITendenciaFaixaEtariaContexto[]>;
}

/**
 * Interface de Repositório de Recomendação
 *
 * Composição completa para backward compatibility — implementações e consumidores
 * existentes continuam funcionando sem nenhuma alteração de assinatura.
 */
export interface IRepositorioRecomendacao
  extends IRepositorioContextoCliente,
    IRepositorioMetricasRecomendacao,
    IRepositorioTendencias {}

/** Re-exporta tipos de entidade para uso fora do módulo de domínio */
export type {
  IPedidoRecenteContexto,
  ITendenciaCategoriaContexto,
  ITendenciaFaixaEtariaContexto,
};

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