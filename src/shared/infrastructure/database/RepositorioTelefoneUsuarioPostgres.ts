import { ITelefoneUsuario } from '@/shared/types/ITelefoneUsuario';
import { IRepositorioTelefoneUsuario } from '@/shared/types/IRepositorioTelefoneUsuario';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';

export class RepositorioTelefoneUsuarioPostgres implements IRepositorioTelefoneUsuario {
  private db: IConexaoBanco;

  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  private static mapearParaEntidade(row: Record<string, unknown>): ITelefoneUsuario {
    return {
      id: Number(row.id_telefone),
      uuid: row.uuid_telefone as string,
      idUsuario: Number(row.id_usuario),
      idTipoTelefone: Number(row.id_tipo_telefone),
      ddd: row.num_ddd as string,
      numero: row.num_telefone as string,
      principal: row.flg_principal as boolean,
    };
  }

  public async criar(telefone: ITelefoneUsuario): Promise<void> {
    const query = `
      INSERT INTO ecm_telefone_usuario (id_usuario, id_tipo_telefone, num_ddd, num_telefone, flg_principal)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await this.db.executar(query, [
      telefone.idUsuario,
      telefone.idTipoTelefone,
      telefone.ddd,
      telefone.numero,
      telefone.principal,
    ]);
  }

  public async buscarPorIdUsuario(idUsuario: number): Promise<ITelefoneUsuario[]> {
    const query = 'SELECT * FROM ecm_telefone_usuario WHERE id_usuario = $1';
    const rows = await this.db.executar(query, [idUsuario]);
    return rows.map((row) => RepositorioTelefoneUsuarioPostgres.mapearParaEntidade(row as Record<string, unknown>));
  }

  public async atualizar(telefone: ITelefoneUsuario): Promise<void> {
    const query = `
      UPDATE ecm_telefone_usuario
      SET id_tipo_telefone = $1, num_ddd = $2, num_telefone = $3, flg_principal = $4
      WHERE id_usuario = $5 AND uuid_telefone = $6
    `;
    await this.db.executar(query, [
      telefone.idTipoTelefone,
      telefone.ddd,
      telefone.numero,
      telefone.principal,
      telefone.idUsuario,
      telefone.uuid,
    ]);
  }

  public async deletar(idUsuario: number, uuidTelefone: string): Promise<void> {
    const query = 'DELETE FROM ecm_telefone_usuario WHERE id_usuario = $1 AND uuid_telefone = $2';
    await this.db.executar(query, [idUsuario, uuidTelefone]);
  }
}
