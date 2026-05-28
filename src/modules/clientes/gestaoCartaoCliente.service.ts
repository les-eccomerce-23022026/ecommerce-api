import { IRepositorioCartaoUsuario } from '@/modules/cartoes/IRepositorioCartaoUsuario';
import { ICartaoDto } from '@/modules/clientes/Iclientes.dto';
import { DadosInvalidosError } from '@/shared/exceptions/Exceptions';

/**
 * Serviço responsável pela gestão de cartões de clientes.
 * 
 * Responsabilidades:
 * - Criação de cartão
 * - Atualização de cartão
 * - Remoção de cartão
 * - Definição de cartão principal
 * - Validação de dados de cartão
 * - Mascaramento de dados sensíveis
 */
export class GestaoCartaoCliente {
  constructor(private readonly repositorioCartoes: IRepositorioCartaoUsuario) {}

  /**
   * Cria um novo cartão para um usuário.
   * 
   * @param idUsuario - ID interno do usuário
   * @param dados - Dados do cartão
   * @param principal - Se é o cartão principal
   * @returns Cartão criado
   */
  public async criarCartao(
    idUsuario: number,
    dados: ICartaoDto,
    principal: boolean = false
  ): Promise<ICartaoDto> {
    this.validarDadosCartao(dados);

    if (principal) {
      await this.removerPrincipalDeTodosCartoes(idUsuario);
    }

    const cartao = await this.repositorioCartoes.criar({
      idUsuario,
      ultimosDigitosCartao: dados.ultimosDigitosCartao,
      nomeImpresso: dados.nomeImpresso,
      bandeira: dados.bandeira,
      validade: new Date(dados.validade + '-01'),
      principal,
    });

    return this.converterParaDto(cartao);
  }

  /**
   * Atualiza um cartão existente.
   * 
   * @param idUsuario - ID interno do usuário
   * @param uuidCartao - UUID do cartão
   * @param dados - Novos dados do cartão
   * @returns Cartão atualizado
   */
  public async atualizarCartao(
    idUsuario: number,
    uuidCartao: string,
    dados: Partial<ICartaoDto>
  ): Promise<ICartaoDto> {
    const cartoesExistentes = await this.repositorioCartoes.buscarPorUsuario(idUsuario);
    const cartaoExistente = cartoesExistentes.find((c) => c.uuid === uuidCartao);
    
    if (!cartaoExistente) {
      throw new DadosInvalidosError('Cartão não encontrado.');
    }

    if (dados.ultimosDigitosCartao || dados.nomeImpresso || dados.bandeira || dados.validade) {
      this.validarDadosCartao(dados as ICartaoDto);
    }

    if (dados.principal) {
      await this.removerPrincipalDeTodosCartoes(idUsuario);
    }

    const cartaoAtualizado = await this.repositorioCartoes.atualizar({
      ...cartaoExistente,
      ultimosDigitosCartao: dados.ultimosDigitosCartao || cartaoExistente.ultimosDigitosCartao,
      nomeImpresso: dados.nomeImpresso || cartaoExistente.nomeImpresso,
      bandeira: dados.bandeira || cartaoExistente.bandeira,
      validade: dados.validade ? new Date(dados.validade + '-01') : cartaoExistente.validade,
      principal: dados.principal !== undefined ? dados.principal : cartaoExistente.principal,
    });

    return this.converterParaDto(cartaoAtualizado);
  }

  /**
   * Remove um cartão.
   * 
   * @param idUsuario - ID interno do usuário
   * @param uuidCartao - UUID do cartão
   */
  public async removerCartao(idUsuario: number, uuidCartao: string): Promise<void> {
    const cartoesExistentes = await this.repositorioCartoes.buscarPorUsuario(idUsuario);
    const cartaoExistente = cartoesExistentes.find((c) => c.uuid === uuidCartao);
    
    if (!cartaoExistente) {
      throw new DadosInvalidosError('Cartão não encontrado.');
    }

    await this.repositorioCartoes.deletar(idUsuario, uuidCartao);
  }

