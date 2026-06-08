import { IRepositorioCartaoUsuario } from '@/modules/cartoes/IRepositorioCartaoUsuario';
import { ICartaoDto } from '@/modules/clientes/Iclientes.dto';
import { ICartaoUsuario } from '@/shared/types/ICartaoUsuario';
import { DadosInvalidosError } from '@/shared/exceptions/Exceptions';
import { MENSAGENS_ERRO } from '@/shared/constants/mensagens-erro.constants';

/**
 * Constantes de validação de negócio
 */
const LIMITE_MAXIMO_CARTOES_POR_CLIENTE = 5;

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
    GestaoCartaoCliente.validarDadosCartao(dados);

    // Validar limite de cartões por cliente
    const cartoesExistentes = await this.repositorioCartoes.buscarPorUsuario(idUsuario);
    if (cartoesExistentes.length >= LIMITE_MAXIMO_CARTOES_POR_CLIENTE) {
      throw new DadosInvalidosError(
        `Limite máximo de ${LIMITE_MAXIMO_CARTOES_POR_CLIENTE} cartões por cliente atingido.`
      );
    }

    if (principal) {
      await this.removerPrincipalDeTodosCartoes(idUsuario);
    }

    // Obter idBandeira a partir da descrição
    const idBandeira = await this.obterIdBandeiraPorDescricao(dados.bandeira);
    if (!idBandeira) {
      throw new DadosInvalidosError(MENSAGENS_ERRO.BANDEIRA_NAO_ENCONTRADA);
    }

    // Gerar token para o cartão (simulado - em produção viria do gateway de pagamento)
    const token = GestaoCartaoCliente.gerarTokenCartao(dados.ultimosDigitosCartao);

    const cartao = await this.repositorioCartoes.criar({
      idUsuario,
      idBandeira,
      token,
      ultimosDigitosCartao: dados.ultimosDigitosCartao,
      nomeImpresso: dados.nomeImpresso,
      validade: new Date(`${dados.validade}-01`),
      principal,
    });

    return GestaoCartaoCliente.converterParaDto(cartao);
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
      throw new DadosInvalidosError(MENSAGENS_ERRO.CARTAO_NAO_ENCONTRADO);
    }

    if (dados.ultimosDigitosCartao || dados.nomeImpresso || dados.bandeira || dados.validade) {
      GestaoCartaoCliente.validarDadosCartao(dados as ICartaoDto);
    }

    if (dados.principal) {
      await this.removerPrincipalDeTodosCartoes(idUsuario);
    }

    // Preparar dados para atualização
    const dadosAtualizacao: Partial<Omit<ICartaoUsuario, 'id' | 'uuid' | 'idUsuario'>> = {
      ultimosDigitosCartao: dados.ultimosDigitosCartao || cartaoExistente.ultimosDigitosCartao,
      nomeImpresso: dados.nomeImpresso || cartaoExistente.nomeImpresso,
      validade: dados.validade ? new Date(`${dados.validade}-01`) : cartaoExistente.validade,
      principal: dados.principal !== undefined ? dados.principal : cartaoExistente.principal,
    };

    // Se bandeira foi alterada, obter novo idBandeira
    if (dados.bandeira && dados.bandeira !== cartaoExistente.bandeira) {
      const idBandeira = await this.obterIdBandeiraPorDescricao(dados.bandeira);
      if (!idBandeira) {
        throw new DadosInvalidosError(MENSAGENS_ERRO.BANDEIRA_NAO_ENCONTRADA);
      }
      dadosAtualizacao.idBandeira = idBandeira;
    }

    const cartaoAtualizado = await this.repositorioCartoes.atualizar(uuidCartao, dadosAtualizacao);

    if (!cartaoAtualizado) {
      throw new DadosInvalidosError(MENSAGENS_ERRO.CARTAO_NAO_ENCONTRADO);
    }

    return GestaoCartaoCliente.converterParaDto(cartaoAtualizado);
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
      throw new DadosInvalidosError(MENSAGENS_ERRO.CARTAO_NAO_ENCONTRADO);
    }

    await this.repositorioCartoes.excluir(uuidCartao);
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
      throw new DadosInvalidosError(MENSAGENS_ERRO.CARTAO_NAO_ENCONTRADO);
    }

    await this.removerPrincipalDeTodosCartoes(idUsuario);

    await this.repositorioCartoes.atualizar(uuidCartao, { principal: true });
  }

  /**
   * Busca todos os cartões de um usuário.
   * 
   * @param idUsuario - ID interno do usuário
   * @returns Lista de cartões
   */
  public async buscarCartoesPorUsuario(idUsuario: number): Promise<ICartaoDto[]> {
    const cartoes = await this.repositorioCartoes.buscarPorUsuario(idUsuario);
    return cartoes.map((c) => GestaoCartaoCliente.converterParaDto(c));
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
    
    return cartaoPrincipal ? GestaoCartaoCliente.converterParaDto(cartaoPrincipal) : null;
  }

  /**
   * Valida os dados de um cartão.
   * 
   * @param dados - Dados do cartão
   * @throws Error se os dados forem inválidos
   */
  private static validarDadosCartao(dados: ICartaoDto): void {
    if (!dados.ultimosDigitosCartao || dados.ultimosDigitosCartao.length !== 4) {
      throw new DadosInvalidosError('Últimos 4 dígitos do cartão são obrigatórios e devem ter 4 caracteres.');
    }

    if (!dados.nomeImpresso || dados.nomeImpresso.trim().length === 0) {
      throw new DadosInvalidosError('Nome impresso no cartão é obrigatório.');
    }

    if (!dados.bandeira || dados.bandeira.trim().length === 0) {
      throw new DadosInvalidosError('Bandeira do cartão é obrigatória.');
    }

    if (!dados.validade || !GestaoCartaoCliente.validarFormatoValidade(dados.validade)) {
      throw new DadosInvalidosError('Validade do cartão é obrigatória e deve estar no formato YYYY-MM.');
    }

    if (GestaoCartaoCliente.cartaoExpirado(dados.validade)) {
      throw new DadosInvalidosError('Cartão expirado.');
    }
  }

  /**
   * Valida o formato da validade do cartão.
   * 
   * @param validade - Validade no formato YYYY-MM
   * @returns true se o formato for válido
   */
  private static validarFormatoValidade(validade: string): boolean {
    const regex = /^\d{4}-\d{2}$/;
    return regex.test(validade);
  }

  /**
   * Verifica se um cartão está expirado.
   * 
   * @param validade - Validade no formato YYYY-MM
   * @returns true se o cartão estiver expirado
   */
  private static cartaoExpirado(validade: string): boolean {
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
        this.repositorioCartoes.atualizar(c.uuid, { principal: false })
      )
    );
  }

  /**
   * Converte um cartão da entidade para DTO.
   * 
   * @param cartao - Entidade do cartão
   * @returns DTO do cartão
   */
  private static converterParaDto(cartao: ICartaoUsuario): ICartaoDto {
    return {
      uuid: cartao.uuid,
      ultimosDigitosCartao: cartao.ultimosDigitosCartao,
      nomeImpresso: cartao.nomeImpresso,
      bandeira: cartao.bandeira || 'Outra',
      validade: cartao.validade.toISOString().substring(0, 7),
      principal: cartao.principal,
    };
  }

  /**
   * Obtém o ID da bandeira a partir da descrição.
   * 
   * @param descricao - Descrição da bandeira
   * @returns ID da bandeira ou null se não encontrada
   */
  private async obterIdBandeiraPorDescricao(descricao: string): Promise<number | null> {
    // Em um cenário real, isso poderia buscar no banco de dados
    // Por enquanto, vamos usar um mapeamento simples
    const bandeiras: Record<string, number> = {
      'Visa': 1,
      'Mastercard': 2,
      'American Express': 3,
      'Elo': 4,
      'Hipercard': 5,
    };

    const chaveNormalizada = descricao.toLowerCase().trim();
    const bandeiraEncontrada = Object.entries(bandeiras).find(([nome]) => 
      nome.toLowerCase() === chaveNormalizada
    );
    
    if (bandeiraEncontrada) {
      return bandeiraEncontrada[1];
    }

    // Tenta buscar no repositório se disponível
    try {
      const idBandeira = await this.repositorioCartoes.buscarIdBandeiraPorUuid(descricao);
      return idBandeira;
    } catch {
      return null;
    }
  }

  /**
   * Gera um token para o cartão (simulado).
   * Em produção, isso viria do gateway de pagamento.
   * 
   * @param ultimosDigitos - Últimos 4 dígitos do cartão
   * @returns Token gerado
   */
  private static gerarTokenCartao(ultimosDigitos: string): string {
    // Simulação de token - em produção viria do gateway
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `tok_${ultimosDigitos}_${timestamp}${random}`;
  }
}