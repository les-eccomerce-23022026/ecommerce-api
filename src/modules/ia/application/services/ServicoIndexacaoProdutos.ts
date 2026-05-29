import { ServicoLivros } from '@/modules/livros/servicoLivros';
import { IRepositorioEmbedding } from '../../domain/repositories/IRepositorioEmbedding';
import { ServicoGeracaoEmbedding } from '../../domain/services/ServicoGeracaoEmbedding';
import { IAdapterEmbedding } from '../../domain/interfaces/IAdapterEmbedding';
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
 */
export class ServicoIndexacaoProdutos {
  constructor(
    private servicoLivros: IServicoLivros,
    private repositorioEmbedding: IRepositorioEmbedding,
    private adapterEmbedding: IAdapterEmbedding,
    private servicoGeracaoEmbedding: ServicoGeracaoEmbedding
  ) {}

  /**
   * Indexa todos os produtos do catálogo no ChromaDB.
   *
   * Para cada livro:
   * - Gera chunks do texto (1 chunk para sinopses curtas, N chunks para longas)
   * - Gera embedding individual por chunk via Gemini
   * - Armazena cada embedding com o mesmo produtoUuid no ChromaDB
   *
   * @returns Total de produtos indexados com sucesso (independente do nº de chunks)
   */
  async indexarCatalogo(): Promise<number> {
    const inicio = Date.now();

    try {
      Logger.info('[ServicoIndexacaoProdutos] Iniciando indexação do catálogo com chunking');

      const livros = await this.servicoLivros.listarParaAdmin(1000);
      Logger.info(`[ServicoIndexacaoProdutos] ${livros.length} livros encontrados`);

      if (livros.length === 0) {
        Logger.warn('[ServicoIndexacaoProdutos] Nenhum livro para indexar');
        return 0;
      }

      let indexados = 0;
      let totalChunksGerados = 0;

      for (const livro of livros) {
        try {
          const chunksGerados = await this.indexarLivro(livro);

          Logger.debug(
            `[ServicoIndexacaoProdutos] "${livro.titulo}": ${chunksGerados} chunk(s)`
          );

          totalChunksGerados += chunksGerados;
          indexados++;
        } catch (erro) {
          const mensagem = erro instanceof Error ? erro.message : String(erro);
          Logger.error(
            `[ServicoIndexacaoProdutos] Erro ao indexar livro ${livro.uuid}: ${mensagem}`
          );
        }
      }

      const tempoExecucao = Date.now() - inicio;
      Logger.info(
        `[ServicoIndexacaoProdutos] Indexação concluída: ${indexados}/${livros.length} livros` +
          ` | ${totalChunksGerados} embeddings gerados | ${tempoExecucao}ms`
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

    // Gera e armazena embedding para cada chunk individualmente
    for (let indiceChunk = 0; indiceChunk < chunks.length; indiceChunk++) {
      const embedding = await this.adapterEmbedding.gerarEmbedding(chunks[indiceChunk]);

      await this.repositorioEmbedding.criar({
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
      });
    }

    return chunks.length;
  }
}