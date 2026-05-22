import type { ILivroCatalogoDto } from '@/modules/livros/ILivroCatalogo.dto';

export type OrdenacaoCatalogo = 'recentes' | 'mais-vendidos';

export interface IListagemCatalogoLivros {
  livros: ILivroCatalogoDto[];
  total: number;
  pagina: number;
  itensPorPagina: number;
}

export interface ICategoriaMenuDto {
  slug: string;
  nome: string;
  contadorProdutos: number;
}
