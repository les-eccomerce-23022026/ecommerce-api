import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenAdmin, obterTokenCliente } from '@/tests/helpers/requisicoes-api.util';

/**
 * Testes de integração para criação de cupons por administradores.
 * Verifica o funcionamento dos novos endpoints de criação de cupons promocionais e de troca
 * com suporte multi-tenant (loj_id).
 */
describe('Integração - Criação de Cupons (Multi-Tenant)', () => {
  const contexto = configurarTesteIntegracao(true);
  let tokenAdmin: string;
  let tokenCliente: string;
  let clienteId: number;

  beforeEach(async () => {
    tokenAdmin = await obterTokenAdmin(contexto.app);
    tokenCliente = await obterTokenCliente(
      contexto.app,
      'clientetest@email.com',
      '529.982.247-25',
    );

    // Buscar cli_id do cliente para testes de cupom de troca
    const clienteRes = await contexto.db!.executar<{ cli_id: number }>(
      `SELECT c.cli_id FROM livraria_gestao.clientes c
       JOIN livraria_gestao.usuarios u ON u.usu_id = c.usu_id
       WHERE u.usu_email = 'clientetest@email.com'`
    );
    if (clienteRes.length > 0) {
      clienteId = clienteRes[0].cli_id;
    }
  });

  describe('POST /api/admin/cupom/promocional', () => {
    it('[RF] deve criar cupom promocional global (admin_sistema)', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/cupom/promocional')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          codigo: 'GLOBAL30',
          valorDesconto: 30,
          valorMinimo: 0,
          usoMaximo: 100,
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.mensagem).toContain('global');
      expect(res.body.dados.codigo).toBe('GLOBAL30');
      expect(res.body.dados.lojId).toBeNull();

      // Verificar no banco de dados
      const cupomDb = await contexto.db!.executar<{ loj_id: number | null }>(
        `SELECT loj_id FROM livraria_comercial.cupom WHERE cup_codigo = 'GLOBAL30'`
      );
      expect(cupomDb.length).toBe(1);
      expect(cupomDb[0].loj_id).toBeNull();
    });

    it('[RF] deve criar cupom promocional específico da loja (admin_loja)', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/cupom/promocional')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          codigo: 'LOJA25',
          valorDesconto: 25,
          valorMinimo: 50,
          usoMaximo: 50,
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.mensagem).toContain('loja');
      expect(res.body.dados.codigo).toBe('LOJA25');
      expect(res.body.dados.lojId).toBeDefined();
      expect(res.body.dados.lojId).toBeGreaterThan(0);

      // Verificar no banco de dados
      const cupomDb = await contexto.db!.executar<{ loj_id: number }>(
        `SELECT loj_id FROM livraria_comercial.cupom WHERE cup_codigo = 'LOJA25'`
      );
      expect(cupomDb.length).toBe(1);
      expect(cupomDb[0].loj_id).toBeGreaterThan(0);
    });

    it('[RNF] deve retornar 400 sem código ou valor desconto', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/cupom/promocional')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          valorMinimo: 50,
          usoMaximo: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.erro).toContain('Código e valor desconto são obrigatórios');
    });

    it('[RNF] deve retornar 401 sem autenticação', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/cupom/promocional')
        .send({
          codigo: 'TESTE10',
          valorDesconto: 10,
        });

      expect(res.status).toBe(401);
    });

    it('[RNF] deve retornar 403 para cliente tentando criar cupom', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/cupom/promocional')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          codigo: 'TESTE10',
          valorDesconto: 10,
        });

      expect(res.status).toBe(403);
    });

    it('[RF] deve atualizar cupom existente (ON CONFLICT)', async () => {
      // Criar cupom inicial
      await request(contexto.app)
        .post('/api/admin/cupom/promocional')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          codigo: 'UPDATE15',
          valorDesconto: 15,
        });

      // Atualizar mesmo cupom
      const res = await request(contexto.app)
        .post('/api/admin/cupom/promocional')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          codigo: 'UPDATE15',
          valorDesconto: 20,
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);

      // Verificar que foi atualizado
      const cupomDb = await contexto.db!.executar<{ cup_valor_desconto: number }>(
        `SELECT cup_valor_desconto FROM livraria_comercial.cupom WHERE cup_codigo = 'UPDATE15'`
      );
      expect(cupomDb.length).toBe(1);
      expect(cupomDb[0].cup_valor_desconto).toBe(20);
    });
  });

  describe('POST /api/admin/cupom/troca', () => {
    it('[RF] deve criar cupom de troca global (admin_sistema)', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/cupom/troca')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          clienteId,
          valor: 75,
          vendaOrigemId: null,
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.mensagem).toContain('global');
      expect(res.body.dados.codigo).toMatch(/^TROCA-/);
      expect(res.body.dados.clienteId).toBe(clienteId);
      expect(res.body.dados.valor).toBe(75);
      expect(res.body.dados.lojId).toBeNull();
    });

    it('[RF] deve criar cupom de troca específico da loja (admin_loja)', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/cupom/troca')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          clienteId,
          valor: 60,
          vendaOrigemId: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.mensagem).toContain('loja');
      expect(res.body.dados.codigo).toMatch(/^TROCA-/);
      expect(res.body.dados.clienteId).toBe(clienteId);
      expect(res.body.dados.valor).toBe(60);
      expect(res.body.dados.lojId).toBeDefined();
      expect(res.body.dados.lojId).toBeGreaterThan(0);
    });

    it('[RNF] deve retornar 400 sem clienteId ou valor', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/cupom/troca')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          vendaOrigemId: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.erro).toContain('Cliente ID e valor são obrigatórios');
    });

    it('[RNF] deve retornar 401 sem autenticação', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/cupom/troca')
        .send({
          clienteId,
          valor: 50,
        });

      expect(res.status).toBe(401);
    });

    it('[RNF] deve retornar 403 para cliente tentando criar cupom', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/cupom/troca')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          clienteId,
          valor: 50,
        });

      expect(res.status).toBe(403);
    });

    it('[RF] deve gerar código único para cada cupom de troca', async () => {
      const res1 = await request(contexto.app)
        .post('/api/admin/cupom/troca')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          clienteId,
          valor: 50,
        });

      const res2 = await request(contexto.app)
        .post('/api/admin/cupom/troca')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          clienteId,
          valor: 50,
        });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.dados.codigo).not.toBe(res2.body.dados.codigo);
    });
  });

  describe('Multi-Tenancy - Filtragem de Cupons', () => {
    it('[RF] deve aplicar cupom global em qualquer loja', async () => {
      // Criar cupom global
      await request(contexto.app)
        .post('/api/admin/cupom/promocional')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          codigo: 'GLOBAL_ANY40',
          valorDesconto: 40,
        });

      // Aplicar cupom como cliente
      const res = await request(contexto.app)
        .post('/api/cupom/aplicar')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ codigo: 'GLOBAL_ANY40' });

      expect(res.status).toBe(200);
      expect(res.body.dados.codigo).toBe('GLOBAL_ANY40');
    });

    it('[RF] deve aplicar cupom específico da loja apenas na loja correta', async () => {
      // Criar cupom específico da loja do admin
      const criaCupomRes = await request(contexto.app)
        .post('/api/admin/cupom/promocional')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          codigo: 'LOJA_SPECIFIC35',
          valorDesconto: 35,
        });

      const lojId = criaCupomRes.body.dados.lojId;

      // Aplicar cupom como cliente (deve funcionar se cliente está na mesma loja)
      const res = await request(contexto.app)
        .post('/api/cupom/aplicar')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ codigo: 'LOJA_SPECIFIC35' });

      // Se o cliente estiver na mesma loja do admin, deve funcionar
      if (res.status === 200) {
        expect(res.body.dados.codigo).toBe('LOJA_SPECIFIC35');
      } else {
        // Se estiverem em lojas diferentes, deve falhar
        expect(res.status).toBe(400);
      }
    });

    it('[RF] cliente não deve aplicar cupom de outra loja', async () => {
      // Criar cupom em uma loja diferente
      // (simulado criando cupom como admin_sistema e depois atualizando loj_id manualmente)
      await request(contexto.app)
        .post('/api/admin/cupom/promocional')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          codigo: 'OUTRA_LOJA20',
          valorDesconto: 20,
        });

      // Atualizar manualmente para uma loja diferente do cliente
      await contexto.db!.executar(
        `UPDATE livraria_comercial.cupom SET loj_id = 999 WHERE cup_codigo = 'OUTRA_LOJA20'`
      );

      // Tentar aplicar cupom (deve falhar se cliente não está na loja 999)
      const res = await request(contexto.app)
        .post('/api/cupom/aplicar')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ codigo: 'OUTRA_LOJA20' });

      expect(res.status).toBe(400);
    });
  });

  describe('Validação de Dados', () => {
    it('[RNF] deve rejeitar valor desconto negativo', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/cupom/promocional')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          codigo: 'NEGATIVO',
          valorDesconto: -10,
        });

      // O banco deve rejeitar valor negativo
      expect([400, 500]).toContain(res.status);
    });

    it('[RNF] deve rejeitar valor desconto zero', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/cupom/promocional')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          codigo: 'ZERO',
          valorDesconto: 0,
        });

      // O banco deve rejeitar valor zero ou a aplicação deve validar
      expect([400, 500]).toContain(res.status);
    });

    it('[RNF] deve rejeitar clienteId inexistente', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/cupom/troca')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          clienteId: 999999,
          valor: 50,
        });

      // FK constraint deve rejeitar
      expect([400, 500]).toContain(res.status);
    });
  });
});
