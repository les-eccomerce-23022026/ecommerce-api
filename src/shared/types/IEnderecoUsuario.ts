export interface IEnderecoUsuario {
  idUsuario: number;
  idPais: number;
  idLogradouro: number;
  numero: string;
  complemento?: string;
  idCidade: number;
  idBairro: number;
  idCep: number;
}