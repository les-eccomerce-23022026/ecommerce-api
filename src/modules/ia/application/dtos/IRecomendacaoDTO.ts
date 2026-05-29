/**
 * DTOs para entrada/saída da API de Recomendação
 */

export interface IRecomendarRequestDTO {
  query: string;
  clienteUuid?: string;
  limite?: number;
}

export interface IRecomendarResponseDTO {
  query: string;
  produtos: ProdutoRecomendadoDTO[];
  contextoUsado: boolean;
  totalEncontrados: number;
  totalValidos: number;
  tempoRespostaMs: number;
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
}

export type TipoRespostaChat = 'recomendacao' | 'esclarecimento';

export interface IChatResponseDTO {
  resposta: string;
  produtosRecomendados: ProdutoRecomendadoDTO[];
  contextoUsado: boolean;
  tempoRespostaMs: number;
  tipoResposta: TipoRespostaChat;
  perguntasFollowUp?: string[];
  intencaoResumida?: string;
}

/** Aceita papel (API) ou remetente (frontend legado) */
export interface MensagemChatDTO {
  papel?: 'user' | 'assistant';
  remetente?: 'usuario' | 'assistente';
  conteudo: string;
  timestamp?: Date;
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
