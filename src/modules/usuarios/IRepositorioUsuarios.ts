import { IUsuario } from '@/modules/usuarios/Iusuario.entity';
import { IPapelUsuario } from '@/shared/types/Ipapel-usuario';

/** Dados de entrada para criação de usuário, sem campos gerados automaticamente */
export type IDadosCriarUsuario = Omit<IUsuario, 'uuid' | 'ativo' | 'id'> & { role?: IPapelUsuario };

export interface IFiltrosConsultaClientes {
  nome?: string;
  cpf?: string;
  email?: string;
  idPapel?: number;
  offset: number;
  limite: number;
}

/**
 * Interface obrigatória para qualquer repositório de usuários.
 * Define o contrato para inversão de dependência na camada de serviço.
 */
export interface IRepositorioUsuarios {
  buscarPorEmail(email: string): Promise<IUsuario | undefined>;
  buscarPorEmailPapel(email: string, idPapel: number): Promise<IUsuario | undefined>;
  buscarTodosPorEmail(email: string): Promise<IUsuario[]>;
  buscarPorCpf(cpf: string): Promise<IUsuario | undefined>;
  buscarPorCpfPapel(cpf: string, idPapel: number): Promise<IUsuario | undefined>;
  buscarPorUuid(uuid: string): Promise<IUsuario | undefined>;
  criarUsuario(dados: IDadosCriarUsuario): Promise<IUsuario>;
  atualizarUsuario(uuid: string, dados: Partial<IUsuario>): Promise<IUsuario | undefined>;
  deletarPorEmail(email: string): Promise<void>;
  buscarClientesComFiltros(filtros: IFiltrosConsultaClientes): Promise<IUsuario[]>;
  contarClientesComFiltros(filtros: Omit<IFiltrosConsultaClientes, 'offset' | 'limite'>): Promise<number>;
  buscarSenhaMestra(idPapel: number): Promise<string | undefined>;
}
