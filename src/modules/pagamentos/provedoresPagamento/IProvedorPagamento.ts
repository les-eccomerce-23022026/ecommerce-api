import type {
  DadosConfirmacaoProvedor,
  ResultadoConfirmacaoPagamento,
  ResultadoIntencaoPagamento
} from './DadosConfirmacaoProvedor';

/**
 * Porta de saída: execução da cobrança por um provedor externo (simulado, Stripe, etc.).
 */
export interface IProvedorPagamento {
  registrarIntencaoPagamento(valor: number): Promise<ResultadoIntencaoPagamento>;

  confirmarPagamento(dados: DadosConfirmacaoProvedor): Promise<ResultadoConfirmacaoPagamento>;
}
