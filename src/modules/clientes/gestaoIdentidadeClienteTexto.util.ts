import type { ITelefoneUsuario } from '@/shared/types/ITelefoneUsuario';
import type { ITelefoneDto } from '@/modules/clientes/Iclientes.dto';

export function mapearTipoTelefone(tipo: string): number {
  const mapeamentoTipos: Record<string, number> = {
    celular: 1,
    residencial: 2,
    comercial: 3,
  };
  return mapeamentoTipos[tipo.toLowerCase()] ?? 1;
}

export function normalizarDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function mascararCpf(cpf: string): string {
  const cpfSomenteDigitos = normalizarDigitos(cpf);
  if (cpfSomenteDigitos.length !== 11) {
    return cpf;
  }
  return `***.${cpfSomenteDigitos.slice(3, 6)}.***-**`;
}

export function mascararNumeroTelefone(numero: string): string {
  const numeroSomenteDigitos = normalizarDigitos(numero);
  if (numeroSomenteDigitos.length <= 4) {
    return numeroSomenteDigitos;
  }
  const quantidadeMascarada = numeroSomenteDigitos.length - 4;
  return `${'*'.repeat(quantidadeMascarada)}${numeroSomenteDigitos.slice(-4)}`;
}

export function mascararEmail(email: string): string {
  const partes = email.split('@');
  if (partes.length !== 2) return email;
  const [usuario, dominio] = partes;
  if (usuario.length <= 2) {
    return `${usuario[0]}***@${dominio}`;
  }
  return `${usuario[0]}***${usuario[usuario.length - 1]}@${dominio}`;
}

export function converterTelefoneParaDto(telefone: ITelefoneUsuario): ITelefoneDto {
  const tipos: Record<number, string> = {
    1: 'Celular',
    2: 'Residencial',
    3: 'Comercial',
  };
  return {
    tipo: tipos[telefone.idTipoTelefone] || 'Celular',
    ddd: telefone.ddd,
    numero: telefone.numero,
    numeroMascarado: mascararNumeroTelefone(telefone.numero),
  };
}
