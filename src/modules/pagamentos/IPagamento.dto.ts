import { TipoPagamento } from '../value-objects/FormaPagamento';

/**
 * DTO para entrada de dados de pagamento.
 */
export interface IPagamentoInputDto {
  vendaUuid: string;
  valor: number;
  tipoPagamento: TipoPagamento;
  detalhesCupom?: string; // Para cupons
  cartao?: ICartaoInputDto; // Apenas para cartão
}

/**
 * DTO para entrada de dados do cartão.
 */
export interface ICartaoInputDto {
  numero: string;
  nomeTitular: string;
  validade: string; // MM/YY
  bandeira: string;
}

/**
 * DTO para saída de dados de pagamento (resposta da API).
 */
export interface IPagamentoOutputDto {
  id: string;
  vendaUuid: string;
  valor: number;
  formaPagamento: {
    tipo: TipoPagamento;
    detalhes?: string;
  };
  cartao?: {
    numeroTokenizado: string;
    nomeTitular: string;
    validade: string;
    bandeira: string;
  };
  status: string;
  criadoEm: Date;
  processadoEm?: Date;
}
