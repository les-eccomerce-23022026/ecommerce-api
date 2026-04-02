import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import type { ICotacaoFretePersistida, EstadoCotacaoFrete } from '@/modules/frete/IFrete.dto';
import { EstadosCotacaoFrete } from './EstadosCotacaoFrete';
import type { IRepositorioCotacaoFrete, InserirCotacaoLinha } from './IRepositorioCotacaoFrete';

export class RepositorioCotacaoFretePostgres implements IRepositorioCotacaoFrete {
  constructor(private readonly db: IConexaoBanco) {}

  public async inserirLinhas(linhas: InserirCotacaoLinha[]): Promise<{ cfrUuid: string; cfrId: number }[]> {
    const resultados: { cfrUuid: string; cfrId: number }[] = [];

    for (const linha of linhas) {
      const qInsert = `
        INSERT INTO cotacao_frete (
          cfr_provedor, cfr_estado, cfr_cep_origem, cfr_cep_destino, cfr_peso_kg, cfr_valor_itens,
          cfr_tipo_servico, cfr_valor, cfr_prazo_texto, cfr_expira_em
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING cfr_id, cfr_uuid
      `;
      const vals: DbParametro[] = [
        linha.provedor,
        linha.estado,
        linha.cepOrigem,
        linha.cepDestino,
        linha.pesoKg,
        linha.valorItens,
        linha.tipoServico,
        linha.valor,
        linha.prazoTexto,
        linha.expiraEm,
      ];
      const rows = await this.db.executar<{ cfr_id: number; cfr_uuid: string }>(qInsert, vals);
      const row = rows[0];

      const qExt = `
        INSERT INTO cotacao_frete_simulada (cfr_id, cfs_fator_regiao, cfs_peso_arredondado)
        VALUES ($1, $2, $3)
      `;
      await this.db.executar(qExt, [row.cfr_id, linha.metaSimulada.fatorRegiao, linha.metaSimulada.pesoArredondado]);

      resultados.push({ cfrId: row.cfr_id, cfrUuid: row.cfr_uuid });
    }

    return resultados;
  }

  public async obterPorUuid(cfrUuid: string): Promise<ICotacaoFretePersistida | null> {
    const q = `
      SELECT cfr_id, cfr_uuid, cfr_provedor, cfr_estado, cfr_tipo_servico, cfr_valor, cfr_prazo_texto, cfr_expira_em, ven_id
      FROM cotacao_frete
      WHERE cfr_uuid = $1
    `;
    const rows = await this.db.executar<{
      cfr_id: number;
      cfr_uuid: string;
      cfr_provedor: string;
      cfr_estado: string;
      cfr_tipo_servico: string;
      cfr_valor: string;
      cfr_prazo_texto: string;
      cfr_expira_em: string;
      ven_id: number | null;
    }>(q, [cfrUuid]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      cfrId: r.cfr_id,
      cfrUuid: r.cfr_uuid,
      provedor: r.cfr_provedor,
      estado: r.cfr_estado as EstadoCotacaoFrete,
      tipoServico: r.cfr_tipo_servico as ICotacaoFretePersistida['tipoServico'],
      valor: Number(r.cfr_valor),
      prazoTexto: r.cfr_prazo_texto,
      expiraEm: new Date(r.cfr_expira_em),
      venId: r.ven_id,
    };
  }

  public async marcarConsumida(cfrUuid: string, venId: number): Promise<void> {
    const q = `
      UPDATE cotacao_frete
      SET cfr_estado = $1, ven_id = $2
      WHERE cfr_uuid = $3 AND cfr_estado = $4
    `;
    await this.db.executar(q, [
      EstadosCotacaoFrete.CONSUMIDA,
      venId,
      cfrUuid,
      EstadosCotacaoFrete.CRIADA,
    ]);
  }

  public async marcarExpiradasCriadasVencidas(): Promise<number> {
    const q = `
      UPDATE cotacao_frete
      SET cfr_estado = $1
      WHERE cfr_estado = $2 AND cfr_expira_em < NOW()
      RETURNING cfr_id
    `;
    const rows = await this.db.executar<{ cfr_id: number }>(q, [
      EstadosCotacaoFrete.EXPIRADA,
      EstadosCotacaoFrete.CRIADA,
    ]);
    return rows.length;
  }
}
