import { IPagamento } from './IPagamento';

export { IPagamento } from './IPagamento';

/**
 * Interface do repositório de pagamentos.
 */
export interface IRepositorioPagamentos {
  cadastrar(pagamento: IPagamento, opcoes?: { inpIdIntencao?: number }): Promise<IPagamento>;
  obterVenIdPorVendaUuid(vendaUuid: string): Promise<number | null>;
  obterPagIdInternoPorUuid(pagUuid: string): Promise<number | null>;
  obterPorUuid(uuid: string): Promise<IPagamento | null>;
  atualizar(uuid: string, pagamento: IPagamento): Promise<IPagamento>;
  listarPorVenda(vendaUuid: string): Promise<IPagamento[]>;
  inserirPixSimulado(
    pagId: number,
    dados: {
      copiaCola: string;
      qrBase64: string | null;
      expiraEm: Date;
      segredoConfirmacao: string;
    }
  ): Promise<void>;
  obterPixSimuladoPorPagUuid(pagUuid: string): Promise<{
    copiaCola: string;
    qrBase64: string | null;
    expiraEm: Date;
    segredoConfirmacao: string;
  } | null>;
}
