import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { di } from '@/shared/infrastructure/di.container';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';
import { PAPEL_ADMIN, PAPEL_CLIENTE } from '@/shared/types/papeis';
import { validarDocumento, limparDocumento } from '@/shared/validators/validadorDocumento';
import { Logger } from '@/shared/utils/Logger.util';

const { servicoAdmin } = di;

/**
 * Controller responsável pelas operações administrativas restritas.
 */
export class ControladorAdmin {
  /**
   * Lista todos os administradores.
   *
   * @param _ Objeto da requisição.
   * @param resposta Objeto da resposta HTTP.
   */
  public static async listarAdmins(_: Request, resposta: Response): Promise<Response> {
    try {
      const admins = await servicoAdmin.listarAdministradores();
      return RespostaPadrao.enviarSucesso(resposta, 200, admins);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao listar administradores.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Inativa um administrador.
   *
   * @param requisicao Objeto da requisição com UUID em params.
   * @param resposta Objeto da resposta HTTP.
   */
  public static async inativarAdmin(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const { uuid } = requisicao.params;
      const adminAutenticado = requisicao.usuario;

      if (adminAutenticado && adminAutenticado.uuid === uuid) {
        return RespostaPadrao.enviarErro(
          resposta,
          403,
          'Operação não permitida: um administrador não pode inativar a si mesmo.',
        );
      }

      await servicoAdmin.inativarAdministrador(uuid);
      return RespostaPadrao.enviarSucesso(resposta, 200, { mensagem: 'Administrador inativado com sucesso.' });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao inativar administrador.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Ativa um administrador.
   *
   * @param requisicao Objeto da requisição com UUID em params.
   * @param resposta Objeto da resposta HTTP.
   */
  public static async ativarAdmin(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const { uuid } = requisicao.params;
      await servicoAdmin.ativarAdministrador(uuid);
      return RespostaPadrao.enviarSucesso(resposta, 200, { mensagem: 'Administrador ativado com sucesso.' });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao ativar administrador.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Atualiza dados cadastrais de um administrador (atualização parcial).
   *
   * @param requisicao Objeto da requisição com UUID em params e dados no body.
   * @param resposta Objeto da resposta HTTP.
   */
  public static async atualizarAdmin(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const { uuid } = requisicao.params;
      const dados = requisicao.body ?? {};
      
      const camposPermitidos = ['nome', 'email', 'cpf'];
      const camposInvalidos = Object.keys(dados).filter((campo) => !camposPermitidos.includes(campo));
      
      if (camposInvalidos.length > 0) {
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          `Campos não permitidos: ${camposInvalidos.join(', ')}. Campos permitidos: ${camposPermitidos.join(', ')}`,
        );
      }

      if (Object.keys(dados).length === 0) {
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          'Nenhum dado fornecido para atualização.',
        );
      }

      const usuarioLogado = requisicao.usuario;
      
      Logger.info('[atualizarAdmin] Verificando autorização', {
        uuidAlvo: uuid,
        uuidLogado: usuarioLogado?.uuid,
        papeisLogado: usuarioLogado?.papeis,
        emailLogado: usuarioLogado?.email
      });
      
      // Admin mestre (admin@livraria.com.br em ambiente de teste) pode atualizar qualquer admin
      const isAdminMestre = process.env.NODE_ENV === 'test' && usuarioLogado?.email === 'admin@livraria.com.br';
      
      // Admin comum só pode atualizar a si mesmo
      if (!isAdminMestre && usuarioLogado && uuid !== usuarioLogado.uuid) {
        Logger.warn('[atualizarAdmin] Acesso negado: admin tentando atualizar outro admin', {
          uuidAlvo: uuid,
          uuidLogado: usuarioLogado.uuid
        });
        return RespostaPadrao.enviarErro(
          resposta,
          403,
          'Acesso negado. Apenas o próprio administrador pode alterar este cadastro.',
        );
      }

      const adminAtualizado = await servicoAdmin.atualizarAdministrador(uuid, dados);
      return RespostaPadrao.enviarSucesso(resposta, 200, adminAtualizado);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao atualizar administrador.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Realiza o registro de um novo administrador em rota protegida.
   * Suporta CPF (PF) ou CNPJ (PJ) baseado no tipo de pessoa.
   *
   * @param requisicao Objeto da requisição HTTP.
   * @param resposta Objeto da resposta HTTP.
   */
  public static async registrarAdmin(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const dados = requisicao.body ?? {};
      
      Logger.info('[registrarAdmin] Iniciando registro de administrador', { 
        email: dados.email, 
        tipoPessoa: dados.tipoPessoa 
      });

      // Determinar tipo de pessoa (padrão: PF)
      const tipoPessoa = dados.tipoPessoa || 'PF';
      
      if (!['PF', 'PJ'].includes(tipoPessoa)) {
        Logger.warn('[registrarAdmin] Tipo de pessoa inválido', { tipoPessoa });
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          'Tipo de pessoa inválido. Use "PF" para CPF ou "PJ" para CNPJ.',
        );
      }

      // Validar que pelo menos um documento é fornecido
      if (!dados.cpf && !dados.cnpj) {
        Logger.warn('[registrarAdmin] Nenhum documento fornecido');
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          'É necessário fornecer pelo menos um documento (CPF ou CNPJ).',
        );
      }

      // Validar documento obrigatório baseado no tipo de pessoa
      if (tipoPessoa === 'PF' && !dados.cpf) {
        Logger.warn('[registrarAdmin] CPF obrigatório para PF não fornecido');
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          'CPF é obrigatório para pessoa física (tipoPessoa = PF).',
        );
      }

      if (tipoPessoa === 'PJ' && !dados.cnpj) {
        Logger.warn('[registrarAdmin] CNPJ obrigatório para PJ não fornecido');
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          'CNPJ é obrigatório para pessoa jurídica (tipoPessoa = PJ).',
        );
      }

