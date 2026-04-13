/**
 * Valida o formato de um CPF (se possui 11 dígitos após remoção de caracteres não numéricos)
 * e aplica o algoritmo de validação de dígitos verificadores.
 * 
 * @param cpf O CPF a ser validado
 * @returns true se o CPF for válido, false caso contrário
 */
function calcularDigitoCpf(numeros: string, tamanho: number): number {
  let soma = 0;
  for (let i = 0; i < tamanho; i += 1) {
    soma += parseInt(numeros.charAt(i), 10) * (tamanho + 1 - i);
  }
  const resto = 11 - (soma % 11);
  return resto === 10 || resto === 11 ? 0 : resto;
}

export function validarCpf(cpf: string): boolean {
  if (!cpf) return false;
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numeros)) return false;
  const d1 = calcularDigitoCpf(numeros, 9);
  if (d1 !== parseInt(numeros.charAt(9), 10)) return false;
  const d2 = calcularDigitoCpf(numeros, 10);
  return d2 === parseInt(numeros.charAt(10), 10);
}
