import { IRepositorioEmbedding } from '../../domain/repositories/IRepositorioEmbedding';
import {
  IRepositorioContextoCliente,
  IRepositorioMetricasRecomendacao,
  IMetricaRecomendacao,
  IMetricasAgregadas,
  PeriodoMetrica,
} from '../../domain/repositories/IRepositorioRecomendacao';
import { ServicoGeracaoEmbedding } from '../../domain/services/ServicoGeracaoEmbedding';
import { ServicoValidacaoProdutos } from '../../domain/services/ServicoValidacaoProdutos';
import {
  ServicoRecomendacaoRAG,
  RecomendacaoResultado,
  ProdutoRecomendado,
} from '../../domain/services/ServicoRecomendacaoRAG';
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
import { ServicoLivros } from '@/modules/livros/servicoLivros';

export interface ISaudeIaDependencia {
  ok: boolean;
  mensagem?: string;
}

export interface ISaudeIaResultado {
  status: 'ok' | 'degraded' | 'down';
  servico: string;
  timestamp: string;
  dependencias: {
    chromadb: ISaudeIaDependencia;
    gemini: ISaudeIaDependencia;
  };
}

/**
 * Serviço de Aplicação para Recomendação
 * 
 * Orquestra os serviços de domínio e infraestrutura para gerar recomendações.
 */
export class ServicoRecomendacaoApplication {
  constructor(
    private repositorioEmbedding: IRepositorioEmbedding,
    private repositorioContextoCliente: IRepositorioContextoCliente,
    private repositorioMetricasRecomendacao: IRepositorioMetricasRecomendacao,
    private servicoGeracaoEmbedding: ServicoGeracaoEmbedding,
    private servicoValidacaoProdutos: ServicoValidacaoProdutos,
    private servicoRecomendacaoRAG: ServicoRecomendacaoRAG,
    private adapterLangChain: AdapterLangChainGemini,
    private servicoIndexacaoProdutos: ServicoIndexacaoProdutos,
    private servicoLivros: ServicoLivros
  ) {}

