import { IRepositorioEmbedding } from '../../domain/repositories/IRepositorioEmbedding';
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
} from '../../domain/repositories/IRepositorioRecomendacao';
import { ServicoGeracaoEmbedding } from '../../domain/services/ServicoGeracaoEmbedding';
import { ServicoValidacaoProdutos } from '../../domain/services/ServicoValidacaoProdutos';
import {
  ServicoRecomendacaoRAG,
  RecomendacaoResultado,
  ProdutoRecomendado,
} from '../../domain/services/ServicoRecomendacaoRAG';
import { ServicoFiltroCatalogo } from '../../domain/services/ServicoFiltroCatalogo';
import { AdapterLangChainGemini } from '../../infrastructure/config/AdapterLangChainGemini';
import { IContextoRecomendacao } from '../../domain/entities/IContextoRecomendacao.entity';
import {
  IntencaoRecomendacao,
  TipoIntencaoRecomendacao,
} from '../../domain/entities/IntencaoRecomendacao.entity';
import {
  IRecomendarRequestDTO,
  IRecomendarResponseDTO,
  IChatRequestDTO,
  IChatResponseDTO,
  ProdutoRecomendadoDTO,
  MensagemChatDTO,
} from '../dtos/IRecomendacaoDTO';
import { STATUS_VENDAS } from '@/modules/vendas/constants/statusVendas.constant';
import { Logger } from '@/shared/utils/Logger.util';
import { ServicoIndexacaoProdutos } from './ServicoIndexacaoProdutos';
import { ServicoLivros } from '@/modules/livros/servicoLivros';
import { ServicoInterpretacaoIntencao } from './ServicoInterpretacaoIntencao';
import {
  ServicoContextoConversa,
  ContextoTurnoConversa,
} from '../../domain/services/ServicoContextoConversa';

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
  `  "${STATUS_VENDAS.TROCA_CONCLUIDA}" — troca finalizada.`,
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
  };
}

export interface OpcoesRecomendacaoInterna {
  queryTexto?: string;
  intencao?: IntencaoRecomendacao;
  limite?: number;
  /** UUIDs já exibidos em turnos anteriores — prioriza títulos novos */
  excluirUuids?: string[];
}

type HistoricoGemini = { papel: 'user' | 'model'; conteudo: string }[] | undefined;

/**
 * Serviço de Aplicação para Recomendação e Assistente de Livraria
 *
 * Orquestra interpretação de intenção, RAG, filtros estruturados, tendências,
 * pós-venda e chat Gemini, roteando cada intenção para o handler correto.
 */
