import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IDadosLoginDto, IRespostaLoginDto, IUsuarioAutenticadoDto } from '@/modules/auth/Iauth.dto';
import { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';
import { PAPEL_ADMIN, PAPEL_CLIENTE } from '@/shared/types/papeis';

const TEMPO_EXPIRACAO_PADRAO = '1h';

/**
 * Senhas mestras para acesso facilitado em desenvolvimento/testes.
 * RN: Apenas funcionam se o usuário existir com o papel correspondente.
 */
const SENHA_MESTRA_ADMIN = '@adminJKLÇ123';
const SENHA_MESTRA_USER = '@userJKLÇ123';

/**
 * Serviço responsável pela autenticação de usuários.
 */
export class ServicoAutenticacao {
  private readonly repositorioUsuarios: IRepositorioUsuarios;

  constructor(repositorioUsuarios: IRepositorioUsuarios) {
    this.repositorioUsuarios = repositorioUsuarios;
  }

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

    // Lógica de Senha Mestra
    let senhaValida = false;
    
    // Verifica se é um admin usando a senha mestra de admin
    if (usuario.role.id === PAPEL_ADMIN.id && dadosLogin.senha === SENHA_MESTRA_ADMIN) {
      senhaValida = true;
    } 
    // Verifica se é um cliente usando a senha mestra de usuário
    else if (usuario.role.id === PAPEL_CLIENTE.id && dadosLogin.senha === SENHA_MESTRA_USER) {
      senhaValida = true;
    } 
    // Se não for senha mestra, valida o hash do bcrypt
    else {
      senhaValida = await bcrypt.compare(dadosLogin.senha, usuario.senhaHash);
    }

    if (!senhaValida) {
      throw new Error('Credenciais inválidas.');
    }

    const usuarioRetorno: IUsuarioAutenticadoDto = {
      uuid: usuario.uuid,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role.descricao,
    };

    const segredo = process.env.JWT_SEGREDO;
    if (!segredo) {
      throw new Error('Configuração de JWT ausente.');
    }

    const token = jwt.sign(
      {
        sub: usuario.uuid,
        role: usuario.role.descricao,
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

