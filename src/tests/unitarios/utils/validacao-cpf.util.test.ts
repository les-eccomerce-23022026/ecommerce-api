import { validarCpf } from '@/shared/utils/validacao-cpf.util';

describe('validarCpf', () => {
  it('aceita CPF com dígitos verificadores corretos', () => {
    expect(validarCpf('529.982.247-25')).toBe(true);
    expect(validarCpf('52998224725')).toBe(true);
  });

  it('rejeita sequência repetida', () => {
    expect(validarCpf('111.111.111-11')).toBe(false);
  });

  it('rejeita CPF com dígitos incorretos', () => {
    expect(validarCpf('529.982.247-00')).toBe(false);
  });

  it('rejeita vazio ou tamanho inválido', () => {
    expect(validarCpf('')).toBe(false);
    expect(validarCpf('123')).toBe(false);
  });
});
