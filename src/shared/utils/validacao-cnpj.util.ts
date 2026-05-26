/**
 * Valida o formato de um CNPJ (se possui 14 dígitos após remoção de caracteres não numéricos)
 * e aplica o algoritmo de validação de dígitos verificadores.
 * 
 * @param cnpj O CNPJ a ser validado
 * @returns true se o CNPJ for válido, false caso contrário
 */
function calcularDigitoCnpj(numeros: string, pesos: number[]): number {
  let soma = 0;
  for (let i = 0; i < numeros.length; i += 1) {
    soma += parseInt(numeros.charAt(i), 10) * pesos[i];
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCnpj(cnpj: string): boolean {
  if (!cnpj) return false;
  const numeros = cnpj.replace(/\D/g, '');
  if (numeros.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(numeros)) return false;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcularDigitoCnpj(numeros.substring(0, 12), pesos1);
  if (d1 !== parseInt(numeros.charAt(12), 10)) return false;

  const d2 = calcularDigitoCnpj(numeros.substring(0, 13), pesos2);
  return d2 === parseInt(numeros.charAt(13), 10);
}

/**
 * Gera um CNPJ válido aleatório para testes.
 * @returns CNPJ formatado (XX.XXX.XXX/XXXX-XX)
 */
export function gerarCnpjValido(): string {
  const base = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
  const filial = '0001';
  const baseNumeros = base + filial;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcularDigitoCnpj(baseNumeros, pesos1);
  const d2 = calcularDigitoCnpj(baseNumeros + d1, pesos2);

  const cnpjCompleto = baseNumeros + d1 + d2;
  return cnpjCompleto.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}
