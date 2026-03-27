import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { IRepositorioVendas, IVenda, IItemVenda } from '@/modules/vendas/repositories/IRepositorioVendas';
import { IVendaInputDto } from '@/modules/vendas/dtos/IVenda.dto';

/**
 * Implementação do repositório de vendas para PostgreSQL.
 */
export class RepositorioVendasPostgres implements IRepositorioVendas {
  private readonly db: IConexaoBanco;

  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  public async cadastrar(dados: IVendaInputDto): Promise<IVenda> {
    // 1. Obter ID interno do usuário pelo UUID
    const usuQuery = 'SELECT usu_id FROM usuarios WHERE usu_uuid = $1';
    const usuRes = await this.db.executar<{ usu_id: number }>(usuQuery, [dados.usuarioUuid]);

    if (usuRes.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    const usuId = usuRes[0].usu_id;

    // 2. Obter ID do status 'EM PROCESSAMENTO'
    const statusQuery = "SELECT stv_id FROM status_vendas WHERE stv_descricao = 'EM PROCESSAMENTO'";
    const statusRes = await this.db.executar<{ stv_id: number }>(statusQuery);
    const statusId = statusRes[0].stv_id;

    // 3. Inserir a Venda
    const vendaQuery = `
      INSERT INTO ecm_venda (usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ven_id, ven_uuid, ven_criado_em
    `;
    const vendaValues: DbParametro[] = [usuId, statusId, dados.valorTotalItens, dados.valorFrete, dados.valorTotal];
    const vendaRows = await this.db.executar<{ ven_id: number; ven_uuid: string; ven_criado_em: string }>(vendaQuery, vendaValues);
    const vendaRow = vendaRows[0];

    // 4. Inserir Itens
    const itensPromessas = dados.itens.map(async (item) => {
      const itemQuery = `
        INSERT INTO ecm_item_venda (ven_id, liv_uuid, itv_quantidade, itv_preco_unitario)
        VALUES ($1, $2, $3, $4)
        RETURNING itv_uuid
      `;
      const itemValues: DbParametro[] = [vendaRow.ven_id, item.livroUuid, item.quantidade, item.precoUnitario];
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
      id: vendaRow.ven_uuid as string,
      usuarioUuid: dados.usuarioUuid,
      status: 'EM PROCESSAMENTO',
      totalItens: Number(dados.valorTotalItens),
      frete: Number(dados.valorFrete),
      totalVenda: Number(dados.valorTotal),
      itens,
      criadoEm: new Date(vendaRow.ven_criado_em as string),
    };
  }

  public async obterPorUuid(uuid: string): Promise<IVenda | null> {
    const query = `
      SELECT v.ven_uuid, v.ven_total_itens, v.ven_frete, v.ven_total_venda,
             v.ven_criado_em, s.stv_descricao as status, u.usu_uuid as "usuarioUuid"
      FROM ecm_venda v
      JOIN status_vendas s ON v.stv_id = s.stv_id
      JOIN usuarios u ON v.usu_id = u.usu_id
      WHERE v.ven_uuid = $1
    `;
    const rows = await this.db.executar<{ ven_uuid: string; ven_total_itens: number; ven_frete: number; ven_total_venda: number; ven_criado_em: string; status: string; usuarioUuid: string }>(query, [uuid]);
    if (rows.length === 0) return null;

    const v = rows[0];

    // Buscar itens
    const itensQuery = `
      SELECT itv_uuid as id, liv_uuid as "livroUuid", itv_quantidade as quantidade, itv_preco_unitario as "precoUnitario"
      FROM ecm_item_venda
      WHERE ven_id = (SELECT ven_id FROM ecm_venda WHERE ven_uuid = $1)
    `;
    const itensRows = await this.db.executar<{ id: string; livroUuid: string; quantidade: number; precoUnitario: number }>(itensQuery, [uuid]);

    return {
      id: v.ven_uuid,
      usuarioUuid: v.usuarioUuid,
      status: v.status,
      totalItens: Number(v.ven_total_itens),
      frete: Number(v.ven_frete),
      totalVenda: Number(v.ven_total_venda),
      criadoEm: new Date(v.ven_criado_em),
      itens: itensRows.map((i) => ({
        id: i.id,
        livroUuid: i.livroUuid,
        quantidade: Number(i.quantidade),
        precoUnitario: Number(i.precoUnitario),
      })),
    };
  }

  public async listarPorUsuario(usuarioUuid: string): Promise<IVenda[]> {
    const queryIds = 'SELECT ven_uuid FROM ecm_venda v JOIN usuarios u ON v.usu_id = u.usu_id WHERE u.usu_uuid = $1 ORDER BY v.ven_criado_em DESC';
    const rows = await this.db.executar<{ ven_uuid: string }>(queryIds, [usuarioUuid]);

    const vendas = await Promise.all(rows.map((r) => this.obterPorUuid(r.ven_uuid)));
    return vendas.filter((v) => v !== null) as IVenda[];
  }

  public async atualizarStatus(vendaUuid: string, novoStatus: string): Promise<void> {
    const queryEncontrarStatus = 'SELECT stv_id FROM status_vendas WHERE stv_descricao = $1';
    const resStatus = await this.db.executar<{ stv_id: number }>(queryEncontrarStatus, [novoStatus]);
    
    if (resStatus.length === 0) throw new Error(`Status '${novoStatus}' não encontrado.`);

    const stvId = resStatus[0].stv_id;

    const queryUpdate = 'UPDATE ecm_venda SET stv_id = $1, ven_atualizado_em = NOW() WHERE ven_uuid = $2';
    await this.db.executar(queryUpdate, [stvId, vendaUuid]);
  }
}
