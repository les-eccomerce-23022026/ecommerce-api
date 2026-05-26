/**
 * Dados persistidos da cobrança PIX simulada (PSP fake).
 */
export interface IPagamentoPixSimuladoPersistido {
  copiaCola: string;
  qrCodeBase64: string | null;
  expiraEm: Date;
  segredoConfirmacao: string;
}
