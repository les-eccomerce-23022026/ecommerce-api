import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { IRepositorioEntrega } from './IRepositorioEntrega';
import { IEntregaInputDto, IEntregaOutputDto } from '@/modules/entrega/IEntrega.dto';

/**
 * Implementação do repositório de entregas para PostgreSQL.
 */
export class RepositorioEntregaPostgres implements IRepositorioEntrega {
  private readonly db: IConexaoBanco;

  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  public async cadastrar(dados: IEntregaInputDto): Promise<IEntregaOutputDto> {
    // 1. Obter ven_id a partir do vendaUuid
    const queryVenda = 'SELECT ven_id FROM ecm_venda WHERE ven_uuid = $1';
    const resVenda = await this.db.executar<{ ven_id: number }>(queryVenda, [dados.vendaUuid]);
    if (resVenda.length === 0) throw new Error('Venda não encontrada para cadastrar entrega.');
    const venId = resVenda[0].ven_id;

    // 2. Obter tfr_id a partir da descrição do frete
    const queryFrete = 'SELECT tfr_id FROM tipos_frete WHERE tfr_descricao = $1';
    const resFrete = await this.db.executar<{ tfr_id: number }>(queryFrete, [dados.tipoFrete]);
    if (resFrete.length === 0) throw new Error(`Tipo de frete '${dados.tipoFrete}' não suportado.`);
    const tfrId = resFrete[0].tfr_id;

    // 3. Inserir a entrega
    const queryInsert = `
      INSERT INTO entregas (ven_id, tfr_id, ent_endereco_json, ent_custo, ent_entregador)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ent_uuid, ent_criado_em
    `;
    const valores: DbParametro[] = [
      venId,
      tfrId,
      JSON.stringify(dados.endereco),
      dados.custo,
      dados.entregador || null,
    ];

    const rows = await this.db.executar<{ ent_uuid: string; ent_criado_em: string }>(queryInsert, valores);
    const row = rows[0];

    return {
      uuid: row.ent_uuid,
      vendaUuid: dados.vendaUuid,
      tipoFrete: dados.tipoFrete,
      endereco: dados.endereco,
      custo: Number(dados.custo),
      entregador: dados.entregador || null,
      criadoEm: new Date(row.ent_criado_em),
    };
  }

  public async obterPorUuid(uuid: string): Promise<IEntregaOutputDto | null> {
    const query = `
      SELECT e.ent_uuid, e.ent_endereco_json, e.ent_custo, e.ent_entregador, e.ent_criado_em,
             v.ven_uuid as "vendaUuid", t.tfr_descricao as "tipoFrete"
      FROM entregas e
      JOIN ecm_venda v ON e.ven_id = v.ven_id
      JOIN tipos_frete t ON e.tfr_id = t.tfr_id
      WHERE e.ent_uuid = $1
    `;
    const rows = await this.db.executar<{
      ent_uuid: string;
      ent_endereco_json: object;
      ent_custo: number;
      ent_entregador: string | null;
      ent_criado_em: string;
      vendaUuid: string;
      tipoFrete: string;
    }>(query, [uuid]);

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      uuid: r.ent_uuid,
      vendaUuid: r.vendaUuid,
      tipoFrete: r.tipoFrete,
      endereco: r.ent_endereco_json,
      custo: Number(r.ent_custo),
      entregador: r.ent_entregador,
      criadoEm: new Date(r.ent_criado_em),
    };
  }

  public async listarPorVendaUuid(vendaUuid: string): Promise<IEntregaOutputDto[]> {
    const query = `
      SELECT e.ent_uuid, e.ent_endereco_json, e.ent_custo, e.ent_entregador, e.ent_criado_em,
             v.ven_uuid as "vendaUuid", t.tfr_descricao as "tipoFrete"
      FROM entregas e
      JOIN ecm_venda v ON e.ven_id = v.ven_id
      JOIN tipos_frete t ON e.tfr_id = t.tfr_id
      WHERE v.ven_uuid = $1
      ORDER BY e.ent_criado_em DESC
    `;
    const rows = await this.db.executar<{
      ent_uuid: string;
      ent_endereco_json: object;
      ent_custo: number;
      ent_entregador: string | null;
      ent_criado_em: string;
      vendaUuid: string;
      tipoFrete: string;
    }>(query, [vendaUuid]);

    return rows.map((r) => ({
      uuid: r.ent_uuid,
      vendaUuid: r.vendaUuid,
      tipoFrete: r.tipoFrete,
      endereco: r.ent_endereco_json,
      custo: Number(r.ent_custo),
      entregador: r.ent_entregador,
      criadoEm: new Date(r.ent_criado_em),
    }));
  }
}
