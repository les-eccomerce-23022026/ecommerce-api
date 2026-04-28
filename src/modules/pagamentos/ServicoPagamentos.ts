import { v4 as uuidv4 } from 'uuid';
import type { IRepositorioVendas } from '@/modules/vendas/repositories/IRepositorioVendas';
import { CartaoCredito } from './CartaoCredito';
import { extrairCheckoutPagamento } from './extracaoPagamentoCheckout';
import { FormaPagamento, TipoPagamento } from './FormaPagamento';
import { IntencaoPagamentoPersistida, IRepositorioIntencaoPagamento } from './intencaoPagamento/IRepositorioIntencaoPagamento';
import { StatusPagamento } from './IPagamento';
import { IPagamentoInputDto, IResultadoDefinirMetodoLiquidacao } from './IPagamento.dto';
import { IPagamento, IRepositorioPagamentos } from './IRepositorioPagamentos';
import type { ResultadoConfirmacaoPagamento, ResultadoIntencaoPagamento } from './provedoresPagamento/DadosConfirmacaoProvedor';
import type { IProvedorPagamento } from './provedoresPagamento/IProvedorPagamento';
import { ServicoPixPagamentos } from './ServicoPixPagamentos';
import { ServicoValidacaoPagamentos } from './ServicoValidacaoPagamentos';

interface DadosCheckoutAprovado {
  resultado: ResultadoConfirmacaoPagamento;
  vendaUuid?: string;
  valorTotal: number;
  registroIntencao: IntencaoPagamentoPersistida;
  pagamentosCartao: Array<{ valor: number; parcelasCartao?: number }>;
}

export class ServicoPagamentos {
  private readonly repositorioPagamentos: IRepositorioPagamentos;

  private readonly provedorPagamento: IProvedorPagamento;

  private readonly repositorioIntencao: IRepositorioIntencaoPagamento;

  private readonly repositorioVendas: IRepositorioVendas;

