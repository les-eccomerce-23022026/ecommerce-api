import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenAdmin, registrarAdmin, registrarCliente, realizarLogin } from '@/tests/utils/requisicoes-api.util';
import { di } from '@/shared/infrastructure/di.container';

/**
 * Testes de integração para verificação de acesso a produtos por tipo de admin.
 * Verifica se admin mestre tem acesso global e admin comum tem acesso limitado à loja.
 * 
 * RN0091: Isolamento de Dados por Loja
 * - Admin mestre vê dados de todas as lojas (acesso global)
 * - Admin comum vê apenas dados da loja associada
 * - Cliente vê produtos de todas as lojas (catálogo compartilhado)
 */
describe('Integração - Acesso a Produtos por Tipo de Admin', () => {
  const contexto = configurarTesteIntegracao();

  describe('Acesso de Admin Mestre', () => {
    it('[RN0091] admin mestre deve conseguir criar livros', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          uuid: '00000000-0000-0000-0000-000000000100',
          titulo: 'Livro Admin Mestre',
          autorNome: 'Autor Teste',
          editoraNome: 'Editora Teste',
          grupoPrecificacaoNome: 'Grupo 1',
          categoriaNome: 'ficcao',
          isbn: '9783161484100',
          ano: 2024,
          edicao: '1',
          numeroPaginas: 200,
          altura: 20,
          largura: 15,
          peso: 0.5,
          profundidade: 2,
          codigoBarras: '9783161484100',
          quantidadeEstoque: 100,
          precoVenda: 49.90,
          valorCusto: 20.00,
        });

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
    });

    it('[RN0091] admin mestre deve conseguir listar todos os administradores', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .get('/api/admin/administradores')
        .set('Authorization', `Bearer ${tokenMestre}`);

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(Array.isArray(res.body.dados)).toBe(true);
    });

    it('[RN0091] admin mestre deve conseguir criar lojas', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .post('/api/admin/lojas')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Loja Mestre',
          slug: 'loja-mestre',
          cnpj: '12.345.678/0001-90',
        });

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
    });

    it('[RN0091] admin mestre deve conseguir associar admin a loja', async () => {
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
        email: 'admin.associado@teste.com',
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
    });
  });

  describe('Acesso de Admin Comum', () => {
    it('[RN0091] admin comum deve conseguir criar livros', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      // Criar admin comum
      const adminRes = await registrarAdmin(contexto.app, tokenMestre, {
        email: 'admin.comum.livros@teste.com',
        limparDados: true,
      });

      const tokenAdminComum = adminRes.body.dados.token;

      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdminComum}`)
        .send({
          titulo: 'Livro Admin Comum',
          autor: 'Autor Teste',
          editora: 'Editora Teste',
          anoPublicacao: 2024,
          preco: 39.90,
          estoque: 50,
          isbn: '978-3-16-148410-1',
          categoria: 'ficcao',
        });

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
    });

    it('[RN0091] admin comum deve conseguir listar livros', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      // Criar admin comum
      const adminRes = await registrarAdmin(contexto.app, tokenMestre, {
        email: 'admin.comum.listar@teste.com',
        limparDados: true,
      });

      const tokenAdminComum = adminRes.body.dados.token;

      const res = await request(contexto.app)
        .get('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdminComum}`);

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(Array.isArray(res.body.dados)).toBe(true);
    });

    it('[RN0091] admin comum NÃO deve conseguir criar lojas', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      // Criar admin comum
      const adminRes = await registrarAdmin(contexto.app, tokenMestre, {
        email: 'admin.comum.lojas@teste.com',
        limparDados: true,
      });

      const tokenAdminComum = adminRes.body.dados.token;

      const res = await request(contexto.app)
        .post('/api/admin/lojas')
        .set('Authorization', `Bearer ${tokenAdminComum}`)
        .send({
          nome: 'Loja Admin Comum',
          slug: 'loja-admin-comum',
          cnpj: '11.222.333/0001-44',
        });

      expect(res.status).toBe(403);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/acesso negado|mestre/i);
    });

    it('[RN0091] admin comum NÃO deve conseguir associar admin a loja', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      // Criar admin comum
      const adminRes = await registrarAdmin(contexto.app, tokenMestre, {
        email: 'admin.comum.associar@teste.com',
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
      expect(res.body.sucesso).toBe(false);
    });
  });

  describe('Acesso de Cliente', () => {
    it('[RN0091] cliente deve conseguir ver catálogo de livros', async () => {
      const res = await request(contexto.app).get('/api/livros');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('livros');
      expect(Array.isArray(res.body.livros)).toBe(true);
    });

    it('[RN0091] cliente deve conseguir ver detalhes de livro', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      // Criar livro
      const criarRes = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: 'Livro Cliente',
          autor: 'Autor Teste',
          editora: 'Editora Teste',
          anoPublicacao: 2024,
          preco: 49.90,
          estoque: 100,
          isbn: '978-3-16-148410-2',
          categoria: 'ficcao',
        });

      const livroUuid = criarRes.body.dados.uuid;

      // Cliente ver detalhes
      const res = await request(contexto.app).get(`/api/livros/${livroUuid}`);

      expect(res.status).toBe(200);
      expect(res.body.titulo).toBe('Livro Cliente');
    });

    it('[RN0091] cliente NÃO deve conseguir criar livros', async () => {
      // Registrar cliente
      await registrarCliente(contexto.app, {
        email: 'cliente.livros@teste.com',
        cpf: '123.456.789-09',
        limparDados: true,
      });

      // Fazer login
      const loginRes = await realizarLogin(contexto.app, 'cliente.livros@teste.com', 'SenhaForte@123');
      const tokenCliente = loginRes.body.dados.token;

      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          titulo: 'Livro Cliente',
          autor: 'Autor Teste',
          editora: 'Editora Teste',
          anoPublicacao: 2024,
          preco: 29.90,
          estoque: 10,
          isbn: '978-3-16-148410-3',
          categoria: 'ficcao',
        });

      expect(res.status).toBe(403);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/acesso negado|administrador/i);
    });

    it('[RN0091] cliente NÃO deve conseguir listar livros admin', async () => {
      // Registrar cliente
      await registrarCliente(contexto.app, {
        email: 'cliente.listar@teste.com',
        cpf: '987.654.321-00',
        limparDados: true,
      });

      // Fazer login
      const loginRes = await realizarLogin(contexto.app, 'cliente.listar@teste.com', 'SenhaForte@123');
      const tokenCliente = loginRes.body.dados.token;

      const res = await request(contexto.app)
        .get('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(403);
      expect(res.body.sucesso).toBe(false);
    });
  });

  describe('Acesso com Contexto de Loja', () => {
    it('[RN0091] cliente deve conseguir ver catálogo com contexto de loja', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      // Criar loja
      const lojaRes = await request(contexto.app)
        .post('/api/admin/lojas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nome: 'Loja Contexto',
          slug: 'loja-contexto',
          cnpj: '12.345.678/0001-90',
        });

      const lojaUuid = lojaRes.body.dados.uuid;

      // Cliente ver catálogo com contexto de loja
      const res = await request(contexto.app)
        .get('/api/livros')
        .set('x-loja-uuid', lojaUuid);

      // Middleware deve aceitar o header (200 = sucesso, 404 = catálogo vazio mas header válido)
      expect([200, 404]).toContain(res.status);
      expect(res.status).not.toBe(400); // Não deve rejeitar o header
    });

    it('[RN0091] admin deve conseguir ver catálogo com contexto de loja', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      // Criar loja
      const lojaRes = await request(contexto.app)
        .post('/api/admin/lojas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nome: 'Loja Admin Contexto',
          slug: 'loja-admin-contexto',
          cnpj: '98.765.432/0001-10',
        });

      const lojaUuid = lojaRes.body.dados.uuid;

      // Admin ver catálogo com contexto de loja
      const res = await request(contexto.app)
        .get('/api/livros')
        .set('x-loja-uuid', lojaUuid);

      // Middleware deve aceitar o header (200 = sucesso, 404 = catálogo vazio mas header válido)
      expect([200, 404]).toContain(res.status);
      expect(res.status).not.toBe(400); // Não deve rejeitar o header
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
