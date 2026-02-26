export type PapelUsuario = 'cliente' | 'admin';

export interface Usuario {
  uuid: string;
  nome: string;
  email: string;
  cpf: string;
  senhaHash: string;
  role: PapelUsuario;
  ativo: boolean;
}

