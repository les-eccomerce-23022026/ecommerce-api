import type { IRepositorioCotacaoFrete } from '@/modules/frete/cotacaoFrete/IRepositorioCotacaoFrete';
import { EstadosCotacaoFrete } from '@/modules/frete/cotacaoFrete/EstadosCotacaoFrete';
import { IVendaInputDto } from '../dtos/IVenda.dto';
import { IRepositorioVendas, IVenda } from '../repositories/IRepositorioVendas';

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

  private static validarEntradaBasicaPedido(dados: IVendaInputDto): void {
    if (!dados.usuarioUuid) throw new Error('Usuário é obrigatório');
    if (dados.itens.length === 0) throw new Error('Venda deve possuir ao menos um item');
    if (dados.valorTotal <= 0) throw new Error('Valor total inválido');
  }

  private async resolverFretePorCotacao(cotacaoUuid: string): Promise<{ valorFrete: number; cfrId: number }> {
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
    return { valorFrete: cot.valor, cfrId: cot.cfrId };
  }

  /**
   * Realiza o cadastro de uma nova venda.
   * RF0033, RF0037
   */
  public async registrarPedidoVenda(dados: IVendaInputDto): Promise<IVenda> {
    ServicoVendas.validarEntradaBasicaPedido(dados);

    const cotacaoUuid = typeof dados.cotacaoUuid === 'string' ? dados.cotacaoUuid.trim() : '';
    let valorFreteFinal = Number(dados.valorFrete);
    let cfrId: number | undefined;

    if (cotacaoUuid) {
      const freteCotacao = await this.resolverFretePorCotacao(cotacaoUuid);
      valorFreteFinal = freteCotacao.valorFrete;
      cfrId = freteCotacao.cfrId;
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
   * Solicita troca de itens de uma venda.
   * RN0043: prazo de 7 dias contados a partir da data de entrega confirmada.
   */
  public async solicitarTroca(vendaUuid: string, usuarioUuid: string, motivo: string, itensUuids: string[]): Promise<IVenda> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) throw new Error('Venda não encontrada');
    if (venda.usuarioUuid !== usuarioUuid) throw new Error('Acesso negado');
    if (venda.status !== 'ENTREGUE') throw new Error('Apenas pedidos entregues podem ser trocados');

    if (!venda.dataHoraEntrega) {
      throw new Error('Data de entrega não registrada; não é possível validar o prazo de troca');
    }

    // RN0043: Prazo de arrependimento — 7 dias a partir da data de entrega confirmada
    const SETE_DIAS_EM_MS = 7 * 24 * 60 * 60 * 1000;
    const dataLimite = new Date(venda.dataHoraEntrega.getTime() + SETE_DIAS_EM_MS);
    if (new Date() > dataLimite) {
      throw new Error('Prazo de 7 dias para troca expirado');
    }

    await this.repositorioVendas.registrarSolicitacaoTroca(vendaUuid, motivo, itensUuids);
    const atualizada = await this.repositorioVendas.obterPorUuid(vendaUuid);
    return atualizada!;
  }

  /**
   * Lista vendas com solicitação de troca (Admin).
   */
  public async listarTrocasPendentes(): Promise<IVenda[]> {
    const todas = await this.repositorioVendas.listarTodas(1000);
    return todas.filter(v => v.status === 'EM TROCA' || v.status === 'TROCA AUTORIZADA');
  }

  /**
   * Autoriza uma troca (Admin).
   */
  public async autorizarTroca(vendaUuid: string): Promise<IVenda> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) throw new Error('Venda não encontrada');
    if (venda.status !== 'EM TROCA') throw new Error('Pedido não está em fase de solicitação de troca');

    await this.repositorioVendas.atualizarStatus(vendaUuid, 'TROCA AUTORIZADA');
    const atualizada = await this.repositorioVendas.obterPorUuid(vendaUuid);
    return atualizada!;
  }

  /**
   * Rejeita uma troca (Admin).
   */
  public async rejeitarTroca(vendaUuid: string, _motivo: string): Promise<IVenda> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) throw new Error('Venda não encontrada');
    if (venda.status !== 'EM TROCA') throw new Error('Pedido não está em fase de solicitação de troca');

    await this.repositorioVendas.atualizarStatus(vendaUuid, 'TROCA REJEITADA');
    // Poderíamos salvar o motivo da rejeição em ven_motivo_troca concatenado ou nova coluna.
    // Para simplificar, vou apenas mudar status.
    const atualizada = await this.repositorioVendas.obterPorUuid(vendaUuid);
    return atualizada!;
  }

  /**
   * Confirma recebimento da troca (Admin).
   * Atualiza status para 'CONCLUÍDA' e retorna o código do cupom a ser criado pelo controlador.
   * RF0054: retorno ao estoque fica a critério do controlador (parâmetro informativo).
   */
  public async confirmarRecebimentoTroca(
    vendaUuid: string,
    _retornarEstoque: boolean,
  ): Promise<{ venda: IVenda; cupom: string }> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) throw new Error('Venda não encontrada');
    if (venda.status !== 'TROCA AUTORIZADA') throw new Error('Troca precisa estar autorizada para confirmar recebimento');

    await this.repositorioVendas.atualizarStatus(vendaUuid, 'CONCLUÍDA');

    // Código único do cupom vinculado ao UUID da venda (primeiros 8 caracteres).
    const codigoCupom = `TROCA-${venda.id.split('-')[0].toUpperCase()}`;

    const atualizada = (await this.repositorioVendas.obterPorUuid(vendaUuid))!;
    return { venda: atualizada, cupom: codigoCupom };
  }
}
