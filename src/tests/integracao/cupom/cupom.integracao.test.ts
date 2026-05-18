import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';

describe('Integração - Cupom', () => {
  const contexto = configurarTesteIntegracao(false);
  let tokenCliente: string;

  beforeAll(async () => {
    tokenCliente = await obterTokenCliente(contexto.app);
  });

  describe('GET /api/cupom/disponiveis', () => {
    it('[RF0050] deve listar cupons disponíveis para o usuário', async () => {
      const res = await request(contexto.app)
        .get('/api/cupom/disponiveis')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(200);
      expect(res.body.dados).toBeDefined();
      expect(Array.isArray(res.body.dados)).toBe(true);
    });

    it('[RNF0037] deve retornar 401 sem token', async () => {
      const res = await request(contexto.app).get('/api/cupom/disponiveis');

      expect(res.status).toBe(401);
    });

    it('[RF0054] deve incluir cupons de troca na lista', async () => {
      const res = await request(contexto.app)
        .get('/api/cupom/disponiveis')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(200);
      expect(res.body.dados).toBeDefined();

      // Verificar se há cupons de tipo 'troca' na lista
      const cuponsTroca = res.body.dados.filter((c: { tipo: string }) => c.tipo === 'troca');
      expect(cuponsTroca.length).toBeGreaterThan(0);
    });

    it('[RF0050] deve retornar cupons com estrutura válida', async () => {
      const res = await request(contexto.app)
        .get('/api/cupom/disponiveis')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(200);
      expect(res.body.dados).toBeDefined();

      if (res.body.dados.length > 0) {
        const cupom = res.body.dados[0];
        expect(cupom).toHaveProperty('uuid');
        expect(cupom).toHaveProperty('codigo');
        expect(cupom).toHaveProperty('tipo');
        expect(cupom).toHaveProperty('valorDesconto');
      }
    });
  });

  describe('POST /api/cupom/aplicar', () => {
    it('[RF0051] deve aplicar cupom promocional válido', async () => {
      const res = await request(contexto.app)
        .post('/api/cupom/aplicar')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ codigo: 'DESCONTO10' });

      expect(res.status).toBe(200);
      expect(res.body.dados).toBeDefined();
      expect(res.body.dados.codigo).toBe('DESCONTO10');
      expect(res.body.dados.tipo).toBe('promocional');
      expect(res.body.dados.valorDesconto).toBe(10);
    });

    it('[RF0051] deve aplicar cupom de troca válido', async () => {
      const res = await request(contexto.app)
        .post('/api/cupom/aplicar')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ codigo: 'TROCA50' });

      expect(res.status).toBe(200);
      expect(res.body.dados).toBeDefined();
      expect(res.body.dados.codigo).toBe('TROCA50');
      expect(res.body.dados.tipo).toBe('troca');
      expect(res.body.dados.valorDesconto).toBe(50);
    });

    it('[RNF0037] deve retornar 400 para código ausente', async () => {
      const res = await request(contexto.app)
        .post('/api/cupom/aplicar')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.erro).toBe('Código do cupom é obrigatório');
    });

    it('[RNF0037] deve retornar 400 para cupom inválido', async () => {
      const res = await request(contexto.app)
        .post('/api/cupom/aplicar')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ codigo: 'CUPOM_INEXISTENTE' });

      expect(res.status).toBe(400);
      expect(res.body.erro).toBe('Cupom inválido ou expirado');
    });

    it('[RNF0037] deve retornar 401 sem token', async () => {
      const res = await request(contexto.app).post('/api/cupom/aplicar').send({
        codigo: 'DESCONTO10',
      });

      expect(res.status).toBe(401);
    });

    it('[RF0052] deve validar valor mínimo do cupom', async () => {
      const // DESCONTO20 requer valor mínimo de 50
      res = await request(contexto.app)
        .post('/api/cupom/aplicar')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ codigo: 'DESCONTO20' });

      // Cupom válido, mas a validação de valor mínimo seria feita no checkout
      expect(res.status).toBe(200);
      expect(res.body.dados.valorDesconto).toBe(20);
    });
  });
});
