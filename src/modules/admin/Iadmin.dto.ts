/**
 * DTO para criação de novos administradores.
 */
export interface ICriarAdminDto {
  nome: string;
  email: string;
  cpf: string;
  senha: string;
  confirmacaoSenha: string;
}

/**
 * DTO de retorno para administrador criado.
 */
export interface IRespostaAdminCriadoDto {
  uuid: string;
  nome: string;
  email: string;
  cpf: string;
  role: string;
}