  /**
   * Gera recomendações baseadas na query do usuário.
   *
   * Orquestra: geração de embedding → contexto do cliente → busca RAG →
   * deduplicação → construção de resposta.
   *
   * @param dados Parâmetros da requisição de recomendação.
   * @returns     DTO com produtos recomendados e métricas de execução.
   */
  async recomendar(dados: IRecomendarRequestDTO): Promise<IRecomendarResponseDTO> {
    const inicio = Date.now();

    try {
      const queryEmbedding = await this.gerarEmbeddingQuery(dados.query);
      const contextoCliente = await this.obterContextoCliente(dados.clienteUuid);
      const produtosExistentes = await this.buscarTodosProdutosExistentes();

      const resultado = await this.servicoRecomendacaoRAG.gerarRecomendacao(
        dados.query,
        queryEmbedding,
        contextoCliente,
        produtosExistentes,
        dados.limite || 5
      );

      const produtosDTO = this.removerDuplicatasEOrdenar(resultado.produtos, dados.limite || 5);
      const tempoResposta = Date.now() - inicio;

      // Salva métricas (será implementado na Fase 4.6)
      // await this.salvarMetricasRecomendacao(...);

      return this.construirResposta(resultado, produtosDTO, tempoResposta);
    } catch (erro) {
      return this.tratarErroRecomendacao(erro);
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

  // ─── Métodos privados extraídos de recomendar() ──────────────────────────────

  /**
   * Gera o vetor de embedding da query via adapter LangChain/Gemini.
   *
   * @param query Texto da busca inserido pelo usuário.
   * @returns     Vetor numérico de embedding da query.
   */
  private async gerarEmbeddingQuery(query: string): Promise<number[]> {
    return this.adapterLangChain.gerarEmbedding(query);
  }

  /**
   * Obtém o contexto de histórico e preferências do cliente, quando disponível.
   *
   * @param clienteUuid Identificador público do cliente (opcional).
   * @returns           Contexto do cliente ou null se não informado.
   */
  private async obterContextoCliente(
    clienteUuid?: string
  ): Promise<IContextoRecomendacao | null> {
    if (!clienteUuid) {
      return null;
    }
    return this.repositorioContextoCliente.buscarContexto(clienteUuid);
  }

  /**
   * Remove produtos duplicados mantendo o de maior similaridade por UUID,
   * ordena por relevância decrescente e limita ao número solicitado.
   *
   * O mesmo produto pode aparecer múltiplas vezes nos resultados do ChromaDB
   * quando possui mais de um chunk indexado — esta etapa consolida essas
   * ocorrências em um único item.
   *
   * @param produtos Lista bruta de produtos (pode conter duplicatas por chunks).
   * @param limite   Número máximo de produtos a retornar.
   * @returns        Lista deduplicada, ordenada por similaridade e limitada.
   */
  private removerDuplicatasEOrdenar(
    produtos: ProdutoRecomendado[],
    limite: number
  ): ProdutoRecomendadoDTO[] {
    const produtosUnicos = new Map<string, ProdutoRecomendadoDTO>();

    for (const produto of produtos) {
      const existente = produtosUnicos.get(produto.uuid);
      const deveSubstituir = !existente || produto.similaridade > existente.similaridade;

      if (deveSubstituir) {
        produtosUnicos.set(produto.uuid, {
          uuid: produto.uuid,
          titulo: produto.metadados.titulo,
          autor: produto.metadados.autor,
          categoria: produto.metadados.categoria,
          sinopse: produto.metadados.sinopse,
          isbn: produto.metadados.isbn,
          preco: produto.metadados.preco,
          similaridade: produto.similaridade,
          motivo: produto.motivo,
        });
      }
    }

    return Array.from(produtosUnicos.values())
      .sort((a, b) => b.similaridade - a.similaridade)
      .slice(0, limite);
  }

  /**
   * Constrói o DTO de resposta consolidando o resultado do domínio RAG,
   * os produtos já processados e o tempo total de execução.
   *
   * @param resultado     Resultado bruto retornado pelo ServicoRecomendacaoRAG.
   * @param produtosDTO   Produtos deduplicados e ordenados prontos para resposta.
   * @param tempoResposta Tempo total de execução em milissegundos.
   * @returns             DTO completo de resposta da recomendação.
   */
  private construirResposta(
    resultado: RecomendacaoResultado,
    produtosDTO: ProdutoRecomendadoDTO[],
    tempoResposta: number
  ): IRecomendarResponseDTO {
    return {
      query: resultado.query,
      produtos: produtosDTO,
      contextoUsado: resultado.contextoUsado,
      totalEncontrados: resultado.totalEncontrados,
      totalValidos: resultado.totalValidos,
      tempoRespostaMs: tempoResposta,
    };
  }

  /**
   * Registra o erro no log e o repropaga para a camada de infraestrutura.
   *
   * Declarado como `never` para que o TypeScript reconheça que este caminho
   * nunca retorna normalmente, eliminando falsos avisos de "código inacessível".
   *
   * @param erro Exceção capturada no bloco catch de recomendar().
   * @throws     Sempre relança o erro recebido sem modificação.
   */
  private tratarErroRecomendacao(erro: unknown): never {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    Logger.error(`[ServicoRecomendacaoApplication] Erro ao recomendar: ${mensagem}`);
    throw erro;
  }

  // ─── Métodos privados de suporte ao chat ──────────────────────────────────

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
      return await this.repositorioMetricasRecomendacao.buscarMetricas(periodo);
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
      return await this.repositorioMetricasRecomendacao.buscarMetricasAgregadas(periodo);
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoRecomendacaoApplication] Erro ao buscar métricas agregadas: ${mensagem}`);
      throw erro;
    }
  }

  /**
   * Verifica saúde do módulo de IA e dependências externas (ChromaDB e Gemini).
   */
  async verificarSaude(): Promise<ISaudeIaResultado> {
    const [chromadbOk, geminiOk] = await Promise.all([
      this.repositorioEmbedding.verificarConexao(),
      this.adapterLangChain.validarConexao(),
    ]);

    const dependencias = {
      chromadb: chromadbOk
        ? { ok: true }
        : { ok: false, mensagem: 'Falha ao conectar com ChromaDB' },
      gemini: geminiOk
        ? { ok: true }
        : { ok: false, mensagem: 'Falha ao conectar com Gemini API' },
    };

    let status: ISaudeIaResultado['status'];
    if (chromadbOk && geminiOk) {
      status = 'ok';
    } else if (!chromadbOk && !geminiOk) {
      status = 'down';
    } else {
      status = 'degraded';
    }

    return {
      status,
      servico: 'ia-recomendacao',
      timestamp: new Date().toISOString(),
      dependencias,
    };
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

  /**
   * Busca todos os produtos existentes no banco de dados
   * Usado para validação anti-alucinação
   */
  private async buscarTodosProdutosExistentes(): Promise<Set<string>> {
    try {
      const livros = await this.servicoLivros.listarParaAdmin(10000);
      const uuids = new Set(livros.map((livro) => livro.uuid));
      Logger.info(`[ServicoRecomendacaoApplication] ${uuids.size} produtos encontrados no BD para validação`);
      return uuids;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoRecomendacaoApplication] Erro ao buscar produtos existentes: ${mensagem}`);
      // Retorna set vazio em caso de erro para não quebrar o fluxo
      return new Set<string>();
    }
  }
}