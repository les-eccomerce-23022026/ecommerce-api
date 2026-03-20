import { AsyncLocalStorage } from 'async_hooks';
import { PoolClient } from 'pg';

export type TipoAmbienteBanco = 'producao' | 'teste';

export interface IContextoBanco {
  tipo: TipoAmbienteBanco;
  transacao?: PoolClient;
}

export const contextoBanco = new AsyncLocalStorage<IContextoBanco>();

// Fallback global para transação, útil para testes de integração onde o contexto assíncrono pode ser perdido entre hooks e a requisição
let transacaoGlobalParaTestes: PoolClient | undefined;

export function definirTransacaoGlobalParaTestes(transacao: PoolClient | undefined): void {
  transacaoGlobalParaTestes = transacao;
}

/**
 * Obtém o contexto completo do banco de dados.
 */
export function obterContextoAtual(): IContextoBanco | undefined {
  const store = contextoBanco.getStore();
  
  if (store) {
    // Se o store atual não tiver transação, mas houver uma global (ex: testes de integração via Supertest que perdem o contexto interno), injeta a global.
    if (!store.transacao && transacaoGlobalParaTestes) {
      return {
        ...store,
        transacao: transacaoGlobalParaTestes,
      };
    }
    return store;
  }

  // Se não houver contexto mas houver uma transação global de teste, retorna um contexto fictício
  if (transacaoGlobalParaTestes) {
    return {
      tipo: 'producao', // Assume produção por padrão para isolamento, ou poderíamos guardar o tipo também
      transacao: transacaoGlobalParaTestes,
    };
  }

  return undefined;
}

/**
 * Obtém o tipo de banco de dados do contexto atual.
 * Se não houver contexto (ex: scripts fora do Express), retorna 'producao'.
 */
export function obterTipoBancoAtual(): TipoAmbienteBanco {
  return obterContextoAtual()?.tipo ?? 'producao';
}

/**
 * Obtém o cliente de transação do contexto atual, se houver.
 */
export function obterTransacaoAtual(): PoolClient | undefined {
  return obterContextoAtual()?.transacao;
}
