import { IAprovacaoPrecoLivro, ICriarAprovacaoPrecoDto, StatusAprovacaoPreco } from '@/modules/livros/domain/IAprovacaoPrecoLivro';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';

interface IRowAprovacao {
  apr_uuid: string;
  liv_uuid: string;
  loj_uuid: string;
  usu_uuid_solicitante: string;
  usu_uuid_aprovador: string | null;
  apr_preco_atual: string;
  apr_preco_solicitado: string;
  apr_margem_grupo: string;
  apr_margem_calculada: string;
  apr_status: StatusAprovacaoPreco;
  apr_justificativa: string | null;
  apr_observacao_aprovador: string | null;
  apr_criado_em: Date;
  apr_atualizado_em: Date;
}

function mapRowToAprovacao(row: IRowAprovacao): IAprovacaoPrecoLivro {
  return {
    uuid: row.apr_uuid,
    livroUuid: row.liv_uuid,
    lojaUuid: row.loj_uuid,
    solicitanteUuid: row.usu_uuid_solicitante,
    aprovadorUuid: row.usu_uuid_aprovador ?? undefined,
    precoAtual: Number(row.apr_preco_atual),
    precoSolicitado: Number(row.apr_preco_solicitado),
    margemGrupo: Number(row.apr_margem_grupo),
    margemCalculada: Number(row.apr_margem_calculada),
    status: row.apr_status,
    justificativa: row.apr_justificativa ?? undefined,
    observacaoAprovador: row.apr_observacao_aprovador ?? undefined,
    criadoEm: row.apr_criado_em,
    atualizadoEm: row.apr_atualizado_em,
  };
}

const SELECT_APROVACAO = `
  SELECT
    a.apr_uuid,
    l.liv_uuid,
    lj.loj_uuid,
    us.usu_uuid AS usu_uuid_solicitante,
    ua.usu_uuid AS usu_uuid_aprovador,
    a.apr_preco_atual,
    a.apr_preco_solicitado,
    a.apr_margem_grupo,
    a.apr_margem_calculada,
    a.apr_status,
    a.apr_justificativa,
    a.apr_observacao_aprovador,
    a.apr_criado_em,
    a.apr_atualizado_em
  FROM livraria_comercial.aprovacoes_preco_livro a
  JOIN livraria_comercial.livros l ON l.liv_id = a.liv_id
  JOIN livraria_gestao.lojas lj ON lj.loj_id = a.loj_id
  JOIN livraria_gestao.usuarios us ON us.usu_id = a.usu_id_solicitante
  LEFT JOIN livraria_gestao.usuarios ua ON ua.usu_id = a.usu_id_aprovador
`;

export class RepositorioAprovacaoPrecoPostgres {
  constructor(private readonly db: IConexaoBanco) {}

  async criar(dados: ICriarAprovacaoPrecoDto): Promise<IAprovacaoPrecoLivro> {
    const [livroRow] = await this.db.executar<{ liv_id: number }>(
      'SELECT liv_id FROM livraria_comercial.livros WHERE liv_uuid = $1',
      [dados.livroUuid],
    );
    if (!livroRow) throw new Error('Livro não encontrado.');

    const [lojaRow] = await this.db.executar<{ loj_id: number }>(
      'SELECT loj_id FROM livraria_gestao.lojas WHERE loj_uuid = $1',
      [dados.lojaUuid],
    );
    if (!lojaRow) throw new Error('Loja não encontrada.');

    const [usuarioRow] = await this.db.executar<{ usu_id: number }>(
      'SELECT usu_id FROM livraria_gestao.usuarios WHERE usu_uuid = $1',
      [dados.solicitanteUuid],
    );
    if (!usuarioRow) throw new Error('Solicitante não encontrado.');

    const [inserted] = await this.db.executar<{ apr_uuid: string }>(
      `INSERT INTO livraria_comercial.aprovacoes_preco_livro
        (liv_id, loj_id, usu_id_solicitante, apr_preco_atual, apr_preco_solicitado, apr_margem_grupo, apr_margem_calculada, apr_justificativa)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING apr_uuid`,
      [
        livroRow.liv_id,
        lojaRow.loj_id,
        usuarioRow.usu_id,
        dados.precoAtual,
        dados.precoSolicitado,
        dados.margemGrupo,
        dados.margemCalculada,
        dados.justificativa,
      ],
    );

    const aprovacao = await this.obterPorUuid(inserted.apr_uuid);
    if (!aprovacao) throw new Error('Erro ao recuperar aprovação criada.');
    return aprovacao;
  }

