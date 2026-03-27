export enum TipoPagamento {
  CARTAO_CREDITO = 'cartao_credito',
  CUPOM_TROCA = 'cupom_troca',
  CUPOM_PROMOCIONAL = 'cupom_promocional'
}

/**
 * Value Object para representar a forma de pagamento.
 */
export class FormaPagamento {
  private readonly tipo: TipoPagamento;

  private readonly detalhes?: string; // Para cupons, código do cupom

  constructor(tipo: TipoPagamento, detalhes?: string) {
    FormaPagamento.validarTipo(tipo);
    this.tipo = tipo;
    this.detalhes = detalhes;
  }

  private static validarTipo(tipo: TipoPagamento): void {
    const tiposValidos = Object.values(TipoPagamento);
    if (!tiposValidos.includes(tipo)) {
      throw new Error('Tipo de pagamento inválido');
    }
  }

  public getTipo(): TipoPagamento {
    return this.tipo;
  }

  public getDetalhes(): string | undefined {
    return this.detalhes;
  }

  public isCartao(): boolean {
    return this.tipo === TipoPagamento.CARTAO_CREDITO;
  }

  public isCupomTroca(): boolean {
    return this.tipo === TipoPagamento.CUPOM_TROCA;
  }

  public isCupomPromocional(): boolean {
    return this.tipo === TipoPagamento.CUPOM_PROMOCIONAL;
  }

  public equals(outro: FormaPagamento): boolean {
    return this.tipo === outro.tipo && this.detalhes === outro.detalhes;
  }
}
