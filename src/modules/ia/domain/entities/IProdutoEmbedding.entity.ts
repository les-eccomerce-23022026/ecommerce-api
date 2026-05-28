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
  };
}