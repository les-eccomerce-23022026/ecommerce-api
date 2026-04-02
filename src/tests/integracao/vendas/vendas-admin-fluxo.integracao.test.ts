import request from 'supertest';
import { Application } from 'express';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenAdmin, obterTokenCliente } from '@/tests/utils/requisicoes-api.util';
import { criarAdminComumObterToken } from '@/tests/helpers/admin-testes.helper';
import {
  aprovarPagamentoDaVenda,
  corpoAgendarEntrega,
  criarVendaPedido,
} from '@/tests/helpers/vendas-admin-fluxo.helper';

/**
 * Fluxo de vendas sob a perspectiva do administrador (RF0024, RF0038),
 * alinhado a `bdd/vendas/cenarios-admin-*.md`.
 *
 * - RF0024: GET /api/clientes
 * - RF0038: POST /api/entregas → status EM TRÂNSITO (qualquer JWT válido na API atual)
 */
describe('Integração — Vendas / fluxo administrativo', () => {
  const contexto = configurarTesteIntegracao();
  let app: Application;
  let tokenCliente: string;
  let tokenAdminMestre: string;
  let tokenAdminComum: string;

  beforeAll(async () => {
    app = contexto.app;
    tokenCliente = await obterTokenCliente(app);
    tokenAdminMestre = await obterTokenAdmin(app);
    const criado = await criarAdminComumObterToken(app, tokenAdminMestre);
    tokenAdminComum = criado.token;
  });

  describe('Cenários felizes', () => {
    describe('GET /api/clientes — consulta administrativa (RF0024)', () => {
      it('permite ao administrador mestre listar clientes com paginação', async () => {
        const res = await request(app)
          .get('/api/clientes')
          .query({ pagina: 1, limite: 5 })
          .set('Authorization', `Bearer ${tokenAdminMestre}`);

        expect(res.status).toBe(200);
        expect(res.body.sucesso).toBe(true);
        expect(Array.isArray(res.body.dados.clientes)).toBe(true);
        expect(res.body.dados.pagina).toBe(1);
        expect(res.body.dados.limite).toBe(5);
      });

      it('permite ao administrador comum listar clientes', async () => {
        const res = await request(app)
          .get('/api/clientes')
          .query({ pagina: 1, limite: 10 })
          .set('Authorization', `Bearer ${tokenAdminComum}`);

        expect(res.status).toBe(200);
        expect(res.body.sucesso).toBe(true);
        expect(Array.isArray(res.body.dados.clientes)).toBe(true);
      });
    });

    describe('POST /api/entregas — despacho EM TRÂNSITO (RF0038)', () => {
      it('administrador mestre agenda entrega e a venda passa a EM TRÂNSITO', async () => {
        const { vendaUuid } = await criarVendaPedido(app, tokenCliente, {
          precoUnitario: 40,
          quantidade: 1,
          valorFrete: 8,
        });

        const resEntrega = await request(app)
          .post('/api/entregas')
          .set('Authorization', `Bearer ${tokenAdminMestre}`)
          .send(corpoAgendarEntrega(vendaUuid));

        expect(resEntrega.status).toBe(201);
        expect(resEntrega.body.vendaUuid).toBe(vendaUuid);

        const resVenda = await request(app)
          .get(`/api/vendas/${vendaUuid}`)
          .set('Authorization', `Bearer ${tokenCliente}`);

        expect(resVenda.status).toBe(200);
        expect(resVenda.body.status).toBe('EM TRÂNSITO');
      });

      it('administrador comum pode agendar entrega (mesma regra de autenticação)', async () => {
        const { vendaUuid } = await criarVendaPedido(app, tokenCliente, {
          precoUnitario: 25,
          quantidade: 2,
          valorFrete: 5,
        });

        const resEntrega = await request(app)
          .post('/api/entregas')
          .set('Authorization', `Bearer ${tokenAdminComum}`)
          .send(corpoAgendarEntrega(vendaUuid));

        expect(resEntrega.status).toBe(201);

        const resVenda = await request(app)
          .get(`/api/vendas/${vendaUuid}`)
          .set('Authorization', `Bearer ${tokenCliente}`);

        expect(resVenda.body.status).toBe('EM TRÂNSITO');
      });

      it('fluxo completo: pedido, pagamento aprovado, admin agenda entrega e consulta entregas', async () => {
        const { vendaUuid, valorTotal } = await criarVendaPedido(app, tokenCliente, {
          precoUnitario: 55,
          quantidade: 1,
          valorFrete: 10,
        });

        await aprovarPagamentoDaVenda(app, tokenCliente, vendaUuid, valorTotal);

        const resEntrega = await request(app)
          .post('/api/entregas')
          .set('Authorization', `Bearer ${tokenAdminMestre}`)
          .send(corpoAgendarEntrega(vendaUuid));

        expect(resEntrega.status).toBe(201);
        const entregaUuid = resEntrega.body.uuid as string;
        expect(entregaUuid).toBeDefined();

        const resLista = await request(app)
          .get('/api/entregas')
          .query({ vendaUuid })
          .set('Authorization', `Bearer ${tokenAdminMestre}`);

        expect(resLista.status).toBe(200);
        expect(Array.isArray(resLista.body)).toBe(true);
        expect(resLista.body.some((e: { uuid: string }) => e.uuid === entregaUuid)).toBe(true);

        const resUma = await request(app)
          .get(`/api/entregas/${entregaUuid}`)
          .set('Authorization', `Bearer ${tokenAdminMestre}`);

        expect(resUma.status).toBe(200);
        expect(resUma.body.vendaUuid).toBe(vendaUuid);
        expect(resUma.body.tipoFrete).toBe('SEDEX');
      });
    });
  });

  describe('Cenários de falha', () => {
    describe('GET /api/clientes', () => {
      it('retorna 403 quando o token é de cliente', async () => {
        const res = await request(app)
          .get('/api/clientes')
          .query({ pagina: 1, limite: 5 })
          .set('Authorization', `Bearer ${tokenCliente}`);

        expect(res.status).toBe(403);
        expect(res.body.mensagem).toMatch(/administrador/i);
      });

      it('retorna 401 sem Authorization', async () => {
        const res = await request(app).get('/api/clientes').query({ pagina: 1, limite: 5 });

        expect(res.status).toBe(401);
      });
    });

    describe('POST /api/entregas', () => {
      it('retorna 401 sem token', async () => {
        const res = await request(app)
          .post('/api/entregas')
          .send(corpoAgendarEntrega('00000000-0000-0000-0000-00000000beef'));

        expect(res.status).toBe(401);
      });

      it('retorna 400 quando a venda não existe', async () => {
        const res = await request(app)
          .post('/api/entregas')
          .set('Authorization', `Bearer ${tokenAdminMestre}`)
          .send(corpoAgendarEntrega('00000000-0000-0000-0000-00000000beef'));

        expect(res.status).toBe(400);
        expect(res.body.erro).toMatch(/não encontrada/i);
      });
    });

    describe('GET /api/entregas', () => {
      it('retorna 400 sem query vendaUuid', async () => {
        const res = await request(app)
          .get('/api/entregas')
          .set('Authorization', `Bearer ${tokenAdminMestre}`);

        expect(res.status).toBe(400);
        expect(res.body.erro).toMatch(/obrigatório/i);
      });
    });

    describe('GET /api/entregas/:entregaUuid', () => {
      it('retorna 404 para UUID de entrega inexistente', async () => {
        const res = await request(app)
          .get('/api/entregas/00000000-0000-0000-0000-00000000cafe')
          .set('Authorization', `Bearer ${tokenAdminMestre}`);

        expect(res.status).toBe(404);
        expect(res.body.erro).toMatch(/não encontrada/i);
      });
    });
  });
});
