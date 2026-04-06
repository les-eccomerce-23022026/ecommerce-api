import { v4 as uuidv4 } from 'uuid';
import { IRepositorioPagamentos, IPagamento } from './IRepositorioPagamentos';
import type { IRepositorioVendas } from '@/modules/vendas/repositories/IRepositorioVendas';
import { IPagamentoInputDto, IResultadoDefinirMetodoLiquidacao, PARCELAS_CARTAO_MAX } from './IPagamento.dto';
import { FormaPagamento, TipoPagamento } from './FormaPagamento';
import { CartaoCredito } from './CartaoCredito';
import { StatusPagamento } from './IPagamento';
import type { IProvedorPagamento } from './provedoresPagamento/IProvedorPagamento';
import type { ResultadoIntencaoPagamento } from './provedoresPagamento/DadosConfirmacaoProvedor';
import type {
  IRepositorioIntencaoPagamento,
  IntencaoPagamentoPersistida
} from './intencaoPagamento/IRepositorioIntencaoPagamento';
import { extrairCheckoutPagamento } from './extracaoPagamentoCheckout';
import { gerarDadosCobrancaPixSimulada } from './pix/gerarCobrancaPixSimulada';

/**
 * Serviço responsável pela lógica de negócios dos pagamentos.
 */
export class ServicoPagamentos {
  private readonly repositorioPagamentos: IRepositorioPagamentos;

  private readonly provedorPagamento: IProvedorPagamento;

  private readonly repositorioIntencao: IRepositorioIntencaoPagamento;

  private readonly repositorioVendas: IRepositorioVendas;

  constructor(
    repositorioPagamentos: IRepositorioPagamentos,
    provedorPagamento: IProvedorPagamento,
    repositorioIntencao: IRepositorioIntencaoPagamento,
    repositorioVendas: IRepositorioVendas
  ) {
    this.repositorioPagamentos = repositorioPagamentos;
    this.provedorPagamento = provedorPagamento;
    this.repositorioIntencao = repositorioIntencao;
    this.repositorioVendas = repositorioVendas;
  }

