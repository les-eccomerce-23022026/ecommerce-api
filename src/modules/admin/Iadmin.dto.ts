/**
 * DTO para criação de novos administradores.
 */
export interface ICriarAdminDto {
  nome: string;
  email: string;
  cpf: string;
  senha: string;
  confirmacao_senha: string;
}

/**
 * DTO de retorno para administrador criado.
 * Expõe somente a descrição do papel (sem o id interno do papel).
 */
export interface IRespostaAdminCriadoDto {
  uuid: string;
  nome: string;
  email: string;
  cpf: string;
  role: string;
}
