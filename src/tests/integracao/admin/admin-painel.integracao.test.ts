import request from 'supertest';
import { Application } from 'express';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenAdmin, obterTokenCliente } from '@/tests/utils/requisicoes-api.util';
import { aprovarPagamentoDaVenda, criarVendaPedido } from '@/tests/helpers/vendas-admin-fluxo.helper';

describe('Integração — Painel administrativo (dashboard e pedidos)', () => {
  const contexto = configurarTesteIntegracao();
  let app: Application;
  let tokenAdmin: string;
  let tokenCliente: string;

  beforeAll(async () => {
    app = contexto.app;
    tokenAdmin = await obterTokenAdmin(app);
    tokenCliente = await obterTokenCliente(app);
  });

  describe('GET /api/admin/dashboard', () => {
    it('retorna métricas e gráficos envelopados em sucesso', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados).toBeDefined();
      expect(res.body.dados.metricas).toBeDefined();
      expect(res.body.dados.metricas).toHaveProperty('totalVendasMes');
      expect(res.body.dados).toHaveProperty('graficoReceitaAnual');
      expect(res.body.dados).toHaveProperty('graficoStatusPedidos');
      expect(res.body.dados).toHaveProperty('atividadesRecentes');
      expect(Array.isArray(res.body.dados.atividadesRecentes)).toBe(true);
    });

    it('retorna 403 para token de cliente', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/pedidos', () => {
    it('retorna lista (array) para administrador', async () => {
      const res = await request(app)
        .get('/api/admin/pedidos')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Fluxo despacho e entrega via rotas admin', () => {
    it('despacha pedido EM PROCESSAMENTO e confirma entrega', async () => {
      const { vendaUuid, valorTotal } = await criarVendaPedido(app, tokenCliente, {
        precoUnitario: 30,
        quantidade: 1,
        valorFrete: 10,
      });

      await aprovarPagamentoDaVenda(app, tokenCliente, vendaUuid, valorTotal);

      const resDesp = await request(app)
        .put(`/api/admin/pedidos/${vendaUuid}/despachar`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(resDesp.status).toBe(200);
      expect(resDesp.body.uuid).toBe(vendaUuid);
      expect(resDesp.body.status).toBe('Em Trânsito');

      const resVenda = await request(app)
        .get(`/api/vendas/${vendaUuid}`)
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(resVenda.body.status).toBe('EM TRÂNSITO');

      const resEnt = await request(app)
        .put(`/api/admin/pedidos/${vendaUuid}/entrega`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(resEnt.status).toBe(200);
      expect(resEnt.body.status).toBe('Entregue');

      const resFinal = await request(app)
        .get(`/api/vendas/${vendaUuid}`)
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(resFinal.body.status).toBe('ENTREGUE');
    });

    it('rejeita despacho duplicado (já em trânsito)', async () => {
      const { vendaUuid, valorTotal } = await criarVendaPedido(app, tokenCliente, {
        precoUnitario: 20,
        quantidade: 1,
        valorFrete: 8,
      });

      await aprovarPagamentoDaVenda(app, tokenCliente, vendaUuid, valorTotal);

      await request(app)
        .put(`/api/admin/pedidos/${vendaUuid}/despachar`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      const res2 = await request(app)
        .put(`/api/admin/pedidos/${vendaUuid}/despachar`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res2.status).toBe(400);
      expect(res2.body.sucesso).toBe(false);
    });
  });
});
