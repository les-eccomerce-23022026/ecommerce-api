import { CartaoCredito } from './CartaoCredito';
import { FormaPagamento } from './FormaPagamento';

/**
 * Interface para a entidade Pagamento no domínio.
 */
export interface IPagamento {
  id: string; // UUID público
  vendaUuid: string;
  valor: number;
  formaPagamento: FormaPagamento;
  cartao?: CartaoCredito; // Apenas se forma for cartão
  status: StatusPagamento;
  criadoEm: Date;
  processadoEm?: Date;
}

/**
 * Enum para status do pagamento.
 */
/** Valores alinhados a `status_pagamento.stp_descricao` (migration 011). */
export enum StatusPagamento {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  RECUSADO = 'RECUSADO',
  CANCELADO = 'CANCELADO'
}
