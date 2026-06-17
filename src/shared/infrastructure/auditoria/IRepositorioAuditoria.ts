/**
 * Interface do repositório de auditoria.
 */
export interface IAuditoriaRegistro {
  tipoAcao: string;
  entidade: string;
  entidadeId: string;
  usuarioId?: number;
  usuarioUuid?: string;
  dadosAnteriores?: Record<string, unknown>;
  dadosNovos?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  lojId?: number;
}

export interface IRepositorioAuditoria {
  registrar(registro: IAuditoriaRegistro): Promise<void>;
  listarPorEntidade(entidade: string, entidadeId: string, limite?: number): Promise<IAuditoriaRegistro[]>;
  listarPorUsuario(usuarioId: number, limite?: number): Promise<IAuditoriaRegistro[]>;
}
