/**
 * Serviço de Notificação via Banco de Dados
 * 
 * Implementação de IServicoNotificacao que salva notificações no banco
 * em vez de enviar e-mail, permitindo validação via E2E.
 * 
 * Esta solução é mais testável que e-mail externo e adequada para
 * validação de cenários BDD de rastreio.
 */

import { IServicoNotificacao } from '../ports/IServicoNotificacao';
import { RepositorioNotificacoes } from '../RepositorioNotificacoes';
import { INotificacao } from '../types/Notificacao';

export class ServicoNotificacaoBanco implements IServicoNotificacao {
  constructor(private readonly repositorioNotificacoes: RepositorioNotificacoes) {}

  async enviarNotificacaoRastreio(
    email: string,
    codigoRastreio: string,
    vendaUuid: string
  ): Promise<void> {
    // Buscar usuário pelo email para obter o UUID
    const usuario = await this.repositorioNotificacoes.buscarUsuarioPorEmail(email);
    
    if (!usuario) {
      console.warn(`Usuário não encontrado para email: ${email}. Notificação não enviada.`);
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

  /**
   * Cria notificação de troca autorizada
   */
  async criarNotificacaoTrocaAutorizada(
    usuarioUuid: string,
    vendaUuid: string
  ): Promise<void> {
    const notificacao: INotificacao = {
      usuarioUuid,
      vendaUuid,
      tipo: 'TROCA_AUTORIZADA',
      titulo: 'Troca Autorizada',
      mensagem: 'Sua solicitação de troca foi autorizada. Siga as instruções para postagem.',
      lida: false,
    };

    await this.repositorioNotificacoes.criar(notificacao);
  }

  /**
   * Cria notificação de troca finalizada
   */
  async criarNotificacaoTrocaFinalizada(
    usuarioUuid: string,
    vendaUuid: string,
    valorCupom: number
  ): Promise<void> {
    const notificacao: INotificacao = {
      usuarioUuid,
      vendaUuid,
      tipo: 'TROCA_FINALIZADA',
      titulo: 'Troca Finalizada',
      mensagem: `Sua troca foi finalizada. Cupom de R$ ${valorCupom.toFixed(2)} gerado!`,
      lida: false,
    };

    await this.repositorioNotificacoes.criar(notificacao);
  }

  /**
   * Cria notificação de troca rejeitada
   */
  async criarNotificacaoTrocaRejeitada(
    usuarioUuid: string,
    vendaUuid: string,
    motivo: string
  ): Promise<void> {
    const notificacao: INotificacao = {
      usuarioUuid,
      vendaUuid,
      tipo: 'TROCA_REJEITADA',
      titulo: 'Troca Rejeitada',
      mensagem: `Sua solicitação de troca foi rejeitada. Motivo: ${motivo}`,
      lida: false,
    };

    await this.repositorioNotificacoes.criar(notificacao);
  }
}
