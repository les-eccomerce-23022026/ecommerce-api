import { IRepositorioReservas, IReservaEstoque } from '../IRepositorioReservas';
import { RepositorioEstoque } from '../repositorioEstoque';
import { Logger } from '@/shared/utils/Logger.util';
import { IServicoNotificacao } from '@/modules/entrega/ports/IServicoNotificacao';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';
import { RepositorioUsuarios } from '@/modules/usuarios/usuario.repository';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';

/**
 * Interface para reserva com dados de notificação
 */
interface IReservaComDadosNotificacao {
  uuid: string;
  usuId: number;
  livId: number;
  quantidade: number;
  expiraEm: Date;
  usuarioUuid: string;
  livroUuid: string;
  livroTitulo: string;
}

/**
 * Job responsável por expirar reservas de estoque que ultrapassaram o prazo
 * e liberar o estoque reservado de volta para disponibilidade.
 *
 * Fluxo: a cada 10 minutos, busca reservas ATIVAs com rse_expira_em <= NOW(),
 * marca como EXPIRADA e libera a quantidade no estoque.
 * 
 * Também envia notificações 5 minutos antes da expiração.
 */
export class JobExpiracaoReservas {
  private intervalo: NodeJS.Timeout | null = null;
  private readonly db: IConexaoBanco;

  constructor(
    private readonly repositorioReservas: IRepositorioReservas,
    private readonly repositorioEstoque: RepositorioEstoque,
    private readonly servicoNotificacao?: IServicoNotificacao,
    private readonly repositorioLivros?: RepositorioLivrosPostgres,
    private readonly repositorioUsuarios?: RepositorioUsuarios,
    private readonly intervaloMinutos: number = 10,
  ) {
    this.db = ConexaoPostgres.obterInstancia();
  }

  public iniciar(): void {
    if (this.intervalo) return;

    Logger.info(`[JobExpiracaoReservas] Iniciado (intervalo: ${this.intervaloMinutos} min)`);

    setTimeout(() => this.executar(), 5000);
    this.intervalo = setInterval(() => this.executar(), this.intervaloMinutos * 60 * 1000);
  }

