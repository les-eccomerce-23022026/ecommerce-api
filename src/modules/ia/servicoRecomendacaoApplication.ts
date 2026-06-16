import { IRepositorioEmbedding } from './IRepositorioEmbedding';
import {
  IRepositorioContextoCliente,
  IRepositorioMetricasRecomendacao,
  IRepositorioTendencias,
  IMetricaRecomendacao,
  IMetricasAgregadas,
  PeriodoMetrica,
  IPedidoRecenteContexto,
  ITendenciaCategoriaContexto,
  ITendenciaFaixaEtariaContexto,
} from './IRepositorioRecomendacao';
import { ServicoGeracaoEmbedding } from './servicoGeracaoEmbedding';
import { ServicoValidacaoProdutos } from './servicoValidacaoProdutos';
import { ServicoCacheProdutos } from './servicoCacheProdutos';
import {
  ServicoRecomendacaoRAG,
  RecomendacaoResultado,
  ProdutoRecomendado,
  MetricasPipelineRAG,
} from './servicoRecomendacaoRAG';
import { IMetricasDeterministicas } from './IMetricasDeterministicas';
import { ServicoFiltroCatalogo } from './servicoFiltroCatalogo';
import { AdapterLangChainGemini } from './adapterLangChainGemini';
import { FactoryEmbedding } from './factoryEmbedding';
import { IContextoRecomendacao } from './IContextoRecomendacao.entity';
import {
  IntencaoRecomendacao,
  TipoIntencaoRecomendacao,
} from './IntencaoRecomendacao.entity';
import {
  IRecomendarRequestDTO,
  IRecomendarResponseDTO,
  IChatRequestDTO,
  IChatResponseDTO,
  ProdutoRecomendadoDTO,
  MensagemChatDTO,
  ContextoRequisicaoIA,
  TipoContextoIA,
} from './IRecomendacao.dto';
import { STATUS_VENDAS } from '@/modules/vendas/constants/statusVendas.constant';
import { Logger } from '@/shared/utils/Logger.util';
import { ServicoIndexacaoProdutos } from './servicoIndexacaoProdutos';
import { ServicoLivros } from '@/modules/livros/servicoLivros';
import { ServicoInterpretacaoIntencao } from './servicoInterpretacaoIntencao';
import {
  ServicoContextoConversa,
  ContextoTurnoConversa,
} from './servicoContextoConversa';
import { ValidadorSemanticaDinamico } from './validadorSemanticaDinamico';
import { ValidadorCoerenciaLLM } from './validadorCoerenciaLLM';
import { AprendizadoAlucinacoes } from './aprendizadoAlucinacoes';

/**
 * Políticas fixas da loja enviadas ao assistente nos modos pós-venda e informação.
 * Construídas a partir de STATUS_VENDAS (U13 — sem strings literais em domínio).
 */
const POLITICAS_LOJA = [
  `Prazo de troca: 7 dias corridos após a data de entrega (RN0043).`,
  `Status de pedidos possíveis:`,
  `  "${STATUS_VENDAS.EM_PROCESSAMENTO}" — aguardando confirmação de pagamento;`,
  `  "${STATUS_VENDAS.APROVADA}" — pagamento confirmado, pedido em separação;`,
  `  "${STATUS_VENDAS.ENTREGUE}" — pedido recebido pelo cliente;`,
  `  "${STATUS_VENDAS.CANCELADA}" — pedido cancelado;`,
  `  "${STATUS_VENDAS.EM_TROCA}" — solicitação de troca em aberto;`,
  `  "${STATUS_VENDAS.CONCLUIDA}" — troca finalizada.`,
  `Para rastreamento detalhado ou suporte humano, oriente o cliente a acessar "Meus Pedidos".`,
].join('\n');

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
    groq: ISaudeIaDependencia;
  };
}

export interface OpcoesRecomendacaoInterna {
  queryTexto?: string;
  intencao?: IntencaoRecomendacao;
  limite?: number;
  /** UUIDs já exibidos em turnos anteriores — prioriza títulos novos */
  excluirUuids?: string[];
  /**
   * Embedding pré-computado da mensagem original.
   * Quando presente, evita re-chamar a API de embedding dentro do pipeline.
   * Produzido pela fase paralela do chat (dados.mensagem antes do enriquecimento).
   */
  embeddingPreComputado?: number[];
}

type HistoricoGemini = { papel: 'user' | 'model'; conteudo: string }[] | undefined;

/** Nome dos eventos SSE do chat em streaming (Task 6). */
export type NomeEventoSSEChat = 'meta' | 'produtos' | 'token' | 'done' | 'error';

/** Callback de emissão de evento SSE: nome do evento + payload serializável. */
export type EmitirEventoSSE = (evento: NomeEventoSSEChat, dados: unknown) => void;

/** Timeouts para chamadas externas (ms). Evita que uma lentidão da API Gemini/Chroma bloqueie a requisição. */
const TIMEOUT_EMBEDDING_MS = 30_000;
const TIMEOUT_INTENCAO_MS = 12_000;
const TIMEOUT_RESPOSTA_CHAT_MS = 15_000;

/** Resultado interno da busca de produtos para chat com métricas de pipeline opcionais. */
interface ResultadoBuscaProdutosChat {
  produtos: ProdutoRecomendadoDTO[];
  metricasPipeline?: MetricasPipelineRAG;
}

/**
 * Serviço de Aplicação para Recomendação e Assistente de Livraria
 *
 * Orquestra interpretação de intenção, RAG, filtros estruturados, tendências,
 * pós-venda e chat Gemini, roteando cada intenção para o handler correto.
 */
export class ServicoRecomendacaoApplication {
  private readonly servicoFiltroCatalogo = new ServicoFiltroCatalogo();
  private readonly servicoContextoConversa = new ServicoContextoConversa();
  private readonly validadorSemantica: ValidadorSemanticaDinamico;
  private readonly validadorCoerenciaLLM: ValidadorCoerenciaLLM;
  private readonly aprendizadoAlucinacoes: AprendizadoAlucinacoes;

  constructor(
    private repositorioEmbedding: IRepositorioEmbedding,
    private repositorioContextoCliente: IRepositorioContextoCliente,
    private repositorioMetricasRecomendacao: IRepositorioMetricasRecomendacao,
    /** Repositório dedicado a tendências e pedidos recentes (pós-venda) */
    private repositorioTendencias: IRepositorioTendencias,
    private servicoGeracaoEmbedding: ServicoGeracaoEmbedding,
    private servicoValidacaoProdutos: ServicoValidacaoProdutos,
    private servicoRecomendacaoRAG: ServicoRecomendacaoRAG,
    private adapterLangChain: AdapterLangChainGemini,
    private servicoIndexacaoProdutos: ServicoIndexacaoProdutos,
    private servicoLivros: ServicoLivros,
    private servicoInterpretacaoIntencao: ServicoInterpretacaoIntencao
  ) {
    // Usa FactoryEmbedding (huggingface_local) para validação semântica — não Gemini
    this.validadorSemantica = new ValidadorSemanticaDinamico(FactoryEmbedding.obterInstancia());
    this.validadorCoerenciaLLM = new ValidadorCoerenciaLLM(adapterLangChain);
    this.aprendizadoAlucinacoes = new AprendizadoAlucinacoes();
  }

