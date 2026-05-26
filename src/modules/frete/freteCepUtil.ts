/** Retorna 8 dígitos ou lança se inválido. */
export function sanitizarCep8Digitos(cep: string): string {
  const d = cep.replace(/\D/g, '');
  if (d.length !== 8) {
    throw new Error('CEP inválido: informe 8 dígitos.');
  }
  return d;
}

export function cepOrigemPadrao(): string {
  const bruto = process.env.FRETE_CEP_ORIGEM_PADRAO?.replace(/\D/g, '') ?? '';
  if (bruto.length === 8) return bruto;
  return '01000000';
}
