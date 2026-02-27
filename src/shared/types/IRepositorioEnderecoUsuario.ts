import { IEnderecoUsuario } from './IEnderecoUsuario';

export interface IRepositorioEnderecoUsuario {
  criar(endereco: IEnderecoUsuario): Promise<void>;
  buscarPorIdUsuario(idUsuario: number): Promise<IEnderecoUsuario[]>;
  atualizar(endereco: IEnderecoUsuario): Promise<void>;
  deletar(idUsuario: number, idLogradouro: number): Promise<void>;
}