export class ServicoRecomendacaoApplication {
  private readonly servicoFiltroCatalogo = new ServicoFiltroCatalogo();
  private readonly servicoContextoConversa = new ServicoContextoConversa();

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
  ) {}

  async recomendar(dados: IRecomendarRequestDTO): Promise<IRecomendarResponseDTO> {
    const inicio = Date.now();

    try {
      const contextoCliente = await this.obterContextoCliente(dados.clienteUuid);
      const resultado = await this.executarPipelineRecomendacao(
        dados.query,
        contextoCliente,
        { limite: dados.limite || 5 }
      );

      const produtosDTO = this.removerDuplicatasEOrdenar(
        resultado.produtos,
        dados.limite || 5
      );
      const tempoResposta = Date.now() - inicio;

      return this.construirResposta(resultado, produtosDTO, tempoResposta);
    } catch (erro) {
      return this.tratarErroRecomendacao(erro);
    }
  }

  async chat(dados: IChatRequestDTO): Promise<IChatResponseDTO> {
    const inicio = Date.now();

    try {
      const historicoNormalizado = this.normalizarHistorico(dados.historico);
      const historicoParaLlm = this.servicoContextoConversa.limitarHistoricoPorTurnos(
        historicoNormalizado
      );
      const contextoCliente = await this.obterContextoCliente(dados.clienteUuid);
      const contextoTurno = this.servicoContextoConversa.analisar(
        historicoParaLlm,
        dados.mensagem
      );
      const historicoGemini = this.converterHistoricoGemini(
        historicoParaLlm,
        dados.mensagem
      );

      const intencao = await this.servicoInterpretacaoIntencao.interpretar(
        dados.mensagem,
        historicoParaLlm,
        {
          perfil: contextoCliente?.perfil,
          resumoCompras: this.resumirCompras(contextoCliente),
        }
      );

      const intencaoResumida = this.resumirIntencao(intencao);

      // Esclarecimento tem prioridade máxima — resposta imediata sem RAG
      if (intencao.precisaEsclarecer) {
        return this.processarChatEsclarecimento(
          dados,
          intencao,
          contextoCliente,
          historicoGemini,
          contextoTurno,
          inicio,
          intencaoResumida
        );
      }

      // Despacho por tipo de intenção — sem switch/case (regra U2)
      const despachoChat: Record<TipoIntencaoRecomendacao, () => Promise<IChatResponseDTO>> = {
        pos_venda: () =>
          this.processarChatPosvenda(
            dados, intencao, contextoCliente, historicoGemini, contextoTurno, inicio, intencaoResumida
          ),
        tendencias: () =>
          this.processarChatTendencias(
            dados, intencao, contextoCliente, historicoGemini, contextoTurno, inicio, intencaoResumida
          ),
        informacao: () =>
          this.processarChatInformacao(
            dados, contextoCliente, historicoGemini, contextoTurno, inicio, intencaoResumida
          ),
        comparativo: () =>
          this.processarChatComparativo(
            dados, intencao, contextoCliente, historicoGemini, contextoTurno, inicio, intencaoResumida
          ),
        recomendacao: () =>
          this.processarChatRecomendacao(
            dados, intencao, contextoCliente, historicoGemini, contextoTurno, inicio, intencaoResumida
          ),
        esclarecimento: () =>
          this.processarChatRecomendacao(
            dados, intencao, contextoCliente, historicoGemini, contextoTurno, inicio, intencaoResumida
          ),
        conversa: () =>
          this.processarChatRecomendacao(
            dados, intencao, contextoCliente, historicoGemini, contextoTurno, inicio, intencaoResumida
          ),
      };

      return despachoChat[intencao.tipo]();
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoRecomendacaoApplication] Erro no chat: ${mensagem}`);
      throw erro;
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
    intencaoResumida: string
  ): Promise<IChatResponseDTO> {
    const respostaEsclarecimento = await this.adapterLangChain.gerarRespostaChat(
      dados.mensagem,
      'Nenhum dado disponível — modo esclarecimento.',
      historicoGemini,
      {
        modoEsclarecimento: true,
        perguntasFollowUp: intencao.perguntasEsclarecimento,
        perfil: contextoCliente?.perfil,
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
    intencaoResumida: string
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
    intencaoResumida: string
  ): Promise<IChatResponseDTO> {
    const [tendenciasCategoria, tendenciasFaixa] = await Promise.all([
      this.repositorioTendencias.buscarTendenciasPorCategoria(
        intencao.generos.length > 0 ? intencao.generos : undefined
      ),
      this.repositorioTendencias.buscarTendenciasPorFaixaEtaria(),
    ]);

    const limiteRag = this.obterLimiteProdutosChat(intencao, 5);
    const intencaoSemFiltroGenero = this.intencaoApenasBuscaSemantica(intencao);
    let produtosDTO = await this.buscarProdutosChat(
      dados,
      intencao,
      contextoCliente,
      contextoTurno,
      limiteRag,
      intencaoSemFiltroGenero
    );

    if (produtosDTO.length === 0) {
      const resultadoFallback = await this.executarPipelineRecomendacao(
        dados.mensagem,
        contextoCliente,
        { intencao: intencaoSemFiltroGenero, limite: limiteRag }
      );
      produtosDTO = this.removerDuplicatasEOrdenar(resultadoFallback.produtos, limiteRag);
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
    intencaoResumida: string
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
    intencaoResumida: string
  ): Promise<IChatResponseDTO> {
    const limite = this.obterLimiteProdutosChat(intencao, 4);
    let produtosDTO: ProdutoRecomendadoDTO[] = [];

    if (intencao.comparar && intencao.comparar.length >= 2) {
      const produtosBrutos = await this.recomendarComparativo(intencao, contextoCliente, limite);
      produtosDTO = this.removerDuplicatasEOrdenar(produtosBrutos, limite);
    } else {
      produtosDTO = await this.buscarProdutosChat(
        dados,
        intencao,
        contextoCliente,
        contextoTurno,
        limite
      );
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
    intencaoResumida: string
  ): Promise<IChatResponseDTO> {
    const limite = this.obterLimiteProdutosChat(intencao, 4);
    const produtosDTO = await this.buscarProdutosChat(
      dados,
      intencao,
      contextoCliente,
      contextoTurno,
      limite
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
      },
      intencao,
      contextoTurno
    );
  }

  private async executarPipelineRecomendacao(
    query: string,
    contextoCliente: IContextoRecomendacao | null,
    opcoes: OpcoesRecomendacaoInterna
  ): Promise<RecomendacaoResultado> {
    const queryEmbedding = await this.gerarEmbeddingQuery(query);
    const produtosExistentes = await this.buscarTodosProdutosExistentes();
    const limite = opcoes.limite ?? opcoes.intencao?.quantidadeLivros ?? 5;
    const usarMMR = limite > 1;

    const resultadoRag = await this.servicoRecomendacaoRAG.gerarRecomendacao(
      query,
      queryEmbedding,
      contextoCliente,
      produtosExistentes,
      Math.max(limite * 2, 10),
      usarMMR
    );

    const filtros = opcoes.intencao
      ? this.servicoFiltroCatalogo.filtrosDeIntencao(opcoes.intencao)
      : {};
    let { produtos: produtosFiltrados } = this.servicoFiltroCatalogo.aplicar(
      resultadoRag.produtos,
      filtros
    );

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
    };
  }

  private async buscarProdutosChat(
    dados: IChatRequestDTO,
    intencao: IntencaoRecomendacao,
    contextoCliente: IContextoRecomendacao | null,
    contextoTurno: ContextoTurnoConversa,
    limite: number,
    intencaoBusca?: IntencaoRecomendacao
  ): Promise<ProdutoRecomendadoDTO[]> {
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
      }
    );

    return this.removerDuplicatasEOrdenar(resultado.produtos, limite);
  }

  private finalizarRespostaChat(
    base: Omit<IChatResponseDTO, 'perguntasFollowUp' | 'numeroTurno'>,
    intencao: IntencaoRecomendacao,
    contextoTurno: ContextoTurnoConversa
  ): IChatResponseDTO {
    return {
      ...base,
      numeroTurno: contextoTurno.numeroTurno,
      perguntasFollowUp: this.servicoContextoConversa.gerarPerguntasFollowUp(
        intencao,
        contextoTurno,
        base.produtosRecomendados.length
      ),
    };
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

  private montarQueryEnriquecida(
    queryBase: string,
    intencao: IntencaoRecomendacao,
    contexto: IContextoRecomendacao | null
  ): string {
    const partes = [queryBase];

    if (intencao.generos.length > 0) {
      partes.push(`Gêneros: ${intencao.generos.join(', ')}`);
    }
    if (intencao.publicoAlvo) {
      partes.push(`Público: ${intencao.publicoAlvo}`);
    }
    if (intencao.precoMax !== undefined) {
      partes.push(`Preço até R$ ${intencao.precoMax}`);
    }
    if (contexto?.preferencias.categorias.length) {
      partes.push(`Preferências: ${contexto.preferencias.categorias.join(', ')}`);
    }
    if (contexto?.perfil?.estado) {
      partes.push(`Região: ${contexto.perfil.estado}`);
    }

    return partes.join('. ');
  }

  private normalizarHistorico(historico?: MensagemChatDTO[]): MensagemChatDTO[] | undefined {
    if (!historico) {
      return undefined;
    }

    return historico.map((msg) => ({
      conteudo: msg.conteudo,
      papel: this.normalizarPapelMensagem(msg),
      timestamp: msg.timestamp,
      produtosMencionados: msg.produtosMencionados,
    }));
  }

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
    return 'user';
  }

  private converterHistoricoGemini(
    historico?: MensagemChatDTO[],
    mensagemAtual?: string
  ): HistoricoGemini {
    if (!historico?.length) {
      return undefined;
    }

    const mensagemAtualNorm = mensagemAtual?.trim();
    const filtrado = historico.filter((msg) => {
      if (!mensagemAtualNorm) {
        return true;
      }
      const ehUsuario = this.normalizarPapelMensagem(msg) === 'user';
      return !(ehUsuario && msg.conteudo.trim() === mensagemAtualNorm);
    });

    if (filtrado.length === 0) {
      return undefined;
    }

    return filtrado.map((msg) => ({
      papel: this.normalizarPapelMensagem(msg) === 'assistant' ? 'model' : 'user',
      conteudo: msg.conteudo,
    }));
  }

  private resumirCompras(contexto: IContextoRecomendacao | null): string | undefined {
    if (!contexto || contexto.historicoCompras.length === 0) {
      return undefined;
    }
    return contexto.historicoCompras
      .slice(0, 5)
      .map((c) => `${c.titulo} (${c.categoria})`)
      .join('; ');
  }

  private resumirIntencao(intencao: IntencaoRecomendacao): string {
    const partes = [intencao.tipo];
    if (intencao.generos.length) {
      partes.push(intencao.generos.join(', '));
    }
    if (intencao.precoMax) {
      partes.push(`até R$${intencao.precoMax}`);
    }
    return partes.join(' · ');
  }

  private async gerarEmbeddingQuery(query: string): Promise<number[]> {
    return this.adapterLangChain.gerarEmbedding(query);
  }

  private async obterContextoCliente(
    clienteUuid?: string
  ): Promise<IContextoRecomendacao | null> {
    if (!clienteUuid) {
      return null;
    }
    return this.repositorioContextoCliente.buscarContexto(clienteUuid);
  }

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
}
