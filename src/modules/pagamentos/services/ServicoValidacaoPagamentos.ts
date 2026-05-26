import { IPagamentoInputDto, PARCELAS_CARTAO_MAX } from '../entities/IPagamento.dto';
import { TipoPagamento, FormaPagamento } from '../entities/FormaPagamento';

export class ServicoValidacaoPagamentos {
  public static validarDadosPagamento(dados: IPagamentoInputDto): void {
    if (!dados.vendaUuid) {
      throw new Error('UUID da venda é obrigatório');
    }
    if (dados.valor <= 0) {
      throw new Error('Valor do pagamento deve ser positivo');
    }
    if (!Object.values(TipoPagamento).includes(dados.tipoPagamento)) {
      throw new Error('Tipo de pagamento inválido');
    }
    this.validarParcelas(dados.tipoPagamento, dados.parcelasCartao);
  }

  public static validarParcelas(tipo: TipoPagamento, parcelas?: number): void {
    if (parcelas == null) return;
    if (tipo !== TipoPagamento.CARTAO_CREDITO) {
      throw new Error('parcelasCartao só se aplica a cartão de crédito');
    }
    const n = Number(parcelas);
    if (!Number.isInteger(n) || n < 1 || n > PARCELAS_CARTAO_MAX) {
      throw new Error(`parcelasCartao deve ser inteiro entre 1 e ${PARCELAS_CARTAO_MAX}`);
    }
  }

  public static async validarRegrasNegocio(
    formaPagamento: FormaPagamento,
    _vendaUuid: string,
    valor: number
  ): Promise<void> {
    if (formaPagamento.isCupomPromocional()) {
      this.validarRegraCupomPromocional(formaPagamento.getDetalhes(), valor);
    }
    if (formaPagamento.isCupomTroca()) {
      this.validarRegraCupomTroca(formaPagamento.getDetalhes(), valor);
    }
    if (formaPagamento.isPix() && valor < 10) {
      throw new Error('Valor mínimo por linha PIX é R$ 10,00');
    }
  }

  private static validarRegraCupomPromocional(codigo: string | undefined, valor: number): void {
    if (!codigo) {
      throw new Error('Código do cupom promocional é obrigatório');
    }
    if (!this.validarCupomPromocional(codigo, valor)) {
      throw new Error('Cupom promocional inválido ou expirado');
    }
  }

  private static validarRegraCupomTroca(codigo: string | undefined, valor: number): void {
    if (!codigo) {
      throw new Error('Código do cupom de troca é obrigatório');
    }
    if (!this.validarCupomTroca(codigo, valor)) {
      throw new Error('Cupom de troca insuficiente ou inválido');
    }
  }

  private static validarCupomPromocional(codigo: string, valor: number): boolean {
    return codigo === 'DESCONTO10' && valor > 0;
  }

  private static validarCupomTroca(codigo: string, valor: number): boolean {
    return codigo === 'TROCA50' && valor <= 50;
  }
}
