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
import { ServicoFiltroCatalogo } from '../../domain/services/ServicoFiltroCatalogo';
import { AdapterLangChainGemini } from '../../infrastructure/config/AdapterLangChainGemini';
import { IContextoRecomendacao } from '../../domain/entities/IContextoRecomendacao.entity';
import { IntencaoRecomendacao } from '../../domain/entities/IntencaoRecomendacao.entity';
import {
  IRecomendarRequestDTO,
  IRecomendarResponseDTO,
  IChatRequestDTO,
  IChatResponseDTO,
  ProdutoRecomendadoDTO,
  MensagemChatDTO,
} from '../dtos/IRecomendacaoDTO';
import { Logger } from '@/shared/utils/Logger.util';
import { ServicoIndexacaoProdutos } from './ServicoIndexacaoProdutos';
import { ServicoLivros } from '@/modules/livros/servicoLivros';
import { ServicoInterpretacaoIntencao } from './ServicoInterpretacaoIntencao';

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
}

/**
 * Serviço de Aplicação para Recomendação
 *
 * Orquestra interpretação de intenção, RAG, filtros estruturados e chat Gemini.
 */
export class ServicoRecomendacaoApplication {
  private readonly servicoFiltroCatalogo = new ServicoFiltroCatalogo();

  constructor(
    private repositorioEmbedding: IRepositorioEmbedding,
    private repositorioContextoCliente: IRepositorioContextoCliente,
    private repositorioMetricasRecomendacao: IRepositorioMetricasRecomendacao,
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
      const contextoCliente = await this.obterContextoCliente(dados.clienteUuid);

      const intencao = await this.servicoInterpretacaoIntencao.interpretar(
        dados.mensagem,
        historicoNormalizado,
        {
          perfil: contextoCliente?.perfil,
          resumoCompras: this.resumirCompras(contextoCliente),
        }
      );

      const intencaoResumida = this.resumirIntencao(intencao);

      if (intencao.precisaEsclarecer) {
        const respostaEsclarecimento = await this.adapterLangChain.gerarRespostaChat(
          dados.mensagem,
          'Nenhum livro — modo esclarecimento.',
          this.converterHistoricoGemini(historicoNormalizado),
          {
            modoEsclarecimento: true,
            perguntasFollowUp: intencao.perguntasEsclarecimento,
            perfil: contextoCliente?.perfil,
          }
        );

        return {
          resposta: respostaEsclarecimento,
          produtosRecomendados: [],
          contextoUsado: contextoCliente !== null,
          tempoRespostaMs: Date.now() - inicio,
          tipoResposta: 'esclarecimento',
          perguntasFollowUp: intencao.perguntasEsclarecimento,
          intencaoResumida,
        };
      }

      const limite = intencao.quantidadeLivros || 5;
      let produtosBrutos: ProdutoRecomendado[] = [];

      if (intencao.tipo === 'comparativo' && intencao.comparar && intencao.comparar.length >= 2) {
        produtosBrutos = await this.recomendarComparativo(
          intencao,
          contextoCliente,
          limite
        );
      } else {
        const queryEnriquecida = this.montarQueryEnriquecida(
          intencao.queryBusca || dados.mensagem,
          intencao,
          contextoCliente
        );
        const resultado = await this.executarPipelineRecomendacao(
          queryEnriquecida,
          contextoCliente,
          { intencao, limite }
        );
        produtosBrutos = resultado.produtos;
      }

      const produtosDTO = this.removerDuplicatasEOrdenar(produtosBrutos, limite);
      const contextoChat = this.construirContextoChat(produtosDTO);

      const resposta = await this.adapterLangChain.gerarRespostaChat(
        dados.mensagem,
        contextoChat,
        this.converterHistoricoGemini(historicoNormalizado),
        { perfil: contextoCliente?.perfil }
      );

      return {
        resposta,
        produtosRecomendados: produtosDTO,
        contextoUsado: contextoCliente !== null,
        tempoRespostaMs: Date.now() - inicio,
        tipoResposta: 'recomendacao',
        intencaoResumida,
      };
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      Logger.error(`[ServicoRecomendacaoApplication] Erro no chat: ${mensagem}`);
      throw erro;
    }
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
    const { produtos: produtosFiltrados } = this.servicoFiltroCatalogo.aplicar(
      resultadoRag.produtos,
      filtros
    );

    return {
      ...resultadoRag,
      produtos: produtosFiltrados.slice(0, limite),
      query: opcoes.queryTexto ?? query,
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
    historico?: MensagemChatDTO[]
  ): { papel: 'user' | 'model'; conteudo: string }[] | undefined {
    return historico?.map((msg) => ({
      papel: msg.papel === 'assistant' ? 'model' : 'user',
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
