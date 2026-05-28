import bcrypt from 'bcryptjs';
import { IRepositorioUsuarios } from '@/modules/usuarios/IRepositorioUsuarios';
import { IRepositorioVendas } from '@/modules/vendas/repositories/IRepositorioVendas';
import { ICriarAdminDto, IListaAdminDto, IRespostaAdminCriadoDto } from '@/modules/admin/Iadmin.dto';
import { verificarForcaSenha } from '@/shared/utils/senha.util';
import { Logger } from '@/shared/utils/Logger.util';
import { PAPEL_ADMIN, PAPEL_CLIENTE } from '@/shared/types/papeis';

/**
 * Serviço responsável por tarefas de administração do sistema.
 */
export class ServicoAdmin {
  private readonly repositorioUsuarios: IRepositorioUsuarios;
  private readonly repositorioVendas: IRepositorioVendas;

  constructor(repositorioUsuarios: IRepositorioUsuarios, repositorioVendas: IRepositorioVendas) {
    this.repositorioUsuarios = repositorioUsuarios;
    this.repositorioVendas = repositorioVendas;
  }

  private static validarSenhaCadastroAdministrador(dados: ICriarAdminDto): void {
    if (dados.senha !== dados.confirmacaoSenha) {
      throw new Error('Senha e confirmação não conferem.');
    }
    if (!verificarForcaSenha(dados.senha)) {
      throw new Error(
        'Senha fraca. É necessário pelo menos 8 caracteres, incluindo maiúsculas, minúsculas e caractere especial.',
      );
    }
  }

  /**
   * Lista todos os administradores cadastrados.
   * Busca via tabela usuario_papeis para incluir usuários com múltiplos papéis.
   * Para admin_sistema, inclui contagem de trocas pendentes por loja.
   */
  public async listarAdministradores(): Promise<IListaAdminDto[]> {
    Logger.info('[listarAdministradores] Buscando administradores via usuario_papeis');
    const todos = await this.repositorioUsuarios.buscarUsuariosPorPapel(PAPEL_ADMIN.id);
    Logger.info('[listarAdministradores] Administradores encontrados', { quantidade: todos.length });
    
    // Contar vendas com status de troca pendente por loja
    const trocasPorLoja = await this.repositorioVendas.contarVendasPorStatusELoja(['EM TROCA', 'TROCA AUTORIZADA']);
    
    // Para cada administrador, buscar suas lojas e somar as trocas pendentes
    const administradoresComTrocas = await Promise.all(
      todos.map(async (u) => {
        const lojas = await this.repositorioUsuarios.buscarLojasDoUsuario(u.id);
        const totalTrocas = lojas.reduce((soma, lojId) => soma + (trocasPorLoja.get(lojId) || 0), 0);
        
        return {
          uuid: u.uuid,
          nome: u.nome,
          email: u.email,
          ativo: u.ativo,
          trocasPendentes: totalTrocas > 0 ? totalTrocas : undefined,
        };
      })
    );
    
    return administradoresComTrocas;
  }

  /**
   * Inativa um administrador.
   *
   * @param uuid UUID do administrador a ser inativado.
   */
  public async inativarAdministrador(uuid: string): Promise<void> {
    Logger.info('[inativarAdministrador] Iniciando inativação', { uuid });
    const admin = await this.repositorioUsuarios.buscarPorUuid(uuid);
    
    if (!admin) {
      Logger.warn('[inativarAdministrador] Administrador não encontrado', { uuid });
      throw new Error('Administrador não encontrado.');
    }
    
    const temPapelAdmin = admin.papeis.some(p => p.id === PAPEL_ADMIN.id);
    if (!temPapelAdmin) {
      Logger.warn('[inativarAdministrador] Usuário não tem papel admin', { uuid, papeis: admin.papeis.map(p => p.descricao) });
      throw new Error('Administrador não encontrado.');
    }

    if (!admin.ativo) {
      throw new Error('Administrador já está inativo.');
    }

    await this.repositorioUsuarios.atualizarUsuario(uuid, { ativo: false });
  }

