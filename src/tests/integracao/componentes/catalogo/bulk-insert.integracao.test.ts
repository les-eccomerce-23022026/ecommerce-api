/* eslint-disable max-lines */
// Teste de integração com múltiplos cenários - arquivo aceita ser mais longo
import request from 'supertest';
import { Application } from 'express';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenAdmin, obterTokenCliente } from '@/tests/helpers/requisicoes-api.util';
import { payloadPedidoValido, LIVRO_UUID_TESTE } from '@/tests/helpers/pedido-venda.helper';
import { v4 as uuidv4 } from 'uuid';

describe('Integração — Bulk Insert de Livros', () => {
  const contexto = configurarTesteIntegracao();
  let app: Application;
  let tokenAdmin: string;

  beforeAll(async () => {
    app = contexto.app;
  });

  beforeEach(async () => {
    // Recarregar token admin antes de cada teste para evitar expiração
    tokenAdmin = await obterTokenAdmin(app);
  });

  describe('POST /api/admin/autores/lote', () => {
    it('cria múltiplos autores em lote', async () => {
      const autores = [
        { nome: 'Autor Teste 1', descricao: 'Descrição do autor teste 1' },
        { nome: 'Autor Teste 2', descricao: 'Descrição do autor teste 2' },
        { nome: 'Autor Teste 3', descricao: 'Descrição do autor teste 3' },
      ];

      const res = await request(app)
        .post('/api/admin/autores/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(autores);

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.ids).toBeDefined();
      expect(Array.isArray(res.body.dados.ids)).toBe(true);
      expect(res.body.dados.ids.length).toBe(3);
      expect(res.body.dados.quantidade).toBe(3);
    });

    it('retorna 401 sem autenticação', async () => {
      const res = await request(app)
        .post('/api/admin/autores/lote')
        .send([{ nome: 'Autor Teste' }]);

      expect(res.status).toBe(401);
    });

    it('retorna 403 para não admin', async () => {
      // Usar obterTokenCliente que cria o usuário corretamente com genero/dataNascimento
      const tokenCliente = await obterTokenCliente(app, `cliente-${uuidv4()}@teste.com`, '12345678901', true);

      const res = await request(app)
        .post('/api/admin/autores/lote')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send([{ nome: 'Autor Teste' }]);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/admin/editoras/lote', () => {
    it('cria múltiplas editoras em lote', async () => {
      const editoras = [
        { nome: 'Editora Teste 1', cnpj: '00.000.000/0001-91' },
        { nome: 'Editora Teste 2', cnpj: '00.000.000/0002-72' },
      ];

      const res = await request(app)
        .post('/api/admin/editoras/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(editoras);

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.ids).toBeDefined();
      expect(Array.isArray(res.body.dados.ids)).toBe(true);
      expect(res.body.dados.ids.length).toBe(2);
      expect(res.body.dados.quantidade).toBe(2);
    });

    it('retorna 401 sem autenticação', async () => {
      const res = await request(app)
        .post('/api/admin/editoras/lote')
        .send([{ nome: 'Editora Teste', cnpj: '00.000.000/0001-91' }]);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/admin/livros/lote', () => {
    it('cria múltiplos livros em lote com transação', async () => {
      // Primeiro, garantir que autor e editora existem
      await request(app)
        .post('/api/admin/autores/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send([{ nome: 'Autor Bulk Test', descricao: 'Autor para teste de bulk insert' }]);

      await request(app)
        .post('/api/admin/editoras/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send([{ nome: 'Editora Bulk Test', cnpj: '00.000.000/0003-53' }]);

      const livros = [
        {
          uuid: uuidv4(),
          titulo: 'Livro Bulk Test 1',
          isbn: '978-0-00-000001-1',
          sinopse: 'Sinopse do livro 1',
          imagemUrl: 'https://example.com/livro1.jpg',
          autorNome: 'Autor Bulk Test',
          editoraNome: 'Editora Bulk Test',
          grupoPrecificacaoNome: 'Varejo',
          categoriaNome: 'Tecnologia',
          ano: 2024,
          edicao: '1ª edição',
          numeroPaginas: 300,
          altura: 23.0,
          largura: 15.5,
          peso: 0.5,
          profundidade: 2.5,
          codigoBarras: '7890000000001',
          quantidadeEstoque: 10,
          precoVenda: 49.9,
          valorCusto: 29.94,
        },
        {
          uuid: uuidv4(),
          titulo: 'Livro Bulk Test 2',
          isbn: '978-0-00-000002-2',
          sinopse: 'Sinopse do livro 2',
          imagemUrl: 'https://example.com/livro2.jpg',
          autorNome: 'Autor Bulk Test',
          editoraNome: 'Editora Bulk Test',
          grupoPrecificacaoNome: 'Varejo',
          categoriaNome: 'Tecnologia',
          ano: 2024,
          edicao: '1ª edição',
          numeroPaginas: 250,
          altura: 23.0,
          largura: 15.5,
          peso: 0.45,
          profundidade: 2.3,
          codigoBarras: '7890000000002',
          quantidadeEstoque: 15,
          precoVenda: 59.9,
          valorCusto: 35.94,
        },
      ];

      const res = await request(app)
        .post('/api/admin/livros/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(livros);

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.livros).toBeDefined();
      expect(Array.isArray(res.body.dados.livros)).toBe(true);
      expect(res.body.dados.livros.length).toBe(2);
      expect(res.body.dados.quantidade).toBe(2);

      // Verificar se os livros foram criados com estoque
      expect(res.body.dados.livros[0].estoque).toBe(10);
      expect(parseFloat(res.body.dados.livros[0].preco)).toBe(49.9);
      expect(res.body.dados.livros[1].estoque).toBe(15);
      expect(parseFloat(res.body.dados.livros[1].preco)).toBe(59.9);
    });

    it('falha se autor não existe', async () => {
      const livros = [
        {
          uuid: uuidv4(),
          titulo: 'Livro Teste',
          isbn: '978-0-00-000003-3',
          autorNome: 'Autor Inexistente',
          editoraNome: 'HarperCollins',
          grupoPrecificacaoNome: 'Varejo',
          categoriaNome: 'Fantasia',
          ano: 2024,
          edicao: '1ª edição',
          numeroPaginas: 300,
          altura: 23.0,
          largura: 15.5,
          peso: 0.5,
          profundidade: 2.5,
          codigoBarras: '7890000000003',
          quantidadeEstoque: 10,
          precoVenda: 49.9,
          valorCusto: 29.94,
        },
      ];

      const res = await request(app)
        .post('/api/admin/livros/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(livros);

      expect(res.status).toBe(500);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toContain('Autor "Autor Inexistente" não encontrado');
    });

    it('retorna 401 sem autenticação', async () => {
      const res = await request(app)
        .post('/api/admin/livros/lote')
        .send([]);

      expect(res.status).toBe(401);
    });

    it('retorna 403 para não admin', async () => {
      const tokenCliente = await obterTokenCliente(app, `cliente-${uuidv4()}@teste.com`, '12345678901', true);

      const res = await request(app)
        .post('/api/admin/livros/lote')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send([]);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/admin/livros (individual)', () => {
    it('cria livro individual com transação', async () => {
      // Garantir que autor e editora existem
      await request(app)
        .post('/api/admin/autores/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send([{ nome: 'Autor Individual Test', descricao: 'Autor para teste individual' }]);

      await request(app)
        .post('/api/admin/editoras/lote')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send([{ nome: 'HarperCollins', cnpj: '00.000.000/0005-44' }]);

      const livro = {
        uuid: uuidv4(),
        titulo: 'Livro Individual Test',
        isbn: '978-0-00-000004-4',
        sinopse: 'Sinopse do livro individual',
        imagemUrl: 'https://example.com/livro-individual.jpg',
        autorNome: 'Autor Individual Test',
        editoraNome: 'HarperCollins',
        grupoPrecificacaoNome: 'Varejo',
        categoriaNome: 'Fantasia',
        ano: 2024,
        edicao: '1ª edição',
        numeroPaginas: 350,
        altura: 23.0,
        largura: 16.0,
        peso: 0.6,
        profundidade: 3.0,
        codigoBarras: '7890000000004',
        quantidadeEstoque: 20,
        precoVenda: 69.9,
        valorCusto: 41.94,
      };

      const res = await request(app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(livro);

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.uuid).toBe(livro.uuid);
      expect(res.body.dados.titulo).toBe(livro.titulo);
      expect(res.body.dados.estoque).toBe(20);
      expect(parseFloat(res.body.dados.preco)).toBe(69.9);

      // Verificar se o livro pode ser recuperado
      const resGet = await request(app)
        .get(`/api/livros/${livro.uuid}`);

      expect(resGet.status).toBe(200);
      expect(resGet.body.uuid).toBe(livro.uuid);
    });

    it('falha se editora não existe', async () => {
      const livro = {
        uuid: uuidv4(),
        titulo: 'Livro Teste',
        isbn: '978-0-00-000005-5',
        autorNome: 'Robert C. Martin',
        editoraNome: 'Editora Inexistente',
        grupoPrecificacaoNome: 'Varejo',
        categoriaNome: 'Tecnologia',
        ano: 2024,
        edicao: '1ª edição',
        numeroPaginas: 300,
        altura: 23.0,
        largura: 15.5,
        peso: 0.5,
        profundidade: 2.5,
        codigoBarras: '7890000000005',
        quantidadeEstoque: 10,
        precoVenda: 49.9,
        valorCusto: 29.94,
      };

      const res = await request(app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(livro);

      expect(res.status).toBe(500);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toContain('Editora "Editora Inexistente" não encontrada');
    });
  });

  describe('PATCH /api/admin/pedidos/:uuid/despachar', () => {
    it('despacha pedido usando PATCH (alterado de PUT)', async () => {
      const tokenCliente = await obterTokenCliente(app, `cliente-despacho-${uuidv4()}@teste.com`, undefined, true);

      const resVenda = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payloadPedidoValido(LIVRO_UUID_TESTE, { precoUnitario: 50, quantidade: 1, valorFrete: 10 }));

      expect(resVenda.status).toBe(201);
      const vendaUuid = resVenda.body.id as string;

      const resDespacho = await request(app)
        .patch(`/api/admin/pedidos/${vendaUuid}/despachar`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(resDespacho.status).toBe(200);
      expect(resDespacho.body.status).toMatch(/em trânsito/i);
    });
  });

  describe('PATCH /api/admin/pedidos/:uuid/entrega', () => {
    it('confirma entrega usando PATCH (alterado de PUT)', async () => {
      const tokenCliente = await obterTokenCliente(app, `cliente-entrega-${uuidv4()}@teste.com`, undefined, true);

      const resVenda = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payloadPedidoValido(LIVRO_UUID_TESTE, { precoUnitario: 30, quantidade: 1, valorFrete: 5 }));

      expect(resVenda.status).toBe(201);
      const vendaUuid = resVenda.body.id as string;

      await request(app)
        .patch(`/api/admin/pedidos/${vendaUuid}/despachar`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      const resEntrega = await request(app)
        .patch(`/api/admin/pedidos/${vendaUuid}/entrega`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(resEntrega.status).toBe(200);
      expect(resEntrega.body.status).toMatch(/entregue/i);
    });
  });
});
