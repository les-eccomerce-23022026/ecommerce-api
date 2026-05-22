/**
 * DTO para requisição de login.
 */
export interface IDadosLoginDto {
  email: string;
  senha: string;
}

/**
 * Representa o usuário retornado após autenticação.
 * Expõe somente o uuid e a descrição do papel (sem o id interno do papel).
 * Suporta múltiplos papéis através do array papeis.
 */
export interface IUsuarioAutenticadoDto {
  uuid: string;
  nome: string;
  email: string;
  role: string; // Papel principal (compatibilidade)
  papeis: string[]; // Array de papéis do usuário (cliente, admin, etc.)
}

/**
 * Resposta de login contendo token, refresh token e dados do usuário.
 */
export interface IRespostaLoginDto {
  token: string; // Access token (short-lived)
  refreshToken?: string; // Refresh token (long-lived)
  refreshTokenExpiresAt?: Date; // Data de expiração do refresh token
  user: IUsuarioAutenticadoDto;
}

