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
 */
export interface IUsuarioAutenticadoDto {
  uuid: string;
  nome: string;
  email: string;
  cpf: string;
  role: string;
}

/**
 * Resposta de login contendo token e dados do usuário.
 */
export interface IRespostaLoginDto {
  token: string;
  user: IUsuarioAutenticadoDto;
}

