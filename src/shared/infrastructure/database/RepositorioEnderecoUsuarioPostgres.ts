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
      id: Number(row.idEndereco),
      uuid: row.uuidEndereco as string,
      idUsuario: Number(row.idUsuario),
      tipoEndereco: row.dscTipoEndereco as 'cobranca' | 'entrega',
      apelido: (row.nomApelido as string | null | undefined) || undefined,
      idTipoResidencia: Number(row.idTipoResidencia),
      idLogradouro: Number(row.idLogradouro),
      complemento: (row.dscComplemento as string | null | undefined) || undefined,
      idCidade: Number(row.idCidade),
      idBairro: Number(row.idBairro),
      idCep: Number(row.idCep),
      idPais: Number(row.idPais),
      principal: row.flgPrincipal as boolean,
    };
  }

  public async criar(endereco: IEnderecoUsuario): Promise<IEnderecoUsuario> {
    const query = `
      INSERT INTO ecm_endereco_usuario (
        id_usuario, dsc_tipo_endereco, nom_apelido, id_tipo_residencia, id_logradouro, dsc_complemento,
        id_cidade, id_bairro, id_cep, id_pais, flg_principal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id_endereco AS "idEndereco", uuid_endereco AS "uuidEndereco", 
                id_usuario AS "idUsuario", dsc_tipo_endereco AS "dscTipoEndereco", 
                nom_apelido AS "nomApelido", id_tipo_residencia AS "idTipoResidencia", 
                id_logradouro AS "idLogradouro", dsc_complemento AS "dscComplemento", 
                id_cidade AS "idCidade", id_bairro AS "idBairro", id_cep AS "idCep", 
                id_pais AS "idPais", flg_principal AS "flgPrincipal"
    `;
    const rows = await this.db.executar(query, [
      endereco.idUsuario,
      endereco.tipoEndereco,
      endereco.apelido,
      endereco.idTipoResidencia,
      endereco.idLogradouro,
      endereco.complemento,
      endereco.idCidade,
      endereco.idBairro,
      endereco.idCep,
      endereco.idPais,
      endereco.principal,
    ]);
    return RepositorioEnderecoUsuarioPostgres.mapearParaEntidade(rows[0] as Record<string, unknown>);
  }

  public async buscarPorIdUsuario(idUsuario: number): Promise<IEnderecoUsuario[]> {
    const query = `
      SELECT id_endereco AS "idEndereco", uuid_endereco AS "uuidEndereco", 
             id_usuario AS "idUsuario", dsc_tipo_endereco AS "dscTipoEndereco", 
             nom_apelido AS "nomApelido", id_tipo_residencia AS "idTipoResidencia", 
             id_logradouro AS "idLogradouro", dsc_complemento AS "dscComplemento", 
             id_cidade AS "idCidade", id_bairro AS "idBairro", id_cep AS "idCep", 
             id_pais AS "idPais", flg_principal AS "flgPrincipal"
      FROM ecm_endereco_usuario 
      WHERE id_usuario = $1
    `;
    const rows = await this.db.executar(query, [idUsuario]);
    return rows.map((row) => RepositorioEnderecoUsuarioPostgres.mapearParaEntidade(row as Record<string, unknown>));
  }

  public async atualizar(endereco: IEnderecoUsuario): Promise<void> {
    const query = `
      UPDATE ecm_endereco_usuario
      SET dsc_tipo_endereco = $1, nom_apelido = $2, id_tipo_residencia = $3, id_logradouro = $4, dsc_complemento = $5,
          id_cidade = $6, id_bairro = $7, id_cep = $8, id_pais = $9, flg_principal = $10
      WHERE id_usuario = $11 AND uuid_endereco = $12
    `;
    await this.db.executar(query, [
      endereco.tipoEndereco,
      endereco.apelido,
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
