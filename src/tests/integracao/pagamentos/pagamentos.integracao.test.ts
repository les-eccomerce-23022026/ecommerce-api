import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';
import { LIVRO_UUID_TESTE } from '@/tests/helpers/pedido-venda.helper';

const cartaoValido = {
  numero: '4111111111111111',
  nomeTitular: 'Cliente Integracao Pag',
  validade: '12/30',
  bandeira: 'Visa',
};

describe('Integração - Pagamentos', () => {
  const contexto = configurarTesteIntegracao();
  let token: string;

  beforeAll(async () => {
    token = await obterTokenCliente(contexto.app);
  });

  async function criarVenda(total = 60) {
    const res = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itens: [{ livroUuid: LIVRO_UUID_TESTE, quantidade: 1, precoUnitario: 50 }],
        valorTotalItens: 50,
        valorFrete: 10,
        valorTotal: total,
      });
    expect(res.status).toBe(201);
    return res.body.id as string;
  }

  it('GET /pagamento/info retorna estrutura de checkout simulada', async () => {
    const res = await request(contexto.app)
      .get('/api/pagamento/info')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.cuponsDisponiveis)).toBe(true);
    expect(Array.isArray(res.body.freteOpcoes)).toBe(true);
    expect(res.body.bandeirasPermitidas).toBeDefined();
  });

  it('POST /pagamento/processar aprova quando soma dos cartões <= 1000', async () => {
    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        pagamentosCartao: [{ valor: 100 }, { valor: 50 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.status).toBe('APROVADA');
  });

  it('POST /pagamento/processar reprova quando soma > 1000', async () => {
    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        pagamentosCartao: [{ valor: 800 }, { valor: 300 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(false);
    expect(res.body.status).toBe('REPROVADA');
  });

  it('POST /pagamento/processar retorna 400 sem pagamentosCartao', async () => {
    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Payload inválido');
  });

  it('fluxo feliz: selecionar → processar → consultar GET', async () => {
    const vendaUuid = await criarVenda(60);

    const resSel = await request(contexto.app)
      .post('/api/pagamentos/selecionar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valor: 60,
        tipoPagamento: 'cartao_credito',
        cartao: cartaoValido,
      });

    expect(resSel.status).toBe(201);
    expect(resSel.body.status).toBe('PENDENTE');
    const pagamentoUuid = resSel.body.id as string;

    const resProc = await request(contexto.app)
      .post(`/api/pagamentos/${pagamentoUuid}/processar`)
      .set('Authorization', `Bearer ${token}`);

    expect(resProc.status).toBe(200);
    expect(resProc.body.status).toBe('APROVADO');

    const resGet = await request(contexto.app)
      .get(`/api/pagamentos/${pagamentoUuid}`)
      .set('Authorization', `Bearer ${token}`);

    expect(resGet.status).toBe(200);
    expect(resGet.body.id).toBe(pagamentoUuid);
    expect(resGet.body.status).toBe('APROVADO');
  });

  it('POST /pagamentos/selecionar retorna 400 para valor zero', async () => {
    const vendaUuid = await criarVenda(25);

    const res = await request(contexto.app)
      .post('/api/pagamentos/selecionar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valor: 0,
        tipoPagamento: 'cartao_credito',
        cartao: cartaoValido,
      });

    expect(res.status).toBe(400);
    expect(res.body.erro).toContain('positivo');
  });

  it('POST /pagamentos/selecionar retorna 400 sem dados do cartão', async () => {
    const vendaUuid = await criarVenda(25);

    const res = await request(contexto.app)
      .post('/api/pagamentos/selecionar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valor: 25,
        tipoPagamento: 'cartao_credito',
      });

    expect(res.status).toBe(400);
    expect(res.body.erro).toContain('cartão');
  });

  it('GET /pagamentos/:uuid retorna erro quando pagamento não existe', async () => {
    const res = await request(contexto.app)
      .get('/api/pagamentos/00000000-0000-0000-0000-00000000dead')
      .set('Authorization', `Bearer ${token}`);

    // Serviço lança se não encontrar; controlador responde 400 com a mensagem
    expect(res.status).toBe(400);
    expect(res.body.erro).toContain('não encontrado');
  });
});
