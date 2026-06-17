import { IEnderecoUsuario } from './IEnderecoUsuario';

export interface IRepositorioEnderecoUsuario {
  criar(endereco: IEnderecoUsuario): Promise<IEnderecoUsuario>;
  buscarPorIdUsuario(idUsuario: number): Promise<IEnderecoUsuario[]>;
  buscarResumoPorIdUsuario(idUsuario: number): Promise<Array<{
    apelido: string | null;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    principal: boolean;
  }>>;
  atualizar(endereco: IEnderecoUsuario): Promise<void>;
  deletar(idUsuario: number, uuidEndereco: string): Promise<void>;
}