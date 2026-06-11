/**
 * Testes de Integração — Chat Pós-Venda (intenção pos_venda)
 *
 * Verifica que o assistente responde dúvidas sobre pedidos, entrega e troca
 * usando APENAS os pedidos reais do cliente (buscarPedidosRecentes) e as
 * políticas fixas da loja (POLITICAS_LOJA), sem inventar dados e sem RAG.
 *
 * RN-IA-003: Modo pos_venda usa apenas dados reais — sem RAG e sem inventar status.
 */

import '@/tests/helpers/setupMocksIA.util';
import {
  mockBuscarPedidosRecentes,
  mockBuscarSimilares,
  mockGerarEmbedding,
  mockGerarRespostaChat,
  mockInterpretarIntencao,
} from '@/tests/helpers/setupMocksIA.util';

import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenClienteParaIa, postIaChat } from '@/tests/helpers/ia-integracao.helper';
import { STATUS_VENDAS } from '@/modules/vendas/constants/statusVendas.constant';
import type { IPedidoRecenteContexto } from '@/modules/ia/IContextoRecomendacao.entity';

/** Intenção de pós-venda padrão para este arquivo. */
const intencaoPosVenda = {
  tipo: 'pos_venda' as const,
  generos: [],
  quantidadeLivros: 1,
  precisaEsclarecer: false,
  queryBusca: 'status do pedido',
  confianca: 0.95,
};

