/** Estados da intenção de pagamento persistida (intencao_pagamento.inp_estado). */
export const EstadosIntencaoPagamento = {
  CRIADA: 'CRIADA',
  CONFIRMADA: 'CONFIRMADA',
  RECUSADA: 'RECUSADA',
  EXPIRADA: 'EXPIRADA',
  CANCELADA: 'CANCELADA'
} as const;

export type EstadoIntencaoPagamento = (typeof EstadosIntencaoPagamento)[keyof typeof EstadosIntencaoPagamento];
