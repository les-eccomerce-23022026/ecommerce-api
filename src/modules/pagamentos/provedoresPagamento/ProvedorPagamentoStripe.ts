import type { IProvedorPagamento } from './IProvedorPagamento';
import type {
  DadosConfirmacaoProvedor,
  ResultadoConfirmacaoPagamento,
  ResultadoIntencaoPagamento
} from './DadosConfirmacaoProvedor';

/**
 * Stub para integração futura com Stripe (SDK + webhooks).
 * Mantém o contrato de negócio alinhado ao restante do módulo.
 */
export class ProvedorPagamentoStripe implements IProvedorPagamento {
  // eslint-disable-next-line class-methods-use-this
  public async registrarIntencaoPagamento(_valor: number): Promise<ResultadoIntencaoPagamento> {
    throw new Error(
      'Provedor de pagamento Stripe ainda não implementado. Defina PROVEDOR_PAGAMENTO=simulado no ambiente.'
    );
  }

  // eslint-disable-next-line class-methods-use-this
  public async confirmarPagamento(_dados: DadosConfirmacaoProvedor): Promise<ResultadoConfirmacaoPagamento> {
    throw new Error(
      'Provedor de pagamento Stripe ainda não implementado. Defina PROVEDOR_PAGAMENTO=simulado no ambiente.'
    );
  }
}
