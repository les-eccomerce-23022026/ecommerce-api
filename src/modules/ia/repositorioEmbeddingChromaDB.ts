import { ChromaClient, Collection, Metadata } from 'chromadb';
import { v4 as uuidv4 } from 'uuid';
import { IRepositorioEmbedding } from './IRepositorioEmbedding';
import { ICriarProdutoEmbeddingDto } from './IProdutoEmbedding.entity';
import {
  IProdutoEmbedding,
  IResultadoBuscaSimilar,
  MetadadosProdutoEmbedding,
} from './IProdutoEmbedding.entity';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Tipo de um valor individual de metadado, conforme a tipagem do ChromaDB.
 * Inclui escalares, arrays e SparseVector — nossos campos são sempre escalares,
 * então os leitores abaixo descartam formatos não esperados via fallback.
 */
type ValorMetadadoChroma = Metadata[string];

/** Lê um campo textual dos metadados brutos com fallback seguro. */
function lerTexto(valor: ValorMetadadoChroma | undefined, padrao = ''): string {
  if (typeof valor === 'string') {
    return valor;
  }
  if (typeof valor === 'number' || typeof valor === 'boolean') {
    return String(valor);
  }
  return padrao; // null, undefined, arrays ou SparseVector → fallback
}

/** Lê um campo numérico dos metadados brutos com fallback seguro. */
function lerNumero(valor: ValorMetadadoChroma | undefined, padrao = 0): number {
  if (typeof valor === 'number') {
    return valor;
  }
  if (typeof valor === 'string') {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : padrao;
  }
  return padrao; // boolean, null, undefined, arrays ou SparseVector → fallback
}

/**
 * Converte os metadados brutos do ChromaDB (snake_case) para o formato de
 * domínio (camelCase). Mapper único — elimina a duplicação que existia em
 * `buscarPorProdutoUuid` e `buscarSimilares`.
 */
function mapearMetadadosDominio(bruto: Metadata): MetadadosProdutoEmbedding {
  return {
    titulo: lerTexto(bruto.titulo),
    autor: lerTexto(bruto.autor),
    categoria: lerTexto(bruto.categoria),
    sinopse: lerTexto(bruto.sinopse),
    isbn: lerTexto(bruto.isbn),
    preco: lerNumero(bruto.preco),
    numeroPaginas: lerNumero(bruto.numero_paginas),
    anoPublicacao: lerNumero(bruto.ano_publicacao),
    idioma: lerTexto(bruto.idioma, 'português'),
    tags: lerTexto(bruto.tags),
  };
}

/**
 * Configurações de recomendação e recuperação de contexto (RAG)
 * Valores podem ser sobrescritos por variáveis de ambiente
 *
 * Exportado para uso em serviços de domínio (ex: ServicoRecomendacaoRAG)
 * que precisam dos parâmetros de personalização e retrieval.
 */
export const CONFIGURACAO_RECOMENDACAO = {
  // Quantidade de documentos a recuperar por busca semântica
  quantidadeResultados: parseInt(process.env.RAG_TOP_K || '5', 10),

  // Limiar mínimo de similaridade semântica aceito (0-1)
  // Reduzido para 0.3 para permitir mais resultados em categorias com embedding menos similar
  limiarSimilaridade: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.3'),

  // Gate de relevância relativa ao topo (0-1): descarta candidatos cuja
  // similaridade fique mais que `gapRelevancia` abaixo do melhor resultado da
  // própria query. Adaptativo — corta outliers de outra categoria (ex.: um livro
  // de Tecnologia numa busca de Romance) sem precisar de um limiar global alto
  // que prejudicaria o recall de queries esparsas. Aumentado para 0.25 para
  // permitir mais resultados após população massiva do catálogo.
  gapRelevancia: parseFloat(process.env.RAG_RELEVANCE_GAP || '0.25'),

  // Multiplicador de busca padrão (mantido para compatibilidade)
  multiplicadorBusca: parseInt(process.env.RAG_SEARCH_MULTIPLIER || '2', 10),

  // Multiplicador quando há contexto de cliente: 2x — contexto reduz incerteza
  multiplicadorBuscaComContexto: parseInt(
    process.env.RAG_SEARCH_MULTIPLIER_COM_CONTEXTO || '2',
    10
  ),

  // Multiplicador sem contexto de cliente: 3x — sem sinal personalizado, precisa de maior cobertura
  multiplicadorBuscaSemContexto: parseInt(
    process.env.RAG_SEARCH_MULTIPLIER_SEM_CONTEXTO || '3',
    10
  ),

  // Fatores de personalização por perfil do cliente
  personalizacao: {
    boostCategoria: parseFloat(process.env.RAG_CATEGORY_BOOST || '1.2'),
    boostAutor: parseFloat(process.env.RAG_AUTHOR_BOOST || '1.3'),
    boostPreco: parseFloat(process.env.RAG_PRICE_BOOST || '1.1'),
  },
} as const;

