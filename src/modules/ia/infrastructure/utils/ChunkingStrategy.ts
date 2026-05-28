/**
 * Estratégias de Chunking para textos longos
 * 
 * Implementa diferentes estratégias para dividir textos longos em chunks
 * para processamento de embeddings e RAG.
 */

export interface Chunk {
  texto: string;
  indice: number;
  metadados?: Record<string, any>;
}

export interface ChunkingConfig {
  tamanhoMaximo: number;      // Tamanho máximo do chunk em caracteres
  sobreposicao: number;       // Sobreposição entre chunks em caracteres
  separador?: string;         // Separador para chunking (ex: '.', '\n')
}

/**
 * Contrato base para todas as estratégias de chunking
 */
export interface ChunkingStrategy {
  chunkificar(texto: string): Chunk[];
}

/**
 * Estratégia de chunking por tamanho fixo
 * Divide o texto em chunks de tamanho fixo com sobreposição
 */
export class FixedSizeChunking implements ChunkingStrategy {
  constructor(private config: ChunkingConfig) {
    this.config = {
      tamanhoMaximo: config.tamanhoMaximo || 500,
      sobreposicao: config.sobreposicao || 50,
      separador: config.separador,
    };
  }

  chunkificar(texto: string): Chunk[] {
    const chunks: Chunk[] = [];
    const tamanho = this.config.tamanhoMaximo;
    const sobreposicao = this.config.sobreposicao;
    
    if (texto.length <= tamanho) {
      return [{ texto, indice: 0 }];
    }

    let inicio = 0;
    let indice = 0;

    while (inicio < texto.length) {
      const fim = Math.min(inicio + tamanho, texto.length);
      let chunkTexto = texto.substring(inicio, fim);

      // Se houver separador configurado, tenta quebrar no separador mais próximo
      if (this.config.separador && fim < texto.length) {
        const ultimaSeparacao = chunkTexto.lastIndexOf(this.config.separador);
        if (ultimaSeparacao > tamanho * 0.5) {
          chunkTexto = chunkTexto.substring(0, ultimaSeparacao + 1);
        }
      }

      chunks.push({
        texto: chunkTexto.trim(),
        indice: indice++,
      });

      inicio += chunkTexto.length - sobreposicao;
    }

    return chunks;
  }
}

/**
 * Estratégia de chunking semântico
 * Divide o texto baseado em estrutura semântica (parágrafos, sentenças)
 */
export class SemanticChunking implements ChunkingStrategy {
  constructor(private config: ChunkingConfig) {
    this.config = {
      tamanhoMaximo: config.tamanhoMaximo || 500,
      sobreposicao: config.sobreposicao || 0,
      separador: config.separador || '\n\n',
    };
  }

  chunkificar(texto: string): Chunk[] {
    const chunks: Chunk[] = [];
    const separador = this.config.separador!;
    const partes = texto.split(separador);
    
    let chunkAtual = '';
    let indice = 0;

    for (const parte of partes) {
      const parteTrimmed = parte.trim();
      if (!parteTrimmed) continue;

      if (chunkAtual.length + parteTrimmed.length <= this.config.tamanhoMaximo) {
        chunkAtual += (chunkAtual ? separador : '') + parteTrimmed;
      } else {
        if (chunkAtual) {
          chunks.push({ texto: chunkAtual, indice: indice++ });
        }
        chunkAtual = parteTrimmed;
      }
    }

    if (chunkAtual) {
      chunks.push({ texto: chunkAtual, indice: indice++ });
    }

    return chunks;
  }
}

/**
 * Estratégia de chunking recursivo
 * Divide o texto recursivamente até atingir o tamanho desejado
 */
export class RecursiveChunking implements ChunkingStrategy {
  constructor(private config: ChunkingConfig) {
    this.config = {
      tamanhoMaximo: config.tamanhoMaximo || 500,
      sobreposicao: config.sobreposicao || 0,
      separador: config.separador || ['\n\n', '\n', '. ', ' '],
    };
  }

  chunkificar(texto: string): Chunk[] {
    return this.chunkificarRecursivo(texto, this.config.separador as string[], 0);
  }

  private chunkificarRecursivo(
    texto: string,
    separadores: string[],
    indice: number
  ): Chunk[] {
    if (texto.length <= this.config.tamanhoMaximo) {
      return [{ texto: texto.trim(), indice }];
    }

    if (separadores.length === 0) {
      // Se não há mais separadores, divide no meio
      return this.dividirNoMeio(texto, indice);
    }

    const separador = separadores[0];
    const partes = texto.split(separador);
    
    if (partes.length === 1) {
      // Tenta próximo separador
      return this.chunkificarRecursivo(texto, separadores.slice(1), indice);
    }

    const chunks: Chunk[] = [];
    let chunkAtual = '';
    let chunkIndice = indice;

    for (const parte of partes) {
      const parteTrimmed = parte.trim();
      if (!parteTrimmed) continue;

      if (chunkAtual.length + parteTrimmed.length <= this.config.tamanhoMaximo) {
        chunkAtual += (chunkAtual ? separador : '') + parteTrimmed;
      } else {
        if (chunkAtual) {
          chunks.push({ texto: chunkAtual, indice: chunkIndice++ });
        }
        
        // Se a parte ainda é muito grande, recursão
        if (parteTrimmed.length > this.config.tamanhoMaximo) {
          const subChunks = this.chunkificarRecursivo(
            parteTrimmed,
            separadores.slice(1),
            chunkIndice
          );
          chunks.push(...subChunks);
          chunkIndice = subChunks[subChunks.length - 1].indice + 1;
          chunkAtual = '';
        } else {
          chunkAtual = parteTrimmed;
        }
      }
    }

    if (chunkAtual) {
      chunks.push({ texto: chunkAtual, indice: chunkIndice });
    }

    return chunks;
  }

  private dividirNoMeio(texto: string, indice: number): Chunk[] {
    const chunks: Chunk[] = [];
    const tamanho = this.config.tamanhoMaximo;
    let inicio = 0;
    let chunkIndice = indice;

    while (inicio < texto.length) {
      const fim = Math.min(inicio + tamanho, texto.length);
      chunks.push({
        texto: texto.substring(inicio, fim).trim(),
        indice: chunkIndice++,
      });
      inicio = fim;
    }

    return chunks;
  }
}

/**
 * Tabela de despacho para criação de estratégias de chunking.
 * Aberta para extensão (novos tipos), fechada para modificação (OCP).
 */
type TipoChunking = 'fixed' | 'semantic' | 'recursive';

type FabricaEstrategiaChunking = Record<
  TipoChunking,
  (config: ChunkingConfig) => ChunkingStrategy
>;

const ESTRATEGIAS_CHUNKING: FabricaEstrategiaChunking = {
  fixed:     (config) => new FixedSizeChunking(config),
  semantic:  (config) => new SemanticChunking(config),
  recursive: (config) => new RecursiveChunking(config),
};

/**
 * Cria uma estratégia de chunking a partir do tipo solicitado.
 * @param tipo - 'fixed' | 'semantic' | 'recursive'
 * @param config - Configuração de chunking
 * @throws {Error} Quando o tipo informado não possui estratégia registrada
 */
export function criarEstrategiaChunking(
  tipo: TipoChunking,
  config: ChunkingConfig
): ChunkingStrategy {
  const fabrica = ESTRATEGIAS_CHUNKING[tipo];
  if (!fabrica) throw new Error(`Estratégia de chunking desconhecida: ${tipo}`);
  return fabrica(config);
}
