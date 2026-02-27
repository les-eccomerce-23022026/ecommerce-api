export interface ITelefoneUsuario {
  id?: number;
  uuid?: string;
  idUsuario: number;
  idTipoTelefone: number;
  ddd: string;
  numero: string;
  principal: boolean;
}