/**
 * Calcula o multiplicador de busca com base na presença de contexto de cliente.
 *
 * - Com contexto: 2x — o perfil personalizado melhora a precisão do embedding,
 *   portanto uma cobertura menor já é suficiente.
 * - Sem contexto: 3x — sem sinal personalizado, recupera mais candidatos para
 *   compensar a maior incerteza da busca semântica.
 *
 * @param temContexto true se há contexto de cliente disponível
 */
export function calcularMultiplicadorBusca(temContexto: boolean): number {
  return temContexto
    ? CONFIGURACAO_RECOMENDACAO.multiplicadorBuscaComContexto
    : CONFIGURACAO_RECOMENDACAO.multiplicadorBuscaSemContexto;
}

/**
 * Implementação do Repositório de Embeddings usando ChromaDB
 * 
 * Responsável por gerenciar embeddings de produtos no ChromaDB para
 * busca vetorial semântica.
 */
export class RepositorioEmbeddingChromaDB implements IRepositorioEmbedding {
  private cliente: ChromaClient;
  private colecao: Collection | null = null;
  private readonly nomeColecao = 'produtos_livraria';

  constructor() {
    // Inicializa cliente ChromaDB com persistência local
    // Usa modo HTTP para evitar problemas com path de arquivo
    // Prioridade: CHROMADB_HOST (testes/local) → CHROMADB_PATH (Docker)
    // Lança erro se nenhuma variável estiver configurada
    const chromaPath = process.env.CHROMADB_HOST || process.env.CHROMADB_PATH;
    
    if (!chromaPath) {
      throw new Error(
        'Variável de ambiente CHROMADB_HOST ou CHROMADB_PATH não configurada. ' +
        'Configure uma delas no .env para conectar ao ChromaDB.'
      );
    }
    
    // Parse da URL para extrair host e port (API moderna chromadb v3.4+)
    let host: string;
    let port: number;
    
    try {
      const url = new URL(chromaPath);
      host = url.hostname;
      port = parseInt(url.port, 10) || (url.protocol === 'https:' ? 443 : 80);
    } catch (erro) {
      throw new Error(
        `URL do ChromaDB inválida: ${chromaPath}. Erro: ${erro instanceof Error ? erro.message : String(erro)}`
      );
    }
    
    this.cliente = new ChromaClient({
      host,
      port,
    });
    Logger.info(`[RepositorioEmbeddingChromaDB] Inicializando ChromaClient com host: ${host}, port: ${port}`);
  }

  /**
   * Inicializa a coleção do ChromaDB com configuração de embedding function
   */
  private async inicializarColecao(): Promise<Collection> {
    if (this.colecao) {
      return this.colecao;
    }

    try {
      // Tenta obter coleção existente
      this.colecao = await this.cliente.getCollection({
        name: this.nomeColecao,
      });
      Logger.info('[RepositorioEmbeddingChromaDB] Coleção existente carregada');
      Logger.info('[RepositorioEmbeddingChromaDB] Configurações de recomendação ativas:', {
        quantidadeResultados: CONFIGURACAO_RECOMENDACAO.quantidadeResultados,
        limiarSimilaridade: CONFIGURACAO_RECOMENDACAO.limiarSimilaridade,
        multiplicadorBusca: CONFIGURACAO_RECOMENDACAO.multiplicadorBusca,
        personalizacao: CONFIGURACAO_RECOMENDACAO.personalizacao,
      });
    } catch (erro) {
      // Se não existir, cria nova com configuração de embedding function
      this.colecao = await this.cliente.createCollection({
        name: this.nomeColecao,
        metadata: {
          descricao: 'Embeddings de produtos da livraria',
          configuracao_rag: 'v1.0',
          // Cosseno é a métrica correta para embeddings de texto (Gemini text-embedding)
          // pois permite comparar direção semântica independente da magnitude do vetor
          'hnsw:space': 'cosine',
        },
      });
      Logger.info('[RepositorioEmbeddingChromaDB] Nova coleção criada com metadata configuracao_rag: v1.0');
      Logger.info('[RepositorioEmbeddingChromaDB] Configurações de recomendação ativas:', {
        quantidadeResultados: CONFIGURACAO_RECOMENDACAO.quantidadeResultados,
        limiarSimilaridade: CONFIGURACAO_RECOMENDACAO.limiarSimilaridade,
        multiplicadorBusca: CONFIGURACAO_RECOMENDACAO.multiplicadorBusca,
        personalizacao: CONFIGURACAO_RECOMENDACAO.personalizacao,
      });
    }

    return this.colecao;
  }

