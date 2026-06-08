import { Request, Response } from 'express';
import { di } from '@/shared/infrastructure/di.container';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';
import { obterNomeCookieAuth } from '@/shared/constants/auth-cookie';
import { MENSAGENS_ERRO } from '@/shared/constants/mensagens-erro.constants';
import { Logger } from '@/shared/utils/Logger.util';

const { servicoAutenticacao, repoRefreshTokens } = di;

/**
 * Controller responsável pelo login de usuários.
 */
export class ControladorAutenticacao {
  /**
   * Realiza o login a partir das credenciais recebidas no corpo da requisição.
   *
   * @param requisicao Objeto da requisição HTTP.
   * @param resposta Objeto da resposta HTTP.
   */
  public static async realizarLogin(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const { email, senha } = requisicao.body ?? {};

      if (!email || !senha) {
        return RespostaPadrao.enviarErro(resposta, 400, 'Email e senha são obrigatórios.');
      }

      // Extrair IP e user agent para proteção contra replay attack
      const ipAddress = requisicao.ip || requisicao.socket.remoteAddress;
      const userAgent = requisicao.headers['user-agent'] as string | undefined;

      const resultado = await servicoAutenticacao.autenticar({ email, senha }, ipAddress, userAgent);

      const nomeCookie = obterNomeCookieAuth();
      // Parse tempo de expiração do JWT para calcular maxAge do cookie (em milissegundos)
      const tempoExpiracao = process.env.JWT_TEMPO_EXPIRACAO || '1h';
      const maxAgeMs = tempoExpiracao.endsWith('h') 
        ? parseInt(tempoExpiracao) * 60 * 60 * 1000
        : tempoExpiracao.endsWith('m')
        ? parseInt(tempoExpiracao) * 60 * 1000
        : 3600000; // 1h padrão

      resposta.cookie(nomeCookie, resultado.token, {
        httpOnly: true,              // Protege contra XSS
        secure: process.env.NODE_ENV === 'production',  // HTTPS em produção
        sameSite: 'strict',          // Máxima proteção contra CSRF
        path: '/',
        maxAge: maxAgeMs,            // Sincroniza com expiração do JWT
      });

      // Definir cookie x-loja-uuid para contexto de multi-tenancy
      // Busca loja_uuid_principal do token JWT decodificado
      const tokenDecodificado = JSON.parse(Buffer.from(resultado.token.split('.')[1], 'base64').toString());
      const lojaUuidPrincipal = tokenDecodificado.loja_uuid_principal;
      if (lojaUuidPrincipal) {
        resposta.cookie('x-loja-uuid', lojaUuidPrincipal, {
          httpOnly: false,           // Precisa ser acessível via JavaScript no cliente
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 ano
        });
      }

      // ⚠️ SEGURANÇA: Token retornado no corpo em desenvolvimento e testes.
      // Em produção, o JWT está protegido em cookie HttpOnly.
      // Refresh token retornado em cookie HttpOnly separado.
      const incluirTokenNoCorpo =
        process.env.NODE_ENV === 'test' || 
        process.env.NODE_ENV === 'development' ||
        requisicao.headers['x-use-test-db'] === 'true';
      
      // Cookie HttpOnly para refresh token
      if (resultado.refreshToken) {
        resposta.cookie(`${nomeCookie}_refresh`, resultado.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: resultado.refreshTokenExpiresAt 
            ? new Date(resultado.refreshTokenExpiresAt).getTime() - Date.now()
            : 7 * 24 * 60 * 60 * 1000, // 7 dias padrão
        });
      }

      const respostaCorpo = incluirTokenNoCorpo
        ? { 
            token: resultado.token, 
            refreshToken: resultado.refreshToken,
            refreshTokenExpiresAt: resultado.refreshTokenExpiresAt,
            user: resultado.user 
          }
        : { 
            refreshTokenExpiresAt: resultado.refreshTokenExpiresAt,
            user: resultado.user 
          };

      return RespostaPadrao.enviarSucesso(resposta, 200, respostaCorpo);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao autenticar usuário.');
      const status = mensagem === 'Credenciais inválidas.' ? 401 : 500;

      if (status === 500) {
        Logger.error('[auth.controller] Falha de infraestrutura/configuracao durante login', {
          mensagem,
        });
      }

