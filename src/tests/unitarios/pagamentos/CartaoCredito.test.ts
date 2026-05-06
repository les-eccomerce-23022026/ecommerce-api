import { CartaoCredito } from '@/modules/pagamentos/entities/CartaoCredito';

describe('CartaoCredito', () => {
  it('deve criar cartão válido', () => {
    const cartao = new CartaoCredito('4111111111111111', 'João Silva', '12/30', 'Visa');
    expect(cartao.getNumeroTokenizado()).toBeDefined();
    expect(cartao.getNomeTitular()).toBe('JOÃO SILVA');
    expect(cartao.getValidade()).toBe('12/30');
    expect(cartao.getBandeira()).toBe('Visa');
  });

  it('deve rejeitar número inválido', () => {
    expect(() => new CartaoCredito('123', 'João Silva', '12/30', 'Visa')).toThrow('Número do cartão inválido');
  });

  it('deve rejeitar nome titular vazio', () => {
    expect(() => new CartaoCredito('4111111111111111', '', '12/30', 'Visa')).toThrow('Nome do titular inválido');
  });

  it('deve rejeitar validade inválida', () => {
    expect(() => new CartaoCredito('4111111111111111', 'João Silva', '13/25', 'Visa')).toThrow('Mês de validade inválido');
  });

  it('deve rejeitar bandeira não suportada', () => {
    expect(() => new CartaoCredito('4111111111111111', 'João Silva', '12/30', 'Unknown')).toThrow('Bandeira não suportada');
  });

  it('deve validar Luhn', () => {
    expect(() => new CartaoCredito('4111111111111112', 'João Silva', '12/30', 'Visa')).toThrow('Número do cartão inválido (Luhn)');
  });

  it('deve comparar igualdade', () => {
    const cartao1 = new CartaoCredito('4111111111111111', 'João Silva', '12/30', 'Visa');
    const cartao2 = new CartaoCredito('4111111111111111', 'João Silva', '12/30', 'Visa');
    expect(cartao1.equals(cartao2)).toBe(true);
  });
});