describe('[RF-IA-05] Integração - Chat Pós-Venda (intenção pos_venda)', () => {
  const contexto = configurarTesteIntegracao();
  let tokenCliente: string;

  beforeEach(async () => {
    tokenCliente = await obterTokenClienteParaIa(contexto.app);
    mockInterpretarIntencao.mockResolvedValue(intencaoPosVenda);
  });

  // ── Roteamento de intenção ──────────────────────────────────────────────────

  describe('Roteamento de Intenção', () => {
    it('[RN-IA-003] deve retornar tipoResposta "pos_venda" quando intenção é pos_venda', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Qual o status do meu pedido?' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.tipoResposta).toBe('pos_venda');
    });

    it('[RN-IA-003] deve retornar estrutura completa (resposta, produtosRecomendados, tempoRespostaMs) em pos_venda', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quando meu pedido vai chegar?' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados).toHaveProperty('resposta');
      expect(resposta.body.dados).toHaveProperty('produtosRecomendados');
      expect(resposta.body.dados).toHaveProperty('tipoResposta');
      expect(resposta.body.dados).toHaveProperty('tempoRespostaMs');
      expect(typeof resposta.body.dados.resposta).toBe('string');
      expect(resposta.body.dados.resposta.length).toBeGreaterThan(0);
    });

    it('[RN-IA-003] deve retornar tempoRespostaMs como número não-negativo', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Meu pedido está atrasado?' });

      expect(typeof resposta.body.dados.tempoRespostaMs).toBe('number');
      expect(resposta.body.dados.tempoRespostaMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Acesso ao repositório de pedidos ──────────────────────────────────────

  describe('Acesso ao Repositório de Pedidos', () => {
    it('[RN-IA-003] deve acionar buscarPedidosRecentes com o UUID do cliente autenticado', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Preciso saber o status do meu pedido' });

      expect(mockBuscarPedidosRecentes).toHaveBeenCalledTimes(1);
      expect(mockBuscarPedidosRecentes).toHaveBeenCalledWith(expect.any(String));
    });

    it('[RN-IA-003] deve montar contexto com pedidos recentes quando cliente possui pedidos', async () => {
      const pedidoMock: IPedidoRecenteContexto = {
        uuid: 'ped00001-0000-0000-0000-000000000001',
        status: STATUS_VENDAS.APROVADA,
        total: 89.90,
        criadoEm: new Date('2025-01-15'),
        qtdItens: 2,
      };
      mockBuscarPedidosRecentes.mockResolvedValueOnce([pedidoMock]);

      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Qual o status do meu pedido mais recente?' });

      // Contexto passado ao Gemini deve conter a seção "Pedidos recentes"
      expect(mockGerarRespostaChat).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Pedidos recentes do cliente'),
        undefined,
        expect.objectContaining({ modoPosvenda: true }),
      );
    });

    it('[RN-IA-003] deve indicar ausência de pedidos no contexto quando lista está vazia', async () => {
      mockBuscarPedidosRecentes.mockResolvedValueOnce([]);

      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Tenho algum pedido em andamento?' });

      expect(mockGerarRespostaChat).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Nenhum pedido recente encontrado para este cliente'),
        undefined,
        expect.objectContaining({ modoPosvenda: true }),
      );
    });

    it('[RN-IA-003] deve incluir status e total do pedido no contexto enviado ao Gemini', async () => {
      const pedidoEntregue: IPedidoRecenteContexto = {
        uuid: 'ped00002-0000-0000-0000-000000000002',
        status: STATUS_VENDAS.ENTREGUE,
        total: 59.90,
        criadoEm: new Date('2025-01-10'),
        qtdItens: 1,
      };
      mockBuscarPedidosRecentes.mockResolvedValueOnce([pedidoEntregue]);

      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Meu pedido foi entregue?' });

      // O status real do pedido deve estar no contexto
      expect(mockGerarRespostaChat).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(STATUS_VENDAS.ENTREGUE),
        undefined,
        expect.anything(),
      );
    });

    it('[RN-IA-003] deve passar múltiplos pedidos no contexto quando cliente tem histórico recente', async () => {
      const pedidosMock: IPedidoRecenteContexto[] = [
        {
          uuid: 'ped00003-0000-0000-0000-000000000003',
          status: STATUS_VENDAS.ENTREGUE,
          total: 49.90,
          criadoEm: new Date('2025-01-05'),
          qtdItens: 1,
        },
        {
          uuid: 'ped00004-0000-0000-0000-000000000004',
          status: STATUS_VENDAS.APROVADA,
          total: 129.80,
          criadoEm: new Date('2025-01-20'),
          qtdItens: 2,
        },
      ];
      mockBuscarPedidosRecentes.mockResolvedValueOnce(pedidosMock);

      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais são meus pedidos recentes?' });

      expect(resposta.status).toBe(200);
      expect(mockBuscarPedidosRecentes).toHaveBeenCalledTimes(1);
    });
  });

  // ── Anti-alucinação: sem RAG em pos_venda puro ────────────────────────────

  describe('Anti-Alucinação — sem RAG no fluxo pos_venda puro', () => {
    it('[RN-IA-003] deve retornar produtosRecomendados vazio em pos_venda puro', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Qual o prazo para troca do meu pedido?' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.produtosRecomendados).toEqual([]);
    });

    it('[RN-IA-003] não deve acionar busca semântica (RAG) no fluxo pos_venda', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Meu pedido foi entregue mas está com defeito' });

      expect(mockBuscarSimilares).not.toHaveBeenCalled();
    });

    it('[RN-IA-003] não deve gerar embedding no fluxo pos_venda', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quero cancelar meu pedido' });

      expect(mockGerarEmbedding).not.toHaveBeenCalled();
    });
  });

  // ── Políticas fixas da loja no contexto ───────────────────────────────────

  describe('Políticas Fixas da Loja (POLITICAS_LOJA) no Contexto', () => {
    it('[RN-IA-003] deve incluir prazo de troca de 7 dias corridos no contexto', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Qual o prazo para solicitar troca?' });

      expect(mockGerarRespostaChat).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Prazo de troca: 7 dias corridos'),
        undefined,
        expect.anything(),
      );
    });

    it('[RN-IA-003] deve incluir orientação para "Meus Pedidos" no contexto', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Como rastreio meu pedido?' });

      expect(mockGerarRespostaChat).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Meus Pedidos'),
        undefined,
        expect.anything(),
      );
    });

    it('[RN-IA-003] deve incluir status de venda possíveis no contexto para grounding do assistente', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'O que significa o status EM PROCESSAMENTO?' });

      expect(mockGerarRespostaChat).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(STATUS_VENDAS.EM_PROCESSAMENTO),
        undefined,
        expect.anything(),
      );
    });

    it('[RN-IA-003] deve sinalizar modo pós-venda ao adapter Gemini via opção modoPosvenda:true', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Meu pedido está atrasado' });

      expect(mockGerarRespostaChat).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        undefined,
        expect.objectContaining({ modoPosvenda: true }),
      );
    });
  });
});
