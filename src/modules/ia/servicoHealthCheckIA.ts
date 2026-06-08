import { Logger } from '@/shared/utils/Logger.util';
import { IRepositorioEmbedding } from './IRepositorioEmbedding';
import { IAdapterEmbedding } from './IAdapterEmbedding';

// ─── Interfaces públicas ──────────────────────────────────────────────────────

/**
 * Resultado de saúde de uma dependência individual do módulo de IA.
 */
export interface ISaudeIaDependencia {
  /** Indica se a dependência está operacional */
  ok: boolean;
  /** Mensagem descritiva em caso de falha */
  mensagem?: string;
  /** Latência observada na verificação, em milissegundos */
  latencyMs?: number;
}

/**
 * Resultado agregado de saúde do módulo de IA.
 *
 * Status possíveis:
 * - `ok`       → ChromaDB e Gemini operacionais
 * - `degraded` → exatamente uma dependência falhou
 * - `down`     → ambas as dependências falharam
 */
export interface ISaudeIaResultado {
  status: 'ok' | 'degraded' | 'down';
  /** ISO 8601 do momento da verificação */
  timestamp: string;
  dependencias: {
    chromadb: ISaudeIaDependencia;
    gemini: ISaudeIaDependencia;
  };
}

// ─── Constantes internas ──────────────────────────────────────────────────────

const PREFIXO_LOG = '[ServicoHealthCheckIA]';

/** Tempo máximo de espera por verificação, em milissegundos */
const TIMEOUT_VERIFICACAO_MS = 2000;

/** Texto mínimo enviado ao Gemini como requisição de ping */
const TEXTO_PING_GEMINI = 'ping';

/**
 * Chave composta para resolução de status.
 * Formato: '<chromadb>-<gemini>', onde cada parte é 'ok' ou 'falhou'.
 */
type ChaveStatus = 'ok-ok' | 'ok-falhou' | 'falhou-ok' | 'falhou-falhou';

/**
 * Tabela de despacho para resolução do status agregado do módulo de IA.
 * Substitui switch/case conforme regra U2 (OCP — SOLID).
 *
 * Leitura: chave = '<resultado ChromaDB>-<resultado Gemini>'
 */
const TABELA_STATUS: Record<ChaveStatus, ISaudeIaResultado['status']> = {
  'ok-ok':          'ok',
  'ok-falhou':      'degraded',
  'falhou-ok':      'degraded',
  'falhou-falhou':  'down',
};

// ─── Helpers de módulo ────────────────────────────────────────────────────────

/**
 * Envolve uma Promise com um limite de tempo explícito.
 * Rejeita com mensagem descritiva se o timeout for atingido antes da resolução.
 *
 * @param promessa    - Promise a monitorar
 * @param ms          - Limite de tempo em milissegundos
 * @param nomeServico - Nome do serviço para contexto na mensagem de erro
 */
function comTimeout<T>(promessa: Promise<T>, ms: number, nomeServico: string): Promise<T> {
  const rejeicaoTimeout = new Promise<T>((_, rejeitar) =>
    setTimeout(
      () => rejeitar(new Error(`Timeout de ${ms}ms atingido ao verificar ${nomeServico}`)),
      ms,
    ),
  );
  return Promise.race([promessa, rejeicaoTimeout]);
}

/**
 * Constrói a chave de despacho a partir dos resultados individuais.
 */
function resolverChaveStatus(
  chromadb: ISaudeIaDependencia,
  gemini: ISaudeIaDependencia,
): ChaveStatus {
  const parteChromadb = chromadb.ok ? 'ok' : 'falhou';
  const parteGemini   = gemini.ok   ? 'ok' : 'falhou';
  return `${parteChromadb}-${parteGemini}` as ChaveStatus;
}

// ─── Classe principal ─────────────────────────────────────────────────────────

/**
 * Serviço de Health Check dedicado ao módulo de IA.
 *
 * Verifica a prontidão das dependências externas (ChromaDB e Gemini) antes de
 * o sistema processar requisições de recomendação ou embeddings.
 *
 * Responsabilidades:
 * - Verificar ChromaDB via `IRepositorioEmbedding.verificarConexao()`
 * - Verificar Gemini via `IAdapterEmbedding.gerarEmbedding()` (ping leve)
 * - Executar ambos os checks em paralelo para minimizar latência total
 * - Medir e reportar a latência de cada dependência individualmente
 * - Resolver status agregado (`ok` / `degraded` / `down`) via tabela de despacho
 *
 * Design:
 * - Injeção de dependências via interfaces (DIP — SOLID)
 * - Timeout de 2s por verificação para resposta rápida aos probes de saúde
 * - Nenhum switch/case — usa `TABELA_STATUS` (regra U2)
 * - Logs em todos os níveis relevantes (debug → info → warn)
 *
 * @example
 * ```typescript
 * const healthCheck = new ServicoHealthCheckIA(repositorioChromaDB, adapterGemini);
 *
 * // Verificação detalhada
 * const resultado = await healthCheck.verificarTodasDependencias();
 * console.log(resultado.status); // 'ok' | 'degraded' | 'down'
 *
 * // Verificação booleana rápida
 * if (!(await healthCheck.estaSaudavel())) {
 *   throw new Error('Módulo de IA indisponível');
 * }
 * ```
 */
