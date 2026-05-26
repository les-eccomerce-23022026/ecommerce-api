export interface ITelefoneUsuario {
  id?: number;
  uuid?: string;
  idUsuario: number;
  idTipoTelefone: number;
  numero: string;
  principal: boolean;
  criadoEm?: Date;
  atualizadoEm?: Date;
}
