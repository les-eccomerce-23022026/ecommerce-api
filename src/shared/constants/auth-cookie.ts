/**
 * Nome do cookie HttpOnly que transporta o JWT na aplicação web.
 * Configurável para ambientes com múltiplas APIs.
 */
export function obterNomeCookieAuth(): string {
  return process.env.AUTH_COOKIE_NAME?.trim() || 'les_token';
}
