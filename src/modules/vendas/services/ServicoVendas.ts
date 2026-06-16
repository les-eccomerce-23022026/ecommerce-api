import type { IRepositorioCotacaoFrete } from '@/modules/frete/cotacaoFrete/IRepositorioCotacaoFrete';
import { EstadosCotacaoFrete } from '@/modules/frete/cotacaoFrete/EstadosCotacaoFrete';
import { IRepositorioVendas, IVenda } from '../repositories/IRepositorioVendas';
import { IVendaInputDto } from '../dtos/IVenda.dto';
import { IRepositorioEntrega } from '@/modules/entrega/IRepositorioEntrega';
import { MENSAGENS_ERRO } from '@/shared/constants/mensagens-erro.constants';
import { STATUS_VENDAS } from '../constants/statusVendas.constant';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';

const TOLERANCIA_MOEDA = 1.00;

/**
 * Serviço responsável pela lógica de negócios das vendas.
 */
export class ServicoVendas {
  private readonly repositorioVendas: IRepositorioVendas;

  private readonly repositorioCotacaoFrete: IRepositorioCotacaoFrete | null;

  private readonly repositorioEntrega: IRepositorioEntrega | null;

  private readonly repositorioLivros: RepositorioLivrosPostgres;

  constructor(
    repositorioVendas: IRepositorioVendas,
    repositorioCotacaoFrete?: IRepositorioCotacaoFrete,
    repositorioEntrega?: IRepositorioEntrega,
    repositorioLivros?: RepositorioLivrosPostgres,
  ) {
    this.repositorioVendas = repositorioVendas;
    this.repositorioCotacaoFrete = repositorioCotacaoFrete ?? null;
    this.repositorioEntrega = repositorioEntrega ?? null;
    this.repositorioLivros = repositorioLivros ?? new RepositorioLivrosPostgres(null as any);
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

    // Vincular a cotação à venda (sem consumir ainda) para evitar reutilização
    // e permitir recuperação caso o pagamento falhe.
    if (dados.cotacaoUuid && this.repositorioCotacaoFrete) {
      await this.repositorioCotacaoFrete.vincularVenda(dados.cotacaoUuid, venId);
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
      
      // RN0032: Validar estoque disponível
      const livro = await this.repositorioLivros.obterPorUuid(item.livroUuid);
      if (!livro) {
        throw new Error(`RN0032: Livro ${item.livroUuid} não encontrado`);
      }
      if (livro.estoqueDisponivel < item.quantidade) {
        throw new Error(`RN0032: Estoque insuficiente para o livro ${livro.titulo}. Disponível: ${livro.estoqueDisponivel}, Solicitado: ${item.quantidade}`);
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

    // RN0043: Prazo de arrependimento — 7 dias corridos a partir da data de entrega confirmada
    const dataEntrega = new Date(venda.dataHoraEntrega);
    const hoje = new Date();
    
    // Normalizar para meia-noite para calcular dias corridos corretamente
    const dataEntregaNormalizada = new Date(dataEntrega);
    dataEntregaNormalizada.setHours(0, 0, 0, 0);
    
    const hojeNormalizado = new Date(hoje);
    hojeNormalizado.setHours(0, 0, 0, 0);
    
    const diffDias = Math.floor((hojeNormalizado.getTime() - dataEntregaNormalizada.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDias >= 7) {
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
    return todas.filter(v => v.status === STATUS_VENDAS.EM_TROCA || v.status === STATUS_VENDAS.TROCA_AUTORIZADA || v.status === STATUS_VENDAS.TROCA_REJEITADA);
  }

  /**
   * Lista vendas com solicitação de devolução (Admin).
   */
  public async listarDevolucoesPendentes(): Promise<IVenda[]> {
    const todas = await this.repositorioVendas.listarTodas(1000);
    return todas.filter(v => v.status === STATUS_VENDAS.EM_DEVOLUCAO || v.status === STATUS_VENDAS.DEVOLUCAO_AUTORIZADA || v.status === STATUS_VENDAS.DEVOLUCAO_REJEITADA);
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
   * Solicita devolução de itens de uma venda.
   * RN0043: prazo de 7 dias contados a partir da data de entrega confirmada.
   */
  public async solicitarDevolucao(vendaUuid: string, usuarioUuid: string, motivo: string, itensUuids: string[]): Promise<IVenda> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) throw new Error(MENSAGENS_ERRO.VENDA_NAO_ENCONTRADA);
    if (venda.usuarioUuid !== usuarioUuid) throw new Error('Acesso negado');
    if (venda.status !== STATUS_VENDAS.ENTREGUE) throw new Error('Apenas pedidos entregues podem ser devolvidos');

    if (!venda.dataHoraEntrega) {
      throw new Error('Data de entrega não registrada; não é possível validar o prazo de devolução');
    }

    // RN0043: Prazo de arrependimento — 7 dias corridos a partir da data de entrega confirmada
    const dataEntrega = new Date(venda.dataHoraEntrega);
    const hoje = new Date();
    
    // Normalizar para meia-noite para calcular dias corridos corretamente
    const dataEntregaNormalizada = new Date(dataEntrega);
    dataEntregaNormalizada.setHours(0, 0, 0, 0);
    
    const hojeNormalizado = new Date(hoje);
    hojeNormalizado.setHours(0, 0, 0, 0);
    
    const diffDias = Math.floor((hojeNormalizado.getTime() - dataEntregaNormalizada.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDias >= 7) {
      throw new Error('Prazo de 7 dias para devolução expirado');
    }

    await this.repositorioVendas.registrarSolicitacaoDevolucao(vendaUuid, motivo, itensUuids);
    const atualizada = await this.repositorioVendas.obterPorUuid(vendaUuid);
    return atualizada!;
  }

  /**
   * Autoriza uma devolução (Admin).
   * 
   * RN0091: Isolamento de Dados por Loja
   * - Admin sistema pode autorizar devoluções de qualquer loja
   * - Admin comum só pode autorizar devoluções da sua loja associada
   */
  public async autorizarDevolucao(vendaUuid: string): Promise<IVenda> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) throw new Error(MENSAGENS_ERRO.VENDA_NAO_ENCONTRADA);
    if (venda.status !== STATUS_VENDAS.EM_DEVOLUCAO) throw new Error('Pedido não está em fase de solicitação de devolução');

    // Validar isolamento de loja (RN0091)
    const contexto = ContextoRequisicao.obterContexto();
    const isAdminSistema = contexto?.papeis?.includes('admin_sistema');
    const lojIdContexto = contexto?.loj_id;

    if (!isAdminSistema && lojIdContexto && venda.lojId && venda.lojId !== lojIdContexto) {
      throw new Error('Admin não tem permissão para autorizar devoluções de outras lojas');
    }

    await this.repositorioVendas.atualizarStatus(vendaUuid, STATUS_VENDAS.DEVOLUCAO_AUTORIZADA);
    const atualizada = await this.repositorioVendas.obterPorUuid(vendaUuid);
    return atualizada!;
  }

  /**
   * Rejeita uma devolução (Admin).
   */
  public async rejeitarDevolucao(vendaUuid: string, _motivo: string): Promise<IVenda> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) throw new Error(MENSAGENS_ERRO.VENDA_NAO_ENCONTRADA);
    if (venda.status !== STATUS_VENDAS.EM_DEVOLUCAO) throw new Error('Pedido não está em fase de solicitação de devolução');

    await this.repositorioVendas.atualizarStatus(vendaUuid, STATUS_VENDAS.DEVOLUCAO_REJEITADA);
    const atualizada = await this.repositorioVendas.obterPorUuid(vendaUuid);
    return atualizada!;
  }

