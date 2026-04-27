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

describe('Integração - Pagamentos (Parcelamento e Split)', () => {
  const contexto = configurarTesteIntegracao();
  let token: string;

  beforeAll(async () => {
    token = await obterTokenCliente(contexto.app);
  });

  beforeEach(async () => {
    if (contexto.db) {
      await contexto.db.executar(
        `INSERT INTO tipo_pagamento (tpg_descricao) VALUES ('pix') ON CONFLICT (tpg_descricao) DO NOTHING`
      );
      await contexto.db.executar(
        `INSERT INTO status_vendas (stv_descricao) VALUES ('AGUARDANDO PAGAMENTO') ON CONFLICT (stv_descricao) DO NOTHING`
      );
    }
  });

  async function criarVenda(total = 60) {
    const valorFrete = 10;
    const valorTotalItens = total - valorFrete;
    if (valorTotalItens <= 0) {
      throw new Error('criarVenda: total deve ser maior que o frete fixo de teste (10)');
    }
    const res = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itens: [{ livroUuid: LIVRO_UUID_TESTE, quantidade: 1, precoUnitario: valorTotalItens }],
        valorTotalItens,
        valorFrete,
        valorTotal: total,
      });
    expect(res.status).toBe(201);
    return res.body.id as string;
  }

  async function registrarIntencao(valorTotal: number) {
    const res = await request(contexto.app)
      .post('/api/pagamentos/intencao-pagamento')
      .set('Authorization', `Bearer ${token}`)
      .send({ valorTotal });
    expect(res.status).toBe(201);
    return res.body as { idIntencao: string; segredoConfirmacao: string };
  }

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
    expect(res.body.erro).toMatch(/parcelasCartao/i);
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
    expect(res.body.erro).toMatch(/parcelasCartao/i);
  });
});
