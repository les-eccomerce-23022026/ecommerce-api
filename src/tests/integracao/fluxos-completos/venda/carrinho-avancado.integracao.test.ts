import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenCliente, obterTokenAdmin, registrarIntencao } from '@/tests/helpers/requisicoes-api.util';
import { 
  gerarPayloadLivroEspecifico,
  gerarPayloadCarrinhoVariado,
  gerarPayloadCarrinhoPremium,
  gerarPayloadPagamentoMultiplosVariado,
  LIVROS_TESTE,
  LivroTesteKey,
  validarConsistenciaPrecosMultiplos,
  gerarCombinacoesCarrinho
} from '@/tests/helpers/precos-catalogo-v2.helper';

describe('Integração - Carrinho Avançado (Múltiplos Livros)', () => {
  const contexto = configurarTesteIntegracao();
  let tokenCliente: string;
  let tokenAdmin: string;

  beforeAll(async () => {
    tokenCliente = await obterTokenCliente(contexto.app);
    tokenAdmin = await obterTokenAdmin(contexto.app);
  });

  beforeEach(async () => {
    // Validar consistência de múltiplos preços
    const livrosUuids = Object.values(LIVROS_TESTE).map(livro => livro.uuid);
    await validarConsistenciaPrecosMultiplos(contexto.db!, livrosUuids);
  });

  describe('Cenários Simples de Múltiplos Livros', () => {
    it('[RF0001] deve criar venda com dois livros diferentes', async () => {
      // Arrange
      const payload = await gerarPayloadCarrinhoVariado(contexto.db!, {
        valorFrete: 12
      });

      // Act
      const res = await request(contexto.app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payload);

      // Assert
      expect(res.status).toBe(201);
      expect(res.body.itens).toHaveLength(3); // Senhor dos Anéis + 2x Dom Casmurro + Duna
      expect(res.body.valorTotalItens).toBe(189.70); // 79.90 + 2*29.90 + 79.90
      expect(res.body.valorTotal).toBe(201.70); // 189.70 + 12 frete
    });

    it('[RF0001] deve processar pagamento com 3 cartões para carrinho variado', async () => {
      // Arrange
      const { vendaPayload, pagamentoPayload } = await gerarPayloadPagamentoMultiplosVariado(
        contexto.db!,
        [
          { livroUuid: LIVROS_TESTE.SENHOR_ANEIS.uuid, quantidade: 1 },
          { livroUuid: LIVROS_TESTE.DOM_CASMURRO.uuid, quantidade: 2 }
        ],
        { numeroCartoes: 3 }
      );

      // Criar venda
      const vendaRes = await request(contexto.app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(vendaPayload);

      const vendaUuid = vendaRes.body.id;
      const intencao = await registrarIntencao(contexto.app, tokenCliente, vendaPayload.valorTotal);

      // Act
      const res = await request(contexto.app)
        .post('/api/pagamento/processar')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          vendaUuid,
          valorTotal: vendaPayload.valorTotal,
          idIntencao: intencao.idIntencao,
          segredoConfirmacao: intencao.segredoConfirmacao,
          pagamentosCartao: pagamentoPayload.pagamentosCartao,
        });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.pagamentos).toHaveLength(3);
    });
  });

  describe('Cenários Premium e Valores Elevados', () => {
    it('[RF0001] deve criar venda premium com livros caros', async () => {
      // Arrange
      const payload = await gerarPayloadCarrinhoPremium(contexto.db!);

      // Act
      const res = await request(contexto.app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payload);

      // Assert
      expect(res.status).toBe(201);
      expect(res.body.itens).toHaveLength(3);
      expect(res.body.valorTotalItens).toBe(219.70); // 79.90 + 79.90 + 59.90
      expect(res.body.valorTotal).toBe(234.70); // 219.70 + 15 frete
    });

    it('[RF0001] deve processar pagamento com distribuição variada', async () => {
      // Arrange
      const { vendaPayload, pagamentoPayload } = await gerarPayloadPagamentoMultiplosVariado(
        contexto.db!,
        [
          { livroUuid: LIVROS_TESTE.SILMARILLION.uuid, quantidade: 1 },
          { livroUuid: LIVROS_TESTE.O_HOBBIT.uuid, quantidade: 1 }
        ],
        { distribuicaoCartoes: [60, 40] } // 60% no primeiro, 40% no segundo
      );

      // Criar venda
      const vendaRes = await request(contexto.app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(vendaPayload);

      const vendaUuid = vendaRes.body.id;
      const intencao = await registrarIntencao(contexto.app, tokenCliente, vendaPayload.valorTotal);

      // Act
      const res = await request(contexto.app)
        .post('/api/pagamento/processar')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          vendaUuid,
          valorTotal: vendaPayload.valorTotal,
          idIntencao: intencao.idIntencao,
          segredoConfirmacao: intencao.segredoConfirmacao,
          pagamentosCartao: pagamentoPayload.pagamentosCartao,
        });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.pagamentos).toHaveLength(2);
      
      // Verificar distribuição (109.70 * 0.6 = 65.82, 109.70 * 0.4 = 43.88)
      expect(pagamentoPayload.pagamentosCartao[0].valor).toBe(65.82);
      expect(pagamentoPayload.pagamentosCartao[1].valor).toBe(43.88);
    });
  });

  describe('Cenários com Cupons e Descontos', () => {
    it('[RF0001] deve aplicar cupom de troca em carrinho múltiplo', async () => {
      // Arrange
      const payload = await gerarPayloadCarrinhoVariado(contexto.db!, {
        valorFrete: 10,
        cuponsAplicados: [
          {
            uuid: 'cupom-troca-123',
            codigo: 'TROCA-TESTE',
            tipo: 'troca',
            valor: 50.00
          }
        ]
      });

      // Act
      const res = await request(contexto.app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payload);

      // Assert
      expect(res.status).toBe(201);
      expect(res.body.valorTotalItens).toBe(189.70);
      expect(res.body.valorFrete).toBe(10);
      expect(res.body.cuponsAplicados).toHaveLength(1);
      expect(res.body.cuponsAplicados[0].valor).toBe(50.00);
      expect(res.body.valorTotal).toBe(149.70); // 189.70 + 10 - 50
    });

    it('[RF0001] deve processar pagamento com cupom e múltiplos cartões', async () => {
      // Arrange
      const { vendaPayload, pagamentoPayload } = await gerarPayloadPagamentoMultiplosVariado(
        contexto.db!,
        [
          { livroUuid: LIVROS_TESTE.DUNA.uuid, quantidade: 1 },
          { livroUuid: LIVROS_TESTE.MIL_NOVECENTOS_E_QUATRO.uuid, quantidade: 1 }
        ],
        {
          valorFrete: 8,
          cuponsAplicados: [
            { uuid: 'cupom-123', codigo: 'PROMO-10', tipo: 'promocional', valor: 20.00 }
          ],
          numeroCartoes: 2
        }
      );

      // Criar venda
      const vendaRes = await request(contexto.app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(vendaPayload);

      const vendaUuid = vendaRes.body.id;
      const intencao = await registrarIntencao(contexto.app, tokenCliente, vendaPayload.valorTotal);

      // Act
      const res = await request(contexto.app)
        .post('/api/pagamento/processar')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          vendaUuid,
          valorTotal: vendaPayload.valorTotal,
          idIntencao: intencao.idIntencao,
          segredoConfirmacao: intencao.segredoConfirmacao,
          pagamentosCartao: pagamentoPayload.pagamentosCartao,
          cuponsAplicados: vendaPayload.cuponsAplicados,
        });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.pagamentos).toHaveLength(2);
    });
  });

  describe('Testes de Livros Específicos', () => {
    const livrosParaTestar: LivroTesteKey[] = [
      'DOM_CASMURRO',
      'MIL_NOVECENTOS_E_QUATRO',
      'O_HOBBIT',
      'SILMARILLION',
      'REVOLUCAO_BICHOS'
    ];

    livrosParaTestar.forEach(livroKey => {
      it(`[RF0001] deve criar venda com livro específico: ${livroKey}`, async () => {
        // Arrange
        const livro = LIVROS_TESTE[livroKey];
        const payload = await gerarPayloadLivroEspecifico(contexto.db!, livroKey, 1);

        // Act
        const res = await request(contexto.app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send(payload);

        // Assert
        expect(res.status).toBe(201);
        expect(res.body.itens).toHaveLength(1);
        expect(res.body.itens[0].livroUuid).toBe(livro.uuid);
        expect(res.body.itens[0].precoUnitario).toBe(livro.preco);
        expect(res.body.valorTotal).toBe(livro.preco + 10); // preço + frete padrão
      });
    });
  });

  describe('Cenários de Stress e Edge Cases', () => {
    it('[RF0001] deve lidar com carrinho completo (4 livros diferentes)', async () => {
      // Arrange - Carrinho completo com 4 livros
      const payload = await gerarPayloadVendaMultiplos(contexto.db!, [
        { livroUuid: LIVROS_TESTE.SENHOR_ANEIS.uuid, quantidade: 1 },
        { livroUuid: LIVROS_TESTE.DOM_CASMURRO.uuid, quantidade: 1 },
        { livroUuid: LIVROS_TESTE.DUNA.uuid, quantidade: 1 },
        { livroUuid: LIVROS_TESTE.MIL_NOVECENTOS_E_QUATRO.uuid, quantidade: 1 }
      ], { valorFrete: 20 });

      // Act
      const res = await request(contexto.app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payload);

      // Assert
      expect(res.status).toBe(201);
      expect(res.body.itens).toHaveLength(4);
      expect(res.body.valorTotalItens).toBe(229.60); // 79.90 + 29.90 + 79.90 + 39.90
      expect(res.body.valorTotal).toBe(249.60); // 229.60 + 20 frete
    });

    it('[RF0001] deve processar carrinho com múltiplas unidades do mesmo livro', async () => {
      // Arrange
      const payload = await gerarPayloadVendaMultiplos(contexto.db!, [
        { livroUuid: LIVROS_TESTE.DOM_CASMURRO.uuid, quantidade: 5 }
      ], { valorFrete: 15 });

      // Act
      const res = await request(contexto.app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payload);

      // Assert
      expect(res.status).toBe(201);
      expect(res.body.itens).toHaveLength(1);
      expect(res.body.itens[0].quantidade).toBe(5);
      expect(res.body.valorTotalItens).toBe(149.50); // 5 * 29.90
      expect(res.body.valorTotal).toBe(164.50); // 149.50 + 15 frete
    });

    it('[RF0001] deve dividir pagamento complexo entre 4 cartões', async () => {
      // Arrange
      const { vendaPayload, pagamentoPayload } = await gerarPayloadPagamentoMultiplosVariado(
        contexto.db!,
        [
          { livroUuid: LIVROS_TESTE.SENHOR_ANEIS.uuid, quantidade: 1 },
          { livroUuid: LIVROS_TESTE.SILMARILLION.uuid, quantidade: 1 }
        ],
        { numeroCartoes: 4 }
      );

      // Criar venda
      const vendaRes = await request(contexto.app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(vendaPayload);

      const vendaUuid = vendaRes.body.id;
      const intencao = await registrarIntencao(contexto.app, tokenCliente, vendaPayload.valorTotal);

      // Act
      const res = await request(contexto.app)
        .post('/api/pagamento/processar')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          vendaUuid,
          valorTotal: vendaPayload.valorTotal,
          idIntencao: intencao.idIntencao,
          segredoConfirmacao: intencao.segredoConfirmacao,
          pagamentosCartao: pagamentoPayload.pagamentosCartao,
        });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.pagamentos).toHaveLength(4);
      
      // Verificar se a soma dos pagamentos é igual ao total
      const somaPagamentos = pagamentoPayload.pagamentosCartao.reduce((sum, p) => sum + p.valor, 0);
      expect(somaPagamentos).toBe(vendaPayload.valorTotal);
    });
  });

  describe('Validação de Preços e Consistência', () => {
    it('[RF0001] deve validar todos os livros de teste estão disponíveis', async () => {
      // Arrange
      const livrosUuids = Object.values(LIVROS_TESTE).map(livro => livro.uuid);

      // Act
      const resultado = await validarConsistenciaPrecosMultiplos(contexto.db!, livrosUuids);

      // Assert
      expect(resultado.consistente).toBe(true);
      expect(resultado.detalhes).toHaveLength(livrosUuids.length);
      
      resultado.detalhes.forEach(det => {
        expect(det.consistente).toBe(true);
        expect(det.precoBanco).toBeGreaterThan(0);
      });
    });

    it('[RF0001] deve gerar todas as combinações de carrinho predefinidas', async () => {
      // Arrange
      const combinacoes = gerarCombinacoesCarrinho();

      // Act & Assert - Testar cada combinação
      for (const combinacao of combinacoes) {
        console.log(`🧪 Testando combinação: ${combinacao.nome} - ${combinacao.descricao}`);
        
        const itens = combinacao.itens.map(item => ({
          livroUuid: LIVROS_TESTE[item.livroKey].uuid,
          quantidade: item.quantidade
        }));

        const payload = await gerarPayloadVendaMultiplos(contexto.db!, itens);

        const res = await request(contexto.app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${tokenCliente}`)
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.itens).toHaveLength(combinacao.itens.length);
        expect(res.body.valorTotal).toBeGreaterThan(0);
      }
    }, 30000); // Timeout maior para múltiplos testes
  });

  describe('Cenários de Falha', () => {
    it('[RF0001] deve falhar ao criar venda com livro inexistente', async () => {
      // Arrange
      const payload = {
        itens: [{ livroUuid: 'uuid-inexistente', quantidade: 1, precoUnitario: 50 }],
        valorTotalItens: 50,
        valorFrete: 10,
        valorTotal: 60
      };

      // Act
      const res = await request(contexto.app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payload);

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.erro).toBeDefined();
    });

    it('[RF0001] deve falhar com quantidade inválida', async () => {
      // Arrange
      const payload = await gerarPayloadLivroEspecifico(contexto.db!, 'SENHOR_ANEIS', 0);

      // Act
      const res = await request(contexto.app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payload);

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.erro).toBeDefined();
    });

    it('[RF0001] deve falhar com valor total inconsistente', async () => {
      // Arrange
      const payload = await gerarPayloadLivroEspecifico(contexto.db!, 'SENHOR_ANEIS', 1);
      payload.valorTotal = 999.99; // Valor incorreto

      // Act
      const res = await request(contexto.app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payload);

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.erro).toBeDefined();
    });
  });
});