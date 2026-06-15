import { IParametrosInativacaoLivro } from '@/modules/livros/domain/IParametrosInativacaoLivro';
import { IConexaoBanco, DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';

interface IRowParametros {
  pai_uuid: string;
  pai_valor_minimo_catalogo: string;
  pai_ativo: boolean;
}

export class RepositorioParametrosInativacaoPostgres {
  constructor(private readonly db: IConexaoBanco) {}

  async obterParametrosAtivos(): Promise<IParametrosInativacaoLivro | null> {
    const rows = await this.db.executar<IRowParametros>(
      `SELECT pai_uuid, pai_valor_minimo_catalogo, pai_ativo
       FROM livraria_comercial.parametros_inativacao_livro
       WHERE pai_ativo = TRUE
       ORDER BY pai_id DESC
       LIMIT 1`,
    );

    if (rows.length === 0) return null;

    return this.mapear(rows[0]);
  }

  async atualizarValorMinimo(uuid: string, novoValor: number): Promise<void> {
    const parametros: DbParametro[] = [novoValor, uuid];
    await this.db.executar(
      `UPDATE livraria_comercial.parametros_inativacao_livro
       SET pai_valor_minimo_catalogo = $1, pai_atualizado_em = CURRENT_TIMESTAMP
       WHERE pai_uuid = $2`,
      parametros,
    );
  }

  private mapear(row: IRowParametros): IParametrosInativacaoLivro {
    return {
      uuid: row.pai_uuid,
      valorMinimoCatalogo: parseFloat(row.pai_valor_minimo_catalogo),
      ativo: row.pai_ativo,
    };
  }
}
