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
 * Tabela de despacho para verificar se um pagamento é considerado "satisfeito" (pago ou garantido).
 * Utilizada para atualizar o status da venda para 'APROVADA'.
 */
const MAPA_SATISFACAO_PAGAMENTO: Record<TipoPagamento, (p: IPagamento) => boolean> = {
  [TipoPagamento.CUPOM_PROMOCIONAL]: (p) =>
    p.status === StatusPagamento.PENDENTE || p.status === StatusPagamento.APROVADO,
  [TipoPagamento.CUPOM_TROCA]: (p) =>
    p.status === StatusPagamento.PENDENTE || p.status === StatusPagamento.APROVADO,
  [TipoPagamento.PIX]: (p) => p.status === StatusPagamento.APROVADO,
  [TipoPagamento.CARTAO_CREDITO]: (p) => p.status === StatusPagamento.APROVADO,
};

/**
 * Serviço responsável pela lógica de negócios dos pagamentos (Livraria e-commerce).
 * Alinhado com princípios SOLID e Clean Code (Tabelas de Despacho > If/Else).
 */
export class ServicoPagamentos {
  constructor(
    private readonly repositorioPagamentos: IRepositorioPagamentos,
    private readonly provedorPagamento: IProvedorPagamento,
    private readonly repositorioIntencao: IRepositorioIntencaoPagamento,
    private readonly repositorioVendas: IRepositorioVendas
  ) {}

