/**
 * DTO para criação de novos administradores.
 * Suporta CPF (PF), CNPJ (PJ), ou ambos simultaneamente.
 * - PF: CPF obrigatório, CNPJ opcional
 * - PJ: CNPJ obrigatório, CPF opcional
 * - Ambos: CPF e CNPJ podem ser fornecidos simultaneamente
 */
export interface ICriarAdminDto {
  nome: string;
  email: string;
  cpf?: string; // Obrigatório se tipoPessoa = PF, opcional se tipoPessoa = PJ
  cnpj?: string; // Obrigatório se tipoPessoa = PJ, opcional se tipoPessoa = PF
  senha: string;
  confirmacaoSenha: string;
  usarMesmaSenha?: boolean;
  tipoPessoa?: 'PF' | 'PJ'; // Define qual documento é obrigatório
}

/**
 * DTO de retorno para administrador criado.
 */
export interface IRespostaAdminCriadoDto {
  uuid: string;
  nome: string;
  email: string;
  cpf?: string;
  cnpj?: string;
  role: string;
}

/**
 * DTO para listagem de administradores.
 */
export interface IListaAdminDto {
  uuid: string;
  nome: string;
  email: string;
  ativo: boolean;
  trocasPendentes?: number; // Contagem de trocas/devoluções pendentes para admin sistema
}
