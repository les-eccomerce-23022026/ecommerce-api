/**
 * DTO para criação de lojas.
 */
export interface ICriarLojaDto {
  nome: string;
  slug: string;
  cnpj: string;
}

/**
 * DTO de retorno para loja criada.
 */
export interface IRespostaLojaCriadaDto {
  uuid: string;
  nome: string;
  slug: string;
  cnpj: string;
  ativo: boolean;
}

/**
 * DTO para listagem de lojas.
 */
export interface IListaLojaDto {
  uuid: string;
  nome: string;
  slug: string;
  cnpj: string;
  ativo: boolean;
}
