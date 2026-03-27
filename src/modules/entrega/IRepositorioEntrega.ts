import { IEntregaInputDto, IEntregaOutputDto } from '@/modules/entrega/IEntrega.dto';

/**
 * Interface que define o Repositório de Entregas.
 */
export interface IRepositorioEntrega {
  /**
   * Registra uma nova entrega logística no banco de dados.
   * @param dados Dados da entrega oriundos do DTO.
   * @returns     A entrega cadastrada com seu UUID e dados formatados.
   */
  cadastrar(dados: IEntregaInputDto): Promise<IEntregaOutputDto>;

  /**
   * Busca uma única entrega pelo seu UUID público.
   * @param uuid UUID público da entrega.
   */
  obterPorUuid(uuid: string): Promise<IEntregaOutputDto | null>;

  /**
   * Lista todas as entregas vinculadas a uma venda específica.
   * @param vendaUuid UUID público da venda.
   */
  listarPorVendaUuid(vendaUuid: string): Promise<IEntregaOutputDto[]>;
}
