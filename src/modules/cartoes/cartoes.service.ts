import { IRepositorioCartaoUsuario } from './IRepositorioCartaoUsuario';
import { ICartaoUsuario } from '../../shared/types/ICartaoUsuario';

export interface ICriarCartaoDto {
  uuidBandeira: string;
  token: string;
  ultimosDigitosCartao: string;
  nomeImpresso: string;
  validade: Date;
  cvv?: string; // Adicionado para validação
  principal?: boolean;
}

export interface IAtualizarCartaoDto {
  uuidBandeira?: string;
  token?: string;
  ultimosDigitosCartao?: string;
  nomeImpresso?: string;
  validade?: Date;
  cvv?: string; // Adicionado para validação
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
    // Validação de CVV (RN0027 - Apenas 3 dígitos numéricos)
    if (dados.cvv) {
      const cvvLimpo = dados.cvv.replace(/\D/g, '');
      if (cvvLimpo.length !== 3) {
        throw new Error('O CVV deve conter exatamente 3 dígitos numéricos.');
      }
    }

    // Validação de Validade (MM/AAAA - Apenas mês e ano)
    if (dados.validade && (dados.validade instanceof Date)) {
      const mes = dados.validade.getMonth() + 1;
      if (mes < 1 || mes > 12) {
        throw new Error('O mês de validade deve ser entre 01 e 12.');
      }
    }

    // Buscar ID interno da bandeira pelo UUID público
    const idBandeira = await this.repositorioCartoes.buscarIdBandeiraPorUuid(dados.uuidBandeira);
    if (!idBandeira) {
      throw new Error('Bandeira não encontrada.');
    }

    const cartao = await this.repositorioCartoes.criar({
      idUsuario,
      idBandeira,
      token: dados.token,
      ultimosDigitosCartao: dados.ultimosDigitosCartao,
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

    const payloadRepositorio: IAtualizarCartaoDto & { idBandeira?: number } = { ...dados };

    // Se houver uuidBandeira, buscar o id interno
    if (dados.uuidBandeira) {
      const idBandeira = await this.repositorioCartoes.buscarIdBandeiraPorUuid(dados.uuidBandeira);
      if (!idBandeira) {
        throw new Error('Bandeira não encontrada.');
      }
      payloadRepositorio.idBandeira = idBandeira;
      delete payloadRepositorio.uuidBandeira;
    }

    return this.repositorioCartoes.atualizar(uuid, payloadRepositorio);
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
