import { IProdutoEmbedding, ICriarProdutoEmbeddingDto } from './IProdutoEmbedding.entity';

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
   *
   * @param opcoes.temContexto Indica se há contexto de cliente disponível.
   *   Quando `true` aplica multiplicador 2x (contexto personalizado reduz incerteza);
   *   quando `false` aplica multiplicador 3x (sem contexto exige maior cobertura).
   */
  buscarSimilares(
    queryEmbedding: number[],
    limite: number,
    opcoes?: { temContexto?: boolean }
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

  /**
   * Verifica conectividade com o vector store (ChromaDB)
   */
  verificarConexao(): Promise<boolean>;
}