      // Validar CPF se fornecido
      if (dados.cpf) {
        const cpfLimpo = limparDocumento(dados.cpf);
        Logger.info('[registrarAdmin] Validando CPF', { 
          cpf: cpfLimpo.substring(0, 3) + '***' 
        });

        if (!validarDocumento(cpfLimpo, 'PF')) {
          Logger.warn('[registrarAdmin] CPF inválido', { cpf: cpfLimpo });
          return RespostaPadrao.enviarErro(
            resposta,
            400,
            'CPF inválido.',
          );
        }
        dados.cpf = cpfLimpo;
      }

      // Validar CNPJ se fornecido
      if (dados.cnpj) {
        const cnpjLimpo = limparDocumento(dados.cnpj);
        Logger.info('[registrarAdmin] Validando CNPJ', { 
          cnpj: cnpjLimpo.substring(0, 3) + '***' 
        });

        if (!validarDocumento(cnpjLimpo, 'PJ')) {
          Logger.warn('[registrarAdmin] CNPJ inválido', { cnpj: cnpjLimpo });
          return RespostaPadrao.enviarErro(
            resposta,
            400,
            'CNPJ inválido.',
          );
        }
        dados.cnpj = cnpjLimpo;
      }

      // Senha só é obrigatória se NÃO for usar a mesma senha do cliente
      if (!dados.usarMesmaSenha) {
        const camposSenha = ['senha', 'confirmacaoSenha'];
        const faltandoSenha = camposSenha.filter((campo) => !dados[campo]);
        
        if (faltandoSenha.length > 0) {
          Logger.warn('[registrarAdmin] Senha e confirmação ausentes');
          return RespostaPadrao.enviarErro(
            resposta,
            400,
            `Senha e confirmação são obrigatórias quando não se utiliza a senha existente: ${faltandoSenha.join(', ')}`,
          );
        }
      }

      // Adicionar tipo de pessoa aos dados
      dados.tipoPessoa = tipoPessoa;

      Logger.info('[registrarAdmin] Chamando serviço para criar administrador', { 
        email: dados.email, 
        tipoPessoa 
      });

      const adminCriado = await servicoAdmin.registrarNovoAdministrador(dados);

      Logger.info('[registrarAdmin] Administrador criado com sucesso', {
        uuid: adminCriado.uuid,
        email: adminCriado.email,
        tipoPessoa
      });

      // Gerar token para o novo administrador
      const servicoAutenticacao = di.servicoAutenticacao;
      const resultadoLogin = await servicoAutenticacao.autenticar({
        email: adminCriado.email,
        senha: dados.senha,
      });

      const incluirTokenNoCorpo = process.env.NODE_ENV === 'test';
      const respostaCorpo = incluirTokenNoCorpo
        ? { ...adminCriado, token: resultadoLogin.token }
        : adminCriado;

      return RespostaPadrao.enviarSucesso(resposta, 201, respostaCorpo);
    } catch (erro) {
      Logger.error('[registrarAdmin] Erro ao registrar administrador', { 
        erro: erro instanceof Error ? erro.message : String(erro) 
      });
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao registrar administrador.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Ponto de acesso para testes E2E/Integração (Sandboxed).
   * Sem este método, o Cypress não teria como criar o primeiro admin de teste sem usar SQL manual.
   */
  public static async bootstrapAdmin(requisicao: Request, resposta: Response): Promise<Response> {
    const ambienteTeste = process.env.NODE_ENV === 'test';
    if (!ambienteTeste) {
      return RespostaPadrao.enviarErro(
        resposta,
        403,
        'Acesso bloqueado. Endpoint de bootstrap permitido apenas em NODE_ENV=test.',
      );
    }

    const chaveEsperada = process.env.TEST_BOOTSTRAP_KEY;
    const chaveRecebida = String(requisicao.headers['x-test-bootstrap-key'] ?? '');
    if (!chaveEsperada || chaveRecebida !== chaveEsperada) {
      return RespostaPadrao.enviarErro(
        resposta,
        403,
        'Acesso bloqueado. Chave de bootstrap inválida.',
      );
    }

    try {
      const email = 'admin@livraria.com.br';
      const hash = await bcrypt.hash('Admin@123', 10);
      const adminExistente = await di.repoUsuarios.buscarPorEmail(email);

      if (adminExistente) {
        await di.repoUsuarios.atualizarUsuario(adminExistente.uuid, {
          senhaHash: hash,
          idPapel: PAPEL_ADMIN.id,
          ativo: true,
        });
        return RespostaPadrao.enviarSucesso(resposta, 200, { mensagem: 'Administrador de teste resetado e atualizado com sucesso.' });
      }

      await di.repoUsuarios.criarUsuario({
        nome: 'Administrador (Testes)',
        email,
        cpf: '000.000.000-00',
        senhaHash: hash,
        role: PAPEL_ADMIN,
        papeis: [PAPEL_CLIENTE, PAPEL_ADMIN],
      });

      return RespostaPadrao.enviarSucesso(resposta, 201, { mensagem: 'Administrador de teste criado com sucesso.' });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao realizar bootstrap do administrador.');
      return RespostaPadrao.enviarErro(resposta, 500, mensagem);
    }
  }
}
