import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { IRepositorioVendas, IVenda, IItemVenda } from '@/modules/vendas/repositories/IRepositorioVendas';
/* eslint-disable max-lines */
import { IVendaInputDto } from '@/modules/vendas/dtos/IVenda.dto';
import { STATUS_VENDAS } from '@/modules/vendas/constants/statusVendas.constant';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';
import { VENDAS_QUERIES } from '@/modules/vendas/repositories/vendas.queries';

/**
 * Implementação do repositório de vendas para PostgreSQL.
 */
export class RepositorioVendasPostgres implements IRepositorioVendas {
  private readonly db: IConexaoBanco;

  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  /**
   * Obtém o loj_id do contexto de requisição.
   * Se não houver contexto, retorna undefined (compatibilidade com código legado).
   */
  private obterLojId(): number | undefined {
    return ContextoRequisicao.obterLojId();
  }

  public async cadastrar(dados: IVendaInputDto): Promise<{ venda: IVenda; venId: number }> {
    // 1. Obter ID interno do usuário pelo UUID
    const usuRes = await this.db.executar<{ usu_id: number }>(VENDAS_QUERIES.SELECT_USUARIO_POR_UUID, [dados.usuarioUuid]);

    if (usuRes.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    const usuId = usuRes[0].usu_id;

    // 2. Obter ID do status 'EM PROCESSAMENTO'
    const statusRes = await this.db.executar<{ stv_id: number }>(VENDAS_QUERIES.SELECT_STATUS_POR_DESCRICAO, [STATUS_VENDAS.EM_PROCESSAMENTO]);
    
    if (statusRes.length === 0) {
      throw new Error('Status EM PROCESSAMENTO não encontrado');
    }
    const statusId = statusRes[0].stv_id;

    // 3. Obter loj_id do contexto (ou usar padrão 1 para testes)
    const loj_id = this.obterLojId() ?? 1;

    // 4. Inserir a Venda
    let vendaQuery = VENDAS_QUERIES.INSERT_VENDA_BASE;
    let vendaValues: DbParametro[] = [
      usuId,
      statusId,
      dados.valorTotalItens,
      dados.valorFrete,
      dados.valorTotal,
      dados.cfrId ?? null,
    ];

    // Incluir loj_id (sempre obrigatório após migration 030)
    vendaQuery += VENDAS_QUERIES.INSERT_VENDA_COM_LOJA;
    vendaValues.push(loj_id);

    vendaQuery += VENDAS_QUERIES.INSERT_VENDA_VALUES_BASE;
    vendaQuery += VENDAS_QUERIES.INSERT_VENDA_VALUES_COM_LOJA;

    vendaQuery += VENDAS_QUERIES.INSERT_VENDA_RETORNO;

    const vendaRows = await this.db.executar<{ ven_id: number; ven_uuid: string; ven_criado_em: string }>(vendaQuery, vendaValues);
    const vendaRow = vendaRows[0];

    // 5. Inserir Itens
    const itensPromessas = dados.itens.map(async (item) => {
      let itemQuery = VENDAS_QUERIES.INSERT_ITEM_VENDA_BASE;
      let itemValues: DbParametro[] = [vendaRow.ven_id, item.livroUuid, item.quantidade, item.precoUnitario];

      // Incluir loj_id (sempre obrigatório após migration 030)
      itemQuery += VENDAS_QUERIES.INSERT_ITEM_VENDA_COM_LOJA;
      itemValues.push(loj_id);

      itemQuery += VENDAS_QUERIES.INSERT_ITEM_VENDA_VALUES_BASE;
      itemQuery += VENDAS_QUERIES.INSERT_ITEM_VENDA_VALUES_COM_LOJA;

      itemQuery += VENDAS_QUERIES.INSERT_ITEM_VENDA_RETORNO;

      const itemRows = await this.db.executar<{ itv_uuid: string }>(itemQuery, itemValues);
      return {
        id: itemRows[0].itv_uuid,
        livroUuid: item.livroUuid,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
      } as IItemVenda;
    });

    const itens = await Promise.all(itensPromessas);

    return {
      venda: {
        id: vendaRow.ven_uuid as string,
        usuarioUuid: dados.usuarioUuid,
        status: STATUS_VENDAS.EM_PROCESSAMENTO,
        totalItens: Number(dados.valorTotalItens),
        frete: Number(dados.valorFrete),
        totalVenda: Number(dados.valorTotal),
        itens,
        criadoEm: new Date(vendaRow.ven_criado_em as string),
      },
      venId: vendaRow.ven_id,
    };
  }

  public async obterPorUuid(uuid: string): Promise<IVenda | null> {
    const loj_id = this.obterLojId();
    let query = VENDAS_QUERIES.SELECT_VENDA_POR_UUID;
    
    const parametros: DbParametro[] = [uuid];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id
    if (loj_id) {
      query += VENDAS_QUERIES.FILTRO_LOJ_ID;
      parametros.push(loj_id);
    }

    const rows = await this.db.executar<{
      ven_uuid: string; ven_total_itens: number; ven_frete: number;
      ven_total_venda: number; ven_criado_em: string; ven_data_hora_entrega: string | null;
      status: string; usuarioUuid: string; motivoTroca: string | null;
      id: string | null; livroUuid: string | null; quantidade: number | null;
      precoUnitario: number | null; emTroca: boolean | null;
    }>(query, parametros);

    if (rows.length === 0) return null;

    const v = rows[0];

    // Agrupar itens (se houver múltiplas linhas devido ao LEFT JOIN)
    const itens = rows
      .filter((row) => row.id !== null)
      .map((i) => ({
        id: i.id!,
        livroUuid: i.livroUuid!,
        quantidade: Number(i.quantidade),
        precoUnitario: Number(i.precoUnitario),
        emTroca: i.emTroca!,
      }));

    return {
      id: v.ven_uuid,
      usuarioUuid: v.usuarioUuid,
      status: v.status,
      totalItens: Number(v.ven_total_itens),
      frete: Number(v.ven_frete),
      totalVenda: Number(v.ven_total_venda),
      criadoEm: new Date(v.ven_criado_em),
      dataHoraEntrega: v.ven_data_hora_entrega ? new Date(v.ven_data_hora_entrega) : undefined,
      motivoTroca: v.motivoTroca || undefined,
      itens,
    };
  }

  public async registrarSolicitacaoTroca(vendaUuid: string, motivo: string, itensUuids: string[]): Promise<void> {
    await this.db.executar(VENDAS_QUERIES.UPDATE_SolicitacaoTroca, [motivo, STATUS_VENDAS.EM_TROCA, vendaUuid]);

    if (itensUuids.length > 0) {
      await this.db.executar(VENDAS_QUERIES.UPDATE_ITENS_TROCA, [itensUuids]);
    }
  }

  public async listarPorUsuario(usuarioUuid: string): Promise<IVenda[]> {
    console.log('[RepositorioVendasPostgres.listarPorUsuario] Buscando vendas do usuarioUuid:', usuarioUuid);
    const loj_id = this.obterLojId();
    
    let query = VENDAS_QUERIES.SELECT_VENDAS_POR_USUARIO;
    
    const parametros: DbParametro[] = [usuarioUuid];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id
    if (loj_id) {
      query += VENDAS_QUERIES.FILTRO_LOJ_ID;
      parametros.push(loj_id);
    }

    query += VENDAS_QUERIES.ORDER_BY_CRIADO_EM_DESC;

    const rows = await this.db.executar<{
      ven_uuid: string; ven_total_itens: number; ven_frete: number;
      ven_total_venda: number; ven_criado_em: string; ven_data_hora_entrega: string | null;
      status: string; usuarioUuid: string; motivoTroca: string | null;
      itv_id: string | null; itv_livroUuid: string | null;
      itv_quantidade: number | null; itv_precoUnitario: number | null; itv_emTroca: boolean | null;
    }>(query, parametros);
    console.log('[RepositorioVendasPostgres.listarPorUsuario] Linhas retornadas do BD:', rows.length);

    // Agrupar itens por venda
    const mapaVendas = new Map<string, IVenda>();
    
    rows.forEach((row) => {
      if (!mapaVendas.has(row.ven_uuid)) {
        mapaVendas.set(row.ven_uuid, {
          id: row.ven_uuid,
          usuarioUuid: row.usuarioUuid,
          status: row.status,
          totalItens: Number(row.ven_total_itens),
          frete: Number(row.ven_frete),
          totalVenda: Number(row.ven_total_venda),
          criadoEm: new Date(row.ven_criado_em),
          dataHoraEntrega: row.ven_data_hora_entrega ? new Date(row.ven_data_hora_entrega) : undefined,
          motivoTroca: row.motivoTroca || undefined,
          itens: [],
        });
      }

      // Adicionar item se existir
      if (row.itv_id) {
        const venda = mapaVendas.get(row.ven_uuid)!;
        venda.itens.push({
          id: row.itv_id,
          livroUuid: row.itv_livroUuid!,
          quantidade: Number(row.itv_quantidade),
          precoUnitario: Number(row.itv_precoUnitario),
          emTroca: row.itv_emTroca!,
        });
      }
    });

    return Array.from(mapaVendas.values());
  }

  public async listarTodas(limite = 500): Promise<IVenda[]> {
    const loj_id = this.obterLojId();
    
    let query = VENDAS_QUERIES.SELECT_TODAS_VENDAS;
    
    const parametros: DbParametro[] = [];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id
    if (loj_id) {
      query += VENDAS_QUERIES.WHERE_LOJ_ID;
      parametros.push(loj_id);
    }

    query += VENDAS_QUERIES.ORDER_BY_CRIADO_EM_DESC;
    
    const contador = parametros.length + 1;
    query += ` LIMIT $${contador}`;
    parametros.push(limite);

    const rows = await this.db.executar<{
      ven_uuid: string; ven_total_itens: number; ven_frete: number;
      ven_total_venda: number; ven_criado_em: string; ven_data_hora_entrega: string | null;
      status: string; usuarioUuid: string; motivoTroca: string | null;
      itv_id: string | null; itv_livroUuid: string | null;
      itv_quantidade: number | null; itv_precoUnitario: number | null; itv_emTroca: boolean | null;
    }>(query, parametros);

    // Agrupar itens por venda
    const mapaVendas = new Map<string, IVenda>();
    
    rows.forEach((row) => {
      if (!mapaVendas.has(row.ven_uuid)) {
        mapaVendas.set(row.ven_uuid, {
          id: row.ven_uuid,
          usuarioUuid: row.usuarioUuid,
          status: row.status,
          totalItens: Number(row.ven_total_itens),
          frete: Number(row.ven_frete),
          totalVenda: Number(row.ven_total_venda),
          criadoEm: new Date(row.ven_criado_em),
          dataHoraEntrega: row.ven_data_hora_entrega ? new Date(row.ven_data_hora_entrega) : undefined,
          motivoTroca: row.motivoTroca || undefined,
          itens: [],
        });
      }

      // Adicionar item se existir
      if (row.itv_id) {
        const venda = mapaVendas.get(row.ven_uuid)!;
        venda.itens.push({
          id: row.itv_id,
          livroUuid: row.itv_livroUuid!,
          quantidade: Number(row.itv_quantidade),
          precoUnitario: Number(row.itv_precoUnitario),
          emTroca: row.itv_emTroca!,
        });
      }
    });

    return Array.from(mapaVendas.values());
  }

  public async atualizarStatus(vendaUuid: string, novoStatus: string): Promise<void> {
    const resStatus = await this.db.executar<{ stv_id: number }>(VENDAS_QUERIES.SELECT_STATUS_POR_DESCRICAO, [novoStatus]);

    if (resStatus.length === 0) throw new Error(`Status '${novoStatus}' não encontrado.`);

    const stvId = resStatus[0].stv_id;

    // Registra data/hora de entrega ao confirmar recebimento (RN0043: prazo de 7 dias para troca).
    const queryUpdate =
      novoStatus === STATUS_VENDAS.ENTREGUE
        ? VENDAS_QUERIES.UPDATE_STATUS_ENTREGUE
        : VENDAS_QUERIES.UPDATE_STATUS_PADRAO;

    await this.db.executar(queryUpdate, [stvId, vendaUuid]);
  }

  public async obterEmailUsuarioPorVenda(vendaUuid: string): Promise<string | null> {
    const rows = await this.db.executar<{ email: string }>(VENDAS_QUERIES.SELECT_EMAIL_USUARIO_POR_VENDA, [vendaUuid]);
    return rows.length > 0 ? rows[0].email : null;
  }

  public async contarVendasPorStatusELoja(status: string[]): Promise<Map<number, number>> {
    const query = `
      SELECT v.loj_id, COUNT(*) as contagem
      FROM livraria_comercial.vendas v
      JOIN livraria_comercial.status_venda s ON v.stv_id = s.stv_id
      WHERE s.stv_descricao = ANY($1::text[])
      GROUP BY v.loj_id
    `;
    
    const rows = await this.db.executar<{ loj_id: number; contagem: string }>(query, [status]);
    
    const mapa = new Map<number, number>();
    rows.forEach(row => {
      mapa.set(row.loj_id, parseInt(row.contagem, 10));
    });
    
    return mapa;
  }

  public async obterPrecoVendaPorLivroUuid(livroUuid: string): Promise<number | null> {
    const rows = await this.db.executar<{ preco: number }>(
      VENDAS_QUERIES.SELECT_PRECO_VENDA_POR_LIVRO_UUID,
      [livroUuid],
    );
    if (rows.length === 0) {
      return null;
    }
    return Number(rows[0].preco);
  }
}
