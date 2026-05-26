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
   * Executa um bloco de código dentro de uma transação.
   * Se a função lançar erro, a transação é revertida automaticamente.
   * @param callback Função que recebe o cliente da transação e executa as operações
   * @returns Resultado do callback
   */
  transacao<T>(callback: (cliente: IConexaoBanco) => Promise<T>): Promise<T>;

  /**
   * Inicia uma transação manualmente.
   */
  iniciarTransacao(): Promise<void>;

  /**
   * Confirma uma transação manual.
   */
  confirmarTransacao(): Promise<void>;

  /**
   * Reverte uma transação manual.
   */
  reverterTransacao(): Promise<void>;

  /**
   * Finaliza a conexão ou o pool de conexões.
   */
  finalizar(): Promise<void>;
}
