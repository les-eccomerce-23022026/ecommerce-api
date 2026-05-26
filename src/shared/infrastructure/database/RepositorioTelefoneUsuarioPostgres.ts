import { ITelefoneUsuario } from '@/shared/types/ITelefoneUsuario';
import { IRepositorioTelefoneUsuario } from '@/shared/types/IRepositorioTelefoneUsuario';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { IRowTelefoneUsuario } from '@/shared/types/db-rows.types';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';

export class RepositorioTelefoneUsuarioPostgres implements IRepositorioTelefoneUsuario {
  private db: IConexaoBanco;

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

  private static mapearParaEntidade(row: IRowTelefoneUsuario): ITelefoneUsuario {
    return {
      id: Number(row.id),
      uuid: row.uuid as string,
      idUsuario: Number(row.idUsuario),
      idTipoTelefone: Number(row.idTipoTelefone),
      numero: row.numero as string,
      principal: row.principal as boolean,
      criadoEm: row.criadoEm ? new Date(row.criadoEm as string) : undefined,
      atualizadoEm: row.atualizadoEm ? new Date(row.atualizadoEm as string) : undefined,
    };
  }

  public async criar(telefone: ITelefoneUsuario): Promise<void> {
    const query = `
      INSERT INTO telefones (usu_id, ttp_id, tel_numero, tel_principal)
      VALUES ($1, $2, $3, $4)
    `;
    const valores: any[] = [
      telefone.idUsuario,
      telefone.idTipoTelefone,
      telefone.numero,
      telefone.principal,
    ];

    await this.db.executar(query, valores);
  }

  public async buscarPorIdUsuario(idUsuario: number): Promise<ITelefoneUsuario[]> {
    const query = `
      SELECT tel_id AS "id", tel_uuid AS "uuid",
             usu_id AS "idUsuario", ttp_id AS "idTipoTelefone",
             tel_numero AS "numero", tel_principal AS "principal",
             tel_criado_em AS "criadoEm", tel_atualizado_em AS "atualizadoEm"
      FROM telefones
      WHERE usu_id = $1
    `;
    const parametros: any[] = [idUsuario];

    const rows = await this.db.executar(query, parametros);
    return rows.map((row) => RepositorioTelefoneUsuarioPostgres.mapearParaEntidade(row as IRowTelefoneUsuario));
  }

  public async atualizar(telefone: ITelefoneUsuario): Promise<void> {
    const query = `
      UPDATE telefones
      SET ttp_id = $1, tel_numero = $2, tel_principal = $3
      WHERE usu_id = $4 AND tel_uuid = $5
    `;
    const parametros: any[] = [
      telefone.idTipoTelefone,
      telefone.numero,
      telefone.principal,
      telefone.idUsuario,
      telefone.uuid,
    ];

    await this.db.executar(query, parametros);
  }

  public async deletar(idUsuario: number, uuidTelefone: string): Promise<void> {
    const query = `DELETE FROM telefones WHERE usu_id = $1 AND tel_uuid = $2`;
    const parametros: any[] = [idUsuario, uuidTelefone];

    await this.db.executar(query, parametros);
  }
}
