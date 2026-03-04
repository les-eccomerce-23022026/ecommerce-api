export interface ITelefoneDto {
  tipo: string;
  ddd: string;
  numero: string;
}

export interface IEnderecoResidencialDto {
  tipo_endereco: 'cobranca' | 'entrega';
  tipo_residencia: string;
  tipo_logradouro: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
  pais: string;
}

/**
 * DTO completo de criação de cliente.
 * Exige gênero, data de nascimento, telefone e endereços conforme RN0026/RF0021.
 */
export interface ICriarClienteDto {
  nome: string;
  cpf: string;
  email: string;
  genero?: string;
  dataNascimento?: string;
  telefone?: ITelefoneDto;
  senha: string;
  confirmacao_senha: string;
  endereco_residencial?: IEnderecoResidencialDto;
}

/**
 * DTO mínimo atualmente enviado pelo frontend.
 */
export interface ICriarClienteMinimoDto {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  confirmacao_senha: string;
}

/**
 * DTO para atualização de informações básicas do cliente.
 * Dados editaveis conforme RF0022: nome, gênero, data de nascimento, telefone.
 */
export interface IAtualizarClienteDto {
  nome?: string;
  genero?: string;
  dataNascimento?: string;
  telefone?: ITelefoneDto;
}

/**
 * DTO para alteração de senha do cliente.
 */
export interface IAlterarSenhaDto {
  senha_atual: string;
  nova_senha: string;
  confirmacao_senha: string;
}

