/**
 * DTOs normalizados do domínio de frete (agnósticos ao provedor).
 */

export type EstadoCotacaoFrete = 'CRIADA' | 'CONSUMIDA' | 'EXPIRADA' | 'CANCELADA';

export type TipoServicoFrete = 'PAC' | 'SEDEX' | 'RETIRA_EM_LOJA';

/** Entrada para cotação (serviço de aplicação). */
export interface ICotacaoFreteEntrada {
  cepDestino: string;
  /** CEP de origem (CD/loja); default via env. */
  cepOrigem?: string;
  pesoKg: number;
  valorTotalItens?: number;
}

/** Uma modalidade calculada pelo provedor antes de persistir. */
export interface IOpcaoFreteCalculada {
  tipoServico: TipoServicoFrete;
  valor: number;
  prazoTexto: string;
  /** Metadados específicos do simulador (persistidos em extensão). */
  metaSimulada: {
    fatorRegiao: number;
    pesoArredondado: number;
  };
}

/** Opção já persistida com UUID para o cliente. */
export interface IFreteOpcaoPersistida {
  cotacaoUuid: string;
  tipo: TipoServicoFrete;
  valor: number;
  prazo: string;
  provedor: string;
}

/** Registro lido do banco para validação na venda. */
export interface ICotacaoFretePersistida {
  cfrId: number;
  cfrUuid: string;
  provedor: string;
  estado: EstadoCotacaoFrete;
  tipoServico: TipoServicoFrete;
  valor: number;
  prazoTexto: string;
  expiraEm: Date;
  venId: number | null;
}
