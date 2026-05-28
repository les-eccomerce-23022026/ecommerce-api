import { ChromaClient, Collection } from 'chromadb';
import { v4 as uuidv4 } from 'uuid';
import {
  IRepositorioEmbedding,
  ICriarProdutoEmbeddingDto,
} from '../../domain/repositories/IRepositorioEmbedding';
import { IProdutoEmbedding } from '../../domain/entities/IProdutoEmbedding.entity';
import { Logger } from '@/shared/utils/Logger.util';

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
  limiarSimilaridade: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.7'),

  // Multiplicador de busca (recupera mais candidatos para filtrar pelo limiar depois)
  multiplicadorBusca: parseInt(process.env.RAG_SEARCH_MULTIPLIER || '2', 10),

  // Fatores de personalização por perfil do cliente
  personalizacao: {
    boostCategoria: parseFloat(process.env.RAG_CATEGORY_BOOST || '1.2'),
    boostAutor: parseFloat(process.env.RAG_AUTHOR_BOOST || '1.3'),
    boostPreco: parseFloat(process.env.RAG_PRICE_BOOST || '1.1'),
  },
} as const;

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
    const chromaPath = process.env.CHROMADB_PATH || 'http://localhost:8000';
    this.cliente = new ChromaClient({
      path: chromaPath,
    });
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
        },
        // Configuração de embedding function do Gemini
        // NOTA: ChromaDB HTTP mode não suporta embedding function nativa
        // Embeddings são gerados externamente via AdapterLangChainGemini
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
    const metadados = resultados.metadatas?.[0] as any;

    return {
      id: 0,
      uuid: id,
      produtoUuid: metadados.produto_uuid,
      embedding,
      metadados: {
        titulo: metadados.titulo,
        autor: metadados.autor,
        categoria: metadados.categoria,
        sinopse: metadados.sinopse,
        isbn: metadados.isbn,
        preco: metadados.preco,
      },
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    };
  }

  async buscarSimilares(
    queryEmbedding: number[],
    limite: number
  ): Promise<{ produtoUuid: string; similaridade: number; metadados: any }[]> {
    const colecao = await this.inicializarColecao();

    // Aplica multiplicadorBusca para recuperar mais candidatos e filtrar pelo limiarSimilaridade depois
    const nResultados = limite * CONFIGURACAO_RECOMENDACAO.multiplicadorBusca;

    Logger.debug(
      `[RepositorioEmbeddingChromaDB] Buscando similares | quantidadeResultados=${limite} | nResults=${nResultados} (×${CONFIGURACAO_RECOMENDACAO.multiplicadorBusca}) | limiarSimilaridade=${CONFIGURACAO_RECOMENDACAO.limiarSimilaridade}`
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
    const todosResultados = resultados.ids[0].map((id, index) => {
      const metadados = resultados.metadatas?.[0]?.[index] as any;
      const distancia = resultados.distances?.[0]?.[index] || 0;
      // Converte distância para similaridade (1 - distância para cosseno)
      const similaridade = 1 - distancia;

      // Valida se metadados existe antes de acessar
      if (!metadados) {
        Logger.error(
          `[RepositorioEmbeddingChromaDB] Metadados não encontrados para ID ${id}. Metadados completos:`,
          resultados.metadatas
        );
        throw new Error(`Metadados não encontrados para embedding ${id}`);
      }

      return {
        produtoUuid: metadados.produto_uuid,
        similaridade,
        metadados: {
          titulo: metadados.titulo,
          autor: metadados.autor,
          categoria: metadados.categoria,
          sinopse: metadados.sinopse,
          isbn: metadados.isbn,
          preco: metadados.preco,
        },
      };
    });

    // Filtra pelo limiarSimilaridade — elimina resultados com baixa relevância semântica
    const resultadosFiltrados = todosResultados.filter(
      (r) => r.similaridade >= CONFIGURACAO_RECOMENDACAO.limiarSimilaridade
    );

    Logger.debug(
      `[RepositorioEmbeddingChromaDB] Após filtro por limiarSimilaridade ${CONFIGURACAO_RECOMENDACAO.limiarSimilaridade}: ${todosResultados.length} → ${resultadosFiltrados.length} resultados`
    );

    return resultadosFiltrados;
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
      metadados: [
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
}