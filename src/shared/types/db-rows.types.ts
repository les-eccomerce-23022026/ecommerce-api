/**
 * Tipos de linhas de banco de dados para consultas internas.
 * Esses tipos substituem o uso de Record<string, unknown> para maior segurança de tipos.
 */

/** Row de resultado para busca de ID em tabelas simples */
export interface IRowIdSimples {
  tre_id?: string | number;
  tlo_id?: string | number;
  /** ID de estado (tabela `estados`) */
  est_id?: string | number;
  /** ID de estoque (tabela `estoques`) */
  etq_id?: string | number;
  cid_id?: string | number;
  bai_id?: string | number;
  cep_id?: string | number;
  pai_id?: string | number;
  log_id?: string | number;
  [key: string]: string | number | undefined;
}

/** Row de resultado para cidade com estado */
export interface IRowCidadeEstado {
  dscCidade?: string;
  dscEstado?: string;
}

/** Row de resultado para bairro */
export interface IRowBairro {
  dscBairro?: string;
}

/** Row de resultado para CEP */
export interface IRowCep {
  numCep?: string;
}

/** Row de resultado para país */
export interface IRowPais {
  dscPais?: string;
}

/** Row de resultado para tipo de residência */
export interface IRowTipoResidencia {
  dscTipoResidencia?: string;
}

/** Row de resultado para logradouro com tipo */
export interface IRowLogradouroTipo {
  dscLogradouro?: string;
  tipoLogradouro?: string;
}

/** Row de resultado para usuário com papel */
export interface IRowUsuarioPapel {
  id?: string | number;
  uuid?: string;
  nome?: string;
  email?: string;
  cpf?: string;
  telefoneRapido?: string;
  senhaHash?: string;
  idPapel?: string | number;
  role?: string;
  ativo?: boolean | string;
  genero?: string;
  dataNascimento?: string | Date;
  criadoEm?: string | Date;
  atualizadoEm?: string | Date;
}

/** Row de resultado para perfil de cliente */
export interface IRowPerfilCliente {
  id?: string | number;
  uuid?: string;
  idUsuario?: string | number;
  genero?: string;
  dataNascimento?: string | Date;
  ranking?: string | number;
  criadoEm?: string | Date;
  atualizadoEm?: string | Date;
}

/** Row de resultado para telefone de usuário */
export interface IRowTelefoneUsuario {
  id?: string | number;
  uuid?: string;
  idUsuario?: string | number;
  idTipoTelefone?: string | number;
  ddd?: string;
  numero?: string;
  principal?: boolean | string;
  criadoEm?: string | Date;
  atualizadoEm?: string | Date;
}

/** Row de resultado para endereço de usuário */
export interface IRowEnderecoUsuario {
  id?: string | number;
  uuid?: string;
  idUsuario?: string | number;
  tipo?: string;
  apelido?: string;
  idTipoResidencia?: string | number;
  idLogradouro?: string | number;
  numero?: string;
  complemento?: string;
  idCidade?: string | number;
  idBairro?: string | number;
  idCep?: string | number;
  idPais?: string | number;
  principal?: boolean | string;
  criadoEm?: string | Date;
  atualizadoEm?: string | Date;
}

/** Row de resultado para cartão de usuário */
export interface IRowCartaoUsuario {
  id?: string | number;
  uuid?: string;
  idUsuario?: string | number;
  ultimosDigitosCartao?: string;
  nomeImpresso?: string;
  bandeira?: string;
  validade?: string | Date;
  principal?: boolean | string;
  criadoEm?: string | Date;
  atualizadoEm?: string | Date;
}

/** União de todos os tipos de rows */
export type DbRow =
  | IRowIdSimples
  | IRowCidadeEstado
  | IRowBairro
  | IRowCep
  | IRowPais
  | IRowTipoResidencia
  | IRowLogradouroTipo
  | IRowUsuarioPapel
  | IRowPerfilCliente
  | IRowTelefoneUsuario
  | IRowEnderecoUsuario
  | IRowCartaoUsuario;
