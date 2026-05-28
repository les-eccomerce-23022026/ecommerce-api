import { IRepositorioEmbedding } from '../../domain/repositories/IRepositorioEmbedding';
import {
  IRepositorioRecomendacao,
  IMetricaRecomendacao,
  IMetricasAgregadas,
  PeriodoMetrica,
} from '../../domain/repositories/IRepositorioRecomendacao';
import { ServicoGeracaoEmbedding } from '../../domain/services/ServicoGeracaoEmbedding';
import { ServicoValidacaoProdutos } from '../../domain/services/ServicoValidacaoProdutos';
import { ServicoRecomendacaoRAG } from '../../domain/services/ServicoRecomendacaoRAG';
import { AdapterLangChainGemini } from '../../infrastructure/config/AdapterLangChainGemini';
import { IContextoRecomendacao } from '../../domain/entities/IContextoRecomendacao.entity';
import {
  IRecomendarRequestDTO,
  IRecomendarResponseDTO,
  IChatRequestDTO,
  IChatResponseDTO,
  ProdutoRecomendadoDTO,
} from '../dtos/IRecomendacaoDTO';
import { Logger } from '@/shared/utils/Logger.util';
import { ServicoIndexacaoProdutos } from './ServicoIndexacaoProdutos';

/**
 * Serviço de Aplicação para Recomendação
 * 
 * Orquestra os serviços de domínio e infraestrutura para gerar recomendações.
 */
export class ServicoRecomendacaoApplication {
  constructor(
    private repositorioEmbedding: IRepositorioEmbedding,
    private repositorioRecomendacao: IRepositorioRecomendacao,
    private servicoGeracaoEmbedding: ServicoGeracaoEmbedding,
    private servicoValidacaoProdutos: ServicoValidacaoProdutos,
    private servicoRecomendacaoRAG: ServicoRecomendacaoRAG,
    private adapterLangChain: AdapterLangChainGemini,
    private servicoIndexacaoProdutos: ServicoIndexacaoProdutos
  ) {}

