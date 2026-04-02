import type { EstadoCotacaoFrete, ICotacaoFretePersistida } from '@/modules/frete/IFrete.dto';

export interface InserirCotacaoLinha {
  provedor: string;
  estado: EstadoCotacaoFrete;
  cepOrigem: string;
  cepDestino: string;
  pesoKg: number;
  valorItens: number | null;
  tipoServico: string;
  valor: number;
  prazoTexto: string;
  expiraEm: Date;
  metaSimulada: { fatorRegiao: number; pesoArredondado: number };
}

export interface IRepositorioCotacaoFrete {
  inserirLinhas(linhas: InserirCotacaoLinha[]): Promise<{ cfrUuid: string; cfrId: number }[]>;

  obterPorUuid(cfrUuid: string): Promise<ICotacaoFretePersistida | null>;

  marcarConsumida(cfrUuid: string, venId: number): Promise<void>;

  marcarExpiradasCriadasVencidas(): Promise<number>;
}
