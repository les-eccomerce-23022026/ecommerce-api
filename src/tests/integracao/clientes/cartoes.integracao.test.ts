import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';

describe('Integração - Cartões de Crédito', () => {
  const contexto = configurarTesteIntegracao(false);
  let tokenCliente: string;
  let uuidBandeiraVisa: string;

  beforeAll(async () => {
    tokenCliente = await obterTokenCliente(contexto.app, 'cliente.cartao@email.com', '123.456.789-99', true);
    // Busca o UUID da bandeira Visa dinamicamente
    const resBandeira = await contexto.db!.executar<{ ban_uuid: string }>(
      "SELECT ban_uuid FROM bandeiras_cartao WHERE ban_descricao = 'Visa' LIMIT 1"
    );
    uuidBandeiraVisa = resBandeira[0].ban_uuid;
  });

  describe('POST /api/clientes/perfil/cartoes', () => {
    it('[RF0030] deve cadastrar novo cartão com dados válidos', async () => {
      const res = await request(contexto.app)
        .post('/api/clientes/perfil/cartoes')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          uuidBandeira: uuidBandeiraVisa,
          token: 'tok_test_integration_1',
          ultimosDigitosCartao: '1111',
          nomeImpresso: 'Cliente Teste',
          validade: '2026-12-01',
          cvv: '123',
          principal: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.dados).toBeDefined();
      expect(res.body.dados.ultimosDigitosCartao).toBe('1111');
      expect(res.body.dados.nomeImpresso).toBe('Cliente Teste');
    });

    it('[RF0030] deve cadastrar cartão como principal quando solicitado', async () => {
      const res = await request(contexto.app)
        .post('/api/clientes/perfil/cartoes')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          uuidBandeira: uuidBandeiraVisa,
          token: 'tok_test_integration_2',
          ultimosDigitosCartao: '4444',
          nomeImpresso: 'Cliente Principal',
          validade: '2027-06-01',
          cvv: '456',
          principal: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.dados.principal).toBe(true);
    });

    it('[RNF0037] deve retornar 400 para campos obrigatórios ausentes', async () => {
      const res = await request(contexto.app)
        .post('/api/clientes/perfil/cartoes')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          uuidBandeira: uuidBandeiraVisa,
        });

      expect(res.status).toBe(400);
    });

    it('[RNF0037] deve retornar 401 sem token', async () => {
      const res = await request(contexto.app).post('/api/clientes/perfil/cartoes').send({
        uuidBandeira: uuidBandeiraVisa,
        token: 'tok_test',
        ultimosDigitosCartao: '1111',
        nomeImpresso: 'Cliente Teste',
        validade: '2026-12-01',
        cvv: '123',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/clientes/perfil/cartoes', () => {
    it('[RF0029] deve listar cartões do usuário autenticado', async () => {
      // Cadastrar um cartão primeiro
      await request(contexto.app)
        .post('/api/clientes/perfil/cartoes')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          uuidBandeira: uuidBandeiraVisa,
          token: 'tok_test_listagem',
          ultimosDigitosCartao: '1111',
          nomeImpresso: 'Cliente Listagem',
          validade: '2026-12-01',
          cvv: '123',
        });

      const res = await request(contexto.app)
        .get('/api/clientes/perfil/cartoes')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.dados)).toBe(true);
      expect(res.body.dados.length).toBeGreaterThan(0);
    });

    it('[RNF0037] deve retornar 401 sem token', async () => {
      const res = await request(contexto.app).get('/api/clientes/perfil/cartoes');

      expect(res.status).toBe(401);
    });

    it('[RF0029] deve ocultar número completo do cartão', async () => {
      const res = await request(contexto.app)
        .get('/api/clientes/perfil/cartoes')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(200);
      if (res.body.dados.length > 0) {
        const cartao = res.body.dados[0];
        expect(cartao).not.toHaveProperty('numero');
        expect(cartao).toHaveProperty('ultimosDigitosCartao');
      }
    });
  });

  describe('PATCH /api/clientes/perfil/cartoes/:uuid', () => {
    it('[RF0031] deve atualizar dados do cartão', async () => {
      // Cadastrar cartão primeiro
      const criarRes = await request(contexto.app)
        .post('/api/clientes/perfil/cartoes')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          uuidBandeira: uuidBandeiraVisa,
          token: 'tok_test_atualizar',
          ultimosDigitosCartao: '1111',
          nomeImpresso: 'Cliente Atualizar',
          validade: '2026-12-01',
          cvv: '123',
        });

      const cartaoUuid = criarRes.body.dados.uuid;

      // Atualizar
      const res = await request(contexto.app)
        .patch(`/api/clientes/perfil/cartoes/${cartaoUuid}`)
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          nomeImpresso: 'Cliente Atualizado',
        });

      expect(res.status).toBe(200);
      expect(res.body.dados.nomeImpresso).toBe('Cliente Atualizado');
    });

    it('[RNF0037] deve retornar 400 para cartão inexistente', async () => {
      const res = await request(contexto.app)
        .patch('/api/clientes/perfil/cartoes/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ nomeImpresso: 'Novo Titular' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/clientes/perfil/cartoes/:uuid', () => {
    it('[RF0031] deve remover cartão', async () => {
      // Cadastrar cartão primeiro
      const criarRes = await request(contexto.app)
        .post('/api/clientes/perfil/cartoes')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          uuidBandeira: uuidBandeiraVisa,
          token: 'tok_test_remover',
          ultimosDigitosCartao: '1111',
          nomeImpresso: 'Cliente Remover',
          validade: '2026-12-01',
          cvv: '123',
        });

      const cartaoUuid = criarRes.body.dados.uuid;

      // Remover
      const res = await request(contexto.app)
        .delete(`/api/clientes/perfil/cartoes/${cartaoUuid}`)
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(200);
    });

    it('[RNF0037] deve retornar 200 para cartão inexistente (idempotente)', async () => {
      const res = await request(contexto.app)
        .delete('/api/clientes/perfil/cartoes/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /api/clientes/perfil/cartoes/:uuid/principal', () => {
    it('[RF0030] deve definir cartão como principal', async () => {
      // Cadastrar cartão primeiro
      const criarRes = await request(contexto.app)
        .post('/api/clientes/perfil/cartoes')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          uuidBandeira: uuidBandeiraVisa,
          token: 'tok_test_principal',
          ultimosDigitosCartao: '1111',
          nomeImpresso: 'Cliente Principal',
          validade: '2026-12-01',
          cvv: '123',
          principal: false,
        });

      const cartaoUuid = criarRes.body.dados.uuid;

      // Definir como principal
      const res = await request(contexto.app)
        .patch(`/api/clientes/perfil/cartoes/${cartaoUuid}/principal`)
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(200);
      expect(res.body.dados.mensagem).toBe('Cartão definido como principal.');
    });
  });
});
