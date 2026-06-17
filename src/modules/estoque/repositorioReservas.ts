import type { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';
import {
  IRepositorioReservas,
  ICriarReservaEstoqueDTO,
  IAtualizarReservaEstoqueDTO,
  IReservaEstoque,
  StatusReserva,
} from './IRepositorioReservas';

/**
 * Implementação do Repositório de Reservas de Estoque com PostgreSQL
 * Segue os padrões DDD e multi-tenancy do projeto
 */
export class RepositorioReservasPostgres implements IRepositorioReservas {
  constructor(private readonly db: IConexaoBanco) {}

  /**
   * Obtém o loj_id do contexto de requisição
   * Se não houver contexto, retorna undefined
   */
  private obterLojId(): number | undefined {
    return ContextoRequisicao.obterLojId();
  }

  async criar(dados: ICriarReservaEstoqueDTO): Promise<IReservaEstoque> {
    const sql = `
      INSERT INTO livraria_comercial.reservas_estoque
        (usu_id, liv_id, rse_quantidade, rse_expira_em, loj_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        rse_id AS id,
        rse_uuid AS uuid,
        usu_id AS "usuId",
        liv_id AS "livId",
        rse_quantidade AS quantidade,
        rse_criado_em AS "criadoEm",
        rse_expira_em AS "expiraEm",
        rse_status AS status,
        loj_id AS "lojId"
    `;

    const params: DbParametro[] = [
      dados.usuId,
      dados.livId,
      dados.quantidade,
      dados.expiraEm,
      dados.lojId,
    ];

    const rows = await this.db.executar<IReservaEstoque>(sql, params);

    if (rows.length === 0) {
      throw new Error('Falha ao criar reserva de estoque');
    }

    return rows[0];
  }

  async atualizar(dados: IAtualizarReservaEstoqueDTO): Promise<IReservaEstoque> {
    const campos: string[] = [];
    const valores: DbParametro[] = [];
    let indiceParametro = 1;

    if (dados.quantidade !== undefined) {
      campos.push(`rse_quantidade = $${indiceParametro++}`);
      valores.push(dados.quantidade);
    }

    if (dados.expiraEm !== undefined) {
      campos.push(`rse_expira_em = $${indiceParametro++}`);
      valores.push(dados.expiraEm);
    }

    if (dados.status !== undefined) {
      campos.push(`rse_status = $${indiceParametro++}`);
      valores.push(dados.status);
    }

    if (campos.length === 0) {
      throw new Error('Nenhum campo fornecido para atualização');
    }

    valores.push(dados.uuid);
    const lojId = this.obterLojId();
    if (lojId) {
      valores.push(lojId);
    }

    const sql = `
      UPDATE livraria_comercial.reservas_estoque
      SET ${campos.join(', ')}
      WHERE rse_uuid = $${indiceParametro++}
        ${lojId ? `AND loj_id = $${indiceParametro++}` : ''}
      RETURNING
        rse_id AS id,
        rse_uuid AS uuid,
        usu_id AS "usuId",
        liv_id AS "livId",
        rse_quantidade AS quantidade,
        rse_criado_em AS "criadoEm",
        rse_expira_em AS "expiraEm",
        rse_status AS status,
        loj_id AS "lojId"
    `;

    const rows = await this.db.executar<IReservaEstoque>(sql, valores);

    if (rows.length === 0) {
      throw new Error('Reserva não encontrada ou não pertence à loja');
    }

    return rows[0];
  }

  async cancelar(uuid: string, lojId: number): Promise<void> {
    const sql = `
      UPDATE livraria_comercial.reservas_estoque
      SET rse_status = 'CANCELADA'
      WHERE rse_uuid = $1 AND loj_id = $2 AND rse_status = 'ATIVA'
    `;

    await this.db.executar(sql, [uuid, lojId] as DbParametro[]);
  }

  async buscarReservasAtivas(usuId: number, lojId: number): Promise<IReservaEstoque[]> {
    const sql = `
      SELECT
        rse_id AS id,
        rse_uuid AS uuid,
        usu_id AS "usuId",
        liv_id AS "livId",
        rse_quantidade AS quantidade,
        rse_criado_em AS "criadoEm",
        rse_expira_em AS "expiraEm",
        rse_status AS status,
        loj_id AS "lojId"
      FROM livraria_comercial.reservas_estoque
      WHERE usu_id = $1
        AND loj_id = $2
        AND rse_status = 'ATIVA'
        AND rse_expira_em > NOW()
      ORDER BY rse_criado_em DESC
    `;

    const rows = await this.db.executar<IReservaEstoque>(sql, [usuId, lojId] as DbParametro[]);
    return rows;
  }

  async buscarReservaAtivaPorUsuarioLivro(
    usuId: number,
    livId: number,
    lojId: number
  ): Promise<IReservaEstoque | null> {
    const sql = `
      SELECT
        rse_id AS id,
        rse_uuid AS uuid,
        usu_id AS "usuId",
        liv_id AS "livId",
        rse_quantidade AS quantidade,
        rse_criado_em AS "criadoEm",
        rse_expira_em AS "expiraEm",
        rse_status AS status,
        loj_id AS "lojId"
      FROM livraria_comercial.reservas_estoque
      WHERE usu_id = $1
        AND liv_id = $2
        AND loj_id = $3
        AND rse_status = 'ATIVA'
        AND rse_expira_em > NOW()
      ORDER BY rse_criado_em DESC
      LIMIT 1
    `;

    const rows = await this.db.executar<IReservaEstoque>(sql, [usuId, livId, lojId] as DbParametro[]);
    return rows.length > 0 ? rows[0] : null;
  }

  async buscarReservasPorUsuarioLivro(
    usuId: number,
    livId: number,
    lojId: number
  ): Promise<IReservaEstoque[]> {
    const sql = `
      SELECT
        rse_id AS id,
        rse_uuid AS uuid,
        usu_id AS "usuId",
        liv_id AS "livId",
        rse_quantidade AS quantidade,
        rse_criado_em AS "criadoEm",
        rse_expira_em AS "expiraEm",
        rse_status AS status,
        loj_id AS "lojId"
      FROM livraria_comercial.reservas_estoque
      WHERE usu_id = $1
        AND liv_id = $2
        AND loj_id = $3
      ORDER BY rse_criado_em DESC
    `;

    const rows = await this.db.executar<IReservaEstoque>(sql, [usuId, livId, lojId] as DbParametro[]);
    return rows;
  }

  async buscarReservasExpiradas(lojId: number): Promise<IReservaEstoque[]> {
    const sql = `
      SELECT
        rse_id AS id,
        rse_uuid AS uuid,
        usu_id AS "usuId",
        liv_id AS "livId",
        rse_quantidade AS quantidade,
        rse_criado_em AS "criadoEm",
        rse_expira_em AS "expiraEm",
        rse_status AS status,
        loj_id AS "lojId"
      FROM livraria_comercial.reservas_estoque
      WHERE loj_id = $1
        AND rse_status = 'ATIVA'
        AND rse_expira_em <= NOW()
      ORDER BY rse_expira_em ASC
    `;

    const rows = await this.db.executar<IReservaEstoque>(sql, [lojId] as DbParametro[]);
    return rows;
  }

  async marcarComoExpirada(uuid: string, lojId: number): Promise<void> {
    const sql = `
      UPDATE livraria_comercial.reservas_estoque
      SET rse_status = 'EXPIRADA'
      WHERE rse_uuid = $1 AND loj_id = $2 AND rse_status = 'ATIVA'
    `;

    await this.db.executar(sql, [uuid, lojId] as DbParametro[]);
  }

  async marcarComoConsumida(uuid: string, lojId: number): Promise<void> {
    const sql = `
      UPDATE livraria_comercial.reservas_estoque
      SET rse_status = 'CONSUMIDA'
      WHERE rse_uuid = $1 AND loj_id = $2 AND rse_status = 'ATIVA'
    `;

    await this.db.executar(sql, [uuid, lojId] as DbParametro[]);
  }

  async buscarPorUuid(uuid: string, lojId: number): Promise<IReservaEstoque | null> {
    const sql = `
      SELECT
        rse_id AS id,
        rse_uuid AS uuid,
        usu_id AS "usuId",
        liv_id AS "livId",
        rse_quantidade AS quantidade,
        rse_criado_em AS "criadoEm",
        rse_expira_em AS "expiraEm",
        rse_status AS status,
        loj_id AS "lojId"
      FROM livraria_comercial.reservas_estoque
      WHERE rse_uuid = $1 AND loj_id = $2
    `;

    const rows = await this.db.executar<IReservaEstoque>(sql, [uuid, lojId] as DbParametro[]);
    return rows.length > 0 ? rows[0] : null;
  }

  async buscarPorLivro(livId: number, lojId: number): Promise<IReservaEstoque[]> {
    const sql = `
      SELECT
        rse_id AS id,
        rse_uuid AS uuid,
        usu_id AS "usuId",
        liv_id AS "livId",
        rse_quantidade AS quantidade,
        rse_criado_em AS "criadoEm",
        rse_expira_em AS "expiraEm",
        rse_status AS status,
        loj_id AS "lojId"
      FROM livraria_comercial.reservas_estoque
      WHERE liv_id = $1
        AND loj_id = $2
        AND rse_status = 'ATIVA'
      ORDER BY rse_criado_em DESC
    `;

    const rows = await this.db.executar<IReservaEstoque>(sql, [livId, lojId] as DbParametro[]);
    return rows;
  }
}
