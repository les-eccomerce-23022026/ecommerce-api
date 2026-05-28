import { ServicoLivros } from '@/modules/livros/servicoLivros';
import { RepositorioEmbeddingChromaDB } from '../../infrastructure/repositories/RepositorioEmbeddingChromaDB';
import { AdapterLangChainGemini } from '../../infrastructure/config/AdapterLangChainGemini';
import { ServicoGeracaoEmbedding } from '../../domain/services/ServicoGeracaoEmbedding';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Serviço de Application para Indexação de Produtos
 * 
 * Responsável por indexar todos os produtos do catálogo no ChromaDB
 * para busca semântica.
 */
export class ServicoIndexacaoProdutos {
  constructor(
    private servicoLivros: ServicoLivros,
    private repositorioEmbedding: RepositorioEmbeddingChromaDB,
    private adapterLangChain: AdapterLangChainGemini,
    private servicoGeracaoEmbedding: ServicoGeracaoEmbedding
  ) {}

  /**
   * Indexa todos os produtos do catálogo no ChromaDB
   */
  async indexarCatalogo(): Promise<number> {
    const inicio = Date.now();

    try {
      Logger.info('[ServicoIndexacaoProdutos] Iniciando indexação do catálogo');

      // Busca todos os livros do catálogo
      const livros = await this.servicoLivros.listarParaAdmin(1000);
      Logger.info(`[ServicoIndexacaoProdutos] ${livros.length} livros encontrados`);

      if (livros.length === 0) {
        Logger.warn('[ServicoIndexacaoProdutos] Nenhum livro para indexar');
        return 0;
      }

      // Prepara dados para geração de embeddings
      const textosParaEmbedding = livros.map((livro) =>
        this.servicoGeracaoEmbedding.gerarTextoProduto({
          titulo: livro.titulo,
          autor: livro.autor,
          categoria: livro.categoria,
          sinopse: livro.sinopse,
          isbn: livro.isbn,
        })
      );

      // Gera embeddings em lote
      Logger.info('[ServicoIndexacaoProdutos] Gerando embeddings...');
      const embeddings = await this.adapterLangChain.gerarEmbeddingsLote(textosParaEmbedding);
      Logger.info(`[ServicoIndexacaoProdutos] ${embeddings.length} embeddings gerados`);

      // Salva embeddings no ChromaDB
      let indexados = 0;
      for (let i = 0; i < livros.length; i++) {
        try {
          await this.repositorioEmbedding.criar({
            produtoUuid: livros[i].uuid,
            embedding: embeddings[i],
            metadados: {
              titulo: livros[i].titulo,
              autor: livros[i].autor,
              categoria: livros[i].categoria,
              sinopse: livros[i].sinopse,
              isbn: livros[i].isbn,
              preco: livros[i].preco,
            },
          });
          indexados++;
        } catch (erro) {
          const mensagem = erro instanceof Error ? erro.message : String(erro);
          Logger.error(`[ServicoIndexacaoProdutos] Erro ao indexar livro ${livros[i].uuid}: ${mensagem}`);
        }
      }

      const tempoExecucao = Date.now() - inicio;
      Logger.info(
        `[ServicoIndexacaoProdutos] Indexação concluída: ${indexados}/${livros.length} livros em ${tempoExecucao}ms`
      );

      return indexados;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoIndexacaoProdutos] Erro na indexação: ${mensagem}`);
      throw erro;
    }
  }

  /**
   * Indexa um único produto (usado após criação/atualização)
   */
  async indexarProduto(produtoUuid: string): Promise<void> {
    try {
      const livro = await this.servicoLivros.obterPorUuid(produtoUuid);
      if (!livro) {
        throw new Error(`Livro ${produtoUuid} não encontrado`);
      }

      // Gera texto para embedding
      const texto = this.servicoGeracaoEmbedding.gerarTextoProduto({
        titulo: livro.titulo,
        autor: livro.autor,
        categoria: livro.categoria,
        sinopse: livro.sinopse,
        isbn: livro.isbn,
      });

      // Gera embedding
      const embedding = await this.adapterLangChain.gerarEmbedding(texto);

      // Salva no ChromaDB
      await this.repositorioEmbedding.criar({
        produtoUuid: livro.uuid,
        embedding,
        metadados: {
          titulo: livro.titulo,
          autor: livro.autor,
          categoria: livro.categoria,
          sinopse: livro.sinopse,
          isbn: livro.isbn,
          preco: livro.preco,
        },
      });

      Logger.info(`[ServicoIndexacaoProdutos] Livro ${produtoUuid} indexado com sucesso`);
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoIndexacaoProdutos] Erro ao indexar produto ${produtoUuid}: ${mensagem}`);
      throw erro;
    }
  }

  /**
   * Remove um produto do índice
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
      Logger.error(`[ServicoIndexacaoProdutos] Erro ao remover produto ${produtoUuid}: ${mensagem}`);
      throw erro;
    }
  }
}