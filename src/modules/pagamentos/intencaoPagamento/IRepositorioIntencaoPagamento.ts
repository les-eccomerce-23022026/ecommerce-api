import type { EstadoIntencaoPagamento } from './EstadosIntencaoPagamento';

export interface IntencaoPagamentoPersistida {
  inpId: number;
  inpUuid: string;
  inpValor: number;
  inpProvedor: string;
  inpEstado: EstadoIntencaoPagamento;
  inpHashSegredo: string;
  inpCriadoEm: Date;
  inpExpiraEm: Date;
  inpTentativasConfirmacao: number;
  /** Preenchido após vínculo com venda; `vendaUuid` vem do JOIN quando `ven_id` não é nulo. */
  venId: number | null;
  vendaUuid: string | null;
}

export interface IRepositorioIntencaoPagamento {
  inserirSimulado(dados: {
    inpUuid: string;
    valor: number;
    hashSegredo: string;
    expiraEm: Date;
  }): Promise<void>;

  obterPorUuid(inpUuid: string): Promise<IntencaoPagamentoPersistida | null>;

  /**
   * Associa a intenção a uma venda (apenas em estado CRIADA, ven_id ainda nulo, não expirada).
   * @returns true se uma linha foi atualizada.
   */
  vincularVenda(inpUuid: string, venId: number): Promise<boolean>;

  incrementarTentativas(inpUuid: string): Promise<void>;

  atualizarEstado(
    inpUuid: string,
    estado: EstadoIntencaoPagamento,
    opcoes: { confirmadoEm?: Date; recusadoEm?: Date }
  ): Promise<void>;

  marcarExpiradasCriadasVencidas(): Promise<number>;
}
