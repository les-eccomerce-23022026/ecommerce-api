import type { IRepositorioCotacaoFrete } from '@/modules/frete/cotacaoFrete/IRepositorioCotacaoFrete';
import { EstadosCotacaoFrete } from '@/modules/frete/cotacaoFrete/EstadosCotacaoFrete';
import { IRepositorioVendas, IVenda } from '../repositories/IRepositorioVendas';
import { IVendaInputDto } from '../dtos/IVenda.dto';

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

    // RN0069: Parcelamento mínimo R$ 80,00
    const parcelas = (dados as any).parcelas || 1;
    if (parcelas > 1 && dados.valorTotal < 80) {
      throw new Error('RN0069: Compras abaixo de R$ 80,00 não permitem parcelamento');
    }

    // RN0034: Mínimo R$ 10,00 por meio de pagamento no split (exceto cupom)
    const pagamentos = (dados as any).pagamentos || [];
    if (pagamentos.length > 0) {
      pagamentos.forEach((pg: any) => {
        if (pg.tipo === 'cartao' && pg.valor < 10) {
          throw new Error('RN0034: Valor mínimo por cartão deve ser R$ 10,00');
        }
      });
    }

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
   * Administradores podem ver qualquer venda; clientes apenas a própria.
   * Retorna a mesma mensagem para "não existe" e "não é dono" para evitar
   * enumeração de UUIDs alheios (OWASP: evitar oráculo de existência).
   */
  public async visualizarDetalhesVenda(
    vendaUuid: string,
    requisitante: { uuid: string; ehAdmin: boolean },
  ): Promise<IVenda> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) throw new Error('Venda não encontrada');

    if (!requisitante.ehAdmin && venda.usuarioUuid !== requisitante.uuid) {
      throw new Error('Venda não encontrada');
    }

    return venda;
  }

  /**
   * Lista histórico de vendas do cliente.
   */
  public async listarVendasCliente(usuarioUuid: string): Promise<IVenda[]> {
    return this.repositorioVendas.listarPorUsuario(usuarioUuid);
  }

  /**
   * Solicita a troca de uma venda ou itens (RN0043).
   * Apenas para pedidos ENTREGUE dentro de 7 dias corridos da data de entrega.
   */
  public async solicitarTroca(
    vendaUuid: string,
    usuarioUuid: string,
    justificativa: string,
  ): Promise<{ id: string }> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) throw new Error('Venda não encontrada');
    if (venda.usuarioUuid !== usuarioUuid) throw new Error('Venda não encontrada');

    if (venda.status !== 'ENTREGUE') {
      throw new Error('Apenas pedidos com status ENTREGUE podem solicitar troca');
    }

    if (!venda.dataHoraEntrega) {
      throw new Error('Data de entrega não registrada para validação de prazo');
    }

    const seteDiasEmMs = 7 * 24 * 60 * 60 * 1000;
    const expiracao = new Date(venda.dataHoraEntrega.getTime() + seteDiasEmMs);

    if (new Date() > expiracao) {
      throw new Error('Prazo de 7 dias para troca expirado');
    }

    return this.repositorioVendas.registrarTroca!(vendaUuid, justificativa);
  }
}
