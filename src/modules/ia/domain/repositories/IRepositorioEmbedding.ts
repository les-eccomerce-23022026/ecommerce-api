import { IProdutoEmbedding, ICriarProdutoEmbeddingDto } from '../entities/IProdutoEmbedding.entity';

/**
 * Interface de Repositório de Embeddings
 * 
 * Define operações para gerenciar embeddings de produtos no ChromaDB.
 */
export interface IRepositorioEmbedding {
  /**
   * Cria um novo embedding de produto
   */
  criar(dados: ICriarProdutoEmbeddingDto): Promise<IProdutoEmbedding>;

  /**
   * Busca embeddings por UUID do produto
   */
  buscarPorProdutoUuid(produtoUuid: string): Promise<IProdutoEmbedding | null>;

  /**
   * Busca embeddings similares por query
   */
  buscarSimilares(
    queryEmbedding: number[],
    limite: number
  ): Promise<{ produtoUuid: string; similaridade: number; metadados: any }[]>;

  /**
   * Atualiza um embedding existente
   */
  atualizar(uuid: string, dados: Partial<ICriarProdutoEmbeddingDto>): Promise<IProdutoEmbedding>;

  /**
   * Remove um embedding
   */
  remover(uuid: string): Promise<void>;

  /**
   * Indexa todos os produtos do catálogo no ChromaDB
   */
  indexarCatalogo(): Promise<number>;

  /**
   * Remove todos os embeddings (para reindexação)
   */
  limparColecao(): Promise<void>;
}