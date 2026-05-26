/** Item do carrinho na resposta HTTP (alinhado ao ICarrinho do frontend). */
export interface ICarrinhoItemResposta {
  uuid: string;
  imagem: string;
  titulo: string;
  isbn: string;
  precoUnitario: number;
  quantidade: number;
  subtotal: number;
}

export interface ICarrinhoResposta {
  itens: ICarrinhoItemResposta[];
  fretePadrao: { valor: number; prazo: string };
  resumo: { subtotal: number; frete: number; total: number };
}
