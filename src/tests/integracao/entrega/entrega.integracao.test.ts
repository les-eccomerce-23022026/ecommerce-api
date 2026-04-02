import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';
import { LIVRO_UUID_TESTE } from '@/tests/helpers/pedido-venda.helper';

describe('Integração - Módulo de Entrega', () => {
  const contexto = configurarTesteIntegracao();
  let token: string;

  beforeAll(async () => {
    token = await obterTokenCliente(contexto.app);
  });

  it('deve cadastrar uma entrega e atualizar status da venda para EM TRÂNSITO', async () => {
    // 1. Criar uma venda primeiro
    const resVenda = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itens: [{ livroUuid: LIVRO_UUID_TESTE, quantidade: 1, precoUnitario: 50.0 }],
        valorTotalItens: 50.0,
        valorFrete: 10.0,
        valorTotal: 60.0,
      });

    expect(resVenda.status).toBe(201);
    const vendaUuid = resVenda.body.id;

    // 2. Cadastrar entrega para essa venda
    const resEntrega = await request(contexto.app)
      .post('/api/entregas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        tipoFrete: 'SEDEX',
        endereco: { logradouro: 'Rua de Teste', numero: '123' },
        custo: 10.0,
        entregador: 'João da Silva',
      });

    expect(resEntrega.status).toBe(201);
    expect(resEntrega.body.vendaUuid).toBe(vendaUuid);
    expect(resEntrega.body.tipoFrete).toBe('SEDEX');

    // 3. Verificar se o status da venda mudou para EM TRÂNSITO
    const resVendaAtualizada = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${token}`);

    expect(resVendaAtualizada.body.status).toBe('EM TRÂNSITO');
  });

  it('deve retornar 404 ao consultar entrega inexistente', async () => {
    const res = await request(contexto.app)
      .get('/api/entregas/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('deve listar entregas vinculadas a uma venda', async () => {
    // Criar outra venda
    const resVenda = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itens: [{ livroUuid: LIVRO_UUID_TESTE, quantidade: 2, precoUnitario: 30.0 }],
        valorTotalItens: 60.0,
        valorFrete: 15.0,
        valorTotal: 75.0,
      });

    const vendaUuid = resVenda.body.id;

    // Criar entrega
    await request(contexto.app)
      .post('/api/entregas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        tipoFrete: 'PAC',
        endereco: { cidade: 'São Paulo' },
        custo: 15.0,
      });

    // Listar entregas da venda
    const resLista = await request(contexto.app)
      .get(`/api/entregas?vendaUuid=${vendaUuid}`)
      .set('Authorization', `Bearer ${token}`);

    expect(resLista.status).toBe(200);
    expect(resLista.body.length).toBeGreaterThanOrEqual(1);
    expect(resLista.body[0].vendaUuid).toBe(vendaUuid);
  });
});
