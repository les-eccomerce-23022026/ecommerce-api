/**
 * Exceções Tipadas do Domínio
 * 
 * Exceções específicas do domínio para tratamento de erros
 * com contexto adequado e tipo seguro.
 */

/**
 * Exceção lançada quando um usuário não é encontrado
 */
export class UsuarioNaoEncontradoError extends Error {
  constructor(uuid: string) {
    super(`Usuário ${uuid} não encontrado`);
    this.name = 'UsuarioNaoEncontradoError';
  }
}

/**
 * Exceção lançada quando a senha atual está incorreta
 */
export class SenhaInvalidaError extends Error {
  constructor() {
    super('Senha atual incorreta');
    this.name = 'SenhaInvalidaError';
  }
}

/**
 * Exceção lançada quando uma venda não é encontrada
 */
export class VendaNaoEncontradaError extends Error {
  constructor(uuid: string) {
    super(`Venda ${uuid} não encontrada`);
    this.name = 'VendaNaoEncontradaError';
  }
}

/**
 * Exceção lançada quando um cliente não é encontrado
 */
export class ClienteNaoEncontradoError extends Error {
  constructor(uuid: string) {
    super(`Cliente ${uuid} não encontrado`);
    this.name = 'ClienteNaoEncontradoError';
  }
}

/**
 * Exceção lançada quando um endereço não é encontrado
 */
export class EnderecoNaoEncontradoError extends Error {
  constructor(uuid: string) {
    super(`Endereço ${uuid} não encontrado`);
    this.name = 'EnderecoNaoEncontradoError';
  }
}

/**
 * Exceção lançada quando um livro não é encontrado
 */
export class LivroNaoEncontradoError extends Error {
  constructor(uuid: string) {
    super(`Livro ${uuid} não encontrado`);
    this.name = 'LivroNaoEncontradoError';
  }
}

/**
 * Exceção lançada quando dados de entrada são inválidos
 */
export class DadosInvalidosError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'DadosInvalidosError';
  }
}

/**
 * Exceção lançada quando uma operação não é permitida
 */
export class OperacaoNaoPermitidaError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'OperacaoNaoPermitidaError';
  }
}
