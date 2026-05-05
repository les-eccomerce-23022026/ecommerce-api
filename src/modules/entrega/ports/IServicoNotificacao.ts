/**
 * Interface para o serviço de notificação (Port).
 */
export interface IServicoNotificacao {
  /**
   * Envia uma notificação (ex: e-mail) com os dados de rastreio.
   * @param email Destinatário.
   * @param codigoRastreio UUID da entrega ou código gerado.
   * @param vendaUuid UUID da venda para referência.
   */
  enviarNotificacaoRastreio(email: string, codigoRastreio: string, vendaUuid: string): Promise<void>;
}
