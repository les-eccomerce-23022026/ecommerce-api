import { v4 as uuidv4 } from 'uuid';
import { IRepositorioPagamentos, IPagamento } from './IRepositorioPagamentos';
import { IPagamentoInputDto } from './IPagamento.dto';
import { FormaPagamento, TipoPagamento } from './FormaPagamento';
import { CartaoCredito } from './CartaoCredito';
import { StatusPagamento } from './IPagamento';
import type { IProvedorPagamento } from './provedoresPagamento/IProvedorPagamento';
import type { ResultadoIntencaoPagamento } from './provedoresPagamento/DadosConfirmacaoProvedor';
import type {
  IRepositorioIntencaoPagamento,
  IntencaoPagamentoPersistida
} from './intencaoPagamento/IRepositorioIntencaoPagamento';
import { extrairCheckoutPagamento } from './checkoutExtracao';

/**
 * Serviço responsável pela lógica de negócios dos pagamentos.
 */
export class ServicoPagamentos {
  private readonly repositorioPagamentos: IRepositorioPagamentos;

  private readonly provedorPagamento: IProvedorPagamento;

  private readonly repositorioIntencao: IRepositorioIntencaoPagamento;

  constructor(
    repositorioPagamentos: IRepositorioPagamentos,
    provedorPagamento: IProvedorPagamento,
    repositorioIntencao: IRepositorioIntencaoPagamento
  ) {
    this.repositorioPagamentos = repositorioPagamentos;
    this.provedorPagamento = provedorPagamento;
    this.repositorioIntencao = repositorioIntencao;
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
   */
  public async definirMetodoLiquidacao(dados: IPagamentoInputDto): Promise<IPagamento> {
    ServicoPagamentos.validarDadosPagamento(dados);

    const formaPagamento = new FormaPagamento(dados.tipoPagamento, dados.detalhesCupom);
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

    return this.repositorioPagamentos.cadastrar(pagamento);
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

    return this.repositorioPagamentos.atualizar(pagamentoUuid, pagamentoAtualizado);
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
      registroIntencao
    });

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
  }): Promise<string | undefined> {
    if (!dados.resultado.sucesso || !dados.vendaUuid) {
      return undefined;
    }
    const venExiste = await this.repositorioPagamentos.obterVenIdPorVendaUuid(dados.vendaUuid);
    if (venExiste === null) {
      throw new Error('Venda não encontrada');
    }
    const pagamento: IPagamento = {
      id: uuidv4(),
      vendaUuid: dados.vendaUuid,
      valor: dados.valorTotal,
      formaPagamento: new FormaPagamento(TipoPagamento.CARTAO_CREDITO, undefined),
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
  }

  private static validarCupomPromocional(codigo: string, valor: number): boolean {
    return codigo === 'DESCONTO10' && valor > 0;
  }

  private static validarCupomTroca(codigo: string, valor: number): boolean {
    return codigo === 'TROCA50' && valor <= 50;
  }
}
