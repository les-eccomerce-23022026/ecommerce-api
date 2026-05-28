/**
 * MMR (Maximal Marginal Relevance) Reranking
 * 
 * Implementa algoritmo MMR para diversificar resultados de busca vetorial,
 * balanceando relevância e diversidade.
 */

export interface MMROption {
  produtoUuid: string;
  similaridade: number;
  metadados: any;
  embedding?: number[];
}

export interface MMRConfig {
  lambda: number;  // Parâmetro de trade-off (0-1)
                  // 0 = máxima diversidade, 1 = máxima relevância
}

/**
 * Calcula similaridade de cosseno entre dois embeddings
 */
function similaridadeCosseno(embedding1: number[], embedding2: number[]): number {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
    return 0;
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

/**
 * Calcula diversidade entre duas opções baseada em metadados
 */
function diversidadeMetadados(opcao1: MMROption, opcao2: MMROption): number {
  const metadados1 = opcao1.metadados;
  const metadados2 = opcao2.metadados;

  let score = 0;
  let total = 0;

  // Diversidade por categoria
  if (metadados1.categoria && metadados2.categoria) {
    score += metadados1.categoria !== metadados2.categoria ? 1 : 0;
    total++;
  }

  // Diversidade por autor
  if (metadados1.autor && metadados2.autor) {
    score += metadados1.autor !== metadados2.autor ? 1 : 0;
    total++;
  }

  // Diversidade por faixa de preço (diferença > 20%)
  if (metadados1.preco && metadados2.preco) {
    const diff = Math.abs(metadados1.preco - metadados2.preco);
    const media = (metadados1.preco + metadados2.preco) / 2;
    score += (diff / media) > 0.2 ? 1 : 0;
    total++;
  }

  return total > 0 ? score / total : 0;
}

/**
 * Implementação do algoritmo MMR
 */
export class MMRReranking {
  constructor(private config: MMRConfig) {
    this.config = {
      lambda: config.lambda || 0.5,  // Default: balanceado
    };
  }

  /**
   * Aplica reranking MMR nas opções
   * @param opcoes Lista de opções para reranking
   * @param k Número de resultados desejados
   * @returns Lista rerankada com k elementos
   */
  reranking(opcoes: MMROption[], k: number): MMROption[] {
    if (opcoes.length <= k) {
      return opcoes;
    }

    const selecionados: MMROption[] = [];
    const candidatos = [...opcoes];

    // Seleciona o primeiro (mais relevante)
    const primeiro = this.encontrarMaisRelevante(candidatos);
    selecionados.push(primeiro);
    this.removerCandidato(candidatos, primeiro);

    // Seleciona os demais usando MMR
    while (selecionados.length < k && candidatos.length > 0) {
      let melhorCandidato: MMROption | null = null;
      let melhorScore = -Infinity;

      for (const candidato of candidatos) {
        const score = this.calcularScoreMMR(candidato, selecionados);
        
        if (score > melhorScore) {
          melhorScore = score;
          melhorCandidato = candidato;
        }
      }

      if (melhorCandidato) {
        selecionados.push(melhorCandidato);
        this.removerCandidato(candidatos, melhorCandidato);
      } else {
        break;
      }
    }

    return selecionados;
  }

  /**
   * Calcula score MMR para um candidato
   * MMR = λ * relevância - (1-λ) * máxima_similaridade_com_selecionados
   */
  private calcularScoreMMR(candidato: MMROption, selecionados: MMROption[]): number {
    const relevancia = candidato.similaridade;
    
    // Encontra máxima similaridade com já selecionados
    let maxSimilaridade = 0;
    
    for (const selecionado of selecionados) {
      let similaridade = 0;
      
      // Prioriza similaridade de embedding se disponível
      if (candidato.embedding && selecionado.embedding) {
        similaridade = similaridadeCosseno(candidato.embedding, selecionado.embedding);
      } else {
        // Fallback para diversidade de metadados
        similaridade = 1 - diversidadeMetadados(candidato, selecionado);
      }
      
      maxSimilaridade = Math.max(maxSimilaridade, similaridade);
    }

    const lambda = this.config.lambda;
    const mmrScore = lambda * relevancia - (1 - lambda) * maxSimilaridade;

    return mmrScore;
  }

  /**
   * Encontra a opção mais relevante
   */
  private encontrarMaisRelevante(opcoes: MMROption[]): MMROption {
    return opcoes.reduce((melhor, atual) => 
      atual.similaridade > melhor.similaridade ? atual : melhor
    );
  }

  /**
   * Remove um candidato da lista
   */
  private removerCandidato(candidatos: MMROption[], alvo: MMROption): void {
    const indice = candidatos.findIndex(c => c.produtoUuid === alvo.produtoUuid);
    if (indice !== -1) {
      candidatos.splice(indice, 1);
    }
  }
}

/**
 * Factory para criar reranking MMR
 */
export class MMRFactory {
  static criar(lambda: number = 0.5): MMRReranking {
    return new MMRReranking({ lambda });
  }
}
