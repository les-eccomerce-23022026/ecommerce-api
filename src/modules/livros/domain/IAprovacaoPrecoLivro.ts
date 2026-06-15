export type StatusAprovacaoPreco = 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'CANCELADO';

export interface IAprovacaoPrecoLivro {
  uuid: string;
  livroUuid: string;
  lojaUuid: string;
  solicitanteUuid: string;
  aprovadorUuid?: string;
  precoAtual: number;
  precoSolicitado: number;
  margemGrupo: number;
  margemCalculada: number;
  status: StatusAprovacaoPreco;
  justificativa?: string;
  observacaoAprovador?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface ICriarAprovacaoPrecoDto {
  livroUuid: string;
  lojaUuid: string;
  solicitanteUuid: string;
  precoAtual: number;
  precoSolicitado: number;
  margemGrupo: number;
  margemCalculada: number;
  justificativa: string;
}
