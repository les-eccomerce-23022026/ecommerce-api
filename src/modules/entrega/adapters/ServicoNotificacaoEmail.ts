import { Logger } from '@/shared/utils/Logger.util';
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
    const ctx = this.constructor.name;
    Logger.info(
      `[NOTIFICAÇÃO] E-mail simulado (${ctx}) para ${email}: rastreio da venda ${vendaUuid} = ${codigoRastreio}`,
    );
  }
}
