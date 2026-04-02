import { Request, Response } from 'express';
import { di } from '@/shared/infrastructure/di.container';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';
import { obterNomeCookieAuth } from '@/shared/constants/auth-cookie';

const { servicoAutenticacao } = di;

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

      const resultado = await servicoAutenticacao.autenticar({ email, senha });

      const nomeCookie = obterNomeCookieAuth();
      resposta.cookie(nomeCookie, resultado.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      const incluirTokenNoCorpo = process.env.NODE_ENV === 'test';
      const respostaCorpo = incluirTokenNoCorpo
        ? { token: resultado.token, user: resultado.user }
        : { user: resultado.user };

      return RespostaPadrao.enviarSucesso(resposta, 200, respostaCorpo);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao autenticar usuário.');
      return RespostaPadrao.enviarErro(resposta, 401, mensagem);
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
        return RespostaPadrao.enviarErro(resposta, 401, 'Usuário não encontrado.');
      }

      return RespostaPadrao.enviarSucesso(resposta, 200, {
        user: {
          uuid: usuarioBD.uuid,
          nome: usuarioBD.nome,
          email: usuarioBD.email,
          role: usuarioBD.role.descricao,
          eAdminMestre: !!usuarioBD.isAdminMestre,
        }
      });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao recuperar dados da sessão.');
      return RespostaPadrao.enviarErro(resposta, 500, mensagem);
    }
  }

  /**
   * Encerra a sessão no cliente (remove cookie HttpOnly).
   * Não exige autenticação: sempre limpa o cookie para evitar sessão órfã.
   */
  public static async encerrarSessao(_requisicao: Request, resposta: Response): Promise<Response> {
    const nomeCookie = obterNomeCookieAuth();
    resposta.clearCookie(nomeCookie, { path: '/' });
    return RespostaPadrao.enviarSucesso(resposta, 200, { ok: true });
  }
}
