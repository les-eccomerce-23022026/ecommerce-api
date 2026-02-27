/**
 * Interface genérica para conexão com banco de dados.
 * Abstrai a implementação específica (Postgres, MySQL, etc).
 */
export interface IConexaoBanco {
  /**
   * Executa uma consulta no banco de dados.
   * @param sql A string SQL com placeholders (ex: $1, $2 ou ?, ?)
   * @param parametros Array de parâmetros para substituir os placeholders
   * @returns Resultados da consulta
   */
  executar<T = unknown>(sql: string, parametros?: unknown[]): Promise<T[]>;

  /**
   * Inicia uma transação.
   */
  iniciarTransacao(): Promise<void>;

  /**
   * Confirma uma transação.
   */
  confirmarTransacao(): Promise<void>;

  /**
   * Reverte uma transação.
   */
  reverterTransacao(): Promise<void>;

  /**
   * Finaliza a conexão ou o pool de conexões.
   */
  finalizar(): Promise<void>;
}
