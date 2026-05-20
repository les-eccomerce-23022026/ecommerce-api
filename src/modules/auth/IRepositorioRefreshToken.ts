import { IRefreshToken, ICriarRefreshTokenDto } from './IRefreshToken.entity';

/**
 * Interface do repositório de Refresh Tokens
 */
export interface IRepositorioRefreshToken {
  /**
   * Cria um novo refresh token
   */
  criar(dto: ICriarRefreshTokenDto): Promise<IRefreshToken>;

  /**
   * Busca refresh token por hash
   */
  buscarPorHash(tokenHash: string): Promise<IRefreshToken | null>;

  /**
   * Busca refresh tokens ativos do usuário
   */
  buscarPorUsuario(usuarioId: number): Promise<IRefreshToken[]>;

  /**
   * Revoga um refresh token específico
   */
  revogar(uuid: string): Promise<void>;

  /**
   * Revoga todos os refresh tokens do usuário
   */
  revogarTodosDoUsuario(usuarioId: number): Promise<void>;

  /**
   * Limpa refresh tokens expirados
   */
  limparExpirados(): Promise<void>;
}

// Re-exportar DTOs para uso em outros módulos
export type { ICriarRefreshTokenDto } from './IRefreshToken.entity';
