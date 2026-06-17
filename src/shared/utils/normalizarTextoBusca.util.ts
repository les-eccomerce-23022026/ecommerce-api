/**
 * Normaliza texto para comparação em filtros de catálogo (sem acentos, minúsculas, espaços unificados).
 */
export function normalizarTextoBusca(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
