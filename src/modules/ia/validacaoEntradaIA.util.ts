/** Limites de entrada conforme RN-IA-004 */
export const LIMITE_CARACTERES_QUERY = 500;
export const LIMITE_MINIMO_CARACTERES_QUERY = 3;
export const LIMITE_CARACTERES_MENSAGEM_CHAT = 1000;
export const LIMITE_MINIMO_CARACTERES_MENSAGEM_CHAT = 3;
export const LIMITE_MENSAGENS_HISTORICO_CHAT = 20;

const REGEX_TAGS_HTML = /<[^>]*>/g;
const REGEX_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Verifica se o texto contém pelo menos um caractere alfanumérico (letra ou dígito).
 * Queries compostas apenas por espaços, pontuação ou caracteres especiais são inválidas.
 */
const REGEX_CONTEUDO_VALIDO = /[a-zA-ZÀ-ÿ0-9]/;

/**
 * Remove tags HTML de entradas de texto para mitigar XSS refletido na resposta.
 * Também escapa caracteres especiais para prevenir XSS em metadados.
 */
export function sanitizarTextoEntrada(texto: string): string {
  // Remove tags HTML
  const semTags = texto.replace(REGEX_TAGS_HTML, '');
  
  // Escapa caracteres especiais HTML para prevenir XSS em metadados
  const escapado = semTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return escapado.trim();
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

/**
 * Valida comprimento mínimo da query.
 * Executada antes da geração de embedding para evitar chamadas desnecessárias à LLM.
 */
export function validarTamanhoMinimoQuery(query: string): string | null {
  if (query.length < LIMITE_MINIMO_CARACTERES_QUERY) {
    return `Query deve ter no mínimo ${LIMITE_MINIMO_CARACTERES_QUERY} caracteres`;
  }
  return null;
}

/**
 * Valida se a query contém pelo menos um caractere alfanumérico.
 * Executada antes da geração de embedding para rejeitar entradas inválidas antecipadamente.
 */
export function validarConteudoQuery(query: string): string | null {
  if (!REGEX_CONTEUDO_VALIDO.test(query)) {
    return 'Query deve conter pelo menos um caractere alfanumérico';
  }
  return null;
}

export function validarTamanhoMensagemChat(mensagem: string): string | null {
  if (mensagem.length > LIMITE_CARACTERES_MENSAGEM_CHAT) {
    return `Mensagem não pode exceder ${LIMITE_CARACTERES_MENSAGEM_CHAT} caracteres`;
  }
  return null;
}

/**
 * Valida comprimento mínimo da mensagem de chat.
 * Executada antes da geração de embedding para evitar chamadas desnecessárias à LLM.
 */
export function validarTamanhoMinimoMensagemChat(mensagem: string): string | null {
  if (mensagem.length < LIMITE_MINIMO_CARACTERES_MENSAGEM_CHAT) {
    return `Mensagem deve ter no mínimo ${LIMITE_MINIMO_CARACTERES_MENSAGEM_CHAT} caracteres`;
  }
  return null;
}

/**
 * Valida se a mensagem de chat contém pelo menos um caractere alfanumérico.
 * Executada antes da geração de embedding para rejeitar entradas inválidas antecipadamente.
 */
export function validarConteudoMensagemChat(mensagem: string): string | null {
  if (!REGEX_CONTEUDO_VALIDO.test(mensagem)) {
    return 'Mensagem deve conter pelo menos um caractere alfanumérico';
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
