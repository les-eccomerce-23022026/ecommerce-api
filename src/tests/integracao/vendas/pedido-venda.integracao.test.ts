import request from 'supertest';
import { Application } from 'express';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';
import { LIVRO_UUID_TESTE, payloadPedidoValido } from '@/tests/helpers/pedido-venda.helper';

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

  describe('POST /api/vendas', () => {
    describe('cenários felizes', () => {
      it('cria pedido com status EM PROCESSAMENTO e totais coerentes', async () => {
        const body = payloadPedidoValido({ precoUnitario: 50, quantidade: 1, valorFrete: 10 });

        const res = await request(app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send(body);

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('EM PROCESSAMENTO');
        expect(res.body.totalVenda).toBe(60);
        expect(res.body.id).toBeDefined();
        expect(res.body.itens).toHaveLength(1);
      });

      it('permite consultar o mesmo pedido em GET /vendas/:uuid', async () => {
        const body = payloadPedidoValido({ precoUnitario: 30, quantidade: 2, valorFrete: 5 });
        const criado = await request(app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send(body);

        const vendaUuid = criado.body.id as string;

        const det = await request(app)
          .get(`/api/vendas/${vendaUuid}`)
          .set('Authorization', `Bearer ${tokenCliente}`);

        expect(det.status).toBe(200);
        expect(det.body.id).toBe(vendaUuid);
        expect(det.body.status).toBe('EM PROCESSAMENTO');
      });
    });

    describe('cenários de falha', () => {
      it('retorna 401 sem token', async () => {
        const res = await request(app).post('/api/vendas').send(payloadPedidoValido());

        expect(res.status).toBe(401);
        expect(res.body.sucesso).toBe(false);
      });

      it('retorna 400 quando não há itens no pedido', async () => {
        const res = await request(app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({
            itens: [],
            valorTotalItens: 0,
            valorFrete: 0,
            valorTotal: 0,
          });

        expect(res.status).toBe(400);
        expect(res.body.erro).toMatch(/item/i);
      });

      it('retorna 400 quando valor total é inválido (<= 0)', async () => {
        const res = await request(app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({
            itens: [{ livroUuid: LIVRO_UUID_TESTE, quantidade: 1, precoUnitario: 10 }],
            valorTotalItens: 10,
            valorFrete: 0,
            valorTotal: 0,
          });

        expect(res.status).toBe(400);
        expect(res.body.erro).toMatch(/Valor total/i);
      });
    });
  });

  describe('GET /api/vendas/:uuid', () => {
    describe('cenários de falha', () => {
      it('retorna 404 para UUID inexistente', async () => {
        const res = await request(app)
          .get('/api/vendas/00000000-0000-0000-0000-00000000beef')
          .set('Authorization', `Bearer ${tokenCliente}`);

        expect(res.status).toBe(404);
        expect(res.body.erro).toMatch(/não encontrada/i);
      });

      it('retorna 401 sem token', async () => {
        const res = await request(app).get('/api/vendas/00000000-0000-0000-0000-00000000beef');

        expect(res.status).toBe(401);
      });
    });
  });

  describe('GET /api/minhas-vendas', () => {
    it('cenário feliz: retorna lista com pedidos do cliente', async () => {
      await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payloadPedidoValido({ precoUnitario: 40, quantidade: 1, valorFrete: 5 }));

      const res = await request(app)
        .get('/api/minhas-vendas')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toMatchObject({
        id: expect.any(String),
        status: expect.any(String),
      });
    });

    it('cenário de falha: retorna 401 sem token', async () => {
      const res = await request(app).get('/api/minhas-vendas');

      expect(res.status).toBe(401);
    });
  });
});
