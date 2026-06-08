/**
 * DTO para entrada de item de venda.
 * Per rule U5: Preços validados no backend com dados do BD, não do cliente
 */
export interface IItemVendaDto {
  livroUuid: string;
  quantidade: number;
  /** Populado pelo serviço a partir do catálogo (não enviado pelo cliente). */
  precoUnitario?: number;
}

/**
 * DTO para pagamento split em múltiplos meios.
 */
export interface IPagamentoSplitDto {
  tipo: string;
  valor: number;
}

/**
 * DTO para inserção de uma nova venda.
 */
export interface IVendaInputDto {
  usuarioUuid: string;
  itens: IItemVendaDto[];
  valorFrete: number;
  /** Opcional - se não fornecido, backend calculará a partir do catálogo (regra U5). */
  valorTotal?: number;
  /** UUID da cotação persistida no checkout (preferencial sobre valorFrete isolado). */
  cotacaoUuid?: string;
  /** Preenchido pelo serviço após resolver a cotação; usado na persistência. */
  cfrId?: number;
  /** Número de parcelas (1 = à vista). Usado apenas para validação RN0069. */
  parcelas?: number;
  /** Lista de pagamentos split. Usado apenas para validação RN0034. */
  pagamentos?: IPagamentoSplitDto[];
  /** Calculado pelo serviço a partir do catálogo (não enviado pelo cliente). */
  valorTotalItens?: number;
}
