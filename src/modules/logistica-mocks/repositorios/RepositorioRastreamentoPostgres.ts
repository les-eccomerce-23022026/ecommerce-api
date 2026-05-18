import { IRastreamentoInputDto, IRastreamentoOutputDto, IRepositorioRastreamento } from './IRepositorioRastreamento';
import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';

/**
 * Implementação do repositório de rastreamentos para PostgreSQL
 */
export class RepositorioRastreamentoPostgres implements IRepositorioRastreamento {
  private readonly db: IConexaoBanco;

  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  public async cadastrar(dados: IRastreamentoInputDto): Promise<IRastreamentoOutputDto> {
    const query = `
      INSERT INTO rastreamentos (ent_uuid, ras_codigo, ras_transportadora, ras_data_entrega_prevista)
      VALUES ($1, $2, $3, $4)
      RETURNING ras_uuid, ras_data_criacao
    `;
    const valores: DbParametro[] = [
      dados.entUuid,
      dados.codigo,
      dados.transportadora,
      dados.dataEntregaPrevista || null,
    ];

    const rows = await this.db.executar<{ ras_uuid: string; ras_data_criacao: string }>(query, valores);
    const row = rows[0];

    return {
      uuid: row.ras_uuid,
      entUuid: dados.entUuid,
      codigo: dados.codigo,
      transportadora: dados.transportadora,
      dataCriacao: new Date(row.ras_data_criacao),
      dataEntregaPrevista: dados.dataEntregaPrevista,
    };
  }

  public async obterPorUuid(uuid: string): Promise<IRastreamentoOutputDto | null> {
    const query = `
      SELECT ras_uuid, ent_uuid, ras_codigo, ras_transportadora, ras_data_criacao, ras_data_entrega_prevista
      FROM rastreamentos
      WHERE ras_uuid = $1
    `;
    const rows = await this.db.executar<{
      ras_uuid: string;
      ent_uuid: string;
      ras_codigo: string;
      ras_transportadora: string;
      ras_data_criacao: string;
      ras_data_entrega_prevista: string | null;
    }>(query, [uuid]);

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      uuid: r.ras_uuid,
      entUuid: r.ent_uuid,
      codigo: r.ras_codigo,
      transportadora: r.ras_transportadora,
      dataCriacao: new Date(r.ras_data_criacao),
      dataEntregaPrevista: r.ras_data_entrega_prevista ? new Date(r.ras_data_entrega_prevista) : undefined,
    };
  }

  public async obterPorCodigo(codigo: string): Promise<IRastreamentoOutputDto | null> {
    const query = `
      SELECT ras_uuid, ent_uuid, ras_codigo, ras_transportadora, ras_data_criacao, ras_data_entrega_prevista
      FROM rastreamentos
      WHERE ras_codigo = $1
    `;
    const rows = await this.db.executar<{
      ras_uuid: string;
      ent_uuid: string;
      ras_codigo: string;
      ras_transportadora: string;
      ras_data_criacao: string;
      ras_data_entrega_prevista: string | null;
    }>(query, [codigo]);

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      uuid: r.ras_uuid,
      entUuid: r.ent_uuid,
      codigo: r.ras_codigo,
      transportadora: r.ras_transportadora,
      dataCriacao: new Date(r.ras_data_criacao),
      dataEntregaPrevista: r.ras_data_entrega_prevista ? new Date(r.ras_data_entrega_prevista) : undefined,
    };
  }

  public async listarPorEntrega(entUuid: string): Promise<IRastreamentoOutputDto[]> {
    const query = `
      SELECT ras_uuid, ent_uuid, ras_codigo, ras_transportadora, ras_data_criacao, ras_data_entrega_prevista
      FROM rastreamentos
      WHERE ent_uuid = $1
      ORDER BY ras_criado_em DESC
    `;
    const rows = await this.db.executar<{
      ras_uuid: string;
      ent_uuid: string;
      ras_codigo: string;
      ras_transportadora: string;
      ras_data_criacao: string;
      ras_data_entrega_prevista: string | null;
    }>(query, [entUuid]);

    return rows.map((r) => ({
      uuid: r.ras_uuid,
      entUuid: r.ent_uuid,
      codigo: r.ras_codigo,
      transportadora: r.ras_transportadora,
      dataCriacao: new Date(r.ras_data_criacao),
      dataEntregaPrevista: r.ras_data_entrega_prevista ? new Date(r.ras_data_entrega_prevista) : undefined,
    }));
  }

  public async listarEmAndamento(): Promise<IRastreamentoOutputDto[]> {
    const query = `
      SELECT ras_uuid, ent_uuid, ras_codigo, ras_transportadora, ras_data_criacao, ras_data_entrega_prevista
      FROM rastreamentos
      WHERE ras_uuid NOT IN (
        SELECT DISTINCT ras_uuid 
        FROM eventos_rastreamento 
        WHERE ere_codigo IN ('BDE', 'delivered')
      )
      ORDER BY ras_data_criacao ASC
    `;
    const rows = await this.db.executar<{
      ras_uuid: string;
      ent_uuid: string;
      ras_codigo: string;
      ras_transportadora: string;
      ras_data_criacao: string;
      ras_data_entrega_prevista: string | null;
    }>(query);

    return rows.map((r) => ({
      uuid: r.ras_uuid,
      entUuid: r.ent_uuid,
      codigo: r.ras_codigo,
      transportadora: r.ras_transportadora,
      dataCriacao: new Date(r.ras_data_criacao),
      dataEntregaPrevista: r.ras_data_entrega_prevista ? new Date(r.ras_data_entrega_prevista) : undefined,
    }));
  }
}
