import bcrypt from 'bcryptjs';
import { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';
import { IAlterarSenhaDto } from '@/modules/clientes/Iclientes.dto';
import { verificarForcaSenha } from '@/shared/utils/senha.util';
import { UsuarioNaoEncontradoError, SenhaInvalidaError, DadosInvalidosError } from '@/shared/exceptions/Exceptions';

/**
 * Serviço responsável pela gestão de senhas de clientes.
 * 
 * Responsabilidades:
 * - Alteração de senha
 * - Validação de força de senha
 * - Hash de senhas
 */
export class GestaoSenhaCliente {
  constructor(private readonly repositorioUsuarios: IRepositorioUsuarios) {}

  /**
   * Altera a senha de um cliente após validações.
   * 
   * @param uuid - UUID do usuário
   * @param dados - Dados para alteração de senha
   * @throws Error se usuário não encontrado
   * @throws Error se senha atual incorreta
   * @throws Error se nova senha e confirmação não conferem
   * @throws Error se nova senha muito fraca
   * @throws Error se nova senha igual à atual
   */
  public async alterarSenha(uuid: string, dados: IAlterarSenhaDto): Promise<void> {
    const usuario = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!usuario) {
      throw new UsuarioNaoEncontradoError(uuid);
    }

    const senhaValida = await bcrypt.compare(dados.senhaAtual, usuario.senhaHash);
    if (!senhaValida) {
      throw new SenhaInvalidaError();
    }

    if (dados.novaSenha !== dados.confirmacaoNovaSenha) {
      throw new DadosInvalidosError('Nova senha e confirmação não conferem.');
    }

    if (!verificarForcaSenha(dados.novaSenha)) {
      throw new DadosInvalidosError('Nova senha muito fraca.');
    }

    if (dados.novaSenha === dados.senhaAtual) {
      throw new DadosInvalidosError('Nova senha deve ser diferente da senha atual.');
    }

    const novaSenhaHash = await bcrypt.hash(dados.novaSenha, 10);
    await this.repositorioUsuarios.atualizarUsuario(uuid, { senhaHash: novaSenhaHash });
  }

  /**
   * Verifica se uma senha atende aos requisitos mínimos de força.
   * 
   * @param senha - Senha a ser verificada
   * @returns true se a senha é forte o suficiente
   */
  public verificarForcaSenha(senha: string): boolean {
    return verificarForcaSenha(senha);
  }

  /**
   * Gera hash de uma senha.
   * 
   * @param senha - Senha em texto plano
   * @returns Hash da senha
   */
  public async gerarHashSenha(senha: string): Promise<string> {
    return await bcrypt.hash(senha, 10);
  }

  /**
   * Compara uma senha em texto plano com um hash.
   * 
   * @param senha - Senha em texto plano
   * @param hash - Hash da senha
   * @returns true se a senha corresponde ao hash
   */
  public async compararSenha(senha: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(senha, hash);
  }
}