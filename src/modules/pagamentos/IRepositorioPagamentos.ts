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

  obterCupomTrocaPorCodigo(codigo: string): Promise<{
    id: number;
    codigo: string;
    valorAtual: number;
    usuarioId: number;
    ativo: boolean;
  } | null>;

  atualizarSaldoCupomTroca(id: number, novoSaldo: number): Promise<void>;

  criarCupomTroca(dados: {
    usuarioId: number;
    codigo: string;
    valor: number;
  }): Promise<string>;

  listarCuponsTrocaPorUsuario(usuarioId: number): Promise<Array<{
    codigo: string;
    valorAtual: number;
    ativo: boolean;
  }>>;
}
