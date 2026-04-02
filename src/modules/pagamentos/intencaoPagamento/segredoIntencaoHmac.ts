import { createHmac, timingSafeEqual } from 'crypto';

export function obterChaveHmacSegredoIntencao(): string {
  const k = process.env.SEGREDO_HMAC_INTENCAO?.trim();
  if (!k) {
    throw new Error('Variável de ambiente SEGREDO_HMAC_INTENCAO é obrigatória para intenções de pagamento.');
  }
  return k;
}

export function obterTtlMinutosIntencaoPagamento(): number {
  const bruto = process.env.INTENCAO_PAGAMENTO_TTL_MINUTOS?.trim();
  if (!bruto) {
    throw new Error('Variável de ambiente INTENCAO_PAGAMENTO_TTL_MINUTOS é obrigatória.');
  }
  const n = Number(bruto);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('INTENCAO_PAGAMENTO_TTL_MINUTOS deve ser um número positivo.');
  }
  return n;
}

export function hashSegredoIntencao(segredoPlain: string): string {
  const chave = obterChaveHmacSegredoIntencao();
  return createHmac('sha256', chave).update(segredoPlain, 'utf8').digest('hex');
}

export function verificarSegredoIntencao(segredoPlain: string, hashArmazenado: string): boolean {
  const esperadoHex = hashSegredoIntencao(segredoPlain);
  const a = Buffer.from(esperadoHex, 'hex');
  const b = Buffer.from(hashArmazenado, 'hex');
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
