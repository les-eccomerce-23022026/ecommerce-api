import { ServicoChunkingTextos } from './ServicoChunkingTextos';

/** Metadados de produto usados para gerar texto de embedding */
type MetadadosProduto = {
  titulo: string;
  autor: string;
  categoria: string;
  sinopse?: string;
  isbn: string;
};

/**
 * Serviço de Domínio para Geração de Embeddings
 *
 * Responsável por gerar embeddings vetoriais a partir de metadados de produtos
 * usando o modelo de embeddings do Gemini.
 *
 * Integra com ServicoChunkingTextos para dividir sinopses longas em chunks,
 * permitindo a geração de múltiplos embeddings por produto quando necessário
 * para melhor cobertura semântica no sistema RAG.
 */
export class ServicoGeracaoEmbedding {
  private readonly _servicoChunking: ServicoChunkingTextos;

  /**
   * @param servicoChunking - Serviço de chunking (opcional; usa configuração
   *   padrão do CONFIGURACOES-RAG-EMBEDDINGS.md quando omitido)
   */
  constructor(servicoChunking?: ServicoChunkingTextos) {
    this._servicoChunking = servicoChunking ?? new ServicoChunkingTextos();
  }

  /**
   * Gera texto representativo do produto para geração de embedding.
   * Retorna texto único — sem chunking. Use gerarChunksDoProduto para
   * sinopses longas.
   */
  gerarTextoProduto(metadados: MetadadosProduto): string {
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
   * Gera chunks de texto do produto para geração de múltiplos embeddings.
   *
   * Quando a sinopse do produto é longa (> tamanhoChunk), divide o texto em
   * chunks com sobreposição para melhor representação vetorial. Chunks
   * subsequentes recebem contexto mínimo do produto (título + índice) para
   * manter coerência semântica durante a busca.
   *
   * Produtos com sinopses curtas retornam array com um único elemento.
   *
   * @param metadados - Metadados do produto a ser representado
   * @returns Array de chunks prontos para geração de embeddings
   */
  gerarChunksDoProduto(metadados: MetadadosProduto): string[] {
    const textoCabecalho = [
      `Título: ${metadados.titulo}`,
      `Autor: ${metadados.autor}`,
      `Categoria: ${metadados.categoria}`,
      `ISBN: ${metadados.isbn}`,
    ].join('. ');

    if (!metadados.sinopse) {
      return [textoCabecalho];
    }

    const textoCompleto = `${textoCabecalho}. Sinopse: ${metadados.sinopse}`;
    const resultado = this._servicoChunking.dividirTexto(textoCompleto);

    if (!resultado.precisouChunking) {
      return [textoCompleto];
    }

    // Chunks posteriores ao primeiro podem perder o cabeçalho; reintroduz contexto mínimo
    return resultado.chunks.map((chunk, indice) => {
      const contemCabecalho = chunk.includes(metadados.titulo);
      if (contemCabecalho) {
        return chunk;
      }
      // Identifica o chunk com título e índice para manter rastreabilidade semântica
      return `[${metadados.titulo} · parte ${indice + 1}] ${chunk}`;
    });
  }

  /**
   * Verifica se o texto completo de um produto precisa de divisão em chunks.
   * Délega ao ServicoChunkingTextos usando o texto gerado por gerarTextoProduto.
   *
   * @param metadados - Metadados do produto a verificar
   * @returns true se o texto exceder o tamanho máximo de chunk
   */
  precisaChunking(metadados: MetadadosProduto): boolean {
    const texto = this.gerarTextoProduto(metadados);
    return this._servicoChunking.precisaChunking(texto);
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