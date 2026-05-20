import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenCliente } from '@/tests/helpers/requisicoes-api.util';

describe('Integração - Frete', () => {
  const contexto = configurarTesteIntegracao();
  let token: string;

  beforeAll(async () => {
    token = await obterTokenCliente(contexto.app);
  });

  it('POST /frete/cotar retorna opções persistidas com uuid', async () => {
    const res = await request(contexto.app)
      .post('/api/frete/cotar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cepDestino: '01310100',
        pesoKg: 1.2,
        valorTotalItens: 40,
      });

    expect(res.status).toBe(200);
    expect(res.body.provedor).toBeDefined();
    expect(Array.isArray(res.body.opcoes)).toBe(true);
    expect(res.body.opcoes.length).toBeGreaterThanOrEqual(3);
    const pac = res.body.opcoes.find((o: { tipo: string }) => o.tipo === 'PAC');
    expect(pac?.uuid).toBeDefined();
    expect(pac?.valor).toBeGreaterThanOrEqual(0);
  });

  it('POST /frete/cotar retorna 400 para CEP inválido', async () => {
    const res = await request(contexto.app)
      .post('/api/frete/cotar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cepDestino: '123',
        pesoKg: 1,
      });

    expect(res.status).toBe(400);
  });
});
