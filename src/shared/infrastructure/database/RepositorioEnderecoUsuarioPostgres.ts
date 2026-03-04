import { IEnderecoUsuario } from '@/shared/types/IEnderecoUsuario';
import { IRepositorioEnderecoUsuario } from '@/shared/types/IRepositorioEnderecoUsuario';
import { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';

export class RepositorioEnderecoUsuarioPostgres implements IRepositorioEnderecoUsuario {
  private db: IConexaoBanco;

  constructor(db: IConexaoBanco) {
    this.db = db;
  }

  private static mapearParaEntidade(row: Record<string, unknown>): IEnderecoUsuario {
    return {
      id: Number(row.id_endereco),
      uuid: row.uuid_endereco as string,
      idUsuario: Number(row.id_usuario),
      tipoEndereco: row.dsc_tipo_endereco as 'cobranca' | 'entrega',
      idTipoResidencia: Number(row.id_tipo_residencia),
      idLogradouro: Number(row.id_logradouro),
      complemento: (row.dsc_complemento as string | null | undefined) || undefined,
      idCidade: Number(row.id_cidade),
      idBairro: Number(row.id_bairro),
      idCep: Number(row.id_cep),
      idPais: Number(row.id_pais),
      principal: row.flg_principal as boolean,
    };
  }

  public async criar(endereco: IEnderecoUsuario): Promise<void> {
    const query = `
      INSERT INTO ecm_endereco_usuario (
        id_usuario, dsc_tipo_endereco, id_tipo_residencia, id_logradouro, dsc_complemento,
        id_cidade, id_bairro, id_cep, id_pais, flg_principal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    await this.db.executar(query, [
      endereco.idUsuario,
      endereco.tipoEndereco,
      endereco.idTipoResidencia,
      endereco.idLogradouro,
      endereco.complemento,
      endereco.idCidade,
      endereco.idBairro,
      endereco.idCep,
      endereco.idPais,
      endereco.principal,
    ]);
  }

  public async buscarPorIdUsuario(idUsuario: number): Promise<IEnderecoUsuario[]> {
    const query = 'SELECT * FROM ecm_endereco_usuario WHERE id_usuario = $1';
    const rows = await this.db.executar(query, [idUsuario]);
    return rows.map((row) => RepositorioEnderecoUsuarioPostgres.mapearParaEntidade(row as Record<string, unknown>));
  }

  public async atualizar(endereco: IEnderecoUsuario): Promise<void> {
    const query = `
      UPDATE ecm_endereco_usuario
      SET dsc_tipo_endereco = $1, id_tipo_residencia = $2, id_logradouro = $3, dsc_complemento = $4,
          id_cidade = $5, id_bairro = $6, id_cep = $7, id_pais = $8, flg_principal = $9
      WHERE id_usuario = $10 AND uuid_endereco = $11
    `;
    await this.db.executar(query, [
      endereco.tipoEndereco,
      endereco.idTipoResidencia,
      endereco.idLogradouro,
      endereco.complemento,
      endereco.idCidade,
      endereco.idBairro,
      endereco.idCep,
      endereco.idPais,
      endereco.principal,
      endereco.idUsuario,
      endereco.uuid,
    ]);
  }

  public async deletar(idUsuario: number, uuidEndereco: string): Promise<void> {
    const query = 'DELETE FROM ecm_endereco_usuario WHERE id_usuario = $1 AND uuid_endereco = $2';
    await this.db.executar(query, [idUsuario, uuidEndereco]);
  }
}
