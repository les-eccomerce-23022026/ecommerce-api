import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { IRepositorioPagamentos, IPagamento } from './IRepositorioPagamentos';
import { FormaPagamento, TipoPagamento } from '../value-objects/FormaPagamento';
import { CartaoCredito } from '../value-objects/CartaoCredito';
import { StatusPagamento } from '../domain/IPagamento';

/**
 * Implementação do repositório de pagamentos para PostgreSQL.
 */
export class RepositorioPagamentosPostgres implements IRepositorioPagamentos {
  private readonly db: IConexaoBanco;

  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  public async cadastrar(dados: IPagamento): Promise<IPagamento> {
    // Obter ID interno da venda
    const vendaQuery = 'SELECT ven_id FROM ecm_venda WHERE ven_uuid = $1';
    const vendaRes = await this.db.executar<{ ven_id: number }>(vendaQuery, [dados.vendaUuid]);
    if (vendaRes.length === 0) throw new Error('Venda não encontrada');
    const venId = vendaRes[0].ven_id;

    // Obter ID do tipo
    const tipoQuery = 'SELECT tpg_id FROM ecm_tipo_pagamento WHERE tpg_descricao = $1';
    const tipoRes = await this.db.executar<{ tpg_id: number }>(tipoQuery, [dados.formaPagamento.getTipo()]);
    if (tipoRes.length === 0) throw new Error('Tipo de pagamento não encontrado');
    const tpgId = tipoRes[0].tpg_id;

    // Obter ID do status
    const statusQuery = 'SELECT stp_id FROM ecm_status_pagamento WHERE stp_descricao = $1';
    const statusRes = await this.db.executar<{ stp_id: number }>(statusQuery, [dados.status]);
    if (statusRes.length === 0) throw new Error('Status de pagamento não encontrado');
    const stpId = statusRes[0].stp_id;

    // Inserir pagamento
    const pagamentoQuery = `
      INSERT INTO ecm_pagamento (ven_id, tpg_id, stp_id, pag_valor, pag_detalhes_cupom, pag_processado_em)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING pag_id, pag_uuid, pag_criado_em
    `;
    const pagamentoValues: DbParametro[] = [
      venId, tpgId, stpId, dados.valor, dados.formaPagamento.getDetalhes(), dados.processadoEm || null
    ];
    const pagamentoRows = await this.db.executar<{
      pag_id: number; pag_uuid: string; pag_criado_em: string;
    }>(pagamentoQuery, pagamentoValues);
    const row = pagamentoRows[0];

    // Inserir cartão se existir
    if (dados.cartao) {
      const cartaoQuery = `
        INSERT INTO ecm_cartao_pagamento (pag_id, crp_numero_tokenizado, crp_nome_titular, crp_validade, crp_bandeira)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await this.db.executar(cartaoQuery, [
        row.pag_id, dados.cartao.getNumeroTokenizado(), dados.cartao.getNomeTitular(),
        dados.cartao.getValidade(), dados.cartao.getBandeira()
      ]);
    }

    return { ...dados, id: row.pag_uuid, criadoEm: new Date(row.pag_criado_em) };
  }

  public async obterPorUuid(uuid: string): Promise<IPagamento | null> {
    const query = `
      SELECT p.pag_uuid, p.pag_valor, p.pag_detalhes_cupom, p.pag_criado_em, p.pag_processado_em,
             tp.tpg_descricao, sp.stp_descricao, v.ven_uuid,
             c.crp_numero_tokenizado, c.crp_nome_titular, c.crp_validade, c.crp_bandeira
      FROM ecm_pagamento p
      JOIN ecm_tipo_pagamento tp ON p.tpg_id = tp.tpg_id
      JOIN ecm_status_pagamento sp ON p.stp_id = sp.stp_id
      JOIN ecm_venda v ON p.ven_id = v.ven_id
      LEFT JOIN ecm_cartao_pagamento c ON p.pag_id = c.pag_id
      WHERE p.pag_uuid = $1
    `;
    const rows = await this.db.executar<{
      pag_uuid: string; pag_valor: number; pag_detalhes_cupom: string | null;
      pag_criado_em: string; pag_processado_em: string | null;
      tpg_descricao: string; stp_descricao: string; ven_uuid: string;
      crp_numero_tokenizado: string | null; crp_nome_titular: string | null;
      crp_validade: string | null; crp_bandeira: string | null;
    }>(query, [uuid]);

    if (rows.length === 0) return null;

    const r = rows[0];
    const formaPagamento = new FormaPagamento(r.tpg_descricao as TipoPagamento, r.pag_detalhes_cupom || undefined);

    let cartao: CartaoCredito | undefined;
    if (r.crp_numero_tokenizado) {
      // Simulação: criar objeto sem validação para leitura
      cartao = Object.create(CartaoCredito.prototype);
      cartao.numeroTokenizado = r.crp_numero_tokenizado;
      cartao.nomeTitular = r.crp_nome_titular;
      cartao.validade = r.crp_validade;
      cartao.bandeira = r.crp_bandeira;
    }

    return {
      id: r.pag_uuid,
      vendaUuid: r.ven_uuid,
      valor: Number(r.pag_valor),
      formaPagamento,
      cartao,
      status: r.stp_descricao as StatusPagamento,
      criadoEm: new Date(r.pag_criado_em),
      processadoEm: r.pag_processado_em ? new Date(r.pag_processado_em) : undefined
    };
  }

  public async atualizar(uuid: string, dados: IPagamento): Promise<IPagamento> {
    const idQuery = 'SELECT pag_id FROM ecm_pagamento WHERE pag_uuid = $1';
    const idRes = await this.db.executar<{ pag_id: number }>(idQuery, [uuid]);
    if (idRes.length === 0) throw new Error('Pagamento não encontrado');
    const pagId = idRes[0].pag_id;

    const statusQuery = 'SELECT stp_id FROM ecm_status_pagamento WHERE stp_descricao = $1';
    const statusRes = await this.db.executar<{ stp_id: number }>(statusQuery, [dados.status]);
    const stpId = statusRes[0].stp_id;

    const updateQuery = 'UPDATE ecm_pagamento SET stp_id = $1, pag_processado_em = $2 WHERE pag_id = $3';
    await this.db.executar(updateQuery, [stpId, dados.processadoEm || null, pagId]);

    return dados;
  }

  public async listarPorVenda(vendaUuid: string): Promise<IPagamento[]> {
    const query = 'SELECT p.pag_uuid FROM ecm_pagamento p JOIN ecm_venda v ON p.ven_id = v.ven_id WHERE v.ven_uuid = $1 ORDER BY p.pag_criado_em DESC';
    const rows = await this.db.executar<{ pag_uuid: string }>(query, [vendaUuid]);

    const pagamentos = await Promise.all(rows.map(r => this.obterPorUuid(r.pag_uuid)));
    return pagamentos.filter(p => p !== null) as IPagamento[];
  }
}
