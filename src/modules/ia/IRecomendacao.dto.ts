/**
 * DTOs para entrada/saída da API de Recomendação
 */

import { IMetricasDeterministicas } from './IMetricasDeterministicas';

export interface IRecomendarRequestDTO {
  query: string;
  clienteUuid?: string;
  limite?: number;
  incluirMetricas?: boolean;
}

export interface IRecomendarResponseDTO {
  query: string;
  produtos: ProdutoRecomendadoDTO[];
  contextoUsado: boolean;
  totalEncontrados: number;
  totalValidos: number;
  tempoRespostaMs: number;
  /** Métricas determinísticas do pipeline — presente apenas quando solicitado via `incluirMetricas=true`. */
  metricas?: IMetricasDeterministicas;
}

export interface ProdutoRecomendadoDTO {
  uuid: string;
  titulo: string;
  autor: string;
  categoria: string;
  sinopse?: string;
  isbn: string;
  preco: number;
  similaridade: number;
  motivo: string;
}

export interface IChatRequestDTO {
  mensagem: string;
  clienteUuid?: string;
  historico?: MensagemChatDTO[];
  incluirMetricas?: boolean;
}

/**
 * Tipo de resposta do assistente de chat.
 *
 * - recomendacao  : sugestão de livros do catálogo via RAG
 * - esclarecimento: assistente pediu mais informações ao cliente
 * - comparativo   : comparação entre dois ou mais livros
 * - pos_venda     : resposta sobre pedidos, entregas ou trocas (sem inventar dados)
 * - tendencias    : ranking de mais vendidos por categoria ou faixa etária
 * - informacao    : políticas da loja, frete ou horários (apenas dados conhecidos)
 */
export type TipoRespostaChat =
  | 'recomendacao'
  | 'esclarecimento'
  | 'comparativo'
  | 'pos_venda'
  | 'tendencias'
  | 'informacao';

export interface IChatResponseDTO {
  resposta: string;
  /**
   * Lista de produtos recomendados.
   * Sempre vazia para `pos_venda` puro (sem pedido de livro relacionado).
   */
  produtosRecomendados: ProdutoRecomendadoDTO[];
  contextoUsado: boolean;
  tempoRespostaMs: number;
  tipoResposta: TipoRespostaChat;
  /** Turno atual da conversa (1 = primeira pergunta do cliente). */
  numeroTurno: number;
  perguntasFollowUp?: string[];
  intencaoResumida?: string;
  /** Métricas determinísticas do pipeline — presente apenas quando solicitado via `incluirMetricas=true`. */
  metricas?: IMetricasDeterministicas;
}

/** Produto citado em mensagem anterior do assistente (continuidade multi-turno) */
export interface ProdutoMencionadoChatDTO {
  uuid: string;
  titulo: string;
}

/** Aceita papel (API) ou remetente (frontend legado) */
export interface MensagemChatDTO {
  papel?: 'user' | 'assistant';
  remetente?: 'usuario' | 'assistente';
  conteudo: string;
  timestamp?: Date;
  /** Livros exibidos na resposta do assistente — usado para não repetir sugestões */
  produtosMencionados?: ProdutoMencionadoChatDTO[];
}

export interface IReindexarRequestDTO {
  forcarReindexacao?: boolean;
}

export interface IReindexarResponseDTO {
  mensagem: string;
  produtosIndexados: number;
  tempoExecucaoMs: number;
}

export interface IMetricasResponseDTO {
  periodo: string;
  totalRecomendacoes: number;
  tempoRespostaMedio: number;
  precisaoMedia: number;
  recallMedio: number;
  f1ScoreMedio: number;
  relevanciaSemanticaMedia: number;
  taxaErro: number;
}

export interface IMetricaDetalhadaDTO {
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
