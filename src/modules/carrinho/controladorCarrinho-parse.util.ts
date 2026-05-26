import type { Request } from 'express';

export type ResultadoParseSincronizar =
  | { ok: true; livroUuid: string; quantidade: number }
  | { ok: false; status: number; mensagem: string };

export function parseSincronizarItemCarrinho(req: Request): ResultadoParseSincronizar {
  const { livroUuid, quantidade } = req.body as { livroUuid?: string; quantidade?: unknown };
  if (!livroUuid || typeof livroUuid !== 'string') {
    return { ok: false, status: 400, mensagem: 'livroUuid é obrigatório' };
  }
  const q = Number(quantidade);
  if (!Number.isFinite(q) || q < 0 || !Number.isInteger(q)) {
    return { ok: false, status: 400, mensagem: 'quantidade deve ser um inteiro >= 0' };
  }
  return { ok: true, livroUuid, quantidade: q };
}
