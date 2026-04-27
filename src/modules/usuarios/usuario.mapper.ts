import { IUsuario } from '@/modules/usuarios/Iusuario.entity';
import { PAPEL_CLIENTE, PAPEL_ADMIN } from '@/shared/types/papeis';

/** Tipo que representa uma linha bruta retornada pelo banco de dados */
export type LinhaResultadoUsuario = Record<string, unknown>;

export class UsuarioMapper {
  /**
   * Mapeia linha do banco para a entidade IUsuario.
   */
  public static mapearParaEntidade(row: LinhaResultadoUsuario): IUsuario {
    return {
      id: Number(row.id),
      uuid: row.uuid as string,
      nome: row.nome as string,
      email: row.email as string,
      cpf: row.cpf as string,
      senhaHash: row.senhaHash as string,
      idPapel: Number(row.idPapel),
      role: {
        id: Number(row.idPapel),
        descricao: (row.papelDescricao as string) || (Number(row.idPapel) === PAPEL_ADMIN.id ? PAPEL_ADMIN.descricao : PAPEL_CLIENTE.descricao),
      },
      telefoneRapido: row.telefoneRapido as string,
      ativo: row.ativo as boolean,
      isAdminMestre: row.isAdminMestre as boolean,
      genero: row.genero as string,
      dataNascimento: row.dataNascimento ? new Date(row.dataNascimento as string) : undefined,
      criadoEm: row.criadoEm ? new Date(row.criadoEm as string) : undefined,
      atualizadoEm: row.atualizadoEm ? new Date(row.atualizadoEm as string) : undefined,
    };
  }
}
