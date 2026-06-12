/**
 * Entidade de Produto Embedding
 * 
 * Representa a representação vetorial de um produto para busca semântica.
 * Armazena o embedding gerado a partir dos metadados do produto para
 * similaridade semântica em ChromaDB.
 */
export interface IProdutoEmbedding {
  id: number;
  uuid: string;
  produtoUuid: string;
  embedding: number[];
  metadados: {
    titulo: string;
    autor: string;
    categoria: string;
    sinopse?: string;
    isbn: string;
    preco: number;
    numeroPaginas?: number;
    anoPublicacao?: number;
    idioma?: string;
    tags?: string;
  };
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface ICriarProdutoEmbeddingDto {
  produtoUuid: string;
  embedding: number[];
  metadados: {
    titulo: string;
    autor: string;
    categoria: string;
    sinopse?: string;
    isbn: string;
    preco: number;
    numeroPaginas?: number;
    anoPublicacao?: number;
    idioma?: string;
    tags?: string;
  };
}

/**
 * Metadados de domínio de um produto (camelCase), compartilhados entre a
 * entidade e os resultados de busca semântica.
 */
export type MetadadosProdutoEmbedding = IProdutoEmbedding['metadados'];

/**
 * Item retornado pela busca por similaridade no vector store.
 * Tipagem forte do `metadados` — substitui o antigo `any`.
 */
export interface IResultadoBuscaSimilar {
  produtoUuid: string;
  similaridade: number;
  metadados: MetadadosProdutoEmbedding;
}