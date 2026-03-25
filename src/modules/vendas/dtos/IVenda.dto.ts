/**
 * DTO para entrada de item de venda.
 */
export interface IItemVendaDto {
  livroUuid: string;
  quantidade: number;
  precoUnitario: number;
}

/**
 * DTO para inserção de uma nova venda.
 */
export interface IVendaInputDto {
  usuarioUuid: string;
  itens: IItemVendaDto[];
  valorTotalItens: number;
  valorFrete: number;
  valorTotal: number;
}
