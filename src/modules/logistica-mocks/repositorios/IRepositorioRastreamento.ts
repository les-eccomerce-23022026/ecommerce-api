/**
 * DTO para cadastro de rastreamento
 */
export interface IRastreamentoInputDto {
  entUuid: string;
  codigo: string;
  transportadora: 'Correios' | 'Loggi';
  dataEntregaPrevista?: Date;
}

/**
 * DTO de saída de rastreamento
 */
export interface IRastreamentoOutputDto {
  uuid: string;
  entUuid: string;
  codigo: string;
  transportadora: string;
  dataCriacao: Date;
  dataEntregaPrevista?: Date;
}

/**
 * Interface do repositório de rastreamentos
 */
export interface IRepositorioRastreamento {
  cadastrar(dados: IRastreamentoInputDto): Promise<IRastreamentoOutputDto>;
  obterPorUuid(uuid: string): Promise<IRastreamentoOutputDto | null>;
  obterPorCodigo(codigo: string): Promise<IRastreamentoOutputDto | null>;
  listarPorEntrega(entUuid: string): Promise<IRastreamentoOutputDto[]>;
  listarEmAndamento(): Promise<IRastreamentoOutputDto[]>;
}
