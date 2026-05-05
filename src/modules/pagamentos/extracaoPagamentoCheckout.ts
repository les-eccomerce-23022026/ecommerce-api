/**
 * Extração e validação de payload do checkout (POST /pagamento/processar).
 */

import { PARCELAS_CARTAO_MAX } from './IPagamento.dto';

export interface CheckoutPagamentoExtraido {
  idIntencao: string;
  segredoConfirmacao: string;
  valorTotal: number;
  pagamentosCartao: Array<{ valor: number; parcelasCartao?: number; magicRecusar?: boolean }>;
  cuponsAplicados?: Array<{ uuid: string; codigo: string; tipo: string; valor: number }>;
  vendaUuid?: string;
}

function credenciaisIntencaoCupomSomente(
  idIntencao: string,
  segredoConfirmacao: string,
): { idIntencao: string; segredoConfirmacao: string } {
  return {
    idIntencao: idIntencao || 'CUPOM-ONLY',
    segredoConfirmacao: segredoConfirmacao || 'CUPOM-ONLY',
  };
}

function extrairCredenciaisIntencao(corpo: Record<string, unknown>, is100PercentCoupon: boolean): {
  idIntencao: string;
  segredoConfirmacao: string;
} {
  const idIntencao = typeof corpo.idIntencao === 'string' ? corpo.idIntencao.trim() : '';
  const segredoConfirmacao =
    typeof corpo.segredoConfirmacao === 'string' ? corpo.segredoConfirmacao.trim() : '';
  if (is100PercentCoupon && (!idIntencao || !segredoConfirmacao)) {
    return credenciaisIntencaoCupomSomente(idIntencao, segredoConfirmacao);
  }
  if (!idIntencao || !segredoConfirmacao) {
    throw new Error('Intenção de pagamento ausente ou inválida');
  }
  return { idIntencao, segredoConfirmacao };
}

function extrairValorTotalCheckout(corpo: Record<string, unknown>, is100PercentCoupon: boolean): number {
  const valorTotal = Number(corpo.valorTotal);
  if (is100PercentCoupon && valorTotal === 0) {
    return 0;
  }
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
): Array<{ valor: number; parcelasCartao?: number; magicRecusar?: boolean }> {
  return pagamentosBrutos.map((item, indice) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Item de pagamento com cartão inválido (índice ${indice})`);
    }
    const raw = item as { valor?: unknown; parcelasCartao?: unknown; magicRecusar?: unknown };
    const v = Number(raw.valor);
    if (!Number.isFinite(v)) {
      throw new Error('Valor de cartão inválido');
    }
    const parcelasCartao = normalizarParcelasCartao(raw.parcelasCartao, indice);
    const magicRecusar = raw.magicRecusar === true;
    return {
      valor: v,
      ...(parcelasCartao !== undefined ? { parcelasCartao } : {}),
      ...(magicRecusar ? { magicRecusar } : {}),
    };
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

function mapearCuponsAplicados(cuponsBrutos: unknown): Array<{ uuid: string; codigo: string; tipo: string; valor: number }> {
  if (!Array.isArray(cuponsBrutos)) {
    return [];
  }
  return cuponsBrutos.map((item, indice) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Item de cupom inválido (índice ${indice})`);
    }
    const raw = item as { uuid?: unknown; codigo?: unknown; tipo?: unknown; valor?: unknown };
    return {
      uuid: String(raw.uuid ?? ''),
      codigo: String(raw.codigo ?? ''),
      tipo: String(raw.tipo ?? ''),
      valor: Number(raw.valor ?? 0),
    };
  });
}

export function extrairCheckoutPagamento(corpo: Record<string, unknown>): CheckoutPagamentoExtraido {
  if (!corpo || typeof corpo !== 'object') {
    throw new Error('Payload inválido');
  }

  const pagamentosBrutos = corpo.pagamentosCartao;
  if (!Array.isArray(pagamentosBrutos)) {
    throw new Error('Payload inválido');
  }

  const cuponsAplicados = mapearCuponsAplicados(corpo.cuponsAplicados);
  const is100PercentCoupon = cuponsAplicados.length > 0 && pagamentosBrutos.length === 0;

  const credenciais = extrairCredenciaisIntencao(corpo, is100PercentCoupon);
  const valorTotal = extrairValorTotalCheckout(corpo, is100PercentCoupon);
  const pagamentosCartao = mapearPagamentosCartao(pagamentosBrutos);
  garantirSomaIgualTotal(pagamentosCartao, valorTotal);

  const vendaUuid = extrairVendaUuidOpcionalCheckout(corpo);

  return { ...credenciais, valorTotal, pagamentosCartao, cuponsAplicados, vendaUuid };
}
