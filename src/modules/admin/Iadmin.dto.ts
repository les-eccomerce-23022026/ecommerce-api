import { IPapelUsuario } from '@/shared/types/Ipapel-usuario';

/**
 * DTO para criação de novos administradores.
 */
export interface ICriarAdminDto {
  nome: string;
  email: string;
  cpf: string;
  senha: string;
  confirmacao_senha: string;
  role: IPapelUsuario; // Deve ser 'admin'
}

/**
 * DTO de retorno para administrador criado.
 */
export interface IRespostaAdminCriadoDto {
  uuid: string;
  nome: string;
  email: string;
  cpf: string;
  role: IPapelUsuario;
}
