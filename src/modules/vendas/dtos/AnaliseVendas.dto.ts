/**
 * DTOs para análise de vendas por categoria e período
 */

export interface DadoAnaliseVendas {
  categoria: string;
  mes: Date;
  quantidade: number;
}

export interface FiltroAnaliseVendas {
  dataInicio: Date;
  dataFim: Date;
  categorias?: string[];
}

export interface RespostaAnaliseVendas {
  dados: DadoAnaliseVendas[];
  periodo: {
    inicio: Date;
    fim: Date;
  };
  metadados: {
    totalVendas: number;
    totalCategorias: number;
  };
}
