import { ChromaClient, Collection } from 'chromadb';
import { v4 as uuidv4 } from 'uuid';
import {
  IRepositorioEmbedding,
  ICriarProdutoEmbeddingDto,
} from '../../domain/repositories/IRepositorioEmbedding';
import { IProdutoEmbedding } from '../../domain/entities/IProdutoEmbedding.entity';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Implementação do Repositório de Embeddings usando ChromaDB
 * 
 * Responsável por gerenciar embeddings de produtos no ChromaDB para
 * busca vetorial semântica.
 */
export class RepositorioEmbeddingChromaDB implements IRepositorioEmbedding {
  private cliente: ChromaClient;
  private colecao: Collection | null = null;
  private readonly NOME_COLECAO = 'produtos_livraria';

  constructor() {
    // Inicializa cliente ChromaDB com persistência local
    this.cliente = new ChromaClient({
      path: process.env.CHROMADB_PATH || './chroma_db',
    });
  }

  /**
   * Inicializa a coleção do ChromaDB
   */
  private async inicializarColecao(): Promise<Collection> {
    if (this.colecao) {
      return this.colecao;
    }

    try {
      // Tenta obter coleção existente
      this.colecao = await this.cliente.getCollection({
        name: this.NOME_COLECAO,
      });
      Logger.info('[RepositorioEmbeddingChromaDB] Coleção existente carregada');
    } catch (erro) {
      // Se não existir, cria nova
      this.colecao = await this.cliente.createCollection({
        name: this.NOME_COLECAO,
        metadata: { descricao: 'Embeddings de produtos da livraria' },
      });
      Logger.info('[RepositorioEmbeddingChromaDB] Nova coleção criada');
    }

    return this.colecao;
  }

  async criar(dados: ICriarProdutoEmbeddingDto): Promise<IProdutoEmbedding> {
    const colecao = await this.inicializarColecao();
    const uuid = uuidv4();

    await colecao.add({
      ids: [uuid],
      embeddings: [dados.embedding],
      metadatas: [
        {
          produto_uuid: dados.produtoUuid,
          titulo: dados.metadados.titulo,
          autor: dados.metadados.autor,
          categoria: dados.metadados.categoria,
          sinopse: dados.metadados.sinopse || '',
          isbn: dados.metadados.isbn,
          preco: dados.metadados.preco,
        },
      ],
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

    const resultados = await colecao.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limite,
    });

    if (!resultados.ids[0] || resultados.ids[0].length === 0) {
      return [];
    }

    return resultados.ids[0].map((id, index) => {
      const metadados = resultados.metadados?.[0]?.[index] as any;
      const distancia = resultados.distances?.[0]?.[index] || 0;
      // Converte distância para similaridade (1 - distância para cosseno)
      const similaridade = 1 - distancia;

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
    await this.cliente.deleteCollection({ name: this.NOME_COLECAO });
    this.colecao = null;
    Logger.info('[RepositorioEmbeddingChromaDB] Coleção limpa');
  }
}