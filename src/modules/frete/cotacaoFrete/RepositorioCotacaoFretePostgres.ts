import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import type { ICotacaoFretePersistida } from '@/modules/frete/IFrete.dto';
import { EstadosCotacaoFrete } from './EstadosCotacaoFrete';
import type { IRepositorioCotacaoFrete, InserirCotacaoLinha } from './IRepositorioCotacaoFrete';
import { CotacaoFreteMapper } from './cotacaoFrete.mapper';
import { COTACAO_FRETE_QUERIES } from './cotacaoFrete.queries';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';

export class RepositorioCotacaoFretePostgres implements IRepositorioCotacaoFrete {
  constructor(private readonly db: IConexaoBanco) {}

  /**
   * Obtém o loj_id do contexto de requisição.
   * Se não houver contexto, retorna undefined (compatibilidade com código legado).
   */
  private obterLojId(): number | undefined {
    return ContextoRequisicao.obterLojId();
  }

  public async inserirLinhas(linhas: InserirCotacaoLinha[]): Promise<{ cfrUuid: string; cfrId: number }[]> {
    const loj_id = this.obterLojId() ?? 1;

    return Promise.all(linhas.map(async (linha) => {
      const vals: DbParametro[] = [
        linha.provedor, linha.estado, linha.cepOrigem, linha.cepDestino, linha.pesoKg,
        linha.valorItens, linha.tipoServico, linha.valor, linha.prazoTexto, linha.expiraEm,
        loj_id,
      ];

      const rows = await this.db.executar<{ cfr_id: number; cfr_uuid: string }>(COTACAO_FRETE_QUERIES.INSERT_BASE, vals);
      const row = rows[0];

      await this.db.executar(COTACAO_FRETE_QUERIES.INSERT_SIMULADA, [
        row.cfr_id, linha.metaSimulada.fatorRegiao, linha.metaSimulada.pesoArredondado,
      ]);

      return { cfrId: row.cfr_id, cfrUuid: row.cfr_uuid };
    }));
  }

  public async obterPorUuid(cfrUuid: string): Promise<ICotacaoFretePersistida | null> {
    const rows = await this.db.executar(COTACAO_FRETE_QUERIES.SELECT_BY_UUID, [cfrUuid]);
    if (rows.length === 0) return null;
    return CotacaoFreteMapper.mapearParaEntidade(rows[0] as Record<string, unknown>);
  }

  public async marcarConsumida(cfrUuid: string, venId: number): Promise<void> {
    await this.db.executar(COTACAO_FRETE_QUERIES.MARCAR_CONSUMIDA, [
      EstadosCotacaoFrete.CONSUMIDA, venId, cfrUuid, EstadosCotacaoFrete.CRIADA,
    ]);
  }

  public async marcarExpiradasCriadasVencidas(): Promise<number> {
    const rows = await this.db.executar<{ cfr_id: number }>(COTACAO_FRETE_QUERIES.MARCAR_EXPIRADAS, [
      EstadosCotacaoFrete.EXPIRADA, EstadosCotacaoFrete.CRIADA,
    ]);
    return rows.length;
  }
}
