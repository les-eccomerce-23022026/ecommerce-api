/**
 * Serviço de Domínio para Geração de Embeddings
 * 
 * Responsável por gerar embeddings vetoriais a partir de metadados de produtos
 * usando o modelo de embeddings do Gemini.
 */
export class ServicoGeracaoEmbedding {
  /**
   * Gera texto representativo do produto para geração de embedding
   */
  gerarTextoProduto(metadados: {
    titulo: string;
    autor: string;
    categoria: string;
    sinopse?: string;
    isbn: string;
  }): string {
    const partes = [
      `Título: ${metadados.titulo}`,
      `Autor: ${metadados.autor}`,
      `Categoria: ${metadados.categoria}`,
      `ISBN: ${metadados.isbn}`,
    ];

    if (metadados.sinopse) {
      partes.push(`Sinopse: ${metadados.sinopse}`);
    }

    return partes.join('. ');
  }

  /**
   * Valida se um embedding é válido
   */
  validarEmbedding(embedding: number[]): boolean {
    if (!Array.isArray(embedding)) {
      return false;
    }

    if (embedding.length === 0) {
      return false;
    }

    // Verifica se todos os valores são números
    if (!embedding.every((valor) => typeof valor === 'number' && !isNaN(valor))) {
      return false;
    }

    // Verifica se não há valores infinitos
    if (embedding.some((valor) => !isFinite(valor))) {
      return false;
    }

    return true;
  }

  /**
   * Calcula similaridade de cosseno entre dois embeddings
   */
  calcularSimilaridadeCosseno(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings devem ter o mesmo tamanho');
    }

    let produtoEscalar = 0;
    let norma1 = 0;
    let norma2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      produtoEscalar += embedding1[i] * embedding2[i];
      norma1 += embedding1[i] * embedding1[i];
      norma2 += embedding2[i] * embedding2[i];
    }

    if (norma1 === 0 || norma2 === 0) {
      return 0;
    }

    return produtoEscalar / (Math.sqrt(norma1) * Math.sqrt(norma2));
  }
}