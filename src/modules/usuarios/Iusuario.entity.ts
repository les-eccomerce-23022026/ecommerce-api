import { IPapelUsuario } from '../../shared/types/Ipapel-usuario';

export interface IUsuario {
  id: number;
  uuid: string;
  nome: string;
  email: string;
  cpf: string;
  senhaHash: string;
  role: IPapelUsuario;
  ativo: boolean;
}

