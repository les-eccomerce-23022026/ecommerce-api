import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';
import {
  prepararTabelasPagamentoIntegracao,
  criarVendaPagamentos,
  registrarIntencaoPagamentos,
} from './pagamentos.integracao.comum';

describe('Integração - Pagamentos (info, intenção e processar)', () => {
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
});
