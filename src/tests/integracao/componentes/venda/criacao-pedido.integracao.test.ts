import request from 'supertest';
import { Application } from 'express';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenCliente, gerarCpfValidoUnico } from '@/tests/helpers/requisicoes-api.util';
import { payloadPedidoValido } from '@/tests/helpers/pedido-venda.helper';
import { garantirLivroComEstoqueParaCarrinho } from '@/tests/helpers/carrinho-integracao.helper';

const EMAIL_CLIENTE_B = `cliente.b.pedido.${Date.now()}@email.com`;


/**
 * Pedido de venda (cliente autenticado): POST /vendas, GET /vendas/:uuid, GET /minhas-vendas.
 * Organizado em cenários felizes e de falha (alinhado aos bdd/vendas).
 */
describe('Integração — Vendas / pedido do cliente', () => {
  const contexto = configurarTesteIntegracao();
  let app: Application;
  let tokenCliente: string;
  let livroUuid: string;

  beforeAll(async () => {
    app = contexto.app;
    tokenCliente = await obterTokenCliente(app);
  });

  beforeEach(async () => {
    // Criar livro dinamicamente para isolamento do teste (escopo já iniciado no beforeEach)
    const livro = await garantirLivroComEstoqueParaCarrinho(contexto.db!);
    livroUuid = livro.livUuid;
  });

  let tokenClienteB: string;

  beforeAll(async () => {
    tokenClienteB = await obterTokenCliente(app, EMAIL_CLIENTE_B, gerarCpfValidoUnico());
  });

  describe('POST /api/vendas', () => {
    describe('cenários felizes', () => {
      it('[RF0033][RF0037][RN0038] cria pedido com status EM PROCESSAMENTO e totais coerentes', async () => {
        const body = payloadPedidoValido(livroUuid, { precoUnitario: 50, quantidade: 1, valorFrete: 10 });

        const res = await request(app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send(body);

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('EM PROCESSAMENTO');
        expect(res.body.totalVenda).toBe(60);
        expect(typeof res.body.id).toBe('string');
        expect(res.body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        expect(res.body.itens).toHaveLength(1);
      });

      it('[RF0025] permite consultar o mesmo pedido em GET /vendas/:uuid', async () => {
        const body = payloadPedidoValido(livroUuid, { precoUnitario: 30, quantidade: 2, valorFrete: 5 });
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
      it('[RNF0037] retorna 401 sem token', async () => {
        const res = await request(app).post('/api/vendas').send(payloadPedidoValido(livroUuid));

        expect(res.status).toBe(401);
        expect(res.body.sucesso).toBe(false);
      });

      it('[RF0033] retorna 400 quando não há itens no pedido', async () => {
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

      it('[RN0037] retorna 400 quando valor total é inválido (<= 0)', async () => {
        const res = await request(app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({
            itens: [{ livroUuid, quantidade: 1, precoUnitario: 10 }],
            valorTotalItens: 10,
            valorFrete: 0,
            valorTotal: 0,
          });

        expect(res.status).toBe(400);
        expect(res.body.erro).toMatch(/Valor total/i);
      });

      it('[RN0069] retorna 400 ao tentar parcelar compra < R$ 80', async () => {
        const res = await request(app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send(payloadPedidoValido(livroUuid, { precoUnitario: 50, quantidade: 1, valorFrete: 10, parcelas: 2 }));

        expect(res.status).toBe(400);
        expect(res.body.erro).toMatch(/RN0069/i);
      });

      it('[RN0034] retorna 400 se um dos cartões no split for < R$ 10', async () => {
        const res = await request(app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({
            ...payloadPedidoValido(livroUuid, { precoUnitario: 50, quantidade: 1, valorFrete: 10 }),
            pagamentos: [
              { tipo: 'cartao', valor: 55 },
              { tipo: 'cartao', valor: 5 }, // Invalida RN0034 (mínimo 10)
            ],
          });

        expect(res.status).toBe(400);
        expect(res.body.erro).toMatch(/RN0034/i);
      });

    });
  });

  describe('GET /api/vendas/:uuid — isolamento entre clientes', () => {
    it('[RNF0037] cliente B recebe 404 ao tentar acessar pedido do cliente A', async () => {
      const criado = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payloadPedidoValido(livroUuid, { precoUnitario: 20, quantidade: 1, valorFrete: 5 }));

      expect(criado.status).toBe(201);
      const vendaUuid = criado.body.id as string;

      const res = await request(app)
        .get(`/api/vendas/${vendaUuid}`)
        .set('Authorization', `Bearer ${tokenClienteB}`);

      expect(res.status).toBe(404);
      expect(res.body.erro).toMatch(/não encontrada/i);
    });
  });

  describe('GET /api/vendas/:uuid', () => {
    describe('cenários de falha', () => {
      it('[RF0025] retorna 404 para UUID inexistente', async () => {
        const res = await request(app)
          .get('/api/vendas/00000000-0000-0000-0000-00000000beef')
          .set('Authorization', `Bearer ${tokenCliente}`);

        expect(res.status).toBe(404);
        expect(res.body.erro).toMatch(/não encontrada/i);
      });

      it('[RNF0037] retorna 401 sem token', async () => {
        const res = await request(app).get('/api/vendas/00000000-0000-0000-0000-00000000beef');

        expect(res.status).toBe(401);
      });
    });
  });

  describe('GET /api/minhas-vendas', () => {
    it('[RF0025] cenário feliz: retorna lista com pedidos do cliente', async () => {
      await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payloadPedidoValido(livroUuid, { precoUnitario: 40, quantidade: 1, valorFrete: 5 }));

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

    it('[RNF0037] cenário de falha: retorna 401 sem token', async () => {
      const res = await request(app).get('/api/minhas-vendas');

      expect(res.status).toBe(401);
    });
  });

  describe('[L2] Baixa de estoque após pagamento aprovado', () => {
    it('[L2] deve baixar estoque após pagamento aprovado', async () => {
      // 1. Obter estoque inicial do livro
      const estoqueInicialRes = await contexto.db!.executar<{ etq_quantidade_disponivel: number }>(
        `SELECT etq_quantidade_disponivel FROM livraria_comercial.estoques 
         WHERE liv_id = (SELECT liv_id FROM livraria_comercial.livros WHERE liv_uuid = $1)`,
        [livroUuid]
      );

      expect(estoqueInicialRes).toBeDefined();
      expect(estoqueInicialRes.length).toBeGreaterThan(0);

      const estoqueInicial = estoqueInicialRes[0].etq_quantidade_disponivel;
      const quantidadeVenda = 2;

      // 2. Criar venda
      const resVenda = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payloadPedidoValido(livroUuid, { precoUnitario: 50, quantidade: quantidadeVenda, valorFrete: 10 }));

      expect(resVenda.status).toBe(201);

      const vendaUuid = resVenda.body.id;

      // 3. Criar intenção de pagamento
      const resIntencao = await request(app)
        .post('/api/pagamentos/intencao-pagamento')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ valorTotal: 110 });

      expect(resIntencao.status).toBe(201);

      const { idIntencao, segredoConfirmacao } = resIntencao.body;

      // 4. Processar pagamento (aprovar)
      const resPagamento = await request(app)
        .post('/api/pagamento/processar')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          vendaUuid,
          valorTotal: 110,
          idIntencao,
          segredoConfirmacao,
          pagamentosCartao: [{ valor: 110 }],
        });

      expect(resPagamento.status).toBe(200);

      expect(resPagamento.body.sucesso).toBe(true);
      expect(resPagamento.body.status).toBe('APROVADA');

      // 5. Validar baixa de estoque
      const estoqueFinalRes = await contexto.db!.executar<{ etq_quantidade_disponivel: number }>(
        `SELECT etq_quantidade_disponivel FROM livraria_comercial.estoques 
         WHERE liv_id = (SELECT liv_id FROM livraria_comercial.livros WHERE liv_uuid = $1)`,
        [livroUuid]
      );

      expect(estoqueFinalRes).toBeDefined();
      expect(estoqueFinalRes.length).toBeGreaterThan(0);

      const estoqueFinal = estoqueFinalRes[0].etq_quantidade_disponivel;

      // O estoque deve ter sido baixado pela quantidade vendida
      expect(estoqueFinal).toBe(estoqueInicial - quantidadeVenda);
    });
  });
});

/**
 * COMO RODAR ESTE TESTE:
 * cd backend
 * npm test src/tests/integracao/vendas/pedido-venda.integracao.test.ts
 */
