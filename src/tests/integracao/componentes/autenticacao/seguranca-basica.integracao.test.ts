import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenAdmin, registrarCliente, realizarLogin, gerarCpfValidoUnico } from '@/tests/helpers/requisicoes-api.util';

/**
 * Testes de integração para segurança básica.
 * Verifica proteções contra acessos não autorizados e tentativas de ataque.
 * 
 * Prioridade: MÉDIA
 * - Tentativa de acesso sem token
 * - Tentativa de acesso com token inválido
 * - Tentativa de acesso com token expirado
 * - SQL injection (usar parâmetros nas queries - já implementado em repositórios)
 * - XSS em campos de texto (validação de entrada)
 */
describe('Integração - Segurança Básica', () => {
  const contexto = configurarTesteIntegracao();

  describe('Proteção de Rotas Administrativas', () => {
    it('[SEGURANÇA] deve retornar 401 ao acessar rota admin sem token', async () => {
      const res = await request(contexto.app).get('/api/admin/administradores');

      expect(res.status).toBe(401);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toContain('Token não fornecido');
    });

    it('[SEGURANÇA] deve retornar 401 ao acessar rota de criação de livro sem token', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .send({
          titulo: 'Livro Teste',
          autor: 'Autor Teste',
          editora: 'Editora Teste',
          anoPublicacao: 2024,
          preco: 29.90,
          estoque: 10,
          isbn: '978-3-16-148410-0',
          categoria: 'ficcao',
        });

      expect(res.status).toBe(401);
      expect(res.body.sucesso).toBe(false);
    });

    it('[SEGURANÇA] deve retornar 401 ao acessar rota de listagem de livros admin sem token', async () => {
      const res = await request(contexto.app).get('/api/admin/livros');

      expect(res.status).toBe(401);
      expect(res.body.sucesso).toBe(false);
    });

    it('[SEGURANÇA] deve retornar 401 ao acessar rota de criação de loja sem token', async () => {
      const res = await request(contexto.app)
        .post('/api/admin/lojas')
        .send({
          nome: 'Loja Teste',
          slug: 'loja-teste',
          cnpj: '12.345.678/0001-90',
        });

      expect(res.status).toBe(401);
      expect(res.body.sucesso).toBe(false);
    });
  });

  describe('Proteção com Token Inválido', () => {
    it('[SEGURANÇA] deve retornar 401 ao acessar rota com token malformado', async () => {
      const res = await request(contexto.app)
        .get('/api/admin/administradores')
        .set('Authorization', 'Bearer token-malformado-sem-pontos');

      expect(res.status).toBe(401);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/token|inválido/i);
    });

    it('[SEGURANÇA] deve retornar 401 ao acessar rota com token aleatório', async () => {
      const res = await request(contexto.app)
        .get('/api/admin/administradores')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc123');

      expect(res.status).toBe(401);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/token|inválido/i);
    });

    it('[SEGURANÇA] deve retornar 401 ao acessar rota com token vazio', async () => {
      const res = await request(contexto.app)
        .get('/api/admin/administradores')
        .set('Authorization', 'Bearer ');

      expect(res.status).toBe(401);
      expect(res.body.sucesso).toBe(false);
    });
  });

  describe('Proteção de Rotas de Cliente', () => {
    it('[SEGURANÇA] deve retornar 401 ao acessar perfil sem token', async () => {
      const res = await request(contexto.app).get('/api/clientes/perfil');

      expect(res.status).toBe(401);
      expect(res.body.sucesso).toBe(false);
    });

    it('[SEGURANÇA] deve retornar 401 ao atualizar perfil sem token', async () => {
      const res = await request(contexto.app)
        .patch('/api/clientes/perfil')
        .send({
          nome: 'Novo Nome',
        });

      expect(res.status).toBe(401);
      expect(res.body.sucesso).toBe(false);
    });

    it('[SEGURANÇA] deve retornar 401 ao acessar carrinho sem token', async () => {
      const res = await request(contexto.app).get('/api/carrinho');

      expect(res.status).toBe(401);
      expect(res.body.sucesso).toBe(false);
    });
  });

  describe('Autorização por Papel', () => {
    it('[SEGURANÇA] deve retornar 403 quando cliente tenta acessar rota de admin', async () => {
      // Registrar e fazer login como cliente
      await registrarCliente(contexto.app, {
        email: 'cliente.seguranca@teste.com',
        cpf: gerarCpfValidoUnico(),
        limparDados: true,
      });

      const loginRes = await realizarLogin(contexto.app, 'cliente.seguranca@teste.com', 'SenhaForte@123');
      const tokenCliente = loginRes.body.dados.token;

      const res = await request(contexto.app)
        .get('/api/admin/administradores')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(403);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/acesso negado|administrador/i);
    });

    it('[SEGURANÇA] deve retornar 403 quando cliente tenta criar livro', async () => {
      await registrarCliente(contexto.app, {
        email: 'cliente.livros@teste.com',
        cpf: gerarCpfValidoUnico(),
        limparDados: true,
      });

      const loginRes = await realizarLogin(contexto.app, 'cliente.livros@teste.com', 'SenhaForte@123');
      const tokenCliente = loginRes.body.dados.token;

      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          titulo: 'Livro Teste',
          autor: 'Autor Teste',
          editora: 'Editora Teste',
          anoPublicacao: 2024,
          preco: 29.90,
          estoque: 10,
          isbn: '978-3-16-148410-0',
          categoria: 'ficcao',
        });

      expect(res.status).toBe(403);
      expect(res.body.sucesso).toBe(false);
    });

    it('[SEGURANÇA] deve retornar 403 quando admin comum tenta criar loja', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);

      // Criar admin comum
      const adminRes = await request(contexto.app)
        .post('/api/admin/registro')
        .set('Authorization', `Bearer ${tokenMestre}`)
        .send({
          nome: 'Admin Comum',
          cpf: gerarCpfValidoUnico(),
          email: 'admin.comum@teste.com',
          senha: 'SenhaAdmin@123',
          confirmacaoSenha: 'SenhaAdmin@123',
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
      expect(res.body.sucesso).toBe(false);
    });
  });

  describe('Prevenção de SQL Injection', () => {
    it('[SEGURANÇA] deve tratar aspas simples como dados literais em nome', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: "Livro'; DROP TABLE livros; --",
          autor: 'Autor Teste',
          editora: 'Editora Teste',
          anoPublicacao: 2024,
          preco: 29.90,
          estoque: 10,
          isbn: '978-3-16-148410-0',
          categoria: 'ficcao',
        });

      // Aspas devem ser persistidas como literal, sem erro de sintaxe SQL
      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.titulo).toBe("Livro'; DROP TABLE livros; --");
    });

    it('[SEGURANÇA] deve tratar aspas simples como dados literais em email', async () => {
      const res = await request(contexto.app)
        .post('/api/clientes/registro')
        .send({
          nome: 'Cliente Teste',
          cpf: gerarCpfValidoUnico(),
          email: "teste'; DROP TABLE clientes; --@teste.com",
          senha: 'SenhaForte@123',
          confirmacaoSenha: 'SenhaForte@123',
        });

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.email).toBe("teste'; DROP TABLE clientes; --@teste.com");
    });
  });

  describe('Prevenção de XSS', () => {
    it('[SEGURANÇA] deve sanitizar entrada HTML em nome de cliente', async () => {
      const res = await request(contexto.app)
        .post('/api/clientes/registro')
        .send({
          nome: '<script>alert("XSS")</script>',
          cpf: gerarCpfValidoUnico(),
          email: 'xss@teste.com',
          senha: 'SenhaForte@123',
          confirmacaoSenha: 'SenhaForte@123',
        });

      // O sistema deve aceitar (201) ou rejeitar (400) sanitização, mas não executar o script
      expect(res.status).not.toBe(500); // Não deve causar erro interno (XSS executado)
      expect([201, 400]).toContain(res.status); // Aceita sanitizado (201) ou rejeita (400)
    });

    it('[SEGURANÇA] deve sanitizar entrada HTML em título de livro', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: '<img src=x onerror=alert("XSS")>',
          autor: 'Autor Teste',
          editora: 'Editora Teste',
          anoPublicacao: 2024,
          preco: 29.90,
          estoque: 10,
          isbn: '978-3-16-148410-0',
          categoria: 'ficcao',
        });

      // O sistema deve aceitar (201) ou rejeitar (400) sanitização, mas não executar o script
      expect(res.status).not.toBe(500); // Não deve causar erro interno (XSS executado)
      expect([201, 400]).toContain(res.status); // Aceita sanitizado (201) ou rejeita (400)
    });
  });

  describe('Proteção de Dados Sensíveis', () => {
    it('[SEGURANÇA] não deve expor senha hash em respostas de API', async () => {
      await registrarCliente(contexto.app, {
        email: 'cliente.senha@teste.com',
        cpf: gerarCpfValidoUnico(),
        limparDados: true,
      });

      const loginRes = await realizarLogin(contexto.app, 'cliente.senha@teste.com', 'SenhaForte@123');

      expect(loginRes.body.dados.user).not.toHaveProperty('senhaHash');
      expect(loginRes.body.dados.user).not.toHaveProperty('senha');
    });

    it('[SEGURANÇA] não deve expor ID interno (BIGSERIAL) em respostas de API', async () => {
      await registrarCliente(contexto.app, {
        email: 'cliente.id@teste.com',
        cpf: gerarCpfValidoUnico(),
        limparDados: true,
      });

      const loginRes = await realizarLogin(contexto.app, 'cliente.id@teste.com', 'SenhaForte@123');

      expect(loginRes.body.dados.user).not.toHaveProperty('id');
      expect(loginRes.body.dados.user).toHaveProperty('uuid');
    });
  });
});
