import { RepositorioEstoque, IItemEstoque, IEntradaEstoque } from './repositorioEstoque';

export interface IKpisEstoque {
  totalItens: number;
  itensCriticos: number;
  estoqueCriticoLimite: number;
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
    const [totalItens, itensCriticos] = await Promise.all([
      this.repositorio.contarTotalEstoque(),
      this.repositorio.contarEstoqueCritico(limiteCritico),
    ]);

    return {
      totalItens,
      itensCriticos,
      estoqueCriticoLimite: limiteCritico,
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
}
