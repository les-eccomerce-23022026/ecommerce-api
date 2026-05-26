import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/** TTL da cobrança PIX simulada (minutos). */
export function obterTtlMinutosPixCobranca(): number {
  const bruto = process.env.PIX_COBRANCA_TTL_MINUTOS?.trim();
  if (!bruto) {
    return 30;
  }
  const n = Number(bruto);
  if (!Number.isFinite(n) || n <= 0) {
    return 30;
  }
  return Math.min(n, 120);
}

/**
 * Gera payload de cobrança PIX simulada (BR Code fictício + QR 1x1 + segredo para webhook).
 */
export function gerarDadosCobrancaPixSimulada(valor: number): {
  copiaCola: string;
  qrBase64: string;
  expiraEm: Date;
  segredoConfirmacao: string;
} {
  const segredoConfirmacao = randomBytes(32).toString('hex');
  const centavos = Math.round(valor * 100);
  const idTx = uuidv4().replace(/-/g, '').slice(0, 12);
  const copiaCola =
    `00020126580014br.gov.bcb.pix0136${idTx}-fatec-${centavos}` +
    `5204000053039865802BR5913FatecLabBooks6009SAOPAULO62070503***63${idTx.slice(0, 4)}`;
  const qrBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const ttlMin = obterTtlMinutosPixCobranca();
  const expiraEm = new Date(Date.now() + ttlMin * 60 * 1000);
  return { copiaCola, qrBase64, expiraEm, segredoConfirmacao };
}
