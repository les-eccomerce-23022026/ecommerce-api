/**
 * DTO para cadastrar uma nova entrega (logística).
 */
export interface IEntregaInputDto {
  vendaUuid: string;
  tipoFrete: string; // Descrição (ex: 'PAC', 'SEDEX')
  endereco: object; // Objeto de endereço (será salvo como JSONB)
  custo: number;
  entregador?: string;
  codigoRastreamento?: string; // Código de rastreamento da transportadora
}

/**
 * Interface que representa os dados de saída da entrega.
 */
export interface IEntregaOutputDto {
  uuid: string;
  vendaUuid: string;
  tipoFrete: string;
  endereco: object;
  custo: number;
  entregador: string | null;
  criadoEm: Date;
  codigoRastreamento?: string; // Código de rastreamento da transportadora
}

/**
 * DTO para atualização de dados logísticos (opcional, se necessário).
 */
export interface IAtualizaEntregaDto {
  entregador?: string;
  endereco?: object;
  custo?: number;
}
