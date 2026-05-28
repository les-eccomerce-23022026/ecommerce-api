import { IRepositorioTelefoneUsuario } from '@/shared/types/IRepositorioTelefoneUsuario';
import { ITelefoneDto } from '@/modules/clientes/Iclientes.dto';
import { mapearTipoTelefone, normalizarDigitos, converterTelefoneParaDto } from '@/modules/clientes/gestaoIdentidadeClienteTexto.util';
import { DadosInvalidosError } from '@/shared/exceptions/Exceptions';

/**
 * Serviço responsável pela gestão de telefones de clientes.
 * 
 * Responsabilidades:
 * - Criação de telefone
 * - Atualização de telefone
 * - Remoção de telefone
 * - Validação de formato de telefone
 * - Normalização de dígitos
 */
export class GestaoTelefoneCliente {
  constructor(private readonly repositorioTelefone: IRepositorioTelefoneUsuario) {}

  /**
   * Cria um novo telefone para um usuário.
   * 
   * @param idUsuario - ID interno do usuário
   * @param dados - Dados do telefone
   * @param principal - Se é o telefone principal
   * @returns Telefone criado
   */
  public async criarTelefone(
    idUsuario: number,
    dados: ITelefoneDto,
    principal: boolean = false
  ): Promise<ITelefoneDto> {
    const numeroNormalizado = normalizarDigitos(dados.numero);
    
    if (!this.validarFormatoTelefone(numeroNormalizado)) {
      throw new DadosInvalidosError('Telefone deve ter 10 ou 11 dígitos (DDD + número).');
    }

    const telefone = await this.repositorioTelefone.criar({
      idUsuario,
      idTipoTelefone: mapearTipoTelefone(dados.tipo),
      numero: numeroNormalizado,
      principal,
    });

    return converterTelefoneParaDto(telefone);
  }

  /**
   * Atualiza um telefone existente.
   * 
   * @param idUsuario - ID interno do usuário
   * @param uuidTelefone - UUID do telefone
   * @param dados - Novos dados do telefone
   * @returns Telefone atualizado
   */
  public async atualizarTelefone(
    idUsuario: number,
    uuidTelefone: string,
    dados: ITelefoneDto
  ): Promise<ITelefoneDto> {
    const telefonesExistentes = await this.repositorioTelefone.buscarPorIdUsuario(idUsuario);
    const telefoneExistente = telefonesExistentes.find((t) => t.uuid === uuidTelefone);
    
    if (!telefoneExistente) {
      throw new DadosInvalidosError('Telefone não encontrado.');
    }

    const numeroNormalizado = normalizarDigitos(dados.numero);
    
    if (!this.validarFormatoTelefone(numeroNormalizado)) {
      throw new DadosInvalidosError('Telefone deve ter 10 ou 11 dígitos (DDD + número).');
    }

    const telefoneAtualizado = await this.repositorioTelefone.atualizar({
      ...telefoneExistente,
      idTipoTelefone: mapearTipoTelefone(dados.tipo),
      numero: numeroNormalizado,
    });

    return converterTelefoneParaDto(telefoneAtualizado);
  }

  /**
   * Remove um telefone.
   * 
   * @param idUsuario - ID interno do usuário
   * @param uuidTelefone - UUID do telefone
   */
  public async removerTelefone(idUsuario: number, uuidTelefone: string): Promise<void> {
    const telefonesExistentes = await this.repositorioTelefone.buscarPorIdUsuario(idUsuario);
    const telefoneExistente = telefonesExistentes.find((t) => t.uuid === uuidTelefone);
    
    if (!telefoneExistente) {
      throw new DadosInvalidosError('Telefone não encontrado.');
    }

    await this.repositorioTelefone.deletar(idUsuario, uuidTelefone);
  }

  /**
   * Define um telefone como principal.
   * 
   * @param idUsuario - ID interno do usuário
   * @param uuidTelefone - UUID do telefone
   */
  public async definirTelefonePrincipal(idUsuario: number, uuidTelefone: string): Promise<void> {
    const telefonesExistentes = await this.repositorioTelefone.buscarPorIdUsuario(idUsuario);
    const telefoneExistente = telefonesExistentes.find((t) => t.uuid === uuidTelefone);
    
    if (!telefoneExistente) {
      throw new DadosInvalidosError('Telefone não encontrado.');
    }

    // Remove principal de todos os telefones
    await Promise.all(
      telefonesExistentes.map((t) =>
        this.repositorioTelefone.atualizar({ ...t, principal: false })
      )
    );

    // Define o telefone selecionado como principal
    await this.repositorioTelefone.atualizar({ ...telefoneExistente, principal: true });
  }

  /**
   * Busca todos os telefones de um usuário.
   * 
   * @param idUsuario - ID interno do usuário
   * @returns Lista de telefones
   */
  public async buscarTelefonesPorUsuario(idUsuario: number): Promise<ITelefoneDto[]> {
    const telefones = await this.repositorioTelefone.buscarPorIdUsuario(idUsuario);
    return telefones.map(converterTelefoneParaDto);
  }

  /**
   * Busca o telefone principal de um usuário.
   * 
   * @param idUsuario - ID interno do usuário
   * @returns Telefone principal ou null
   */
  public async buscarTelefonePrincipal(idUsuario: number): Promise<ITelefoneDto | null> {
    const telefones = await this.repositorioTelefone.buscarPorIdUsuario(idUsuario);
    const telefonePrincipal = telefones.find((t) => t.principal) || telefones[0];
    
    return telefonePrincipal ? converterTelefoneParaDto(telefonePrincipal) : null;
  }

  /**
   * Valida o formato de um telefone.
   * 
   * @param numero - Número do telefone normalizado
   * @returns true se o formato for válido
   */
  private validarFormatoTelefone(numero: string): boolean {
    return numero.length >= 10 && numero.length <= 11;
  }

  /**
   * Normaliza os dígitos de um telefone.
   * 
   * @param telefone - Telefone com formatação
   * @returns Telefone normalizado (apenas dígitos)
   */
  public normalizarTelefone(telefone: string): string {
    return normalizarDigitos(telefone);
  }
}