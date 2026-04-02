import { IRepositorioVendas, IVenda } from '../repositories/IRepositorioVendas';
import { IVendaInputDto } from '../dtos/IVenda.dto';

/**
 * Serviço responsável pela lógica de negócios das vendas.
 */
export class ServicoVendas {
  private readonly repositorioVendas: IRepositorioVendas;

  constructor(repositorioVendas: IRepositorioVendas) {
    this.repositorioVendas = repositorioVendas;
  }

  /**
   * Realiza o cadastro de uma nova venda.
   * RF0033, RF0037
   */
  public async registrarPedidoVenda(dados: IVendaInputDto): Promise<IVenda> {
    // Validações básicas de negócio
    if (!dados.usuarioUuid) throw new Error('Usuário é obrigatório');
    if (dados.itens.length === 0) throw new Error('Venda deve possuir ao menos um item');
    if (dados.valorTotal <= 0) throw new Error('Valor total inválido');

    // Validação de segurança: sanitização simples de campos
    // (Poderia ser expandido com um Security-Reviewer)
    
    return this.repositorioVendas.cadastrar(dados);
  }

  /**
   * Consulta uma venda completa pelo UUID.
   */
  public async visualizarDetalhesVenda(vendaUuid: string): Promise<IVenda> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) throw new Error('Venda não encontrada');
    return venda;
  }

  /**
   * Lista histórico de vendas do cliente.
   */
  public async listarVendasCliente(usuarioUuid: string): Promise<IVenda[]> {
    return this.repositorioVendas.listarPorUsuario(usuarioUuid);
  }
}
