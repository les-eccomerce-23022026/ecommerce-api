import {
  IEventoRastreamentoInputDto,
  IEventoRastreamentoOutputDto,
  IRepositorioEventoRastreamento,
} from './IRepositorioEventoRastreamento';
import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';

/**
 * Implementação do repositório de eventos de rastreamento para PostgreSQL
 */
export class RepositorioEventoRastreamentoPostgres implements IRepositorioEventoRastreamento {
  private readonly db: IConexaoBanco;

  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  public async cadastrar(dados: IEventoRastreamentoInputDto): Promise<IEventoRastreamentoOutputDto> {
    const query = `
      INSERT INTO eventos_rastreamento (ras_uuid, ere_codigo, ere_descricao, ere_detalhe, ere_data, ere_local, ere_destino)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ere_uuid
    `;
    const valores: DbParametro[] = [
      dados.rasUuid,
      dados.codigo,
      dados.descricao,
      dados.detalhe || null,
      dados.data,
      dados.local || null,
      dados.destino || null,
    ];

    const rows = await this.db.executar<{ ere_uuid: string }>(query, valores);
    const row = rows[0];

    return {
      uuid: row.ere_uuid,
      rasUuid: dados.rasUuid,
      codigo: dados.codigo,
      descricao: dados.descricao,
      detalhe: dados.detalhe,
      data: dados.data,
      local: dados.local,
      destino: dados.destino,
    };
  }

  public async listarPorRastreamento(rasUuid: string): Promise<IEventoRastreamentoOutputDto[]> {
    const query = `
      SELECT ere_uuid, ras_uuid, ere_codigo, ere_descricao, ere_detalhe, ere_data, ere_local, ere_destino
      FROM eventos_rastreamento
      WHERE ras_uuid = $1
      ORDER BY ere_data ASC
    `;
    const rows = await this.db.executar<{
      ere_uuid: string;
      ras_uuid: string;
      ere_codigo: string;
      ere_descricao: string;
      ere_detalhe: string | null;
      ere_data: string;
      ere_local: string | null;
      ere_destino: string | null;
    }>(query, [rasUuid]);

    return rows.map((r) => ({
      uuid: r.ere_uuid,
      rasUuid: r.ras_uuid,
      codigo: r.ere_codigo,
      descricao: r.ere_descricao,
      detalhe: r.ere_detalhe || undefined,
      data: new Date(r.ere_data),
      local: r.ere_local || undefined,
      destino: r.ere_destino || undefined,
    }));
  }

  public async obterMaisRecente(rasUuid: string): Promise<IEventoRastreamentoOutputDto | null> {
    const query = `
      SELECT ere_uuid, ras_uuid, ere_codigo, ere_descricao, ere_detalhe, ere_data, ere_local, ere_destino
      FROM eventos_rastreamento
      WHERE ras_uuid = $1
      ORDER BY ere_data DESC
      LIMIT 1
    `;
    const rows = await this.db.executar<{
      ere_uuid: string;
      ras_uuid: string;
      ere_codigo: string;
      ere_descricao: string;
      ere_detalhe: string | null;
      ere_data: string;
      ere_local: string | null;
      ere_destino: string | null;
    }>(query, [rasUuid]);

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      uuid: r.ere_uuid,
      rasUuid: r.ras_uuid,
      codigo: r.ere_codigo,
      descricao: r.ere_descricao,
      detalhe: r.ere_detalhe || undefined,
      data: new Date(r.ere_data),
      local: r.ere_local || undefined,
      destino: r.ere_destino || undefined,
    };
  }
}
