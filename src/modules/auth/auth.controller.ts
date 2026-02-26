import { Request, Response } from 'express';
import { ServicoAutenticacao } from '@/modules/auth/auth.service';

const servicoAutenticacao = new ServicoAutenticacao();

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
        return resposta.status(400).json({ mensagem: 'Email e senha são obrigatórios.' });
      }

      const resultado = await servicoAutenticacao.autenticar({ email, senha });

      return resposta.status(200).json(resultado);
    } catch (erro) {
      return resposta.status(401).json({
        mensagem: erro instanceof Error ? erro.message : 'Erro ao autenticar usuário.',
      });
    }
  }
}

