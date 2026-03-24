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
  for (let i = 0; i < 9; i += 1) {
    soma += parseInt(numeros.charAt(i), 10) * (10 - i);
  }
  const resto1 = 11 - (soma % 11);
  const digitoVerificador1 = resto1 === 10 || resto1 === 11 ? 0 : resto1;

  if (digitoVerificador1 !== parseInt(numeros.charAt(9), 10)) return false;

  // Validação do segundo dígito
  soma = 0;
  for (let i = 0; i < 10; i += 1) {
    soma += parseInt(numeros.charAt(i), 10) * (11 - i);
  }
  const resto2 = 11 - (soma % 11);
  const digitoVerificador2 = resto2 === 10 || resto2 === 11 ? 0 : resto2;

  return digitoVerificador2 === parseInt(numeros.charAt(10), 10);
}
