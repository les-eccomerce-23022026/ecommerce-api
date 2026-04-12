import request from 'supertest';
import { Application } from 'express';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';
import {
  CARTAO_MASTERCARD_TESTE,
  CARTAO_VISA_TESTE,
  cotarFretePac,
  montarPartesPagamentoCuponsEDoisCartoes,
  payloadVendaComCotacao,
} from '@/tests/helpers/fluxo-cotacao-cupons.helper';

/**
 * Fluxo 4ª entrega: frete cotado (`cotacaoUuid`) + cupons via `/pagamentos/selecionar` + dois cartões.
 * BDD: `bdd/vendas/checkout-cotacao-cupons/`.
 */
describe('Integração — Checkout: cotação de frete + cupons + cartões', () => {
  const contexto = configurarTesteIntegracao();
  let app: Application;
  let token: string;

  beforeAll(async () => {
    app = contexto.app;
    token = await obterTokenCliente(app);
  });

  describe('cenários felizes', () => {
    it('fluxo completo: cotar PAC → POST /vendas com cotacaoUuid → DESCONTO10 + TROCA50 + 2 cartões → processar → entrega → consultas', async () => {
      const precoUnitario = 50;
      const cot = await cotarFretePac(app, token, precoUnitario);
      const bodyVenda = payloadVendaComCotacao(cot, precoUnitario, 1);
      const valorTotal = Number(bodyVenda.valorTotal);

      const resVenda = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${token}`)
        .send(bodyVenda);

      expect(resVenda.status).toBe(201);
      const vendaUuid = resVenda.body.id as string;
      expect(resVenda.body.status).toBe('EM PROCESSAMENTO');
      expect(resVenda.body.frete).toBe(cot.valorFrete);

      // Garantir cupom de troca no banco (Sprint 1)
      const usuRes = await contexto.db!.executar<{ usu_id: number }>('SELECT usu_id FROM usuarios LIMIT 1');
      await contexto.db!.executar(`
        INSERT INTO cupons_troca (usu_id, ctr_codigo, ctr_valor_original, ctr_valor_atual)
        VALUES ($1, 'TROCA50', 50, 50)
        ON CONFLICT (ctr_codigo) DO UPDATE SET ctr_valor_atual = 50, ctr_ativo = true
      `, [usuRes[0].usu_id]);

      const partes = montarPartesPagamentoCuponsEDoisCartoes(valorTotal);

      const resPromo = await request(app)
        .post('/api/pagamentos/selecionar')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vendaUuid,
          valor: partes.promo,
          tipoPagamento: 'cupom_promocional',
          detalhesCupom: 'DESCONTO10',
        });
      expect(resPromo.status).toBe(201);
      expect(resPromo.body.formaPagamento.tipo).toBe('cupom_promocional');

      const resTroca = await request(app)
        .post('/api/pagamentos/selecionar')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vendaUuid,
          valor: partes.troca,
          tipoPagamento: 'cupom_troca',
          detalhesCupom: 'TROCA50',
        });
      expect(resTroca.status).toBe(201);
      expect(resTroca.body.formaPagamento.tipo).toBe('cupom_troca');

      const resVisa = await request(app)
        .post('/api/pagamentos/selecionar')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vendaUuid,
          valor: partes.cartaoVisa,
          tipoPagamento: 'cartao_credito',
          cartao: CARTAO_VISA_TESTE,
        });
      expect(resVisa.status).toBe(201);
      const pagVisa = resVisa.body.id as string;

      const resMc = await request(app)
        .post('/api/pagamentos/selecionar')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vendaUuid,
          valor: partes.cartaoMastercard,
          tipoPagamento: 'cartao_credito',
          cartao: CARTAO_MASTERCARD_TESTE,
        });
      expect(resMc.status).toBe(201);
      const pagMc = resMc.body.id as string;

      const procVisa = await request(app)
        .post(`/api/pagamentos/${pagVisa}/processar`)
        .set('Authorization', `Bearer ${token}`);
      expect(procVisa.status).toBe(200);
      expect(procVisa.body.status).toBe('APROVADO');

      const procMc = await request(app)
        .post(`/api/pagamentos/${pagMc}/processar`)
        .set('Authorization', `Bearer ${token}`);
      expect(procMc.status).toBe(200);
      expect(procMc.body.status).toBe('APROVADO');

      const resEntrega = await request(app)
        .post('/api/entregas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vendaUuid,
          tipoFrete: 'PAC',
          custo: cot.valorFrete,
          endereco: {
            logradouro: 'Av. Paulista',
            numero: '1000',
            bairro: 'Bela Vista',
            cep: '01310100',
            cidade: 'São Paulo',
            estado: 'SP',
          },
        });
      expect(resEntrega.status).toBe(201);

      const det = await request(app)
        .get(`/api/vendas/${vendaUuid}`)
        .set('Authorization', `Bearer ${token}`);
      expect(det.status).toBe(200);
      expect(det.body.status).toBe('EM TRÂNSITO');

      const minhas = await request(app)
        .get('/api/minhas-vendas')
        .set('Authorization', `Bearer ${token}`);
      expect(minhas.status).toBe(200);
      expect(minhas.body.some((v: { id: string }) => v.id === vendaUuid)).toBe(true);

      const entList = await request(app)
        .get('/api/entregas')
        .query({ vendaUuid })
        .set('Authorization', `Bearer ${token}`);
      expect(entList.status).toBe(200);
      expect(Array.isArray(entList.body)).toBe(true);
      expect(entList.body.length).toBeGreaterThan(0);
    });
  });

  describe('cenários de falha — POST /api/vendas com cotação', () => {
    it('retorna 400 quando cotacaoUuid não existe', async () => {
      const cot = await cotarFretePac(app, token, 50);
      const body = payloadVendaComCotacao(cot, 50, 1);
      body.cotacaoUuid = '00000000-0000-0000-0000-000000000099';

      const res = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${token}`)
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body.erro).toMatch(/Cotação de frete não encontrada/i);
    });

    it('retorna 400 ao reutilizar a mesma cotação em uma segunda venda', async () => {
      const cot = await cotarFretePac(app, token, 50);
      const body = payloadVendaComCotacao(cot, 50, 1);

      const primeiro = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
      expect(primeiro.status).toBe(201);

      const segundo = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${token}`)
        .send(body);

      expect(segundo.status).toBe(400);
      expect(segundo.body.erro).toMatch(/inválida ou já utilizada/i);
    });

    it('retorna 400 quando a cotação está expirada (CRIADA + expira_em no passado)', async () => {
      const cot = await cotarFretePac(app, token, 50);
      await contexto.db!.executar(
        `UPDATE cotacao_frete SET cfr_expira_em = NOW() - INTERVAL '1 hour' WHERE cfr_uuid = $1`,
        [cot.cotacaoUuid],
      );

      const body = payloadVendaComCotacao(cot, 50, 1);
      const res = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${token}`)
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body.erro).toMatch(/expirada/i);
    });

    it('retorna 400 quando valorTotal não confere com itens + frete da cotação', async () => {
      const cot = await cotarFretePac(app, token, 50);
      const body = payloadVendaComCotacao(cot, 50, 1);
      body.valorTotal = Number(body.valorTotal) + 5;

      const res = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${token}`)
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body.erro).toMatch(/não confere/i);
    });

  });

  describe('cenários de falha — POST /api/pagamentos/selecionar (cupons)', () => {
    async function criarVendaParaPagamento(): Promise<string> {
      const cot = await cotarFretePac(app, token, 50);
      const body = payloadVendaComCotacao(cot, 50, 1);
      const res = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
      expect(res.status).toBe(201);
      return res.body.id as string;
    }

    it('retorna 400 para cupom promocional inválido', async () => {
      const vendaUuid = await criarVendaParaPagamento();
      const res = await request(app)
        .post('/api/pagamentos/selecionar')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vendaUuid,
          valor: 10,
          tipoPagamento: 'cupom_promocional',
          detalhesCupom: 'CUPOM_INVALIDO',
        });

      expect(res.status).toBe(400);
      expect(res.body.erro).toMatch(/promocional inválido|expirado/i);
    });

    it('retorna 400 para cupom de troca com valor acima do permitido (TROCA50)', async () => {
      const vendaUuid = await criarVendaParaPagamento();
      const res = await request(app)
        .post('/api/pagamentos/selecionar')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vendaUuid,
          valor: 51,
          tipoPagamento: 'cupom_troca',
          detalhesCupom: 'TROCA50',
        });

      expect(res.status).toBe(400);
      expect(res.body.erro).toMatch(/troca/i);
    });

    it('retorna 400 para código de cupom de troca inválido', async () => {
      const vendaUuid = await criarVendaParaPagamento();
      const res = await request(app)
        .post('/api/pagamentos/selecionar')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vendaUuid,
          valor: 10,
          tipoPagamento: 'cupom_troca',
          detalhesCupom: 'TROCA99',
        });

      expect(res.status).toBe(400);
      expect(res.body.erro).toMatch(/troca/i);
    });
  });
});
