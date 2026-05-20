/**
 * DTO para associar um papel a um usuário.
 */
export interface IAssociarPapelDto {
  uuidUsuario: string;
  idPapel: number;
}

/**
 * DTO para remover um papel de um usuário.
 */
export interface IRemoverPapelDto {
  uuidUsuario: string;
  idPapel: number;
}

/**
 * DTO de resposta para operações de papéis de usuário.
 */
export interface IRespostaPapelUsuarioDto {
  sucesso: boolean;
  mensagem: string;
}
