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

/**
 * DTO para atualização parcial de loja.
 */
export interface IAtualizarLojaDto {
  nome?: string;
  cnpj?: string;
  ativo?: boolean;
}

/**
 * Parâmetros de filtro e paginação para listagem de lojas.
 */
export interface IFiltrosListarLojasDto {
  nome?: string;
  cnpj?: string;
  ativo?: boolean;
  pagina?: number;
  limite?: number;
}

/**
 * DTO de resposta paginada para listagem de lojas.
 */
export interface IRespostaListarLojasPaginadoDto {
  lojas: IListaLojaDto[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}
