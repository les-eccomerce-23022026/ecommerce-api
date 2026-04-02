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
export enum StatusPagamento {
  PENDENTE = 'pendente',
  APROVADO = 'aprovado',
  RECUSADO = 'recusado',
  CANCELADO = 'cancelado'
}
