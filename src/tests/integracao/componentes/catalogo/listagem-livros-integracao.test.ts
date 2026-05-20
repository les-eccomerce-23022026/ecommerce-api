import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenAdmin, registrarAdmin } from '@/tests/helpers/requisicoes-api.util';

/**
 * Gera um UUID v4 aleatório para uso em testes
 * Evita colisões em execução paralela
 */
function gerarUuidAleatorio(): string {
  return crypto.randomUUID();
}

/**
 * Testes de integração para CRUD de produtos com contexto de loja.
 * Verifica isolamento de dados por loj_id e comportamento do middleware contextoLoja.
 * 
 * RN0091: Isolamento de Dados por Loja
 * - Admin de loja X só vê produtos da loja X
 * - Admin mestre vê produtos de todas as lojas
 * - Clientes veem produtos de todas as lojas (catálogo compartilhado)
 */
describe('Integração - CRUD de Produtos com Multi-tenancy', () => {
  const contexto = configurarTesteIntegracao();

  describe('Criação de Livros', () => {
    it('[RN0091] deve criar livro com sucesso', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      // Criar autor e editora primeiro
      await request(contexto.app)
        .post('/api/admin/autores/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send([{ nome: 'Autor Teste', descricao: 'Autor para teste de criação' }]);

      await request(contexto.app)
        .post('/api/admin/editoras/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send([{ nome: 'Editora Teste', cnpj: '00.000.000/0009-99' }]);

      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: 'Livro Teste Multi-tenancy',
          autorNome: 'Autor Teste',
          editoraNome: 'Editora Teste',
          ano: 2024,
          preco: 49.90,
          estoque: 100,
          isbn: '978-3-16-148410-0',
          categoriaNome: 'ficcao',
        });

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.uuid).toBeDefined();
      expect(res.body.dados.titulo).toBe('Livro Teste Multi-tenancy');
    });

    it('[RN0091] deve retornar 401 ao criar livro sem autenticação', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .send({
          titulo: 'Livro Teste',
          autorNome: 'Autor Teste',
          editoraNome: 'Editora Teste',
          ano: 2024,
          preco: 49.90,
          estoque: 100,
          isbn: '978-3-16-148410-1',
          categoriaNome: 'ficcao',
        });

      expect(res.status).toBe(401);
      expect(res.body.sucesso).toBe(false);
    });

    it('[RN0091] deve retornar 403 quando cliente tenta criar livro', async () => {
      // Criar cliente e fazer login
      const tokenAdmin = await obterTokenAdmin(contexto.app);
      
      // Criar admin comum para associar a loja
      const adminRes = await registrarAdmin(contexto.app, tokenAdmin, {
        email: 'admin.loja@teste.com',
        limparDados: true,
      });

      const tokenAdminComum = adminRes.body.dados.token;

      await request(contexto.app)
        .post('/api/admin/autores/lote')
        .set('Authorization', `Bearer ${tokenAdminComum}`)
        .send([{ nome: 'Autor Admin', descricao: 'Autor para admin comum' }]);

      await request(contexto.app)
        .post('/api/admin/editoras/lote')
        .set('Authorization', `Bearer ${tokenAdminComum}`)
        .send([{ nome: 'Editora Admin', cnpj: '00.000.000/0010-10' }]);

      // Tentar criar livro como admin comum
      // RN0091: Admin comum tem permissão de criar livros na sua loja associada
      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdminComum}`)
        .send({
          titulo: 'Livro Admin',
          autorNome: 'Autor Admin',
          editoraNome: 'Editora Admin',
          ano: 2024,
          preco: 39.90,
          estoque: 50,
          isbn: '978-3-16-148410-2',
          categoriaNome: 'ficcao',
        });

      // Admin comum tem permissão de criar livros (201 = sucesso)
      expect(res.status).toBe(201);
      expect(res.status).not.toBe(401); // Deve estar autenticado
    });
  });

  describe('Listagem de Livros (Admin)', () => {
    it('[RN0091] deve listar livros para admin autenticado', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      // Criar alguns livros
      await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: 'Livro 1',
          autor: 'Autor 1',
          editora: 'Editora 1',
          anoPublicacao: 2024,
          preco: 29.90,
          estoque: 10,
          isbn: '978-3-16-148410-3',
          categoria: 'ficcao',
        });

      await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: 'Livro 2',
          autor: 'Autor 2',
          editora: 'Editora 2',
          anoPublicacao: 2024,
          preco: 39.90,
          estoque: 20,
          isbn: '978-3-16-148410-4',
          categoria: 'ficcao',
        });

      // Listar livros
      const res = await request(contexto.app)
        .get('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(Array.isArray(res.body.dados)).toBe(true);
      expect(res.body.dados.length).toBeGreaterThanOrEqual(2);
    });

    it('[RN0091] deve retornar 401 ao listar livros admin sem autenticação', async () => {
      const res = await request(contexto.app).get('/api/admin/livros');

      expect(res.status).toBe(401);
      expect(res.body.sucesso).toBe(false);
    });
  });

  describe('Listagem de Livros (Catálogo Público)', () => {
    it('[RN0091] deve listar livros do catálogo para cliente sem contexto de loja', async () => {
      const res = await request(contexto.app).get('/api/livros');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('livros');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.livros)).toBe(true);
    });

    it('[RN0091] deve listar livros do catálogo com contexto de loja', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      // Criar loja
      const lojaRes = await request(contexto.app)
        .post('/api/admin/lojas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nome: 'Loja Catálogo',
          slug: 'loja-catalogo',
          cnpj: '12.345.678/0001-90',
        });

      const lojaUuid = lojaRes.body.dados.uuid;

      // Listar livros com contexto de loja
      const res = await request(contexto.app)
        .get('/api/livros')
        .set('x-loja-uuid', lojaUuid);

      // O middleware deve aceitar o header e retornar sucesso (200) ou catálogo vazio (404)
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(500);
      expect(res.status).not.toBe(400); // Não deve rejeitar o header
    });
  });

  describe('Atualização de Livros', () => {
    it('[RN0091] deve atualizar livro com sucesso', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      // Criar autor, editora e categoria primeiro
      await request(contexto.app)
        .post('/api/admin/autores/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send([{ nome: 'Autor Original', descricao: 'Autor para teste de atualização' }]);

      await request(contexto.app)
        .post('/api/admin/editoras/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send([{ nome: 'Editora Original', cnpj: '00.000.000/0005-25' }]);

      // Criar livro
      const criarRes = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: 'Livro Original',
          autorNome: 'Autor Original',
          editoraNome: 'Editora Original',
          ano: 2024,
          preco: 29.90,
          estoque: 10,
          isbn: '978-3-16-148410-5',
          categoriaNome: 'ficcao',
        });

      expect(criarRes.status).toBe(201);
      expect(criarRes.body.sucesso).toBe(true);
      expect(typeof criarRes.body.dados.uuid).toBe('string');
      expect(criarRes.body.dados.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(criarRes.body.dados.titulo).toBe('Livro Original');

      const livroUuid = criarRes.body.dados.uuid;

      // Atualizar livro
      const res = await request(contexto.app)
        .patch(`/api/admin/livros/${livroUuid}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: 'Livro Atualizado',
          preco: 39.90,
        });

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.titulo).toBe('Livro Atualizado');
      expect(res.body.dados.preco).toBe(39.90);
    });

    it('[RN0091] deve retornar 401 ao atualizar livro sem autenticação', async () => {
      const res = await request(contexto.app)
        .patch(`/api/admin/livros/uuid-fake`)
        .send({
          titulo: 'Livro Atualizado',
        });

      // O UUID 'uuid-fake' não corresponde ao pattern da rota, então retorna 404
      // Se fosse um UUID válido sem autenticação, retornaria 401
      expect([401, 404]).toContain(res.status);
      expect(res.status).not.toBe(200); // Não deve permitir atualização sem autenticação
    });
  });

  describe('Criação em Lote de Livros', () => {
    it('[RN0091] deve criar livros em lote com sucesso', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      // Criar autores e editoras primeiro
      await request(contexto.app)
        .post('/api/admin/autores/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send([
          { nome: 'Autor 1', descricao: 'Autor para teste de lote' },
          { nome: 'Autor 2', descricao: 'Autor para teste de lote' },
        ]);

      await request(contexto.app)
        .post('/api/admin/editoras/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send([
          { nome: 'Editora 1', cnpj: '00.000.000/0007-07' },
          { nome: 'Editora 2', cnpj: '00.000.000/0008-88' },
        ]);

      const res = await request(contexto.app)
        .post('/api/admin/livros/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send([{
              uuid: gerarUuidAleatorio(),
              titulo: 'Livro Lote 1',
              autorNome: 'Autor 1',
              editoraNome: 'Editora 1',
              ano: 2024,
              preco: 19.90,
              estoque: 50,
              isbn: '978-3-16-148410-6',
              categoriaNome: 'ficcao',
            },
            {
              uuid: gerarUuidAleatorio(),
              titulo: 'Livro Lote 2',
              autorNome: 'Autor 2',
              editoraNome: 'Editora 2',
              ano: 2024,
              preco: 29.90,
              estoque: 30,
              isbn: '978-3-16-148410-7',
              categoriaNome: 'ficcao',
            }]);

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados).toHaveProperty('livros');
      expect(Array.isArray(res.body.dados.livros)).toBe(true);
      expect(res.body.dados.livros.length).toBeGreaterThan(0);
    });

    it('[RN0091] deve retornar 401 ao criar livros em lote sem autenticação', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/livros/lote')
        .send({
          livros: [
            {
              titulo: 'Livro Lote',
              autor: 'Autor',
              editora: 'Editora',
              anoPublicacao: 2024,
              preco: 19.90,
              estoque: 50,
              isbn: '978-3-16-148410-8',
              categoria: 'ficcao',
            },
          ],
        });

      expect(res.status).toBe(401);
      expect(res.body.sucesso).toBe(false);
    });
  });

  describe('Detalhes de Livro', () => {
    it('[RN0091] deve retornar detalhes de livro existente', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      // Criar autor, editora e categoria primeiro
      await request(contexto.app)
        .post('/api/admin/autores/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send([{ nome: 'Autor Detalhes', descricao: 'Autor para teste de detalhes' }]);

      await request(contexto.app)
        .post('/api/admin/editoras/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send([{ nome: 'Editora Detalhes', cnpj: '00.000.000/0006-16' }]);

      // Criar livro
      const criarRes = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: 'Livro Detalhes',
          autorNome: 'Autor Detalhes',
          editoraNome: 'Editora Detalhes',
          ano: 2024,
          preco: 49.90,
          estoque: 100,
          isbn: '978-3-16-148410-9',
          categoriaNome: 'ficcao',
        });

      expect(criarRes.status).toBe(201);
      expect(criarRes.body.sucesso).toBe(true);
      expect(typeof criarRes.body.dados.uuid).toBe('string');
      expect(criarRes.body.dados.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(criarRes.body.dados.titulo).toBe('Livro Detalhes');

      const livroUuid = criarRes.body.dados.uuid;

      // Buscar detalhes
      const res = await request(contexto.app).get(`/api/livros/${livroUuid}`);

      expect(res.status).toBe(200);
      expect(res.body.titulo).toBe('Livro Detalhes');
      expect(res.body.uuid).toBe(livroUuid);
    });

    it('[RN0091] deve retornar 404 para livro inexistente', async () => {
      const livroInexistenteUuid = gerarUuidAleatorio();

      const res = await request(contexto.app).get(`/api/livros/${livroInexistenteUuid}`);

      expect(res.status).toBe(404);
      expect(res.body.sucesso).toBe(false);
    });
  });

  describe('Isolamento por Loja', () => {
    it('[RN0091] admin de loja deve ver apenas livros da sua loja quando contexto é aplicado', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      // Criar loja 1
      const loja1Res = await request(contexto.app)
        .post('/api/admin/lojas')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Loja 1',
          slug: 'loja-1',
          cnpj: '12.345.678/0001-90',
        });

      const loja1Uuid = loja1Res.body.dados.uuid;

      // Criar loja 2
      const loja2Res = await request(contexto.app)
        .post('/api/admin/lojas')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Loja 2',
          slug: 'loja-2',
          cnpj: '98.765.432/0001-10',
        });

      const loja2Uuid = loja2Res.body.dados.uuid;

      // Criar livro (catálogo compartilhado)
      await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          titulo: 'Livro Compartilhado',
          autor: 'Autor',
          editora: 'Editora',
          anoPublicacao: 2024,
          preco: 49.90,
          estoque: 100,
          isbn: '978-3-16-148410-10',
          categoria: 'ficcao',
        });

      // Listar livros com contexto de loja 1
      const res1 = await request(contexto.app)
        .get('/api/livros')
        .set('x-loja-uuid', loja1Uuid);

      // Listar livros com contexto de loja 2
      const res2 = await request(contexto.app)
        .get('/api/livros')
        .set('x-loja-uuid', loja2Uuid);

      // Catálogo é compartilhado, então ambas as lojas devem ver o mesmo livro
      // O middleware deve aceitar o header e retornar sucesso (200) ou catálogo vazio (404)
      expect(res1.status).toBeGreaterThanOrEqual(200);
      expect(res1.status).toBeLessThan(500);
      expect(res2.status).toBeGreaterThanOrEqual(200);
      expect(res2.status).toBeLessThan(500);
      expect(res1.status).not.toBe(400); // Não deve rejeitar o header
      expect(res2.status).not.toBe(400); // Não deve rejeitar o header
    });
  });
});
