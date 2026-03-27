import { v4 as uuidv4 } from 'uuid';
import { IRepositorioPagamentos, IPagamento } from './IRepositorioPagamentos';
import { IPagamentoInputDto } from './IPagamento.dto';
import { FormaPagamento, TipoPagamento } from './FormaPagamento';
import { CartaoCredito } from './CartaoCredito';
import { StatusPagamento } from './IPagamento';

/**
 * Serviço responsável pela lógica de negócios dos pagamentos.
 */
export class ServicoPagamentos {
  private readonly repositorioPagamentos: IRepositorioPagamentos;

  constructor(repositorioPagamentos: IRepositorioPagamentos) {
    this.repositorioPagamentos = repositorioPagamentos;
  }

  /**
   * Seleciona e valida forma de pagamento para uma venda.
   */
  public async selecionarFormaPagamento(dados: IPagamentoInputDto): Promise<IPagamento> {
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

    // Validar regras de negócio específicas
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
   * Processa o pagamento (simulação de gateway).
   */
  public async processarPagamento(pagamentoUuid: string): Promise<IPagamento> {
    const pagamento = await this.repositorioPagamentos.obterPorUuid(pagamentoUuid);
    if (!pagamento) {
      throw new Error('Pagamento não encontrado');
    }

    if (pagamento.status !== StatusPagamento.PENDENTE) {
      throw new Error('Pagamento já processado');
    }

    // Simulação de processamento (em produção, integrar com gateway real)
    const statusFinal = ServicoPagamentos.simularProcessamento(pagamento);

    const pagamentoAtualizado = {
      ...pagamento,
      status: statusFinal,
      processadoEm: new Date()
    };

    return this.repositorioPagamentos.atualizar(pagamentoUuid, pagamentoAtualizado);
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
    vendaUuid: string,
    valor: number
  ): Promise<void> {
    // Exemplo: validar cupom promocional
    if (formaPagamento.isCupomPromocional()) {
      const codigoCupom = formaPagamento.getDetalhes();
      if (!codigoCupom) {
        throw new Error('Código do cupom promocional é obrigatório');
      }
      // Simulação: verificar se cupom existe e é válido
      if (!ServicoPagamentos.validarCupomPromocional(codigoCupom, valor)) {
        throw new Error('Cupom promocional inválido ou expirado');
      }
    }

    // Exemplo: validar cupom de troca
    if (formaPagamento.isCupomTroca()) {
      const codigoCupom = formaPagamento.getDetalhes();
      if (!codigoCupom) {
        throw new Error('Código do cupom de troca é obrigatório');
      }
      // Simulação: verificar saldo do cupom
      if (!ServicoPagamentos.validarCupomTroca(codigoCupom, valor)) {
        throw new Error('Cupom de troca insuficiente ou inválido');
      }
    }

    // Outras validações podem ser adicionadas aqui
  }

  private static validarCupomPromocional(codigo: string, valor: number): boolean {
    // Simulação: cupom "DESCONTO10" dá 10% de desconto
    return codigo === 'DESCONTO10' && valor > 0;
  }

  private static validarCupomTroca(codigo: string, valor: number): boolean {
    // Simulação: cupom "TROCA50" vale R$50
    return codigo === 'TROCA50' && valor <= 50;
  }

  private static simularProcessamento(pagamento: IPagamento): StatusPagamento {
    // Simulação simples: aprovar se valor <= 1000, senão recusar
    return pagamento.valor <= 1000 ? StatusPagamento.APROVADO : StatusPagamento.RECUSADO;
  }
}
