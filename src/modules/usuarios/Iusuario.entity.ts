import { IPapelUsuario } from '../../shared/types/Ipapel-usuario';
import { ITelefoneDto } from '../clientes/Iclientes.dto';

export interface IUsuario {
  id: number;
  uuid: string;
  nome: string;
  email: string;
  cpf: string;
  senhaHash: string;
  role: IPapelUsuario;
  ativo: boolean;
  genero?: string;
  dataNascimento?: string;
  telefone?: ITelefoneDto;
}

