/**
 * Valida o formato de um CPF (se possui 11 dígitos após remoção de caracteres não numéricos)
 * e aplica o algoritmo de validação de dígitos verificadores.
 * 
 * @param cpf O CPF a ser validado
 * @returns true se o CPF for válido, false caso contrário
 */
export function validarCpf(cpf: string): boolean {
  if (!cpf) return false;

  // Remove caracteres não numéricos
  const numeros = cpf.replace(/\D/g, '');

  if (numeros.length !== 11) return false;

  // Elimina CPFs conhecidos inválidos (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(numeros)) return false;

  // Validação do primeiro dígito
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digitoVerificador1 = resto === 10 || resto === 11 ? 0 : resto;

  if (digitoVerificador1 !== parseInt(numeros.charAt(9))) return false;

  // Validação do segundo dígito
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digitoVerificador2 = resto === 10 || resto === 11 ? 0 : resto;

  return digitoVerificador2 === parseInt(numeros.charAt(10));
}
