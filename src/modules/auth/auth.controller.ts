import { Request, Response } from 'express';
import { di } from '@/shared/infrastructure/di.container';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';

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

      // Definir cookie HttpOnly com JWT
      resposta.cookie('token', resultado.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24h
      });

      // Em ambiente de teste, incluir token no corpo da resposta para facilitar testes
      const respostaUsuario = { user: resultado.user };
      const respostaTeste = { token: resultado.token, user: resultado.user };

      return RespostaPadrao.enviarSucesso(resposta, 200, process.env.JEST_WORKER_ID ? respostaTeste : respostaUsuario);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao autenticar usuário.');
      return RespostaPadrao.enviarErro(resposta, 401, mensagem);
    }
  }
}

