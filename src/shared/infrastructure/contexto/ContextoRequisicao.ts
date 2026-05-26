import { AsyncLocalStorage } from 'async_hooks';

/**
 * Interface do contexto de requisição.
 * Contém dados que devem estar disponíveis durante toda a execução da requisição.
 * 
 * IMPORTANTE: 
 * - Externamente (API, frontend): usa apenas UUIDs públicos (loj_uuid, usu_uuid)
 * - Internamente (repositórios): usa loj_id convertido para performance
 * - IDs internos (BIGSERIAL) NUNCA são expostos na API
 */
export interface IContextoRequisicao {
  loj_id?: number;
  loj_uuid?: string;
  usu_id?: number;
  usu_uuid?: string;
}

/**
 * Contexto de requisição usando AsyncLocalStorage.
 * Permite armazenar dados específicos da requisição atual de forma thread-safe.
 * 
 * IMPORTANTE: Para criar um novo contexto em middlewares, use asyncLocalStorage.run()
 * diretamente em vez de definirContexto(). definirContexto() apenas atualiza um contexto
 * existente via enterWith(), que não funciona para criar contextos em middlewares síncronos.
 */
class ContextoRequisicao {
  // Public para permitir acesso direto em middlewares que precisam criar contexto com run()
  static asyncLocalStorage = new AsyncLocalStorage<IContextoRequisicao>();

  /**
   * Define o contexto de requisição.
   * 
   * ATENÇÃO: Este método usa enterWith(), que apenas atualiza um contexto EXISTENTE.
   * NÃO funciona para criar um novo contexto em middlewares síncronos.
   * Para criar um novo contexto, use asyncLocalStorage.run() diretamente no middleware.
   * 
   * Uso correto em middlewares:
   *   ContextoRequisicao.asyncLocalStorage.run({ loj_id: 1 }, () => next());
   */
  static definirContexto(contexto: IContextoRequisicao): void {
    const store = ContextoRequisicao.asyncLocalStorage.getStore();
    if (store) {
      // Atualiza o contexto existente
      Object.assign(store, contexto);
    } else {
      // Cria um novo contexto usando enterWith (não recomendado para middlewares)
      ContextoRequisicao.asyncLocalStorage.enterWith(contexto);
    }
  }

  /**
   * Obtém o contexto de requisição atual.
   */
  static obterContexto(): IContextoRequisicao | undefined {
    return ContextoRequisicao.asyncLocalStorage.getStore();
  }

  /**
   * Obtém o loj_uuid do contexto atual.
   * Retorna undefined se não houver contexto definido.
   */
  static obterLojUuid(): string | undefined {
    const contexto = ContextoRequisicao.obterContexto();
    return contexto?.loj_uuid;
  }

  /**
   * Obtém o loj_id do contexto atual.
   * Retorna undefined se não houver contexto definido.
   * 
   * NOTA: loj_id é usado internamente pelos repositórios para performance.
   * Externamente (API/frontend), apenas loj_uuid é exposto.
   */
  static obterLojId(): number | undefined {
    const contexto = ContextoRequisicao.obterContexto();
    return contexto?.loj_id;
  }

  /**
   * Obtém o usu_id do contexto atual.
   * Retorna undefined se não houver contexto definido.
   */
  static obterUsuId(): number | undefined {
    const contexto = ContextoRequisicao.obterContexto();
    return contexto?.usu_id;
  }

  /**
   * Obtém o usu_uuid do contexto atual.
   * Retorna undefined se não houver contexto definido.
   */
  static obterUsuUuid(): string | undefined {
    const contexto = ContextoRequisicao.obterContexto();
    return contexto?.usu_uuid;
  }

  /**
   * Executa uma função dentro de um contexto específico.
   * Útil para testes ou operações que precisam de um contexto customizado.
   */
  static async executarComContexto<T>(
    contexto: IContextoRequisicao,
    callback: () => Promise<T>
  ): Promise<T> {
    return ContextoRequisicao.asyncLocalStorage.run(contexto, callback);
  }

  /**
   * Limpa o contexto de requisição.
   * Geralmente não é necessário, pois o AsyncLocalStorage limpa automaticamente.
   */
  static limparContexto(): void {
    // O AsyncLocalStorage limpa automaticamente ao final da requisição
    // Este método é apenas para casos especiais
  }
}

export { ContextoRequisicao };
