import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { IDadosLoginDto, IRespostaLoginDto, IUsuarioAutenticadoDto } from '@/modules/auth/Iauth.dto';
import { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';
import { Logger } from '@/shared/utils/Logger.util';

// Carrega o tempo de expiração do JWT diretamente das variáveis de ambiente.
// Se ausente, mantém `null` e a execução abortará antes de assinar o token
// com uma mensagem segura (LGPD) — NÃO deve haver fallback aqui.
const TEMPO_EXPIRACAO_PADRAO: string | null = process.env.JWT_TEMPO_EXPIRACAO ?? null;

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
      Logger.debug(`[auth.service] Nenhum usuário ativo encontrado para o email: ${dadosLogin.email}. Total encontrados: ${usuarios.length}`);
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
      Logger.debug(`[auth.service] Senha inválida para o usuário: ${dadosLogin.email}`);
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

    // Verifica se o tempo de expiração foi fornecido — sem fallback por segurança.
    if (!TEMPO_EXPIRACAO_PADRAO) {
      Logger.error('[auth.service] JWT_TEMPO_EXPIRACAO ausente; operação abortada. Mensagem segura: configuração de autenticação incompleta. Consulte o administrador. (LGPD: sem dados sensíveis)');
      throw new Error('Configuração de autenticação incompleta. Consulte o administrador.');
    }

    const token = jwt.sign(
      {
        sub: usuarioAutenticado.uuid,
        email: usuarioAutenticado.email,
        role: usuarioAutenticado.role.descricao,
        isAdminMestre: !!usuarioAutenticado.isAdminMestre,
      },
      segredo as string,
      {
        expiresIn: TEMPO_EXPIRACAO_PADRAO as SignOptions['expiresIn'],
      },
    );

    return {
      token,
      user: usuarioRetorno,
    };
  }
}

