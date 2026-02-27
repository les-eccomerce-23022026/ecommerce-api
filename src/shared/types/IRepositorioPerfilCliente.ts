import { IPerfilCliente } from './IPerfilCliente';

export interface IRepositorioPerfilCliente {
  criar(perfil: IPerfilCliente): Promise<void>;
  buscarPorIdUsuario(idUsuario: number): Promise<IPerfilCliente | null>;
  atualizar(perfil: IPerfilCliente): Promise<void>;
  deletar(idUsuario: number): Promise<void>;
}