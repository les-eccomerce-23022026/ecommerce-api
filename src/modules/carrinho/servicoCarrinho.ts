import type { ICarrinhoItemResposta, ICarrinhoResposta } from '@/modules/carrinho/ICarrinho.dto';
import { RepositorioCarrinhoPostgres } from '@/modules/carrinho/repositorioCarrinhoPostgres';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';
import { ServicoEstoque } from '@/modules/estoque/servicoEstoque';
import { IRepositorioReservas } from '@/modules/estoque/IRepositorioReservas';
import { Logger } from '@/shared/utils/Logger.util';

const FRETE_PADRAO = { valor: 15, prazo: '5 a 7 dias úteis' } as const;

export class ServicoCarrinho {
  constructor(
    private readonly repo: RepositorioCarrinhoPostgres,
    private readonly livros: RepositorioLivrosPostgres,
    private readonly servicoEstoque: ServicoEstoque,
    private readonly repositorioReservas: IRepositorioReservas,
  ) {}

  async montarResposta(usuUuid: string): Promise<ICarrinhoResposta> {
    const rows = await this.repo.listarItens(usuUuid);
    const itens: ICarrinhoItemResposta[] = rows.map((r) => {
      const precoUnitario = Number(r.etq_preco_venda);
      const q = Number(r.cri_quantidade);
      return {
        uuid: r.liv_uuid,
        imagem: r.liv_imagem_url ?? '',
        titulo: r.liv_titulo,
        isbn: r.liv_isbn,
        precoUnitario,
        quantidade: q,
        subtotal: precoUnitario * q,
      };
    });

    const subtotal = itens.reduce((acc, i) => acc + i.subtotal, 0);
    const frete = itens.length === 0 ? 0 : FRETE_PADRAO.valor;
    return {
      itens,
      fretePadrao: { valor: FRETE_PADRAO.valor, prazo: FRETE_PADRAO.prazo },
      resumo: {
        subtotal,
        frete,
        total: subtotal + frete,
      },
    };
  }

  async alterarItem(
    usuUuid: string,
    livroUuid: string,
    quantidade: number,
    lojIdAtual?: number,
  ): Promise<ICarrinhoResposta> {
    const usuId = await this.repo.obterUsuIdPorUuid(usuUuid);
    if (!usuId) throw new Error('Usuário não encontrado');

    const livId = await this.livros.obterLivIdPorUuid(livroUuid);
    if (!livId) throw new Error('Livro não encontrado');

    const lojId = lojIdAtual ?? 1;

    if (quantidade > 0) {
      const estoque = await this.livros.obterEstoqueDisponivelPorLivId(livId);
      if (estoque === null) throw new Error('Livro indisponível no estoque');
      if (quantidade > estoque) {
        throw new Error('Quantidade superior ao estoque disponível');
      }

      // Criar ou atualizar reserva de estoque
      await this.servicoEstoque.reservarEstoque(usuId, livId, quantidade, lojId, 30);
      Logger.info(`[ServicoCarrinho] Reserva criada/atualizada: usuId=${usuId}, livId=${livId}, quantidade=${quantidade}`);
    } else {
      // Cancelar reserva ao remover item
      const reservaAtiva = await this.repositorioReservas.buscarReservaAtivaPorUsuarioLivro(usuId, livId, lojId);
      if (reservaAtiva) {
        await this.servicoEstoque.liberarReserva(reservaAtiva.uuid, lojId);
        Logger.info(`[ServicoCarrinho] Reserva cancelada ao remover item: usuId=${usuId}, livId=${livId}`);
      }
    }

    await this.repo.upsertQuantidade(usuId, livId, quantidade, lojId);
    return this.montarResposta(usuUuid);
  }

  async limpar(usuUuid: string, lojIdContexto?: number): Promise<ICarrinhoResposta> {
    const usuId = await this.repo.obterUsuIdPorUuid(usuUuid);
    if (!usuId) throw new Error('Usuário não encontrado');

    const lojId = lojIdContexto ?? 1;

    // Cancelar todas as reservas do usuário
    try {
      await this.servicoEstoque.cancelarReservasUsuario(usuId, lojId);
      Logger.info(`[ServicoCarrinho] Todas as reservas canceladas ao limpar carrinho: usuId=${usuId}`);
    } catch (erro) {
      Logger.warn(`[ServicoCarrinho] Falha ao cancelar reservas: ${erro instanceof Error ? erro.message : String(erro)}`);
    }

    await this.repo.limpar(usuId);
    return this.montarResposta(usuUuid);
  }

  /**
   * Cancela reserva de um item específico do carrinho
   * @param usuUuid UUID do usuário
   * @param livroUuid UUID do livro
   * @param lojId ID da loja
   */
  async cancelarReservaItem(usuUuid: string, livroUuid: string, lojId: number): Promise<void> {
    const usuId = await this.repo.obterUsuIdPorUuid(usuUuid);
    if (!usuId) throw new Error('Usuário não encontrado');

    const livId = await this.livros.obterLivIdPorUuid(livroUuid);
    if (!livId) throw new Error('Livro não encontrado');

    try {
      // Buscar reserva ativa para este usuário e livro
      const reservas = await this.repositorioReservas.buscarReservasPorUsuarioLivro(usuId, livId, lojId);

      for (const reserva of reservas) {
        if (reserva.status === 'ATIVA') {
          await this.servicoEstoque.liberarReserva(reserva.uuid, lojId);
          Logger.info(`[ServicoCarrinho] Reserva cancelada: uuid=${reserva.uuid}, usuId=${usuId}, livId=${livId}`);
        }
      }
    } catch (erro) {
      Logger.warn(`[ServicoCarrinho] Falha ao cancelar reserva: ${erro instanceof Error ? erro.message : String(erro)}`);
    }
  }
}
