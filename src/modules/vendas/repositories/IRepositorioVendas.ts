import { IVendaInputDto } from '../dtos/IVenda.dto';
import { DadoAnaliseVendas, FiltroAnaliseVendas } from '../dtos/AnaliseVendas.dto';

/**
 * Interface para a entidade de Venda no domínio.
 */
export interface IVenda {
  uuid: string; // PUBLIC UUID
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
  /** Data prevista de entrega calculada no despacho. Usada para auto-confirmação e exibição ao cliente. */
  dataPrevistaEntrega?: Date;
  /** ID interno da loja (multi-tenancy). Usado para validação de isolamento de dados por loja (RN0091). */
  lojId?: number;
}

/**
 * Interface para a entidade de Item de Venda no domínio.
 */
export interface IItemVenda {
  uuid: string; // PUBLIC UUID
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
   * Registra solicitação de devolução na venda e marca itens.
   * Altera status da venda para 'EM DEVOLUÇÃO'.
   */
  registrarSolicitacaoDevolucao(vendaUuid: string, motivo: string, itensUuids: string[]): Promise<void>;

  /**
   * Obtém o e-mail do usuário vinculado a uma venda.
   */
  obterEmailUsuarioPorVenda(vendaUuid: string): Promise<string | null>;

  /**
   * Conta vendas por status e loja.
   * Retorna um mapa com loj_id como chave e contagem como valor.
   */
  contarVendasPorStatusELoja(status: string[]): Promise<Map<number, number>>;

  /** Preço de venda ativo no catálogo para validação de integridade (U5). */
  obterPrecoVendaPorLivroUuid(livroUuid: string): Promise<number | null>;

  /**
   * Analisa vendas por categoria e período.
   * Retorna dados agregados por categoria e mês para gráfico de linhas.
   */
  analiseVendasPorCategoria(filtro: FiltroAnaliseVendas): Promise<DadoAnaliseVendas[]>;

  /** Persiste a data prevista de entrega calculada no despacho. */
  salvarDataPrevistaEntrega(vendaUuid: string, data: Date): Promise<void>;

  /**
   * Lista UUIDs de vendas em trânsito cuja data prevista de entrega já passou.
   * Usado pelo job de auto-confirmação de entrega.
   */
  listarVendasEmTransitoComPrazoVencido(): Promise<string[]>;
}
