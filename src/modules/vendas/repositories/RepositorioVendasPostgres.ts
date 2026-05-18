import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { IRepositorioVendas, IVenda, IItemVenda } from '@/modules/vendas/repositories/IRepositorioVendas';
/* eslint-disable max-lines */
import { IVendaInputDto } from '@/modules/vendas/dtos/IVenda.dto';
import { STATUS_VENDAS } from '@/modules/vendas/constants/statusVendas.constant';

/**
 * Implementação do repositório de vendas para PostgreSQL.
 */
export class RepositorioVendasPostgres implements IRepositorioVendas {
  private readonly db: IConexaoBanco;

  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  public async cadastrar(dados: IVendaInputDto): Promise<{ venda: IVenda; venId: number }> {
    // 1. Obter ID interno do usuário pelo UUID
    const usuQuery = 'SELECT usu_id FROM usuarios WHERE usu_uuid = $1';
    const usuRes = await this.db.executar<{ usu_id: number }>(usuQuery, [dados.usuarioUuid]);

    if (usuRes.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    const usuId = usuRes[0].usu_id;

    // 2. Obter ID do status 'EM PROCESSAMENTO'
    const statusQuery = 'SELECT stv_id FROM status_vendas WHERE stv_descricao = $1';
    const statusRes = await this.db.executar<{ stv_id: number }>(statusQuery, [STATUS_VENDAS.EM_PROCESSAMENTO]);
    
    if (statusRes.length === 0) {
      throw new Error('Status EM PROCESSAMENTO não encontrado');
    }
    const statusId = statusRes[0].stv_id;

    // 3. Inserir a Venda
    const vendaQuery = `
      INSERT INTO vendas (usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda, cfr_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ven_id, ven_uuid, ven_criado_em
    `;
    const vendaValues: DbParametro[] = [
      usuId,
      statusId,
      dados.valorTotalItens,
      dados.valorFrete,
      dados.valorTotal,
      dados.cfrId ?? null,
    ];
    const vendaRows = await this.db.executar<{ ven_id: number; ven_uuid: string; ven_criado_em: string }>(vendaQuery, vendaValues);
    const vendaRow = vendaRows[0];

    // 4. Inserir Itens
    const itensPromessas = dados.itens.map(async (item) => {
      const itemQuery = `
        INSERT INTO itens_venda (ven_id, liv_uuid, itv_quantidade, itv_preco_unitario)
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
    const query = `
      SELECT 
        v.ven_uuid, v.ven_total_itens, v.ven_frete, v.ven_total_venda,
        v.ven_criado_em, v.ven_data_hora_entrega, s.stv_descricao as status,
        u.usu_uuid as "usuarioUuid", v.ven_motivo_troca as "motivoTroca",
        i.itv_uuid as id, i.liv_uuid as "livroUuid", i.itv_quantidade as quantidade,
        i.itv_preco_unitario as "precoUnitario", i.itv_em_troca as "emTroca"
      FROM vendas v
      JOIN status_vendas s ON v.stv_id = s.stv_id
      JOIN usuarios u ON v.usu_id = u.usu_id
      LEFT JOIN itens_venda i ON v.ven_id = i.ven_id
      WHERE v.ven_uuid = $1
    `;
    const rows = await this.db.executar<{
      ven_uuid: string; ven_total_itens: number; ven_frete: number;
      ven_total_venda: number; ven_criado_em: string; ven_data_hora_entrega: string | null;
      status: string; usuarioUuid: string; motivoTroca: string | null;
      id: string | null; livroUuid: string | null; quantidade: number | null;
      precoUnitario: number | null; emTroca: boolean | null;
    }>(query, [uuid]);

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
    const queryUpdateVenda = `
      UPDATE vendas 
      SET ven_motivo_troca = $1, 
          stv_id = (SELECT stv_id FROM status_vendas WHERE stv_descricao = $2),
          ven_atualizado_em = NOW()
      WHERE ven_uuid = $3
    `;
    await this.db.executar(queryUpdateVenda, [motivo, STATUS_VENDAS.EM_TROCA, vendaUuid]);

    if (itensUuids.length > 0) {
      const queryUpdateItens = `
        UPDATE itens_venda
        SET itv_em_troca = TRUE, itv_atualizado_em = NOW()
        WHERE itv_uuid = ANY($1::uuid[])
      `;
      await this.db.executar(queryUpdateItens, [itensUuids]);
    }
  }

  public async listarPorUsuario(usuarioUuid: string): Promise<IVenda[]> {
    console.log('[RepositorioVendasPostgres.listarPorUsuario] Buscando vendas do usuarioUuid:', usuarioUuid);
    const query = `
      SELECT 
        v.ven_uuid, v.ven_total_itens, v.ven_frete, v.ven_total_venda,
        v.ven_criado_em, v.ven_data_hora_entrega, s.stv_descricao as status,
        u.usu_uuid as "usuarioUuid", v.ven_motivo_troca as "motivoTroca",
        i.itv_uuid as "itv_id", i.liv_uuid as "itv_livroUuid", 
        i.itv_quantidade as "itv_quantidade", i.itv_preco_unitario as "itv_precoUnitario",
        i.itv_em_troca as "itv_emTroca"
      FROM vendas v
      JOIN status_vendas s ON v.stv_id = s.stv_id
      JOIN usuarios u ON v.usu_id = u.usu_id
      LEFT JOIN itens_venda i ON v.ven_id = i.ven_id
      WHERE u.usu_uuid = $1
      ORDER BY v.ven_criado_em DESC
    `;
    const rows = await this.db.executar<{
      ven_uuid: string; ven_total_itens: number; ven_frete: number;
      ven_total_venda: number; ven_criado_em: string; ven_data_hora_entrega: string | null;
      status: string; usuarioUuid: string; motivoTroca: string | null;
      itv_id: string | null; itv_livroUuid: string | null;
      itv_quantidade: number | null; itv_precoUnitario: number | null; itv_emTroca: boolean | null;
    }>(query, [usuarioUuid]);
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
    const query = `
      SELECT 
        v.ven_uuid, v.ven_total_itens, v.ven_frete, v.ven_total_venda,
        v.ven_criado_em, v.ven_data_hora_entrega, s.stv_descricao as status,
        u.usu_uuid as "usuarioUuid", v.ven_motivo_troca as "motivoTroca",
        i.itv_uuid as "itv_id", i.liv_uuid as "itv_livroUuid", 
        i.itv_quantidade as "itv_quantidade", i.itv_preco_unitario as "itv_precoUnitario",
        i.itv_em_troca as "itv_emTroca"
      FROM vendas v
      JOIN status_vendas s ON v.stv_id = s.stv_id
      JOIN usuarios u ON v.usu_id = u.usu_id
      LEFT JOIN itens_venda i ON v.ven_id = i.ven_id
      ORDER BY v.ven_criado_em DESC
      LIMIT $1
    `;
    const rows = await this.db.executar<{
      ven_uuid: string; ven_total_itens: number; ven_frete: number;
      ven_total_venda: number; ven_criado_em: string; ven_data_hora_entrega: string | null;
      status: string; usuarioUuid: string; motivoTroca: string | null;
      itv_id: string | null; itv_livroUuid: string | null;
      itv_quantidade: number | null; itv_precoUnitario: number | null; itv_emTroca: boolean | null;
    }>(query, [limite]);

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
    const queryEncontrarStatus = 'SELECT stv_id FROM status_vendas WHERE stv_descricao = $1';
    const resStatus = await this.db.executar<{ stv_id: number }>(queryEncontrarStatus, [novoStatus]);

    if (resStatus.length === 0) throw new Error(`Status '${novoStatus}' não encontrado.`);

    const stvId = resStatus[0].stv_id;

    // Registra data/hora de entrega ao confirmar recebimento (RN0043: prazo de 7 dias para troca).
    const queryUpdate =
      novoStatus === STATUS_VENDAS.ENTREGUE
        ? 'UPDATE vendas SET stv_id = $1, ven_atualizado_em = NOW(), ven_data_hora_entrega = NOW() WHERE ven_uuid = $2'
        : 'UPDATE vendas SET stv_id = $1, ven_atualizado_em = NOW() WHERE ven_uuid = $2';

    await this.db.executar(queryUpdate, [stvId, vendaUuid]);
  }

  public async obterEmailUsuarioPorVenda(vendaUuid: string): Promise<string | null> {
    const query = `
      SELECT u.usu_email as email
      FROM vendas v
      JOIN usuarios u ON v.usu_id = u.usu_id
      WHERE v.ven_uuid = $1
    `;
    const rows = await this.db.executar<{ email: string }>(query, [vendaUuid]);
    return rows.length > 0 ? rows[0].email : null;
  }
}
