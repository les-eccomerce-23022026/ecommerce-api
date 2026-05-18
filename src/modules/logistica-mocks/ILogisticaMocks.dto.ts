/**
 * DTOs para simulação de APIs de logística (Correios e Loggi)
 * Baseados em documentação real das APIs
 */

/** Código de rastreamento */
export type CodigoRastreamento = string;

/** Status do rastreamento */
export type StatusRastreamento = 'found' | 'invalid_format' | 'not_found';

/** Tipo de transportadora */
export type TipoTransportadora = 'correios' | 'loggi';

/** Evento de rastreamento (padrão Correios) */
export interface EventoRastreamento {
  codigo: string; // Ex: BDE (Objeto entregue), OEC (Saiu para entrega)
  descricao: string;
  detalhe?: string;
  data: string; // ISO 8601
  local?: string; // Ex: "São Paulo/SP"
  destino?: string; // Ex: "Campinas/SP"
}

/** Resposta de rastreamento - formato Correios */
export interface RastreamentoCorreiosResponse {
  codigo: CodigoRastreamento;
  status: StatusRastreamento;
  success: boolean;
  eventoMaisRecente: EventoRastreamento;
  historico?: EventoRastreamento[];
  previsaoEntrega?: string | null; // ISO 8601
  linkDetalhesCompletos: string;
  message?: string;
}

/** Resposta de rastreamento - formato Loggi */
export interface RastreamentoLoggiResponse {
  trackingCode: string;
  companyID: string;
  status: string;
  events: Array<{
    status: string;
    description: string;
    createdAt: string; // ISO 8601
    location?: string;
  }>;
  promisedDate?: string; // ISO 8601 - estimativa de entrega
  deliveredAt?: string | null; // ISO 8601
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  error?: string; // Mensagem de erro quando aplicável
}

/** Cálculo de prazo e frete */
export interface CalculoFreteRequest {
  cepOrigem: string;
  cepDestino: string;
  peso: number; // kg
  valorDeclarado?: number;
  tipoFrete?: 'SEDEX' | 'PAC' | 'LOGGI_STANDARD' | 'LOGGI_EXPRESS';
}

export interface CalculoFreteResponse {
  valorFrete: number;
  prazoEntrega: number; // dias úteis
  dataPrevistaEntrega: string; // ISO 8601
  tipoFrete: string;
}
