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

  beforeEach(async () => {
    if (contexto.db) {
      await contexto.db.executar(
        `INSERT INTO tipo_pagamento (tpg_descricao) VALUES ('pix') ON CONFLICT (tpg_descricao) DO NOTHING`
      );
      await contexto.db.executar(
        `INSERT INTO status_vendas (stv_descricao) VALUES ('AGUARDANDO PAGAMENTO') ON CONFLICT (stv_descricao) DO NOTHING`
      );
      await contexto.db.executar(`
        CREATE TABLE IF NOT EXISTS pagamento_pix_simulado (
          ppx_id BIGSERIAL PRIMARY KEY,
          pag_id BIGINT NOT NULL UNIQUE REFERENCES pagamento(pag_id) ON DELETE CASCADE,
          ppx_copia_cola TEXT NOT NULL,
          ppx_qr_base64 TEXT,
          ppx_expira_em TIMESTAMPTZ NOT NULL,
          ppx_segredo_confirmacao VARCHAR(128) NOT NULL
        );
      `);
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

  it('GET /pagamento/info retorna estrutura de checkout simulada', async () => {
    const res = await request(contexto.app)
      .get('/api/pagamento/info')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.cuponsDisponiveis)).toBe(true);
    expect(Array.isArray(res.body.freteOpcoes)).toBe(true);
    expect(res.body.bandeirasPermitidas).toBeDefined();
    expect(res.body.politicaParcelamentoCartao).toEqual({
      parcelasMaximas: 12,
      parcelasSemJuros: 6,
    });
  });

  it('POST /pagamentos/intencao-pagamento retorna id e segredo', async () => {
    const res = await request(contexto.app)
      .post('/api/pagamentos/intencao-pagamento')
      .set('Authorization', `Bearer ${token}`)
      .send({ valorTotal: 150 });

    expect(res.status).toBe(201);
    expect(res.body.idIntencao).toBeDefined();
    expect(res.body.segredoConfirmacao).toBeDefined();
  });

  it('POST /pagamento/processar aprova quando intenção e soma dos cartões <= 1000', async () => {
    const valorTotal = 150;
    const intencao = await registrarIntencao(valorTotal);

    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valorTotal,
        idIntencao: intencao.idIntencao,
        segredoConfirmacao: intencao.segredoConfirmacao,
        pagamentosCartao: [{ valor: 100 }, { valor: 50 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.status).toBe('APROVADA');
  });

  it('POST /pagamento/processar reprova quando soma > 1000', async () => {
    const valorTotal = 1100;
    const intencao = await registrarIntencao(valorTotal);

    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valorTotal,
        idIntencao: intencao.idIntencao,
        segredoConfirmacao: intencao.segredoConfirmacao,
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

  it('POST /pagamento/processar retorna 400 sem intenção de pagamento', async () => {
    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valorTotal: 100,
        pagamentosCartao: [{ valor: 100 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.erro).toContain('Intenção');
  });

  it('POST /pagamento/processar retorna 400 quando soma não confere com valorTotal', async () => {
    const intencao = await registrarIntencao(150);
    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valorTotal: 150,
        idIntencao: intencao.idIntencao,
        segredoConfirmacao: intencao.segredoConfirmacao,
        pagamentosCartao: [{ valor: 100 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.erro).toContain('Soma dos pagamentos');
  });

  it('POST /pagamento/processar reprova com segredo inválido', async () => {
    const intencao = await registrarIntencao(80);
    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valorTotal: 80,
        idIntencao: intencao.idIntencao,
        segredoConfirmacao: 'segredo_errado',
        pagamentosCartao: [{ valor: 80 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(false);
    expect(res.body.status).toBe('REPROVADA');
  });

  it('PATCH /pagamentos/intencao-pagamento/:inpUuid/venda vincula venda à intenção', async () => {
    const vendaUuid = await criarVenda(60);
    const intencao = await registrarIntencao(60);

    const res = await request(contexto.app)
      .patch(`/api/pagamentos/intencao-pagamento/${intencao.idIntencao}/venda`)
      .set('Authorization', `Bearer ${token}`)
      .send({ vendaUuid });

    expect(res.status).toBe(204);
  });

  it('POST /pagamento/processar retorna 400 sem vendaUuid quando intenção já vinculada a venda', async () => {
    const vendaUuid = await criarVenda(60);
    const intencao = await registrarIntencao(60);
    await request(contexto.app)
      .patch(`/api/pagamentos/intencao-pagamento/${intencao.idIntencao}/venda`)
      .set('Authorization', `Bearer ${token}`)
      .send({ vendaUuid });

    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valorTotal: 60,
        idIntencao: intencao.idIntencao,
        segredoConfirmacao: intencao.segredoConfirmacao,
        pagamentosCartao: [{ valor: 60 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.erro).toContain('vendaUuid');
  });

  it('POST /pagamento/processar persiste pagamento com inp_id quando vendaUuid e aprovação', async () => {
    const vendaUuid = await criarVenda(60);
    const intencao = await registrarIntencao(60);

    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valorTotal: 60,
        vendaUuid,
        idIntencao: intencao.idIntencao,
        segredoConfirmacao: intencao.segredoConfirmacao,
        pagamentosCartao: [{ valor: 60 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.pagamentoUuid).toBeDefined();

    const rows = await contexto.db!.executar<{ inp_id: number | null }>(
      'SELECT inp_id FROM pagamento WHERE pag_uuid = $1',
      [res.body.pagamentoUuid as string]
    );
    expect(rows[0]?.inp_id).toBeDefined();
    expect(rows[0]?.inp_id).not.toBeNull();
  });

  it('POST /pagamento/processar reprova quando intenção expirada (TTL)', async () => {
    const intencao = await registrarIntencao(90);
    await contexto.db!.executar(
      `UPDATE intencao_pagamento SET inp_expira_em = NOW() - INTERVAL '1 minute' WHERE inp_uuid = $1`,
      [intencao.idIntencao]
    );

    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valorTotal: 90,
        idIntencao: intencao.idIntencao,
        segredoConfirmacao: intencao.segredoConfirmacao,
        pagamentosCartao: [{ valor: 90 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(false);
    expect(res.body.status).toBe('REPROVADA');
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

    expect(res.status).toBe(400);
    expect(res.body.erro).toContain('não encontrado');
  });

  it('POST /pagamentos/selecionar aceita PIX simulado sem cartão', async () => {
    const vendaUuid = await criarVenda(90);

    const res = await request(contexto.app)
      .post('/api/pagamentos/selecionar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valor: 30,
        tipoPagamento: 'pix',
      });

    expect(res.status).toBe(201);
    expect(res.body.formaPagamento.tipo).toBe('pix');
    expect(res.body.formaPagamento.detalhes).toMatch(/^PIX-/);
    expect(res.body.cartao).toBeUndefined();
    expect(res.body.pixCobranca).toBeDefined();
    expect(res.body.pixCobranca.copiaCola).toContain('br.gov.bcb.pix');
    expect(res.body.pixCobranca.segredoConfirmacao).toBeDefined();
    expect(res.body.pixCobranca.expiraEm).toBeDefined();
  });

  it('POST /pagamentos/:uuid/processar retorna 400 para PIX (aguarda webhook)', async () => {
    const vendaUuid = await criarVenda(50);
    const sel = await request(contexto.app)
      .post('/api/pagamentos/selecionar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valor: 40,
        tipoPagamento: 'pix',
      });
    expect(sel.status).toBe(201);
    const pagUuid = sel.body.id as string;

    const proc = await request(contexto.app)
      .post(`/api/pagamentos/${pagUuid}/processar`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(proc.status).toBe(400);
    expect(proc.body.erro).toMatch(/webhook|PIX/i);
  });

  it('POST /webhooks/pagamento-pix-simulado confirma PIX e GET /pagamentos/venda/:uuid/resumo reflete APROVADA', async () => {
    const vendaUuid = await criarVenda(50);
    const sel = await request(contexto.app)
      .post('/api/pagamentos/selecionar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valor: 40,
        tipoPagamento: 'pix',
      });
    expect(sel.status).toBe(201);
    const pagUuid = sel.body.id as string;
    const segredo = sel.body.pixCobranca.segredoConfirmacao as string;

    const resAntes = await request(contexto.app)
      .get(`/api/pagamentos/venda/${vendaUuid}/resumo`)
      .set('Authorization', `Bearer ${token}`);
    expect(resAntes.status).toBe(200);
    expect(resAntes.body.aguardandoPix).toBe(true);
    expect(resAntes.body.vendaStatus).toBe('AGUARDANDO PAGAMENTO');

    const wh = await request(contexto.app).post('/api/webhooks/pagamento-pix-simulado').send({
      pagamentoUuid: pagUuid,
      segredoConfirmacao: segredo,
    });
    expect(wh.status).toBe(200);

    const resDepois = await request(contexto.app)
      .get(`/api/pagamentos/venda/${vendaUuid}/resumo`)
      .set('Authorization', `Bearer ${token}`);
    expect(resDepois.status).toBe(200);
    expect(resDepois.body.aguardandoPix).toBe(false);
    expect(resDepois.body.vendaStatus).toBe('APROVADA');

    const pg = await request(contexto.app)
      .get(`/api/pagamentos/${pagUuid}`)
      .set('Authorization', `Bearer ${token}`);
    expect(pg.body.status).toBe('APROVADO');
  });

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
