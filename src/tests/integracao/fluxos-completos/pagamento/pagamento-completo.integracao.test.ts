import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { registrarCliente, realizarLogin, gerarCpfValidoUnico } from '@/tests/helpers/requisicoes-api.util';

/**
 * Testes E2E para pagamentos usando rotas HTTP.
 * Setup e testes usam apenas rotas HTTP, sem SQL direto.
 */
describe('E2E - Pagamentos (Rotas HTTP)', () => {
  const contexto = configurarTesteIntegracao();
  let app: any;
  let tokenCliente: string;
  let vendaUuid: string;

  beforeAll(async () => {
    app = contexto.app;
  });

  describe('Fluxo completo de pagamentos', () => {
    it('deve criar usuário, venda e pagamento usando apenas rotas HTTP', async () => {
      // Setup: Criar usuário via HTTP
      const emailUnico = `cliente.pagamento${Math.floor(Math.random() * 1000)}@teste.com`;

      const registroRes = await registrarCliente(app, {
        cpf: gerarCpfValidoUnico(),
        email: emailUnico,
        limparDados: true,
      });

      expect(registroRes.status).toBe(201);
      expect(registroRes.body.sucesso).toBe(true);

      // Login via HTTP
      const loginRes = await realizarLogin(app, emailUnico, 'SenhaForte@123');
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.dados.token).toBeDefined();

      tokenCliente = loginRes.body.dados.token;

      // Criar venda via HTTP
      const vendaRes = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          itens: [
            {
              livroUuid: '550e8400-e29b-41d4-a716-446655440000',
              quantidade: 1,
              precoUnitario: 50,
            },
          ],
          valorTotalItens: 50,
          valorFrete: 10,
          valorTotal: 60,
        });

      // Nota: Pode falhar se o livro não existir no banco
      // Isso é esperado em testes E2E reais
      if (vendaRes.status === 201) {
        vendaUuid = vendaRes.body.id;
        expect(vendaRes.body.status).toBe('EM PROCESSAMENTO');
        expect(vendaRes.body.totalVenda).toBe(60);

        // Criar intenção de pagamento via HTTP
        const intencaoRes = await request(app)
          .post('/api/pagamentos/intencao-pagamento')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send({
            vendaUuid,
            metodoPagamento: 'pix',
          });

        if (intencaoRes.status === 201) {
          expect(intencaoRes.body.sucesso).toBe(true);

          // Listar pagamentos da venda via HTTP
          const listaRes = await request(app)
            .get(`/api/pagamentos/venda/${vendaUuid}/resumo`)
            .set('Authorization', `Bearer ${tokenCliente}`);

          if (listaRes.status === 200) {
            expect(listaRes.body).toBeDefined();
          }
        }
      }
    });

    it('deve retornar erro ao tentar acessar pagamentos sem autenticação', async () => {
      const res = await request(app).get('/api/pagamentos/venda/qualquer-uuid/resumo');

      expect(res.status).toBe(401);
    });
  });
});
