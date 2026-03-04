export interface ITelefoneDto {
  tipo: string;
  ddd: string;
  numero: string;
}

export interface IEnderecoDto {
  apelido?: string;
  tipoResidencia?: string;
  tipoLogradouro?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
  pais?: string;
}

/**
 * DTO de criação de cliente.
 * Endereço e telefone são opcionais no registro e podem ser adicionados
 * posteriormente via PUT /api/clientes/perfil.
 */
export interface ICriarClienteDto {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  confirmacao_senha: string;
  genero?: string;
  dataNascimento?: string;
  telefone?: ITelefoneDto;
  enderecoCobranca?: IEnderecoDto;
  enderecoEntrega?: IEnderecoDto;
  enderecoEntregaIgualCobranca?: boolean;
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

/**
 * DTO para resposta do perfil do cliente.
 */
export interface IPerfilClienteDto {
  uuid: string;
  nome: string;
  email: string;
  cpf: string;
  genero?: string;
  dataNascimento?: string;
  telefone?: ITelefoneDto;
  enderecos: IEnderecoDto[];
}

