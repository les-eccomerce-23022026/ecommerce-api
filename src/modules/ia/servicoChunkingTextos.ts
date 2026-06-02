/**
 * Serviço de Domínio para Chunking de Textos
 *
 * Implementa estratégia de divisão recursiva de texto equivalente ao
 * RecursiveCharacterTextSplitter do LangChain, mantendo a camada de domínio
 * independente de frameworks externos.
 *
 * Configurações alinhadas ao documento CONFIGURACOES-RAG-EMBEDDINGS.md:
 * - tamanhoChunk:      1000 caracteres  (chunkSize)
 * - sobreposicaoChunk: 200 caracteres   (chunkOverlap)
 * - separadores:       ["\n\n", "\n", " ", ""]
 *
 * Referência: https://js.langchain.com/docs/modules/data_connection/document_transformers/
 */

/** Configuração do algoritmo de chunking */
export interface IConfiguracaoChunking {
  /** Tamanho máximo de cada chunk em caracteres (chunkSize) */
  tamanhoChunk: number;
  /** Sobreposição entre chunks consecutivos em caracteres (chunkOverlap) */
  sobreposicaoChunk: number;
  /** Hierarquia de separadores tentados em ordem (separators) */
  separadores: string[];
}

/** Resultado da operação de chunking */
export interface IResultadoChunking {
  /** Array de chunks gerados */
  chunks: string[];
  /** Total de chunks gerados */
  totalChunks: number;
  /** Indica se o texto foi de fato dividido (false = texto único) */
  precisouChunking: boolean;
}

/**
 * Serviço responsável por dividir textos longos em chunks para geração
 * de embeddings de alta qualidade no sistema RAG.
 *
 * O algoritmo opera em duas etapas:
 * 1. Divisão recursiva — tenta cada separador da hierarquia até obter partes ≤ tamanhoChunk
 * 2. Mesclagem com overlap — une partes pequenas em chunks do tamanho ideal
 *    mantendo sobreposicaoChunk caracteres de contexto entre chunks consecutivos
 */
export class ServicoChunkingTextos {
  private readonly _tamanhoChunk: number;
  private readonly _sobreposicaoChunk: number;
  private readonly _separadores: string[];

  /**
   * Configuração padrão alinhada ao CONFIGURACOES-RAG-EMBEDDINGS.md.
   * Equivalente a: new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200, separators: [...] })
   */
  static readonly CONFIGURACAO_PADRAO: IConfiguracaoChunking = {
    tamanhoChunk: 1000,
    sobreposicaoChunk: 200,
    separadores: ['\n\n', '\n', ' ', ''],
  };

  constructor(configuracao: Partial<IConfiguracaoChunking> = {}) {
    const config = { ...ServicoChunkingTextos.CONFIGURACAO_PADRAO, ...configuracao };

    if (config.sobreposicaoChunk >= config.tamanhoChunk) {
      throw new Error(
        `sobreposicaoChunk (${config.sobreposicaoChunk}) deve ser menor que tamanhoChunk (${config.tamanhoChunk})`
      );
    }

    this._tamanhoChunk = config.tamanhoChunk;
    this._sobreposicaoChunk = config.sobreposicaoChunk;
    this._separadores = config.separadores;
  }

  /**
   * Divide um texto em chunks usando estratégia recursiva por hierarquia de separadores.
   *
   * Algoritmo equivalente ao RecursiveCharacterTextSplitter do LangChain:
   * - Textos ≤ tamanhoChunk retornam como chunk único sem divisão
   * - Textos maiores são divididos recursivamente pelo primeiro separador encontrado
   * - Partes pequenas são mescladas com sobreposicaoChunk de contexto compartilhado
   *
   * @param texto - Texto a ser dividido
   * @returns Resultado com os chunks e metadados da operação
   */
  dividirTexto(texto: string): IResultadoChunking {
    if (!texto || texto.trim().length === 0) {
      return { chunks: [], totalChunks: 0, precisouChunking: false };
    }

    if (texto.length <= this._tamanhoChunk) {
      return { chunks: [texto], totalChunks: 1, precisouChunking: false };
    }

    const chunks = this._dividirRecursivo(texto, this._separadores);

    return {
      chunks,
      totalChunks: chunks.length,
      precisouChunking: chunks.length > 1,
    };
  }

  /**
   * Divide múltiplos textos retornando array de arrays de chunks.
   * Textos que não precisam de chunking retornam array com elemento único.
   *
   * @param textos - Array de textos a dividir
   * @returns Array onde cada posição contém os chunks do texto correspondente
   */
  dividirTextos(textos: string[]): string[][] {
    return textos.map((texto) => this.dividirTexto(texto).chunks);
  }

  /**
   * Verifica se um texto excede o tamanho máximo configurado.
   * Útil para decidir se um produto precisa de indexação multi-chunk.
   *
   * @param texto - Texto a verificar
   * @returns true se o texto exceder tamanhoChunk
   */
  precisaChunking(texto: string): boolean {
    return texto.length > this._tamanhoChunk;
  }