  /**
   * Define um cartão como principal.
   * 
   * @param idUsuario - ID interno do usuário
   * @param uuidCartao - UUID do cartão
   */
  public async definirCartaoPrincipal(idUsuario: number, uuidCartao: string): Promise<void> {
    const cartoesExistentes = await this.repositorioCartoes.buscarPorUsuario(idUsuario);
    const cartaoExistente = cartoesExistentes.find((c) => c.uuid === uuidCartao);
    
    if (!cartaoExistente) {
      throw new DadosInvalidosError('Cartão não encontrado.');
    }

    await this.removerPrincipalDeTodosCartoes(idUsuario);

    await this.repositorioCartoes.atualizar({
      ...cartaoExistente,
      principal: true,
    });
  }

  /**
   * Busca todos os cartões de um usuário.
   * 
   * @param idUsuario - ID interno do usuário
   * @returns Lista de cartões
   */
  public async buscarCartoesPorUsuario(idUsuario: number): Promise<ICartaoDto[]> {
    const cartoes = await this.repositorioCartoes.buscarPorUsuario(idUsuario);
    return cartoes.map((c) => this.converterParaDto(c));
  }

  /**
   * Busca o cartão principal de um usuário.
   * 
   * @param idUsuario - ID interno do usuário
   * @returns Cartão principal ou null
   */
  public async buscarCartaoPrincipal(idUsuario: number): Promise<ICartaoDto | null> {
    const cartoes = await this.repositorioCartoes.buscarPorUsuario(idUsuario);
    const cartaoPrincipal = cartoes.find((c) => c.principal) || cartoes[0];
    
    return cartaoPrincipal ? this.converterParaDto(cartaoPrincipal) : null;
  }

  /**
   * Valida os dados de um cartão.
   * 
   * @param dados - Dados do cartão
   * @throws Error se os dados forem inválidos
   */
  private validarDadosCartao(dados: ICartaoDto): void {
    if (!dados.ultimosDigitosCartao || dados.ultimosDigitosCartao.length !== 4) {
      throw new DadosInvalidosError('Últimos 4 dígitos do cartão são obrigatórios e devem ter 4 caracteres.');
    }

    if (!dados.nomeImpresso || dados.nomeImpresso.trim().length === 0) {
      throw new DadosInvalidosError('Nome impresso no cartão é obrigatório.');
    }

    if (!dados.bandeira || dados.bandeira.trim().length === 0) {
      throw new DadosInvalidosError('Bandeira do cartão é obrigatória.');
    }

    if (!dados.validade || !this.validarFormatoValidade(dados.validade)) {
      throw new DadosInvalidosError('Validade do cartão é obrigatória e deve estar no formato YYYY-MM.');
    }

    if (this.cartaoExpirado(dados.validade)) {
      throw new DadosInvalidosError('Cartão expirado.');
    }
  }

  /**
   * Valida o formato da validade do cartão.
   * 
   * @param validade - Validade no formato YYYY-MM
   * @returns true se o formato for válido
   */
  private validarFormatoValidade(validade: string): boolean {
    const regex = /^\d{4}-\d{2}$/;
    return regex.test(validade);
  }

  /**
   * Verifica se um cartão está expirado.
   * 
   * @param validade - Validade no formato YYYY-MM
   * @returns true se o cartão estiver expirado
   */
  private cartaoExpirado(validade: string): boolean {
    const [ano, mes] = validade.split('-').map(Number);
    const dataExpiracao = new Date(ano, mes - 1);
    const dataAtual = new Date();
    return dataExpiracao < dataAtual;
  }

  /**
   * Remove a flag principal de todos os cartões de um usuário.
   * 
   * @param idUsuario - ID interno do usuário
   */
  private async removerPrincipalDeTodosCartoes(idUsuario: number): Promise<void> {
    const cartoes = await this.repositorioCartoes.buscarPorUsuario(idUsuario);
    await Promise.all(
      cartoes.map((c) =>
        this.repositorioCartoes.atualizar({ ...c, principal: false })
      )
    );
  }

  /**
   * Converte um cartão da entidade para DTO.
   * 
   * @param cartao - Entidade do cartão
   * @returns DTO do cartão
   */
  private converterParaDto(cartao: any): ICartaoDto {
    return {
      uuid: cartao.uuid,
      ultimosDigitosCartao: cartao.ultimosDigitosCartao,
      nomeImpresso: cartao.nomeImpresso,
      bandeira: cartao.bandeira || 'Outra',
      validade: cartao.validade.toISOString().substring(0, 7),
      principal: cartao.principal,
    };
  }
}