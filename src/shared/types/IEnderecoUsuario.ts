export interface IEnderecoUsuario {
  id?: number;
  uuid?: string;
  idUsuario: number;
  idPais: number;
  idTipoResidencia: number;
  idLogradouro: number;
  numero: string;
  complemento?: string;
  idCidade: number;
  idBairro: number;
  idCep: number;
  principal: boolean;
}