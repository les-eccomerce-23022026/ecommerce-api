/**
 * Interface para adapter de embedding (DIP)
 * 
 * Define o contrato para geração de embeddings, permitindo
 * diferentes implementações sem violar o Dependency Inversion Principle.
 */
export interface IAdapterEmbedding {
  gerarEmbedding(texto: string): Promise<number[]>;
}
