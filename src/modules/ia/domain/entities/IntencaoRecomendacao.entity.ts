/**
 * Intenção extraída da mensagem do usuário para retrieval e resposta conversacional.
 */
export type TipoIntencaoRecomendacao =
  | 'recomendacao'
  | 'esclarecimento'
  | 'comparativo'
  | 'conversa';

export type PublicoAlvoIntencao = 'infantil' | 'juvenil' | 'adulto';

import type { IPerfilClienteRecomendacao } from './IContextoRecomendacao.entity';

export interface ContextoInterpretacaoIntencao {
  perfil?: IPerfilClienteRecomendacao;
  resumoCompras?: string;
}

export interface IntencaoRecomendacao {
  tipo: TipoIntencaoRecomendacao;
  generos: string[];
  precoMax?: number;
  precoMin?: number;
  paginasMax?: number;
  publicoAlvo?: PublicoAlvoIntencao;
  quantidadeLivros: number;
  comparar?: string[];
  precisaEsclarecer: boolean;
  perguntasEsclarecimento?: string[];
  queryBusca: string;
  confianca: number;
}
