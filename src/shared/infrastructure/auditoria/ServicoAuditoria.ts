import { IRepositorioAuditoria, IAuditoriaRegistro } from './IRepositorioAuditoria';
import { Request } from 'express';

/**
 * Tipos de ações de auditoria
 */
export enum TipoAcaoAuditoria {
  CRIAR = 'CRIAR',
  ATUALIZAR = 'ATUALIZAR',
  DELETAR = 'DELETAR',
  APROVAR = 'APROVAR',
  REJEITAR = 'REJEITAR',
  PROCESSAR = 'PROCESSAR',
  CANCELAR = 'CANCELAR',
  CONFIRMAR = 'CONFIRMAR',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

/**
 * Entidades do sistema para auditoria
 */
export enum EntidadeAuditoria {
  VENDA = 'venda',
  PAGAMENTO = 'pagamento',
  TROCA = 'troca',
  USUARIO = 'usuario',
  CLIENTE = 'cliente',
  PRODUTO = 'produto',
  PEDIDO = 'pedido',
  ENTREGA = 'entrega',
  CUPOM = 'cupom',
}

/**
 * Serviço de auditoria para registrar ações críticas no sistema.
 */
export class ServicoAuditoria {
  constructor(private readonly repositorioAuditoria: IRepositorioAuditoria) {}

  /**
   * Registra uma ação de auditoria.
   */
  public async registrar(registro: IAuditoriaRegistro): Promise<void> {
    await this.repositorioAuditoria.registrar(registro);
  }

  /**
   * Registra uma ação de auditoria com contexto da requisição HTTP.
   */
  public async registrarDaRequisicao(
    req: Request,
    tipoAcao: TipoAcaoAuditoria,
    entidade: EntidadeAuditoria,
    entidadeId: string,
    dadosAnteriores?: Record<string, unknown>,
    dadosNovos?: Record<string, unknown>
  ): Promise<void> {
    const usuarioId = req.usuario?.id;
    const usuarioUuid = req.usuario?.uuid;
    const ip = this.extrairIp(req);
    const userAgent = req.headers['user-agent'] as string;

    await this.repositorioAuditoria.registrar({
      tipoAcao,
      entidade,
      entidadeId,
      usuarioId,
      usuarioUuid,
      dadosAnteriores,
      dadosNovos,
      ip,
      userAgent,
    });
  }

  /**
   * Lista histórico de auditoria por entidade.
   */
  public async listarPorEntidade(
    entidade: string,
    entidadeId: string,
    limite?: number
  ): Promise<IAuditoriaRegistro[]> {
    return this.repositorioAuditoria.listarPorEntidade(entidade, entidadeId, limite);
  }

  /**
   * Lista histórico de auditoria por usuário.
   */
  public async listarPorUsuario(
    usuarioId: number,
    limite?: number
  ): Promise<IAuditoriaRegistro[]> {
    return this.repositorioAuditoria.listarPorUsuario(usuarioId, limite);
  }

  /**
   * Extrai o endereço IP da requisição.
   */
  private extrairIp(req: Request): string | undefined {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      undefined
    );
  }
}
