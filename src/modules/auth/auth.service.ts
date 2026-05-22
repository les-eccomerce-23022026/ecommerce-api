import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { IDadosLoginDto, IRespostaLoginDto, IUsuarioAutenticadoDto } from '@/modules/auth/Iauth.dto';
import { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';
import { IUsuario } from '@/modules/usuarios/IUsuario.entity';
import { IRepositorioRefreshToken } from '@/modules/auth/IRepositorioRefreshToken';
import type { ICriarRefreshTokenDto } from '@/modules/auth/IRepositorioRefreshToken';
import { PAPEL_ADMIN, PAPEL_CLIENTE } from '@/shared/types/papeis';
import { Logger } from '@/shared/utils/Logger.util';

/** Define o papel exposto no login conforme vínculos ativos (RN: cliente tem prioridade quando ambos existem). */
function resolverPapelLogin(usuario: IUsuario): string {
  const descricoes = usuario.papeis.map((p) => p.descricao);
  if (descricoes.includes(PAPEL_CLIENTE.descricao)) {
    return PAPEL_CLIENTE.descricao;
  }
  if (descricoes.includes(PAPEL_ADMIN.descricao)) {
    return PAPEL_ADMIN.descricao;
  }
  return usuario.role.descricao;
}

// Carrega o tempo de expiração do JWT diretamente das variáveis de ambiente.
// Se ausente, mantém `null` e a execução abortará antes de assinar o token
// com uma mensagem segura (LGPD) — NÃO deve haver fallback aqui.
const TEMPO_EXPIRACAO_PADRAO: string | null = process.env.JWT_TEMPO_EXPIRACAO ?? null;

// Tempo de expiração do refresh token (long-lived: 7-30 dias)
const TEMPO_EXPIRACAO_REFRESH_TOKEN: string = process.env.JWT_TEMPO_EXPIRACAO_REFRESH || '7d';

/**
 * Serviço responsável pela autenticação de usuários.
 */
export class ServicoAutenticacao {
  private readonly repositorioUsuarios: IRepositorioUsuarios;
  private readonly repositorioRefreshToken: IRepositorioRefreshToken;

  constructor(repositorioUsuarios: IRepositorioUsuarios, repositorioRefreshToken: IRepositorioRefreshToken) {
    this.repositorioUsuarios = repositorioUsuarios;
    this.repositorioRefreshToken = repositorioRefreshToken;
  }

  /**
   * Gera refresh token aleatório (64 bytes hex)
   */
  private gerarRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Calcula data de expiração do refresh token
   */
  private calcularExpiracaoRefreshToken(): Date {
    const agora = new Date();
    const dias = TEMPO_EXPIRACAO_REFRESH_TOKEN.endsWith('d') 
      ? parseInt(TEMPO_EXPIRACAO_REFRESH_TOKEN)
      : 7; // padrão 7 dias
    agora.setDate(agora.getDate() + dias);
    return agora;
  }

  /**
   * Autentica um usuário a partir do email e senha fornecidos.
   *
   * @param dadosLogin Dados de login contendo email e senha.
   * @param ipAddress IP do cliente para proteção contra replay attack.
   * @param userAgent User agent do cliente para fingerprint básico.
   */
  public async autenticar(
    dadosLogin: IDadosLoginDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IRespostaLoginDto> {
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

    const validas = validacoes.filter((v) => v.senhaValida);
    const matchCliente = validas.find((v) =>
      v.usuario.papeis.some((p) => p.descricao === PAPEL_CLIENTE.descricao),
    );
    const matchAdminSomente = validas.find(
      (v) =>
        v.usuario.papeis.some((p) => p.descricao === PAPEL_ADMIN.descricao) &&
        !v.usuario.papeis.some((p) => p.descricao === PAPEL_CLIENTE.descricao),
    );
    const match = matchCliente ?? matchAdminSomente ?? validas[0];

    if (!match) {
      Logger.debug(`[auth.service] Senha inválida para o usuário: ${dadosLogin.email}`);
      throw new Error('Credenciais inválidas.');
    }

    const usuarioAutenticado = match.usuario;
    const papelLogin = resolverPapelLogin(usuarioAutenticado);

    // Buscar lojas do usuário para multi-tenancy
    let loj_ids: number[] = [];
    let loj_id_principal: number | undefined;
    
    try {
      loj_ids = await this.repositorioUsuarios.buscarLojasDoUsuario(usuarioAutenticado.id);
      
      if (loj_ids.length > 0) {
        // A primeira loja do array é a loja principal
        loj_id_principal = loj_ids[0];
      } else {
        // Se o usuário não tem lojas associadas (multi-tenancy não habilitado),
        // usar loja padrão (1) se configurada
        const defaultLojaId = process.env.DEFAULT_LOJA_ID ? parseInt(process.env.DEFAULT_LOJA_ID) : 1;
        loj_ids = [defaultLojaId];
        loj_id_principal = defaultLojaId;
      }
    } catch (erro) {
      // Se falhar ao buscar lojas, usar loja padrão
      Logger.warn('[auth.service] Falha ao buscar lojas do usuário, usando loja padrão');
      const defaultLojaId = process.env.DEFAULT_LOJA_ID ? parseInt(process.env.DEFAULT_LOJA_ID) : 1;
      loj_ids = [defaultLojaId];
      loj_id_principal = defaultLojaId;
    }

    const usuarioRetorno: IUsuarioAutenticadoDto = {
      uuid: usuarioAutenticado.uuid,
      nome: usuarioAutenticado.nome,
      email: usuarioAutenticado.email,
      role: papelLogin,
      papeis: usuarioAutenticado.papeis.map((p) => p.descricao),
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

    // Gerar refresh token
    const refreshToken = this.gerarRefreshToken();
    const refreshTokenExpiraEm = this.calcularExpiracaoRefreshToken();

    // Salvar refresh token no banco
    const refreshTokenDto: ICriarRefreshTokenDto = {
      usuarioId: usuarioAutenticado.id,
      token: refreshToken,
      ipAddress,
      userAgent,
      expiraEm: refreshTokenExpiraEm,
      lojId: loj_id_principal || 1,
    };
    await this.repositorioRefreshToken.criar(refreshTokenDto);

    // Gerar access token (short-lived) com IP e fingerprint
    const token = jwt.sign(
      {
        sub: usuarioAutenticado.uuid,
        email: usuarioAutenticado.email,
        role: papelLogin,
        papeis: usuarioAutenticado.papeis.map((p) => p.descricao),
        loj_ids: loj_ids,
        loj_id_principal: loj_id_principal,
        // IP e fingerprint para proteção contra replay attack
        ip: ipAddress,
        fingerprint: userAgent ? crypto.createHash('sha256').update(userAgent).digest('hex') : undefined,
      },
      segredo as string,
      {
        expiresIn: TEMPO_EXPIRACAO_PADRAO as SignOptions['expiresIn'],
      },
    );

    return {
      token,
      refreshToken,
      refreshTokenExpiresAt: refreshTokenExpiraEm,
      user: usuarioRetorno,
    };
  }

  /**
   * Renova access token usando refresh token
   *
   * @param refreshToken Refresh token válido
   * @param ipAddress IP do cliente para validação de replay attack
   * @param userAgent User agent do cliente para validação de fingerprint
   */
  public async renovarToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ token: string; user: IUsuarioAutenticadoDto }> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    // Buscar refresh token no banco
    const registroRefreshToken = await this.repositorioRefreshToken.buscarPorHash(tokenHash);
    
    if (!registroRefreshToken) {
      throw new Error('Refresh token inválido.');
    }

    // Verificar se não está revogado
    if (registroRefreshToken.revocadoEm) {
      throw new Error('Refresh token revogado.');
    }

    // Verificar se não expirou
    if (new Date(registroRefreshToken.expiraEm) < new Date()) {
      throw new Error('Refresh token expirado.');
    }

    // Validar IP e fingerprint (proteção contra replay attack)
    if (registroRefreshToken.ipAddress && ipAddress && registroRefreshToken.ipAddress !== ipAddress) {
      Logger.warn(`[auth.service] IP mismatch ao renovar token. Esperado: ${registroRefreshToken.ipAddress}, Recebido: ${ipAddress}`);
      throw new Error('IP não corresponde ao original. Por segurança, faça login novamente.');
    }

    // Buscar usuário
    const usuario = await this.repositorioUsuarios.buscarPorId(registroRefreshToken.usuarioId);
    if (!usuario || !usuario.ativo) {
      throw new Error('Usuário não encontrado ou inativo.');
    }

    // Gerar novo access token com IP e fingerprint atuais
    const segredo = process.env.JWT_SEGREDO;
    if (!segredo) {
      throw new Error('Configuração de JWT ausente.');
    }

    if (!TEMPO_EXPIRACAO_PADRAO) {
      throw new Error('Configuração de autenticação incompleta.');
    }

    // Buscar lojas do usuário
    let loj_ids: number[] = [];
    let loj_id_principal: number | undefined;
    
    try {
      loj_ids = await this.repositorioUsuarios.buscarLojasDoUsuario(usuario.id);
      if (loj_ids.length > 0) {
        loj_id_principal = loj_ids[0];
      } else {
        const defaultLojaId = process.env.DEFAULT_LOJA_ID ? parseInt(process.env.DEFAULT_LOJA_ID) : 1;
        loj_ids = [defaultLojaId];
        loj_id_principal = defaultLojaId;
      }
    } catch (erro) {
      const defaultLojaId = process.env.DEFAULT_LOJA_ID ? parseInt(process.env.DEFAULT_LOJA_ID) : 1;
      loj_ids = [defaultLojaId];
      loj_id_principal = defaultLojaId;
    }

    const papelLogin = resolverPapelLogin(usuario);

    const novoToken = jwt.sign(
      {
        sub: usuario.uuid,
        email: usuario.email,
        role: papelLogin,
        papeis: usuario.papeis.map((p: { descricao: string }) => p.descricao),
        loj_ids: loj_ids,
        loj_id_principal: loj_id_principal,
        ip: ipAddress,
        fingerprint: userAgent ? crypto.createHash('sha256').update(userAgent).digest('hex') : undefined,
      },
      segredo as string,
      {
        expiresIn: TEMPO_EXPIRACAO_PADRAO as SignOptions['expiresIn'],
      },
    );

    const usuarioRetorno: IUsuarioAutenticadoDto = {
      uuid: usuario.uuid,
      nome: usuario.nome,
      email: usuario.email,
      role: papelLogin,
      papeis: usuario.papeis.map((p: { descricao: string }) => p.descricao),
    };

    return {
      token: novoToken,
      user: usuarioRetorno,
    };
  }

  /**
   * Revoga todos os refresh tokens do usuário (logout)
   */
  public async revogarRefreshTokens(usuarioId: number): Promise<void> {
    await this.repositorioRefreshToken.revogarTodosDoUsuario(usuarioId);
  }
}

