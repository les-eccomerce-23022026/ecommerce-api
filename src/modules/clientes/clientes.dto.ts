export interface TelefoneDto {
  tipo: string;
  ddd: string;
  numero: string;
}

export interface EnderecoResidencialDto {
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
export interface CriarClienteDto {
  nome: string;
  genero?: string;
  data_nascimento?: string;
  cpf: string;
  telefone?: TelefoneDto;
  email: string;
  senha: string;
  confirmacao_senha: string;
  endereco_residencial?: EnderecoResidencialDto;
}

/**
 * DTO mínimo atualmente enviado pelo frontend.
 */
export interface CriarClienteMinimoDto {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  confirmacao_senha: string;
}

