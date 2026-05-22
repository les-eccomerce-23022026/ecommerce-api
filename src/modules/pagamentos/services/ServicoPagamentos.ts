import type { IRepositorioVendas } from '@/modules/vendas/repositories/IRepositorioVendas';
import {
  confirmarAutorizacaoFinanceiraCheckoutServico,
  type DepsCheckoutPagamentos,
} from '@/modules/pagamentos/services/servicoPagamentosCheckoutFlow.util';
import { definirMetodoLiquidacaoServico } from '@/modules/pagamentos/services/servicoPagamentosDefinirMetodo.util';
import {
  confirmarPagamentoPixWebhookServico,
  obterResumoPagamentosVenda,
  solicitarAutorizacaoFinanceiraServico,
} from '@/modules/pagamentos/services/servicoPagamentosVenda.util';
import { IRepositorioPagamentos, IPagamento } from '../repositories/IRepositorioPagamentos';
import { IPagamentoInputDto, IResultadoDefinirMetodoLiquidacao } from '../entities/IPagamento.dto';
import type { IProvedorPagamento } from '../provedoresPagamento/IProvedorPagamento';
import type { ResultadoIntencaoPagamento } from '../provedoresPagamento/DadosConfirmacaoProvedor';
import type { IRepositorioIntencaoPagamento } from '../intencaoPagamento/IRepositorioIntencaoPagamento';
import type { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';

/**
 * Serviço responsável pela lógica de negócios dos pagamentos (Livraria e-commerce).
 */
export class ServicoPagamentos {
  constructor(
    private readonly repositorioPagamentos: IRepositorioPagamentos,
    private readonly provedorPagamento: IProvedorPagamento,
    private readonly repositorioIntencao: IRepositorioIntencaoPagamento,
    private readonly repositorioVendas: IRepositorioVendas,
    private readonly db?: IConexaoBanco,
  ) {}

  public async registrarIntencaoPagamento(valorTotal: number): Promise<ResultadoIntencaoPagamento> {
    if (!Number.isFinite(valorTotal) || valorTotal <= 0) throw new Error('Valor total da intenção de pagamento deve ser positivo');
    return this.provedorPagamento.registrarIntencaoPagamento(valorTotal);
  }

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

  public async definirMetodoLiquidacao(dados: IPagamentoInputDto): Promise<IResultadoDefinirMetodoLiquidacao> {
    return definirMetodoLiquidacaoServico(this.repositorioPagamentos, this.repositorioVendas, dados);
  }

  public async solicitarAutorizacaoFinanceira(pagamentoUuid: string): Promise<IPagamento> {
    return solicitarAutorizacaoFinanceiraServico(
      this.repositorioPagamentos,
      this.provedorPagamento,
      this.repositorioVendas,
      pagamentoUuid,
    );
  }

  public async confirmarPagamentoPixWebhook(pagamentoUuid: string, segredoConfirmacao: string): Promise<IPagamento> {
    return confirmarPagamentoPixWebhookServico(
      this.repositorioPagamentos,
      this.repositorioVendas,
      pagamentoUuid,
      segredoConfirmacao,
    );
  }

  public async obterResumoPagamentosVenda(vendaUuid: string, usuarioUuidCliente: string) {
    return obterResumoPagamentosVenda(
      this.repositorioPagamentos,
      this.repositorioVendas,
      vendaUuid,
      usuarioUuidCliente,
    );
  }

  public async confirmarAutorizacaoFinanceiraCheckout(corpo: Record<string, unknown>) {
    const deps: DepsCheckoutPagamentos = {
      repositorioPagamentos: this.repositorioPagamentos,
      repositorioIntencao: this.repositorioIntencao,
      repositorioVendas: this.repositorioVendas,
      provedorPagamento: this.provedorPagamento,
      db: this.db,
    };
    return confirmarAutorizacaoFinanceiraCheckoutServico(deps, corpo);
  }

  public async consultarPagamento(pagamentoUuid: string): Promise<IPagamento> {
    const p = await this.repositorioPagamentos.obterPorUuid(pagamentoUuid);
    if (!p) throw new Error('Pagamento não encontrado');
    return p;
  }
}
