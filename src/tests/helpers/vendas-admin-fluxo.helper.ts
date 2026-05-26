import request from 'supertest';
import { Application } from 'express';
import { payloadPedidoValido, LIVRO_UUID_TESTE } from '@/tests/helpers/pedido-venda.helper';

const cartaoCheckout = {
  numero: '4111111111111111',
  nomeTitular: 'Cliente Fluxo Admin',
  validade: '12/30',
  bandeira: 'Visa',
};

export type VendaCriada = {
  vendaUuid: string;
  valorTotal: number;
};

/**
 * Cria um pedido (POST /vendas) e retorna id + total para checkout.
 */
export async function criarVendaPedido(
  app: Application,
  tokenCliente: string,
  opcoes?: Parameters<typeof payloadPedidoValido>[1],
): Promise<VendaCriada> {
  const body = payloadPedidoValido(LIVRO_UUID_TESTE, opcoes);
  const res = await request(app)
    .post('/api/vendas')
    .set('Authorization', `Bearer ${tokenCliente}`)
    .send(body);

  if (res.status !== 201) {
    throw new Error(`Falha ao criar venda: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    vendaUuid: res.body.id as string,
    valorTotal: Number(res.body.totalVenda),
  };
}

/**
 * Seleciona cartão e processa pagamento até status APROVADO (mesmo fluxo dos testes de pagamentos).
 */
export async function aprovarPagamentoDaVenda(
  app: Application,
  tokenCliente: string,
  vendaUuid: string,
  valorTotal: number,
): Promise<string> {
  const resSel = await request(app)
    .post('/api/pagamentos/selecionar')
    .set('Authorization', `Bearer ${tokenCliente}`)
    .send({
      vendaUuid,
      valor: valorTotal,
      tipoPagamento: 'cartao_credito',
      cartao: cartaoCheckout,
    });

  if (resSel.status !== 201) {
    throw new Error(`Selecionar pagamento: ${resSel.status} ${JSON.stringify(resSel.body)}`);
  }

  const pagamentoUuid = resSel.body.id as string;

  const resProc = await request(app)
    .post(`/api/pagamentos/${pagamentoUuid}/processar`)
    .set('Authorization', `Bearer ${tokenCliente}`);

  if (resProc.status !== 200 || resProc.body.status !== 'APROVADO') {
    throw new Error(`Processar pagamento: ${resProc.status} ${JSON.stringify(resProc.body)}`);
  }

  return pagamentoUuid;
}

/** `custo` deve coincidir com `ven_frete` da venda. */
export function corpoAgendarEntrega(vendaUuid: string, custoFrete = 10): Record<string, unknown> {
  return {
    vendaUuid,
    tipoFrete: 'SEDEX',
    endereco: { logradouro: 'Rua Admin Fluxo', numero: '100', cidade: 'São Paulo' },
    custo: custoFrete,
    entregador: 'Transportadora Teste',
  };
}
