import { RepositorioEstoque, IItemEstoque, IEntradaEstoque, IAtualizacaoEstoque } from './repositorioEstoque';

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
  constructor(private readonly repositorio: RepositorioEstoque) {}

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
}
