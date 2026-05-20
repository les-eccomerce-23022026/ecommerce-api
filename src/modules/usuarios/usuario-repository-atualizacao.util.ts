import { IUsuario } from '@/modules/usuarios/IUsuario.entity';
import type { DbParametro } from '@/shared/infrastructure/database/IConexaoBanco';

export type ClausulasAtualizacaoUsuario = {
  campos: string[];
  valores: DbParametro[];
};

type EntradaCampo = {
  ativo: (d: Partial<IUsuario>) => boolean;
  coluna: string;
  valor: (d: Partial<IUsuario>) => DbParametro;
};

const CAMPOS_USUARIO_ATUALIZAVEIS: EntradaCampo[] = [
  { ativo: (d) => Boolean(d.nome), coluna: 'usu_nome', valor: (d) => d.nome! },
  { ativo: (d) => Boolean(d.email), coluna: 'usu_email', valor: (d) => d.email! },
  { ativo: (d) => Boolean(d.cpf), coluna: 'usu_cpf', valor: (d) => d.cpf! },
  { ativo: (d) => Boolean(d.telefoneRapido), coluna: 'usu_telefone_rapido', valor: (d) => d.telefoneRapido! },
  { ativo: (d) => Boolean(d.senhaHash), coluna: 'usu_senha_hash', valor: (d) => d.senhaHash! },
  {
    ativo: (d) => Boolean(d.idPapel || d.role?.id),
    coluna: 'pap_id',
    valor: (d) => (d.idPapel ?? d.role?.id) as number,
  },
  { ativo: (d) => d.ativo !== undefined, coluna: 'usu_ativo', valor: (d) => d.ativo! },
  { ativo: (d) => d.isAdminMestre !== undefined, coluna: 'usu_is_admin_mestre', valor: (d) => d.isAdminMestre! },
  { ativo: (d) => Boolean(d.genero), coluna: 'usu_genero', valor: (d) => d.genero! },
  { ativo: (d) => Boolean(d.dataNascimento), coluna: 'usu_data_nascimento', valor: (d) => d.dataNascimento! },
];

/**
 * Monta SET dinâmico para UPDATE de usuários (extrai complexidade de `atualizarUsuario`).
 */
export function montarClausulasAtualizacaoUsuario(dados: Partial<IUsuario>): ClausulasAtualizacaoUsuario {
  const campos: string[] = [];
  const valores: DbParametro[] = [];
  let contador = 1;
  CAMPOS_USUARIO_ATUALIZAVEIS.forEach((entrada) => {
    if (!entrada.ativo(dados)) {
      return;
    }
    campos.push(`${entrada.coluna} = $${contador}`);
    contador += 1;
    valores.push(entrada.valor(dados));
  });
  return { campos, valores };
}
