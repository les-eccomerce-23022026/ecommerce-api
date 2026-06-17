import { IntencaoRecomendacao } from './IntencaoRecomendacao.entity';

/**
 * Normaliza a intenção interpretada por um LLM.
 *
 * Provedores de LLM (Gemini, Groq, etc.) frequentemente emitem `null` para campos
 * opcionais não informados — por exemplo `{"precoMax": null}`. O contrato
 * `IntencaoRecomendacao` usa `undefined` para "ausente", e todo o downstream filtra
 * com guardas `!== undefined`. Um `null` passa nessas guardas e é tratado como filtro
 * ativo de valor inválido (ex.: `preco <= null` é sempre falso → zera o catálogo, e a
 * mensagem renderiza "preço até R$ null").
 *
 * Esta função converte `null`/`NaN`/valores não finitos dos campos numéricos opcionais
 * em `undefined`, garantindo a semântica esperada por todo o pipeline (anti-alucinação
 * RN-IA-001 e filtros de catálogo).
 *
 * Ponto único de normalização (DRY): aplicado na camada de aplicação, após obter a
 * intenção de qualquer provedor de LLM.
 */
export function normalizarIntencaoRecomendacao(
  intencao: IntencaoRecomendacao,
): IntencaoRecomendacao {
  return {
    ...intencao,
    anoMin: sanitizarNumeroOpcional(intencao.anoMin),
    anoMax: sanitizarNumeroOpcional(intencao.anoMax),
    precoMax: sanitizarNumeroOpcional(intencao.precoMax),
    precoMin: sanitizarNumeroOpcional(intencao.precoMin),
    paginasMax: sanitizarNumeroOpcional(intencao.paginasMax),
    autor: sanitizarTextoOpcional(intencao.autor),
  };
}

/** Converte `null`/`NaN`/não finito em `undefined`; mantém números válidos. */
function sanitizarNumeroOpcional(valor: number | null | undefined): number | undefined {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) {
    return undefined;
  }
  return valor;
}

/** Converte `null`/string vazia em `undefined`; mantém texto não vazio. */
function sanitizarTextoOpcional(valor: string | null | undefined): string | undefined {
  if (valor === null || valor === undefined || valor.trim().length === 0) {
    return undefined;
  }
  return valor;
}
