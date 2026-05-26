/**
 * DTO para cadastro de evento de rastreamento
 */
export interface IEventoRastreamentoInputDto {
  rasUuid: string;
  codigo: string;
  descricao: string;
  detalhe?: string;
  data: Date;
  local?: string;
  destino?: string;
}

/**
 * DTO de saída de evento de rastreamento
 */
export interface IEventoRastreamentoOutputDto {
  uuid: string;
  rasUuid: string;
  codigo: string;
  descricao: string;
  detalhe?: string;
  data: Date;
  local?: string;
  destino?: string;
}

/**
 * Interface do repositório de eventos de rastreamento
 */
export interface IRepositorioEventoRastreamento {
  cadastrar(dados: IEventoRastreamentoInputDto): Promise<IEventoRastreamentoOutputDto>;
  listarPorRastreamento(rasUuid: string): Promise<IEventoRastreamentoOutputDto[]>;
  obterMaisRecente(rasUuid: string): Promise<IEventoRastreamentoOutputDto | null>;
}
