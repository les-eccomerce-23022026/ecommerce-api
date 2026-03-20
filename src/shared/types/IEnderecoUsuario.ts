/** Tipo do endereço conforme RN0021/RN0022 */
export type TipoEndereco = 'cobranca' | 'entrega';

export interface IEnderecoUsuario {
  id?: number;
  uuid?: string;
  idUsuario: number;
  tipo: TipoEndereco;
  apelido?: string;
  idPais: number;
  idTipoResidencia: number;
  idLogradouro: number;
  numero: string;
  complemento?: string;
  idCidade: number;
  idBairro: number;
  idCep: number;
  principal: boolean;
  criadoEm?: Date;
  atualizadoEm?: Date;
}
