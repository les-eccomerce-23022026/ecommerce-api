import { IRepositorioVendas } from '@/modules/vendas/repositories/IRepositorioVendas';
import { IRepositorioEntrega } from '@/modules/entrega/IRepositorioEntrega';
import { IEntregaInputDto, IEntregaOutputDto } from './IEntrega.dto';

/**
 * Serviço responsável por gerenciar a lógica de negócio das entregas.
 */
export class ServicoEntrega {
  private readonly repositorioEntrega: IRepositorioEntrega;

  private readonly repositorioVendas: IRepositorioVendas;

  constructor(repositorioEntrega: IRepositorioEntrega, repositorioVendas: IRepositorioVendas) {
    this.repositorioEntrega = repositorioEntrega;
    this.repositorioVendas = repositorioVendas;
  }

  /**
   * Agenda remessa e atualiza o status da venda para 'EM TRÂNSITO'.
   * @param dados Dados da entrega.
   */
  public async agendarRemessa(dados: IEntregaInputDto): Promise<IEntregaOutputDto> {
    // 1. Validar se a venda existe
    const venda = await this.repositorioVendas.obterPorUuid(dados.vendaUuid);
    if (!venda) {
      throw new Error(`Venda com UUID ${dados.vendaUuid} não encontrada.`);
    }

    // 2. Criar o registro de entrega logística
    const entrega = await this.repositorioEntrega.cadastrar(dados);

    // 3. Atualizar o status da venda para 'EM TRÂNSITO' conforme regra de negócio
    await this.repositorioVendas.atualizarStatus(dados.vendaUuid, 'EM TRÂNSITO');

    return entrega;
  }

  /**
   * Consulta uma entrega pelo UUID.
   */
  public async consultarEntrega(uuid: string): Promise<IEntregaOutputDto> {
    const entrega = await this.repositorioEntrega.obterPorUuid(uuid);
    if (!entrega) {
      throw new Error('Entrega não encontrada.');
    }
    return entrega;
  }

  /**
   * Lista entregas vinculadas a uma venda.
   */
  public async listarPorVenda(vendaUuid: string): Promise<IEntregaOutputDto[]> {
    return this.repositorioEntrega.listarPorVendaUuid(vendaUuid);
  }

  /**
   * Confirma recebimento, atualizando o status da venda para 'ENTREGUE'.
   * @param entregaUuid UUID da entrega.
   */
  public async confirmarRecebimento(entregaUuid: string): Promise<void> {
    const entrega = await this.repositorioEntrega.obterPorUuid(entregaUuid);
    if (!entrega) {
      throw new Error('Entrega não encontrada para finalização.');
    }

    await this.repositorioVendas.atualizarStatus(entrega.vendaUuid, 'ENTREGUE');
  }
}
