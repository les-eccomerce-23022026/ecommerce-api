import request from 'supertest';
import { Application } from 'express';
import { LIVRO_UUID_TESTE } from '@/tests/helpers/pedido-venda.helper';

/** Cartões com Luhn válido e bandeiras aceitas por `CartaoCredito`. */
export const CARTAO_VISA_TESTE = {
  numero: '4111111111111111',
  nomeTitular: 'CLIENTE INTEGRACAO',
  validade: '12/30',
  bandeira: 'Visa',
};

export const CARTAO_MASTERCARD_TESTE = {
  numero: '5500000000000004',
  nomeTitular: 'CLIENTE INTEGRACAO',
  validade: '06/31',
  bandeira: 'Mastercard',
};

export type CotacaoPac = {
  cotacaoUuid: string;
  valorFrete: number;
};

async function logApi(reqPromise: Promise<any>) {
  const res = await reqPromise;
  const req = (res as any).request;
  console.log(`\n🚀 [API CALL] ${req.method} ${req.url}`);
  if (req._data) {
    console.log(`📦 PAYLOAD: ${JSON.stringify(req._data).substring(0, 200)}`);
  }
  const count = Array.isArray(res.body) ? res.body.length : (res.body ? 1 : 0);
  console.log(`✅ RESPONSE COUNT: ${count}`);
  return res;
}

/**
 * Cota frete simulado e retorna a opção PAC (uuid + valor) para uso em `POST /vendas` com `cotacaoUuid`.
 */
export async function cotarFretePac(
  app: Application,
  token: string,
  valorTotalItens: number,
): Promise<CotacaoPac> {
  const res = await logApi(request(app)
    .post('/api/frete/cotar')
    .set('Authorization', `Bearer ${token}`)
    .send({
      cepDestino: '01310100',
      pesoKg: 1,
      valorTotalItens,
    }));

  if (res.status !== 200) {
    throw new Error(`frete/cotar: ${res.status} ${JSON.stringify(res.body)}`);
  }

  const pac = res.body.opcoes.find((o: { tipo: string }) => o.tipo === 'PAC');
  if (!pac) {
    throw new Error('Opção PAC não retornada pelo provedor simulado');
  }

  return {
    cotacaoUuid: pac.cotacaoUuid as string,
    valorFrete: Number(pac.valor),
  };
}

/**
 * Partes de pagamento: cupom promocional + troca + dois cartões (≥ R$ 10 cada no restante).
 * Ajuste `promo`/`troca` se `valorTotal` for baixo demais.
 */
export function montarPartesPagamentoCuponsEDoisCartoes(valorTotal: number): {
  promo: number;
  troca: number;
  cartaoVisa: number;
  cartaoMastercard: number;
} {
  const promo = 10;
  const troca = 31;
  const resto = Math.round((valorTotal - promo - troca) * 100) / 100;
  if (resto < 20) {
    throw new Error(
      `valorTotal ${valorTotal} insuficiente: restante após cupons (${resto}) deve ser ≥ 20 para dois cartões ≥ 10`,
    );
  }
  const cartaoVisa = Math.round((resto / 2) * 100) / 100;
  const cartaoMastercard = Math.round((resto - cartaoVisa) * 100) / 100;
  return { promo, troca, cartaoVisa, cartaoMastercard };
}

export function payloadVendaComCotacao(
  cotacao: CotacaoPac,
  precoUnitario: number,
  quantidade: number,
): Record<string, unknown> {
  const valorTotalItens = Math.round(precoUnitario * quantidade * 100) / 100;
  const valorTotal = Math.round((valorTotalItens + cotacao.valorFrete) * 100) / 100;
  return {
    itens: [{ livroUuid: LIVRO_UUID_TESTE, quantidade, precoUnitario }],
    valorTotalItens,
    valorFrete: cotacao.valorFrete,
    valorTotal,
    cotacaoUuid: cotacao.cotacaoUuid,
  };
}
