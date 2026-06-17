import { RepositorioEstoque, IItemEstoque, IEntradaEstoque, IAtualizacaoEstoque } from './repositorioEstoque';
import { IRepositorioReservas, ICriarReservaEstoqueDTO, IReservaEstoque } from './IRepositorioReservas';
import { DadosInvalidosError, OperacaoNaoPermitidaError } from '@/shared/exceptions/Exceptions';
import { Logger } from '@/shared/utils/Logger.util';

export interface IKpisEstoque {
  totalLivros: number;
  abaixoLimite: number;
  estoqueCriticoLimite: number;
  valorTotalEstoque: number;
  valorTotalCusto: number;
  quantidadeTotalReservada: number;
  quantidadeTotalDisponivel: number;
}

export class ServicoEstoque {
  constructor(
    private readonly repositorio: RepositorioEstoque,
    private readonly repositorioReservas: IRepositorioReservas,
  ) {}

  async listarEstoque(limite = 500): Promise<IItemEstoque[]> {
    return this.repositorio.listarEstoque(limite);
  }

  async listarEstoqueCritico(limite = 5): Promise<IItemEstoque[]> {
    return this.repositorio.obterEstoqueCritico(limite);
  }

  async obterKpis(limiteCritico = 5): Promise<IKpisEstoque> {
    const [totalLivros, abaixoLimite, valorTotalEstoque, valorTotalCusto, quantidadeTotalReservada, quantidadeTotalDisponivel] = await Promise.all([
      this.repositorio.contarTotalEstoque(),
      this.repositorio.contarEstoqueCritico(limiteCritico),
      this.repositorio.calcularValorTotalEstoque(),
      this.repositorio.calcularValorTotalCusto(),
      this.repositorio.calcularQuantidadeTotalReservada(),
      this.repositorio.calcularQuantidadeTotalDisponivel(),
    ]);

    return {
      totalLivros,
      abaixoLimite,
      estoqueCriticoLimite: limiteCritico,
      valorTotalEstoque,
      valorTotalCusto,
      quantidadeTotalReservada,
      quantidadeTotalDisponivel,
    };
  }

  async registrarEntrada(dados: IEntradaEstoque): Promise<void> {
    if (dados.quantidade <= 0) {
      throw new Error('Quantidade deve ser maior que zero (RN0061).');
    }

    if (dados.custoUnitario <= 0) {
      throw new Error('Custo unitário deve ser maior que zero (RN0062).');
    }

    if (dados.dataEntrada && dados.dataEntrada > new Date()) {
      throw new Error('Data de entrada não pode ser futura (RN0064).');
    }

    await this.repositorio.registrarEntrada(dados);
  }

  async atualizarEstoque(dados: IAtualizacaoEstoque): Promise<void> {
    if (dados.quantidadeDisponivel !== undefined && dados.quantidadeDisponivel < 0) {
      throw new Error('Quantidade disponível não pode ser negativa.');
    }

    if (dados.precoVenda !== undefined && dados.precoVenda <= 0) {
      throw new Error('Preço de venda deve ser maior que zero.');
    }

    if (dados.valorCustoAtual !== undefined && dados.valorCustoAtual < 0) {
      throw new Error('Valor de custo atual não pode ser negativo.');
    }

    await this.repositorio.atualizarEstoque(dados);
  }

