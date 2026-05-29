/**
 * Entidade de Contexto de Recomendação
 * 
 * Representa o contexto usado para gerar recomendações personalizadas,
 * incluindo histórico de compras e preferências do cliente.
 */
export interface IPerfilClienteRecomendacao {
  idadeAnos?: number;
  genero?: string;
  estado?: string;
  cidade?: string;
  nome?: string;
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