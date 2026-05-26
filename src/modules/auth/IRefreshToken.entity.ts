/**
 * Entidade de Refresh Token
 * 
 * Implementa refresh token (long-lived) para renovar access tokens (short-lived)
 * sem exigir credenciais novamente.
 * 
 * Segurança:
 * - Token armazenado como hash (SHA-256) - nunca plaintext
 * - IP e user agent para proteção contra replay attack
 * - Expiração configurável (recomendado: 7-30 dias)
 * - Revogação manual possível (logout, segurança)
 */
export interface IRefreshToken {
  id: number;
  uuid: string;
  usuarioId: number;
  tokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  expiraEm: Date;
  revocadoEm?: Date;
  criadoEm: Date;
  lojId: number;
}

export interface ICriarRefreshTokenDto {
  usuarioId: number;
  token: string; // Refresh token em plaintext (será hasheado)
  ipAddress?: string;
  userAgent?: string;
  expiraEm: Date;
  lojId: number;
}

export interface IRefreshTokenCriadoDto {
  uuid: string;
  token: string; // Refresh token em plaintext (retornado apenas uma vez)
  expiraEm: Date;
}