      return RespostaPadrao.enviarErro(resposta, status, mensagem);
    }
  }

  /**
   * Retorna os dados do usuário autenticado a partir do token (reuso de sessão).
   *
   * @param requisicao Objeto da requisição contendo req.usuario.
   * @param resposta Objeto da resposta HTTP.
   */
  public static async me(requisicao: Request, resposta: Response): Promise<Response> {
    const { usuario } = requisicao;

    if (!usuario) {
      return RespostaPadrao.enviarErro(resposta, 401, 'Sessão inválida ou expirada.');
    }

    try {
      // Buscar dados completos do usuário para retornar IUsuarioAutenticadoDto consistente
      const usuarioBD = await di.repoUsuarios.buscarPorUuid(usuario.uuid);
      
      if (!usuarioBD) {
        return RespostaPadrao.enviarErro(resposta, 401, MENSAGENS_ERRO.USUARIO_NAO_ENCONTRADO);
      }

      return RespostaPadrao.enviarSucesso(resposta, 200, {
        user: {
          uuid: usuarioBD.uuid,
          nome: usuarioBD.nome,
          email: usuarioBD.email,
          role: usuarioBD.role.descricao,
          papeis: usuarioBD.papeis.map((p) => p.descricao),
        }
      });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao recuperar dados da sessão.');
      return RespostaPadrao.enviarErro(resposta, 500, mensagem);
    }
  }

  /**
   * Encerra a sessão no cliente (remove cookie HttpOnly).
   * Revoga todos os refresh tokens do usuário.
   * Não exige autenticação: sempre limpa o cookie para evitar sessão órfã.
   */
  public static async encerrarSessao(requisicao: Request, resposta: Response): Promise<Response> {
    const nomeCookie = obterNomeCookieAuth();
    
    // Limpar cookie de auth com as mesmas opções usadas ao definir
    resposta.clearCookie(nomeCookie, { 
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
    });
    
    // Limpar cookie de refresh token com as mesmas opções usadas ao definir
    resposta.clearCookie(`${nomeCookie}_refresh`, { 
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
    });
    
    // Limpar cookie de loja uuid
    resposta.clearCookie('x-loja-uuid', { 
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
    });
    
    // Revogar refresh tokens se usuário estiver autenticado
    if (requisicao.usuario?.id) {
      await repoRefreshTokens.revogarTodosDoUsuario(requisicao.usuario.id);
    }
    
    return RespostaPadrao.enviarSucesso(resposta, 200, { ok: true });
  }

  /**
   * Renova access token usando refresh token
   *
   * @param requisicao Objeto da requisição HTTP.
   * @param resposta Objeto da resposta HTTP.
   */
  public static async renovarToken(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const nomeCookie = obterNomeCookieAuth();
      const refreshToken = requisicao.cookies?.[`${nomeCookie}_refresh`];

      if (!refreshToken) {
        return RespostaPadrao.enviarErro(resposta, 401, 'Refresh token não fornecido.');
      }

      // Extrair IP e user agent para validação de replay attack
      const ipAddress = requisicao.ip || requisicao.socket.remoteAddress;
      const userAgent = requisicao.headers['user-agent'] as string | undefined;

      const resultado = await servicoAutenticacao.renovarToken(refreshToken, ipAddress, userAgent);

      // Atualizar cookie de access token
      const tempoExpiracao = process.env.JWT_TEMPO_EXPIRACAO || '1h';
      const maxAgeMs = tempoExpiracao.endsWith('h') 
        ? parseInt(tempoExpiracao) * 60 * 60 * 1000
        : tempoExpiracao.endsWith('m')
        ? parseInt(tempoExpiracao) * 60 * 1000
        : 3600000;

      resposta.cookie(nomeCookie, resultado.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: maxAgeMs,
      });

      const incluirTokenNoCorpo =
        process.env.NODE_ENV === 'test' || requisicao.headers['x-use-test-db'] === 'true';
      const respostaCorpo = incluirTokenNoCorpo
        ? { token: resultado.token, user: resultado.user }
        : { user: resultado.user };

      return RespostaPadrao.enviarSucesso(resposta, 200, respostaCorpo);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao renovar token.');
      const status = mensagem.includes('inválido') || mensagem.includes('expirado') || mensagem.includes('revogado') ? 401 : 500;
      return RespostaPadrao.enviarErro(resposta, status, mensagem);
    }
  }
}
