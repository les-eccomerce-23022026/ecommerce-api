import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';
import { EstadosIntencaoPagamento, type EstadoIntencaoPagamento } from './EstadosIntencaoPagamento';
import type {
  IRepositorioIntencaoPagamento,
  IntencaoPagamentoPersistida
} from './IRepositorioIntencaoPagamento';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';

const PROVEDOR_SIMULADO = 'simulado';

export class RepositorioIntencaoPagamentoPostgres implements IRepositorioIntencaoPagamento {
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

  public async inserirSimulado(dados: {
    inpUuid: string;
    valor: number;
    hashSegredo: string;
    expiraEm: Date;
  }): Promise<void> {
    const loj_id = this.obterLojId() ?? 1;
    
    const insertIntencao = `
      INSERT INTO intencao_pagamento (
        inp_uuid, inp_valor, inp_moeda, inp_provedor, inp_estado, inp_hash_segredo, inp_expira_em, loj_id
      )
      VALUES ($1, $2, 'BRL', $3, $4, $5, $6, $7)
      RETURNING inp_id
    `;
    const valores: DbParametro[] = [
      dados.inpUuid,
      dados.valor,
      PROVEDOR_SIMULADO,
      EstadosIntencaoPagamento.CRIADA,
      dados.hashSegredo,
      dados.expiraEm,
      loj_id
    ];

    const rows = await this.db.executar<{ inp_id: number }>(insertIntencao, valores);
    const inpId = rows[0]?.inp_id;
    if (inpId === undefined) {
      throw new Error('Falha ao persistir intenção de pagamento');
    }
    await this.db.executar(
      'INSERT INTO intencao_pagamento_simulado (inp_id) VALUES ($1)',
      [inpId]
    );
  }

  public async obterPorUuid(inpUuid: string): Promise<IntencaoPagamentoPersistida | null> {
    const loj_id = this.obterLojId();
    
    let q = `
      SELECT i.inp_id, i.inp_uuid, i.inp_valor, i.inp_provedor, i.inp_estado, i.inp_hash_segredo,
             i.inp_criado_em, i.inp_expira_em, i.inp_tentativas_confirmacao, i.ven_id,
             v.ven_uuid AS venda_uuid
      FROM intencao_pagamento i
      LEFT JOIN vendas v ON v.ven_id = i.ven_id
      WHERE i.inp_uuid = $1
    `;
    const parametros: DbParametro[] = [inpUuid];

    // Se multi-tenancy estiver habilitado, filtrar por loj_id na venda
    if (loj_id) {
      q += ` AND (i.loj_id = $2 OR v.loj_id = $2)`;
      parametros.push(loj_id);
    }

    const rows = await this.db.executar<{
      inp_id: number;
      inp_uuid: string;
      inp_valor: string;
      inp_provedor: string;
      inp_estado: EstadoIntencaoPagamento;
      inp_hash_segredo: string;
      inp_criado_em: string;
      inp_expira_em: string;
      inp_tentativas_confirmacao: number;
      ven_id: number | null;
      venda_uuid: string | null;
    }>(q, parametros);
    const r = rows[0];
    if (!r) {
      return null;
    }
    return {
      inpId: r.inp_id,
      inpUuid: r.inp_uuid,
      inpValor: Number(r.inp_valor),
      inpProvedor: r.inp_provedor,
      inpEstado: r.inp_estado,
      inpHashSegredo: r.inp_hash_segredo,
      inpCriadoEm: new Date(r.inp_criado_em),
      inpExpiraEm: new Date(r.inp_expira_em),
      inpTentativasConfirmacao: r.inp_tentativas_confirmacao,
      venId: r.ven_id,
      vendaUuid: r.venda_uuid
    };
  }

  public async vincularVenda(inpUuid: string, venId: number): Promise<boolean> {
    const rows = await this.db.executar<{ inp_id: number }>(
      `UPDATE intencao_pagamento
       SET ven_id = $2
       WHERE inp_uuid = $1
         AND inp_estado = $3
         AND ven_id IS NULL
         AND inp_expira_em > NOW()
       RETURNING inp_id`,
      [inpUuid, venId, EstadosIntencaoPagamento.CRIADA]
    );
    return rows.length > 0;
  }

  public async incrementarTentativas(inpUuid: string): Promise<void> {
    await this.db.executar(
      `UPDATE intencao_pagamento SET inp_tentativas_confirmacao = inp_tentativas_confirmacao + 1 WHERE inp_uuid = $1`,
      [inpUuid]
    );
  }

  public async atualizarEstado(
    inpUuid: string,
    estado: EstadoIntencaoPagamento,
    opcoes: { confirmadoEm?: Date; recusadoEm?: Date }
  ): Promise<void> {
    const confirmado = opcoes.confirmadoEm ?? null;
    const recusado = opcoes.recusadoEm ?? null;
    await this.db.executar(
      `UPDATE intencao_pagamento
       SET inp_estado = $2,
           inp_confirmado_em = COALESCE($3, inp_confirmado_em),
           inp_recusado_em = COALESCE($4, inp_recusado_em)
       WHERE inp_uuid = $1`,
      [inpUuid, estado, confirmado, recusado]
    );
  }

  public async marcarExpiradasCriadasVencidas(): Promise<number> {
    const rows = await this.db.executar<{ inp_id: number }>(
      `UPDATE intencao_pagamento
       SET inp_estado = $1
       WHERE inp_estado = $2 AND inp_expira_em < NOW()
       RETURNING inp_id`,
      [EstadosIntencaoPagamento.EXPIRADA, EstadosIntencaoPagamento.CRIADA]
    );
    return rows.length;
  }
}
