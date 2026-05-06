import { TipoPagamento } from './FormaPagamento';
import type { IPagamento } from './IPagamento';

/**
 * DTO para entrada de dados de pagamento.
 */
/** Parcelamento no cartão (1 = à vista). */
export const PARCELAS_CARTAO_MAX = 12;

export interface IPagamentoInputDto {
  vendaUuid: string;
  valor: number;
  tipoPagamento: TipoPagamento;
  detalhesCupom?: string; // Para cupons
  /** 1..PARCELAS_CARTAO_MAX; apenas para cartão de crédito. */
  parcelasCartao?: number;
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

/** Cobrança PIX simulada retornada ao cliente (segredo serve à simulação de webhook). */
export interface IPixCobrancaSimuladaDto {
  copiaCola: string;
  qrCodeBase64: string | null;
  expiraEm: string;
  segredoConfirmacao: string;
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
  pixCobranca?: IPixCobrancaSimuladaDto;
}

/** Resultado interno de definir liquidação (PIX inclui cobrança simulada). */
export interface IResultadoDefinirMetodoLiquidacao {
  pagamento: IPagamento;
  pixCobranca?: {
    copiaCola: string;
    qrCodeBase64: string | null;
    expiraEm: Date;
    segredoConfirmacao: string;
  };
}
