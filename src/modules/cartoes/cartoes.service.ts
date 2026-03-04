import { IRepositorioCartaoUsuario } from './IRepositorioCartaoUsuario';
import { ICartaoUsuario } from '../../shared/types/ICartaoUsuario';

export interface ICriarCartaoDto {
  idBandeiraCartao: number;
  tokenCartao: string;
  finalCartao: string;
  nomeImpresso: string;
  validade: Date;
  principal?: boolean;
}

export interface IAtualizarCartaoDto {
  idBandeiraCartao?: number;
  tokenCartao?: string;
  finalCartao?: string;
  nomeImpresso?: string;
  validade?: Date;
  principal?: boolean;
}

/**
 * Serviço responsável pelo gerenciamento de cartões de crédito dos usuários.
 */
export class ServicoCartoes {
  private readonly repositorioCartoes: IRepositorioCartaoUsuario;

  constructor(repositorioCartoes: IRepositorioCartaoUsuario) {
    this.repositorioCartoes = repositorioCartoes;
  }

  /**
   * Cadastra um novo cartão para um usuário.
   */
  async cadastrarCartao(idUsuario: number, dados: ICriarCartaoDto): Promise<ICartaoUsuario> {
    // Se for principal, remove o flag dos outros cartões
    if (dados.principal) {
      await this.repositorioCartoes.definirComoPrincipal('', idUsuario); // Remove todos
    }

    const cartao = await this.repositorioCartoes.criar({
      idUsuario,
      idBandeiraCartao: dados.idBandeiraCartao,
      tokenCartao: dados.tokenCartao,
      finalCartao: dados.finalCartao,
      nomeImpresso: dados.nomeImpresso,
      validade: dados.validade,
      principal: dados.principal || false
    });

    return cartao;
  }

  /**
   * Lista todos os cartões de um usuário.
   */
  async listarCartoesUsuario(idUsuario: number): Promise<ICartaoUsuario[]> {
    return this.repositorioCartoes.buscarPorUsuario(idUsuario);
  }

  /**
   * Atualiza um cartão existente.
   */
  async atualizarCartao(uuid: string, dados: IAtualizarCartaoDto): Promise<ICartaoUsuario | null> {
    const cartaoExistente = await this.repositorioCartoes.buscarPorUuid(uuid);
    if (!cartaoExistente) {
      throw new Error('Cartão não encontrado.');
    }

    // Se estiver definindo como principal, remove dos outros
    if (dados.principal) {
      await this.repositorioCartoes.definirComoPrincipal(uuid, cartaoExistente.idUsuario);
    }

    const dadosAtualizados = { ...dados, ...(dados.principal ? { principal: true } : {}) };
    return this.repositorioCartoes.atualizar(uuid, dadosAtualizados);
  }

  /**
   * Remove um cartão.
   */
  async removerCartao(uuid: string): Promise<void> {
    const removido = await this.repositorioCartoes.excluir(uuid);
    if (!removido) {
      throw new Error('Cartão não encontrado.');
    }
  }

  /**
   * Define um cartão como principal.
   */
  async definirCartaoPrincipal(uuid: string, idUsuario: number): Promise<void> {
    const definido = await this.repositorioCartoes.definirComoPrincipal(uuid, idUsuario);
    if (!definido) {
      throw new Error('Cartão não encontrado ou não pertence ao usuário.');
    }
  }
}