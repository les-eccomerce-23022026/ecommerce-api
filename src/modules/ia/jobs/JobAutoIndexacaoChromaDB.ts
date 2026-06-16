import { Logger } from '@/shared/utils/Logger.util';
import { ServicoIndexacaoProdutos } from '../servicoIndexacaoProdutos';
import { RepositorioEmbeddingChromaDB } from '../repositorioEmbeddingChromaDB';
import { FactoryEmbedding } from '../factoryEmbedding';
import { ServicoGeracaoEmbedding } from '../servicoGeracaoEmbedding';
import { ServicoLivros } from '@/modules/livros/servicoLivros';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';
import { RepositorioLivrosBulkInsert } from '@/modules/livros/repositorioLivrosBulkInsert';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';

/**
 * Job de Auto-Indexação do ChromaDB no Startup
 * 
 * Verifica se o ChromaDB precisa ser indexado e realiza a indexação
 * automaticamente quando a aplicação é iniciada. Isso garante que
 * o sistema esteja pronto para busca semântica sem intervenção manual.
 * 
 * Estratégia:
 * - Verifica se a coleção existe e tem produtos
 * - Se estiver vazia, indexa o catálogo completo
 * - Se já tiver dados, pula a indexação
 * - Executa de forma assíncrona para não bloquear o startup
 */
export class JobAutoIndexacaoChromaDB {
  private readonly NOME_COLECAO = 'produtos_embeddings';
  private readonly LIMITE_MINIMO_PRODUTOS = 10; // Considera vazio se tiver menos de 10 produtos

  constructor() {
    // Dependências serão inicializadas no método executar
  }

  /**
   * Executa a auto-indexação do ChromaDB
   */
  async executar(): Promise<void> {
    // Desabilitar indexação automática para testes rápidos
    if (process.env.DISABLE_EMBEDDINGS === 'true') {
      Logger.info('[JobAutoIndexacaoChromaDB] Indexação desabilitada via DISABLE_EMBEDDINGS=true');
      return;
    }

    try {
      Logger.info('[JobAutoIndexacaoChromaDB] Iniciando verificação do ChromaDB...');

      // Inicializar dependências
      const conexaoPostgres = ConexaoPostgres.obterInstancia();
      const pool = conexaoPostgres['poolProducao'];
      
      const repositorioEmbedding = new RepositorioEmbeddingChromaDB();
      const adapterEmbedding = FactoryEmbedding.obterInstancia();
      const servicoGeracaoEmbedding = new ServicoGeracaoEmbedding();
      
      const repoLivros = new RepositorioLivrosPostgres(conexaoPostgres);
      const bulkInsertLivros = new RepositorioLivrosBulkInsert(conexaoPostgres);
      const servicoLivros = new ServicoLivros(repoLivros, bulkInsertLivros);

      const servicoIndexacao = new ServicoIndexacaoProdutos(
        servicoLivros,
        repositorioEmbedding,
        adapterEmbedding,
        servicoGeracaoEmbedding
      );

      // Verificar se ChromaDB já tem dados
      const precisaIndexar = await this.verificarSePrecisaIndexar(repositorioEmbedding);

      if (!precisaIndexar) {
        Logger.info('[JobAutoIndexacaoChromaDB] ChromaDB já possui dados, pulando indexação');
        return;
      }

      Logger.info('[JobAutoIndexacaoChromaDB] ChromaDB vazio, iniciando indexação...');
      
      // Executar indexação
      const totalIndexados = await servicoIndexacao.indexarCatalogo();
      
      Logger.info(`[JobAutoIndexacaoChromaDB] Indexacao concluida: ${totalIndexados} produtos indexados`);
    } catch (erro) {
      Logger.error('[JobAutoIndexacaoChromaDB] Erro na auto-indexacao', { erro: String(erro) });
      // Nao lanca erro para nao impedir o startup da aplicacao
      // A indexacao pode ser feita manualmente depois se necessario
    }
  }

  /**
   * Verifica se o ChromaDB precisa ser indexado
   * 
   * @param repositorio - Repositório de embeddings
   * @returns true se precisa indexar, false caso contrário
   */
  private async verificarSePrecisaIndexar(
    repositorio: RepositorioEmbeddingChromaDB
  ): Promise<boolean> {
    try {
      // Tenta verificar conexao com ChromaDB
      const conexaoOk = await repositorio.verificarConexao();
      
      if (!conexaoOk) {
        Logger.warn('[JobAutoIndexacaoChromaDB] ChromaDB nao esta conectado, assumindo que precisa indexar');
        return true;
      }
      
      // Se estiver conectado, verifica quantos documentos existem
      Logger.info('[JobAutoIndexacaoChromaDB] ChromaDB conectado, verificando quantidade de documentos');
      
      const quantidadeDocumentos = await repositorio.contarDocumentos();
      
      // Se já tiver documentos, não precisa reindexar
      if (quantidadeDocumentos >= this.LIMITE_MINIMO_PRODUTOS) {
        Logger.info(`[JobAutoIndexacaoChromaDB] ChromaDB já possui ${quantidadeDocumentos} documentos, pulando indexação`);
        return false;
      }
      
      Logger.info(`[JobAutoIndexacaoChromaDB] ChromaDB possui apenas ${quantidadeDocumentos} documentos (mínimo: ${this.LIMITE_MINIMO_PRODUTOS}), será indexado`);
      return true;
    } catch (erro) {
      Logger.warn('[JobAutoIndexacaoChromaDB] Erro ao verificar documentos, assumindo que precisa indexar');
      // Se der erro na verificacao, assume que precisa indexar
      return true;
    }
  }

  /**
   * Executa a auto-indexação de forma assíncrona (não bloqueia o startup)
   */
  executarAssincrono(): void {
    // Pequeno delay para garantir que a aplicação já esteja pronta
    setTimeout(() => {
      this.executar().catch((erro) => {
        Logger.error('[JobAutoIndexacaoChromaDB] Erro na execucao assincrona', { erro: String(erro) });
      });
    }, 5000); // 5 segundos de delay
  }
}