  private readonly servicoPix: ServicoPixPagamentos;

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
    this.servicoPix = new ServicoPixPagamentos(repositorioPagamentos);
  }

  public async registrarIntencaoPagamento(valorTotal: number): Promise<ResultadoIntencaoPagamento> {
    if (!Number.isFinite(valorTotal) || valorTotal <= 0) throw new Error('Valor total da intenção de pagamento deve ser positivo');
    return this.provedorPagamento.registrarIntencaoPagamento(valorTotal);
  }

  public async vincularIntencaoVenda(inpUuid: string, vendaUuid: string): Promise<void> {
    const id = inpUuid?.trim();
    const vId = vendaUuid?.trim();
    if (!id || !vId) throw new Error('Identificadores da intenção e da venda são obrigatórios');
    const venId = await this.repositorioPagamentos.obterVenIdPorVendaUuid(vId);
    if (venId === null) throw new Error('Venda não encontrada');
    if (!(await this.repositorioIntencao.vincularVenda(id, venId))) throw new Error('Intenção não encontrada ou indisponível');
  }

  public async definirMetodoLiquidacao(dados: IPagamentoInputDto): Promise<IResultadoDefinirMetodoLiquidacao> {
    ServicoValidacaoPagamentos.validarDadosPagamento(dados);
    const formaPagamento = new FormaPagamento(dados.tipoPagamento, ServicoPagamentos.extrairDetalhesPagamento(dados));
    const cartao = ServicoPagamentos.criarCartaoSeNecessario(formaPagamento, dados.cartao);
    await ServicoValidacaoPagamentos.validarRegrasNegocio(formaPagamento, dados.vendaUuid, dados.valor);
    const salvo = await this.repositorioPagamentos.cadastrar({
      id: uuidv4(), vendaUuid: dados.vendaUuid, valor: dados.valor, formaPagamento, cartao,
      status: StatusPagamento.PENDENTE, criadoEm: new Date()
    });
    if (formaPagamento.isPix()) {
      const res = await this.servicoPix.processarCobrancaPix(salvo);
      await this.sincronizarStatusVendaAposPagamentos(dados.vendaUuid);
      return res;
    }
    return { pagamento: salvo };
  }

  private static extrairDetalhesPagamento(dados: IPagamentoInputDto): string | undefined {
    if (dados.tipoPagamento === TipoPagamento.PIX) return dados.detalhesCupom ?? `PIX-${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    if (dados.tipoPagamento === TipoPagamento.CARTAO_CREDITO) return `parcelas:${dados.parcelasCartao ?? 1}`;
    return dados.detalhesCupom;
  }

  private static criarCartaoSeNecessario(forma: FormaPagamento, dadosCartao?: IPagamentoInputDto['cartao']): CartaoCredito | undefined {
    if (forma.isCartao()) {
      if (!dadosCartao) throw new Error('Dados do cartão são obrigatórios');
      return new CartaoCredito(dadosCartao.numero, dadosCartao.nomeTitular, dadosCartao.validade, dadosCartao.bandeira);
    }
    if (dadosCartao) throw new Error('Cartão não deve ser enviado para este tipo de pagamento');
    return undefined;
  }

  public async solicitarAutorizacaoFinanceira(pagamentoUuid: string): Promise<IPagamento> {
    const pagamento = await this.repositorioPagamentos.obterPorUuid(pagamentoUuid);
    if (!pagamento) throw new Error('Pagamento não encontrado');
    if (pagamento.status !== StatusPagamento.PENDENTE) throw new Error('Pagamento já processado');
    if (pagamento.formaPagamento.getTipo() === TipoPagamento.PIX) throw new Error('PIX aguarda confirmação do provedor');
    const ultimosDigitos = pagamento.cartao?.getUltimosDigitos();
    const resultado = await this.provedorPagamento.confirmarPagamento({
      valorTotal: pagamento.valor,
      confirmacaoServicoInterna: true,
      ...(ultimosDigitos ? { cartaoParaSimulacao: { ultimosDigitos } } : {})
    });
    const atualizado = await this.repositorioPagamentos.atualizar(pagamentoUuid, { ...pagamento, status: resultado.sucesso ? StatusPagamento.APROVADO : StatusPagamento.RECUSADO, processadoEm: new Date() });
    await this.sincronizarStatusVendaAposPagamentos(pagamento.vendaUuid);
    return atualizado;
  }

  public async confirmarPagamentoPixWebhook(pagamentoUuid: string, segredoConfirmacao: string): Promise<IPagamento> {
    const pagamento = await this.repositorioPagamentos.obterPorUuid(pagamentoUuid);
    if (!pagamento || pagamento.formaPagamento.getTipo() !== TipoPagamento.PIX || pagamento.status !== StatusPagamento.PENDENTE) throw new Error('Pagamento inválido ou já processado');
    const pix = await this.repositorioPagamentos.obterPixSimuladoPorPagUuid(pagamentoUuid);
    if (!pix || pix.segredoConfirmacao !== segredoConfirmacao) throw new Error('Dados PIX inválidos');
    if (Date.now() > pix.expiraEm.getTime()) {
      await this.repositorioPagamentos.atualizar(pagamentoUuid, { ...pagamento, status: StatusPagamento.RECUSADO, processadoEm: new Date() });
      await this.sincronizarStatusVendaAposPagamentos(pagamento.vendaUuid);
      throw new Error('Cobrança PIX expirada');
    }
    const salvo = await this.repositorioPagamentos.atualizar(pagamentoUuid, { ...pagamento, status: StatusPagamento.APROVADO, processadoEm: new Date() });
    await this.sincronizarStatusVendaAposPagamentos(pagamento.vendaUuid);
    return salvo;
  }

  public async obterResumoPagamentosVenda(vendaUuid: string, usuarioUuidCliente: string) {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda || venda.usuarioUuid !== usuarioUuidCliente) throw new Error('Venda não encontrada');
    const pagamentos = await this.repositorioPagamentos.listarPorVenda(vendaUuid);
    const detalhes = await Promise.all(pagamentos.map(async (p) => {
      const base = { id: p.id, tipo: p.formaPagamento.getTipo(), status: p.status, valor: p.valor };
      if (p.formaPagamento.getTipo() === TipoPagamento.PIX && p.status === StatusPagamento.PENDENTE) {
        const pix = await this.repositorioPagamentos.obterPixSimuladoPorPagUuid(p.id);
        return { ...base, ...(pix ? { pixExpiraEm: pix.expiraEm.toISOString() } : {}) };
      }
      return base;
    }));
    return { vendaStatus: venda.status, aguardandoPix: pagamentos.some(p => p.formaPagamento.isPix() && p.status === StatusPagamento.PENDENTE), pagamentos: detalhes };
  }

  private async sincronizarStatusVendaAposPagamentos(vendaUuid: string): Promise<void> {
    const pagamentos = await this.repositorioPagamentos.listarPorVenda(vendaUuid);
    if (pagamentos.length === 0) return;
    if (pagamentos.some(p => p.status === StatusPagamento.RECUSADO)) {
      await this.repositorioVendas.atualizarStatus(vendaUuid, 'REPROVADA');
      return;
    }
    if (pagamentos.some(p => p.formaPagamento.isPix() && p.status === StatusPagamento.PENDENTE)) {
      await this.repositorioVendas.atualizarStatus(vendaUuid, 'AGUARDANDO PAGAMENTO');
      return;
    }
    if (pagamentos.every(p => ServicoPagamentos.pagamentoSatisfeitoParaVenda(p))) await this.repositorioVendas.atualizarStatus(vendaUuid, 'APROVADA');
  }

  private static pagamentoSatisfeitoParaVenda(p: IPagamento): boolean {
    const t = p.formaPagamento.getTipo();
    if (t === TipoPagamento.CUPOM_PROMOCIONAL || t === TipoPagamento.CUPOM_TROCA) return p.status === StatusPagamento.PENDENTE || p.status === StatusPagamento.APROVADO;
    return p.status === StatusPagamento.APROVADO;
  }

  public async confirmarAutorizacaoFinanceiraCheckout(corpo: Record<string, unknown>) {
    const { idIntencao, segredoConfirmacao, valorTotal, pagamentosCartao, vendaUuid } = extrairCheckoutPagamento(corpo);
    const registroIntencao = await this.repositorioIntencao.obterPorUuid(idIntencao);
    if (!registroIntencao) throw new Error('Intenção não encontrada');
    ServicoPagamentos.validarVinculoVendaCheckout(registroIntencao, vendaUuid);
    const resultado = await this.provedorPagamento.confirmarPagamento({ valorTotal, pagamentosCartao, idIntencao, segredoConfirmacao });
    const pagamentoUuid = await this.persistirPagamentoCheckoutAprovado({ resultado, vendaUuid, valorTotal, registroIntencao, pagamentosCartao });
    if (resultado.sucesso && vendaUuid?.trim()) await this.sincronizarStatusVendaAposPagamentos(vendaUuid.trim());
    return { sucesso: resultado.sucesso, statusTexto: resultado.sucesso ? 'APROVADA' : 'REPROVADA' as const, pagamentoUuid };
  }

  private static validarVinculoVendaCheckout(registro: IntencaoPagamentoPersistida, vendaUuid?: string): void {
    if (registro.venId !== null && (!vendaUuid || registro.vendaUuid !== vendaUuid)) throw new Error('Vínculo de venda inválido');
  }

  private async persistirPagamentoCheckoutAprovado(dados: DadosCheckoutAprovado): Promise<string | undefined> {
    if (!dados.resultado.sucesso || !dados.vendaUuid) return undefined;
    if (await this.repositorioPagamentos.obterVenIdPorVendaUuid(dados.vendaUuid) === null) throw new Error('Venda não encontrada');
    const resumo = dados.pagamentosCartao.map((p) => p.parcelasCartao ?? 1).join('|');
    const salvo = await this.repositorioPagamentos.cadastrar({
      id: uuidv4(), vendaUuid: dados.vendaUuid, valor: dados.valorTotal, status: StatusPagamento.APROVADO, criadoEm: new Date(), processadoEm: new Date(),
      formaPagamento: new FormaPagamento(TipoPagamento.CARTAO_CREDITO, resumo.length > 0 ? `parcelas:${resumo}` : 'parcelas:1')
    }, { inpIdIntencao: dados.registroIntencao.inpId });
    return salvo.id;
  }

  public async consultarPagamento(pagamentoUuid: string): Promise<IPagamento> {
    const p = await this.repositorioPagamentos.obterPorUuid(pagamentoUuid);
    if (!p) throw new Error('Pagamento não encontrado');
    return p;
  }
}
