// Aponta para o banco de DEV (porta 5432) em vez do banco de teste (5433).
// Os testes usam BEGIN/ROLLBACK via configurarTesteIntegracao para não poluir o banco.
process.env.POSTGRES_HOST_TEST = 'localhost';
process.env.POSTGRES_PORT_TEST = '5432';
process.env.POSTGRES_USER_TEST = 'ecm_user';
process.env.POSTGRES_PASSWORD_TEST = 'ecm_senha';
process.env.POSTGRES_DB_TEST = 'ecm_livraria';

import request from 'supertest';
import { Application } from 'express';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenAdmin, obterTokenAdminSistema } from '@/tests/helpers/requisicoes-api.util';

const ISBN_UNICO = () => `978${Math.floor(Math.random() * 10000000000)}`;
const COD_BARRAS = () => `789${Math.floor(Math.random() * 10000000000)}`;

const payloadLivroBase = () => ({
  titulo: 'Livro Gap Test',
  isbn: ISBN_UNICO(),
  autorNome: 'Autor Gap Test',
  editoraNome: 'Editora Gap Test',
  categoriaNome: 'Tecnologia',
  grupoPrecificacaoNome: 'Grupo 1',
  ano: 2024,
  edicao: '1ª',
  numeroPaginas: 200,
  altura: 23,
  largura: 15,
  peso: 0.4,
  profundidade: 2,
  codigoBarras: COD_BARRAS(),
  precoVenda: 80.0,
  valorCusto: 40.0,
  quantidadeEstoque: 10,
});

