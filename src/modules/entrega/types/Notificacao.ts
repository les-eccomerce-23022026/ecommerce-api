/**
 * Tipo de Notificação
 */

export interface INotificacao {
  uuid?: string;
  usuarioUuid: string;
  vendaUuid?: string;
  tipo: 'RASTREIO' | 'TROCA_AUTORIZADA' | 'TROCA_FINALIZADA' | 'TROCA_REJEITADA';
  titulo: string;
  mensagem: string;
  codigoRastreio?: string;
  lida: boolean;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export interface INotificacaoResponse extends INotificacao {
  uuid: string;
  criadoEm: Date;
  atualizadoEm: Date;
}
