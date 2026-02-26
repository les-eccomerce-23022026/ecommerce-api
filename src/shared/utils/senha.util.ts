/**
 * Verifica se uma senha atende aos critérios mínimos de complexidade.
 *
 * - Pelo menos 8 caracteres
 * - Pelo menos uma letra maiúscula
 * - Pelo menos uma letra minúscula
 * - Pelo menos um caractere especial
 */
export function verificarForcaSenha(senha: string): boolean {
  if (senha.length < 8) {
    return false;
  }

  const possuiMaiuscula = /[A-Z]/.test(senha);
  const possuiMinuscula = /[a-z]/.test(senha);
  const possuiEspecial = /[^A-Za-z0-9]/.test(senha);

  return possuiMaiuscula && possuiMinuscula && possuiEspecial;
}