  async listarPendentes(lojaUuid?: string): Promise<IAprovacaoPrecoLivro[]> {
    if (lojaUuid) {
      const rows = await this.db.executar<IRowAprovacao>(
        `${SELECT_APROVACAO} WHERE a.apr_status = 'PENDENTE' AND lj.loj_uuid = $1 ORDER BY a.apr_criado_em ASC`,
        [lojaUuid],
      );
      return rows.map(mapRowToAprovacao);
    }

    const rows = await this.db.executar<IRowAprovacao>(
      `${SELECT_APROVACAO} WHERE a.apr_status = 'PENDENTE' ORDER BY a.apr_criado_em ASC`,
    );
    return rows.map(mapRowToAprovacao);
  }

  async obterPorUuid(uuid: string): Promise<IAprovacaoPrecoLivro | null> {
    const rows = await this.db.executar<IRowAprovacao>(
      `${SELECT_APROVACAO} WHERE a.apr_uuid = $1`,
      [uuid],
    );
    return rows[0] ? mapRowToAprovacao(rows[0]) : null;
  }

  async aprovar(uuid: string, aprovadorUuid: string, observacao?: string): Promise<IAprovacaoPrecoLivro> {
    try {
      await this.db.iniciarTransacao();

      const rows = await this.db.executar<{ apr_uuid: string }>(
        `UPDATE livraria_comercial.aprovacoes_preco_livro
         SET
           apr_status = 'APROVADO',
           usu_id_aprovador = (SELECT usu_id FROM livraria_gestao.usuarios WHERE usu_uuid = $2),
           apr_observacao_aprovador = $3,
           apr_atualizado_em = NOW()
         WHERE apr_uuid = $1 AND apr_status = 'PENDENTE'
         RETURNING apr_uuid`,
        [uuid, aprovadorUuid, observacao ?? null],
      );

      if (rows.length === 0) {
        await this.db.reverterTransacao();
        throw new Error('Aprovação não encontrada ou já processada.');
      }

      await this.db.confirmarTransacao();
    } catch (err) {
      await this.db.reverterTransacao();
      throw err;
    }

    const aprovacao = await this.obterPorUuid(uuid);
    if (!aprovacao) throw new Error('Erro ao recuperar aprovação após aprovação.');
    return aprovacao;
  }

  async rejeitar(uuid: string, aprovadorUuid: string, observacao: string): Promise<IAprovacaoPrecoLivro> {
    try {
      await this.db.iniciarTransacao();

      const rows = await this.db.executar<{ apr_uuid: string }>(
        `UPDATE livraria_comercial.aprovacoes_preco_livro
         SET
           apr_status = 'REJEITADO',
           usu_id_aprovador = (SELECT usu_id FROM livraria_gestao.usuarios WHERE usu_uuid = $2),
           apr_observacao_aprovador = $3,
           apr_atualizado_em = NOW()
         WHERE apr_uuid = $1 AND apr_status = 'PENDENTE'
         RETURNING apr_uuid`,
        [uuid, aprovadorUuid, observacao],
      );

      if (rows.length === 0) {
        await this.db.reverterTransacao();
        throw new Error('Aprovação não encontrada ou já processada.');
      }

      await this.db.confirmarTransacao();
    } catch (err) {
      await this.db.reverterTransacao();
      throw err;
    }

    const aprovacao = await this.obterPorUuid(uuid);
    if (!aprovacao) throw new Error('Erro ao recuperar aprovação após rejeição.');
    return aprovacao;
  }
}
