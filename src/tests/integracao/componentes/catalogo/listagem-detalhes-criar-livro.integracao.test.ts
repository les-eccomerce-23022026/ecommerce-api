import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenAdmin } from '@/tests/utils/requisicoes-api.util';

/**
 * Testes E2E para livros usando rotas HTTP.
 * Setup e testes usam apenas rotas HTTP, sem SQL direto.
 */
describe('E2E - Livros (Rotas HTTP)', () => {
  const contexto = configurarTesteIntegracao();
  let app: any;
  let tokenAdmin: string;

  beforeAll(async () => {
    app = contexto.app;
    tokenAdmin = await obterTokenAdmin(app);
  });

  describe('Fluxo completo de livros', () => {
    it('deve listar catálogo de livros via HTTP', async () => {
      const res = await request(app).get('/api/livros').query({
        pagina: 1,
        itensPorPagina: 10,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('livros');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.livros)).toBe(true);
    });

    it('deve obter detalhes de um livro via HTTP', async () => {
      // Primeiro, listar livros para obter um UUID válido
      const listaRes = await request(app).get('/api/livros').query({
        pagina: 1,
        itensPorPagina: 1,
      });

      if (listaRes.status === 200 && listaRes.body.livros.length > 0) {
        const livroUuid = listaRes.body.livros[0].uuid;

        const res = await request(app).get(`/api/livros/${livroUuid}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('uuid');
        expect(res.body.uuid).toBe(livroUuid);
      }
    });

    it('deve listar categorias do catálogo via HTTP', async () => {
      const res = await request(app).get('/api/categorias/catalogo');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('deve criar livro via HTTP (admin)', async () => {
      // Primeiro criar autor e editora para garantir que existam
      await request(app)
        .post('/api/admin/autores/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send([{ nome: 'Autor E2E Test', descricao: 'Autor para teste E2E' }]);

      await request(app)
        .post('/api/admin/editoras/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send([{ nome: 'Editora E2E Test', cnpj: '00.000.000/0004-34' }]);

      const livroRes = await request(app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: 'Livro Teste E2E',
          isbn: `978857${Math.floor(Math.random() * 1000000)}`,
          autorNome: 'Autor E2E Test',
          editoraNome: 'Editora E2E Test',
          categoriaNome: 'Tecnologia',
          ano: 2024,
          edicao: '1ª',
          numeroPaginas: 300,
          altura: 23,
          largura: 15,
          peso: 0.5,
          profundidade: 2,
          codigoBarras: `789${Math.floor(Math.random() * 10000000000)}`,
          preco: 50.00,
          estoque: 10,
        });

      expect(livroRes.status).toBe(201);
      expect(livroRes.body.sucesso).toBe(true);
      expect(livroRes.body.dados).toHaveProperty('uuid');
    });

    it('deve retornar erro ao tentar criar livro sem autenticação', async () => {
      const res = await request(app).post('/api/admin/livros').send({
        titulo: 'Livro Teste',
        isbn: '9788570000000',
      });

      expect(res.status).toBe(401);
    });

    it('deve retornar erro ao tentar criar livro sem permissão de admin', async () => {
      // Criar cliente
      const cpfUnico = '529.982.247-25';
      const emailUnico = `cliente.livro${Math.floor(Math.random() * 1000)}@teste.com`;

      const registroRes = await request(app).post('/api/clientes/registro').send({
        cpf: cpfUnico,
        email: emailUnico,
        nome: 'Cliente Livro',
        senha: 'SenhaForte@123',
        confirmacaoSenha: 'SenhaForte@123',
      });

      if (registroRes.status === 201) {
        // Login
        const loginRes = await request(app).post('/api/auth/login').send({
          email: emailUnico,
          senha: 'SenhaForte@123',
        });

        if (loginRes.status === 200) {
          const tokenCliente = loginRes.body.dados.token;

          // Tentar criar livro como cliente
          const res = await request(app)
            .post('/api/admin/livros')
            .set('Authorization', `Bearer ${tokenCliente}`)
            .send({
              titulo: 'Livro Teste',
              isbn: '9788570000000',
            });

          expect(res.status).toBe(403);
        }
      }
    });
  });
});
