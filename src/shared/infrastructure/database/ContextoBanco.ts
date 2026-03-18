import { AsyncLocalStorage } from 'async_hooks';

export type TipoAmbienteBanco = 'producao' | 'teste';

export const contextoBanco = new AsyncLocalStorage<TipoAmbienteBanco>();

/**
 * Obtém o tipo de banco de dados do contexto atual.
 * Se não houver contexto (ex: scripts fora do Express), retorna 'producao'.
 */
export function obterTipoBancoAtual(): TipoAmbienteBanco {
  return contextoBanco.getStore() ?? 'producao';
}