  /**
   * Registra intenção de pagamento no provedor externo.
   * @param valorTotal Valor total em reais.
   * @throws Error se o valor for inválido.
   */
  public async registrarIntencaoPagamento(valorTotal: number): Promise<ResultadoIntencaoPagamento> {
    if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
      throw new Error('Valor total da intenção de pagamento deve ser positivo');
    }
    return this.provedorPagamento.registrarIntencaoPagamento(valorTotal);
  }

  /**
   * Associa uma intenção de pagamento à venda correspondente.
   * @param inpUuid UUID da intenção.
   * @param vendaUuid UUID da venda.
   */
  public async vincularIntencaoVenda(inpUuid: string, vendaUuid: string): Promise<void> {
    const idIntencao = inpUuid?.trim();
    const idVenda = vendaUuid?.trim();

    if (!idIntencao || !idVenda) {
      throw new Error('Identificadores da intenção e da venda são obrigatórios');
    }

    const venId = await this.repositorioPagamentos.obterVenIdPorVendaUuid(idVenda);
    if (venId === null) {
      throw new Error('Venda não encontrada');
    }

    const ok = await this.repositorioIntencao.vincularVenda(idIntencao, venId);
    if (!ok) {
      throw new Error('Intenção não encontrada ou indisponível para vínculo');
    }
  }

  /**
   * Define e persiste o método de liquidação (pagamento) para uma venda.
   * @param dados DTO com informações do pagamento.
   */
  public async definirMetodoLiquidacao(dados: IPagamentoInputDto): Promise<IResultadoDefinirMetodoLiquidacao> {
    ServicoPagamentos.validarDadosPagamento(dados);

    const detalhesAux = this.obterDetalhesPorTipo(dados);
    const formaPagamento = new FormaPagamento(dados.tipoPagamento, detalhesAux);
    const cartao = this.processarDadosCartao(dados, formaPagamento);

    await this.validarRegrasNegocio(formaPagamento, dados.valor);

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
      return this.gerarCobrancaPix(salvo, dados.valor, dados.vendaUuid);
    }

    return { pagamento: salvo };
  }

  private obterDetalhesPorTipo(dados: IPagamentoInputDto): string | undefined {
    const mapaDetalhes: Partial<Record<TipoPagamento, () => string | undefined>> = {
      [TipoPagamento.PIX]: () => dados.detalhesCupom ?? `PIX-${uuidv4().replace(/-/g, '').slice(0, 12)}`,
      [TipoPagamento.CARTAO_CREDITO]: () => `parcelas:${dados.parcelasCartao ?? 1}`,
    };

    return mapaDetalhes[dados.tipoPagamento]?.() ?? dados.detalhesCupom;
  }

  private processarDadosCartao(dados: IPagamentoInputDto, forma: FormaPagamento): CartaoCredito | undefined {
    if (forma.isCartao()) {
      if (!dados.cartao) {
        throw new Error('Dados do cartão são obrigatórios para pagamento com cartão');
      }
      return new CartaoCredito(dados.cartao.numero, dados.cartao.nomeTitular, dados.cartao.validade, dados.cartao.bandeira);
    }

    if (dados.cartao) {
      throw new Error('Cartão não deve ser enviado para este tipo de pagamento');
    }

    return undefined;
  }

  private async gerarCobrancaPix(pagamento: IPagamento, valor: number, vendaUuid: string): Promise<IResultadoDefinirMetodoLiquidacao> {
    const pix = gerarDadosCobrancaPixSimulada(valor);
    const pagId = await this.repositorioPagamentos.obterPagIdInternoPorUuid(pagamento.id);
    
    if (pagId === null) {
      throw new Error('Falha ao obter pagamento para cobrança PIX');
    }

    await this.repositorioPagamentos.inserirPixSimulado(pagId, {
      copiaCola: pix.copiaCola,
      qrBase64: pix.qrBase64,
      expiraEm: pix.expiraEm,
      segredoConfirmacao: pix.segredoConfirmacao
    });

    await this.sincronizarStatusVendaAposPagamentos(vendaUuid);

    return {
      pagamento,
      pixCobranca: {
        copiaCola: pix.copiaCola,
        qrCodeBase64: pix.qrBase64,
        expiraEm: pix.expiraEm,
        segredoConfirmacao: pix.segredoConfirmacao
      }
    };
  }

  /**
   * Solicita autorização de pagamento via provedor externo.
   * @param pagamentoUuid UUID do pagamento.
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
      throw new Error('PIX aguarda confirmação assíncrona.');
    }

    const resultado = await this.provedorPagamento.confirmarPagamento({
      valorTotal: pagamento.valor,
      confirmacaoServicoInterna: true
    });

    const statusFinal = resultado.sucesso ? StatusPagamento.APROVADO : StatusPagamento.RECUSADO;

    const atualizado = await this.repositorioPagamentos.atualizar(pagamentoUuid, {
      ...pagamento,
      status: statusFinal,
      processadoEm: new Date()
    });

    await this.sincronizarStatusVendaAposPagamentos(pagamento.vendaUuid);
    return atualizado;
  }

  /**
   * Confirma pagamento PIX via Webhook (PSP).
   */
  public async confirmarPagamentoPixWebhook(pagamentoUuid: string, segredoConfirmacao: string): Promise<IPagamento> {
    const pagamento = await this.repositorioPagamentos.obterPorUuid(pagamentoUuid);
    
    if (!pagamento || pagamento.formaPagamento.getTipo() !== TipoPagamento.PIX) {
      throw new Error('Pagamento não encontrado ou não é PIX');
    }

    if (pagamento.status !== StatusPagamento.PENDENTE) {
      throw new Error('Pagamento PIX já processado');
    }

    const pix = await this.repositorioPagamentos.obterPixSimuladoPorPagUuid(pagamentoUuid);
    if (!pix || pix.segredoConfirmacao !== segredoConfirmacao) {
      throw new Error('Cobrança PIX não encontrada ou segredo inválido');
    }

    if (Date.now() > pix.expiraEm.getTime()) {
      await this.repositorioPagamentos.atualizar(pagamentoUuid, { ...pagamento, status: StatusPagamento.RECUSADO, processadoEm: new Date() });
      await this.sincronizarStatusVendaAposPagamentos(pagamento.vendaUuid);
      throw new Error('Cobrança PIX expirada');
    }

    const salvo = await this.repositorioPagamentos.atualizar(pagamentoUuid, { ...pagamento, status: StatusPagamento.APROVADO, processadoEm: new Date() });
    await this.sincronizarStatusVendaAposPagamentos(pagamento.vendaUuid);
    return salvo;
  }

  /**
   * Obtém resumo dos pagamentos de uma venda para o cliente.
   */
  public async obterResumoPagamentosVenda(vendaUuid: string, usuarioUuidCliente: string) {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda || venda.usuarioUuid !== usuarioUuidCliente) {
      throw new Error('Venda não encontrada');
    }

    const pagamentos = await this.repositorioPagamentos.listarPorVenda(vendaUuid);
    const detalhes = await Promise.all(pagamentos.map(async (p) => {
      const base = { id: p.id, tipo: p.formaPagamento.getTipo(), status: p.status, valor: p.valor };
      if (p.formaPagamento.getTipo() === TipoPagamento.PIX && p.status === StatusPagamento.PENDENTE) {
        const pix = await this.repositorioPagamentos.obterPixSimuladoPorPagUuid(p.id);
        return { ...base, ...(pix ? { pixExpiraEm: pix.expiraEm.toISOString() } : {}) };
      }
      return base;
    }));

    return {
      vendaStatus: venda.status,
      aguardandoPix: pagamentos.some(p => p.formaPagamento.getTipo() === TipoPagamento.PIX && p.status === StatusPagamento.PENDENTE),
      pagamentos: detalhes
    };
  }

  private async sincronizarStatusVendaAposPagamentos(vendaUuid: string): Promise<void> {
    const pagamentos = await this.repositorioPagamentos.listarPorVenda(vendaUuid);
    if (pagamentos.length === 0) return;

    if (pagamentos.some(p => p.status === StatusPagamento.RECUSADO)) {
      await this.repositorioVendas.atualizarStatus(vendaUuid, 'REPROVADA');
      return;
    }

    if (pagamentos.some(p => p.formaPagamento.getTipo() === TipoPagamento.PIX && p.status === StatusPagamento.PENDENTE)) {
      await this.repositorioVendas.atualizarStatus(vendaUuid, 'AGUARDANDO PAGAMENTO');
      return;
    }

    if (pagamentos.every(p => this.pagamentoSatisfeitoParaVenda(p))) {
      await this.repositorioVendas.atualizarStatus(vendaUuid, 'APROVADA');
    }
  }

  private pagamentoSatisfeitoParaVenda(p: IPagamento): boolean {
    const satisfacao = MAPA_SATISFACAO_PAGAMENTO[p.formaPagamento.getTipo()];
    return satisfacao ? satisfacao(p) : false;
  }

  /**
   * Confirma autorização financeira no fluxo de checkout.
   */
  public async confirmarAutorizacaoFinanceiraCheckout(corpo: Record<string, unknown>) {
    const { idIntencao, segredoConfirmacao, valorTotal, pagamentosCartao, cuponsAplicados, vendaUuid } = extrairCheckoutPagamento(corpo);
    
    let registroIntencao = null;
    if (idIntencao !== 'CUPOM-ONLY') {
      registroIntencao = await this.repositorioIntencao.obterPorUuid(idIntencao);
      if (registroIntencao === null) throw new Error('Intenção de pagamento não encontrada');
      ServicoPagamentos.validarVinculoVendaCheckout(registroIntencao, vendaUuid);
    }

    let resultado = { sucesso: true, status: 'APROVADO' };
    if (valorTotal > 0) {
      resultado = await this.provedorPagamento.confirmarPagamento({ valorTotal, pagamentosCartao, idIntencao, segredoConfirmacao });
    }
    
    let pagamentosUuids: string[] = [];
    if (resultado.sucesso && vendaUuid?.trim()) {
      pagamentosUuids = await this.persistirPagamentosCheckoutAprovados({
        vendaUuid: vendaUuid.trim(),
        registroIntencao,
        pagamentosCartao,
        cuponsAplicados
      });
      
      if (cuponsAplicados && cuponsAplicados.length > 0) {
        await this.processarSaldosCuponsTroca(cuponsAplicados);
      }

      await this.sincronizarStatusVendaAposPagamentos(vendaUuid.trim());
    }

    return {
      sucesso: resultado.sucesso,
      statusTexto: resultado.sucesso ? 'APROVADA' : 'REPROVADA' as const,
      pagamentoUuid: pagamentosUuids[0],
      pagamentosUuids
    };
  }

  private async processarSaldosCuponsTroca(cupons: any[]): Promise<void> {
    for (const c of cupons) {
      if (c.tipo !== 'troca') continue;
      
      const cupomReal = await this.repositorioPagamentos.obterCupomTrocaPorCodigo(c.codigo);
      if (!cupomReal) continue;

      const novoSaldo = cupomReal.valorAtual - c.valor;
      await this.repositorioPagamentos.atualizarSaldoCupomTroca(cupomReal.id, Math.max(0, novoSaldo));
    }
  }

  private static validarVinculoVendaCheckout(registro: IntencaoPagamentoPersistida, vendaUuid?: string): void {
    if (registro.venId === null) return;
    if (!vendaUuid) throw new Error('vendaUuid é obrigatório para esta intenção');
    if (registro.vendaUuid !== vendaUuid) throw new Error('vendaUuid não confere');
  }

  private async persistirPagamentosCheckoutAprovados(dados: {
    vendaUuid: string;
    registroIntencao: IntencaoPagamentoPersistida | null;
    pagamentosCartao: any[];
    cuponsAplicados?: any[];
  }): Promise<string[]> {
    const venId = await this.repositorioPagamentos.obterVenIdPorVendaUuid(dados.vendaUuid);
    if (venId === null) throw new Error('Venda não encontrada');

    const ids: string[] = [];

    // 1. Persistir Cupons
    if (dados.cuponsAplicados) {
      for (const c of dados.cuponsAplicados) {
        const tipo = c.tipo === 'troca' ? TipoPagamento.CUPOM_TROCA : TipoPagamento.CUPOM_PROMOCIONAL;
        const pagamento: IPagamento = {
          id: uuidv4(),
          vendaUuid: dados.vendaUuid,
          valor: c.valor,
          formaPagamento: new FormaPagamento(tipo, c.codigo),
          status: StatusPagamento.APROVADO,
          criadoEm: new Date(),
          processadoEm: new Date(),
        };
        const salvo = await this.repositorioPagamentos.cadastrar(pagamento);
        ids.push(salvo.id);
      }
    }

    // 2. Persistir Cartões
    for (const p of dados.pagamentosCartao) {
      const pagamento: IPagamento = {
        id: uuidv4(),
        vendaUuid: dados.vendaUuid,
        valor: p.valor,
        formaPagamento: new FormaPagamento(TipoPagamento.CARTAO_CREDITO, `parcelas:${p.parcelasCartao ?? 1}`),
        status: StatusPagamento.APROVADO,
        criadoEm: new Date(),
        processadoEm: new Date(),
      };
      const salvo = await this.repositorioPagamentos.cadastrar(pagamento, { inpIdIntencao: dados.registroIntencao?.inpId });
      ids.push(salvo.id);
    }

    return ids;
  }

  public async consultarPagamento(pagamentoUuid: string): Promise<IPagamento> {
    const p = await this.repositorioPagamentos.obterPorUuid(pagamentoUuid);
    if (!p) throw new Error('Pagamento não encontrado');
    return p;
  }

  private static validarDadosPagamento(dados: IPagamentoInputDto): void {
    if (!dados.vendaUuid) throw new Error('UUID da venda é obrigatório');
    if (dados.valor <= 0) throw new Error('Valor deve ser positivo');
    if (!Object.values(TipoPagamento).includes(dados.tipoPagamento)) throw new Error('Tipo inválido');

    if (dados.parcelasCartao != null) {
      if (dados.tipoPagamento !== TipoPagamento.CARTAO_CREDITO) throw new Error('Parcelas só para cartão');
      const n = Number(dados.parcelasCartao);
      if (!Number.isInteger(n) || n < 1 || n > PARCELAS_CARTAO_MAX) throw new Error('Parcelas inválidas');
    }
  }

  private async validarRegrasNegocio(forma: FormaPagamento, valor: number): Promise<void> {
    if (forma.isCupomPromocional()) {
      const codigo = forma.getDetalhes();
      if (!codigo || !this.validarCupomPromocional(codigo, valor)) throw new Error('Cupom promocional inválido');
    }

    if (forma.isCupomTroca()) {
      const codigo = forma.getDetalhes();
      if (!codigo) throw new Error('Código do cupom de troca é obrigatório');
      
      const cupom = await this.repositorioPagamentos.obterCupomTrocaPorCodigo(codigo);
      if (!cupom || !cupom.ativo || cupom.valorAtual < valor) {
        throw new Error('Cupom de troca inválido ou saldo insuficiente');
      }
    }

    if (forma.isPix() && valor < 10) throw new Error('Valor mínimo por linha PIX é R$ 10,00');
  }

  private validarCupomPromocional(codigo: string, valor: number): boolean {
    return codigo === 'DESCONTO10' && valor > 0;
  }
}
