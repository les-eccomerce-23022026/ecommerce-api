/**
 * Golden Dataset de Embeddings para Testes de Regressão
 *
 * Este arquivo contém embeddings fixos para testes de regressão do sistema IA.
 * O objetivo é garantir que a busca vetorial retorne resultados consistentes
 * ao longo do tempo, detectando regressões de qualidade.
 *
 * RN-IA-REGRESSAO: O sistema deve retornar resultados consistentes para
 * as mesmas queries, permitindo detecção de regressões de qualidade.
 *
 * Como usar:
 * 1. Importar `configurarGoldenDatasetMocks()` nos testes
 * 2. Chamar no `beforeEach()` para configurar os mocks
 * 3. Usar os embeddings fixos para validar consistência
 */

import { mockGerarEmbedding } from './setupMocksIA.util';

/**
 * Golden Dataset de Embeddings
 *
 * Cada chave é uma query comum e o valor é o embedding correspondente.
 * Estes embeddings são fixos e determinísticos, permitindo testes de regressão.
 */
export const GOLDEN_EMBEDDINGS: Record<string, number[]> = {
  // Queries comuns de recomendação
  'livros de ficção': [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  'livros de romance': [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.1],
  'livros de aventura': [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.1, 0.2],
  'livros de mistério': [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.1, 0.2, 0.3],
  'livros de fantasia': [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.1, 0.2, 0.3, 0.4],
  'livros de terror': [0.6, 0.7, 0.8, 0.9, 1.0, 0.1, 0.2, 0.3, 0.4, 0.5],
  'livros de ficção científica': [0.7, 0.8, 0.9, 1.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
  'livros de biografia': [0.8, 0.9, 1.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
  'livros de história': [0.9, 1.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
  'livros de autoajuda': [1.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
  
  // Queries específicas
  'recomende um livro': [0.11, 0.21, 0.31, 0.41, 0.51, 0.61, 0.71, 0.81, 0.91, 0.01],
  'livros para crianças': [0.12, 0.22, 0.32, 0.42, 0.52, 0.62, 0.72, 0.82, 0.92, 0.02],
  'livros best-sellers': [0.13, 0.23, 0.33, 0.43, 0.53, 0.63, 0.73, 0.83, 0.93, 0.03],
  'livros clássicos': [0.14, 0.24, 0.34, 0.44, 0.54, 0.64, 0.74, 0.84, 0.94, 0.04],
  'livros novos': [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 0.05],
  
  // Queries de chat
  'ping': [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01],
  'olá': [0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02],
  'ajuda': [0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03],
};

/**
 * Configura os mocks para usar o golden dataset
 *
 * Esta função configura o mock de `gerarEmbedding` para retornar embeddings
 * fixos do golden dataset, garantindo testes determinísticos e consistentes.
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   configurarGoldenDatasetMocks();
 * });
 * ```
 */
export function configurarGoldenDatasetMocks(): void {
  mockGerarEmbedding.mockImplementation((texto: string) => {
    // Normaliza o texto para lowercase e trim
    const textoNormalizado = texto.toLowerCase().trim();
    
    // Retorna o embedding do golden dataset ou um embedding padrão
    return GOLDEN_EMBEDDINGS[textoNormalizado] || [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  });
}

/**
 * Calcula a similaridade de cosseno entre dois embeddings
 *
 * @param embedding1 - Primeiro embedding
 * @param embedding2 - Segundo embedding
 * @returns Similaridade de cosseno (0 a 1)
 */
export function calcularSimilaridadeCosseno(embedding1: number[], embedding2: number[]): number {
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

  const similaridade = produtoEscalar / (Math.sqrt(norma1) * Math.sqrt(norma2));
  return similaridade;
}

/**
 * Valida que um embedding está dentro do golden dataset
 *
 * @param embedding - Embedding a validar
 * @returns true se o embedding está no golden dataset
 */
export function estaNoGoldenDataset(embedding: number[]): boolean {
  return Object.values(GOLDEN_EMBEDDINGS).some(
    (goldenEmbedding) => {
      if (goldenEmbedding.length !== embedding.length) {
        return false;
      }
      
      for (let i = 0; i < embedding.length; i++) {
        if (Math.abs(goldenEmbedding[i] - embedding[i]) > 0.0001) {
          return false;
        }
      }
      
      return true;
    }
  );
}
