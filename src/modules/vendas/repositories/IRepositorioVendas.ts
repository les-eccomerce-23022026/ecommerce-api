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
}

/**
 * Interface para a entidade de Item de Venda no domínio.
 */
export interface IItemVenda {
  id: string; // PUBLIC UUID
  livroUuid: string;
  quantidade: number;
  precoUnitario: number;
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
}
