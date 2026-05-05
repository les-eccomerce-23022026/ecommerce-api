import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';
import {
  cartaoValido,
  prepararTabelasPagamentoIntegracao,
  criarVendaPagamentos,
} from './pagamentos.integracao.comum';

describe('Integração - Pagamentos (selecionar, PIX e resumo)', () => {
  const contexto = configurarTesteIntegracao();
  let token: string;

  beforeAll(async () => {
    token = await obterTokenCliente(contexto.app);
  });

  beforeEach(async () => {
    await prepararTabelasPagamentoIntegracao(contexto.db);
  });

  const criarVenda = (total = 60) => criarVendaPagamentos(contexto, token, total);
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
});
