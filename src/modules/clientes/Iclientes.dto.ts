export interface ITelefoneDto {
  tipo: string;
  ddd: string;
  numero: string;
}

export interface IEnderecoResidencialDto {
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
 */
export interface ICriarClienteDto {
  nome: string;
  genero?: string;
  data_nascimento?: string;
  cpf: string;
  telefone?: ITelefoneDto;
  email: string;
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
 */
export interface IAtualizarClienteDto {
  nome?: string;
  email?: string;
}

/**
 * DTO para alteração de senha do cliente.
 */
export interface IAlterarSenhaDto {
  senha_atual: string;
  nova_senha: string;
  confirmacao_senha: string;
}

