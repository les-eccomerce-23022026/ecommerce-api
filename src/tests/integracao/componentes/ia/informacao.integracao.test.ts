/**
 * Testes de Integração — Chat Informação (intenção informacao)
 *
 * Verifica que o assistente responde perguntas sobre políticas da loja,
 * frete e horários usando APENAS as POLITICAS_LOJA fixas construídas em
 * ServicoRecomendacaoApplication, sem acionar RAG, sem consultar pedidos
 * e sem consultar tendências.
 *
 * RN-IA-005: Modo informacao usa apenas POLITICAS_LOJA — sem RAG, sem pedidos, sem tendências.
 */

import '@/tests/helpers/setupMocksIA.util';
import {
  mockBuscarPedidosRecentes,
  mockBuscarSimilares,
  mockBuscarTendenciasPorCategoria,
  mockBuscarTendenciasPorFaixaEtaria,
  mockGerarEmbedding,
  mockGerarRespostaChat,
  mockInterpretarIntencao,
} from '@/tests/helpers/setupMocksIA.util';

import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenClienteParaIa, postIaChat } from '@/tests/helpers/ia-integracao.helper';
import { STATUS_VENDAS } from '@/modules/vendas/constants/statusVendas.constant';

/** Intenção de informação padrão para este arquivo. */
const intencaoInformacao = {
  tipo: 'informacao' as const,
  generos: [],
  quantidadeLivros: 1,
  precisaEsclarecer: false,
  queryBusca: 'políticas da loja',
  confianca: 0.94,
};

describe('[RF-IA-07] Integração - Chat Informação (intenção informacao)', () => {
  const contexto = configurarTesteIntegracao();
  let tokenCliente: string;

  beforeEach(async () => {
    tokenCliente = await obterTokenClienteParaIa(contexto.app);
    mockInterpretarIntencao.mockResolvedValue(intencaoInformacao);
  });

  // ── Roteamento de intenção ──────────────────────────────────────────────────

  describe('Roteamento de Intenção', () => {
    it('[RN-IA-005] deve retornar tipoResposta "informacao" quando intenção é informacao', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Qual é o prazo de troca?' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.tipoResposta).toBe('informacao');
    });

    it('[RN-IA-005] deve retornar estrutura completa (resposta, produtosRecomendados, tipoResposta) em informacao', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Como funciona o frete?' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados).toHaveProperty('resposta');
      expect(resposta.body.dados).toHaveProperty('produtosRecomendados');
      expect(resposta.body.dados).toHaveProperty('tipoResposta');
      expect(resposta.body.dados).toHaveProperty('tempoRespostaMs');
      expect(typeof resposta.body.dados.resposta).toBe('string');
      expect(resposta.body.dados.resposta.length).toBeGreaterThan(0);
    });

    it('[RN-IA-005] deve retornar produtosRecomendados vazio em informacao', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Qual o horário de atendimento?' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.dados.produtosRecomendados).toEqual([]);
    });

    it('[RN-IA-005] deve retornar tempoRespostaMs como número não-negativo', async () => {
      const resposta = await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Posso trocar um livro com defeito?' });

      expect(typeof resposta.body.dados.tempoRespostaMs).toBe('number');
      expect(resposta.body.dados.tempoRespostaMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Uso de POLITICAS_LOJA fixas ────────────────────────────────────────────

  describe('Uso das POLITICAS_LOJA (sem inventar dados)', () => {
    it('[RN-IA-005] deve passar contexto com prazo de troca de 7 dias corridos ao Gemini', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Posso trocar um livro após 5 dias da entrega?' });

      expect(mockGerarRespostaChat).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Prazo de troca: 7 dias corridos'),
        undefined,
        expect.anything(),
      );
    });

    it('[RN-IA-005] deve incluir orientação para "Meus Pedidos" no contexto de informacao', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Onde vejo informações sobre minha entrega?' });

      expect(mockGerarRespostaChat).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Meus Pedidos'),
        undefined,
        expect.anything(),
      );
    });

    it('[RN-IA-005] deve incluir todos os seis status de venda possíveis no contexto', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais os possíveis status de um pedido?' });

      // Captura o segundo argumento (contexto) da chamada ao adapter
      expect(mockGerarRespostaChat).toHaveBeenCalledTimes(1);
      const contextoPassado = mockGerarRespostaChat.mock.calls[0][1] as string;

      expect(contextoPassado).toContain(STATUS_VENDAS.EM_PROCESSAMENTO);
      expect(contextoPassado).toContain(STATUS_VENDAS.APROVADA);
      expect(contextoPassado).toContain(STATUS_VENDAS.ENTREGUE);
      expect(contextoPassado).toContain(STATUS_VENDAS.CANCELADA);
      expect(contextoPassado).toContain(STATUS_VENDAS.EM_TROCA);
      expect(contextoPassado).toContain(STATUS_VENDAS.CONCLUIDA);
    });

    it('[RN-IA-005] deve incluir descrição "aguardando confirmação de pagamento" para EM_PROCESSAMENTO', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'O que significa o status EM PROCESSAMENTO?' });

      expect(mockGerarRespostaChat).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('aguardando confirmação de pagamento'),
        undefined,
        expect.anything(),
      );
    });

    it('[RN-IA-005] deve incluir descrição do status TROCA_CONCLUIDA no contexto', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Minha troca foi finalizada, o que significa isso?' });

      expect(mockGerarRespostaChat).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(STATUS_VENDAS.CONCLUIDA),
        undefined,
        expect.anything(),
      );
    });
  });

  // ── Isolamento total: sem chamadas externas ────────────────────────────────

  describe('Isolamento — sem RAG, pedidos ou tendências', () => {
    it('[RN-IA-005] não deve acionar busca semântica (RAG) em informacao', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Como funciona a política de devolução?' });

      expect(mockBuscarSimilares).not.toHaveBeenCalled();
    });

    it('[RN-IA-005] não deve gerar embedding em informacao', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Qual o prazo de entrega para São Paulo?' });

      expect(mockGerarEmbedding).not.toHaveBeenCalled();
    });

    it('[RN-IA-005] não deve acionar buscarPedidosRecentes em informacao', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Qual o prazo de troca?' });

      expect(mockBuscarPedidosRecentes).not.toHaveBeenCalled();
    });

    it('[RN-IA-005] não deve acionar buscarTendenciasPorCategoria em informacao', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Quais as políticas de frete?' });

      expect(mockBuscarTendenciasPorCategoria).not.toHaveBeenCalled();
    });

    it('[RN-IA-005] não deve acionar buscarTendenciasPorFaixaEtaria em informacao', async () => {
      await postIaChat(contexto.app, tokenCliente)
        .send({ mensagem: 'Como funciona a garantia dos livros?' });

      expect(mockBuscarTendenciasPorFaixaEtaria).not.toHaveBeenCalled();
    });
  });
});
