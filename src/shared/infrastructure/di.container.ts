import { FabricaConexaoBanco } from '@/shared/infrastructure/database/FabricaConexaoBanco';
import { RepositorioUsuarios } from '@/modules/usuarios/usuario.repository';
import { ServicoClientes } from '@/modules/clientes/clientes.service';
import { ServicoAdmin } from '@/modules/admin/admin.service';
import { ServicoAutenticacao } from '@/modules/auth/auth.service';
import { RepositorioEnderecoUsuarioPostgres } from '@/shared/infrastructure/database/RepositorioEnderecoUsuarioPostgres';
import { RepositorioPerfilClientePostgres } from '@/shared/infrastructure/database/RepositorioPerfilClientePostgres';
import { RepositorioTelefoneUsuarioPostgres } from '@/shared/infrastructure/database/RepositorioTelefoneUsuarioPostgres';

/**
 * Contêiner de Injeção de Dependências Manual.
 * Centraliza a criação de instâncias e resolve as cadeias de dependência.
 */
class ContainerDI {
  private static db = FabricaConexaoBanco.obterConexao();

  // Repositórios
  public static readonly repoUsuarios = new RepositorioUsuarios(ContainerDI.db);

  public static readonly repoEndereco = new RepositorioEnderecoUsuarioPostgres(ContainerDI.db);

  public static readonly repoPerfil = new RepositorioPerfilClientePostgres(ContainerDI.db);

  public static readonly repoTelefone = new RepositorioTelefoneUsuarioPostgres(ContainerDI.db);

  // Serviços
  public static readonly servicoClientes = new ServicoClientes(ContainerDI.repoUsuarios);

  public static readonly servicoAdmin = new ServicoAdmin(ContainerDI.repoUsuarios);

  public static readonly servicoAutenticacao = new ServicoAutenticacao(ContainerDI.repoUsuarios);

  // Controllers (se houver injeção via construtor, instanciaríamos aqui)
}

export const di = ContainerDI;
