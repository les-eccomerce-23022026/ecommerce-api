import type { ICarrinhoItemResposta, ICarrinhoResposta } from '@/modules/carrinho/ICarrinho.dto';
import { RepositorioCarrinhoPostgres } from '@/modules/carrinho/repositorioCarrinhoPostgres';
import { RepositorioLivrosPostgres } from '@/modules/livros/repositorioLivrosPostgres';

const FRETE_PADRAO = { valor: 15, prazo: '5 a 7 dias úteis' } as const;

export class ServicoCarrinho {
  constructor(
    private readonly repo: RepositorioCarrinhoPostgres,
    private readonly livros: RepositorioLivrosPostgres,
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

    if (quantidade > 0) {
      const estoque = await this.livros.obterEstoqueDisponivelPorLivId(livId);
      if (estoque === null) throw new Error('Livro indisponível no estoque');
      if (quantidade > estoque) {
        throw new Error('Quantidade superior ao estoque disponível');
      }
    }

    await this.repo.upsertQuantidade(usuId, livId, quantidade, lojIdAtual);
    return this.montarResposta(usuUuid);
  }

  async limpar(usuUuid: string): Promise<ICarrinhoResposta> {
    const usuId = await this.repo.obterUsuIdPorUuid(usuUuid);
    if (!usuId) throw new Error('Usuário não encontrado');
    await this.repo.limpar(usuId);
    return this.montarResposta(usuUuid);
  }
}