  async criar(dados: ICriarProdutoEmbeddingDto): Promise<IProdutoEmbedding> {
    const colecao = await this.inicializarColecao();
    const uuid = uuidv4();

    const metadadosParaSalvar = {
      produto_uuid: dados.produtoUuid,
      titulo: dados.metadados.titulo,
      autor: dados.metadados.autor,
      categoria: dados.metadados.categoria,
      sinopse: dados.metadados.sinopse || '',
      isbn: dados.metadados.isbn,
      preco: dados.metadados.preco,
      numero_paginas: dados.metadados.numeroPaginas ?? 0,
      ano_publicacao: dados.metadados.anoPublicacao ?? 0,
      idioma: dados.metadados.idioma ?? 'português',
      tags: dados.metadados.tags ?? '',
    };

    Logger.debug(`[RepositorioEmbeddingChromaDB] Salvando embedding para produto ${dados.produtoUuid} com metadados:`, metadadosParaSalvar);

    await colecao.add({
      ids: [uuid],
      embeddings: [dados.embedding],
      metadatas: [metadadosParaSalvar],
    });

    return {
      id: 0, // ChromaDB não usa ID numérico
      uuid,
      produtoUuid: dados.produtoUuid,
      embedding: dados.embedding,
      metadados: dados.metadados,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    };
  }

  async buscarPorProdutoUuid(produtoUuid: string): Promise<IProdutoEmbedding | null> {
    const colecao = await this.inicializarColecao();

    const resultados = await colecao.get({
      where: { produto_uuid: produtoUuid },
    });

    if (resultados.ids.length === 0) {
      return null;
    }

    const id = resultados.ids[0];
    const embedding = resultados.embeddings?.[0] || [];
    const metadadosBruto = resultados.metadatas?.[0];

    if (!metadadosBruto) {
      Logger.error(
        `[RepositorioEmbeddingChromaDB] Metadados ausentes para o embedding ${id} do produto ${produtoUuid}.`
      );
      throw new Error(`Metadados não encontrados para embedding ${id}`);
    }

    return {
      id: 0,
      uuid: id,
      produtoUuid: lerTexto(metadadosBruto.produto_uuid),
      embedding,
      metadados: mapearMetadadosDominio(metadadosBruto),
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    };
  }

  async buscarSimilares(
    queryEmbedding: number[],
    limite: number,
    opcoes?: { temContexto?: boolean }
  ): Promise<IResultadoBuscaSimilar[]> {
    const colecao = await this.inicializarColecao();

    // Multiplicador dinâmico: 2x com contexto de cliente, 3x sem contexto
    // Com contexto o sinal personalizado aumenta precisão; sem contexto é necessária maior cobertura
    const multiplicador = calcularMultiplicadorBusca(opcoes?.temContexto ?? true);
    const nResultados = limite * multiplicador;

    Logger.debug(
      `[RepositorioEmbeddingChromaDB] Buscando similares | limite=${limite} | nResults=${nResultados} (×${multiplicador} | temContexto=${opcoes?.temContexto ?? true}) | limiarSimilaridade=${CONFIGURACAO_RECOMENDACAO.limiarSimilaridade}`
    );

    const resultados = await colecao.query({
      queryEmbeddings: [queryEmbedding],
      nResults: nResultados,
      include: ['metadatas', 'distances'], // Inclui explicitamente metadados e distâncias (plural correto)
    });

    Logger.debug(`[RepositorioEmbeddingChromaDB] Resultados brutos da query:`, {
      ids: resultados.ids,
      metadatas: resultados.metadatas,
      distances: resultados.distances,
    });

    if (!resultados.ids[0] || resultados.ids[0].length === 0) {
      return [];
    }

    // Mapeia todos os resultados convertendo distância → similaridade
    const todosResultados: IResultadoBuscaSimilar[] = resultados.ids[0].map((id, index) => {
      const metadadosBruto = resultados.metadatas?.[0]?.[index];
      const distancia = resultados.distances?.[0]?.[index] || 0;
      // Converte distância para similaridade (1 - distância para cosseno)
      const similaridade = 1 - distancia;

      // Valida se metadados existe antes de acessar
      if (!metadadosBruto) {
        Logger.error(
          `[RepositorioEmbeddingChromaDB] Metadados não encontrados para ID ${id}. Metadados completos:`,
          resultados.metadatas
        );
        throw new Error(`Metadados não encontrados para embedding ${id}`);
      }

      // Log para debug dos primeiros 3 resultados
      if (index < 3) {
        Logger.debug(`[RepositorioEmbeddingChromaDB] Resultado ${index}: ID=${id}, produto_uuid=${lerTexto(metadadosBruto.produto_uuid)}, titulo=${lerTexto(metadadosBruto.titulo)}`);
      }

      return {
        produtoUuid: lerTexto(metadadosBruto.produto_uuid),
        similaridade,
        metadados: mapearMetadadosDominio(metadadosBruto),
      };
    });

    // Filtra pelo limiarSimilaridade — elimina resultados com baixa relevância semântica
    const resultadosFiltrados = todosResultados.filter(
      (r) => r.similaridade >= CONFIGURACAO_RECOMENDACAO.limiarSimilaridade
    );

    Logger.debug(
      `[RepositorioEmbeddingChromaDB] Após filtro por limiarSimilaridade ${CONFIGURACAO_RECOMENDACAO.limiarSimilaridade}: ${todosResultados.length} → ${resultadosFiltrados.length} resultados`
    );

    // Gate de relevância relativa: remove outliers muito abaixo do melhor match
    // da própria query. Preserva sempre ao menos o topo (resultadosFiltrados[0]).
    if (resultadosFiltrados.length <= 1) {
      return resultadosFiltrados;
    }

    const topSimilaridade = Math.max(...resultadosFiltrados.map((r) => r.similaridade));
    const pisoRelevancia = topSimilaridade - CONFIGURACAO_RECOMENDACAO.gapRelevancia;
    const resultadosRelevantes = resultadosFiltrados.filter(
      (r) => r.similaridade >= pisoRelevancia
    );

    Logger.debug(
      `[RepositorioEmbeddingChromaDB] Após gate de relevância (top=${topSimilaridade.toFixed(4)}, piso=${pisoRelevancia.toFixed(4)}): ${resultadosFiltrados.length} → ${resultadosRelevantes.length} resultados`
    );

    return resultadosRelevantes;
  }

