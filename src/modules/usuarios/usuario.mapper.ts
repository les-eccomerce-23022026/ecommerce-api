import { IUsuario } from '@/modules/usuarios/IUsuario.entity';
import { PAPEL_CLIENTE, PAPEL_ADMIN } from '@/shared/types/papeis';

/** Tipo que representa uma linha bruta retornada pelo banco de dados */
export type LinhaResultadoUsuario = Record<string, unknown>;

export class UsuarioMapper {
  /**
   * Mapeia linha do banco para a entidade IUsuario.
   */
  public static mapearParaEntidade(row: LinhaResultadoUsuario, papeis?: LinhaResultadoUsuario[]): IUsuario {
    const papeisArray = papeis || [];
    const papelPrincipal = papeisArray.length > 0 ? papeisArray[0] : row;
    
    return {
      id: Number(row.id),
      uuid: row.uuid as string,
      nome: row.nome as string,
      email: row.email as string,
      cpf: row.cpf as string | undefined,
      cnpj: row.cnpj as string | undefined,
      tipoPessoa: row.tipoPessoa as 'PF' | 'PJ' | undefined,
      senhaHash: row.senhaHash as string,
      idPapel: Number(row.idPapel),
      role: {
        id: Number(papelPrincipal.id ?? row.idPapel),
        descricao: (papelPrincipal.descricao as string) || (Number(row.idPapel) === PAPEL_ADMIN.id ? PAPEL_ADMIN.descricao : PAPEL_CLIENTE.descricao),
      },
      papeis: papeisArray.map((p) => ({
        id: Number(p.id),
        descricao: p.descricao as string,
      })),
      telefoneRapido: row.telefoneRapido as string | undefined,
      ativo: row.ativo as boolean,
      genero: row.genero as string,
      dataNascimento: row.dataNascimento ? new Date(row.dataNascimento as string) : undefined,
      criadoEm: row.criadoEm ? new Date(row.criadoEm as string) : undefined,
      atualizadoEm: row.atualizadoEm ? new Date(row.atualizadoEm as string) : undefined,
    };
  }
}
