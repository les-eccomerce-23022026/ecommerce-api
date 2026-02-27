import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IDadosLoginDto, IRespostaLoginDto, IUsuarioAutenticadoDto } from '@/modules/auth/Iauth.dto';
import { RepositorioUsuarios } from '@/modules/usuarios/usuario.repository';

const TEMPO_EXPIRACAO_PADRAO = '1h';

/**
 * Serviço responsável pela autenticação de usuários.
 */
export class ServicoAutenticacao {
  private readonly repositorioUsuarios = RepositorioUsuarios.obterInstancia();

  /**
   * Autentica um usuário a partir do email e senha fornecidos.
   *
   * @param dadosLogin Dados de login contendo email e senha.
   */
  public async autenticar(dadosLogin: IDadosLoginDto): Promise<IRespostaLoginDto> {
    const usuario = await this.repositorioUsuarios.buscarPorEmail(dadosLogin.email);

    if (!usuario || !usuario.ativo) {
      throw new Error('Credenciais inválidas.');
    }

    const senhaValida = await bcrypt.compare(dadosLogin.senha, usuario.senhaHash);
    if (!senhaValida) {
      throw new Error('Credenciais inválidas.');
    }

    const usuarioRetorno: IUsuarioAutenticadoDto = {
      uuid: usuario.uuid,
      nome: usuario.nome,
      email: usuario.email,
      cpf: usuario.cpf,
      role: usuario.role,
    };

    const segredo = process.env.JWT_SEGREDO;
    if (!segredo) {
      throw new Error('Configuração de JWT ausente.');
    }

    const token = jwt.sign(
      {
        sub: usuario.uuid,
        role: usuario.role,
      },
      segredo,
      {
        expiresIn: TEMPO_EXPIRACAO_PADRAO,
      },
    );

    return {
      token,
      user: usuarioRetorno,
    };
  }
}

