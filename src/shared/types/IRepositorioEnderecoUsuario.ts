import { IEnderecoUsuario } from './IEnderecoUsuario';

export interface IRepositorioEnderecoUsuario {
  criar(endereco: IEnderecoUsuario): Promise<IEnderecoUsuario>;
  buscarPorIdUsuario(idUsuario: number): Promise<IEnderecoUsuario[]>;
  atualizar(endereco: IEnderecoUsuario): Promise<void>;
  deletar(idUsuario: number, uuidEndereco: string): Promise<void>;
}