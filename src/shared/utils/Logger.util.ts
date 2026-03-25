/* eslint-disable no-console */

/**
 * Tipo para contexto de log.
 * Permite strings, números, booleanos, objetos simples ou arrays.
 */
export type LogContext =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | unknown[]
  | null
  | undefined;

/**
 * Utilitário de Logger centralizado para o sistema.
 * O objetivo é evitar o uso direto do 'console' em todo o código,
 * centralizando a saída e permitindo o controle de ambiente em um só lugar.
 */
export class Logger {
  /**
   * Registra uma informação geral.
   */
  public static info(mensagem: string, ...detalhes: LogContext[]): void {
    console.info(`[INFO] ${mensagem}`, ...detalhes);
  }

  /**
   * Registra um aviso ou situação de alerta.
   */
  public static warn(mensagem: string, ...detalhes: LogContext[]): void {
    console.warn(`[WARN] ${mensagem}`, ...detalhes);
  }

  /**
   * Registra um erro fatal ou exceção.
   */
  public static error(mensagem: string, ...detalhes: LogContext[]): void {
    console.error(`[ERRO] ${mensagem}`, ...detalhes);
  }

  /**
   * Registra informações de depuração (debug).
   */
  public static debug(mensagem: string, ...detalhes: LogContext[]): void {
    console.debug(`[DEBUG] ${mensagem}`, ...detalhes);
  }
}
