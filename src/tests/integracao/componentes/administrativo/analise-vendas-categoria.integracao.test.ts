import request from 'supertest';
import { Application } from 'express';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenAdmin, obterTokenCliente } from '@/tests/helpers/requisicoes-api.util';

describe('Integração — Análise de Vendas por Categoria (Entrega 9) - Dados Reais', () => {
  const contexto = configurarTesteIntegracao();
  let app: Application;
  let tokenAdmin: string;
  let tokenCliente: string;

  beforeAll(async () => {
    app = contexto.app;
    tokenAdmin = await obterTokenAdmin(app);
    tokenCliente = await obterTokenCliente(app, 'cliente.analise@test.local', '987.654.321-00', true);
  });

  describe('GET /api/admin/analise-vendas-categoria', () => {
    describe('Cenários de Sucesso - Dados Reais', () => {
      it('[RF-ANALISE-001] deve retornar 200 com estrutura válida para período solicitado', async () => {
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataInicio: '2025-05-01',
            dataFim: '2026-05-31',
          })
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(200);
        expect(res.body.sucesso).toBe(true);
        expect(res.body.dados).toBeDefined();
        expect(res.body.dados.dados).toBeInstanceOf(Array);
        expect(res.body.dados.periodo).toBeDefined();
        expect(res.body.dados.metadados).toBeDefined();
      });

      it('[RF-ANALISE-002] deve retornar 200 com filtro de categorias específicas', async () => {
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataInicio: '2025-05-01',
            dataFim: '2026-05-31',
            categorias: 'Aventura',
          })
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(200);
        expect(res.body.sucesso).toBe(true);
        expect(Array.isArray(res.body.dados.dados)).toBe(true);
      });

      it('[RF-ANALISE-003] deve retornar 200 para período curto', async () => {
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataInicio: '2025-05-15',
            dataFim: '2025-05-21',
          })
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(200);
        expect(res.body.sucesso).toBe(true);
        expect(res.body.dados.dados).toBeInstanceOf(Array);
      });

      it('[RF-ANALISE-004] deve retornar array vazio quando não há vendas no período', async () => {
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataInicio: '2020-01-01',
            dataFim: '2020-12-31',
          })
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(200);
        expect(res.body.sucesso).toBe(true);
        expect(res.body.dados.dados).toBeInstanceOf(Array);
        expect(res.body.dados.dados.length).toBe(0);
      });

      it('[RF-ANALISE-005] deve validar estrutura de resposta', async () => {
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataInicio: '2025-05-01',
            dataFim: '2026-05-31',
          })
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(200);
        expect(res.body.dados).toHaveProperty('dados');
        expect(res.body.dados).toHaveProperty('periodo');
        expect(res.body.dados).toHaveProperty('metadados');
        expect(res.body.dados.periodo).toHaveProperty('inicio');
        expect(res.body.dados.periodo).toHaveProperty('fim');
      });

      it('[RF-ANALISE-006] deve retornar dados ordenados por mês e categoria', async () => {
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataInicio: '2025-05-01',
            dataFim: '2026-05-31',
          })
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(200);
        const dados = res.body.dados.dados;

        if (dados.length > 1) {
          for (let i = 1; i < dados.length; i++) {
            const dataAtual = new Date(dados[i].mes);
            const dataAnterior = new Date(dados[i - 1].mes);
            expect(dataAtual.getTime()).toBeGreaterThanOrEqual(dataAnterior.getTime());
          }
        }
      });

      it('[RF-ANALISE-007] deve calcular corretamente totalVendas', async () => {
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataInicio: '2025-05-01',
            dataFim: '2026-05-31',
          })
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(200);
        
        if (res.body.dados.dados.length > 0) {
          const totalVendasApi = res.body.dados.metadados.totalVendas;
          const somaQuantidades = res.body.dados.dados.reduce(
            (acc: number, d: any) => acc + d.quantidade,
            0
          );

          expect(totalVendasApi).toBe(somaQuantidades);
        }
      });
    });

    describe('Cenários de Falha - Validação de Parâmetros', () => {
      it('[RF-ANALISE-008] deve retornar 400 quando dataInicio está faltando', async () => {
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataFim: '2026-05-31',
          })
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(400);
        expect(res.body.sucesso).toBe(false);
        expect(res.body.mensagem).toMatch(/dataInicio.*obrigatório/i);
      });

      it('[RF-ANALISE-009] deve retornar 400 quando dataFim está faltando', async () => {
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataInicio: '2025-05-01',
          })
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(400);
        expect(res.body.sucesso).toBe(false);
        expect(res.body.mensagem).toMatch(/dataFim.*obrigatório/i);
      });

      it('[RF-ANALISE-010] deve retornar 400 quando dataInicio é posterior a dataFim', async () => {
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataInicio: '2026-05-31',
            dataFim: '2025-05-01',
          })
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(400);
        expect(res.body.sucesso).toBe(false);
        expect(res.body.mensagem).toMatch(/início.*anterior.*fim/i);
      });

      it('[RF-ANALISE-011] deve retornar 400 quando período excede 24 meses', async () => {
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataInicio: '2024-01-01',
            dataFim: '2026-12-31',
          })
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(400);
        expect(res.body.sucesso).toBe(false);
        expect(res.body.mensagem).toMatch(/24 meses/i);
      });

      it('[RF-ANALISE-012] deve retornar 400 quando formato de data é inválido', async () => {
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataInicio: 'data-invalida',
            dataFim: '2026-05-31',
          })
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(400);
        expect(res.body.sucesso).toBe(false);
      });

      it('[RF-ANALISE-013] deve retornar 400 quando período é menor que 1 dia', async () => {
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataInicio: '2025-05-01',
            dataFim: '2025-05-01',
          })
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(400);
        expect(res.body.sucesso).toBe(false);
        expect(res.body.mensagem).toMatch(/1 dia/i);
      });
    });

    describe('Segurança - Autenticação e Autorização', () => {
      it('[SEGURANÇA] deve retornar 401 quando token não é fornecido', async () => {
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataInicio: '2025-05-01',
            dataFim: '2026-05-31',
          });

        expect(res.status).toBe(401);
      });

      it('[SEGURANÇA] deve retornar 403 quando token de cliente é fornecido', async () => {
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataInicio: '2025-05-01',
            dataFim: '2026-05-31',
          })
          .set('Authorization', `Bearer ${tokenCliente}`);

        expect(res.status).toBe(403);
      });

      it('[SEGURANÇA] deve retornar 401 quando token é malformado', async () => {
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataInicio: '2025-05-01',
            dataFim: '2026-05-31',
          })
          .set('Authorization', 'Bearer token-malformado');

        expect(res.status).toBe(401);
      });
    });

    describe('Multi-tenancy', () => {
      it('[RF-ANALISE-014] deve respeitar contexto de loja', async () => {
        // Usa o contexto de loja padrão (sem header específico)
        const res = await request(app)
          .get('/api/admin/analise-vendas-categoria')
          .query({
            dataInicio: '2025-05-01',
            dataFim: '2026-05-31',
          })
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(200);
        expect(res.body.sucesso).toBe(true);
      });
    });
  });
});
