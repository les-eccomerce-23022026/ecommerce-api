import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { IAuditoriaRegistro, IRepositorioAuditoria } from './IRepositorioAuditoria';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';

/**
 * Implementação do repositório de auditoria para PostgreSQL.
 */
export class RepositorioAuditoriaPostgres implements IRepositorioAuditoria {
  private readonly db: IConexaoBanco;

  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  /**
   * Obtém o loj_id do contexto de requisição.
   */
  private obterLojId(): number | undefined {
    return ContextoRequisicao.obterLojId();
  }

  /**
   * Obtém informações do usuário do contexto de requisição.
   */
  private obterUsuarioContexto(): { id?: number; uuid?: string } {
    const usuId = ContextoRequisicao.obterUsuId();
    const usuUuid = ContextoRequisicao.obterUsuUuid();
    return usuId ? { id: usuId, uuid: usuUuid } : {};
  }

  public async registrar(registro: IAuditoriaRegistro): Promise<void> {
    const usuarioContexto = this.obterUsuarioContexto();
    const lojId = registro.lojId ?? this.obterLojId();

    const query = `
      INSERT INTO livraria_gestao.auditoria (
        aud_tipo_acao, aud_entidade, aud_entidade_id,
        aud_usuario_id, aud_usuario_uuid,
        aud_dados_anteriores, aud_dados_novos,
        aud_ip, aud_user_agent, aud_loj_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    const valores: DbParametro[] = [
      registro.tipoAcao,
      registro.entidade,
      registro.entidadeId,
      registro.usuarioId ?? usuarioContexto.id,
      registro.usuarioUuid ?? usuarioContexto.uuid,
      registro.dadosAnteriores ? JSON.stringify(registro.dadosAnteriores) : null,
      registro.dadosNovos ? JSON.stringify(registro.dadosNovos) : null,
      registro.ip,
      registro.userAgent,
      lojId
    ];

    await this.db.executar(query, valores);
  }

  public async listarPorEntidade(
    entidade: string,
    entidadeId: string,
    limite: number = 50
  ): Promise<IAuditoriaRegistro[]> {
    const lojId = this.obterLojId();

    let query = `
      SELECT
        aud_tipo_acao, aud_entidade, aud_entidade_id,
        aud_usuario_id, aud_usuario_uuid,
        aud_dados_anteriores, aud_dados_novos,
        aud_ip, aud_user_agent, aud_criado_em
      FROM livraria_gestao.auditoria
      WHERE aud_entidade = $1 AND aud_entidade_id = $2
    `;

    const params: DbParametro[] = [entidade, entidadeId];

    if (lojId) {
      query += ' AND aud_loj_id = $3';
      params.push(lojId);
    }

    query += ' ORDER BY aud_criado_em DESC LIMIT $' + (params.length + 1);
    params.push(limite);

    const rows = await this.db.executar<{
      aud_tipo_acao: string;
      aud_entidade: string;
      aud_entidade_id: string;
      aud_usuario_id: number | null;
      aud_usuario_uuid: string | null;
      aud_dados_anteriores: string | null;
      aud_dados_novos: string | null;
      aud_ip: string | null;
      aud_user_agent: string | null;
      aud_criado_em: string;
    }>(query, params);

    return rows.map(row => ({
      tipoAcao: row.aud_tipo_acao,
      entidade: row.aud_entidade,
      entidadeId: row.aud_entidade_id,
      usuarioId: row.aud_usuario_id ?? undefined,
      usuarioUuid: row.aud_usuario_uuid ?? undefined,
      dadosAnteriores: row.aud_dados_anteriores ? JSON.parse(row.aud_dados_anteriores) : undefined,
      dadosNovos: row.aud_dados_novos ? JSON.parse(row.aud_dados_novos) : undefined,
      ip: row.aud_ip ?? undefined,
      userAgent: row.aud_user_agent ?? undefined,
    }));
  }

  public async listarPorUsuario(
    usuarioId: number,
    limite: number = 50
  ): Promise<IAuditoriaRegistro[]> {
    const lojId = this.obterLojId();

    let query = `
      SELECT
        aud_tipo_acao, aud_entidade, aud_entidade_id,
        aud_usuario_id, aud_usuario_uuid,
        aud_dados_anteriores, aud_dados_novos,
        aud_ip, aud_user_agent, aud_criado_em
      FROM livraria_gestao.auditoria
      WHERE aud_usuario_id = $1
    `;

    const params: DbParametro[] = [usuarioId];

    if (lojId) {
      query += ' AND aud_loj_id = $2';
      params.push(lojId);
    }

    query += ' ORDER BY aud_criado_em DESC LIMIT $' + (params.length + 1);
    params.push(limite);

    const rows = await this.db.executar<{
      aud_tipo_acao: string;
      aud_entidade: string;
      aud_entidade_id: string;
      aud_usuario_id: number | null;
      aud_usuario_uuid: string | null;
      aud_dados_anteriores: string | null;
      aud_dados_novos: string | null;
      aud_ip: string | null;
      aud_user_agent: string | null;
      aud_criado_em: string;
    }>(query, params);

    return rows.map(row => ({
      tipoAcao: row.aud_tipo_acao,
      entidade: row.aud_entidade,
      entidadeId: row.aud_entidade_id,
      usuarioId: row.aud_usuario_id ?? undefined,
      usuarioUuid: row.aud_usuario_uuid ?? undefined,
      dadosAnteriores: row.aud_dados_anteriores ? JSON.parse(row.aud_dados_anteriores) : undefined,
      dadosNovos: row.aud_dados_novos ? JSON.parse(row.aud_dados_novos) : undefined,
      ip: row.aud_ip ?? undefined,
      userAgent: row.aud_user_agent ?? undefined,
    }));
  }
}
