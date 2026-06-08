import { di } from '@/shared/infrastructure/di.container';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Resultado da validação de contexto de loja.
 */
export interface IResultadoContextoLoja {
  loj_uuid: string;
  loj_id: number;
  valido: boolean;
  erro?: string;
}

/**
 * Serviço centralizado para gerenciar lógica de tenant/loja.
 * 
 * Responsabilidades:
 * - Validar formato de loj_uuid
 * - Converter loj_uuid para loj_id (performance)
 * - Determinar loj_id atual com fallbacks
 * - Centralizar lógica de multi-tenancy
 * 
 * Este serviço elimina duplicação de código entre middlewares e
 * fornece uma única fonte de verdade para lógica de tenant.
 */
export class ServicoContextoLoja {
  private readonly repoLojas = di.repoLojas;
  private readonly cacheUuidParaId = new Map<string, number>();
  private readonly TEMPO_CACHE_MS = 5 * 60 * 1000; // 5 minutos

  /**
   * Regex para validação de formato UUID.
   */
  private readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /**
   * Valida o formato de um loj_uuid.
   */
  private validarFormatoUuid(loj_uuid: string): boolean {
    return this.UUID_REGEX.test(loj_uuid);
  }

  /**
   * Converte loj_uuid para loj_id com cache.
   */
  private async converterUuidParaId(loj_uuid: string): Promise<number | null> {
    // Verificar cache
    const cached = this.cacheUuidParaId.get(loj_uuid);
    if (cached !== undefined) {
      return cached;
    }

    // Buscar do banco
    const id = await this.repoLojas.obterIdInternoPorUuid(loj_uuid);
    
    // Armazenar em cache se encontrado
    if (id !== null) {
      this.cacheUuidParaId.set(loj_uuid, id);
      
      // Limpar cache após TEMPO_CACHE_MS
      setTimeout(() => {
        this.cacheUuidParaId.delete(loj_uuid);
      }, this.TEMPO_CACHE_MS);
    }
    
    return id;
  }

  /**
   * Obtém a loja padrão (primeira loja ativa).
   */
  private async obterLojaPadrao(): Promise<{ loj_uuid: string; loj_id: number }> {
    const lojas = await this.repoLojas.listarLojas();
    const lojaAtiva = lojas.find(l => l.ativo);
    
    if (!lojaAtiva) {
      throw new Error('Nenhuma loja ativa encontrada');
    }
    
    const idInterno = await this.converterUuidParaId(lojaAtiva.uuid);
    if (idInterno === null) {
      throw new Error('Não foi possível obter ID interno da loja padrão');
    }
    
    return {
      loj_uuid: lojaAtiva.uuid,
      loj_id: idInterno,
    };
  }

  /**
   * Determina o contexto de loja a partir do header, cookie ou fallback.
   * 
   * @param loj_uuid_header Valor do header x-loja-uuid
   * @param loj_uuid_cookie Valor do cookie x-loja-uuid
   * @returns Contexto de loja validado
   */
  public async determinarContextoLoja(
    loj_uuid_header?: string,
    loj_uuid_cookie?: string
  ): Promise<IResultadoContextoLoja> {
    const loj_uuid_contexto = loj_uuid_header || loj_uuid_cookie;

    // Se não houver header/cookie, usar loja padrão
    if (!loj_uuid_contexto) {
      try {
        const lojaPadrao = await this.obterLojaPadrao();
        Logger.info(`[servico-contexto-loja] Usando loja padrão: ${lojaPadrao.loj_uuid}`);
        return {
          loj_uuid: lojaPadrao.loj_uuid,
          loj_id: lojaPadrao.loj_id,
          valido: true,
        };
      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : String(erro);
        Logger.error('[servico-contexto-loja] Erro ao obter loja padrão:', mensagem);
        return {
          loj_uuid: '',
          loj_id: 0,
          valido: false,
          erro: mensagem,
        };
      }
    }

    // Validar formato UUID
    if (!this.validarFormatoUuid(loj_uuid_contexto)) {
      Logger.warn(`[servico-contexto-loja] loj_uuid inválido: ${loj_uuid_contexto}`);
      
      // Fallback para loja padrão ao invés de rejeitar
      try {
        const lojaPadrao = await this.obterLojaPadrao();
        return {
          loj_uuid: lojaPadrao.loj_uuid,
          loj_id: lojaPadrao.loj_id,
          valido: true,
        };
      } catch (erro) {
        return {
          loj_uuid: '',
          loj_id: 0,
          valido: false,
          erro: 'loj_uuid inválido e loja padrão não encontrada',
        };
      }
    }

    // Converter UUID para ID interno
    const idInterno = await this.converterUuidParaId(loj_uuid_contexto);
    if (idInterno === null) {
      Logger.warn(`[servico-contexto-loja] Loja não encontrada para UUID: ${loj_uuid_contexto}`);
      
      // Fallback para loja padrão ao invés de rejeitar
      try {
        const lojaPadrao = await this.obterLojaPadrao();
        return {
          loj_uuid: lojaPadrao.loj_uuid,
          loj_id: lojaPadrao.loj_id,
          valido: true,
        };
      } catch (erro) {
        return {
          loj_uuid: '',
          loj_id: 0,
          valido: false,
          erro: 'Loja não encontrada e loja padrão não encontrada',
        };
      }
    }

    return {
      loj_uuid: loj_uuid_contexto,
      loj_id: idInterno,
      valido: true,
    };
  }

  /**
   * Valida se um loj_uuid está no array de lojas acessíveis do usuário.
   * 
   * @param loj_uuid UUID da loja a validar
   * @param lojasAcessiveis Array de lojas acessíveis do usuário
   * @returns ID interno da loja se válida, null caso contrário
   */
  public async validarLojaAcessivel(
    loj_uuid: string,
    lojasAcessiveis: Array<{ loj_id: number; loj_uuid: string }>
  ): Promise<number | null> {
    const lojaAcessivel = lojasAcessiveis.find(l => l.loj_uuid === loj_uuid);
    
    if (!lojaAcessivel) {
      Logger.warn(`[servico-contexto-loja] Loja não acessível: ${loj_uuid}`);
      return null;
    }
    
    return lojaAcessivel.loj_id;
  }

  /**
   * Limpa o cache de UUID para ID.
   * Útil para testes ou quando há alterações nas lojas.
   */
  public limparCache(): void {
    this.cacheUuidParaId.clear();
    Logger.info('[servico-contexto-loja] Cache limpo');
  }
}

// Instância singleton do serviço
export const servicoContextoLoja = new ServicoContextoLoja();