  /**
   * Ativa um administrador.
   *
   * @param uuid UUID do administrador a ser ativado.
   */
  public async ativarAdministrador(uuid: string): Promise<void> {
    Logger.info('[ativarAdministrador] Iniciando ativação', { uuid });
    const admin = await this.repositorioUsuarios.buscarPorUuid(uuid);
    
    if (!admin) {
      Logger.warn('[ativarAdministrador] Administrador não encontrado', { uuid });
      throw new Error('Administrador não encontrado.');
    }
    
    const temPapelAdmin = admin.papeis.some(p => p.id === PAPEL_ADMIN.id);
    if (!temPapelAdmin) {
      Logger.warn('[ativarAdministrador] Usuário não tem papel admin', { uuid, papeis: admin.papeis.map(p => p.descricao) });
      throw new Error('Administrador não encontrado.');
    }

    if (admin.ativo) {
      throw new Error('Administrador já está ativo.');
    }

    await this.repositorioUsuarios.atualizarUsuario(uuid, { ativo: true });
  }

  /**
   * Atualiza dados cadastrais de um administrador (atualização parcial).
   * Permite atualizar nome, email e CPF (com validações).
   *
   * @param uuid UUID do administrador a ser atualizado.
   * @param dados Dados parciais para atualização.
   */
  public async atualizarAdministrador(uuid: string, dados: { nome?: string; email?: string; cpf?: string }): Promise<IListaAdminDto> {
    Logger.info('[atualizarAdministrador] Iniciando atualização', { uuid, dados });
    const admin = await this.repositorioUsuarios.buscarPorUuid(uuid);
    
    if (!admin) {
      Logger.warn('[atualizarAdministrador] Administrador não encontrado', { uuid });
      throw new Error('Administrador não encontrado.');
    }
    
    const temPapelAdmin = admin.papeis.some(p => p.id === PAPEL_ADMIN.id);
    if (!temPapelAdmin) {
      Logger.warn('[atualizarAdministrador] Usuário não tem papel admin', { uuid, papeis: admin.papeis.map(p => p.descricao) });
      throw new Error('Administrador não encontrado.');
    }

    const dadosAtualizar: { nome?: string; email?: string; cpf?: string } = {};

    // Validar e preparar nome
    if (dados.nome) {
      if (!dados.nome.trim()) {
        throw new Error('Nome não pode ser vazio.');
      }
      dadosAtualizar.nome = dados.nome.trim();
    }

    // Validar e preparar email
    if (dados.email) {
      const emailNormalizado = dados.email.trim().toLowerCase();
      if (!emailNormalizado.includes('@')) {
        throw new Error('Email inválido.');
      }
      
      // Verificar se email já está em uso por outro admin
      if (emailNormalizado !== admin.email) {
        const existente = await this.repositorioUsuarios.buscarPorEmailPapel(emailNormalizado, PAPEL_ADMIN.id);
        if (existente && existente.uuid !== uuid) {
          throw new Error('Já existe um administrador cadastrado com este e-mail.');
        }
      }
      dadosAtualizar.email = emailNormalizado;
    }

    // Validar e preparar CPF
    if (dados.cpf) {
      const cpfNormalizado = dados.cpf.trim();
      if (!cpfNormalizado) {
        throw new Error('CPF não pode ser vazio.');
      }
      
      // Verificar se CPF já está em uso por outro admin
      if (cpfNormalizado !== admin.cpf) {
        const existente = await this.repositorioUsuarios.buscarPorCpfPapel(cpfNormalizado, PAPEL_ADMIN.id);
        if (existente && existente.uuid !== uuid) {
          throw new Error('Já existe um administrador cadastrado com este CPF.');
        }
      }
      dadosAtualizar.cpf = cpfNormalizado;
    }

    if (Object.keys(dadosAtualizar).length === 0) {
      throw new Error('Nenhum dado válido fornecido para atualização.');
    }

    await this.repositorioUsuarios.atualizarUsuario(uuid, dadosAtualizar);

    const adminAtualizado = await this.repositorioUsuarios.buscarPorUuid(uuid);
    if (!adminAtualizado) {
      throw new Error('Erro ao carregar administrador atualizado.');
    }

    return {
      uuid: adminAtualizado.uuid,
      nome: adminAtualizado.nome,
      email: adminAtualizado.email,
      ativo: adminAtualizado.ativo,
    };
  }

