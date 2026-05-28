/** Limites de entrada conforme RN-IA-004 */
export const LIMITE_CARACTERES_QUERY = 500;
export const LIMITE_CARACTERES_MENSAGEM_CHAT = 1000;
export const LIMITE_MENSAGENS_HISTORICO_CHAT = 20;

const REGEX_TAGS_HTML = /<[^>]*>/g;
const REGEX_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Remove tags HTML de entradas de texto para mitigar XSS refletido na resposta.
 */
export function sanitizarTextoEntrada(texto: string): string {
  return texto.replace(REGEX_TAGS_HTML, '').trim();
}

/**
 * Valida formato UUID (v4 ou variantes hexadecimais usadas em testes).
 */
export function ehUuidValido(valor: string): boolean {
  return REGEX_UUID.test(valor);
}

export function validarTamanhoQuery(query: string): string | null {
  if (query.length > LIMITE_CARACTERES_QUERY) {
    return `Query não pode exceder ${LIMITE_CARACTERES_QUERY} caracteres`;
  }
  return null;
}

export function validarTamanhoMensagemChat(mensagem: string): string | null {
  if (mensagem.length > LIMITE_CARACTERES_MENSAGEM_CHAT) {
    return `Mensagem não pode exceder ${LIMITE_CARACTERES_MENSAGEM_CHAT} caracteres`;
  }
  return null;
}

export function validarHistoricoChat(historico: unknown[] | undefined): string | null {
  if (historico && historico.length > LIMITE_MENSAGENS_HISTORICO_CHAT) {
    return `Histórico não pode exceder ${LIMITE_MENSAGENS_HISTORICO_CHAT} mensagens`;
  }
  return null;
}

export function validarClienteUuidOpcional(clienteUuid: string | undefined): string | null {
  if (clienteUuid === undefined || clienteUuid === null || clienteUuid === '') {
    return null;
  }
  if (typeof clienteUuid !== 'string' || !ehUuidValido(clienteUuid)) {
    return 'clienteUuid deve ser um UUID válido';
  }
  return null;
}
