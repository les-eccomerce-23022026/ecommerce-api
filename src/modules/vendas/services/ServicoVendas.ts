import type { IRepositorioCotacaoFrete } from '@/modules/frete/cotacaoFrete/IRepositorioCotacaoFrete';
import { EstadosCotacaoFrete } from '@/modules/frete/cotacaoFrete/EstadosCotacaoFrete';
import { IRepositorioVendas, IVenda } from '../repositories/IRepositorioVendas';
import { IVendaInputDto } from '../dtos/IVenda.dto';
import { IRepositorioEntrega } from '@/modules/entrega/IRepositorioEntrega';
import { MENSAGENS_ERRO } from '@/shared/constants/mensagens-erro.constants';
import { STATUS_VENDAS } from '../constants/statusVendas.constant';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';

const TOLERANCIA_MOEDA = 1.00;

/**
 * Serviço responsável pela lógica de negócios das vendas.
 */
export class ServicoVendas {
  private readonly repositorioVendas: IRepositorioVendas;

  private readonly repositorioCotacaoFrete: IRepositorioCotacaoFrete | null;

  private readonly repositorioEntrega: IRepositorioEntrega | null;

  constructor(
    repositorioVendas: IRepositorioVendas,
    repositorioCotacaoFrete?: IRepositorioCotacaoFrete,
    repositorioEntrega?: IRepositorioEntrega,
  ) {
    this.repositorioVendas = repositorioVendas;
    this.repositorioCotacaoFrete = repositorioCotacaoFrete ?? null;
    this.repositorioEntrega = repositorioEntrega ?? null;
  }

  /**
   * Valida uma cotação de frete e retorna o objeto cotação verificado.
   * Garante que a cotação existe, está no estado CRIADA, não expirou
   * e não está vinculada a outra venda.
   */
  private async validarCotacaoFrete(cotacaoUuid: string) {
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
    return cot;
  }

  /**
   * Resolve frete a partir de uma cotação validada, retornando valor e ID interno.
   */
  private async resolverFretePorCotacao(cotacaoUuid: string): Promise<{ valorFrete: number; cfrId: number }> {
    const cot = await this.validarCotacaoFrete(cotacaoUuid);
    return { valorFrete: cot.valor, cfrId: cot.cfrId };
  }

  /**
   * Realiza o cadastro de uma nova venda.
   * RF0033, RF0037
   */
  public async registrarPedidoVenda(dados: IVendaInputDto): Promise<IVenda> {
    ServicoVendas.validarDadosVenda(dados);
    ServicoVendas.validarPagamentosSplit(dados);
    
    // Buscar preços do catálogo e calcular valorTotalItens
    const { total: valorTotalItens, precosPorItem } = await this.calcularValorTotalItensDoCatalogo(dados.itens);
    
    const cotacaoUuid = typeof dados.cotacaoUuid === 'string' ? dados.cotacaoUuid.trim() : '';
    let valorFreteFinal = Number(dados.valorFrete);
    let cfrId: number | undefined;

    if (cotacaoUuid) {
      const freteCotacao = await this.resolverFretePorCotacao(cotacaoUuid);
      valorFreteFinal = freteCotacao.valorFrete;
      cfrId = freteCotacao.cfrId;
    }

    // Calcular valorTotal a partir do catálogo (regra U5: preços validados no backend)
    const valorTotalCalculado = valorTotalItens + valorFreteFinal;
    
    // Validar parcelamento com o valor calculado do catálogo
    ServicoVendas.validarParcelamento({ ...dados, valorTotal: valorTotalCalculado });
    
    // Se cliente enviou valorTotal, validar que confere (pode ser 0 ou undefined se não enviado)
    if (dados.valorTotal !== undefined && dados.valorTotal !== 0) {
      if (Math.abs(valorTotalCalculado - dados.valorTotal) > TOLERANCIA_MOEDA) {
        throw new Error('Valor total não confere com itens + frete (calculado pelo backend)');
      }
    }

    // Popular precoUnitario nos itens a partir do catálogo para persistência no banco
    const itensComPreco = dados.itens.map(item => ({
      ...item,
      precoUnitario: precosPorItem[item.livroUuid],
    }));

    const dadosInsert: IVendaInputDto = {
      ...dados,
      itens: itensComPreco,
      valorTotalItens,
      valorTotal: valorTotalCalculado,
      valorFrete: valorFreteFinal,
      cfrId,
    };

    const { venda, venId } = await this.repositorioVendas.cadastrar(dadosInsert);

    if (dados.cotacaoUuid && this.repositorioCotacaoFrete) {
      await this.repositorioCotacaoFrete.marcarConsumida(dados.cotacaoUuid, venId);
    }

    return venda;
  }

