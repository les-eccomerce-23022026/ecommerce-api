import { ServicoLivros } from '@/modules/livros/servicoLivros';
import { Logger } from '@/shared/utils/Logger.util';

/** TTL do cache de produtos em milissegundos (5 minutos) */
const TTL_CACHE_PRODUTOS_MS = 5 * 60 * 1000;

/** Quantidade máxima de produtos a carregar no cache */
const LIMITE_PRODUTOS_CACHE = 10_000;

/**
 * Estatísticas do cache para diagnóstico e monitoramento.
 */
export interface EstatisticasCacheProdutos {
  /** Quantidade de UUIDs armazenados no cache */
  tamanho: number;
  /** Tempo restante de validade em milissegundos (0 se expirado/vazio) */
  ttlRestanteMs: number;
  /** Se o cache está válido e pode ser usado sem ir ao banco */
  valido: boolean;
}

/**
 * Serviço de Cache de Produtos Existentes
 *
 * Mantém em memória o conjunto de UUIDs de produtos ativos do catálogo,
 * com TTL de 5 minutos para evitar consultas frequentes ao banco.
 *
 * Benefícios:
 * - Reduz latência das requisições de recomendação (validação anti-alucinação)
 * - Evita N+1 de consultas ao catálogo por requisição de IA
 * - Mantém dados frescos sem sobrecarga de consultas desnecessárias
 *
 * @see RN-IA-001 — Motor de recomendação deve retornar apenas produtos existentes no catálogo
 */
export class ServicoCacheProdutos {
  private cache: Set<string> | null = null;
  private ultimaAtualizacaoMs: number | null = null;

  constructor(private readonly servicoLivros: ServicoLivros) {}

  /**
   * Retorna o conjunto de UUIDs de produtos existentes no BD.
   *
   * Usa cache em memória com TTL de 5 minutos.
   * Ao expirar (ou na primeira chamada), recarrega automaticamente do banco.
   */
  async obterProdutosExistentes(): Promise<Set<string>> {
    if (this.estaValido()) {
      Logger.debug(
        `[ServicoCacheProdutos] Cache hit — ${this.cache!.size} produtos em memória`
      );
      return this.cache!;
    }

    await this.atualizar();
    return this.cache!;
  }

  /**
   * Força a atualização imediata do cache, ignorando o TTL.
   * Útil após reindexação do catálogo ou inclusão em massa de produtos.
   */
  async atualizarAgora(): Promise<void> {
    await this.atualizar();
  }

  /**
   * Invalida o cache, forçando a próxima chamada a buscar do banco.
   */
  invalidar(): void {
    this.cache = null;
    this.ultimaAtualizacaoMs = null;
    Logger.debug('[ServicoCacheProdutos] Cache invalidado');
  }

  /**
   * Retorna estatísticas do estado atual do cache.
   * Útil para diagnóstico e monitoramento de performance.
   */
  obterEstatisticas(): EstatisticasCacheProdutos {
    const valido = this.estaValido();
    const ttlRestanteMs =
      valido && this.ultimaAtualizacaoMs !== null
        ? TTL_CACHE_PRODUTOS_MS - (Date.now() - this.ultimaAtualizacaoMs)
        : 0;

    return {
      tamanho: this.cache?.size ?? 0,
      ttlRestanteMs,
      valido,
    };
  }

  private estaValido(): boolean {
    return (
      this.cache !== null &&
      this.ultimaAtualizacaoMs !== null &&
      Date.now() - this.ultimaAtualizacaoMs < TTL_CACHE_PRODUTOS_MS
    );
  }

  private async atualizar(): Promise<void> {
    try {
      const livros = await this.servicoLivros.listarParaAdmin(LIMITE_PRODUTOS_CACHE);
      this.cache = new Set(livros.map((livro) => livro.uuid));
      this.ultimaAtualizacaoMs = Date.now();
      Logger.info(
        `[ServicoCacheProdutos] Cache atualizado — ${this.cache.size} produtos carregados`
      );
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoCacheProdutos] Erro ao atualizar cache: ${mensagem}`);
      // Se o cache ainda não existe (primeiro carregamento falhou), inicializa vazio
      // para não bloquear o fluxo. ultimaAtualizacaoMs não é atualizado para forçar
      // nova tentativa na próxima chamada.
      if (this.cache === null) {
        this.cache = new Set<string>();
      }
    }
  }
}
