/**
 * DTO para requisição de login.
 */
export interface DadosLoginDto {
  email: string;
  senha: string;
}

/**
 * Representa o usuário retornado após autenticação.
 */
export interface UsuarioAutenticadoDto {
  uuid: string;
  nome: string;
  email: string;
  cpf: string;
  role: 'cliente' | 'admin';
}

/**
 * Resposta de login contendo token e dados do usuário.
 */
export interface RespostaLoginDto {
  token: string;
  user: UsuarioAutenticadoDto;
}

