import { IVendaInputDto } from '../dtos/IVenda.dto';

/**
 * Interface para a entidade de Venda no domínio.
 */
export interface IVenda {
  id: string; // PUBLIC UUID
  totalItens: number;
  frete: number;
  totalVenda: number;
  status: string;
  usuarioUuid: string;
  itens: IItemVenda[];
  criadoEm: Date;
  motivoTroca?: string;
  /** Data e hora em que a entrega foi confirmada. Usada para calcular o prazo de 7 dias para troca (RN0043). */
  dataHoraEntrega?: Date;
}

/**
 * Interface para a entidade de Item de Venda no domínio.
 */
export interface IItemVenda {
  id: string; // PUBLIC UUID
  livroUuid: string;
  quantidade: number;
  precoUnitario: number;
  emTroca?: boolean;
}

/**
 * Interface do repositório de vendas.
 */
export interface IRepositorioVendas {
  cadastrar(venda: IVendaInputDto): Promise<{ venda: IVenda; venId: number }>;
  obterPorUuid(uuid: string): Promise<IVenda | null>;
  listarPorUsuario(usuarioUuid: string): Promise<IVenda[]>;
  /** Listagem administrativa (todas as vendas), mais recentes primeiro. */
  listarTodas(limite?: number): Promise<IVenda[]>;
  atualizarStatus(vendaUuid: string, novoStatus: string): Promise<void>;

  /** 
   * Registra solicitação de troca na venda e marca itens.
   * Altera status da venda para 'EM TROCA'.
   */
  registrarSolicitacaoTroca(vendaUuid: string, motivo: string, itensUuids: string[]): Promise<void>;

  /**
   * Obtém o e-mail do usuário vinculado a uma venda.
   */
  obterEmailUsuarioPorVenda(vendaUuid: string): Promise<string | null>;

  /**
   * Conta vendas por status e loja.
   * Retorna um mapa com loj_id como chave e contagem como valor.
   */
  contarVendasPorStatusELoja(status: string[]): Promise<Map<number, number>>;
}
