import { normalizarTextoBusca } from '@/shared/utils/normalizarTextoBusca.util';

/**
 * Termos alternativos por tag de intenção (Gemini) para casar com categorias/tags do Chroma.
 * Chaves e valores são comparados após normalizarTextoBusca.
 */
export const ALIASES_GENERO_CATALOGO: Record<string, string[]> = {
  terror: ['terror', 'horror', 'suspense sobrenatural'],
  suspense: ['suspense', 'thriller'],
  misterio: ['misterio', 'mistério', 'crime', 'policial', 'detetive'],
  romance: ['romance', 'amor'],
  romance_historico: ['romance', 'historico', 'época', 'século'],
  fantasia: ['fantasia', 'magia', 'épico', 'epico'],
  ficcao_cientifica: [
    'ficcao cientifica',
    'ficção científica',
    'ficcao_cientifica',
    'ciencia',
    'sci fi',
    'espaco',
    'astronomia',
    'distopia',
  ],
  humor: ['humor', 'comedia', 'comédia'],
  distopia: ['distopia', 'distopico'],
  infantil: ['infantil', 'juvenil', 'young adult', 'ya'],
  juvenil: ['juvenil', 'young adult', 'ya'],
  desenvolvimento_pessoal: ['desenvolvimento', 'autoajuda'],
};

/**
 * Expande um gênero da intenção em termos normalizados para busca em categoria/tags/texto.
 */
export function expandirTermosGenero(generoIntencao: string): string[] {
  const chave = normalizarTextoBusca(generoIntencao).replace(/\s+/g, '_');
  const aliases =
    ALIASES_GENERO_CATALOGO[chave] ??
    ALIASES_GENERO_CATALOGO[normalizarTextoBusca(generoIntencao).replace(/\s+/g, '_')] ??
    [];

  const termos = new Set<string>([
    normalizarTextoBusca(generoIntencao),
    chave.replace(/_/g, ' '),
    ...aliases.map(normalizarTextoBusca),
  ]);

  return Array.from(termos).filter(Boolean);
}