  public parar(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
      Logger.info('[JobExpiracaoReservas] Parado');
    }
  }

  private async executar(): Promise<void> {
    try {
      // Buscar todas as lojas com reservas expiradas
      // Por enquanto, processamos apenas a loja padrão (1)
      // Em multi-tenancy real, precisaríamos listar todas as lojas
      const lojasParaProcessar = [1]; // TODO: obter lista de lojas ativas

      for (const lojId of lojasParaProcessar) {
        await this.processarLoja(lojId);
        await this.processarNotificacoesExpiracao(lojId);
      }
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      Logger.warn(`[JobExpiracaoReservas] Erro na execução: ${msg}`);
    }
  }

  private async processarLoja(lojId: number): Promise<void> {
    try {
      const reservasExpiradas = await this.repositorioReservas.buscarReservasExpiradas(lojId);

      if (reservasExpiradas.length === 0) {
        return;
      }

      Logger.info(`[JobExpiracaoReservas] ${reservasExpiradas.length} reserva(s) expirada(s) na loja ${lojId}`);

      for (const reserva of reservasExpiradas) {
        await this.expirarReserva(reserva, lojId);
      }
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      Logger.warn(`[JobExpiracaoReservas] Erro ao processar loja ${lojId}: ${msg}`);
    }
  }

  private async expirarReserva(reserva: IReservaEstoque, lojId: number): Promise<void> {
    try {
      // Liberar quantidade no estoque
      await this.repositorioEstoque.liberarQuantidadeReservada(
        reserva.livId,
        reserva.quantidade,
        lojId
      );

      // Marcar reserva como expirada
      await this.repositorioReservas.marcarComoExpirada(reserva.uuid, lojId);

      Logger.info(
        `[JobExpiracaoReservas] Reserva expirada: uuid=${reserva.uuid}, usuId=${reserva.usuId}, livId=${reserva.livId}, quantidade=${reserva.quantidade}`
      );

      // Enviar notificação ao usuário sobre reserva expirada
      if (this.servicoNotificacao && this.repositorioLivros && this.repositorioUsuarios) {
        await this.enviarNotificacaoExpiracao(reserva, lojId);
      }
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      Logger.warn(`[JobExpiracaoReservas] Falha ao expirar reserva ${reserva.uuid}: ${msg}`);
    }
  }

  /**
   * Processa notificações de reservas que expirarão em 5 minutos
   */
  private async processarNotificacoesExpiracao(lojId: number): Promise<void> {
    if (!this.servicoNotificacao || !this.repositorioLivros || !this.repositorioUsuarios) {
      return;
    }

    try {
      // Buscar reservas que expirarão em 5 minutos (entre 4 e 6 minutos para evitar duplicatas)
      const sql = `
        SELECT
          r.rse_uuid AS uuid,
          r.usu_id AS "usuId",
          r.liv_id AS "livId",
          r.rse_quantidade AS quantidade,
          r.rse_expira_em AS "expiraEm",
          u.usu_uuid AS "usuarioUuid",
          l.liv_uuid AS "livroUuid",
          l.liv_titulo AS "livroTitulo"
        FROM livraria_comercial.reservas_estoque r
        INNER JOIN livraria_gestao.usuarios u ON r.usu_id = u.usu_id
        INNER JOIN livraria_comercial.livros l ON r.liv_id = l.liv_id
        WHERE r.loj_id = $1
          AND r.rse_status = 'ATIVA'
          AND r.rse_expira_em > NOW()
          AND r.rse_expira_em <= NOW() + INTERVAL '6 minutes'
          AND r.rse_expira_em > NOW() + INTERVAL '4 minutes'
      `;

      const reservasProximasExpiracao = await this.db.executar<IReservaComDadosNotificacao>(sql, [lojId]);

      if (reservasProximasExpiracao.length === 0) {
        return;
      }

      Logger.info(`[JobExpiracaoReservas] ${reservasProximasExpiracao.length} reserva(s) expirando em 5 minutos na loja ${lojId}`);

      for (const reserva of reservasProximasExpiracao) {
        await this.enviarNotificacaoAvisoExpiracao(reserva);
      }
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      Logger.warn(`[JobExpiracaoReservas] Erro ao processar notificações de expiração na loja ${lojId}: ${msg}`);
    }
  }

  /**
   * Envia notificação de aviso de expiração (5 minutos antes)
   */
  private async enviarNotificacaoAvisoExpiracao(reserva: IReservaComDadosNotificacao): Promise<void> {
    if (!this.servicoNotificacao) {
      return;
    }

    try {
      // Calcular tempo restante em minutos
      const tempoRestante = Math.floor((new Date(reserva.expiraEm).getTime() - Date.now()) / 60000);

      // Enviar notificação
      await this.servicoNotificacao.enviarNotificacaoExpiracaoReserva(
        reserva.usuarioUuid,
        reserva.livroTitulo,
        tempoRestante
      );

      Logger.info(
        `[JobExpiracaoReservas] Notificação de aviso enviada: usuId=${reserva.usuId}, livId=${reserva.livId}, tempoRestante=${tempoRestante}min`
      );
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      Logger.warn(`[JobExpiracaoReservas] Falha ao enviar notificação de aviso: ${msg}`);
    }
  }

  /**
   * Envia notificação de reserva expirada
   */
  private async enviarNotificacaoExpiracao(reserva: IReservaEstoque, lojId: number): Promise<void> {
    if (!this.servicoNotificacao || !this.repositorioLivros || !this.repositorioUsuarios) {
      return;
    }

    try {
      // Buscar dados completos da reserva com joins
      const sql = `
        SELECT
          r.rse_uuid AS uuid,
          r.usu_id AS "usuId",
          r.liv_id AS "livId",
          r.rse_quantidade AS quantidade,
          r.rse_expira_em AS "expiraEm",
          u.usu_uuid AS "usuarioUuid",
          l.liv_uuid AS "livroUuid",
          l.liv_titulo AS "livroTitulo"
        FROM livraria_comercial.reservas_estoque r
        INNER JOIN livraria_gestao.usuarios u ON r.usu_id = u.usu_id
        INNER JOIN livraria_comercial.livros l ON r.liv_id = l.liv_id
        WHERE r.rse_uuid = $1 AND r.loj_id = $2
      `;

      const reservas = await this.db.executar<IReservaComDadosNotificacao>(sql, [reserva.uuid, lojId]);

      if (reservas.length === 0) {
        Logger.warn(`[JobExpiracaoReservas] Reserva não encontrada: uuid=${reserva.uuid}`);
        return;
      }

      const reservaCompleta = reservas[0];

      // Enviar notificação de expiração
      await this.servicoNotificacao.enviarNotificacaoExpiracaoReserva(
        reservaCompleta.usuarioUuid,
        reservaCompleta.livroTitulo,
        0
      );

      Logger.info(
        `[JobExpiracaoReservas] Notificação de expiração enviada: usuId=${reserva.usuId}, livId=${reserva.livId}`
      );
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      Logger.warn(`[JobExpiracaoReservas] Falha ao enviar notificação de expiração: ${msg}`);
    }
  }
}
