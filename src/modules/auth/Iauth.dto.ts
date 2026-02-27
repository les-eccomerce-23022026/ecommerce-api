import { IPapelUsuario } from '@/shared/types/Ipapel-usuario';

/**
 * DTO para requisição de login.
 */
export interface IDadosLoginDto {
  email: string;
  senha: string;
}

/**
 * Representa o usuário retornado após autenticação.
 */
export interface IUsuarioAutenticadoDto {
  uuid: string;
  nome: string;
  email: string;
  cpf: string;
  role: IPapelUsuario;
}

/**
 * Resposta de login contendo token e dados do usuário.
 */
export interface IRespostaLoginDto {
  token: string;
  user: IUsuarioAutenticadoDto;
}