  /**
   * Gera recomendações baseadas na query do usuário
   */
  async recomendar(dados: IRecomendarRequestDTO): Promise<IRecomendarResponseDTO> {
    const inicio = Date.now();

    try {
      // Gera embedding da query
      const queryEmbedding = await this.adapterLangChain.gerarEmbedding(dados.query);

      // Busca contexto do cliente se fornecido
      let contextoCliente: IContextoRecomendacao | null = null;
      if (dados.clienteUuid) {
        contextoCliente = await this.repositorioRecomendacao.buscarContexto(
          dados.clienteUuid
        );
      }

      // Busca todos os produtos existentes (para validação anti-alucinação)
      // TODO: Implementar cache para evitar buscar toda vez
      const produtosExistentes = new Set<string>();
      // Por enquanto, vazio - será implementado na Fase 4

      // Gera recomendações
      const resultado = await this.servicoRecomendacaoRAG.gerarRecomendacao(
        dados.query,
        queryEmbedding,
        contextoCliente,
        produtosExistentes,
        dados.limite || 5
      );

      // Mapeia para DTO
      const produtosDTO: ProdutoRecomendadoDTO[] = resultado.produtos.map((p) => ({
        uuid: p.uuid,
        titulo: p.metadados.titulo,
        autor: p.metadados.autor,
        categoria: p.metadados.categoria,
        sinopse: p.metadados.sinopse,
        isbn: p.metadados.isbn,
        preco: p.metadados.preco,
        similaridade: p.similaridade,
        motivo: p.motivo,
      }));

      const tempoResposta = Date.now() - inicio;

      // Salva métricas (será implementado na Fase 4.6)
      // await this.salvarMetricasRecomendacao(...);

      return {
        query: resultado.query,
        produtos: produtosDTO,
        contextoUsado: resultado.contextoUsado,
        totalEncontrados: resultado.totalEncontrados,
        totalValidos: resultado.totalValidos,
        tempoRespostaMs: tempoResposta,
      };
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoRecomendacaoApplication] Erro ao recomendar: ${mensagem}`);
      throw erro;
    }
  }

  /**
   * Gera resposta de chat com recomendações
   */
  async chat(dados: IChatRequestDTO): Promise<IChatResponseDTO> {
    const inicio = Date.now();

    try {
      // Primeiro, gera recomendações
      const recomendacao = await this.recomendar({
        query: dados.mensagem,
        clienteUuid: dados.clienteUuid,
        limite: 5,
      });

      // Constrói contexto para o chat
      const contextoChat = this.construirContextoChat(recomendacao.produtos);

      // Converte histórico para formato do Gemini
      const historicoGemini = dados.historico?.map((msg) => ({
        papel: msg.papel === 'assistant' ? 'model' : 'user',
        conteudo: msg.conteudo,
      }));

      // Gera resposta usando Gemini
      const resposta = await this.adapterLangChain.gerarRespostaChat(
        dados.mensagem,
        contextoChat,
        historicoGemini
      );

      const tempoResposta = Date.now() - inicio;

      return {
        resposta,
        produtosRecomendados: recomendacao.produtos,
        contextoUsado: recomendacao.contextoUsado,
        tempoRespostaMs: tempoResposta,
      };
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoRecomendacaoApplication] Erro no chat: ${mensagem}`);
      throw erro;
    }
  }

  /**
   * Constrói contexto de chat a partir dos produtos recomendados
   */
  private construirContextoChat(produtos: ProdutoRecomendadoDTO[]): string {
    if (produtos.length === 0) {
      return 'Nenhum produto encontrado.';
    }

    const linhas = produtos.map(
      (p, index) =>
        `${index + 1}. "${p.titulo}" de ${p.autor} (Categoria: ${p.categoria}, Preço: R$ ${p.preco.toFixed(2)})`
    );

    return `Livros encontrados:\n${linhas.join('\n')}`;
  }

  /**
   * Busca métricas de recomendação registradas no período informado.
   *
   * @param periodo Intervalo de tempo desejado: 'hoje', 'semana', 'mes' ou 'todos'
   */
  async buscarMetricas(periodo: PeriodoMetrica): Promise<IMetricaRecomendacao[]> {
    try {
      return await this.repositorioRecomendacao.buscarMetricas(periodo);
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoRecomendacaoApplication] Erro ao buscar métricas: ${mensagem}`);
      throw erro;
    }
  }

  /**
   * Busca métricas agregadas (médias e totais) de recomendação no período informado.
   *
   * @param periodo Intervalo de tempo desejado: 'hoje', 'semana', 'mes' ou 'todos'
   */
  async buscarMetricasAgregadas(periodo: PeriodoMetrica): Promise<IMetricasAgregadas> {
    try {
      return await this.repositorioRecomendacao.buscarMetricasAgregadas(periodo);
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoRecomendacaoApplication] Erro ao buscar métricas agregadas: ${mensagem}`);
      throw erro;
    }
  }

  /**
   * Reindexa todos os produtos no ChromaDB
   */
  async reindexarCatalogo(forcar: boolean = false): Promise<{ produtosIndexados: number; tempoExecucaoMs: number }> {
    const inicio = Date.now();

    try {
      if (forcar) {
        await this.repositorioEmbedding.limparColecao();
      }

      const quantidade = await this.servicoIndexacaoProdutos.indexarCatalogo();
      const tempoExecucao = Date.now() - inicio;

      Logger.info(`[ServicoRecomendacaoApplication] Catálogo reindexado: ${quantidade} produtos em ${tempoExecucao}ms`);

      return {
        produtosIndexados: quantidade,
        tempoExecucaoMs: tempoExecucao,
      };
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoRecomendacaoApplication] Erro ao reindexar: ${mensagem}`);
      throw erro;
    }
  }
}