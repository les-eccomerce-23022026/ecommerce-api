import { EnderecoEntrega } from '@/modules/entrega/Endereco';

describe('EnderecoEntrega', () => {
  it('deve criar endereco válido', () => {
    const e = new EnderecoEntrega('Casa', 'Rua', 'Rua A', '123', 'Bairro B', '01234-567', 'Cidade C', 'SP', 'Brasil', 'apt 1');
    expect(e.toJSON()).toMatchObject({ 
      logradouro: 'Rua A', 
      bairro: 'Bairro B', 
      cidade: 'Cidade C', 
      estado: 'SP', 
      cep: '01234567',
      pais: 'Brasil',
      tipoResidencia: 'Casa',
      tipoLogradouro: 'Rua',
      numero: '123',
      complemento: 'apt 1'
    });
  });

  it('deve rejeitar cep inválido', () => {
    expect(() => new EnderecoEntrega('Casa', 'Rua', 'Rua A', '123', 'Bairro B', '123', 'Cidade C', 'SP', 'Brasil')).toThrow('CEP inválido');
  });

  it('deve rejeitar campos vazios', () => {
    expect(() => new EnderecoEntrega('Casa', 'Rua', '', '123', 'Bairro B', '01234567', 'Cidade C', 'SP', 'Brasil')).toThrow('Campo rua inválido');
  });
});
