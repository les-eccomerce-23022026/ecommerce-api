export interface ICartaoUsuario {
  id?: number;
  uuid: string;
  idUsuario: number;
  idBandeiraCartao: number;
  tokenCartao: string;
  finalCartao: string;
  nomeImpresso: string;
  validade: Date;
  principal: boolean;
}

export interface IBandeiraCartao {
  id: number;
  descricao: string;
}