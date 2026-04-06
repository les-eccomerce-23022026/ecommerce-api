/**
 * Extração e validação de payload do checkout (POST /pagamento/processar).
 */

import { PARCELAS_CARTAO_MAX } from './IPagamento.dto';

export interface CheckoutPagamentoExtraido {
  idIntencao: string;
  segredoConfirmacao: string;
  valorTotal: number;
  pagamentosCartao: Array<{ valor: number; parcelasCartao?: number }>;
  vendaUuid?: string;
}

function extrairCredenciaisIntencao(corpo: Record<string, unknown>): {
  idIntencao: string;
  segredoConfirmacao: string;
} {
  const idIntencao = typeof corpo.idIntencao === 'string' ? corpo.idIntencao.trim() : '';
  const segredoConfirmacao =
    typeof corpo.segredoConfirmacao === 'string' ? corpo.segredoConfirmacao.trim() : '';
  if (!idIntencao || !segredoConfirmacao) {
    throw new Error('Intenção de pagamento ausente ou inválida');
  }
  return { idIntencao, segredoConfirmacao };
}

function extrairValorTotalCheckout(corpo: Record<string, unknown>): number {
  const valorTotal = Number(corpo.valorTotal);
  if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
    throw new Error('valorTotal inválido');
  }
  return valorTotal;
}

function normalizarParcelasCartao(bruto: unknown, indice: number): number | undefined {
  if (bruto === undefined || bruto === null) {
    return undefined;
  }
  const n = Number(bruto);
  if (!Number.isInteger(n) || n < 1 || n > PARCELAS_CARTAO_MAX) {
    throw new Error(
      `parcelasCartao inválido (índice ${indice}); use inteiro entre 1 e ${PARCELAS_CARTAO_MAX}`,
    );
  }
  return n;
}

function mapearPagamentosCartao(
  pagamentosBrutos: unknown[],
): Array<{ valor: number; parcelasCartao?: number }> {
  return pagamentosBrutos.map((item, indice) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Item de pagamento com cartão inválido (índice ${indice})`);
    }
    const raw = item as { valor?: unknown; parcelasCartao?: unknown };
    const v = Number(raw.valor);
    if (!Number.isFinite(v)) {
      throw new Error('Valor de cartão inválido');
    }
    const parcelasCartao = normalizarParcelasCartao(raw.parcelasCartao, indice);
    return parcelasCartao !== undefined ? { valor: v, parcelasCartao } : { valor: v };
  });
}

function garantirSomaIgualTotal(
  pagamentosCartao: Array<{ valor: number; parcelasCartao?: number }>,
  valorTotal: number,
): void {
  const soma = pagamentosCartao.reduce((acc, p) => acc + p.valor, 0);
  if (Math.abs(soma - valorTotal) > 0.01) {
    throw new Error('Soma dos pagamentos não confere com o valor total');
  }
}

function extrairVendaUuidOpcionalCheckout(corpo: Record<string, unknown>): string | undefined {
  if (typeof corpo.vendaUuid !== 'string') {
    return undefined;
  }
  const t = corpo.vendaUuid.trim();
  return t === '' ? undefined : t;
}

export function extrairCheckoutPagamento(corpo: Record<string, unknown>): CheckoutPagamentoExtraido {
  if (!corpo || typeof corpo !== 'object') {
    throw new Error('Payload inválido');
  }

  const pagamentosBrutos = corpo.pagamentosCartao;
  if (!Array.isArray(pagamentosBrutos)) {
    throw new Error('Payload inválido');
  }

  const credenciais = extrairCredenciaisIntencao(corpo);
  const valorTotal = extrairValorTotalCheckout(corpo);
  const pagamentosCartao = mapearPagamentosCartao(pagamentosBrutos);
  garantirSomaIgualTotal(pagamentosCartao, valorTotal);

  const vendaUuid = extrairVendaUuidOpcionalCheckout(corpo);

  return { ...credenciais, valorTotal, pagamentosCartao, vendaUuid };
}
