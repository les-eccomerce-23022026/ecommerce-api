import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenAdmin, registrarCliente, registrarAdmin } from '@/tests/utils/requisicoes-api.util';

/**
 * Testes de integração para validação de dados.
 * Verifica validações de entrada para preços, estoque, CPF, telefone, etc.
 * 
 * Prioridade: ALTA
 * - Preços negativos ou zero
 * - Estoque negativo
 * - CPF/telefone inválidos
 * - E-mails duplicados
 */
describe('Integração - Validação de Dados', () => {
  const contexto = configurarTesteIntegracao();

  describe('Validação de Preços (Livros)', () => {
    it('[VALIDAÇÃO] deve rejeitar preço negativo ao criar livro', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: 'Livro Teste',
          autor: 'Autor Teste',
          editora: 'Editora Teste',
          anoPublicacao: 2024,
          preco: -10.50,
          estoque: 10,
          isbn: '978-3-16-148410-0',
          categoria: 'ficcao',
        });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/preço|inválido|negativo/i);
    });

    it('[VALIDAÇÃO] deve rejeitar preço zero ao criar livro', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: 'Livro Teste',
          autor: 'Autor Teste',
          editora: 'Editora Teste',
          anoPublicacao: 2024,
          preco: 0,
          estoque: 10,
          isbn: '978-3-16-148410-1',
          categoria: 'ficcao',
        });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/preço|inválido|zero/i);
    });

    it('[VALIDAÇÃO] deve rejeitar preço com valor não numérico', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: 'Livro Teste',
          autor: 'Autor Teste',
          editora: 'Editora Teste',
          anoPublicacao: 2024,
          preco: 'abc',
          estoque: 10,
          isbn: '978-3-16-148410-2',
          categoria: 'ficcao',
        });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
    });

    it('[VALIDAÇÃO] deve aceitar preço válido ao criar livro', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: 'Livro Teste Válido',
          autor: 'Autor Teste',
          editora: 'Editora Teste',
          anoPublicacao: 2024,
          preco: 49.90,
          estoque: 10,
          isbn: '978-3-16-148410-3',
          categoria: 'ficcao',
        });

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
    });
  });

  describe('Validação de Estoque (Livros)', () => {
    it('[VALIDAÇÃO] deve rejeitar estoque negativo ao criar livro', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: 'Livro Teste',
          autor: 'Autor Teste',
          editora: 'Editora Teste',
          anoPublicacao: 2024,
          preco: 29.90,
          estoque: -5,
          isbn: '978-3-16-148410-4',
          categoria: 'ficcao',
        });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/estoque|inválido|negativo/i);
    });

    it('[VALIDAÇÃO] deve aceitar estoque zero ao criar livro', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: 'Livro Teste',
          autor: 'Autor Teste',
          editora: 'Editora Teste',
          anoPublicacao: 2024,
          preco: 29.90,
          estoque: 0,
          isbn: '978-3-16-148410-5',
          categoria: 'ficcao',
        });

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
    });

    it('[VALIDAÇÃO] deve aceitar estoque positivo ao criar livro', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      const res = await request(contexto.app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          titulo: 'Livro Teste',
          autor: 'Autor Teste',
          editora: 'Editora Teste',
          anoPublicacao: 2024,
          preco: 29.90,
          estoque: 100,
          isbn: '978-3-16-148410-6',
          categoria: 'ficcao',
        });

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
    });
  });

  describe('Validação de CPF (Clientes)', () => {
    it('[VALIDAÇÃO] deve rejeitar CPF inválido ao registrar cliente', async () => {
      const res = await registrarCliente(contexto.app, {
        cpf: '123.456.789-00', // CPF inválido
        email: 'cpf.invalido@teste.com',
        limparDados: true,
      });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/cpf|inválido/i);
    });

    it('[VALIDAÇÃO] deve rejeitar CPF com formato incorreto', async () => {
      const res = await registrarCliente(contexto.app, {
        cpf: '12345678900', // Sem formatação
        email: 'cpf.sem.formato@teste.com',
        limparDados: true,
      });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
    });

    it('[VALIDAÇÃO] deve aceitar CPF válido ao registrar cliente', async () => {
      const res = await registrarCliente(contexto.app, {
        cpf: '123.456.789-09', // CPF válido
        email: 'cpf.valido@teste.com',
        limparDados: true,
      });

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
    });
  });

  describe('Validação de Telefone (Clientes)', () => {
    it('[VALIDAÇÃO] deve rejeitar telefone inválido ao registrar cliente', async () => {
      const res = await registrarCliente(contexto.app, {
        telefone: {
          tipo: 'celular',
          ddd: '99',
          numero: '12345', // Número muito curto
        },
        email: 'tel.invalido@teste.com',
        limparDados: true,
      });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/telefone|inválido/i);
    });

    it('[VALIDAÇÃO] deve aceitar telefone válido ao registrar cliente', async () => {
      const res = await registrarCliente(contexto.app, {
        telefone: {
          tipo: 'celular',
          ddd: '11',
          numero: '987654321',
        },
        email: 'tel.valido@teste.com',
        limparDados: true,
      });

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
    });
  });

  describe('Validação de E-mail Duplicado', () => {
    it('[VALIDAÇÃO] deve rejeitar e-mail duplicado ao registrar cliente', async () => {
      const tokenMestre = await obterTokenAdmin(contexto.app);
      
      // Registrar primeiro cliente
      await registrarCliente(contexto.app, {
        email: 'cliente.teste@teste.com',
        cpf: '529.982.247-25',
        limparDados: true,
      });

      // Tentar registrar segundo cliente com mesmo e-mail
      const res = await registrarCliente(contexto.app, {
        email: 'cliente.teste@teste.com',
        cpf: '123.456.789-09',
      });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/e-mail|já cadastrado|duplicado/i);
    });

    it('[VALIDAÇÃO] deve rejeitar e-mail duplicado ao registrar admin', async () => {
      const tokenAdmin = await obterTokenAdmin(contexto.app);

      // Registrar primeiro admin
      await request(contexto.app)
        .post('/api/admin/registro')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nome: 'Admin Primeiro',
          cpf: '123.456.789-09',
          email: 'admin.duplicado@teste.com',
          senha: 'SenhaAdmin@123',
          confirmacaoSenha: 'SenhaAdmin@123',
        });

      // Tentar registrar segundo admin com mesmo e-mail
      const res = await request(contexto.app)
        .post('/api/admin/registro')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nome: 'Admin Duplicado',
          cpf: '529.982.247-25',
          email: 'admin.duplicado@teste.com',
          senha: 'SenhaAdmin@123',
          confirmacaoSenha: 'SenhaAdmin@123',
        });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/e-mail|já cadastrado|administrador/i);
    });
  });

  describe('Validação de Campos Obrigatórios', () => {
    it('[VALIDAÇÃO] deve rejeitar registro de cliente sem nome', async () => {
      const res = await request(contexto.app)
        .post('/api/clientes/registro')
        .send({
          cpf: '123.456.789-09',
          email: 'sem.nome@teste.com',
          senha: 'SenhaForte@123',
          confirmacaoSenha: 'SenhaForte@123',
        });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/campos obrigatórios|nome/i);
    });

    it('[VALIDAÇÃO] deve rejeitar registro de cliente sem e-mail', async () => {
      const res = await request(contexto.app)
        .post('/api/clientes/registro')
        .send({
          nome: 'Cliente Teste',
          cpf: '123.456.789-09',
          senha: 'SenhaForte@123',
          confirmacaoSenha: 'SenhaForte@123',
        });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/campos obrigatórios|e-mail/i);
    });

    it('[VALIDAÇÃO] deve rejeitar registro de cliente sem senha', async () => {
      const res = await request(contexto.app)
        .post('/api/clientes/registro')
        .send({
          nome: 'Cliente Teste',
          cpf: '123.456.789-09',
          email: 'sem.senha@teste.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/campos obrigatórios|senha/i);
    });
  });
});