  /**
   * Registra intenção de pagamento no provedor externo (valor travado para confirmação posterior).
   */
  public async registrarIntencaoPagamento(valorTotal: number): Promise<ResultadoIntencaoPagamento> {
    if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
      throw new Error('Valor total da intenção de pagamento deve ser positivo');
    }
    return this.provedorPagamento.registrarIntencaoPagamento(valorTotal);
  }

  /**
   * Associa uma intenção em estado CRIADA (sem venda) ao `ven_id` da venda informada.
   */
  public async vincularIntencaoVenda(inpUuid: string, vendaUuid: string): Promise<void> {
    const id = inpUuid?.trim();
    const vId = vendaUuid?.trim();
    if (!id || !vId) {
      throw new Error('Identificadores da intenção e da venda são obrigatórios');
    }
    const venId = await this.repositorioPagamentos.obterVenIdPorVendaUuid(vId);
    if (venId === null) {
      throw new Error('Venda não encontrada');
    }
    const ok = await this.repositorioIntencao.vincularVenda(id, venId);
    if (!ok) {
      throw new Error('Intenção não encontrada, já vinculada ou não está disponível para vínculo');
    }
  }

  /**
   * Seleciona e valida forma de pagamento para uma venda.
   * PIX: cria cobrança simulada (copia-e-cola, QR, expiração) e aguarda webhook.
   */
  public async definirMetodoLiquidacao(dados: IPagamentoInputDto): Promise<IResultadoDefinirMetodoLiquidacao> {
    ServicoPagamentos.validarDadosPagamento(dados);

    let detalhesAux: string | undefined;
    if (dados.tipoPagamento === TipoPagamento.PIX) {
      detalhesAux = dados.detalhesCupom ?? `PIX-${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    } else if (dados.tipoPagamento === TipoPagamento.CARTAO_CREDITO) {
      const p = dados.parcelasCartao ?? 1;
      detalhesAux = `parcelas:${p}`;
    } else {
      detalhesAux = dados.detalhesCupom;
    }

    const formaPagamento = new FormaPagamento(dados.tipoPagamento, detalhesAux);
    let cartao: CartaoCredito | undefined;

    if (formaPagamento.isCartao()) {
      if (!dados.cartao) {
        throw new Error('Dados do cartão são obrigatórios para pagamento com cartão');
      }
      cartao = new CartaoCredito(
        dados.cartao.numero,
        dados.cartao.nomeTitular,
        dados.cartao.validade,
        dados.cartao.bandeira
      );
    } else if (dados.cartao) {
      throw new Error('Cartão não deve ser enviado para este tipo de pagamento');
    }

    await ServicoPagamentos.validarRegrasNegocio(formaPagamento, dados.vendaUuid, dados.valor);

    const pagamento: IPagamento = {
      id: uuidv4(),
      vendaUuid: dados.vendaUuid,
      valor: dados.valor,
      formaPagamento,
      cartao,
      status: StatusPagamento.PENDENTE,
      criadoEm: new Date()
    };

    const salvo = await this.repositorioPagamentos.cadastrar(pagamento);

    if (formaPagamento.isPix()) {
      const pix = gerarDadosCobrancaPixSimulada(dados.valor);
      const pagId = await this.repositorioPagamentos.obterPagIdInternoPorUuid(salvo.id);
      if (pagId === null) {
        throw new Error('Falha ao obter pagamento para cobrança PIX');
      }
      await this.repositorioPagamentos.inserirPixSimulado(pagId, {
        copiaCola: pix.copiaCola,
        qrBase64: pix.qrBase64,
        expiraEm: pix.expiraEm,
        segredoConfirmacao: pix.segredoConfirmacao
      });
      await this.sincronizarStatusVendaAposPagamentos(dados.vendaUuid);
      return {
        pagamento: salvo,
        pixCobranca: {
          copiaCola: pix.copiaCola,
          qrCodeBase64: pix.qrBase64,
          expiraEm: pix.expiraEm,
          segredoConfirmacao: pix.segredoConfirmacao
        }
      };
    }

    return { pagamento: salvo };
  }

  /**
   * Processa o pagamento via provedor externo (ex.: simulado ou Stripe).
   */
  public async solicitarAutorizacaoFinanceira(pagamentoUuid: string): Promise<IPagamento> {
    const pagamento = await this.repositorioPagamentos.obterPorUuid(pagamentoUuid);
    if (!pagamento) {
      throw new Error('Pagamento não encontrado');
    }

    if (pagamento.status !== StatusPagamento.PENDENTE) {
      throw new Error('Pagamento já processado');
    }

    if (pagamento.formaPagamento.getTipo() === TipoPagamento.PIX) {
      throw new Error(
        'PIX aguarda confirmação do provedor. Use o webhook ou aguarde a liquidação assíncrona.'
      );
    }

    const resultado = await this.provedorPagamento.confirmarPagamento({
      valorTotal: pagamento.valor,
      confirmacaoServicoInterna: true
    });

    const statusFinal = resultado.sucesso ? StatusPagamento.APROVADO : StatusPagamento.RECUSADO;

    const pagamentoAtualizado = {
      ...pagamento,
      status: statusFinal,
      processadoEm: new Date()
    };

    const atualizado = await this.repositorioPagamentos.atualizar(pagamentoUuid, pagamentoAtualizado);
    await this.sincronizarStatusVendaAposPagamentos(pagamento.vendaUuid);
    return atualizado;
  }

  /**
   * Confirma liquidação PIX simulada (equivalente ao webhook do PSP).
   */
  public async confirmarPagamentoPixWebhook(
    pagamentoUuid: string,
    segredoConfirmacao: string
  ): Promise<IPagamento> {
    const pagamento = await this.repositorioPagamentos.obterPorUuid(pagamentoUuid);
    if (!pagamento) {
      throw new Error('Pagamento não encontrado');
    }
    if (pagamento.formaPagamento.getTipo() !== TipoPagamento.PIX) {
      throw new Error('Pagamento não é PIX');
    }
    if (pagamento.status !== StatusPagamento.PENDENTE) {
      throw new Error('Pagamento PIX já processado');
    }
    const pix = await this.repositorioPagamentos.obterPixSimuladoPorPagUuid(pagamentoUuid);
    if (!pix) {
      throw new Error('Cobrança PIX não encontrada');
    }
    if (pix.segredoConfirmacao !== segredoConfirmacao) {
      throw new Error('Segredo de confirmação inválido');
    }
    if (Date.now() > pix.expiraEm.getTime()) {
      const recusado = {
        ...pagamento,
        status: StatusPagamento.RECUSADO,
        processadoEm: new Date()
      };
      await this.repositorioPagamentos.atualizar(pagamentoUuid, recusado);
      await this.sincronizarStatusVendaAposPagamentos(pagamento.vendaUuid);
      throw new Error('Cobrança PIX expirada');
    }

    const aprovado = {
      ...pagamento,
      status: StatusPagamento.APROVADO,
      processadoEm: new Date()
    };
    const salvo = await this.repositorioPagamentos.atualizar(pagamentoUuid, aprovado);
    await this.sincronizarStatusVendaAposPagamentos(pagamento.vendaUuid);
    return salvo;
  }

  /**
   * Resumo para polling no checkout (cliente dono da venda).
   */
  public async obterResumoPagamentosVenda(
    vendaUuid: string,
    usuarioUuidCliente: string
  ): Promise<{
    vendaStatus: string;
    aguardandoPix: boolean;
    pagamentos: Array<{
      id: string;
      tipo: TipoPagamento;
      status: StatusPagamento;
      valor: number;
      pixExpiraEm?: string;
    }>;
  }> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda || venda.usuarioUuid !== usuarioUuidCliente) {
      throw new Error('Venda não encontrada');
    }
    const pagamentos = await this.repositorioPagamentos.listarPorVenda(vendaUuid);
    const aguardandoPix = pagamentos.some(
      (p) => p.formaPagamento.getTipo() === TipoPagamento.PIX && p.status === StatusPagamento.PENDENTE
    );
    const detalhes = await Promise.all(
      pagamentos.map(async (p) => {
        const base = {
          id: p.id,
          tipo: p.formaPagamento.getTipo(),
          status: p.status,
          valor: p.valor
        };
        if (p.formaPagamento.getTipo() === TipoPagamento.PIX && p.status === StatusPagamento.PENDENTE) {
          const pix = await this.repositorioPagamentos.obterPixSimuladoPorPagUuid(p.id);
          return {
            ...base,
            ...(pix ? { pixExpiraEm: pix.expiraEm.toISOString() } : {})
          };
        }
        return base;
      })
    );
    return {
      vendaStatus: venda.status,
      aguardandoPix,
      pagamentos: detalhes
    };
  }

  private async sincronizarStatusVendaAposPagamentos(vendaUuid: string): Promise<void> {
    const pagamentos = await this.repositorioPagamentos.listarPorVenda(vendaUuid);
    if (pagamentos.length === 0) {
      return;
    }

    const temRecusado = pagamentos.some((p) => p.status === StatusPagamento.RECUSADO);
    if (temRecusado) {
      await this.repositorioVendas.atualizarStatus(vendaUuid, 'REPROVADA');
      return;
    }

    const temPixPendente = pagamentos.some(
      (p) => p.formaPagamento.getTipo() === TipoPagamento.PIX && p.status === StatusPagamento.PENDENTE
    );
    if (temPixPendente) {
      await this.repositorioVendas.atualizarStatus(vendaUuid, 'AGUARDANDO PAGAMENTO');
      return;
    }

    const todosSatisfeitos = pagamentos.every((p) => ServicoPagamentos.pagamentoSatisfeitoParaVenda(p));
    if (todosSatisfeitos) {
      await this.repositorioVendas.atualizarStatus(vendaUuid, 'APROVADA');
    }
  }

  private static pagamentoSatisfeitoParaVenda(p: IPagamento): boolean {
    const tipo = p.formaPagamento.getTipo();
    if (tipo === TipoPagamento.CUPOM_PROMOCIONAL || tipo === TipoPagamento.CUPOM_TROCA) {
      return p.status === StatusPagamento.PENDENTE || p.status === StatusPagamento.APROVADO;
    }
    if (tipo === TipoPagamento.PIX) {
      return p.status === StatusPagamento.APROVADO;
    }
    if (tipo === TipoPagamento.CARTAO_CREDITO) {
      return p.status === StatusPagamento.APROVADO;
    }
    return false;
  }

  /**
   * Confirma autorização financeira no fluxo de checkout (payload agregado + intenção prévia).
   * Com `vendaUuid` e aprovação, persiste `pagamento` com `inp_id` da intenção.
   */
  public async confirmarAutorizacaoFinanceiraCheckout(corpo: Record<string, unknown>): Promise<{
    sucesso: boolean;
    statusTexto: 'APROVADA' | 'REPROVADA';
    pagamentoUuid?: string;
  }> {
    const { idIntencao, segredoConfirmacao, valorTotal, pagamentosCartao, vendaUuid } =
      extrairCheckoutPagamento(corpo);

    const registroIntencao = await this.repositorioIntencao.obterPorUuid(idIntencao);
    if (registroIntencao === null) {
      throw new Error('Intenção de pagamento não encontrada');
    }
    ServicoPagamentos.validarVinculoVendaCheckout(registroIntencao, vendaUuid);

    const resultado = await this.provedorPagamento.confirmarPagamento({
      valorTotal,
      pagamentosCartao,
      idIntencao,
      segredoConfirmacao
    });

    const pagamentoUuid = await this.persistirPagamentoCheckoutAprovado({
      resultado,
      vendaUuid,
      valorTotal,
      registroIntencao,
      pagamentosCartao,
    });

    if (resultado.sucesso && vendaUuid?.trim()) {
      await this.sincronizarStatusVendaAposPagamentos(vendaUuid.trim());
    }

    return {
      sucesso: resultado.sucesso,
      statusTexto: resultado.sucesso ? 'APROVADA' : 'REPROVADA',
      pagamentoUuid
    };
  }

  private static validarVinculoVendaCheckout(
    registro: IntencaoPagamentoPersistida,
    vendaUuid?: string
  ): void {
    if (registro.venId === null) {
      return;
    }
    if (!vendaUuid) {
      throw new Error('vendaUuid é obrigatório para esta intenção');
    }
    if (registro.vendaUuid !== vendaUuid) {
      throw new Error('vendaUuid não confere com a venda vinculada à intenção');
    }
  }

  private async persistirPagamentoCheckoutAprovado(dados: {
    resultado: { sucesso: boolean };
    vendaUuid?: string;
    valorTotal: number;
    registroIntencao: IntencaoPagamentoPersistida;
    pagamentosCartao?: Array<{ valor: number; parcelasCartao?: number }>;
  }): Promise<string | undefined> {
    if (!dados.resultado.sucesso || !dados.vendaUuid) {
      return undefined;
    }
    const venExiste = await this.repositorioPagamentos.obterVenIdPorVendaUuid(dados.vendaUuid);
    if (venExiste === null) {
      throw new Error('Venda não encontrada');
    }
    const parcelasResumo = (dados.pagamentosCartao ?? [])
      .map((p) => p.parcelasCartao ?? 1)
      .join('|');
    const detalhesCheckout =
      parcelasResumo.length > 0 ? `parcelas:${parcelasResumo}` : 'parcelas:1';
    const pagamento: IPagamento = {
      id: uuidv4(),
      vendaUuid: dados.vendaUuid,
      valor: dados.valorTotal,
      formaPagamento: new FormaPagamento(TipoPagamento.CARTAO_CREDITO, detalhesCheckout),
      status: StatusPagamento.APROVADO,
      criadoEm: new Date(),
      processadoEm: new Date()
    };
    const salvo = await this.repositorioPagamentos.cadastrar(pagamento, {
      inpIdIntencao: dados.registroIntencao.inpId
    });
    return salvo.id;
  }

  /**
   * Consulta pagamento por UUID.
   */
  public async consultarPagamento(pagamentoUuid: string): Promise<IPagamento> {
    const pagamento = await this.repositorioPagamentos.obterPorUuid(pagamentoUuid);
    if (!pagamento) {
      throw new Error('Pagamento não encontrado');
    }
    return pagamento;
  }

  private static validarDadosPagamento(dados: IPagamentoInputDto): void {
    if (!dados.vendaUuid) {
      throw new Error('UUID da venda é obrigatório');
    }
    if (dados.valor <= 0) {
      throw new Error('Valor do pagamento deve ser positivo');
    }
    if (!Object.values(TipoPagamento).includes(dados.tipoPagamento)) {
      throw new Error('Tipo de pagamento inválido');
    }
    if (dados.parcelasCartao != null) {
      if (dados.tipoPagamento !== TipoPagamento.CARTAO_CREDITO) {
        throw new Error('parcelasCartao só se aplica a cartão de crédito');
      }
      const n = Number(dados.parcelasCartao);
      if (!Number.isInteger(n) || n < 1 || n > PARCELAS_CARTAO_MAX) {
        throw new Error(`parcelasCartao deve ser inteiro entre 1 e ${PARCELAS_CARTAO_MAX}`);
      }
    }
  }

  private static async validarRegrasNegocio(
    formaPagamento: FormaPagamento,
    _vendaUuid: string,
    valor: number
  ): Promise<void> {
    if (formaPagamento.isCupomPromocional()) {
      const codigoCupom = formaPagamento.getDetalhes();
      if (!codigoCupom) {
        throw new Error('Código do cupom promocional é obrigatório');
      }
      if (!ServicoPagamentos.validarCupomPromocional(codigoCupom, valor)) {
        throw new Error('Cupom promocional inválido ou expirado');
      }
    }

    if (formaPagamento.isCupomTroca()) {
      const codigoCupom = formaPagamento.getDetalhes();
      if (!codigoCupom) {
        throw new Error('Código do cupom de troca é obrigatório');
      }
      if (!ServicoPagamentos.validarCupomTroca(codigoCupom, valor)) {
        throw new Error('Cupom de troca insuficiente ou inválido');
      }
    }

    if (formaPagamento.isPix()) {
      if (valor < 10) {
        throw new Error('Valor mínimo por linha PIX é R$ 10,00');
      }
    }
  }

  private static validarCupomPromocional(codigo: string, valor: number): boolean {
    return codigo === 'DESCONTO10' && valor > 0;
  }

  private static validarCupomTroca(codigo: string, valor: number): boolean {
    return codigo === 'TROCA50' && valor <= 50;
  }
}
