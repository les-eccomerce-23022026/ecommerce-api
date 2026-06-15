import { RepositorioParametrosInativacaoPostgres } from '@/modules/livros/infrastructure/RepositorioParametrosInativacaoPostgres';
import { IRelatorioInativacaoAutomatica } from '@/modules/livros/domain/IRelatorioInativacaoAutomatica';

interface ILivroElegivel {
  uuid: string;
  titulo: string;
  preco: number;
}

interface IRepositorioLivrosParaInativacao {
  listarLivrosSemEstoqueAbaixoValorMinimo(valorMinimo: number): Promise<ILivroElegivel[]>;
  marcarForaDeMercado(uuids: string[]): Promise<number>;
}

export class ServicoInativacaoAutomaticaLivros {
  constructor(
    private readonly repositorioParametros: RepositorioParametrosInativacaoPostgres,
    private readonly repositorioLivros: IRepositorioLivrosParaInativacao,
  ) {}

  async executarVerificacaoAutomatica(): Promise<IRelatorioInativacaoAutomatica> {
    const params = await this.repositorioParametros.obterParametrosAtivos();

    if (!params) {
      throw new Error('Nenhum parâmetro de inativação configurado.');
    }

    const elegíveis = await this.repositorioLivros.listarLivrosSemEstoqueAbaixoValorMinimo(
      params.valorMinimoCatalogo,
    );

    if (elegíveis.length === 0) {
      return {
        totalVerificados: 0,
        totalInativados: 0,
        valorMinimoUtilizado: params.valorMinimoCatalogo,
        livrosInativados: [],
        executadoEm: new Date(),
      };
    }

    const uuids = elegíveis.map((l) => l.uuid);
    const totalInativados = await this.repositorioLivros.marcarForaDeMercado(uuids);

    return {
      totalVerificados: elegíveis.length,
      totalInativados,
      valorMinimoUtilizado: params.valorMinimoCatalogo,
      livrosInativados: elegíveis,
      executadoEm: new Date(),
    };
  }
}
