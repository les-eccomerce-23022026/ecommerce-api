import { ServicoLivros } from '@/modules/livros/servicoLivros';
import { IRepositorioEmbedding } from './IRepositorioEmbedding';
import { ServicoGeracaoEmbedding } from './servicoGeracaoEmbedding';
import { IAdapterEmbedding } from './IAdapterEmbedding';
import { Logger } from '@/shared/utils/Logger.util';
import type { ILivroCatalogoDto } from '@/modules/livros/ILivroCatalogo.dto';

/**
 * Interface para serviço de livros (DIP)
 */
export interface IServicoLivros {
  listarParaAdmin(limite: number): Promise<ILivroCatalogoDto[]>;
  obterPorUuid(uuid: string): Promise<ILivroCatalogoDto | null>;
}

/**
 * Serviço de Application para Indexação de Produtos
 *
 * Responsável por indexar todos os produtos do catálogo no ChromaDB
 * para busca semântica. Utiliza chunking automático via ServicoGeracaoEmbedding
 * para produtos com sinopses longas, armazenando múltiplos embeddings por
 * produto quando necessário para melhor cobertura semântica no RAG.
 * 
 * Processamento paralelo:
 * - Livros são processados em batches de 5 (concorrência controlada)
 * - Chunks de cada livro são processados em paralelo
 * - Limitação de concorrência para evitar rate limiting da API Gemini
 */
export class ServicoIndexacaoProdutos {
  private readonly TAMANHO_BATCH_LIVROS = 5; // Processa 5 livros em paralelo
  private readonly MAX_CONCORRENCIA_EMBEDDINGS = 3; // Max 3 embeddings simultâneos por livro

  constructor(
    private servicoLivros: IServicoLivros,
    private repositorioEmbedding: IRepositorioEmbedding,
    private adapterEmbedding: IAdapterEmbedding,
    private servicoGeracaoEmbedding: ServicoGeracaoEmbedding
  ) {}

