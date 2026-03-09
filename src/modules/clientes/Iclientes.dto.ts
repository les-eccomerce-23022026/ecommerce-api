export interface ITelefoneDto {
  tipo: string;
  ddd: string;
  numero: string;
  numeroMascarado?: string;
}

export interface IEnderecoDto {
  uuid?: string;
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
 */
export interface ICriarClienteDto {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  confirmacaoSenha: string;
  genero?: string;
  dataNascimento?: string;
  telefone?: ITelefoneDto;
  enderecoCobranca?: IEnderecoDto;
  enderecoEntrega?: IEnderecoDto;
  enderecoEntregaIgualCobranca?: boolean;
}

/**
 * DTO para atualização de informações básicas do cliente.
 */
export interface IAtualizarClienteDto {
  nome?: string;
  genero?: string;
  dataNascimento?: string;
  telefone?: ITelefoneDto;
  enderecos?: IEnderecoDto[];
}

/**
 * DTO para alteração de senha do cliente.
 */
export interface IAlterarSenhaDto {
  senhaAtual: string;
  novaSenha: string;
  confirmacaoNovaSenha: string;
}

/**
 * DTO para resposta do perfil do cliente.
 */
export interface IPerfilClienteDto {
  uuid: string;
  nome: string;
  email: string;
  cpf: string;
  cpfMascarado: string;
  genero?: string;
  dataNascimento?: string;
  telefone?: ITelefoneDto;
  enderecos: IEnderecoDto[];
}