  /**
   * Endpoint: recomendar — fluxo simples de recomendação sem chat.
   * 
   * Fluxo: Contexto cliente → Pipeline RAG → Remover duplicatas → Retornar resposta.
   * Útil para integrações diretas sem conversação.
   * 
   * CORREÇÃO: Implementa isolamento de contexto baseado em papel:
   * - CLIENTE: busca contexto do próprio cliente
   * - ADMIN_LOJA: usa contexto null (acesso a dados agregados da loja)
   * - ADMIN_SISTEMA: usa contexto null (acesso a dados agregados globais)
   */
  async recomendar(dados: IRecomendarRequestDTO, incluirMetricas = false): Promise<IRecomendarResponseDTO> {
    const inicio = Date.now();

    try {
      // CORREÇÃO: Determina se deve buscar contexto do cliente baseado no papel
      const contextoIA = dados.contextoIA;
      const deveBuscarContextoCliente = contextoIA?.tipo === TipoContextoIA.CLIENTE && contextoIA.clienteUuid;

      // Cache de contexto com escopo da requisição: evita múltiplas consultas ao banco
      // caso obterContextoCliente seja chamado mais de uma vez dentro do mesmo fluxo
      const cacheContextoRequisicao = new Map<string, IContextoRecomendacao | null>();

      // 1. Busca contexto personalizado do cliente (histórico, preferências)
      // CORREÇÃO: Apenas busca contexto se for CLIENTE com UUID válido
      const contextoCliente = deveBuscarContextoCliente && contextoIA.clienteUuid
        ? await this.obterContextoCliente(contextoIA.clienteUuid, cacheContextoRequisicao)
        : null;
      
      // 2. Executa pipeline RAG: gera embedding, busca produtos, aplica filtros
      const resultado = await this.executarPipelineRecomendacao(
        dados.query,
        contextoCliente,
        { limite: dados.limite || 5 }
      );

      // 3. FASE 2: Validação semântica dinâmica (Camada 2)
      const resultadoSemantica = await this.validadorSemantica.validarCoerenciaSemantica(
        dados.query,
        resultado.produtos
      );

      if (!resultadoSemantica.valido) {
        // Registra alucinação detectada (Camada 4)
        this.aprendizadoAlucinacoes.registrarAlucinacao(
          dados.query,
          resultadoSemantica.motivo,
          resultado.produtos.length
        );

        Logger.warn(
          `[ServicoRecomendacaoApplication] Validação semântica falhou: ${resultadoSemantica.motivo}. Tentando fallback.`
        );

        // Tenta fallback
        const resultadoFallback = await this.tentarQuerySimplificada(
          dados.query,
          contextoCliente,
          dados.limite || 5
        );

        if (resultadoFallback.produtos.length > 0) {
          const produtosFallback = this.removerDuplicatasEOrdenar(
            resultadoFallback.produtos,
            dados.limite || 5
          );
          return this.construirResposta(resultadoFallback, produtosFallback, Date.now() - inicio, incluirMetricas);
        }

        return this.construirRespostaVazia(dados.query, resultado, Date.now() - inicio);
      }

      // 4. FASE 3: Validação de coerência contextual via LLM (Camada 3 - condicional)
      // Ativar apenas se similaridade média estiver entre 0.35 e 0.50 (zona cinza)
      if (resultadoSemantica.similaridadeMedia && 
          resultadoSemantica.similaridadeMedia >= 0.35 && 
          resultadoSemantica.similaridadeMedia < 0.50) {
        
        const resultadoLLM = await this.validadorCoerenciaLLM.validarCoerenciaContextual(
          dados.query,
          resultado.produtos
        );

        if (!resultadoLLM.valido) {
          // Registra alucinação detectada (Camada 4)
          this.aprendizadoAlucinacoes.registrarAlucinacao(
            dados.query,
            resultadoLLM.motivo,
            resultado.produtos.length
          );

          Logger.warn(
            `[ServicoRecomendacaoApplication] Validação LLM falhou: ${resultadoLLM.motivo}.`
          );

          return this.construirRespostaVazia(dados.query, resultado, Date.now() - inicio);
        }
      }

      // 5. Registra query válida para aprendizado (Camada 4)
      this.aprendizadoAlucinacoes.registrarQueryValida(
        dados.query,
        resultado.produtos.length
      );

      // 6. Remove duplicatas e ordena por similaridade (maior primeiro)
      const produtosDTO = this.removerDuplicatasEOrdenar(
        resultado.produtos,
        dados.limite || 5
      );
      const tempoResposta = Date.now() - inicio;

      // Fallback: se não houver produtos, tenta query simplificada
      if (produtosDTO.length === 0 && resultado.totalEncontrados > 0) {
        Logger.warn(`[ServicoRecomendacaoApplication] Todos os produtos foram filtrados. Tentando query simplificada.`);

        const resultadoFallback = await this.tentarQuerySimplificada(
          dados.query,
          contextoCliente,
          dados.limite || 5
        );

        if (resultadoFallback.produtos.length > 0) {
          const produtosFallback = this.removerDuplicatasEOrdenar(
            resultadoFallback.produtos,
            dados.limite || 5
          );
          return this.construirResposta(resultadoFallback, produtosFallback, Date.now() - inicio, incluirMetricas);
        }
      }

      // Se ainda não houver produtos, retorna mensagem explicativa
      if (produtosDTO.length === 0) {
        return this.construirRespostaVazia(dados.query, resultado, Date.now() - inicio);
      }

      return this.construirResposta(resultado, produtosDTO, tempoResposta, incluirMetricas);
    } catch (erro) {
      return this.tratarErroRecomendacao(erro);
    }
  }

