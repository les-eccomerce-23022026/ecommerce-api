/**
 * Entidade de Contexto de Recomendação
 *
 * Representa o contexto usado para gerar recomendações personalizadas,
 * incluindo histórico de compras, pedidos recentes e tendências de mercado.
 */
export interface IPerfilClienteRecomendacao {
  idadeAnos?: number;
  genero?: string;
  estado?: string;
  cidade?: string;
  nome?: string;
}

/** Resumo de pedido recente usado no modo pós-venda */
export interface IPedidoRecenteContexto {
  uuid: string;
  status: string;
  total: number;
  criadoEm: Date;
  qtdItens: number;
}

/** Livros mais vendidos por categoria */
export interface ITendenciaCategoriaContexto {
  categoria: string;
  titulosTop: string[];
}

/** Livros mais vendidos por faixa etária dos compradores */
export interface ITendenciaFaixaEtariaContexto {
  /** Ex.: "0-12", "13-17", "18-24", "25-39", "40-54", "55+" */
  faixa: string;
  titulosTop: string[];
}

export interface IContextoRecomendacao {
  clienteUuid: string;
  perfil?: IPerfilClienteRecomendacao;
  historicoCompras: {
    produtoUuid: string;
    titulo: string;
    categoria: string;
    dataCompra: Date;
  }[];
  preferencias: {
    categorias: string[];
    autores: string[];
    faixaPreco: {
      min: number;
      max: number;
    };
  };
  /** Últimos 5–10 pedidos do cliente (carregado sob demanda no modo pós-venda) */
  pedidosRecentes?: IPedidoRecenteContexto[];
  /** Top livros por categoria (carregado sob demanda no modo tendências) */
  tendenciasPorCategoria?: ITendenciaCategoriaContexto[];
  /** Top livros por faixa etária dos compradores (carregado sob demanda) */
  tendenciasPorFaixaEtaria?: ITendenciaFaixaEtariaContexto[];
}

export interface ICriarContextoRecomendacaoDto {
  clienteUuid: string;
  historicoCompras?: {
    produtoUuid: string;
    titulo: string;
    categoria: string;
    dataCompra: Date;
  }[];
}