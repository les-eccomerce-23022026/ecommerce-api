import request from 'supertest';
import { Application } from 'express';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { realizarLogin } from '@/tests/helpers/requisicoes-api.util';

describe('Integração — KPIs de Estoque', () => {
  const contexto = configurarTesteIntegracao();
  let app: Application;
  let tokenAdmin: string;

  beforeAll(async () => {
    app = contexto.app;
    const resLogin = await realizarLogin(app, 'admin@livraria.com.br', 'Admin@123');
    tokenAdmin = resLogin.body.dados.token as string;
  });

  describe('GET /api/admin/estoque/kpis', () => {
    it('retorna KPIs de estoque com limite padrão (5)', async () => {
      const res = await request(app)
        .get('/api/admin/estoque/kpis')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados).toBeDefined();
      expect(res.body.dados).toHaveProperty('totalLivros');
      expect(res.body.dados).toHaveProperty('abaixoLimite');
      expect(res.body.dados).toHaveProperty('estoqueCriticoLimite');
      expect(res.body.dados).toHaveProperty('valorTotalEstoque');
      expect(res.body.dados).toHaveProperty('valorTotalCusto');
      expect(res.body.dados).toHaveProperty('quantidadeTotalReservada');
      expect(res.body.dados).toHaveProperty('quantidadeTotalDisponivel');
      expect(res.body.dados.estoqueCriticoLimite).toBe(5);
      expect(typeof res.body.dados.totalLivros).toBe('number');
      expect(typeof res.body.dados.abaixoLimite).toBe('number');
      expect(typeof res.body.dados.valorTotalEstoque).toBe('number');
      expect(typeof res.body.dados.valorTotalCusto).toBe('number');
    });

    it('retorna KPIs de estoque com limite customizado', async () => {
      const res = await request(app)
        .get('/api/admin/estoque/kpis?limite=10')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.estoqueCriticoLimite).toBe(10);
    });

    it('retorna 401 sem autenticação', async () => {
      const res = await request(app)
        .get('/api/admin/estoque/kpis');

      expect(res.status).toBe(401);
    });

    it('trata limite inválido usando valor padrão', async () => {
      const res = await request(app)
        .get('/api/admin/estoque/kpis?limite=invalido')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      // Se parseInt falhar, deve usar o padrão (5)
      expect(res.body.dados.estoqueCriticoLimite).toBe(5);
    });
  });
});