  async atualizar(uuid: string, dados: Partial<ICriarProdutoEmbeddingDto>): Promise<IProdutoEmbedding> {
    const colecao = await this.inicializarColecao();

    const existente = await this.buscarPorProdutoUuid(dados.produtoUuid!);
    if (!existente) {
      throw new Error('Embedding não encontrado');
    }

    const embeddingAtualizado = dados.embedding || existente.embedding;
    const metadadosAtualizados = dados.metadados || existente.metadados;

    await colecao.update({
      ids: [uuid],
      embeddings: [embeddingAtualizado],
      metadatas: [
        {
          produto_uuid: dados.produtoUuid || existente.produtoUuid,
          titulo: metadadosAtualizados.titulo,
          autor: metadadosAtualizados.autor,
          categoria: metadadosAtualizados.categoria,
          sinopse: metadadosAtualizados.sinopse || '',
          isbn: metadadosAtualizados.isbn,
          preco: metadadosAtualizados.preco,
        },
      ],
    });

    return {
      ...existente,
      embedding: embeddingAtualizado,
      metadados: metadadosAtualizados,
      atualizadoEm: new Date(),
    };
  }

  async remover(uuid: string): Promise<void> {
    const colecao = await this.inicializarColecao();
    await colecao.delete({
      ids: [uuid],
    });
  }

  async indexarCatalogo(): Promise<number> {
    // Este método é implementado no ServicoIndexacaoProdutos
    // O repositório apenas gerencia a coleção do ChromaDB
    Logger.warn('[RepositorioEmbeddingChromaDB] indexarCatalogo deve ser chamado via ServicoIndexacaoProdutos');
    return 0;
  }

  async limparColecao(): Promise<void> {
    const colecao = await this.inicializarColecao();
    await this.cliente.deleteCollection({ name: this.nomeColecao });
    this.colecao = null;
    Logger.info('[RepositorioEmbeddingChromaDB] Coleção limpa');
  }

  async verificarConexao(): Promise<boolean> {
    try {
      // Usa heartbeat para verificação de conexão (disponível na API v3)
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na verificação de conexão')), 5000);
      });
      
      await Promise.race([
        this.cliente.heartbeat(),
        timeoutPromise
      ]);
      
      return true;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.warn(`[RepositorioEmbeddingChromaDB] Verificação de conexão falhou: ${mensagem}`);
      return false;
    }
  }

  /**
   * Conta o número de documentos na coleção
   * 
   * @returns Número de documentos na coleção
   */
  async contarDocumentos(): Promise<number> {
    try {
      const colecao = await this.inicializarColecao();
      const resultado = await colecao.count();
      Logger.info(`[RepositorioEmbeddingChromaDB] Coleção possui ${resultado} documentos`);
      return resultado;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.warn(`[RepositorioEmbeddingChromaDB] Erro ao contar documentos: ${mensagem}`);
      return 0;
    }
  }
}