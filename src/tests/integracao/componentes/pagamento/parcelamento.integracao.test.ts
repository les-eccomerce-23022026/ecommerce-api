import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';
import {
  cartaoValido,
  prepararTabelasPagamentoIntegracao,
  criarVendaPagamentos,
  registrarIntencaoPagamentos,
} from '../../helpers/pagamentos-comum';

describe('Integração - Pagamentos (parcelas e limites)', () => {
  const contexto = configurarTesteIntegracao();
  let token: string;

  beforeAll(async () => {
    token = await obterTokenCliente(contexto.app);
  });

  beforeEach(async () => {
    await prepararTabelasPagamentoIntegracao(contexto.db);
  });

  const criarVenda = (total = 60) => criarVendaPagamentos(contexto, token, total);
  const registrarIntencao = (valorTotal: number) => registrarIntencaoPagamentos(contexto, token, valorTotal);
  it('POST /pagamentos/selecionar retorna 400 PIX com valor abaixo de R$ 10', async () => {
    const vendaUuid = await criarVenda(60);

    const res = await request(contexto.app)
      .post('/api/pagamentos/selecionar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valor: 5,
        tipoPagamento: 'pix',
      });

    expect(res.status).toBe(400);
    expect(res.body.erro).toContain('PIX');
  });

  it('POST /pagamentos/selecionar split: dois cartões + PIX na mesma venda', async () => {
    const vendaUuid = await criarVenda(90);

    const r1 = await request(contexto.app)
      .post('/api/pagamentos/selecionar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valor: 30,
        tipoPagamento: 'cartao_credito',
        cartao: cartaoValido,
      });
    expect(r1.status).toBe(201);

    const r2 = await request(contexto.app)
      .post('/api/pagamentos/selecionar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valor: 30,
        tipoPagamento: 'cartao_credito',
        cartao: {
          ...cartaoValido,
          numero: '5500000000000004',
          bandeira: 'Mastercard',
        },
      });
    expect(r2.status).toBe(201);

    const r3 = await request(contexto.app)
      .post('/api/pagamentos/selecionar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valor: 30,
        tipoPagamento: 'pix',
      });
    expect(r3.status).toBe(201);
    expect(r3.body.formaPagamento.tipo).toBe('pix');
  });

  it('POST /pagamentos/selecionar aceita parcelasCartao e reflete em formaPagamento.detalhes', async () => {
    const vendaUuid = await criarVenda(60);

    const res = await request(contexto.app)
      .post('/api/pagamentos/selecionar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valor: 60,
        tipoPagamento: 'cartao_credito',
        parcelasCartao: 6,
        cartao: cartaoValido,
      });

    expect(res.status).toBe(201);
    expect(res.body.formaPagamento.detalhes).toBe('parcelas:6');
  });

  it('POST /pagamentos/selecionar retorna 400 se parcelasCartao com PIX', async () => {
    const vendaUuid = await criarVenda(60);

    const res = await request(contexto.app)
      .post('/api/pagamentos/selecionar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valor: 30,
        tipoPagamento: 'pix',
        parcelasCartao: 3,
      });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/Parcelas/i);
  });

  it('POST /pagamento/processar aceita parcelasCartao nos itens', async () => {
    const valorTotal = 150;
    const intencao = await registrarIntencao(valorTotal);

    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valorTotal,
        idIntencao: intencao.idIntencao,
        segredoConfirmacao: intencao.segredoConfirmacao,
        pagamentosCartao: [
          { valor: 100, parcelasCartao: 3 },
          { valor: 50, parcelasCartao: 1 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
  });

  it('POST /pagamento/processar retorna 400 quando parcelasCartao inválido', async () => {
    const valorTotal = 60;
    const intencao = await registrarIntencao(valorTotal);

    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valorTotal,
        idIntencao: intencao.idIntencao,
        segredoConfirmacao: intencao.segredoConfirmacao,
        pagamentosCartao: [{ valor: 60, parcelasCartao: 99 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/Parcelas/i);
  });
});
