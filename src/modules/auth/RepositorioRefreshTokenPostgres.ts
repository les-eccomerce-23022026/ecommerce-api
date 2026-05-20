import crypto from 'crypto';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { IRefreshToken, ICriarRefreshTokenDto } from './IRefreshToken.entity';
import { IRepositorioRefreshToken } from './IRepositorioRefreshToken';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';

/**
 * Repositório de Refresh Tokens no PostgreSQL
 */
export class RepositorioRefreshTokenPostgres implements IRepositorioRefreshToken {
  constructor(private readonly db: IConexaoBanco) {}

  /**
   * Gera hash SHA-256 do refresh token
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async criar(dto: ICriarRefreshTokenDto): Promise<IRefreshToken> {
    const loj_id = ContextoRequisicao.obterLojId();
    const tokenHash = this.hashToken(dto.token);

    const query = `
      INSERT INTO livraria_gestao.refresh_tokens (
        usu_id, rft_token_hash, rft_ip_address, rft_user_agent,
        rft_expira_em, loj_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        rft_id as id,
        rft_uuid as uuid,
        usu_id as "usuarioId",
        rft_token_hash as "tokenHash",
        rft_ip_address as "ipAddress",
        rft_user_agent as "userAgent",
        rft_expira_em as "expiraEm",
        rft_revocado_em as "revocadoEm",
        rft_criado_em as "criadoEm",
        loj_id as "lojId"
    `;

    const values = [
      dto.usuarioId,
      tokenHash,
      dto.ipAddress || null,
      dto.userAgent || null,
      dto.expiraEm,
      loj_id,
    ];

    const rows = await this.db.executar(query, values);
    return rows[0] as IRefreshToken;
  }

  async buscarPorHash(tokenHash: string): Promise<IRefreshToken | null> {
    const loj_id = ContextoRequisicao.obterLojId();

    const query = `
      SELECT   
        rft_id as id,
        rft_uuid as uuid,
        usu_id as "usuarioId",
        rft_token_hash as "tokenHash",
        rft_ip_address as "ipAddress",
        rft_user_agent as "userAgent",
        rft_expira_em as "expiraEm",
        rft_revocado_em as "revocadoEm",
        rft_criado_em as "criadoEm",
        loj_id as "lojId"
      FROM l
      WHERE rft_token_hash = $1
        AND loj_id = $2
      LIMIT 1
    `;

    const rows = await this.db.executar(query, [tokenHash, loj_id]);
    return (rows[0] as IRefreshToken) || null;
  }

  async buscarPorUsuario(usuarioId: number): Promise<IRefreshToken[]> {
    const loj_id = ContextoRequisicao.obterLojId();

    const query = `
      SELECT   
        rft_id as id,
        rft_uuid as uuid,
        usu_id as "usuarioId",
        rft_token_hash as "tokenHash",
        rft_ip_address as "ipAddress",
        rft_user_agent as "userAgent",
        rft_expira_em as "expiraEm",
        rft_revocado_em as "revocadoEm",
        rft_criado_em as "criadoEm",
        loj_id as "lojId"
      FROM l
      WHERE usu_id = $1
        AND loj_id = $2
        AND rft_revocado_em IS NULL
        AND rft_expira_em > NOW()
      ORDER BY rft_criado_em DESC
    `;

    const rows = await this.db.executar(query, [usuarioId, loj_id]);
    return rows as IRefreshToken[];
  }

  async revogar(uuid: string): Promise<void> {
    const loj_id = ContextoRequisicao.obterLojId();

    const query = `
      UPDATE livraria_gestao.refresh_tokens
      SET rft_revocado_em = NOW()
      WHERE rft_uuid = $1
        AND loj_id = $2
        AND rft_revocado_em IS NULL
    `;

    await this.db.executar(query, [uuid, loj_id]);
  }

  async revogarTodosDoUsuario(usuarioId: number): Promise<void> {
    const loj_id = ContextoRequisicao.obterLojId();

    const query = `
      UPDATE livraria_gestao.refresh_tokens
      SET rft_revocado_em = NOW()
      WHERE usu_id = $1
        AND loj_id = $2
        AND rft_revocado_em IS NULL
    `;

    await this.db.executar(query, [usuarioId, loj_id]);
  }

  async limparExpirados(): Promise<void> {
    const query = `
      DELETE FROM livraria_gestao.refresh_tokens
      WHERE rft_expira_em < NOW()
        AND rft_revocado_em IS NULL
    `;

    await this.db.executar(query);
  }
}
