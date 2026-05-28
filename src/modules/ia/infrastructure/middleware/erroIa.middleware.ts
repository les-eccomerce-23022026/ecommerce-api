import { Request, Response, NextFunction } from 'express';
import { Logger } from '@/shared/utils/Logger.util';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';

/**
 * Middleware de erro específico para IA
 * 
 * Trata erros específicos do serviço de IA como:
 * - Falha na conexão com ChromaDB
 * - Falha na conexão com Gemini API
 * - Erros de geração de embedding
 * - Erros de validação anti-alucinação
 */
export class ErroIa extends Error {
  constructor(
    mensagem: string,
    public codigo: string,
    public statusCode: number = 500,
    public detalhes?: any
  ) {
    super(mensagem);
    this.name = 'ErroIa';
  }
}

/**
 * Tipos de erros específicos de IA
 */
export const CodigosErroIa = {
  CHROMADB_CONEXAO_FALHOU: 'CHROMADB_CONEXAO_FALHOU',
  GEMINI_API_FALHOU: 'GEMINI_API_FALHOU',
  GEMINI_API_KEY_INVALIDA: 'GEMINI_API_KEY_INVALIDA',
  EMBEDDING_FALHOU: 'EMBEDDING_FALHOU',
  EMBEDDING_INVALIDO: 'EMBEDDING_INVALIDO',
  PRODUTO_NAO_EXISTE: 'PRODUTO_NAO_EXISTE',
  ALUCINACAO_DETECTADA: 'ALUCINACAO_DETECTADA',
  INDEXACAO_FALHOU: 'INDEXACAO_FALHOU',
  CONTEXTO_INVALIDO: 'CONTEXTO_INVALIDO',
} as const;

/**
 * Middleware de tratamento de erros de IA
 */
export function middlewareErroIa(
  erro: Error | ErroIa,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // Se não for um erro de IA, passa para o próximo middleware
  if (!(erro instanceof ErroIa)) {
    next(erro);
    return;
  }

  Logger.error(`[ErroIa] ${erro.codigo}: ${erro.message}`, erro.detalhes);

  const resposta = {
    erro: erro.codigo,
    mensagem: erro.message,
    detalhes: erro.detalhes,
  };

  res.status(erro.statusCode).json(resposta);
}

/**
 * Função auxiliar para lançar erros de IA
 */
export function lancarErroIa(
  codigo: keyof typeof CodigosErroIa,
  mensagem: string,
  detalhes?: any
): never {
  const statusCode = determinarStatusCode(codigo);
  throw new ErroIa(mensagem, codigo, statusCode, detalhes);
}

/**
 * Determina o status HTTP baseado no código de erro
 */
function determinarStatusCode(codigo: keyof typeof CodigosErroIa): number {
  switch (codigo) {
    case 'GEMINI_API_KEY_INVALIDA':
    case 'CONTEXTO_INVALIDO':
      return 400;
    case 'PRODUTO_NAO_EXISTE':
    case 'ALUCINACAO_DETECTADA':
      return 404;
    case 'CHROMADB_CONEXAO_FALHOU':
    case 'GEMINI_API_FALHOU':
    case 'EMBEDDING_FALHOU':
    case 'INDEXACAO_FALHOU':
      return 503;
    default:
      return 500;
  }
}