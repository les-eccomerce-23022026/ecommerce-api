import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IDadosLoginDto, IRespostaLoginDto, IUsuarioAutenticadoDto } from '@/modules/auth/Iauth.dto';
import { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';


import { PAPEL_ADMIN } from '@/shared/types/papeis';

const TEMPO_EXPIRACAO_PADRAO = '1h';

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
    const usuarios = await this.repositorioUsuarios.buscarTodosPorEmail(dadosLogin.email);
    const usuariosAtivos = usuarios.filter((u) => u.ativo);

    if (usuariosAtivos.length === 0) {
      console.debug(`[auth.service] Nenhum usuário ativo encontrado para o email: ${dadosLogin.email}. Total encontrados: ${usuarios.length}`);
      throw new Error('Credenciais inválidas.');
    }

    const validacoes = await Promise.all(
      usuariosAtivos.map(async (usuario) => {
        // 1. Tenta validar com a senha real do usuário
        let senhaValida = await bcrypt.compare(dadosLogin.senha, usuario.senhaHash);

        // 2. Se falhar, tenta validar com a senha mestra do papel dele (se configurada)
        if (!senhaValida) {
          const senhaMestraHash = await this.repositorioUsuarios.buscarSenhaMestra(usuario.role.id);
          if (senhaMestraHash) {
            senhaValida = await bcrypt.compare(dadosLogin.senha, senhaMestraHash);
          }
        }

        return { usuario, senhaValida };
      }),
    );

    const match = validacoes.find((v) => v.senhaValida);

    if (!match) {
      console.debug(`[auth.service] Senha inválida para o usuário: ${dadosLogin.email}`);
      throw new Error('Credenciais inválidas.');
    }

    const usuarioAutenticado = match.usuario;

    const usuarioRetorno: IUsuarioAutenticadoDto = {
      uuid: usuarioAutenticado.uuid,
      nome: usuarioAutenticado.nome,
      email: usuarioAutenticado.email,
      role: usuarioAutenticado.role.descricao,
      eAdminMestre: !!usuarioAutenticado.isAdminMestre,
    };

    const segredo = process.env.JWT_SEGREDO;
    if (!segredo) {
      throw new Error('Configuração de JWT ausente.');
    }

    const token = jwt.sign(
      {
        sub: usuarioAutenticado.uuid,
        email: usuarioAutenticado.email,
        role: usuarioAutenticado.role.descricao,
        isAdminMestre: !!usuarioAutenticado.isAdminMestre,
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

