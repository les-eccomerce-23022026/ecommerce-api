import { ITelefoneUsuario } from './ITelefoneUsuario';

export interface IRepositorioTelefoneUsuario {
  criar(telefone: ITelefoneUsuario): Promise<void>;
  buscarPorIdUsuario(idUsuario: number): Promise<ITelefoneUsuario[]>;
  atualizar(telefone: ITelefoneUsuario): Promise<void>;
  deletar(idUsuario: number, idTipoTelefone: number): Promise<void>;
}