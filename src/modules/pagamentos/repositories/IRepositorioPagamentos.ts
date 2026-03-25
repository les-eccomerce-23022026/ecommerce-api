import { IPagamento } from '../domain/IPagamento';

/**
 * Interface do repositório de pagamentos.
 */
export interface IRepositorioPagamentos {
  cadastrar(pagamento: IPagamento): Promise<IPagamento>;
  obterPorUuid(uuid: string): Promise<IPagamento | null>;
  atualizar(uuid: string, pagamento: IPagamento): Promise<IPagamento>;
  listarPorVenda(vendaUuid: string): Promise<IPagamento[]>;
}
