import { Request, Response, NextFunction } from 'express';
import { RespostaPadrao } from '@/shared/errors/resposta-padrao';

const MENSAGEM_ERRO_INESPERADO = 'Erro interno do servidor.';

/**
 * Middleware que captura exceções não tratadas e retorna resposta JSON padronizada.
 * Deve ser registrado após todas as rotas.
 *
 * @param erro Exceção lançada em algum handler.
 * @param _requisicao Objeto da requisição (não utilizado).
 * @param resposta Objeto da resposta HTTP.
 * @param _proximo NextFunction (obrigatório para Express reconhecer como middleware de erro).
 */
export function middlewareErro(
  erro: unknown,
  _requisicao: Request,
  resposta: Response,
  _proximo: NextFunction,
): void {
  const mensagem = RespostaPadrao.obterMensagemErro(erro, MENSAGEM_ERRO_INESPERADO);
  const statusCode = 500;
  RespostaPadrao.enviarErro(resposta, statusCode, mensagem);
}
