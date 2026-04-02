import { IRepositorioVendas, IVenda } from '../repositories/IRepositorioVendas';
import { IVendaInputDto } from '../dtos/IVenda.dto';
import type { IRepositorioCotacaoFrete } from '@/modules/frete/cotacaoFrete/IRepositorioCotacaoFrete';
import { EstadosCotacaoFrete } from '@/modules/frete/cotacaoFrete/EstadosCotacaoFrete';

const TOLERANCIA_MOEDA = 0.02;

/**
 * Serviço responsável pela lógica de negócios das vendas.
 */
export class ServicoVendas {
  private readonly repositorioVendas: IRepositorioVendas;

  private readonly repositorioCotacaoFrete: IRepositorioCotacaoFrete | null;

  constructor(
    repositorioVendas: IRepositorioVendas,
    repositorioCotacaoFrete?: IRepositorioCotacaoFrete,
  ) {
    this.repositorioVendas = repositorioVendas;
    this.repositorioCotacaoFrete = repositorioCotacaoFrete ?? null;
  }

  /**
   * Realiza o cadastro de uma nova venda.
   * RF0033, RF0037
   */
  public async registrarPedidoVenda(dados: IVendaInputDto): Promise<IVenda> {
    if (!dados.usuarioUuid) throw new Error('Usuário é obrigatório');
    if (dados.itens.length === 0) throw new Error('Venda deve possuir ao menos um item');
    if (dados.valorTotal <= 0) throw new Error('Valor total inválido');

    let valorFreteFinal = Number(dados.valorFrete);
    let cfrId: number | undefined;

    const cotacaoUuid = typeof dados.cotacaoUuid === 'string' ? dados.cotacaoUuid.trim() : '';

    if (cotacaoUuid) {
      if (!this.repositorioCotacaoFrete) {
        throw new Error('Cotação de frete não suportada nesta configuração');
      }
      const cot = await this.repositorioCotacaoFrete.obterPorUuid(cotacaoUuid);
      if (!cot) throw new Error('Cotação de frete não encontrada');
      if (cot.estado !== EstadosCotacaoFrete.CRIADA) {
        throw new Error('Cotação de frete inválida ou já utilizada');
      }
      if (cot.expiraEm.getTime() < Date.now()) {
        throw new Error('Cotação de frete expirada');
      }
      if (cot.venId != null) {
        throw new Error('Cotação de frete já vinculada a uma venda');
      }
      valorFreteFinal = cot.valor;
      cfrId = cot.cfrId;
    }

    const esperadoTotal = Number(dados.valorTotalItens) + valorFreteFinal;
    if (Math.abs(esperadoTotal - dados.valorTotal) > TOLERANCIA_MOEDA) {
      throw new Error('Valor total não confere com itens + frete');
    }

    const dadosInsert: IVendaInputDto = {
      ...dados,
      valorFrete: valorFreteFinal,
      cfrId,
    };

    const { venda, venId } = await this.repositorioVendas.cadastrar(dadosInsert);

    if (cotacaoUuid && this.repositorioCotacaoFrete) {
      await this.repositorioCotacaoFrete.marcarConsumida(cotacaoUuid, venId);
    }

    return venda;
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