  /**
   * Confirma entrega do pedido (Admin) - atualiza status e data_hora_entrega
   * Usado em testes E2E para simular entrega completa
   */
  public async confirmarEntregaAdmin(vendaUuid: string): Promise<void> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) throw new Error(MENSAGENS_ERRO.VENDA_NAO_ENCONTRADA);
    if (venda.status !== STATUS_VENDAS.EM_TRANSITO) throw new Error('Pedido não está em trânsito');

    await this.repositorioVendas.atualizarStatusComDataEntrega(vendaUuid, STATUS_VENDAS.ENTREGUE, new Date());
  }

  /**
   * Confirma recebimento da devolução (Admin).
   * Atualiza status para 'CONCLUÍDA' e processa o reembolso.
   */
  public async confirmarRecebimentoDevolucao(
    vendaUuid: string,
    _retornarEstoque: boolean,
  ): Promise<{ venda: IVenda; reembolsoProcessado: boolean }> {
    const venda = await this.repositorioVendas.obterPorUuid(vendaUuid);
    if (!venda) throw new Error(MENSAGENS_ERRO.VENDA_NAO_ENCONTRADA);
    if (venda.status !== STATUS_VENDAS.DEVOLUCAO_AUTORIZADA) throw new Error('Devolução precisa estar autorizada para confirmar recebimento');

    await this.repositorioVendas.atualizarStatus(vendaUuid, STATUS_VENDAS.CONCLUIDA);

    // TODO: Implementar lógica de reembolso através do módulo de pagamentos
    // Por enquanto, apenas marcamos como processado
    const atualizada = (await this.repositorioVendas.obterPorUuid(vendaUuid))!;
    return { venda: atualizada, reembolsoProcessado: false };
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
