import { Logger } from '@/shared/utils/Logger.util';
import {
  IRepositorioPadroesValidacaoIA,
} from './repositorioPadroesValidacaoIA';
import {
  BLACKLIST_PADROES_ESTATICOS,
  PADROES_IMPOSSIVEIS_ESTATICOS,
} from './padroesValidacaoEstaticos';

const TTL_CACHE_PADROES_MS = 10 * 60 * 1000; // 10 minutos

export interface PadroesValidacao {
  blacklist: string[];
  impossiveis: string[];
  usandoFallback: boolean;
}

/**
 * Cache em memória dos padrões de validação determinística da IA.
 *
 * Carrega os padrões do banco (tabela padroes_validacao_ia) com TTL de 10 minutos.
 * Se o banco falhar, usa os arrays estáticos como fallback para garantir
 * que a validação nunca fique sem proteção.
 */
export class ServicoCachePadroesValidacaoIA {
  private cache: PadroesValidacao | null = null;
  private ultimaAtualizacaoMs: number | null = null;

  constructor(private readonly repositorio: IRepositorioPadroesValidacaoIA) {}

  async obterPadroes(): Promise<PadroesValidacao> {
    if (this.estaValido()) {
      return this.cache!;
    }
    await this.atualizar();
    return this.cache!;
  }

  invalidar(): void {
    this.cache = null;
    this.ultimaAtualizacaoMs = null;
    Logger.debug('[ServicoCachePadroesValidacaoIA] Cache invalidado');
  }

  async atualizarAgora(): Promise<void> {
    await this.atualizar();
  }

  async persistirPadrao(padrao: string, tipo: string, origem: string): Promise<void> {
    await this.repositorio.inserirSeNaoExiste(padrao, tipo, origem);
    this.invalidar();
  }

  private estaValido(): boolean {
    return (
      this.cache !== null &&
      this.ultimaAtualizacaoMs !== null &&
      Date.now() - this.ultimaAtualizacaoMs < TTL_CACHE_PADROES_MS
    );
  }

  private async atualizar(): Promise<void> {
    try {
      const padroes = await this.repositorio.listarAtivos();
      this.cache = {
        blacklist: padroes
          .filter((p) => p.tipo === 'blacklist')
          .map((p) => p.padrao),
        impossiveis: padroes
          .filter((p) => p.tipo === 'impossivel')
          .map((p) => p.padrao),
        usandoFallback: false,
      };
      this.ultimaAtualizacaoMs = Date.now();
      Logger.info(
        `[ServicoCachePadroesValidacaoIA] Cache atualizado — ` +
        `${this.cache.blacklist.length} blacklist, ${this.cache.impossiveis.length} impossíveis`
      );
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(
        `[ServicoCachePadroesValidacaoIA] Falha ao carregar padrões do banco, usando fallback estático: ${mensagem}`
      );
      this.cache = {
        blacklist: [...BLACKLIST_PADROES_ESTATICOS],
        impossiveis: [...PADROES_IMPOSSIVEIS_ESTATICOS],
        usandoFallback: true,
      };
      // Não atualiza ultimaAtualizacaoMs para forçar nova tentativa na próxima chamada
    }
  }
}
