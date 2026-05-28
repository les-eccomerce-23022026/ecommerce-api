import { FabricaConexaoBanco } from '@/shared/infrastructure/database/FabricaConexaoBanco';
import { RepositorioUsuarios } from '@/modules/usuarios/usuario.repository';
import { RepositorioRefreshTokenPostgres } from '@/modules/auth/RepositorioRefreshTokenPostgres';
import { GestaoIdentidadeCliente } from '@/modules/clientes/clientes.service';
import { ServicoConsultaClientes } from '@/modules/clientes/consultaClientes.service';
import { ServicoCartoes } from '@/modules/cartoes/cartoes.service';
import { RepositorioCartaoUsuario } from '@/modules/cartoes/IRepositorioCartaoUsuario';
import { ServicoAdmin } from '@/modules/admin/admin.service';
import { ServicoAutenticacao } from '@/modules/auth/auth.service';
import { RepositorioEnderecoUsuarioPostgres } from '@/shared/infrastructure/database/RepositorioEnderecoUsuarioPostgres';
import { RepositorioPerfilClientePostgres } from '@/shared/infrastructure/database/RepositorioPerfilClientePostgres';
import { RepositorioTelefoneUsuarioPostgres } from '@/shared/infrastructure/database/RepositorioTelefoneUsuarioPostgres';
import { RepositorioLojasPostgres } from '@/modules/lojas/repositorioLojasPostgres';
import { ServicoLojas } from '@/modules/lojas/servicoLojas';
import { RepositorioVendasPostgres } from '@/modules/vendas/repositories/RepositorioVendasPostgres';
import { GestaoSenhaCliente } from '@/modules/clientes/gestaoSenhaCliente.service';
import { GestaoTelefoneCliente } from '@/modules/clientes/gestaoTelefoneCliente.service';
import { GestaoCartaoCliente } from '@/modules/clientes/gestaoCartaoCliente.service';
import { GestaoPerfilCliente } from '@/modules/clientes/gestaoPerfilCliente.service';

/**
 * Contêiner de Injeção de Dependências Manual.
 * Centraliza a criação de instâncias e resolve as cadeias de dependência.
 */
class ContainerDI {
  private static db = FabricaConexaoBanco.obterConexao();

  // Repositórios
  public static readonly repoUsuarios = new RepositorioUsuarios(ContainerDI.db);
  public static readonly repoRefreshTokens = new RepositorioRefreshTokenPostgres(ContainerDI.db);
  public static readonly repoVendas = new RepositorioVendasPostgres(ContainerDI.db);

  public static readonly repoEndereco = new RepositorioEnderecoUsuarioPostgres(ContainerDI.db);

  public static readonly repoPerfil = new RepositorioPerfilClientePostgres(ContainerDI.db);

  public static readonly repoTelefone = new RepositorioTelefoneUsuarioPostgres(ContainerDI.db);

  public static readonly repoCartoes = new RepositorioCartaoUsuario(ContainerDI.db);
  public static readonly repoLojas = new RepositorioLojasPostgres(ContainerDI.db);

  // Serviços
  public static readonly servicoLojas = new ServicoLojas(ContainerDI.repoLojas);

  // Serviços especializados de gestão de cliente
  public static readonly gestaoSenhaCliente = new GestaoSenhaCliente(ContainerDI.repoUsuarios);
  public static readonly gestaoTelefoneCliente = new GestaoTelefoneCliente(ContainerDI.repoTelefone);
  public static readonly gestaoCartaoCliente = new GestaoCartaoCliente(ContainerDI.repoCartoes);
  public static readonly gestaoPerfilCliente = new GestaoPerfilCliente(ContainerDI.repoPerfil);

  public static readonly gestaoIdentidadeCliente = new GestaoIdentidadeCliente(
    ContainerDI.repoUsuarios,
    ContainerDI.repoPerfil,
    ContainerDI.repoTelefone,
    ContainerDI.repoEndereco,
    ContainerDI.repoCartoes,
    ContainerDI.db,
    ContainerDI.servicoLojas,
  );

  public static readonly servicoConsultaClientes = new ServicoConsultaClientes(ContainerDI.repoUsuarios);

  public static readonly servicoCartoes = new ServicoCartoes(ContainerDI.repoCartoes);

  public static readonly servicoAdmin = new ServicoAdmin(ContainerDI.repoUsuarios, ContainerDI.repoVendas);

  public static readonly servicoAutenticacao = new ServicoAutenticacao(
    ContainerDI.repoUsuarios,
    ContainerDI.repoRefreshTokens
  );

  // Controllers (se houver injeção via construtor, instanciaríamos aqui)
}

export const di = ContainerDI;
