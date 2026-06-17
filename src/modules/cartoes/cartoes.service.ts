import { IRepositorioCartaoUsuario } from './IRepositorioCartaoUsuario';
import { ICartaoUsuario } from '../../shared/types/ICartaoUsuario';
import { MENSAGENS_ERRO } from '@/shared/constants/mensagens-erro.constants';

export interface ICriarCartaoDto {
  uuidBandeira: string;
  token: string;
  ultimosDigitosCartao: string;
  nomeImpresso: string;
  validade: Date;
  principal?: boolean;
}

export interface IAtualizarCartaoDto {
  uuidBandeira?: string;
  token?: string;
  ultimosDigitosCartao?: string;
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

  private static validarMesValidadeCartao(validade: Date | undefined): void {
    if (!validade || !(validade instanceof Date)) return;
    const mes = validade.getMonth() + 1;
    if (mes < 1 || mes > 12) {
      throw new Error('O mês de validade deve ser entre 01 e 12.');
    }
  }

  /**
   * Cadastra um novo cartão para um usuário.
   */
  async cadastrarCartao(idUsuario: number, dados: ICriarCartaoDto): Promise<ICartaoUsuario> {
    ServicoCartoes.validarMesValidadeCartao(dados.validade);

    // Buscar ID interno da bandeira pelo UUID público
    const idBandeira = await this.repositorioCartoes.buscarIdBandeiraPorUuid(dados.uuidBandeira);
    if (!idBandeira) {
      throw new Error(MENSAGENS_ERRO.BANDEIRA_NAO_ENCONTRADA);
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
   * Atualiza um cartão existente do usuário autenticado.
   */
  async atualizarCartao(
    idUsuario: number,
    uuid: string,
    dados: IAtualizarCartaoDto,
  ): Promise<ICartaoUsuario | null> {
    const cartaoExistente = await this.repositorioCartoes.buscarPorUuid(uuid);
    if (!cartaoExistente || cartaoExistente.idUsuario !== idUsuario) {
      throw new Error(MENSAGENS_ERRO.CARTAO_NAO_ENCONTRADO);
    }

    // Se estiver definindo como principal, remove dos outros
    if (dados.principal) {
      await this.repositorioCartoes.definirComoPrincipal(uuid, idUsuario);
    }

    const payloadRepositorio: IAtualizarCartaoDto & { idBandeira?: number } = { ...dados };

    // Se houver uuidBandeira, buscar o id interno
    if (dados.uuidBandeira) {
      const idBandeira = await this.repositorioCartoes.buscarIdBandeiraPorUuid(dados.uuidBandeira);
      if (!idBandeira) {
        throw new Error(MENSAGENS_ERRO.BANDEIRA_NAO_ENCONTRADA);
      }
      payloadRepositorio.idBandeira = idBandeira;
      delete payloadRepositorio.uuidBandeira;
    }

    return this.repositorioCartoes.atualizar(uuid, payloadRepositorio);
  }

  /**
   * Remove um cartão do usuário autenticado.
   */
  async removerCartao(idUsuario: number, uuid: string): Promise<void> {
    const cartaoExistente = await this.repositorioCartoes.buscarPorUuid(uuid);
    if (!cartaoExistente || cartaoExistente.idUsuario !== idUsuario) {
      throw new Error(MENSAGENS_ERRO.CARTAO_NAO_ENCONTRADO);
    }

    const removido = await this.repositorioCartoes.excluir(uuid);
    if (!removido) {
      throw new Error(MENSAGENS_ERRO.CARTAO_NAO_ENCONTRADO);
    }
  }

  /**
   * Define um cartão como principal.
   */
  async definirCartaoPrincipal(uuid: string, idUsuario: number): Promise<void> {
    const definido = await this.repositorioCartoes.definirComoPrincipal(uuid, idUsuario);
    if (!definido) {
      throw new Error(MENSAGENS_ERRO.CARTAO_NAO_PERTENCE_AO_USUARIO);
    }
  }
}