  /**
   * Divisão recursiva por hierarquia de separadores.
   *
   * Percorre a lista de separadores e seleciona o primeiro presente no texto.
   * Partes que ainda excedem o tamanho são recursivamente divididas com os
   * separadores restantes na hierarquia.
   */
  private _dividirRecursivo(texto: string, separadores: string[]): string[] {
    const chunksFinais: string[] = [];

    // Seleciona o primeiro separador presente no texto (hierarquia de preferência)
    let separadorUsado = separadores[separadores.length - 1];
    let novosSeparadores: string[] = [];

    for (let i = 0; i < separadores.length; i++) {
      const candidato = separadores[i];
      if (candidato === '' || texto.includes(candidato)) {
        separadorUsado = candidato;
        novosSeparadores = separadores.slice(i + 1);
        break;
      }
    }

    // Divide o texto pelo separador selecionado (string vazia = por caractere)
    const partes =
      separadorUsado === '' ? texto.split('') : texto.split(separadorUsado);

    const partesValidas = partes.filter((p) => p.length > 0);

    // Acumula partes pequenas para mesclagem; recursiona partes grandes
    const boasSplits: string[] = [];

    for (const parte of partesValidas) {
      if (parte.length <= this._tamanhoChunk) {
        boasSplits.push(parte);
      } else {
        // Mescla o que foi acumulado antes de tratar a parte grande
        if (boasSplits.length > 0) {
          const mesclados = this._mesclarPartes(boasSplits, separadorUsado);
          chunksFinais.push(...mesclados);
          boasSplits.length = 0;
        }

        if (novosSeparadores.length === 0) {
          // Hierarquia esgotada: inclui a parte como está (evita loop infinito)
          chunksFinais.push(parte);
        } else {
          const recursao = this._dividirRecursivo(parte, novosSeparadores);
          chunksFinais.push(...recursao);
        }
      }
    }

    // Mescla as partes boas remanescentes
    if (boasSplits.length > 0) {
      const mesclados = this._mesclarPartes(boasSplits, separadorUsado);
      chunksFinais.push(...mesclados);
    }

    return chunksFinais;
  }

  /**
   * Mescla partes pequenas em chunks respeitando tamanhoChunk e sobreposicaoChunk.
   *
   * Algoritmo equivalente ao _merge_splits do LangChain (Python):
   * - Acumula partes até atingir o limite tamanhoChunk
   * - Ao ultrapassar: salva o chunk atual, remove partes do início
   *   mantendo sobreposicaoChunk caracteres de contexto compartilhado
   *
   * @param partes - Partes a mesclar (cada uma ≤ tamanhoChunk)
   * @param separador - Separador usado para juntar as partes
   * @returns Array de chunks mesclados com overlap
   */
  private _mesclarPartes(partes: string[], separador: string): string[] {
    const comprimentoSeparador = separador.length;
    const docs: string[] = [];
    let docAtual: string[] = [];
    let total = 0;

    for (const parte of partes) {
      const comprimentoParte = parte.length;
      // Separador só é necessário quando já existe conteúdo no chunk atual
      const separadorNecessario = docAtual.length > 0 ? comprimentoSeparador : 0;

      if (total + comprimentoParte + separadorNecessario > this._tamanhoChunk) {
        if (docAtual.length > 0) {
          // Salva o chunk atual (trim para remover espaços de borda)
          const textoChunk = docAtual.join(separador).trim();
          if (textoChunk.length > 0) {
            docs.push(textoChunk);
          }

          // Remove partes do início para manter apenas sobreposicaoChunk de contexto.
          // Condição: continua removendo enquanto:
          //   (a) total ainda excede sobreposicaoChunk, OU
          //   (b) adicionar a parte atual ainda extrapolaria tamanhoChunk (e total > 0)
          while (
            total > this._sobreposicaoChunk ||
            (total +
              comprimentoParte +
              (docAtual.length > 0 ? comprimentoSeparador : 0) >
              this._tamanhoChunk &&
              total > 0)
          ) {
            // Subtrai a parte mais antiga e seu separador (se havia próximo elemento)
            const comprimentoRemovida =
              docAtual[0].length + (docAtual.length > 1 ? comprimentoSeparador : 0);
            total -= comprimentoRemovida;
            docAtual = docAtual.slice(1);
          }
        }
      }

      docAtual.push(parte);
      // Separador é contado apenas a partir do segundo elemento
      total += comprimentoParte + (docAtual.length > 1 ? comprimentoSeparador : 0);
    }

    // Salva o último chunk (partes que não atingiram o limite)
    const textoFinal = docAtual.join(separador).trim();
    if (textoFinal.length > 0) {
      docs.push(textoFinal);
    }

    return docs;
  }
}