  /**
   * Indexa todos os produtos do catálogo no ChromaDB.
   *
   * Processamento paralelo:
   * - Livros são processados em batches de 5 (concorrência controlada)
   * - Chunks de cada livro são processados em paralelo
   * - Limitação de concorrência para evitar rate limiting da API Gemini
   *
   * @returns Total de produtos indexados com sucesso (independente do nº de chunks)
   */
  async indexarCatalogo(): Promise<number> {
    const inicio = Date.now();

    try {
      Logger.info('[ServicoIndexacaoProdutos] Iniciando indexação do catálogo com processamento paralelo');

      const livros = await this.servicoLivros.listarParaAdmin(1000);
      Logger.info(`[ServicoIndexacaoProdutos] ${livros.length} livros encontrados`);

      if (livros.length === 0) {
        Logger.warn('[ServicoIndexacaoProdutos] Nenhum livro para indexar');
        return 0;
      }

      let indexados = 0;
      let totalChunksGerados = 0;

      // Processa livros em batches para controlar concorrência
      for (let i = 0; i < livros.length; i += this.TAMANHO_BATCH_LIVROS) {
        const batch = livros.slice(i, i + this.TAMANHO_BATCH_LIVROS);
        
        Logger.info(`[ServicoIndexacaoProdutos] Processando batch ${Math.floor(i / this.TAMANHO_BATCH_LIVROS) + 1} (${batch.length} livros)`);

        // Processa todos os livros do batch em paralelo
        const resultados = await Promise.allSettled(
          batch.map((livro) => this.indexarLivro(livro))
        );

        // Conta sucessos e falhas
        for (const resultado of resultados) {
          if (resultado.status === 'fulfilled') {
            totalChunksGerados += resultado.value;
            indexados++;
          } else {
            const mensagem = resultado.reason instanceof Error ? resultado.reason.message : String(resultado.reason);
            Logger.error(`[ServicoIndexacaoProdutos] Erro ao indexar livro: ${mensagem}`);
          }
        }
      }

      const tempoExecucao = Date.now() - inicio;
      Logger.info(
        `[ServicoIndexacaoProdutos] Indexação concluída: ${indexados}/${livros.length} livros` +
          ` | ${totalChunksGerados} embeddings gerados | ${tempoExecucao}ms` +
          ` | ${(tempoExecucao / 1000).toFixed(2)}s`
      );

      return indexados;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoIndexacaoProdutos] Erro na indexação: ${mensagem}`);
      throw erro;
    }
  }

  /**
   * Indexa um único produto (usado após criação/atualização).
   * Aplica chunking automaticamente se a sinopse for longa.
   *
   * @param produtoUuid - UUID público do produto a indexar
   */
  async indexarProduto(produtoUuid: string): Promise<void> {
    try {
      const livro = await this.servicoLivros.obterPorUuid(produtoUuid);
      if (!livro) {
        throw new Error(`Livro ${produtoUuid} não encontrado`);
      }

      const chunksGerados = await this.indexarLivro(livro);

      Logger.info(
        `[ServicoIndexacaoProdutos] Livro ${produtoUuid} indexado com sucesso` +
          ` (${chunksGerados} chunk(s))`
      );
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(
        `[ServicoIndexacaoProdutos] Erro ao indexar produto ${produtoUuid}: ${mensagem}`
      );
      throw erro;
    }
  }

  /**
   * Remove um produto do índice.
   *
   * Nota: remove apenas o primeiro embedding encontrado pelo produtoUuid.
   * Em produtos com múltiplos chunks, eventuais chunks órfãos serão removidos
   * em operação de reindexação completa (limparColecao + indexarCatalogo).
   *
   * @param produtoUuid - UUID público do produto a remover
   */
  async removerProduto(produtoUuid: string): Promise<void> {
    try {
      const embedding = await this.repositorioEmbedding.buscarPorProdutoUuid(produtoUuid);
      if (embedding) {
        await this.repositorioEmbedding.remover(embedding.uuid);
        Logger.info(`[ServicoIndexacaoProdutos] Livro ${produtoUuid} removido do índice`);
      }
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(
        `[ServicoIndexacaoProdutos] Erro ao remover produto ${produtoUuid}: ${mensagem}`
      );
      throw erro;
    }
  }

  /**
   * Gera e armazena embeddings de um livro no ChromaDB.
   *
   * Para sinopses longas, aplica chunking automático (via ServicoGeracaoEmbedding)
   * e armazena um embedding por chunk, todos associados ao mesmo produtoUuid.
   * Método privado reutilizado por indexarCatalogo() e indexarProduto().
   * 
   * Processamento paralelo:
   * - Chunks são processados em paralelo com limitação de concorrência
   * - Evita rate limiting da API Gemini
   *
   * @param livro - Dados do livro a indexar
   * @returns Número de chunks/embeddings gerados para o livro
   */
  private async indexarLivro(livro: ILivroCatalogoDto): Promise<number> {
    const categoriaPrincipal =
      livro.categoria ?? livro.categorias?.[0] ?? 'Sem categoria';
    const tags = livro.tags ?? livro.categorias?.map((c) => c.toLowerCase().replace(/\s+/g, '_'));

    const metadados = {
      titulo: livro.titulo,
      autor: livro.autor,
      categoria: categoriaPrincipal,
      sinopse: livro.sinopse,
      isbn: livro.isbn,
      preco: livro.preco,
      numeroPaginas: livro.numeroPaginas,
      anoPublicacao: livro.anoPublicacao,
      idioma: livro.idioma ?? 'português',
      tags,
    };

    // Obtém chunks — 1 para sinopses curtas, N para longas (chunking automático)
    const chunks = this.servicoGeracaoEmbedding.gerarChunksDoProduto(metadados);

    // Processa chunks em paralelo com limitação de concorrência
    const embeddings = await this.processarChunksEmParalelo(chunks);

    // Armazena todos os embeddings em paralelo
    await Promise.all(
      embeddings.map((embedding) =>
        this.repositorioEmbedding.criar({
          produtoUuid: livro.uuid,
          embedding,
          metadados: {
            titulo: metadados.titulo,
            autor: metadados.autor,
            categoria: metadados.categoria,
            sinopse: metadados.sinopse,
            isbn: metadados.isbn,
            preco: metadados.preco,
            numeroPaginas: metadados.numeroPaginas,
            anoPublicacao: metadados.anoPublicacao,
            idioma: metadados.idioma,
            tags: metadados.tags?.join(','),
          },
        })
      )
    );

    return chunks.length;
  }

  /**
   * Processa chunks em paralelo com limitação de concorrência.
   * Evita rate limiting da API Gemini.
   * 
   * @param chunks - Array de chunks para gerar embeddings
   * @returns Array de embeddings gerados
   */
  private async processarChunksEmParalelo(chunks: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    // Processa chunks em batches controlados
    for (let i = 0; i < chunks.length; i += this.MAX_CONCORRENCIA_EMBEDDINGS) {
      const batch = chunks.slice(i, i + this.MAX_CONCORRENCIA_EMBEDDINGS);
      
      // Gera embeddings do batch em paralelo
      const batchEmbeddings = await Promise.all(
        batch.map((chunk) => this.adapterEmbedding.gerarEmbedding(chunk))
      );
      
      embeddings.push(...batchEmbeddings);
    }
    
    return embeddings;
  }
}