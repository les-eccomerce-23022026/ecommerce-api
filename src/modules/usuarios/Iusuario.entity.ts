import { IPapelUsuario } from '../../shared/types/Ipapel-usuario';

export interface IUsuario {
  id: number;
  uuid: string;
  nome: string;
  email: string;
  cpf: string;
  telefoneRapido?: string;
  senhaHash: string;
  idPapel: number;
  role: IPapelUsuario;
  ativo: boolean;
  isAdminMestre?: boolean;
  genero?: string;
  dataNascimento?: Date;
  criadoEm?: Date;
  atualizadoEm?: Date;
}
