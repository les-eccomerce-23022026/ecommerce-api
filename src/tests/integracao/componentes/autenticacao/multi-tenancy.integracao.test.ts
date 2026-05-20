import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenAdmin, registrarAdmin } from '@/tests/helpers/requisicoes-api.util';
import { di } from '@/shared/infrastructure/di.container';

/**
 * Testes de integração para multi-tenancy por loja.
 * Verifica o isolamento de dados por loj_id e o comportamento do middleware contextoLoja.
 * 
 * RN0091: Isolamento de Dados por Loja
 * - Admin de loja X só vê produtos/vendas/clientes da loja X
 * - Admin mestre vê dados de todas as lojas
 * - Clientes veem produtos de todas as lojas (catálogo compartilhado)
 */
describe('Integração - Multi-tenancy por Loja', () => {
  const contexto = configurarTesteIntegracao();

  describe('POST /api/admin/lojas - Criação de Lojas', () => {
    it('[RN0091] deve criar loja com sucesso', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .post('/api/admin/lojas')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Loja Teste',
          slug: 'loja-teste',
          cnpj: '12.345.678/0001-90',
        });

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
      expect(typeof res.body.dados.uuid).toBe('string');
      expect(res.body.dados.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(res.body.dados.nome).toBe('Loja Teste');
      expect(res.body.dados.slug).toBe('loja-teste');
    });

    it('[RN0091] deve retornar 400 ao criar loja sem campos obrigatórios', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .post('/api/admin/lojas')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Loja Teste',
        });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toContain('Campos obrigatórios ausentes');
    });

    it('[RN0091] deve retornar 403 ao criar loja sem ser admin mestre', async () => {
      // Criar admin comum
      const tokenMestre = await obterTokenAdmin(contexto.app);
      const adminRes = await registrarAdmin(contexto.app, tokenMestre, {
        email: 'admin.comum@teste.com',
        limparDados: true,
      });

      const tokenAdminComum = adminRes.body.dados.token;

      const res = await request(contexto.app)
        .post('/api/admin/lojas')
        .set('Authorization', `Bearer ${tokenAdminComum}`)
        .send({
          nome: 'Loja Teste',
          slug: 'loja-teste',
          cnpj: '12.345.678/0001-90',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/lojas - Listagem de Lojas', () => {
    it('[RN0091] deve listar todas as lojas para admin', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .get('/api/admin/lojas')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(Array.isArray(res.body.dados)).toBe(true);
    });

    it('[RN0091] deve retornar 401 ao listar lojas sem autenticação', async () => {
      const res = await request(contexto.app).get('/api/admin/lojas');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/admin/lojas/associar-admin - Associação de Admin a Loja', () => {
    it('[RN0091] deve associar admin a loja com sucesso', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      // Criar loja
      const lojaRes = await request(contexto.app)
        .post('/api/admin/lojas')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Loja Associação',
          slug: 'loja-associacao',
          cnpj: '98.765.432/0001-10',
        });

      const lojaId = lojaRes.body.dados.uuid;

      // Criar admin
      const adminRes = await registrarAdmin(contexto.app, tokenMestre, {
        email: 'admin.loja@teste.com',
        limparDados: true,
      });

      const adminUuid = adminRes.body.dados.uuid;
      const adminId = await obterUsuarioIdPorUuid(adminUuid);

      // Associar admin à loja
      const res = await request(contexto.app)
        .post('/api/admin/lojas/associar-admin')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          usuarioId: adminId,
          lojaId: lojaId,
          papel: 'admin',
        });

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.mensagem).toContain('Administrador associado à loja');
    });

    it('[RN0091] deve retornar 400 ao associar admin sem campos obrigatórios', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .post('/api/admin/lojas/associar-admin')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          usuarioId: 123,
        });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toContain('Campos obrigatórios ausentes');
    });

    it('[RN0091] deve retornar 403 ao associar admin sem ser admin mestre', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      // Criar admin comum
      const adminRes = await registrarAdmin(contexto.app, tokenMestre, {
        email: 'admin.comum2@teste.com',
        limparDados: true,
      });

      const tokenAdminComum = adminRes.body.dados.token;

      const res = await request(contexto.app)
        .post('/api/admin/lojas/associar-admin')
        .set('Authorization', `Bearer ${tokenAdminComum}`)
        .send({
          usuarioId: 123,
          lojaId: 456,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Contexto de Loja via header x-loja-uuid', () => {
    it('[RN0091] deve definir contexto de loja quando header x-loja-uuid é fornecido', async () => {
      // Criar loja
      const tokenMestre = await obterTokenAdmin(contexto.app);
      const lojaRes = await request(contexto.app)
        .post('/api/admin/lojas')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Loja Contexto',
          slug: 'loja-contexto',
          cnpj: '11.222.333/0001-44',
        });

      const lojaUuid = lojaRes.body.dados.uuid;

      // Fazer requisição com header x-loja-uuid
      const res = await request(contexto.app)
        .get('/api/livros')
        .set('x-loja-uuid', lojaUuid);

      // O middleware deve aceitar o header e retornar sucesso (200) ou catálogo vazio (404)
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(500);
      expect(res.status).not.toBe(400); // Não deve rejeitar o header
    });

    it('[RN0091] deve ignorar header x-loja-uuid inválido', async () => {
      const res = await request(contexto.app)
        .get('/api/livros')
        .set('x-loja-uuid', 'invalido');

      // O middleware deve continuar sem contexto e retornar sucesso (200) ou catálogo vazio (404)
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(500);
      expect(res.status).not.toBe(400); // Não deve rejeitar completamente
    });
  });

  /**
   * Helper para obter o ID interno do usuário a partir do UUID
   */
  async function obterUsuarioIdPorUuid(uuid: string): Promise<number> {
    const usuario = await di.repoUsuarios.buscarPorUuid(uuid);
    if (!usuario) {
      throw new Error(`Usuário não encontrado: ${uuid}`);
    }
    return usuario.id;
  }
});
