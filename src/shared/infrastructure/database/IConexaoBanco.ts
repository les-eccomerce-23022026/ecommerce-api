/**
 * Tipo para parâmetros de consulta SQL.
 * Representa os valores seguros que podem ser passados como parâmetros.
 */
/** Inclui `string[]` para binds do Postgres (ex.: `ANY($1::uuid[])`). */
export type DbParametro = string | number | boolean | Date | null | undefined | readonly string[];

/**
 * Interface genérica para conexão com banco de dados.
 * Abstrai a implementação específica (Postgres, MySQL, etc).
 */
export interface IConexaoBanco {
  /**
   * Executa uma consulta no banco de dados.
   * @param sql A string SQL com placeholders (ex: $1, $2 ou ?, ?)
   * @param parametros Array de parâmetros para substituir os placeholders
   * @param opcoes Opções extras, como searchPath (ex: "les, public")
   * @returns Resultados da consulta
   */
  executar<T = unknown>(sql: string, parametros?: DbParametro[], opcoes?: { searchPath?: string }): Promise<T[]>;

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
