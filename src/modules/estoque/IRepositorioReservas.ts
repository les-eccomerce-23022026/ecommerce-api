/**
 * Status de uma reserva de estoque
 */
export type StatusReserva = 'ATIVA' | 'EXPIRADA' | 'CONSUMIDA' | 'CANCELADA';

/**
 * DTO de criação de reserva de estoque
 */
export interface ICriarReservaEstoqueDTO {
  usuId: number;
  livId: number;
  quantidade: number;
  expiraEm: Date;
  lojId: number;
}

/**
 * DTO de atualização de reserva de estoque
 */
export interface IAtualizarReservaEstoqueDTO {
  uuid: string;
  quantidade?: number;
  expiraEm?: Date;
  status?: StatusReserva;
}

/**
 * Entidade de reserva de estoque
 */
export interface IReservaEstoque {
  id: number;
  uuid: string;
  usuId: number;
  livId: number;
  quantidade: number;
  criadoEm: Date;
  expiraEm: Date;
  status: StatusReserva;
  lojId: number;
}

/**
 * Interface do Repositório de Reservas de Estoque
 * Segue o Princípio de Inversão de Dependência (DIP)
 */
export interface IRepositorioReservas {
  /**
   * Cria uma nova reserva de estoque
   * @param dados Dados da reserva
   * @returns Reserva criada
   */
  criar(dados: ICriarReservaEstoqueDTO): Promise<IReservaEstoque>;

  /**
   * Atualiza uma reserva existente
   * @param dados Dados para atualização
   * @returns Reserva atualizada
   */
  atualizar(dados: IAtualizarReservaEstoqueDTO): Promise<IReservaEstoque>;

  /**
   * Cancela uma reserva (muda status para CANCELADA)
   * @param uuid UUID da reserva
   * @param lojId ID da loja (multi-tenancy)
   */
  cancelar(uuid: string, lojId: number): Promise<void>;

  /**
   * Busca reservas ativas de um usuário
   * @param usuId ID do usuário
   * @param lojId ID da loja (multi-tenancy)
   * @returns Lista de reservas ativas
   */
  buscarReservasAtivas(usuId: number, lojId: number): Promise<IReservaEstoque[]>;

  /**
   * Busca reservas ativas de um usuário para um livro específico
   * @param usuId ID do usuário
   * @param livId ID do livro
   * @param lojId ID da loja (multi-tenancy)
   * @returns Reserva ativa ou null
   */
  buscarReservaAtivaPorUsuarioLivro(usuId: number, livId: number, lojId: number): Promise<IReservaEstoque | null>;

  /**
   * Busca todas as reservas (inclusive não ativas) de um usuário para um livro específico
   * @param usuId ID do usuário
   * @param livId ID do livro
   * @param lojId ID da loja (multi-tenancy)
   * @returns Lista de reservas
   */
  buscarReservasPorUsuarioLivro(usuId: number, livId: number, lojId: number): Promise<IReservaEstoque[]>;

  /**
   * Busca reservas expiradas que ainda estão ativas
   * @param lojId ID da loja (multi-tenancy)
   * @returns Lista de reservas expiradas
   */
  buscarReservasExpiradas(lojId: number): Promise<IReservaEstoque[]>;

  /**
   * Marca uma reserva como expirada
   * @param uuid UUID da reserva
   * @param lojId ID da loja (multi-tenancy)
   */
  marcarComoExpirada(uuid: string, lojId: number): Promise<void>;

  /**
   * Marca uma reserva como consumida
   * @param uuid UUID da reserva
   * @param lojId ID da loja (multi-tenancy)
   */
  marcarComoConsumida(uuid: string, lojId: number): Promise<void>;

  /**
   * Busca uma reserva por UUID
   * @param uuid UUID da reserva
   * @param lojId ID da loja (multi-tenancy)
   * @returns Reserva ou null
   */
  buscarPorUuid(uuid: string, lojId: number): Promise<IReservaEstoque | null>;

  /**
   * Busca reservas por livro
   * @param livId ID do livro
   * @param lojId ID da loja (multi-tenancy)
   * @returns Lista de reservas
   */
  buscarPorLivro(livId: number, lojId: number): Promise<IReservaEstoque[]>;
}
