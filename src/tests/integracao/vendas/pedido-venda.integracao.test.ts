import request from 'supertest';
import { Application } from 'express';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';
import { LIVRO_UUID_TESTE, payloadPedidoValido } from '@/tests/helpers/pedido-venda.helper';

const EMAIL_CLIENTE_B = 'cliente.b.pedido@email.com';
const CPF_CLIENTE_B = '111.222.333-44';

async function logApi(reqPromise: Promise<import('supertest').Response>) {
  const res = await reqPromise;
  // Comentado para evitar lint errors
  // console.log(`\n🚀 [API CALL] ${req.method} ${req.url}`);
  // if (req._data) {
  //   console.log(`📦 PAYLOAD: ${JSON.stringify(req._data).substring(0, 200)}`);
  // }
  // const count = Array.isArray(res.body) ? res.body.length : (res.body ? 1 : 0);
  // console.log(`✅ RESPONSE COUNT: ${count}`);
  return res;
}

/**
 * Pedido de venda (cliente autenticado): POST /vendas, GET /vendas/:uuid, GET /minhas-vendas.
 * Organizado em cenários felizes e de falha (alinhado aos bdd/vendas).
 */
describe('Integração — Vendas / pedido do cliente', () => {
  const contexto = configurarTesteIntegracao();
  let app: Application;
  let tokenCliente: string;

  beforeAll(async () => {
    app = contexto.app;
    tokenCliente = await obterTokenCliente(app);
  });

  let tokenClienteB: string;

  beforeAll(async () => {
    tokenClienteB = await obterTokenCliente(app, EMAIL_CLIENTE_B, CPF_CLIENTE_B);
  });

  describe('POST /api/vendas', () => {
    describe('cenários felizes', () => {
      it('[RF0033][RF0037][RN0038] cria pedido com status EM PROCESSAMENTO e totais coerentes', async () => {
        const body = payloadPedidoValido({ precoUnitario: 50, quantidade: 1, valorFrete: 10 });

        const res = await logApi(request(app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send(body));

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('EM PROCESSAMENTO');
        expect(res.body.totalVenda).toBe(60);
        expect(res.body.id).toBeDefined();
        expect(res.body.itens).toHaveLength(1);
      });

      it('[RF0025] permite consultar o mesmo pedido em GET /vendas/:uuid', async () => {
        const body = payloadPedidoValido({ precoUnitario: 30, quantidade: 2, valorFrete: 5 });
        const criado = await logApi(request(app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send(body));

        const vendaUuid = criado.body.id as string;

        const det = await logApi(request(app)
          .get(`/api/vendas/${vendaUuid}`)
          .set('Authorization', `Bearer ${tokenCliente}`));

        expect(det.status).toBe(200);
        expect(det.body.id).toBe(vendaUuid);
        expect(det.body.status).toBe('EM PROCESSAMENTO');
      });
    });

    describe('cenários de falha', () => {
      it('[RNF0037] retorna 401 sem token', async () => {
        const res = await logApi(request(app).post('/api/vendas').send(payloadPedidoValido()));

        expect(res.status).toBe(401);
        expect(res.body.sucesso).toBe(false);
      });

      it('[RF0033] retorna 400 quando não há itens no pedido', async () => {
        const res = await logApi(request(app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({
            itens: [],
            valorTotalItens: 0,
            valorFrete: 0,
            valorTotal: 0,
          }));

        expect(res.status).toBe(400);
        expect(res.body.erro).toMatch(/item/i);
      });

      it('[RN0037] retorna 400 quando valor total é inválido (<= 0)', async () => {
        const res = await logApi(request(app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({
            itens: [{ livroUuid: LIVRO_UUID_TESTE, quantidade: 1, precoUnitario: 10 }],
            valorTotalItens: 10,
            valorFrete: 0,
            valorTotal: 0,
          }));

        expect(res.status).toBe(400);
        expect(res.body.erro).toMatch(/Valor total/i);
      });

      it('[RN0069] retorna 400 ao tentar parcelar compra < R$ 80', async () => {
        const res = await logApi(request(app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send(payloadPedidoValido({ precoUnitario: 50, quantidade: 1, valorFrete: 10, parcelas: 2 })));

        expect(res.status).toBe(400);
        expect(res.body.erro).toMatch(/RN0069/i);
      });

      it('[RN0034] retorna 400 se um dos cartões no split for < R$ 10', async () => {
        const res = await logApi(request(app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({
            ...payloadPedidoValido({ precoUnitario: 50, quantidade: 1, valorFrete: 10 }),
            pagamentos: [
              { tipo: 'cartao', valor: 55 },
              { tipo: 'cartao', valor: 5 }, // Invalida RN0034 (mínimo 10)
            ],
          }));

        expect(res.status).toBe(400);
        expect(res.body.erro).toMatch(/RN0034/i);
      });

    });
  });

  describe('GET /api/vendas/:uuid — isolamento entre clientes', () => {
    it('[RNF0037] cliente B recebe 404 ao tentar acessar pedido do cliente A', async () => {
      const criado = await logApi(request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payloadPedidoValido({ precoUnitario: 20, quantidade: 1, valorFrete: 5 })));

      expect(criado.status).toBe(201);
      const vendaUuid = criado.body.id as string;

      const res = await logApi(request(app)
        .get(`/api/vendas/${vendaUuid}`)
        .set('Authorization', `Bearer ${tokenClienteB}`));

      expect(res.status).toBe(404);
      expect(res.body.erro).toMatch(/não encontrada/i);
    });
  });

  describe('GET /api/vendas/:uuid', () => {
    describe('cenários de falha', () => {
      it('[RF0025] retorna 404 para UUID inexistente', async () => {
        const res = await logApi(request(app)
          .get('/api/vendas/00000000-0000-0000-0000-00000000beef')
          .set('Authorization', `Bearer ${tokenCliente}`));

        expect(res.status).toBe(404);
        expect(res.body.erro).toMatch(/não encontrada/i);
      });

      it('[RNF0037] retorna 401 sem token', async () => {
        const res = await logApi(request(app).get('/api/vendas/00000000-0000-0000-0000-00000000beef'));

        expect(res.status).toBe(401);
      });
    });
  });

  describe('GET /api/minhas-vendas', () => {
    it('[RF0025] cenário feliz: retorna lista com pedidos do cliente', async () => {
      await logApi(request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payloadPedidoValido({ precoUnitario: 40, quantidade: 1, valorFrete: 5 })));

      const res = await logApi(request(app)
        .get('/api/minhas-vendas')
        .set('Authorization', `Bearer ${tokenCliente}`));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toMatchObject({
        id: expect.any(String),
        status: expect.any(String),
      });
    });

    it('[RNF0037] cenário de falha: retorna 401 sem token', async () => {
      const res = await logApi(request(app).get('/api/minhas-vendas'));

      expect(res.status).toBe(401);
    });
  });
});

/**
 * COMO RODAR ESTE TESTE:
 * cd backend
 * npm test src/tests/integracao/vendas/pedido-venda.integracao.test.ts
 */
