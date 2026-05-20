import { IEntregaInputDto, IEntregaOutputDto } from '@/modules/entrega/IEntrega.dto';
import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { IRepositorioEntrega } from './IRepositorioEntrega';
import { IRepositorioRastreamento, IRastreamentoInputDto } from '@/modules/logistica-mocks/repositorios/IRepositorioRastreamento';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';
import { ENTREGA_QUERIES } from '@/modules/entrega/entrega.queries';

/**
 * Implementação do repositório de entregas para PostgreSQL.
 */
export class RepositorioEntregaPostgres implements IRepositorioEntrega {
  private readonly db: IConexaoBanco;
  private readonly repositorioRastreamento: IRepositorioRastreamento;

  constructor(db: IConexaoBanco, repositorioRastreamento: IRepositorioRastreamento) {
    this.db = db;
    this.repositorioRastreamento = repositorioRastreamento;
  }

  /**
   * Obtém o loj_id do contexto de requisição.
   * Se não houver contexto, retorna undefined (compatibilidade com código legado).
   */
  private obterLojId(): number | undefined {
    return ContextoRequisicao.obterLojId();
  }

  public async cadastrar(dados: IEntregaInputDto): Promise<IEntregaOutputDto> {
    // 1. Obter ven_id a partir do vendaUuid
    const resVenda = await this.db.executar<{ ven_id: number }>(ENTREGA_QUERIES.SELECT_VENDA_POR_UUID, [dados.vendaUuid]);
    if (resVenda.length === 0) throw new Error('Venda não encontrada para cadastrar entrega.');
    const venId = resVenda[0].ven_id;

    // 2. Obter tfr_id a partir da descrição do frete
    const resFrete = await this.db.executar<{ tfr_id: number }>(ENTREGA_QUERIES.SELECT_FRETE_POR_DESCRICAO, [dados.tipoFrete]);
    if (resFrete.length === 0) throw new Error(`Tipo de frete '${dados.tipoFrete}' não suportado.`);
    const tfrId = resFrete[0].tfr_id;

    const loj_id = this.obterLojId() ?? 1;

    // 3. Inserir a entrega
    let queryInsert = ENTREGA_QUERIES.INSERT_ENTREGA_BASE;
    let valores: DbParametro[] = [
      venId,
      tfrId,
      JSON.stringify(dados.endereco),
      dados.custo,
      dados.entregador || null,
    ];

    // Incluir loj_id (sempre obrigatório após migration 030)
    queryInsert += ENTREGA_QUERIES.INSERT_ENTREGA_COM_LOJA;
    valores.push(loj_id);

    queryInsert += ENTREGA_QUERIES.INSERT_ENTREGA_VALUES_BASE;
    queryInsert += ENTREGA_QUERIES.INSERT_ENTREGA_VALUES_COM_LOJA;

    queryInsert += ENTREGA_QUERIES.INSERT_ENTREGA_RETORNO;

    const rows = await this.db.executar<{ ent_uuid: string; ent_criado_em: string }>(queryInsert, valores);
    const row = rows[0];

    // 4. Salvar código de rastreamento se fornecido
    let codigoRastreamento: string | undefined;
    if (dados.codigoRastreamento) {
      const transportadora = dados.tipoFrete.startsWith('LOGGI') ? 'Loggi' : 'Correios';
      await this.repositorioRastreamento.cadastrar({
        entUuid: row.ent_uuid,
        codigo: dados.codigoRastreamento,
        transportadora,
      });
      codigoRastreamento = dados.codigoRastreamento;
    }

    return {
      uuid: row.ent_uuid,
      vendaUuid: dados.vendaUuid,
      tipoFrete: dados.tipoFrete,
      endereco: dados.endereco,
      custo: Number(dados.custo),
      entregador: dados.entregador || null,
      criadoEm: new Date(row.ent_criado_em),
      codigoRastreamento,
    };
  }

  public async obterPorUuid(uuid: string): Promise<IEntregaOutputDto | null> {
    const loj_id = this.obterLojId();
    
    let query = ENTREGA_QUERIES.SELECT_ENTREGA_POR_UUID;
    const parametros: DbParametro[] = [uuid];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id na entrega
    if (loj_id) {
      query += ENTREGA_QUERIES.FILTRO_LOJ_ID;
      parametros.push(loj_id);
    }

    const rows = await this.db.executar<{
      ent_uuid: string;
      ent_endereco_json: object;
      ent_custo: number;
      ent_entregador: string | null;
      ent_criado_em: string;
      vendaUuid: string;
      tipoFrete: string;
    }>(query, parametros);

    if (rows.length === 0) return null;
    const r = rows[0];

    // Buscar código de rastreamento
    const rastreamentos = await this.repositorioRastreamento.listarPorEntrega(r.ent_uuid);
    const codigoRastreamento = rastreamentos.length > 0 ? rastreamentos[0].codigo : undefined;

    return {
      uuid: r.ent_uuid,
      vendaUuid: r.vendaUuid,
      tipoFrete: r.tipoFrete,
      endereco: r.ent_endereco_json,
      custo: Number(r.ent_custo),
      entregador: r.ent_entregador,
      criadoEm: new Date(r.ent_criado_em),
      codigoRastreamento,
    };
  }

  public async listarPorVendaUuid(vendaUuid: string): Promise<IEntregaOutputDto[]> {
    const loj_id = this.obterLojId();
    
    let query = ENTREGA_QUERIES.SELECT_ENTREGAS_POR_VENDA_UUID;
    const parametros: DbParametro[] = [vendaUuid];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id na entrega
    if (loj_id) {
      query += ENTREGA_QUERIES.FILTRO_LOJ_ID;
      parametros.push(loj_id);
    }

    query += ENTREGA_QUERIES.ORDER_BY_CRIADO_EM_DESC;

    const rows = await this.db.executar<{
      ent_uuid: string;
      ent_endereco_json: object;
      ent_custo: number;
      ent_entregador: string | null;
      ent_criado_em: string;
      vendaUuid: string;
      tipoFrete: string;
    }>(query, parametros);

    // Buscar códigos de rastreamento para todas as entregas
    const entregasComRastreamento = await Promise.all(
      rows.map(async (r) => {
        const rastreamentos = await this.repositorioRastreamento.listarPorEntrega(r.ent_uuid);
        const codigoRastreamento = rastreamentos.length > 0 ? rastreamentos[0].codigo : undefined;

        return {
          uuid: r.ent_uuid,
          vendaUuid: r.vendaUuid,
          tipoFrete: r.tipoFrete,
          endereco: r.ent_endereco_json,
          custo: Number(r.ent_custo),
          entregador: r.ent_entregador,
          criadoEm: new Date(r.ent_criado_em),
          codigoRastreamento,
        };
      })
    );

    return entregasComRastreamento;
  }

  public async atualizarEndereco(uuid: string, novoEndereco: object): Promise<void> {
    await this.db.executar(ENTREGA_QUERIES.UPDATE_ENDERECO, [JSON.stringify(novoEndereco), uuid]);
  }
}
