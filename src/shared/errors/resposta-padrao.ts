import { Response } from 'express';

/** Estrutura de resposta de sucesso na API. */
export interface RespostaSucessoJson<T = unknown> {
  sucesso: true;
  dados: T;
}

/** Estrutura de resposta de erro na API. */
export interface RespostaErroJson {
  sucesso: false;
  mensagem: string;
}

/** Tipo união das respostas padronizadas. */
export type RespostaPadraoJson<T = unknown> = RespostaSucessoJson<T> | RespostaErroJson;

/**
 * Classe utilitária para enviar respostas HTTP em JSON padronizado.
 * Garante formato único para sucesso e falha em toda a API.
 */
export class RespostaPadrao {
  /**
   * Envia resposta de sucesso padronizada.
   *
   * @param resposta Objeto Response do Express.
   * @param statusCode Código HTTP (ex: 200, 201).
   * @param dados Payload a ser retornado em `dados`.
   */
  public static enviarSucesso<T>(resposta: Response, statusCode: number, dados: T): Response {
    const corpo: RespostaSucessoJson<T> = { sucesso: true, dados };
    return resposta.status(statusCode).json(corpo);
  }

  /**
   * Envia resposta de erro padronizada.
   *
   * @param resposta Objeto Response do Express.
   * @param statusCode Código HTTP (ex: 400, 401, 500).
   * @param mensagem Mensagem de erro a ser retornada em `mensagem`.
   */
  public static enviarErro(resposta: Response, statusCode: number, mensagem: string): Response {
    const corpo: RespostaErroJson = { sucesso: false, mensagem };
    return resposta.status(statusCode).json(corpo);
  }

  /**
   * Extrai mensagem segura de um valor desconhecido (exceção).
   * Evita vazamento de stack ou dados sensíveis.
   *
   * @param erro Valor capturado (Error ou outro).
   * @param mensagemPadrao Mensagem usada quando não for instância de Error.
   */
  public static obterMensagemErro(erro: unknown, mensagemPadrao: string): string {
    if (erro instanceof Error) {
      return erro.message;
    }
    return mensagemPadrao;
  }
}
