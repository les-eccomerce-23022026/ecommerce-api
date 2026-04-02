import request from 'supertest';
import { Application } from 'express';
import type { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';
import {
  garantirTabelaCarrinhoItens,
  garantirLivroComEstoqueParaCarrinho,
  garantirExtensaoUnaccentNoBancoDeTeste,
} from '@/tests/helpers/carrinho-integracao.helper';

/**
 * Carrinho persistido (cliente autenticado): GET /carrinho, POST /carrinho/itens, DELETE /carrinho.
 * A suíte cria a tabela `carrinho_itens` e, se necessário, um livro com estoque na mesma transação
 * (revertida ao fim de cada teste), para funcionar mesmo sem seed de catálogo.
 */
describe('Integração — Carrinho', () => {
  const contexto = configurarTesteIntegracao();
  let app: Application;
  let tokenCliente: string;

  beforeAll(async () => {
    app = contexto.app;
    await garantirExtensaoUnaccentNoBancoDeTeste();
    tokenCliente = await obterTokenCliente(app);
  });

  beforeEach(async () => {
    const db = contexto.db as IConexaoBanco | undefined;
    if (!db) {
      throw new Error('Conexão de banco não disponível (isolamento de integração).');
    }
    await garantirTabelaCarrinhoItens(db);
  });

  describe('GET /api/carrinho', () => {
    it('retorna carrinho vazio e resumo zerado quando não há itens', async () => {
      const res = await request(app)
        .get('/api/carrinho')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(200);
      expect(res.body.itens).toEqual([]);
      expect(res.body.resumo).toMatchObject({ subtotal: 0, frete: 0, total: 0 });
      expect(res.body.fretePadrao).toMatchObject({
        valor: 15,
        prazo: expect.any(String),
      });
    });

    it('retorna 401 sem token', async () => {
      const res = await request(app).get('/api/carrinho');

      expect(res.status).toBe(401);
    });
  });

  describe('mutações com livro no catálogo', () => {
    let livroUuid: string;
    let estoqueDisponivel: number;

    beforeEach(async () => {
      const db = contexto.db as IConexaoBanco;
      const { livUuid, estoque } = await garantirLivroComEstoqueParaCarrinho(db);
      livroUuid = livUuid;
      estoqueDisponivel = estoque;
    });

    describe('POST /api/carrinho/itens', () => {
      it('adiciona item e retorna totais coerentes', async () => {
        const res = await request(app)
          .post('/api/carrinho/itens')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({ livroUuid, quantidade: 1 });

        expect(res.status).toBe(200);
        expect(res.body.itens).toHaveLength(1);
        expect(res.body.itens[0].uuid).toBe(livroUuid);
        expect(res.body.itens[0].quantidade).toBe(1);
        expect(res.body.resumo.frete).toBe(15);
        expect(res.body.resumo.total).toBe(res.body.resumo.subtotal + res.body.resumo.frete);
      });

      it('atualiza quantidade ao enviar novo total', async () => {
        await request(app)
          .post('/api/carrinho/itens')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({ livroUuid, quantidade: 1 });

        const res = await request(app)
          .post('/api/carrinho/itens')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({ livroUuid, quantidade: 3 });

        expect(res.status).toBe(200);
        expect(res.body.itens[0].quantidade).toBe(3);
      });

      it('remove item com quantidade 0', async () => {
        await request(app)
          .post('/api/carrinho/itens')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({ livroUuid, quantidade: 2 });

        const res = await request(app)
          .post('/api/carrinho/itens')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({ livroUuid, quantidade: 0 });

        expect(res.status).toBe(200);
        expect(res.body.itens).toHaveLength(0);
        expect(res.body.resumo).toMatchObject({ subtotal: 0, frete: 0, total: 0 });
      });

      it('retorna 400 para livro inexistente', async () => {
        const res = await request(app)
          .post('/api/carrinho/itens')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({ livroUuid: '00000000-0000-0000-0000-00000000beef', quantidade: 1 });

        expect(res.status).toBe(400);
        expect(String(res.body.erro)).toMatch(/não encontrado|Livro/i);
      });

      it('retorna 400 quando quantidade excede estoque', async () => {
        const res = await request(app)
          .post('/api/carrinho/itens')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({ livroUuid, quantidade: estoqueDisponivel + 99999 });

        expect(res.status).toBe(400);
        expect(String(res.body.erro)).toMatch(/estoque|superior|disponível/i);
      });

      it('retorna 400 quando livroUuid é omitido', async () => {
        const res = await request(app)
          .post('/api/carrinho/itens')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({ quantidade: 1 });

        expect(res.status).toBe(400);
      });

      it('retorna 401 sem token', async () => {
        const res = await request(app)
          .post('/api/carrinho/itens')
          .send({ livroUuid, quantidade: 1 });

        expect(res.status).toBe(401);
      });
    });

    describe('DELETE /api/carrinho', () => {
      it('limpa o carrinho', async () => {
        await request(app)
          .post('/api/carrinho/itens')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({ livroUuid, quantidade: 1 });

        const res = await request(app)
          .delete('/api/carrinho')
          .set('Authorization', `Bearer ${tokenCliente}`);

        expect(res.status).toBe(200);
        expect(res.body.itens).toEqual([]);
        expect(res.body.resumo).toMatchObject({ subtotal: 0, frete: 0, total: 0 });
      });

      it('retorna 401 sem token', async () => {
        const res = await request(app).delete('/api/carrinho');

        expect(res.status).toBe(401);
      });
    });
  });
});
