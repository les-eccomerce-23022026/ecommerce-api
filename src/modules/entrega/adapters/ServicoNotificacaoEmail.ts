import { IServicoNotificacao } from '../ports/IServicoNotificacao';

/**
 * Adapter padrão que simula o envio de e-mail (imprime no console).
 */
export class ServicoNotificacaoEmail implements IServicoNotificacao {
  public async enviarNotificacaoRastreio(
    email: string,
    codigoRastreio: string,
    vendaUuid: string
  ): Promise<void> {
    // Simula disparo de e-mail (log em dev)
    console.log(`[NOTIFICAÇÃO] E-mail enviado para ${email}: Seu código de rastreio para a venda ${vendaUuid} é ${codigoRastreio}`);
  }
}