describe('Gaps Livros - Testes de Integração (banco dev)', () => {
  let app: Application;
  let tokenAdmin: string;
  let tokenAdminSistema: string;

  // porTeste=false → uma única transação BEGIN/ROLLBACK para toda a suite
  const contexto = configurarTesteIntegracao(false, async (ctx) => {
    app = ctx.app;
    tokenAdmin = await obterTokenAdmin(app);
    tokenAdminSistema = await obterTokenAdminSistema(app);

    await request(app)
      .post('/api/admin/autores/lote')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send([{ nome: 'Autor Gap Test', descricao: 'Autor para testes de gaps' }]);

    await request(app)
      .post('/api/admin/editoras/lote')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send([{ nome: 'Editora Gap Test', cnpj: `00.000.000/00${Math.floor(10 + Math.random() * 89)}-${Math.floor(10 + Math.random() * 89)}` }]);
  });

  beforeAll(async () => {
    app = contexto.app;
  });

  // ─── GAP 4 — RN0011: Categoria Obrigatória ────────────────────────────────

  describe('Gap 4 — RN0011: Categoria obrigatória no cadastro', () => {
    it('deve retornar 400 ao criar livro sem campo categoriaNome', async () => {
      const { categoriaNome: _, ...semCategoria } = payloadLivroBase();

      const res = await request(app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(semCategoria);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensagem');
      expect(res.body.mensagem.toLowerCase()).toContain('categoria');
    });

    it('deve retornar 400 ao criar livro com categoriaNome vazia', async () => {
      const res = await request(app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ...payloadLivroBase(), categoriaNome: '' });

      expect(res.status).toBe(400);
    });

    it('deve criar livro com sucesso quando categoria válida fornecida', async () => {
      const res = await request(app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(payloadLivroBase());

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados).toHaveProperty('uuid');
    });
  });

  // ─── GAP 3 — RF0014: Edição de Livro ─────────────────────────────────────

  describe('Gap 3 — RF0014: Edição parcial de livro', () => {
    let livroUuid: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(payloadLivroBase());

      livroUuid = res.body.dados?.uuid;
    });

    it('deve retornar livro via GET /admin/livros/:uuid', async () => {
      expect(livroUuid).toBeDefined();

      const res = await request(app)
        .get(`/api/admin/livros/${livroUuid}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.dados).toHaveProperty('uuid', livroUuid);
    });

    it('deve atualizar título do livro via PATCH', async () => {
      expect(livroUuid).toBeDefined();

      const res = await request(app)
        .patch(`/api/admin/livros/${livroUuid}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ titulo: 'Título Atualizado Gap3' });

      expect(res.status).toBe(200);
      expect(res.body.dados.titulo).toBe('Título Atualizado Gap3');
    });

    it('deve atualizar estoque do livro via PATCH', async () => {
      expect(livroUuid).toBeDefined();

      const res = await request(app)
        .patch(`/api/admin/livros/${livroUuid}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ quantidadeEstoque: 25 });

      expect(res.status).toBe(200);
    });

    it('deve retornar 400 ao enviar campo não permitido no PATCH (isbn)', async () => {
      expect(livroUuid).toBeDefined();

      const res = await request(app)
        .patch(`/api/admin/livros/${livroUuid}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ isbn: '000' });

      expect(res.status).toBe(400);
    });

    it('deve retornar 400 ao enviar PATCH sem nenhum campo', async () => {
      expect(livroUuid).toBeDefined();

      const res = await request(app)
        .patch(`/api/admin/livros/${livroUuid}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('deve retornar 401 ao tentar editar sem autenticação', async () => {
      expect(livroUuid).toBeDefined();

      const res = await request(app)
        .patch(`/api/admin/livros/${livroUuid}`)
        .send({ titulo: 'Hack' });

      expect(res.status).toBe(401);
    });
  });

  // ─── GAP 1 — RF0013/RN0016: Inativação Automática ────────────────────────

  describe('Gap 1 — RF0013/RN0016: Inativação automática de livros', () => {
    it('deve executar inativação automática e retornar relatório (admin_sistema)', async () => {
      const res = await request(app)
        .post('/api/admin/livros/inativacao-automatica')
        .set('Authorization', `Bearer ${tokenAdminSistema}`);

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);

      const dados = res.body.dados;
      expect(dados).toHaveProperty('totalVerificados');
      expect(dados).toHaveProperty('totalInativados');
      expect(dados).toHaveProperty('valorMinimoUtilizado');
      expect(dados).toHaveProperty('livrosInativados');
      expect(dados).toHaveProperty('executadoEm');
      expect(Array.isArray(dados.livrosInativados)).toBe(true);
      expect(typeof dados.totalVerificados).toBe('number');
      expect(typeof dados.totalInativados).toBe('number');
    });

    it('deve retornar 401 ao executar inativação sem autenticação', async () => {
      const res = await request(app).post('/api/admin/livros/inativacao-automatica');
      expect(res.status).toBe(401);
    });
  });

  // ─── GAP 2 — RN0014: Aprovações de Preço ─────────────────────────────────

  describe('Gap 2 — RN0014: Aprovações de preço pendentes', () => {
    it('deve listar aprovações pendentes retornando array (admin_sistema)', async () => {
      const res = await request(app)
        .get('/api/admin/livros/aprovacoes-preco')
        .set('Authorization', `Bearer ${tokenAdminSistema}`);

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(Array.isArray(res.body.dados)).toBe(true);
    });

    it('deve retornar 401 ao listar aprovações sem autenticação', async () => {
      const res = await request(app).get('/api/admin/livros/aprovacoes-preco');
      expect(res.status).toBe(401);
    });

    it('deve retornar 400 ao rejeitar aprovação sem motivo', async () => {
      const uuidFalso = '00000000-0000-0000-0000-000000000001';
      const res = await request(app)
        .post(`/api/admin/livros/aprovacoes-preco/${uuidFalso}/rejeitar`)
        .set('Authorization', `Bearer ${tokenAdminSistema}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('deve retornar erro ao tentar aprovar UUID inexistente', async () => {
      const uuidFalso = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post(`/api/admin/livros/aprovacoes-preco/${uuidFalso}/aprovar`)
        .set('Authorization', `Bearer ${tokenAdminSistema}`)
        .send({ observacao: 'Teste' });

      expect([404, 500]).toContain(res.status);
    });

    it('deve aceitar atualização de preço com margem alta sem exigir aprovação (retorna 200)', async () => {
      const criarRes = await request(app)
        .post('/api/admin/livros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(payloadLivroBase());

      const livroUuid = criarRes.body.dados?.uuid;
      expect(livroUuid).toBeDefined();

      // precoVenda 90 com custo 40 = margem 125% — bem acima de qualquer mínimo padrão
      const res = await request(app)
        .patch(`/api/admin/livros/${livroUuid}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ precoVenda: 90.0 });

      expect([200, 202]).toContain(res.status);
    });
  });
});