  /**
   * Reserva estoque temporariamente para um usuário
   * @param usuId ID do usuário
   * @param livId ID do livro
   * @param quantidade Quantidade a reservar
   * @param lojId ID da loja
   * @param tempoExpiracaoMinutos Tempo de expiração em minutos (padrão: 30)
   * @returns Reserva criada
   */
  async reservarEstoque(
    usuId: number,
    livId: number,
    quantidade: number,
    lojId: number,
    tempoExpiracaoMinutos: number = 30
  ): Promise<IReservaEstoque> {
    if (quantidade <= 0) {
      throw new DadosInvalidosError('Quantidade deve ser maior que zero');
    }

    if (tempoExpiracaoMinutos <= 0) {
      throw new DadosInvalidosError('Tempo de expiração deve ser maior que zero');
    }

    // Verificar se já existe reserva ativa para este usuário e livro
    const reservaExistente = await this.repositorioReservas.buscarReservaAtivaPorUsuarioLivro(
      usuId,
      livId,
      lojId
    );

    if (reservaExistente) {
      // Atualizar reserva existente
      const novaQuantidade = reservaExistente.quantidade + quantidade;
      const expiraEm = new Date();
      expiraEm.setMinutes(expiraEm.getMinutes() + tempoExpiracaoMinutos);

      await this.repositorio.reservarQuantidade(livId, quantidade, lojId);

      const reservaAtualizada = await this.repositorioReservas.atualizar({
        uuid: reservaExistente.uuid,
        quantidade: novaQuantidade,
        expiraEm,
      });

      Logger.info(
        `[ServicoEstoque] Reserva atualizada: usuId=${usuId}, livId=${livId}, quantidade=${novaQuantidade}`
      );

      return reservaAtualizada;
    }

    // Criar nova reserva
    const expiraEm = new Date();
    expiraEm.setMinutes(expiraEm.getMinutes() + tempoExpiracaoMinutos);

    const dadosReserva: ICriarReservaEstoqueDTO = {
      usuId,
      livId,
      quantidade,
      expiraEm,
      lojId,
    };

    // Reservar quantidade no estoque
    await this.repositorio.reservarQuantidade(livId, quantidade, lojId);

    // Criar registro de reserva
    const reserva = await this.repositorioReservas.criar(dadosReserva);

    Logger.info(
      `[ServicoEstoque] Reserva criada: usuId=${usuId}, livId=${livId}, quantidade=${quantidade}, expiraEm=${expiraEm.toISOString()}`
    );

    return reserva;
  }

  /**
   * Libera uma reserva de estoque (cancelamento)
   * @param uuid UUID da reserva
   * @param lojId ID da loja
   */
  async liberarReserva(uuid: string, lojId: number): Promise<void> {
    const reserva = await this.repositorioReservas.buscarPorUuid(uuid, lojId);

    if (!reserva) {
      throw new OperacaoNaoPermitidaError('Reserva não encontrada');
    }

    if (reserva.status !== 'ATIVA') {
      throw new OperacaoNaoPermitidaError(`Reserva não pode ser liberada (status: ${reserva.status})`);
    }

    // Liberar quantidade no estoque
    await this.repositorio.liberarQuantidadeReservada(reserva.livId, reserva.quantidade, lojId);

    // Cancelar reserva
    await this.repositorioReservas.cancelar(uuid, lojId);

    Logger.info(
      `[ServicoEstoque] Reserva liberada: uuid=${uuid}, livId=${reserva.livId}, quantidade=${reserva.quantidade}`
    );
  }

  /**
   * Consome uma reserva de estoque (venda confirmada)
   * @param uuid UUID da reserva
   * @param lojId ID da loja
   */
  async consumirReserva(uuid: string, lojId: number): Promise<void> {
    const reserva = await this.repositorioReservas.buscarPorUuid(uuid, lojId);

    if (!reserva) {
      throw new OperacaoNaoPermitidaError('Reserva não encontrada');
    }

    if (reserva.status !== 'ATIVA') {
      throw new OperacaoNaoPermitidaError(`Reserva não pode ser consumida (status: ${reserva.status})`);
    }

    // Consumir quantidade reservada no estoque
    await this.repositorio.consumirQuantidadeReservada(reserva.livId, reserva.quantidade, lojId);

    // Marcar reserva como consumida
    await this.repositorioReservas.marcarComoConsumida(uuid, lojId);

    Logger.info(
      `[ServicoEstoque] Reserva consumida: uuid=${uuid}, livId=${reserva.livId}, quantidade=${reserva.quantidade}`
    );
  }

  /**
   * Cancela todas as reservas ativas de um usuário
   * @param usuId ID do usuário
   * @param lojId ID da loja
   */
  async cancelarReservasUsuario(usuId: number, lojId: number): Promise<void> {
    const reservas = await this.repositorioReservas.buscarReservasAtivas(usuId, lojId);

    for (const reserva of reservas) {
      await this.liberarReserva(reserva.uuid, lojId);
    }

    Logger.info(`[ServicoEstoque] ${reservas.length} reserva(s) cancelada(s) para usuId=${usuId}`);
  }
}
