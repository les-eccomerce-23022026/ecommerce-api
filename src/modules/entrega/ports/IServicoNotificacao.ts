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

  /**
   * Envia uma notificação solicitando reconfirmação de endereço ao cliente.
   * @param email Destinatário.
   * @param vendaUuid UUID da venda para referência.
   */
  enviarNotificacaoReconfirmacaoEndereco(email: string, vendaUuid: string): Promise<void>;

  /**
   * Envia uma notificação de aviso de expiração de reserva no carrinho.
   * @param usuarioUuid UUID do usuário.
   * @param livroTitulo Título do livro.
   * @param tempoRestante Tempo restante em minutos.
   */
  enviarNotificacaoExpiracaoReserva(usuarioUuid: string, livroTitulo: string, tempoRestante: number): Promise<void>;
}