export class ServicoHealthCheckIA {
  constructor(
    private readonly repositorioChromaDB: IRepositorioEmbedding,
    private readonly adapterGemini: IAdapterEmbedding,
  ) {}

  /**
   * Verifica a conectividade com o ChromaDB.
   *
   * Delega a verificação ao método `verificarConexao()` do repositório e aplica
   * um timeout de 2s independentemente do timeout interno do repositório.
   * Trata tanto a rejeição da Promise quanto o retorno `false` (falha silenciosa).
   *
   * @returns `ISaudeIaDependencia` com `ok`, `mensagem` opcional e `latencyMs`
   */
  async verificarChromaDB(): Promise<ISaudeIaDependencia> {
    const inicio = Date.now();

    try {
      Logger.debug(`${PREFIXO_LOG} Verificando conexão com ChromaDB...`);

      const conectado = await comTimeout(
        this.repositorioChromaDB.verificarConexao(),
        TIMEOUT_VERIFICACAO_MS,
        'ChromaDB',
      );

      const latencyMs = Date.now() - inicio;

      // Early return: repositório retornou false (falha capturada internamente)
      if (!conectado) {
        Logger.warn(
          `${PREFIXO_LOG} ChromaDB reportou falha na conexão | latência: ${latencyMs}ms`,
        );
        return {
          ok: false,
          mensagem: 'ChromaDB reportou falha na conexão',
          latencyMs,
        };
      }

      Logger.info(`${PREFIXO_LOG} ChromaDB saudável | latência: ${latencyMs}ms`);
      return { ok: true, latencyMs };

    } catch (erro) {
      const latencyMs = Date.now() - inicio;
      const mensagem   = erro instanceof Error ? erro.message : String(erro);
      Logger.warn(`${PREFIXO_LOG} ChromaDB indisponível: ${mensagem} | latência: ${latencyMs}ms`);
      return { ok: false, mensagem, latencyMs };
    }
  }

  /**
   * Verifica a conectividade com a API do Gemini (ou provedor de fallback ativo).
   *
   * Gera um embedding de ping — a chamada mais leve possível — e valida que o
   * retorno é um array não vazio. Aplica timeout de 2s.
   *
   * @returns `ISaudeIaDependencia` com `ok`, `mensagem` opcional e `latencyMs`
   */
  async verificarGemini(): Promise<ISaudeIaDependencia> {
    const inicio = Date.now();

    try {
      Logger.debug(`${PREFIXO_LOG} Verificando conexão com Gemini...`);

      const embedding = await comTimeout(
        this.adapterGemini.gerarEmbedding(TEXTO_PING_GEMINI),
        TIMEOUT_VERIFICACAO_MS,
        'Gemini',
      );

      const latencyMs = Date.now() - inicio;

      // Early return: embedding retornado é inválido
      if (!Array.isArray(embedding) || embedding.length === 0) {
        Logger.warn(
          `${PREFIXO_LOG} Gemini retornou embedding inválido | latência: ${latencyMs}ms`,
        );
        return {
          ok: false,
          mensagem: 'Gemini retornou embedding inválido ou vazio',
          latencyMs,
        };
      }

      Logger.info(
        `${PREFIXO_LOG} Gemini saudável | dimensão do embedding: ${embedding.length} | latência: ${latencyMs}ms`,
      );
      return { ok: true, latencyMs };

    } catch (erro) {
      const latencyMs = Date.now() - inicio;
      const mensagem   = erro instanceof Error ? erro.message : String(erro);
      Logger.warn(`${PREFIXO_LOG} Gemini indisponível: ${mensagem} | latência: ${latencyMs}ms`);
      return { ok: false, mensagem, latencyMs };
    }
  }

  /**
   * Executa a verificação de todas as dependências em paralelo.
   *
   * Usa `Promise.all` para minimizar a latência total — ChromaDB e Gemini são
   * verificados simultaneamente. O status agregado é resolvido via tabela de
   * despacho `TABELA_STATUS`, sem switch/case.
   *
   * @returns `ISaudeIaResultado` com status consolidado, timestamp e detalhes
   */
  async verificarTodasDependencias(): Promise<ISaudeIaResultado> {
    Logger.info(`${PREFIXO_LOG} Iniciando verificação paralela de dependências...`);

    const [chromadb, gemini] = await Promise.all([
      this.verificarChromaDB(),
      this.verificarGemini(),
    ]);

    const chave  = resolverChaveStatus(chromadb, gemini);
    const status = TABELA_STATUS[chave];

    const resultado: ISaudeIaResultado = {
      status,
      timestamp: new Date().toISOString(),
      dependencias: { chromadb, gemini },
    };

    Logger.info(
      `${PREFIXO_LOG} Verificação concluída | status: ${status}` +
      ` | chromadb: ${chromadb.ok} (${chromadb.latencyMs}ms)` +
      ` | gemini: ${gemini.ok} (${gemini.latencyMs}ms)`,
    );

    return resultado;
  }

  /**
   * Retorna `true` se o módulo de IA está completamente operacional.
   *
   * Atalho para obter uma resposta booleana sem inspecionar os detalhes de
   * cada dependência. Equivale a verificar `status === 'ok'`.
   *
   * @returns `true` quando ChromaDB e Gemini estão ambos saudáveis
   */
  async estaSaudavel(): Promise<boolean> {
    const resultado = await this.verificarTodasDependencias();
    return resultado.status === 'ok';
  }
}

