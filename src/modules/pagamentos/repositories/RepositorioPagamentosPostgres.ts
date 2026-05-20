import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { IRepositorioPagamentos, IPagamento } from './IRepositorioPagamentos';
import { FormaPagamento, TipoPagamento } from '../entities/FormaPagamento';
/* eslint-disable max-lines */
import { CartaoCredito } from '../entities/CartaoCredito';
import { StatusPagamento } from '../entities/IPagamento';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';

/**
 * Implementação do repositório de pagamentos para PostgreSQL.
 */
export class RepositorioPagamentosPostgres implements IRepositorioPagamentos {
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

  public async obterVenIdPorVendaUuid(vendaUuid: string): Promise<number | null> {
    const rows = await this.db.executar<{ ven_id: number }>(
      'SELECT ven_id FROM vendas WHERE ven_uuid = $1',
      [vendaUuid]
    );
    return rows[0]?.ven_id ?? null;
  }

  public async obterPagIdInternoPorUuid(pagUuid: string): Promise<number | null> {
    const rows = await this.db.executar<{ pag_id: number }>(
      'SELECT pag_id FROM pagamento WHERE pag_uuid = $1',
      [pagUuid]
    );
    return rows[0]?.pag_id ?? null;
  }

  public async cadastrar(dados: IPagamento, opcoes?: { inpIdIntencao?: number }): Promise<IPagamento> {
    // Obter ID interno da venda
    const vendaQuery = 'SELECT ven_id FROM vendas WHERE ven_uuid = $1';
    const vendaRes = await this.db.executar<{ ven_id: number }>(vendaQuery, [dados.vendaUuid]);
    if (vendaRes.length === 0) throw new Error('Venda não encontrada');
    const venId = vendaRes[0].ven_id;

    // Obter ID do tipo
    const tipoQuery = 'SELECT tpg_id FROM tipo_pagamento WHERE tpg_descricao = $1';
    const tipoRes = await this.db.executar<{ tpg_id: number }>(tipoQuery, [dados.formaPagamento.getTipo()]);
    if (tipoRes.length === 0) throw new Error('Tipo de pagamento não encontrado');
    const tpgId = tipoRes[0].tpg_id;

    // Obter ID do status
    const statusQuery = 'SELECT stp_id FROM status_pagamento WHERE stp_descricao = $1';
    const statusRes = await this.db.executar<{ stp_id: number }>(statusQuery, [dados.status]);
    if (statusRes.length === 0) throw new Error('Status de pagamento não encontrado');
    const stpId = statusRes[0].stp_id;

    const inpId = opcoes?.inpIdIntencao;
    const loj_id = this.obterLojId() ?? 1;

    // Inserir pagamento
    const pagamentoQuery = `
      INSERT INTO pagamento (ven_id, tpg_id, stp_id, pag_valor, pag_detalhes_cupom, pag_processado_em, inp_id, loj_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING pag_id, pag_uuid, pag_criado_em
    `;
    const pagamentoValues: DbParametro[] = [
      venId, tpgId, stpId, dados.valor, dados.formaPagamento.getDetalhes(), dados.processadoEm || null, inpId ?? null, loj_id
    ];

    const pagamentoRows = await this.db.executar<{
      pag_id: number; pag_uuid: string; pag_criado_em: string;
    }>(pagamentoQuery, pagamentoValues);
    const row = pagamentoRows[0];

    // Inserir cartão se existir
    if (dados.cartao) {
      const cartaoQuery = `
        INSERT INTO cartao_pagamento (pag_id, cpp_numero_tokenizado, cpp_nome_titular, cpp_validade, cpp_bandeira, loj_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await this.db.executar(cartaoQuery, [
        row.pag_id, dados.cartao.getNumeroTokenizado(), dados.cartao.getNomeTitular(),
        dados.cartao.getValidade(), dados.cartao.getBandeira(), loj_id
      ]);
    }

    return { ...dados, id: row.pag_uuid, criadoEm: new Date(row.pag_criado_em) };
  }

  public async obterPorUuid(uuid: string): Promise<IPagamento | null> {
    const loj_id = this.obterLojId();
    
    let query = `
      SELECT p.pag_uuid, p.pag_valor, p.pag_detalhes_cupom, p.pag_criado_em, p.pag_processado_em,
             tp.tpg_descricao, sp.stp_descricao, v.ven_uuid,
             c.cpp_numero_tokenizado, c.cpp_nome_titular, c.cpp_validade, c.cpp_bandeira
      FROM pagamento p
      JOIN tipo_pagamento tp ON p.tpg_id = tp.tpg_id
      JOIN status_pagamento sp ON p.stp_id = sp.stp_id
      JOIN vendas v ON p.ven_id = v.ven_id
      LEFT JOIN cartao_pagamento c ON p.pag_id = c.pag_id
      WHERE p.pag_uuid = $1
    `;
    const parametros: DbParametro[] = [uuid];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id na venda
    if (loj_id) {
      query += ` AND v.loj_id = $2`;
      parametros.push(loj_id);
    }

    const rows = await this.db.executar<{
      pag_uuid: string; pag_valor: number; pag_detalhes_cupom: string | null;
      pag_criado_em: string; pag_processado_em: string | null;
      tpg_descricao: string; stp_descricao: string; ven_uuid: string;
      cpp_numero_tokenizado: string | null; cpp_nome_titular: string | null;
      cpp_validade: string | null; cpp_bandeira: string | null;
    }>(query, parametros);

    if (rows.length === 0) return null;

    const r = rows[0];
    const formaPagamento = new FormaPagamento(r.tpg_descricao as TipoPagamento, r.pag_detalhes_cupom || undefined);

    let cartao: CartaoCredito | undefined;
    if (r.cpp_numero_tokenizado) {
      cartao = CartaoCredito.reconstituir(
        r.cpp_numero_tokenizado,
        r.cpp_nome_titular ?? '',
        r.cpp_validade ?? '',
        r.cpp_bandeira ?? ''
      );
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
    const idQuery = 'SELECT pag_id FROM pagamento WHERE pag_uuid = $1';
    const idRes = await this.db.executar<{ pag_id: number }>(idQuery, [uuid]);
    if (idRes.length === 0) throw new Error('Pagamento não encontrado');
    const pagId = idRes[0].pag_id;

    const statusQuery = 'SELECT stp_id FROM status_pagamento WHERE stp_descricao = $1';
    const statusRes = await this.db.executar<{ stp_id: number }>(statusQuery, [dados.status]);
    const stpId = statusRes[0].stp_id;

    const updateQuery = 'UPDATE pagamento SET stp_id = $1, pag_processado_em = $2 WHERE pag_id = $3';
    await this.db.executar(updateQuery, [stpId, dados.processadoEm || null, pagId]);

    return dados;
  }

  public async listarPorVenda(vendaUuid: string): Promise<IPagamento[]> {
    const loj_id = this.obterLojId();
    
    let query = `
      SELECT 
        p.pag_uuid, p.pag_valor, p.pag_detalhes_cupom, p.pag_criado_em, p.pag_processado_em,
        tp.tpg_descricao, sp.stp_descricao, v.ven_uuid,
        c.cpp_numero_tokenizado, c.cpp_nome_titular, c.cpp_validade, c.cpp_bandeira
      FROM pagamento p
      JOIN tipo_pagamento tp ON p.tpg_id = tp.tpg_id
      JOIN status_pagamento sp ON p.stp_id = sp.stp_id
      JOIN vendas v ON p.ven_id = v.ven_id
      LEFT JOIN cartao_pagamento c ON p.pag_id = c.pag_id
      WHERE v.ven_uuid = $1
    `;
    const parametros: DbParametro[] = [vendaUuid];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id na venda
    if (loj_id) {
      query += ` AND v.loj_id = $2`;
      parametros.push(loj_id);
    }

    query += ` ORDER BY p.pag_criado_em ASC`;

    const rows = await this.db.executar<{
      pag_uuid: string; pag_valor: number; pag_detalhes_cupom: string | null;
      pag_criado_em: string; pag_processado_em: string | null;
      tpg_descricao: string; stp_descricao: string; ven_uuid: string;
      cpp_numero_tokenizado: string | null; cpp_nome_titular: string | null;
      cpp_validade: string | null; cpp_bandeira: string | null;
    }>(query, parametros);

    return rows.map((r) => {
      const formaPagamento = new FormaPagamento(r.tpg_descricao as TipoPagamento, r.pag_detalhes_cupom || undefined);

      let cartao: CartaoCredito | undefined;
      if (r.cpp_numero_tokenizado) {
        cartao = CartaoCredito.reconstituir(
          r.cpp_numero_tokenizado,
          r.cpp_nome_titular ?? '',
          r.cpp_validade ?? '',
          r.cpp_bandeira ?? ''
        );
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
    });
  }

  public async inserirPixSimulado(
    pagId: number,
    dados: {
      copiaCola: string;
      qrBase64: string | null;
      expiraEm: Date;
      segredoConfirmacao: string;
    }
  ): Promise<void> {
    const q = `
      INSERT INTO livraria_financeiro.pagamento_pix_simulado (
        pag_id, pps_codigo_copia_cola, pps_codigo_qr, pps_expiracao_em, pps_segredo_confirmacao
      )
      VALUES ($1, $2, $3, $4, $5)
    `;
    await this.db.executar(q, [
      pagId,
      dados.copiaCola,
      dados.qrBase64,
      dados.expiraEm,
      dados.segredoConfirmacao
    ]);
  }

  public async obterPixSimuladoPorPagUuid(pagUuid: string): Promise<{
    copiaCola: string;
    qrBase64: string | null;
    expiraEm: Date;
    segredoConfirmacao: string;
  } | null> {
    const query = `
      SELECT pps.pps_codigo_copia_cola, pps.pps_codigo_qr, pps.pps_expiracao_em, pps.pps_segredo_confirmacao
      FROM livraria_financeiro.pagamento_pix_simulado pps
      JOIN livraria_financeiro.pagamento p ON pps.pag_id = p.pag_id
      WHERE p.pag_uuid = $1
    `;
    const rows = await this.db.executar<{
      pps_codigo_copia_cola: string;
      pps_codigo_qr: string | null;
      pps_expiracao_em: string;
      pps_segredo_confirmacao: string;
    }>(query, [pagUuid]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      copiaCola: r.pps_codigo_copia_cola,
      qrBase64: r.pps_codigo_qr,
      expiraEm: new Date(r.pps_expiracao_em),
      segredoConfirmacao: r.pps_segredo_confirmacao
    };
  }

  public async obterCupomTrocaPorCodigo(codigo: string): Promise<{
    id: number;
    codigo: string;
    valorAtual: number;
    usuarioId: number;
    ativo: boolean;
  } | null> {
    const query = `
      SELECT c.cpt_id AS id,
             c.cpt_codigo AS codigo,
             c.cpt_valor AS "valorAtual",
             cl.usu_id AS "usuarioId",
             (c.cpt_status = 'DISPONIVEL') AS ativo
      FROM livraria_comercial.cupons_troca c
      JOIN livraria_gestao.clientes cl ON cl.cli_id = c.cpt_cliente_id
      WHERE c.cpt_codigo = $1
    `;
    const rows = await this.db.executar<{ id: number; codigo: string; valorAtual: number; usuarioId: number; ativo: boolean }>(query, [codigo]);
    return rows[0] ?? null;
  }

  public async atualizarSaldoCupomTroca(id: number, novoSaldo: number): Promise<void> {
    const query = `
      UPDATE livraria_comercial.cupons_troca
      SET cpt_valor = $1::NUMERIC,
          cpt_status = CASE WHEN $1::NUMERIC > 0 THEN 'DISPONIVEL' ELSE 'UTILIZADO' END
      WHERE cpt_id = $2::BIGINT
    `;
    await this.db.executar(query, [novoSaldo, id]);
  }

  public async criarCupomTroca(dados: {
    usuarioId: number;
    codigo: string;
    valor: number;
  }): Promise<string> {
    const query = `
      INSERT INTO livraria_comercial.cupons_troca (cpt_cliente_id, cpt_codigo, cpt_valor, cpt_valido_ate, cpt_status)
      SELECT c.cli_id, $2, $3, CURRENT_DATE + INTERVAL '365 days', 'DISPONIVEL'
      FROM livraria_gestao.clientes c
      WHERE c.usu_id = $1
      RETURNING cpt_uuid
    `;
    const rows = await this.db.executar<{ cpt_uuid: string }>(query, [dados.usuarioId, dados.codigo, dados.valor]);
    return rows[0].cpt_uuid;
  }

  public async listarCuponsTrocaPorUsuario(usuarioId: number): Promise<Array<{
    uuid: string;
    codigo: string;
    valorAtual: number;
    ativo: boolean;
  }>> {
    const query = `
      SELECT c.cpt_uuid AS uuid,
             c.cpt_codigo AS codigo,
             c.cpt_valor AS "valorAtual",
             (c.cpt_status = 'DISPONIVEL') AS ativo
      FROM livraria_comercial.cupons_troca c
      JOIN livraria_gestao.clientes cl ON cl.cli_id = c.cpt_cliente_id
      WHERE cl.usu_id = $1
    `;
    const rows = await this.db.executar<{
      uuid: string;
      codigo: string;
      valorAtual: number;
      ativo: boolean;
    }>(query, [usuarioId]);
    return rows.map((r) => ({
      uuid: r.uuid,
      codigo: r.codigo,
      valorAtual: Number(r.valorAtual),
      ativo: r.ativo,
    }));
  }

  public async obterUsuarioIdInternoPorUuid(usuarioUuid: string): Promise<number | null> {
    const rows = await this.db.executar<{ usu_id: number }>(
      'SELECT usu_id FROM usuarios WHERE usu_uuid = $1',
      [usuarioUuid],
    );
    return rows[0]?.usu_id ?? null;
  }
}