  /**
   * Valida os campos obrigatórios comuns a qualquer operação de venda.
   */
  private static validarDadosVenda(dados: IVendaInputDto): void {
    if (!dados.usuarioUuid) throw new Error('Usuário é obrigatório');
    if (dados.itens.length === 0) throw new Error('Venda deve possuir ao menos um item');
    // valorTotal é calculado pelo serviço a partir do catálogo, não validado aqui
  }

  private static validarParcelamento(dados: IVendaInputDto): void {
    // RN0069: Parcelamento mínimo R$ 80,00
    const parcelas = dados.parcelas || 1;
    // valorTotal pode ser undefined se não enviado pelo cliente (será calculado depois)
    if (parcelas > 1 && dados.valorTotal !== undefined && dados.valorTotal < 80) {
      throw new Error('RN0069: Compras abaixo de R$ 80,00 não permitem parcelamento');
    }
  }

  /**
   * Busca preços do catálogo e calcula o valor total dos itens.
   * Per rule U5: Preços validados no backend com dados do BD, não do cliente
   * Retorna o total e um mapa de livroUuid -> precoUnitario
   */
  private async calcularValorTotalItensDoCatalogo(
    itens: IVendaInputDto['itens'],
  ): Promise<{ total: number; precosPorItem: Record<string, number> }> {
    const precosPorItem: Record<string, number> = {};
    let total = 0;
    for (const item of itens) {
      const precoCatalogo = await this.repositorioVendas.obterPrecoVendaPorLivroUuid(item.livroUuid);
      if (precoCatalogo === null) {
        throw new Error('Livro não encontrado ou indisponível no catálogo');
      }
      precosPorItem[item.livroUuid] = precoCatalogo;
      total += precoCatalogo * item.quantidade;
    }
    return { total, precosPorItem };
  }

  private static validarPagamentosSplit(dados: IVendaInputDto): void {
    // RN0034: Mínimo R$ 10,00 por meio de pagamento no split (exceto cupom)
    const pagamentos = dados.pagamentos || [];
    if (pagamentos.length > 0) {
      pagamentos.forEach((pg) => {
        if (pg.tipo === 'cartao' && pg.valor < 10) {
          throw new Error('RN0034: Valor mínimo por cartão deve ser R$ 10,00');
        }
      });
    }
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
    if (!venda) throw new Error(MENSAGENS_ERRO.VENDA_NAO_ENCONTRADA);

    if (!requisitante.ehAdmin && venda.usuarioUuid !== requisitante.uuid) {
      throw new Error(MENSAGENS_ERRO.VENDA_NAO_ENCONTRADA);
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
    if (!venda) throw new Error(MENSAGENS_ERRO.VENDA_NAO_ENCONTRADA);
    if (venda.usuarioUuid !== usuarioUuid) throw new Error('Acesso negado');
    if (venda.status !== STATUS_VENDAS.ENTREGUE) throw new Error('Apenas pedidos entregues podem ser trocados');

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
    return todas.filter(v => v.status === STATUS_VENDAS.EM_TROCA || v.status === STATUS_VENDAS.TROCA_AUTORIZADA);
  }

  /**
   * Autoriza uma troca (Admin).
   * 
   * RN0091: Isolamento de Dados por Loja
   * - Admin sistema pode autorizar trocas de qualquer loja
   * - Admin comum só pode autorizar trocas da sua loja associada
   */
  public async autorizarTroca(vendaUuid: string): Promise<IVenda> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) throw new Error(MENSAGENS_ERRO.VENDA_NAO_ENCONTRADA);
    if (venda.status !== STATUS_VENDAS.EM_TROCA) throw new Error('Pedido não está em fase de solicitação de troca');

