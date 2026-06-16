import fs from 'fs';
import path from 'path';
import { Logger } from '@/shared/utils/Logger.util';
import { IRepositorioPadroesValidacaoIA } from './repositorioPadroesValidacaoIA';
import {
  BLACKLIST_PADROES_ESTATICOS,
  PADROES_IMPOSSIVEIS_ESTATICOS,
} from './padroesValidacaoEstaticos';

const TTL_CACHE_MEMORIA_MS = 10 * 60 * 1000; // 10 minutos
const TTL_CACHE_DISCO_MS = 60 * 60 * 1000;   // 1 hora

/** Caminho fixo do arquivo de cache — um único arquivo, substituído atomicamente. */
const CAMINHO_CACHE_DISCO = path.resolve(__dirname, '../../../../cache/padroes_validacao_ia.json');
const CAMINHO_CACHE_DISCO_TMP = CAMINHO_CACHE_DISCO + '.tmp';

export interface PadroesValidacao {
  blacklist: string[];
  impossiveis: string[];
  usandoFallback: boolean;
}

interface CacheDiscoSchema {
  geradoEm: number;
  blacklist: string[];
  impossiveis: string[];
}

/**
 * Cache em dois níveis dos padrões de validação determinística da IA:
 *
 * 1. Memória  — TTL 10 min (evita I/O em requisições frequentes)
 * 2. Disco    — TTL 1 h   (sobrevive a restarts do processo)
 *
 * O arquivo de cache é sempre o mesmo (`cache/padroes_validacao_ia.json`);
 * escrita atômica via rename de arquivo `.tmp` previne leituras parciais.
 *
 * Fallback em cascata: Memória → Disco → Banco → Padrões estáticos.
 */
export class ServicoCachePadroesValidacaoIA {
  private cache: PadroesValidacao | null = null;
  private ultimaAtualizacaoMemoriaMs: number | null = null;

  constructor(private readonly repositorio: IRepositorioPadroesValidacaoIA) {}

  async obterPadroes(forcar = false): Promise<PadroesValidacao> {
    if (!forcar && this.memoriaValida()) {
      return this.cache!;
    }

    if (!forcar) {
      const disco = this.lerCacheDisco();
      if (disco) {
        this.definirMemoria(disco.blacklist, disco.impossiveis, false);
        return this.cache!;
      }
    }

    await this.carregarDoBanco();
    return this.cache!;
  }

  invalidar(): void {
    this.cache = null;
    this.ultimaAtualizacaoMemoriaMs = null;
    this.excluirCacheDisco();
    Logger.debug('[ServicoCachePadroesValidacaoIA] Cache invalidado (memória + disco)');
  }

  async atualizarAgora(): Promise<void> {
    await this.carregarDoBanco();
  }

  async persistirPadrao(padrao: string, tipo: string, origem: string): Promise<void> {
    await this.repositorio.inserirSeNaoExiste(padrao, tipo, origem);
    this.invalidar();
  }

  // ── Memória ────────────────────────────────────────────────────────────────

  private memoriaValida(): boolean {
    return (
      this.cache !== null &&
      this.ultimaAtualizacaoMemoriaMs !== null &&
      Date.now() - this.ultimaAtualizacaoMemoriaMs < TTL_CACHE_MEMORIA_MS
    );
  }

  private definirMemoria(blacklist: string[], impossiveis: string[], usandoFallback: boolean): void {
    this.cache = { blacklist, impossiveis, usandoFallback };
    this.ultimaAtualizacaoMemoriaMs = Date.now();
  }

  // ── Disco ──────────────────────────────────────────────────────────────────

  private lerCacheDisco(): CacheDiscoSchema | null {
    try {
      if (!fs.existsSync(CAMINHO_CACHE_DISCO)) return null;
      const raw = fs.readFileSync(CAMINHO_CACHE_DISCO, 'utf-8');
      const dados: CacheDiscoSchema = JSON.parse(raw);
      if (
        typeof dados.geradoEm !== 'number' ||
        !Array.isArray(dados.blacklist) ||
        !Array.isArray(dados.impossiveis)
      ) {
        Logger.warn('[ServicoCachePadroesValidacaoIA] Cache disco com schema inválido — descartando');
        return null;
      }
      if (Date.now() - dados.geradoEm > TTL_CACHE_DISCO_MS) {
        Logger.debug('[ServicoCachePadroesValidacaoIA] Cache disco expirado — buscando banco');
        return null;
      }
      Logger.debug('[ServicoCachePadroesValidacaoIA] Cache disco válido — usando arquivo');
      return dados;
    } catch {
      return null;
    }
  }

  private gravarCacheDisco(blacklist: string[], impossiveis: string[]): void {
    try {
      const dados: CacheDiscoSchema = { geradoEm: Date.now(), blacklist, impossiveis };
      fs.mkdirSync(path.dirname(CAMINHO_CACHE_DISCO), { recursive: true });
      fs.writeFileSync(CAMINHO_CACHE_DISCO_TMP, JSON.stringify(dados), 'utf-8');
      fs.renameSync(CAMINHO_CACHE_DISCO_TMP, CAMINHO_CACHE_DISCO); // atômico
      Logger.debug('[ServicoCachePadroesValidacaoIA] Cache disco gravado');
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      Logger.warn(`[ServicoCachePadroesValidacaoIA] Falha ao gravar cache disco: ${msg}`);
      // Limpa .tmp para não deixar arquivo parcial em disco
      try { fs.unlinkSync(CAMINHO_CACHE_DISCO_TMP); } catch { /* ignora */ }
    }
  }

  private excluirCacheDisco(): void {
    try {
      if (fs.existsSync(CAMINHO_CACHE_DISCO)) {
        fs.unlinkSync(CAMINHO_CACHE_DISCO);
      }
    } catch {
      // ignora — próxima leitura simplesmente cairá no banco
    }
  }

  // ── Banco ──────────────────────────────────────────────────────────────────

  private async carregarDoBanco(): Promise<void> {
    try {
      const padroes = await this.repositorio.listarAtivos();
      const blacklist = padroes.filter((p) => p.tipo === 'blacklist').map((p) => p.padrao);
      const impossiveis = padroes.filter((p) => p.tipo === 'impossivel').map((p) => p.padrao);
      this.gravarCacheDisco(blacklist, impossiveis);
      this.definirMemoria(blacklist, impossiveis, false);
      Logger.info(
        `[ServicoCachePadroesValidacaoIA] Banco carregado — ` +
        `${blacklist.length} blacklist, ${impossiveis.length} impossíveis`
      );
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(
        `[ServicoCachePadroesValidacaoIA] Falha ao carregar banco, usando fallback estático: ${mensagem}`
      );
      this.definirMemoria(
        [...BLACKLIST_PADROES_ESTATICOS],
        [...PADROES_IMPOSSIVEIS_ESTATICOS],
        true,
      );
      // Não grava no disco para forçar nova tentativa no próximo restart
    }
  }
}
