export interface ICartaoUsuario {
  id?: number;
  uuid: string;
  idUsuario: number;
  idBandeira: number;
  bandeira?: string;
  token: string;
  ultimosDigitosCartao: string;
  nomeImpresso: string;
  validade: Date;
  principal: boolean;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export interface IBandeiraCartao {
  id: number;
  uuid: string;
  descricao: string;
}
