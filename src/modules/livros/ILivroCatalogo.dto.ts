/**
 * Livro exposto ao catálogo (JSON compatível com o frontend ILivro).
 */
export interface ILivroCatalogoDto {
  uuid: string;
  titulo: string;
  autor: string;
  preco: number;
  imagem?: string;
  isbn: string;
  estoque: number;
  sinopse?: string;
  status: 'Ativo' | 'Inativo';
  estrelas?: number;
}
