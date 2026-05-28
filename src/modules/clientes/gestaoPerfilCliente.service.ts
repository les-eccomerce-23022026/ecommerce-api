import { IRepositorioPerfilCliente } from '@/shared/types/IRepositorioPerfilCliente';
import { IPerfilCliente } from '@/shared/types/IPerfilCliente';
import { IPerfilClienteDto } from '@/modules/clientes/Iclientes.dto';
import { ClientesUtils } from '@/modules/clientes/clientesUtils.service';
import { DadosInvalidosError } from '@/shared/exceptions/Exceptions';

/**
 * Serviço responsável pela gestão de perfil de clientes.
 * 
 * Responsabilidades:
 * - Criação de perfil
 * - Atualização de perfil
 * - Busca de perfil
 * - Validação de dados de perfil
 * - Formatação de datas
 */
export class GestaoPerfilCliente {
  constructor(private readonly repositorioPerfil: IRepositorioPerfilCliente) {}

  /**
   * Cria um perfil para um usuário.
   * 
   * @param idUsuario - ID interno do usuário
   * @param dados - Dados do perfil
   * @returns Perfil criado
   */
  public async criarPerfil(idUsuario: number, dados: IPerfilClienteDto): Promise<IPerfilClienteDto> {
    this.validarDadosPerfil(dados);

    const perfil = await this.repositorioPerfil.criar({
      idUsuario,
      genero: dados.genero,
      dataNascimento: dados.dataNascimento 
        ? this.parsearDataNascimento(dados.dataNascimento)
        : undefined,
    });

    return this.converterParaDto(perfil);
  }

  /**
   * Atualiza o perfil de um usuário.
   * 
   * @param idUsuario - ID interno do usuário
   * @param dados - Novos dados do perfil
   * @returns Perfil atualizado
   */
  public async atualizarPerfil(idUsuario: number, dados: Partial<IPerfilClienteDto>): Promise<IPerfilClienteDto> {
    const perfilExistente = await this.repositorioPerfil.buscarPorIdUsuario(idUsuario);
    
    if (dados.genero !== undefined || dados.dataNascimento !== undefined) {
      this.validarDadosPerfil(dados as IPerfilClienteDto);
    }

    const perfilAtualizado: IPerfilCliente = {
      idUsuario,
      genero: dados.genero !== undefined ? dados.genero : perfilExistente?.genero,
      dataNascimento: dados.dataNascimento !== undefined 
        ? this.parsearDataNascimento(dados.dataNascimento)
        : perfilExistente?.dataNascimento,
    };

    let perfilResultado;
    if (perfilExistente) {
      perfilResultado = await this.repositorioPerfil.atualizar(perfilAtualizado);
    } else {
      perfilResultado = await this.repositorioPerfil.criar(perfilAtualizado);
    }

    return this.converterParaDto(perfilResultado);
  }

  /**
   * Busca o perfil de um usuário.
   * 
   * @param idUsuario - ID interno do usuário
   * @returns Perfil do usuário ou null
   */
  public async buscarPerfilPorUsuario(idUsuario: number): Promise<IPerfilClienteDto | null> {
    const perfil = await this.repositorioPerfil.buscarPorIdUsuario(idUsuario);
    
    if (!perfil) {
      return null;
    }

    return this.converterParaDto(perfil);
  }

  /**
   * Remove o perfil de um usuário.
   * 
   * @param idUsuario - ID interno do usuário
   */
  public async removerPerfil(idUsuario: number): Promise<void> {
    const perfilExistente = await this.repositorioPerfil.buscarPorIdUsuario(idUsuario);
    
    if (!perfilExistente) {
      throw new DadosInvalidosError('Perfil não encontrado.');
    }

    await this.repositorioPerfil.deletar(idUsuario);
  }

  /**
   * Valida os dados de um perfil.
   * 
   * @param dados - Dados do perfil
   * @throws Error se os dados forem inválidos
   */
  private validarDadosPerfil(dados: IPerfilClienteDto): void {
    if (dados.genero !== undefined) {
      const generosValidos = ['Masculino', 'Feminino', 'Outro', 'Prefiro não dizer'];
      if (!generosValidos.includes(dados.genero)) {
        throw new DadosInvalidosError('Gênero inválido. Valores válidos: Masculino, Feminino, Outro, Prefiro não dizer');
      }
    }

    if (dados.dataNascimento !== undefined) {
      const dataNasc = this.parsearDataNascimento(dados.dataNascimento);
      const dataAtual = new Date();
      const idadeMinima = 13;
      const dataMinima = new Date(
        dataAtual.getFullYear() - idadeMinima,
        dataAtual.getMonth(),
        dataAtual.getDate()
      );

      if (dataNasc > dataAtual) {
        throw new DadosInvalidosError('Data de nascimento não pode ser no futuro.');
      }

      if (dataNasc > dataMinima) {
        throw new DadosInvalidosError('Usuário deve ter pelo menos 13 anos.');
      }
    }
  }

  /**
   * Parseia uma string de data no formato YYYY-MM-DD para Date.
   * 
   * @param valor - String da data
   * @returns Date parseada
   * @throws Error se o formato for inválido
   */
  private parsearDataNascimento(valor: string): Date {
    const partes = valor.trim().split('-').map(Number);
    if (partes.length !== 3 || partes.some((n) => !Number.isFinite(n))) {
      throw new DadosInvalidosError('Data de nascimento inválida. Use o formato YYYY-MM-DD.');
    }
    const [ano, mes, dia] = partes;
    return new Date(ano, mes - 1, dia);
  }

  /**
   * Converte um perfil da entidade para DTO.
   * 
   * @param perfil - Entidade do perfil
   * @returns DTO do perfil
   */
  private converterParaDto(perfil: IPerfilCliente): IPerfilClienteDto {
    return {
      genero: perfil.genero,
      dataNascimento: perfil.dataNascimento
        ? ClientesUtils.formatarDataSomente(perfil.dataNascimento)
        : undefined,
    };
  }

  /**
   * Calcula a idade de um usuário baseado na data de nascimento.
   * 
   * @param dataNascimento - Data de nascimento
   * @returns Idade em anos
   */
  public calcularIdade(dataNascimento: Date): number {
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const mes = hoje.getMonth() - dataNascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
      idade--;
    }
    
    return idade;
  }
}