import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenCliente } from '@/tests/helpers/requisicoes-api.util';
import { garantirLivroComEstoqueParaCarrinho } from '@/tests/helpers/carrinho-integracao.helper';
import { payloadPedidoValido } from '@/tests/helpers/pedido-venda.helper';

/**
 * Testes de integração — integridade de preço no checkout (U5).
 */
describe('Integração - Segurança de Integridade do Pedido', () => {
  const contexto = configurarTesteIntegracao();
  let tokenCliente: string;
  let livroUuid: string;
  let precoCatalogo: number;

  beforeEach(async () => {
    tokenCliente = await obterTokenCliente(contexto.app);
    const livro = await garantirLivroComEstoqueParaCarrinho(contexto.db!);
    livroUuid = livro.livUuid;

    const rows = await contexto.db!.executar<{ preco: string }>(
      `SELECT e.etq_preco_venda::text AS preco
       FROM livraria_comercial.livros l
       INNER JOIN livraria_comercial.estoques e ON e.liv_id = l.liv_id
       WHERE l.liv_uuid = $1`,
      [livroUuid],
    );
    precoCatalogo = Number(rows[0]?.preco ?? 49.9);
  });

  it('[SEGURANÇA] deve retornar 400 quando precoUnitario manipulado não confere com o catálogo', async () => {
    const precoManipulado = 0.01;
    const body = payloadPedidoValido(livroUuid, {
      precoUnitario: precoManipulado,
      quantidade: 1,
      valorFrete: 0,
    });

    const resposta = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send(body);

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(/preço|catálogo/i);
  });

  it('[SEGURANÇA] deve criar pedido quando precoUnitario coincide com o catálogo', async () => {
    const body = payloadPedidoValido(livroUuid, {
      precoUnitario: precoCatalogo,
      quantidade: 1,
      valorFrete: 0,
    });

    const resposta = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send(body);

    expect(resposta.status).toBe(201);
    expect(resposta.body.totalVenda).toBe(precoCatalogo);
  });
});