  /**
   * Endpoint: chat — fluxo conversacional com interpretação de intenção.
   * 
   * Fluxo completo:
   * 1. Normaliza e limita histórico para não sobrecarregar a LLM
   * 2. Busca contexto personalizado do cliente (apenas se for CLIENTE)
   * 3. Analisa contexto da conversa (turno atual, produtos mencionados)
   * 4. Interpreta intenção via Gemini (recomendação, pós-venda, tendências, etc.)
   * 5. Despacha para handler específico baseado na intenção
   * 
   * CORREÇÃO: Implementa isolamento de contexto baseado em papel:
   * - CLIENTE: busca contexto do próprio cliente
   * - ADMIN_LOJA: usa contexto null (acesso a dados agregados da loja)
   * - ADMIN_SISTEMA: usa contexto null (acesso a dados agregados globais)
   * 
   * O despacho usa tabela de despacho (Record) ao invés de switch/case (regra U2).
   */
  async chat(dados: IChatRequestDTO, incluirMetricas = false): Promise<IChatResponseDTO> {
    const inicio = Date.now();

    try {
      const contextoIA = dados.contextoIA;
      const deveBuscarContextoCliente = contextoIA?.tipo === TipoContextoIA.CLIENTE && contextoIA.clienteUuid;

      // Fase síncrona — sem I/O, instantâneo
      const historicoNormalizado = this.normalizarHistorico(dados.historico);
      const historicoParaLlm = this.servicoContextoConversa.limitarHistoricoPorTurnos(historicoNormalizado);
      const cacheContextoRequisicao = new Map<string, IContextoRecomendacao | null>();
      const contextoTurno = this.servicoContextoConversa.analisar(historicoParaLlm, dados.mensagem);
      const historicoGemini = this.converterHistoricoGemini(historicoParaLlm, dados.mensagem);

      // Fase paralela — 3 operações independentes disparadas ao mesmo tempo:
      //   • obterContextoCliente : consulta ao banco (~50-200ms)
      //   • interpretar          : Gemini classifica a intenção (~3-8s)
      //   • gerarEmbedding       : Gemini vetoriza a mensagem (~1-3s)
      // Tempo total ≈ max(db, interpretar, embedding) em vez de soma sequencial.
      // Tradeoff aceito: interpretar não recebe perfil do cliente, mas o tipo de intenção
      // ("fantasia", "pos_venda", etc.) independe do histórico de compras.
      const [contextoCliente, intencao, embeddingMensagem] = await Promise.all([
        deveBuscarContextoCliente && contextoIA.clienteUuid
          ? this.obterContextoCliente(contextoIA.clienteUuid, cacheContextoRequisicao)
          : Promise.resolve(null),
        this.comTimeout(
          this.servicoInterpretacaoIntencao.interpretar(dados.mensagem, historicoParaLlm, {
            perfil: undefined,
            resumoCompras: undefined,
          }),
          TIMEOUT_INTENCAO_MS,
          'interpretacao-intencao'
        ),
        this.comTimeout(
          FactoryEmbedding.obterInstancia().gerarEmbedding(dados.mensagem),
          TIMEOUT_EMBEDDING_MS,
          'embedding-mensagem'
        ),
      ]);

      const intencaoResumida = this.resumirIntencao(intencao);

      // Esclarecimento tem prioridade máxima — resposta imediata sem RAG
      if (intencao.precisaEsclarecer) {
        return this.processarChatEsclarecimento(
          dados, intencao, contextoCliente, historicoGemini, contextoTurno, inicio, intencaoResumida, incluirMetricas
        );
      }

      // Despacho por tipo de intenção — sem switch/case (regra U2)
      const despachoChat: Record<TipoIntencaoRecomendacao, () => Promise<IChatResponseDTO>> = {
        pos_venda: () =>
          this.processarChatPosvenda(
            dados, intencao, contextoCliente, historicoGemini, contextoTurno, inicio, intencaoResumida, incluirMetricas
          ),
        tendencias: () =>
          this.processarChatTendencias(
            dados, intencao, contextoCliente, historicoGemini, contextoTurno, inicio, intencaoResumida, incluirMetricas, embeddingMensagem
          ),
        informacao: () =>
          this.processarChatInformacao(
            dados, contextoCliente, historicoGemini, contextoTurno, inicio, intencaoResumida, incluirMetricas
          ),
        comparativo: () =>
          this.processarChatComparativo(
            dados, intencao, contextoCliente, historicoGemini, contextoTurno, inicio, intencaoResumida, incluirMetricas, embeddingMensagem
          ),
        recomendacao: () =>
          this.processarChatRecomendacao(
            dados, intencao, contextoCliente, historicoGemini, contextoTurno, inicio, intencaoResumida, incluirMetricas, embeddingMensagem
          ),
        esclarecimento: () =>
          this.processarChatRecomendacao(
            dados, intencao, contextoCliente, historicoGemini, contextoTurno, inicio, intencaoResumida, incluirMetricas, embeddingMensagem
          ),
        conversa: () =>
          this.processarChatRecomendacao(
            dados, intencao, contextoCliente, historicoGemini, contextoTurno, inicio, intencaoResumida, incluirMetricas, embeddingMensagem
          ),
      };

      // Executa o handler correspondente ao tipo de intenção
      return despachoChat[intencao.tipo]();
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoRecomendacaoApplication] Erro no chat: ${mensagem}`);
      throw erro;
    }
  }

  /**
   * Endpoint: chat com streaming SSE (Task 6).
   *
   * Estratégia de baixo risco: reaproveita integralmente o pipeline de `chat()`
   * (interpretação de intenção, RAG, geração da resposta), garantindo paridade
   * total de comportamento com o caminho não-streaming. Em seguida emite os
   * eventos SSE na ordem do contrato:
   *   meta → produtos → token(s) → done
   *
   * Os deltas de `token` são derivados da resposta final por fragmentação
   * (chunking) — o cliente recebe o texto incrementalmente. A geração nativa
   * em streaming dos provedores está disponível via
   * `adapterLangChain.gerarRespostaChatStream` e é usada internamente pelos
   * caminhos que chamam a LLM; aqui o foco é o contrato SSE estável.
   *
   * @param emitir Callback de emissão de eventos SSE (evento + dados serializáveis)
   */
  async chatStream(
    dados: IChatRequestDTO,
    incluirMetricas: boolean,
    emitir: EmitirEventoSSE
  ): Promise<void> {
    try {
      const resultado = await this.chat(dados, incluirMetricas);

      emitir('meta', {
        tipoResposta: resultado.tipoResposta,
        intencaoResumida: resultado.intencaoResumida,
        contextoUsado: resultado.contextoUsado,
        numeroTurno: resultado.numeroTurno,
      });

      emitir('produtos', {
        produtosRecomendados: resultado.produtosRecomendados,
      });

      for (const delta of this.fragmentarTexto(resultado.resposta)) {
        emitir('token', { delta });
      }

      emitir('done', resultado);
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoRecomendacaoApplication] Erro no chatStream: ${mensagem}`);
      emitir('error', { message: mensagem });
    }
  }

  /**
   * Fragmenta o texto final em deltas pequenos para emissão incremental via SSE.
   * Mantém a pontuação/espaços, preservando o texto original ao concatenar.
   */
  private *fragmentarTexto(texto: string): Generator<string> {
    if (!texto) return;
    // Quebra preservando os separadores (espaços e quebras de linha).
    const partes = texto.match(/\S+\s*|\s+/g);
    if (!partes) {
      yield texto;
      return;
    }
    for (const parte of partes) {
      yield parte;
    }
  }

  // ── Handlers por tipo de intenção ─────────────────────────────────────────

  /**
   * Handler: esclarecimento — retorna perguntas ao cliente sem busca no catálogo.
   */
  private async processarChatEsclarecimento(
    dados: IChatRequestDTO,
    intencao: IntencaoRecomendacao,
    contextoCliente: IContextoRecomendacao | null,
    historicoGemini: HistoricoGemini,
    contextoTurno: ContextoTurnoConversa,
    inicio: number,
    intencaoResumida: string,
    incluirMetricas: boolean
  ): Promise<IChatResponseDTO> {
    const respostaEsclarecimento = await this.adapterLangChain.gerarRespostaChat(
      dados.mensagem,
      'Nenhum dado disponível — modo esclarecimento.',
      historicoGemini,
      {
        modoEsclarecimento: true,
        perguntasFollowUp: intencao.perguntasEsclarecimento,
        perfil: contextoCliente?.perfil,
        // Intenção curta (Task 3): resposta breve, limite menor de tokens.
        maxTokens: 384,
      }
    );

    return this.finalizarRespostaChat(
      {
        resposta: respostaEsclarecimento,
        produtosRecomendados: [],
        contextoUsado: contextoCliente !== null,
        tempoRespostaMs: Date.now() - inicio,
        tipoResposta: 'esclarecimento',
        intencaoResumida,
        metricas: undefined,
      },
      intencao,
      contextoTurno
    );
  }

  /**
   * Handler: pós-venda — busca pedidos recentes + políticas fixas; sem RAG.
   * RAG é acionado apenas se o cliente mencionar um livro relacionado ao pedido.
   */
  private async processarChatPosvenda(
    dados: IChatRequestDTO,
    intencao: IntencaoRecomendacao,
    contextoCliente: IContextoRecomendacao | null,
    historicoGemini: HistoricoGemini,
    contextoTurno: ContextoTurnoConversa,
    inicio: number,
    intencaoResumida: string,
    _incluirMetricas: boolean
  ): Promise<IChatResponseDTO> {
    const pedidos: IPedidoRecenteContexto[] = dados.clienteUuid
      ? await this.repositorioTendencias.buscarPedidosRecentes(dados.clienteUuid)
      : [];

    const contextoPedidos = this.construirContextoPedidos(pedidos);

    const resposta = await this.adapterLangChain.gerarRespostaChat(
      dados.mensagem,
      contextoPedidos,
      historicoGemini,
      {
        perfil: contextoCliente?.perfil,
        modoPosvenda: true,
        // Intenção curta (Task 3): resposta breve, limite menor de tokens.
        maxTokens: 384,
      }
    );

    return this.finalizarRespostaChat(
      {
        resposta,
        produtosRecomendados: [],
        contextoUsado: contextoCliente !== null,
        tempoRespostaMs: Date.now() - inicio,
        tipoResposta: 'pos_venda',
        intencaoResumida,
        metricas: undefined,
      },
      intencao,
      contextoTurno
    );
  }

  /**
   * Handler: tendências — agrega rankings de vendas; complementa com RAG se
   * o cliente mencionou uma categoria específica.
   */
  private async processarChatTendencias(
    dados: IChatRequestDTO,
    intencao: IntencaoRecomendacao,
    contextoCliente: IContextoRecomendacao | null,
    historicoGemini: HistoricoGemini,
    contextoTurno: ContextoTurnoConversa,
    inicio: number,
    intencaoResumida: string,
    incluirMetricas: boolean,
    embeddingPreComputado?: number[]
  ): Promise<IChatResponseDTO> {
    const [tendenciasCategoria, tendenciasFaixa] = await Promise.all([
      this.repositorioTendencias.buscarTendenciasPorCategoria(
        intencao.generos.length > 0 ? intencao.generos : undefined
      ),
      this.repositorioTendencias.buscarTendenciasPorFaixaEtaria(),
    ]);

    const limiteRag = this.obterLimiteProdutosChat(intencao, 5);
    const intencaoSemFiltroGenero = this.intencaoApenasBuscaSemantica(intencao);
    const resultadoBuscaTendencias = await this.buscarProdutosChat(
      dados,
      intencao,
      contextoCliente,
      contextoTurno,
      limiteRag,
      intencaoSemFiltroGenero,
      embeddingPreComputado
    );
    let produtosDTO = resultadoBuscaTendencias.produtos;
    let metricasPipelineTendencias = resultadoBuscaTendencias.metricasPipeline;

    if (produtosDTO.length === 0) {
      const resultadoFallback = await this.executarPipelineRecomendacao(
        dados.mensagem,
        contextoCliente,
        { intencao: intencaoSemFiltroGenero, limite: limiteRag, embeddingPreComputado }
      );
      produtosDTO = this.removerDuplicatasEOrdenar(resultadoFallback.produtos, limiteRag);
      metricasPipelineTendencias = resultadoFallback.metricasPipeline;
    }

    const contextoTendencias = this.construirContextoTendencias(
      tendenciasCategoria,
      tendenciasFaixa,
      produtosDTO
    );

    const resposta =
      produtosDTO.length > 0
        ? this.montarRespostaEmTopicos(
            this.obterPrimeiroNome(contextoCliente?.perfil),
            produtosDTO,
            {
              genero: this.rotularGenero(intencao.generos),
              modoTendencias: true,
              continuacao: contextoTurno.numeroTurno > 1,
            }
          )
        : await this.adapterLangChain.gerarRespostaChat(
            dados.mensagem,
            contextoTendencias,
            historicoGemini,
            { perfil: contextoCliente?.perfil }
          );

    return this.finalizarRespostaChat(
      {
        resposta,
        produtosRecomendados: produtosDTO,
        contextoUsado: contextoCliente !== null,
        tempoRespostaMs: Date.now() - inicio,
        tipoResposta: 'tendencias',
        intencaoResumida,
        respostaDeterministica: produtosDTO.length > 0,
        metricas: incluirMetricas && metricasPipelineTendencias
          ? this.montarMetricasDeterministicas(metricasPipelineTendencias, Date.now() - inicio)
          : undefined,
      },
      intencao,
      contextoTurno
    );
  }

  /**
   * Handler: informação — responde usando apenas as políticas fixas da loja.
   * Nunca inventa dados não presentes nas políticas.
   */
  private async processarChatInformacao(
    dados: IChatRequestDTO,
    contextoCliente: IContextoRecomendacao | null,
    historicoGemini: HistoricoGemini,
    contextoTurno: ContextoTurnoConversa,
    inicio: number,
    intencaoResumida: string,
    _incluirMetricas: boolean
  ): Promise<IChatResponseDTO> {
    const resposta = await this.adapterLangChain.gerarRespostaChat(
      dados.mensagem,
      POLITICAS_LOJA,
      historicoGemini,
      { perfil: contextoCliente?.perfil }
    );

    const intencaoInformacao: IntencaoRecomendacao = {
      tipo: 'informacao',
      generos: [],
      quantidadeLivros: 1,
      precisaEsclarecer: false,
      queryBusca: dados.mensagem,
      confianca: 1,
    };

    return this.finalizarRespostaChat(
      {
        resposta,
        produtosRecomendados: [],
        contextoUsado: contextoCliente !== null,
        tempoRespostaMs: Date.now() - inicio,
        tipoResposta: 'informacao',
        intencaoResumida,
        metricas: undefined,
      },
      intencaoInformacao,
      contextoTurno
    );
  }

  /**
   * Handler: comparativo — busca cada título separadamente e combina os resultados.
   */
  private async processarChatComparativo(
    dados: IChatRequestDTO,
    intencao: IntencaoRecomendacao,
    contextoCliente: IContextoRecomendacao | null,
    historicoGemini: HistoricoGemini,
    contextoTurno: ContextoTurnoConversa,
    inicio: number,
    intencaoResumida: string,
    incluirMetricas: boolean,
    embeddingPreComputado?: number[]
  ): Promise<IChatResponseDTO> {
    const limite = this.obterLimiteProdutosChat(intencao, 4);
    let produtosDTO: ProdutoRecomendadoDTO[] = [];
    let metricasPipelineComparativo: MetricasPipelineRAG | undefined;

    if (intencao.comparar && intencao.comparar.length >= 2) {
      const produtosBrutos = await this.recomendarComparativo(intencao, contextoCliente, limite);
      produtosDTO = this.removerDuplicatasEOrdenar(produtosBrutos, limite);
    } else {
      const resultadoBusca = await this.buscarProdutosChat(
        dados,
        intencao,
        contextoCliente,
        contextoTurno,
        limite,
        undefined,
        embeddingPreComputado
      );
      produtosDTO = resultadoBusca.produtos;
      metricasPipelineComparativo = resultadoBusca.metricasPipeline;
    }

    const contextoChat = this.construirContextoChat(produtosDTO);

    const resposta =
      produtosDTO.length > 0
        ? this.montarRespostaEmTopicos(
            this.obterPrimeiroNome(contextoCliente?.perfil),
            produtosDTO,
            {
              genero: this.rotularGenero(intencao.generos),
              continuacao: contextoTurno.numeroTurno > 1,
            }
          )
        : await this.adapterLangChain.gerarRespostaChat(
            dados.mensagem,
            contextoChat,
            historicoGemini,
            { perfil: contextoCliente?.perfil }
          );

    return this.finalizarRespostaChat(
      {
        resposta,
        produtosRecomendados: produtosDTO,
        contextoUsado: contextoCliente !== null,
        tempoRespostaMs: Date.now() - inicio,
        tipoResposta: 'recomendacao',
        intencaoResumida,
        respostaDeterministica: produtosDTO.length > 0,
        metricas: incluirMetricas && metricasPipelineComparativo
          ? this.montarMetricasDeterministicas(metricasPipelineComparativo, Date.now() - inicio)
          : undefined,
      },
      intencao,
      contextoTurno
    );
  }

  /**
   * Handler: recomendação/conversa/esclarecimento-sem-bloqueio — fluxo RAG padrão.
   */
  private async processarChatRecomendacao(
    dados: IChatRequestDTO,
    intencao: IntencaoRecomendacao,
    contextoCliente: IContextoRecomendacao | null,
    historicoGemini: HistoricoGemini,
    contextoTurno: ContextoTurnoConversa,
    inicio: number,
    intencaoResumida: string,
    incluirMetricas: boolean,
    embeddingPreComputado?: number[]
  ): Promise<IChatResponseDTO> {
    const limite = this.obterLimiteProdutosChat(intencao, 4);
    const { produtos: produtosDTO, metricasPipeline } = await this.buscarProdutosChat(
      dados,
      intencao,
      contextoCliente,
      contextoTurno,
      limite,
      undefined,
      embeddingPreComputado
    );
    const contextoChat = this.construirContextoChat(produtosDTO);

    const resposta =
      produtosDTO.length > 0
        ? this.montarRespostaEmTopicos(
            this.obterPrimeiroNome(contextoCliente?.perfil),
            produtosDTO,
            {
              genero: this.rotularGenero(intencao.generos),
              continuacao: contextoTurno.numeroTurno > 1,
            }
          )
        : await this.adapterLangChain.gerarRespostaChat(
            dados.mensagem,
            contextoChat,
            historicoGemini,
            { perfil: contextoCliente?.perfil }
          );

    return this.finalizarRespostaChat(
      {
        resposta,
        produtosRecomendados: produtosDTO,
        contextoUsado: contextoCliente !== null,
        tempoRespostaMs: Date.now() - inicio,
        tipoResposta: 'recomendacao',
        intencaoResumida,
        respostaDeterministica: produtosDTO.length > 0,
        metricas: incluirMetricas && metricasPipeline
          ? this.montarMetricasDeterministicas(metricasPipeline, Date.now() - inicio)
          : undefined,
      },
      intencao,
      contextoTurno
    );
  }

  /**
   * Pipeline RAG: gera recomendações usando busca semântica + filtros estruturados.
   * 
   * Fluxo:
   * 1. Gera embedding da query do usuário
   * 2. Busca todos os produtos existentes no BD (para validação anti-alucinação)
   * 3. Executa RAG: busca vetorial + MMR (diversificação) se limite > 1
   * 4. Aplica filtros estruturados (preço, páginas, gênero, etc.)
   * 5. Remove produtos já mostrados (excluirUuids) para evitar repetição
   * 6. Retorna resultados limitados
   * 
   * MMR (Maximal Marginal Relevance): diversifica resultados para não mostrar
   * apenas produtos muito similares entre si.
   */
  private async executarPipelineRecomendacao(
    query: string,
    contextoCliente: IContextoRecomendacao | null,
    opcoes: OpcoesRecomendacaoInterna
  ): Promise<RecomendacaoResultado> {
    // 1. Usa embedding pré-computado (fase paralela do chat) ou gera agora.
    //    O embedding da mensagem original é semanticamente equivalente ao da query
    //    enriquecida para os fins de busca vetorial — os filtros estruturais de gênero
    //    e preço são aplicados na Fase 5 via servicoFiltroCatalogo, não no embedding.
    const inicioEmbedding = Date.now();
    const queryEmbedding = opcoes.embeddingPreComputado
      ?? await this.gerarEmbeddingQuery(query);
    const tempoEmbedding = opcoes.embeddingPreComputado ? 0 : Date.now() - inicioEmbedding;

    // 2. Produtos existentes via cache (TTL 5 min) — validação anti-alucinação
    const produtosExistentes = await this.servicoValidacaoProdutos.obterProdutosExistentes();

    const limite = opcoes.limite ?? opcoes.intencao?.quantidadeLivros ?? 5;
    const usarMMR = limite > 1;

    // 3. RAG: busca vetorial + deduplicação + anti-alucinação + MMR
    const resultadoRag = await this.servicoRecomendacaoRAG.gerarRecomendacao(
      query,
      queryEmbedding,
      contextoCliente,
      produtosExistentes,
      Math.max(limite * 2, 10),
      usarMMR
    );

    // 4. Filtros estruturais da intenção (preço, páginas, gênero)
    const filtros = opcoes.intencao
      ? this.servicoFiltroCatalogo.filtrosDeIntencao(opcoes.intencao)
      : {};

    let { produtos: produtosFiltrados } = this.servicoFiltroCatalogo.aplicar(
      resultadoRag.produtos,
      filtros
    );

    // 5. Fallback semântico: se o filtro de gênero eliminou todos os candidatos RAG,
    //    retorna os resultados semânticos sem filtro estrutural.
    //    Motivo: o Gemini pode classificar gêneros em termos que não batem exatamente
    //    com as categorias do catálogo (ex: "ficção" vs "Ficção Científica").
    //    O RAG já garante relevância semântica — o filtro é complementar, não bloqueante.
    if (produtosFiltrados.length === 0 && resultadoRag.produtos.length > 0 && filtros.generos?.length) {
      Logger.warn(
        `[ServicoRecomendacaoApplication] Filtro de gênero ${JSON.stringify(filtros.generos)} eliminou todos os ${resultadoRag.produtos.length} candidatos RAG — aplicando fallback semântico`
      );
      produtosFiltrados = resultadoRag.produtos;
    }

    // 6. Remove produtos já exibidos em turnos anteriores
    if (opcoes.excluirUuids && opcoes.excluirUuids.length > 0) {
      const excluir = new Set(opcoes.excluirUuids);
      const semRepeticao = produtosFiltrados.filter((p) => !excluir.has(p.uuid));
      if (semRepeticao.length > 0) {
        produtosFiltrados = semRepeticao;
      }
    }

    return {
      ...resultadoRag,
      produtos: produtosFiltrados.slice(0, limite),
      query: opcoes.queryTexto ?? query,
      metricasPipeline: resultadoRag.metricasPipeline
        ? { ...resultadoRag.metricasPipeline, tempoEmbedding }
        : undefined,
    };
  }

  /**
   * Busca produtos para o chat com enriquecimento de contexto.
   * 
   * Fluxo:
   * 1. Monta query enriquecida com gêneros, preço, preferências do cliente
   * 2. Enriquece query com contexto da conversa (produtos mencionados anteriormente)
   * 3. Em continuações, busca mais produtos para ter margem de seleção
   * 4. Executa pipeline RAG excluindo produtos já mostrados
   * 5. Remove duplicatas e ordena por similaridade
   */
  private async buscarProdutosChat(
    dados: IChatRequestDTO,
    intencao: IntencaoRecomendacao,
    contextoCliente: IContextoRecomendacao | null,
    contextoTurno: ContextoTurnoConversa,
    limite: number,
    intencaoBusca?: IntencaoRecomendacao,
    embeddingPreComputado?: number[]
  ): Promise<ResultadoBuscaProdutosChat> {
    const queryBase = this.montarQueryEnriquecida(
      intencao.queryBusca || dados.mensagem,
      intencao,
      contextoCliente
    );
    const queryEnriquecida = this.servicoContextoConversa.enriquecerQueryBusca(
      queryBase,
      contextoTurno,
      dados.mensagem
    );
    const limiteBusca = contextoTurno.ehContinuacao ? limite + 3 : limite;

    const resultado = await this.executarPipelineRecomendacao(
      queryEnriquecida,
      contextoCliente,
      {
        intencao: intencaoBusca ?? intencao,
        limite: limiteBusca,
        excluirUuids: contextoTurno.uuidsJaMostrados,
        embeddingPreComputado,
      }
    );

    return {
      produtos: this.removerDuplicatasEOrdenar(resultado.produtos, limite),
      metricasPipeline: resultado.metricasPipeline,
    };
  }

  private async finalizarRespostaChat(
    base: Omit<IChatResponseDTO, 'perguntasFollowUp' | 'numeroTurno'> & {
      respostaDeterministica?: boolean;
    },
    intencao: IntencaoRecomendacao,
    contextoTurno: ContextoTurnoConversa
  ): Promise<IChatResponseDTO> {
    const { respostaDeterministica, ...baseResposta } = base;

    // Guard anti-alucinação (ponto único): aplica-se a respostas geradas por LLM
    // (Gemini ou fallback). Substitui a resposta caso a IA cite títulos
    // inexistentes no catálogo — independe da obediência do LLM. RN-IA-001.
    //
    // Respostas determinísticas (montarRespostaEmTopicos) são montadas só com
    // produtos reais já validados pelo pipeline RAG: não há alucinação possível.
    // Pular o guard nesses casos evita trabalho redundante e falsos positivos.
    const respostaAncorada = respostaDeterministica
      ? baseResposta.resposta
      : await this.garantirRespostaAncorada(baseResposta.resposta);

    return {
      ...baseResposta,
      resposta: respostaAncorada,
      numeroTurno: contextoTurno.numeroTurno,
      perguntasFollowUp: this.servicoContextoConversa.gerarPerguntasFollowUp(
        intencao,
        contextoTurno,
        baseResposta.produtosRecomendados.length
      ),
    };
  }

  /**
   * Verifica se todo título citado na resposta existe no catálogo. Se encontrar
   * um título inventado (multipalavra, ausente do catálogo), substitui a resposta
   * inteira por uma mensagem honesta — barreira determinística contra alucinação.
   */
  private async garantirRespostaAncorada(resposta: string): Promise<string> {
    if (!resposta || resposta.trim().length === 0) {
      return resposta;
    }

    // Títulos citados aparecem sempre entre aspas; extrair só de aspas evita
    // capturar prosa solta (ex.: "...livro de fantasia no catálogo...").
    const candidatos = new Set<string>();
    const regexAspas = /["“]([^"”\n]{4,})["”]/g;
    let m: RegExpExecArray | null;
    while ((m = regexAspas.exec(resposta)) !== null) candidatos.add(m[1]);

    // Termos de UI/CTA e termos de consulta que o LLM pode envolver em aspas mas nunca são títulos.
    const EXCLUIR_UI = new Set([
      'ver detalhes', 'saiba mais', 'clique aqui', 'comprar agora', 'adicionar ao carrinho',
      'ver mais', 'ver todos', 'continuar', 'voltar', 'fechar', 'confirmar',
      // Termos de busca/intenção que o LLM às vezes cita entre aspas na resposta
      'mais vendidos', 'mais populares', 'mais procurados', 'mais lidos',
      'livros de fantasia', 'livros de terror', 'livros de romance', 'livros de suspense',
    ]);

    // Apenas frases com aparência de título (multipalavra) — evita falso positivo
    // com termos genéricos ("romance", "fantasia") e termos de UI.
    const titulosCitados = Array.from(candidatos)
      .map((t) => ServicoCacheProdutos.normalizarTitulo(t))
      .filter((t) => t.includes(' ') && !EXCLUIR_UI.has(t));

    if (titulosCitados.length === 0) {
      return resposta;
    }

    const catalogoTitulos = await this.servicoValidacaoProdutos.obterTitulosExistentes();
    // Fail-open: sem catálogo carregado, não há como validar — mantém resposta.
    if (catalogoTitulos.size === 0) {
      return resposta;
    }

    const inventado = titulosCitados.find(
      (titulo) => !this.tituloExisteNoCatalogo(titulo, catalogoTitulos)
    );

    if (inventado) {
      Logger.warn(
        `[ServicoRecomendacaoApplication] Guard anti-alucinação acionado: título "${inventado}" ausente do catálogo.`
      );
      return 'Não encontrei nenhum livro com essas características no nosso catálogo no momento. Posso recomendar títulos disponíveis se você indicar um gênero, autor ou tema do seu interesse.';
    }

    return resposta;
  }

  /** Aceita correspondência exata ou por contiguidade (título citado contém/está contido). */
  private tituloExisteNoCatalogo(titulo: string, catalogo: Set<string>): boolean {
    if (catalogo.has(titulo)) {
      return true;
    }
    for (const real of catalogo) {
      if (real.includes(titulo) || titulo.includes(real)) {
        return true;
      }
    }
    return false;
  }

  private async recomendarComparativo(
    intencao: IntencaoRecomendacao,
    contextoCliente: IContextoRecomendacao | null,
    limite: number
  ): Promise<ProdutoRecomendado[]> {
    const titulos = intencao.comparar ?? [];
    const porUuid = new Map<string, ProdutoRecomendado>();

    for (const titulo of titulos.slice(0, 3)) {
      const query = `${titulo} ${intencao.generos.join(' ')}`;
      const resultado = await this.executarPipelineRecomendacao(query, contextoCliente, {
        intencao: { ...intencao, quantidadeLivros: 1 },
        limite: 2,
      });

      for (const produto of resultado.produtos) {
        if (!porUuid.has(produto.uuid)) {
          porUuid.set(produto.uuid, produto);
        }
      }
    }

    return Array.from(porUuid.values()).slice(0, limite);
  }

  /**
   * Monta query enriquecida com filtros estruturados para busca semântica.
   * 
   * Adiciona informações contextuais à query base:
   * - Gêneros solicitados
   * - Gêneros relacionados (para evitar filter bubbles)
   * - Público-alvo
   * - Preço máximo
   * - Preferências do cliente
   * - Região geográfica
   * 
   * Isso ajuda a busca vetorial a encontrar produtos mais alinhados à intenção
   * e evita filter bubbles incluindo categorias relacionadas.
   */
  private montarQueryEnriquecida(
    queryBase: string,
    intencao: IntencaoRecomendacao,
    contexto: IContextoRecomendacao | null
  ): string {
    const partes = [queryBase];

    // Adiciona filtros da intenção (explicitamente mencionados pelo usuário)
    if (intencao.generos.length > 0) {
      partes.push(`Gêneros: ${intencao.generos.join(', ')}`);
      
      // Adiciona gêneros relacionados para evitar filter bubbles
      const generosRelacionados = this.obterGenerosRelacionados(intencao.generos);
      if (generosRelacionados.length > 0) {
        partes.push(`Gêneros relacionados: ${generosRelacionados.join(', ')}`);
      }
    }
    if (intencao.publicoAlvo) {
      partes.push(`Público: ${intencao.publicoAlvo}`);
    }
    if (intencao.precoMax !== undefined) {
      partes.push(`Preço até R$ ${intencao.precoMax}`);
    }
    
    // Adiciona contexto personalizado do cliente (preferências implícitas)
    if (contexto?.preferencias.categorias.length) {
      partes.push(`Preferências: ${contexto.preferencias.categorias.join(', ')}`);
    }
    if (contexto?.perfil?.estado) {
      partes.push(`Região: ${contexto.perfil.estado}`);
    }

    return partes.join('. ');
  }

  /**
   * Obtém gêneros relacionados para evitar filter bubbles
   * 
   * Mapeia gêneros principais para gêneros relacionados, permitindo exploração
   * de categorias similares e evitando que o usuário fique preso em uma bolha.
   */
  private obterGenerosRelacionados(generos: string[]): string[] {
    const mapaRelacoes: Record<string, string[]> = {
      'ficcao_cientifica': ['distopia', 'fantasia cientifica', 'space opera', 'cyberpunk'],
      'terror': ['suspense', 'misterio', 'horror', 'thriller'],
      'romance': ['romance historico', 'contemporaneo', 'drama'],
      'fantasia': ['fantasia urbana', 'alta fantasia', 'fantasia epica'],
      'misterio': ['thriller', 'suspense', 'crime', 'noir'],
      'suspense': ['thriller', 'misterio', 'crime'],
      'distopia': ['ficcao_cientifica', 'pos-apocaliptico'],
      'humor': ['satiro', 'comedia', 'ficcao humoristica'],
    };

    const relacionados = new Set<string>();
    
    for (const genero of generos) {
      const generoNormalizado = genero.toLowerCase().replace(/ç/g, 'c').replace(/ã/g, 'a').replace(/õ/g, 'o');
      if (mapaRelacoes[generoNormalizado]) {
        mapaRelacoes[generoNormalizado].forEach(rel => relacionados.add(rel));
      }
    }

    // Retorna até 3 gêneros relacionados para não poluir demais a query
    return Array.from(relacionados).slice(0, 3);
  }

  /**
   * Normaliza o histórico de chat para formato consistente.
   * 
   * Garante que todas as mensagens tenham o campo 'papel' no formato padrão
   * ('user' | 'assistant'), independentemente de como foram originalmente armazenadas.
   */
  private normalizarHistorico(historico?: MensagemChatDTO[]): MensagemChatDTO[] | undefined {
    if (!historico) {
      return undefined;
    }

    return historico.map((msg) => ({
      conteudo: msg.conteudo ?? '',
      papel: this.normalizarPapelMensagem(msg),
      timestamp: msg.timestamp,
      produtosMencionados: msg.produtosMencionados,
    }));
  }

  /**
   * Normaliza o papel da mensagem para o formato padrão.
   * 
   * Converte diferentes formatos ('remetente', 'papel') para o padrão 'user' | 'assistant'.
   */
  private normalizarPapelMensagem(msg: MensagemChatDTO): 'user' | 'assistant' {
    if (msg.papel === 'user' || msg.papel === 'assistant') {
      return msg.papel;
    }
    if (msg.remetente === 'usuario') {
      return 'user';
    }
    if (msg.remetente === 'assistente') {
      return 'assistant';
    }
    return 'user'; // Default para usuário em caso de dúvida
  }

  /**
   * Converte histórico de chat para o formato esperado pelo Gemini.
   * 
   * Fluxo:
   * 1. Remove a mensagem atual do histórico (para não duplicar)
   * 2. Converte 'assistant' para 'model' (nomenclatura do Gemini)
   * 3. Retorna apenas conteúdo e papel (sem metadados extras)
   */
  private converterHistoricoGemini(
    historico?: MensagemChatDTO[],
    mensagemAtual?: string
  ): HistoricoGemini {
    if (!historico?.length) {
      return undefined;
    }

    const mensagemAtualNorm = mensagemAtual?.trim();
    // Remove a mensagem atual do histórico para evitar duplicação
    const filtrado = historico.filter((msg) => {
      if (!mensagemAtualNorm) {
        return true;
      }
      const ehUsuario = this.normalizarPapelMensagem(msg) === 'user';
      return !(ehUsuario && (msg.conteudo ?? '').trim() === mensagemAtualNorm);
    });

    if (filtrado.length === 0) {
      return undefined;
    }

    // Converte para formato Gemini: 'assistant' → 'model'
    return filtrado.map((msg) => ({
      papel: this.normalizarPapelMensagem(msg) === 'assistant' ? 'model' : 'user',
      conteudo: msg.conteudo,
    }));
  }

  /**
   * Resume o histórico de compras do cliente para contexto da IA.
   * 
   * Retorna até 5 compras recentes no formato "Título (Categoria)".
   * Isso ajuda a IA a entender as preferências do cliente.
   */
  private resumirCompras(contexto: IContextoRecomendacao | null): string | undefined {
    if (!contexto || contexto.historicoCompras.length === 0) {
      return undefined;
    }
    return contexto.historicoCompras
      .slice(0, 5) // Limita a 5 compras para não sobrecarregar a LLM
      .map((c) => `${c.titulo} (${c.categoria})`)
      .join('; ');
  }

  /**
   * Resume a intenção do usuário para logs e debugging.
   * 
   * Formato: "tipo · gêneros · preço" (ex: "recomendacao · terror, suspense · até R$50").
   */
  private montarMetricasDeterministicas(pipeline: MetricasPipelineRAG, tempoTotal: number): IMetricasDeterministicas {
    return {
      taxaAlucinacao: pipeline.taxaAlucinacao,
      tempoEmbedding: pipeline.tempoEmbedding,
      tempoBuscaVetorial: pipeline.tempoBuscaVetorial,
      tempoValidacao: pipeline.tempoValidacao,
      tempoTotal,
      totalCandidatos: pipeline.totalCandidatos,
      totalValidos: pipeline.totalValidos,
      totalFiltrados: pipeline.totalCandidatos - pipeline.totalValidos,
    };
  }

  private resumirIntencao(intencao: IntencaoRecomendacao): string {
    const partes: string[] = [intencao.tipo];
    if (intencao.generos.length) {
      partes.push(intencao.generos.join(', '));
    }
    if (intencao.precoMax) {
      partes.push(`até R$${intencao.precoMax}`);
    }
    return partes.join(' · ');
  }

  private async gerarEmbeddingQuery(query: string): Promise<number[]> {
    const adapterEmbedding = FactoryEmbedding.obterInstancia();
    return this.comTimeout(
      adapterEmbedding.gerarEmbedding(query),
      TIMEOUT_EMBEDDING_MS,
      'embedding'
    );
  }

  /**
   * Wraps a promise with a hard timeout — fail-fast se a API externa travar.
   * Lança Error com mensagem descritiva para facilitar diagnóstico nos logs.
   */
  private comTimeout<T>(promessa: Promise<T>, ms: number, rotulo: string): Promise<T> {
    return Promise.race([
      promessa,
      new Promise<never>((_, rejeitar) =>
        setTimeout(
          () => rejeitar(new Error(`[ServicoRecomendacaoApplication] Timeout de ${ms}ms em "${rotulo}"`)),
          ms
        )
      ),
    ]);
  }

  /**
   * Busca contexto personalizado do cliente para recomendações.
   *
   * Retorna null se não houver clienteUuid (usuário anônimo).
   * O contexto inclui: perfil, histórico de compras, preferências.
   *
   * @param cacheRequisicao Cache com escopo da requisição para evitar múltiplas
   *   consultas ao banco pelo mesmo clienteUuid dentro do mesmo fluxo.
   */
  private async obterContextoCliente(
    clienteUuid?: string,
    cacheRequisicao?: Map<string, IContextoRecomendacao | null>
  ): Promise<IContextoRecomendacao | null> {
    if (!clienteUuid) {
      return null; // Usuário anônimo — sem contexto personalizado
    }

    if (cacheRequisicao?.has(clienteUuid)) {
      Logger.debug(
        `[ServicoRecomendacaoApplication] Cache de contexto da requisição hit para cliente ${clienteUuid.slice(0, 8)}...`
      );
      return cacheRequisicao.get(clienteUuid)!;
    }

    const contexto = await this.repositorioContextoCliente.buscarContexto(clienteUuid);
    cacheRequisicao?.set(clienteUuid, contexto);
    return contexto;
  }

  /**
   * Remove duplicatas e ordena produtos por similaridade.
   * 
   * Lógica:
   * - Se o mesmo UUID aparece múltiplas vezes, mantém apenas a versão com maior similaridade
   * - Ordena todos os produtos únicos por similaridade (maior primeiro)
   * - Retorna apenas os N primeiros conforme o limite
   * 
   * Isso é importante porque o RAG pode retornar o mesmo produto em diferentes chunks,
   * e queremos exibir apenas a melhor versão de cada produto.
   */
  private removerDuplicatasEOrdenar(
    produtos: ProdutoRecomendado[],
    limite: number
  ): ProdutoRecomendadoDTO[] {
    // Usa Map para deduplicação por UUID mantendo a versão com maior similaridade
    const produtosUnicos = new Map<string, ProdutoRecomendadoDTO>();

    for (const produto of produtos) {
      const existente = produtosUnicos.get(produto.uuid);
      // Substitui se não existe ou se a nova versão tem similaridade maior
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

    // Ordena por similaridade (maior primeiro) e retorna os N primeiros
    return Array.from(produtosUnicos.values())
      .sort((a, b) => b.similaridade - a.similaridade)
      .slice(0, limite);
  }

  private construirResposta(
    resultado: RecomendacaoResultado,
    produtosDTO: ProdutoRecomendadoDTO[],
    tempoResposta: number,
    incluirMetricas: boolean = false
  ): IRecomendarResponseDTO {
    const resposta: IRecomendarResponseDTO = {
      query: resultado.query,
      produtos: produtosDTO,
      contextoUsado: resultado.contextoUsado,
      totalEncontrados: resultado.totalEncontrados,
      totalValidos: resultado.totalValidos,
      tempoRespostaMs: tempoResposta,
    };

    if (incluirMetricas && resultado.metricasPipeline) {
      resposta.metricas = {
        ...resultado.metricasPipeline,
        tempoTotal: tempoResposta,
      };
    }

    return resposta;
  }

  private tratarErroRecomendacao(erro: unknown): never {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    Logger.error(`[ServicoRecomendacaoApplication] Erro ao recomendar: ${mensagem}`);
    throw erro;
  }

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
   * Monta o contexto textual de pedidos recentes para o modo pós-venda.
   * Inclui as políticas fixas da loja ao final para orientação do assistente.
   */
  private construirContextoPedidos(pedidos: IPedidoRecenteContexto[]): string {
    if (pedidos.length === 0) {
      return `Nenhum pedido recente encontrado para este cliente.\n\n${POLITICAS_LOJA}`;
    }

    const linhas = pedidos.map(
      (p, i) =>
        `${i + 1}. Pedido #${p.uuid.slice(-8).toUpperCase()}: ` +
        `status="${p.status}", ` +
        `total=R$${Number(p.total).toFixed(2)}, ` +
        `${p.qtdItens} item(ns), ` +
        `realizado em ${new Date(p.criadoEm).toLocaleDateString('pt-BR')}`
    );

    return `Pedidos recentes do cliente:\n${linhas.join('\n')}\n\n${POLITICAS_LOJA}`;
  }

  /**
   * Monta o contexto textual de tendências de vendas para o assistente.
   * Combina ranking por categoria, por faixa etária e destaques do catálogo (RAG).
   */
  private construirContextoTendencias(
    tendenciasCategoria: ITendenciaCategoriaContexto[],
    tendenciasFaixa: ITendenciaFaixaEtariaContexto[],
    produtosRAG: ProdutoRecomendadoDTO[]
  ): string {
    const partes: string[] = [];

    if (tendenciasCategoria.length > 0) {
      const linhas = tendenciasCategoria.map(
        (t) => `  - ${t.categoria}: ${t.titulosTop.join(', ')}`
      );
      partes.push(`Mais vendidos por categoria:\n${linhas.join('\n')}`);
    }

    if (tendenciasFaixa.length > 0) {
      const linhas = tendenciasFaixa.map(
        (t) => `  - Faixa ${t.faixa} anos: ${t.titulosTop.join(', ')}`
      );
      partes.push(`Mais vendidos por faixa etária:\n${linhas.join('\n')}`);
    }

    if (produtosRAG.length > 0) {
      const linhas = produtosRAG.map(
        (p) => `  - "${p.titulo}" de ${p.autor} — R$ ${p.preco.toFixed(2)}`
      );
      partes.push(`Destaques do catálogo (correspondentes à busca):\n${linhas.join('\n')}`);
    }

    return partes.join('\n\n') || 'Dados de tendências não disponíveis no momento.';
  }

  async buscarMetricas(periodo: PeriodoMetrica): Promise<IMetricaRecomendacao[]> {
    try {
      return await this.repositorioMetricasRecomendacao.buscarMetricas(periodo);
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoRecomendacaoApplication] Erro ao buscar métricas: ${mensagem}`);
      throw erro;
    }
  }

  async buscarMetricasAgregadas(periodo: PeriodoMetrica): Promise<IMetricasAgregadas> {
    try {
      return await this.repositorioMetricasRecomendacao.buscarMetricasAgregadas(periodo);
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(
        `[ServicoRecomendacaoApplication] Erro ao buscar métricas agregadas: ${mensagem}`
      );
      throw erro;
    }
  }

  private async verificarGeminiHttp(): Promise<ISaudeIaDependencia> {
    const chave = process.env.GEMINI_API_KEY;
    const modelo = process.env.GEMINI_CHAT_MODEL ?? 'gemini-2.5-flash';
    if (!chave) return { ok: false, mensagem: 'GEMINI_API_KEY não definida' };
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${chave}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'ping' }] }],
            generationConfig: { maxOutputTokens: 1 },
          }),
          signal: AbortSignal.timeout(5000),
        },
      );
      return res.ok ? { ok: true } : { ok: false, mensagem: `HTTP ${res.status}` };
    } catch (erro) {
      return { ok: false, mensagem: erro instanceof Error ? erro.message : String(erro) };
    }
  }

  private async verificarGroqHttp(): Promise<ISaudeIaDependencia> {
    const chave = process.env.GROQ_API_KEY;
    if (!chave) return { ok: false, mensagem: 'GROQ_API_KEY não definida' };
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${chave}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(5000),
      });
      return res.ok ? { ok: true } : { ok: false, mensagem: `HTTP ${res.status}` };
    } catch (erro) {
      return { ok: false, mensagem: erro instanceof Error ? erro.message : String(erro) };
    }
  }

  async verificarSaude(): Promise<ISaudeIaResultado> {
    const [chromadbOk, gemini, groq] = await Promise.all([
      this.repositorioEmbedding.verificarConexao(),
      this.verificarGeminiHttp(),
      this.verificarGroqHttp(),
    ]);

    const algumLlmDisponivel = gemini.ok || groq.ok;

    const dependencias = {
      chromadb: chromadbOk
        ? { ok: true }
        : { ok: false, mensagem: 'Falha ao conectar com ChromaDB' },
      gemini,
      groq,
    };

    const resolverStatus = (): ISaudeIaResultado['status'] => {
      if (!chromadbOk && !algumLlmDisponivel) return 'down';
      if (chromadbOk && gemini.ok && groq.ok) return 'ok';
      return 'degraded';
    };

    const status = resolverStatus();

    return {
      status,
      servico: 'ia-recomendacao',
      timestamp: new Date().toISOString(),
      dependencias,
    };
  }

  async reindexarCatalogo(
    forcar: boolean = false
  ): Promise<{ produtosIndexados: number; tempoExecucaoMs: number }> {
    const inicio = Date.now();

    try {
      if (forcar) {
        await this.repositorioEmbedding.limparColecao();
      }

      const quantidade = await this.servicoIndexacaoProdutos.indexarCatalogo();
      const tempoExecucao = Date.now() - inicio;

      Logger.info(
        `[ServicoRecomendacaoApplication] Catálogo reindexado: ${quantidade} produtos em ${tempoExecucao}ms`
      );

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

  /** Limite de livros por resposta do chat (mín. 3, máx. 5). */
  private obterLimiteProdutosChat(intencao: IntencaoRecomendacao, padrao = 4): number {
    return Math.min(Math.max(intencao.quantidadeLivros || padrao, 3), 5);
  }

  /** Remove filtros de catálogo que não devem restringir a busca semântica no chat. */
  private intencaoApenasBuscaSemantica(intencao: IntencaoRecomendacao): IntencaoRecomendacao {
    return {
      ...intencao,
      generos: [],
      precoMax: undefined,
      precoMin: undefined,
      paginasMax: undefined,
      publicoAlvo: undefined,
      comparar: undefined,
    };
  }

  private obterPrimeiroNome(perfil?: { nome?: string }): string {
    const nome = perfil?.nome?.trim();
    if (!nome) {
      return 'por aqui';
    }
    return nome.split(/\s+/)[0];
  }

  private rotularGenero(generos: string[]): string | undefined {
    if (generos.length === 0) {
      return undefined;
    }
    const rotulo = generos[0].replace(/_/g, ' ');
    return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
  }

  /**
   * Resposta legível em tópicos (bullets), alinhada aos cards de produto exibidos no chat.
   */
  private montarRespostaEmTopicos(
    primeiroNome: string,
    produtos: ProdutoRecomendadoDTO[],
    opcoes?: { genero?: string; modoTendencias?: boolean; continuacao?: boolean }
  ): string {
    const linhas: string[] = [];

    if (opcoes?.continuacao) {
      linhas.push(
        `Entendi, ${primeiroNome}! Refinei as sugestões com base no que conversamos:`
      );
    } else if (opcoes?.modoTendencias && opcoes.genero) {
      linhas.push(
        `Olá, ${primeiroNome}! Aqui está um resumo em ${opcoes.genero} com base no catálogo e nas tendências:`
      );
    } else {
      linhas.push(`Olá, ${primeiroNome}! Separei sugestões alinhadas ao que você pediu:`);
    }

    linhas.push('');
    linhas.push('Destaques do catálogo:');

    for (const produto of produtos) {
      const preco = produto.preco.toFixed(2).replace('.', ',');
      linhas.push(`• ${produto.titulo} — ${produto.autor} (R$ ${preco})`);
    }

    linhas.push('');
    linhas.push('Como aproveitar:');
    linhas.push('• Confira os cards abaixo com sinopse e percentual de match');
    linhas.push('• Toque em "Ver detalhes" para comprar ou comparar opções');
    if (produtos.length >= 2) {
      linhas.push(`• ${produtos.length} títulos ranqueados para você escolher com calma`);
    }
    if (opcoes?.modoTendencias) {
      linhas.push('• Na home e em "Mais Vendidos" há outros lançamentos da mesma categoria');
    }
    if (opcoes?.continuacao) {
      linhas.push('• Use os chips abaixo ou diga outro critério para continuar a conversa');
    } else {
      linhas.push('• Você pode fazer outra pergunta ou tocar em uma sugestão rápida abaixo');
    }

    return linhas.join('\n');
  }

  private async buscarTodosProdutosExistentes(): Promise<Set<string>> {
    try {
      const livros = await this.servicoLivros.listarParaAdmin(10000);
      const uuids = new Set(livros.map((livro) => livro.uuid));
      Logger.info(
        `[ServicoRecomendacaoApplication] ${uuids.size} produtos encontrados no BD para validação`
      );
      return uuids;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(
        `[ServicoRecomendacaoApplication] Erro ao buscar produtos existentes: ${mensagem}`
      );
      return new Set<string>();
    }
  }

  /**
   * Tenta query simplificada removendo contexto absurdo
   */
  private async tentarQuerySimplificada(
    queryOriginal: string,
    contextoCliente: IContextoRecomendacao | null,
    limite: number
  ): Promise<RecomendacaoResultado> {
    // Remove contextos temporais impossíveis
    const querySimplificada = queryOriginal
      .replace(/enquanto estou [a-z]+/gi, '')
      .replace(/durante [a-z]+/gi, '')
      .replace(/para [a-z]+ [a-z]+/gi, '')
      .trim();

    if (querySimplificada === queryOriginal || querySimplificada.length < 10) {
      return { produtos: [], contextoUsado: false, totalEncontrados: 0, totalValidos: 0, query: querySimplificada };
    }

    Logger.info(`[ServicoRecomendacaoApplication] Tentando query simplificada: "${querySimplificada}"`);

    return this.executarPipelineRecomendacao(querySimplificada, contextoCliente, { limite });
  }

  /**
   * Constrói resposta vazia com explicação ao usuário
   */
  private construirRespostaVazia(
    query: string,
    resultado: RecomendacaoResultado,
    tempoResposta: number
  ): IRecomendarResponseDTO {
    let mensagem = 'Não encontrei livros que correspondam à sua solicitação.';

    if (resultado.totalEncontrados === 0) {
      mensagem += ' Tente ser mais específico sobre o gênero ou autor.';
    } else if (resultado.totalValidos === 0) {
      mensagem += ' A combinação de termos pode não ter correspondência no catálogo. Tente simplificar sua busca.';
    }

    return {
      query,
      produtos: [],
      contextoUsado: resultado.contextoUsado,
      totalEncontrados: resultado.totalEncontrados,
      totalValidos: resultado.totalValidos,
      tempoRespostaMs: tempoResposta,
    };
  }
}