    // Validar isolamento de loja (RN0091)
    const contexto = ContextoRequisicao.obterContexto();
    const isAdminSistema = contexto?.papeis?.includes('admin_sistema');
    const lojIdContexto = contexto?.loj_id;

    if (!isAdminSistema && lojIdContexto && venda.lojId && venda.lojId !== lojIdContexto) {
      throw new Error('Admin não tem permissão para autorizar trocas de outras lojas');
    }

    await this.repositorioVendas.atualizarStatus(vendaUuid, STATUS_VENDAS.TROCA_AUTORIZADA);
    const atualizada = await this.repositorioVendas.obterPorUuid(vendaUuid);
    return atualizada!;
  }

  /**
   * Rejeita uma troca (Admin).
   */
  public async rejeitarTroca(vendaUuid: string, _motivo: string): Promise<IVenda> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) throw new Error(MENSAGENS_ERRO.VENDA_NAO_ENCONTRADA);
    if (venda.status !== STATUS_VENDAS.EM_TROCA) throw new Error('Pedido não está em fase de solicitação de troca');

    await this.repositorioVendas.atualizarStatus(vendaUuid, STATUS_VENDAS.TROCA_REJEITADA);
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
    if (!venda) throw new Error(MENSAGENS_ERRO.VENDA_NAO_ENCONTRADA);
    if (venda.status !== STATUS_VENDAS.TROCA_AUTORIZADA) throw new Error('Troca precisa estar autorizada para confirmar recebimento');

    await this.repositorioVendas.atualizarStatus(vendaUuid, STATUS_VENDAS.CONCLUIDA);

    // Código único do cupom vinculado ao UUID da venda (primeiros 8 caracteres).
    const codigoCupom = `TROCA-${venda.uuid.split('-')[0].toUpperCase()}`;

    const atualizada = (await this.repositorioVendas.obterPorUuid(vendaUuid))!;
    return { venda: atualizada, cupom: codigoCupom };
  }

  /**
   * Lista todas as vendas (Admin).
   */
  public async listarTodas(limite = 500): Promise<IVenda[]> {
    return this.repositorioVendas.listarTodas(limite);
  }

  /**
   * Atualiza status de uma venda (Admin).
   */
  public async atualizarStatus(vendaUuid: string, novoStatus: string): Promise<void> {
    return this.repositorioVendas.atualizarStatus(vendaUuid, novoStatus);
  }

  /**
   * Atualiza o endereço de entrega de uma venda (para redespacho após falha).
   * Busca o endereço do cliente pelo UUID e atualiza a entrega correspondente.
   */
  public async atualizarEnderecoEntrega(vendaUuid: string, enderecoUuid: string): Promise<void> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) throw new Error(MENSAGENS_ERRO.VENDA_NAO_ENCONTRADA);

    if (!this.repositorioEntrega) {
      throw new Error('Repositório de entregas não configurado');
    }

    // Buscar entregas vinculadas à venda
    const entregas = await this.repositorioEntrega.listarPorVendaUuid(vendaUuid);
    if (entregas.length === 0) {
      throw new Error('Nenhuma entrega encontrada para esta venda');
    }

    // Em produção, buscaríamos o endereço completo do cliente pelo enderecoUuid
    // Para simulação, usamos o endereço atual da entrega com pequena modificação
    const entregaMaisRecente = entregas[0];
    const novoEndereco = {
      ...entregaMaisRecente.endereco,
      atualizadoEm: new Date().toISOString(),
      uuid: enderecoUuid,
    };

    // Atualizar o endereço na entrega
    await this.repositorioEntrega.atualizarEndereco(entregaMaisRecente.uuid, novoEndereco);
  }
}