  /**
   * Registra um novo administrador. Requer validação de permissões prévia.
   * Suporta CPF (PF) ou CNPJ (PJ) baseado no tipo de pessoa.
   *
   * @param dados Dados para criação do administrador.
   */
  public async registrarNovoAdministrador(dados: ICriarAdminDto): Promise<IRespostaAdminCriadoDto> {
    
    Logger.info('[registrarNovoAdministrador] Iniciando registro', { 
      email: dados.email, 
      tipoPessoa: dados.tipoPessoa 
    });

    ServicoAdmin.validarSenhaCadastroAdministrador(dados);

    const tipoPessoa = dados.tipoPessoa || 'PF';
    const documentoCampo = tipoPessoa === 'PF' ? 'cpf' : 'cnpj';

    // Validar duplicidade por email
    const existenteAdminPorEmail = await this.repositorioUsuarios.buscarPorEmailPapel(
      dados.email,
      PAPEL_ADMIN.id,
    );
    if (existenteAdminPorEmail) {
      Logger.warn('[registrarNovoAdministrador] Email já cadastrado como admin', { email: dados.email });
      throw new Error('Já existe um administrador cadastrado com este e-mail.');
    }

    // Validar duplicidade por documento (CPF ou CNPJ)
    if (dados[documentoCampo]) {
      const existenteAdminPorDocumento = await this.repositorioUsuarios.buscarPorCpfPapel(
        dados[documentoCampo],
        PAPEL_ADMIN.id,
      );
      if (existenteAdminPorDocumento) {
        Logger.warn('[registrarNovoAdministrador] Documento já cadastrado como admin', { 
          tipoPessoa, 
          documento: dados[documentoCampo] 
        });
        throw new Error(`Já existe um administrador cadastrado com este ${documentoCampo.toUpperCase()}.`);
      }
    }

    // Se o usuário existe como cliente, ele será "promovido" (novo registro de admin)
    const existenteClientePorEmail = await this.repositorioUsuarios.buscarPorEmailPapel(
      dados.email,
      PAPEL_CLIENTE.id,
    );

    let senhaHash = await bcrypt.hash(dados.senha, 10);
    if (existenteClientePorEmail && dados.usarMesmaSenha) {
      senhaHash = existenteClientePorEmail.senhaHash;
    }

    if (existenteClientePorEmail) {
      Logger.info('[registrarNovoAdministrador] Associando papel admin ao cliente existente', { email: dados.email });
      
      // Atualizar senha se necessário
      if (!dados.usarMesmaSenha) {
        await this.repositorioUsuarios.atualizarUsuario(existenteClientePorEmail.uuid, {
          senhaHash,
        });
      }
      
      // Atualizar o role principal para admin
      await this.repositorioUsuarios.atualizarUsuario(existenteClientePorEmail.uuid, {
        idPapel: PAPEL_ADMIN.id,
      });
      
      // Associar papel admin ao usuário existente (sistema de múltiplos papéis)
      await this.repositorioUsuarios.associarPapelUsuario(existenteClientePorEmail.id, PAPEL_ADMIN.id);
      
      const usuario = await this.repositorioUsuarios.buscarPorUuid(existenteClientePorEmail.uuid);
      if (!usuario) throw new Error('Erro ao carregar usuário após associação de papel.');
      
      Logger.info('[registrarNovoAdministrador] Papel admin associado ao cliente com sucesso', { 
        uuid: usuario.uuid, 
        email: usuario.email,
        papeis: usuario.papeis.map(p => p.descricao),
        rolePrincipal: usuario.role.descricao
      });
      
      return {
        uuid: usuario.uuid,
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf,
        cnpj: usuario.cnpj,
        role: usuario.role.descricao,
      };
    }

    const usuario = await this.repositorioUsuarios.criarUsuario({
      nome: dados.nome,
      email: dados.email,
      cpf: dados.cpf,
      cnpj: dados.cnpj,
      tipoPessoa: dados.tipoPessoa || 'PF',
      senhaHash,
      role: PAPEL_ADMIN,
      papeis: [PAPEL_CLIENTE, PAPEL_ADMIN],
    });

    return {
      uuid: usuario.uuid,
      nome: usuario.nome,
      email: usuario.email,
      cpf: usuario.cpf,
      cnpj: usuario.cnpj,
      role: usuario.role.descricao,
    };
  }
}
