/**
 * Intenção extraída da mensagem do usuário para retrieval e resposta conversacional.
 *
 * Tipos disponíveis:
 * - recomendacao  : pedido de sugestão de livros por tema, gênero ou preferência
 * - esclarecimento: o assistente precisa de mais informações do cliente
 * - comparativo   : o cliente quer comparar dois ou mais livros
 * - conversa      : bate-papo geral sem intenção de compra clara
 * - pos_venda     : dúvidas sobre pedido, entrega, prazo de troca ou status
 * - tendencias    : mais vendidos por categoria, faixa etária ou de forma geral
 * - informacao    : políticas da loja, frete, horário de atendimento (sem inventar)
 */
export type TipoIntencaoRecomendacao =
  | 'recomendacao'
  | 'esclarecimento'
  | 'comparativo'
  | 'conversa'
  | 'pos_venda'
  | 'tendencias'
  | 'informacao';

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
