import { Logger } from '@/shared/utils/Logger.util';
import { IServicoNotificacao } from '../ports/IServicoNotificacao';
import { RepositorioNotificacoes } from '../RepositorioNotificacoes';
import { INotificacao } from '../types/Notificacao';

/**
 * Adapter padrão que simula o envio de e-mail (imprime no console e persiste no banco).
 */
export class ServicoNotificacaoEmail implements IServicoNotificacao {
  constructor(private readonly repositorioNotificacoes: RepositorioNotificacoes) {}

  public async enviarNotificacaoRastreio(
    email: string,
    codigoRastreio: string,
    vendaUuid: string
  ): Promise<void> {
    const ctx = this.constructor.name;
    Logger.info(
      `[NOTIFICAÇÃO] E-mail simulado (${ctx}) para ${email}: rastreio da venda ${vendaUuid} = ${codigoRastreio}`,
    );

    // Persistir notificação no banco
    await this.persistirNotificacaoRastreio(email, codigoRastreio, vendaUuid);
  }

  public async enviarNotificacaoReconfirmacaoEndereco(
    email: string,
    vendaUuid: string
  ): Promise<void> {
    const ctx = this.constructor.name;
    Logger.info(
      `[NOTIFICAÇÃO] E-mail simulado (${ctx}) para ${email}: solicitação de reconfirmação de endereço para venda ${vendaUuid}`,
    );

    // Persistir notificação no banco
    await this.persistirNotificacaoReconfirmacaoEndereco(email, vendaUuid);
  }

  private async persistirNotificacaoRastreio(
    email: string,
    codigoRastreio: string,
    vendaUuid: string
  ): Promise<void> {
    const usuario = await this.repositorioNotificacoes.buscarUsuarioPorEmail(email);
    
    if (!usuario) {
      console.warn(`Usuário não encontrado para email: ${email}. Notificação não persistida.`);
      return;
    }

    const notificacao: INotificacao = {
      usuarioUuid: usuario.uuid,
      vendaUuid,
      tipo: 'RASTREIO',
      titulo: 'Pedido em Trânsito',
      mensagem: `Seu pedido foi despachado! Código de rastreio: ${codigoRastreio}`,
      codigoRastreio,
      lida: false,
    };

    await this.repositorioNotificacoes.criar(notificacao);
  }

  private async persistirNotificacaoReconfirmacaoEndereco(
    email: string,
    vendaUuid: string
  ): Promise<void> {
    const usuario = await this.repositorioNotificacoes.buscarUsuarioPorEmail(email);
    
    if (!usuario) {
      console.warn(`Usuário não encontrado para email: ${email}. Notificação não persistida.`);
      return;
    }

    const notificacao: INotificacao = {
      usuarioUuid: usuario.uuid,
      vendaUuid,
      tipo: 'RECONFIRMACAO_ENDERECO',
      titulo: 'Solicitação de Reconfirmação de Endereço',
      mensagem: 'Houve uma falha na entrega. Por favor, confirme seu endereço para redespacho.',
      lida: false,
    };

    await this.repositorioNotificacoes.criar(notificacao);
  }
}
