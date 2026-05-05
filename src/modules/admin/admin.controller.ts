import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { di } from '@/shared/infrastructure/di.container';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';
import { PAPEL_ADMIN } from '@/shared/types/papeis';

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
   * Realiza o registro de um novo administrador em rota protegida.
   *
   * @param requisicao Objeto da requisição HTTP.
   * @param resposta Objeto da resposta HTTP.
   */
  public static async registrarAdmin(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const dados = requisicao.body ?? {};

      const camposBaseObrigatorios = ['nome', 'cpf', 'email'];
      const faltandoBase = camposBaseObrigatorios.filter((campo) => !dados[campo]);

      if (faltandoBase.length > 0) {
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          `Campos obrigatórios ausentes: ${faltandoBase.join(', ')}`,
        );
      }

      // Senha só é obrigatória se NÃO for usar a mesma senha do cliente
      if (!dados.usarMesmaSenha) {
        const camposSenha = ['senha', 'confirmacaoSenha'];
        const faltandoSenha = camposSenha.filter((campo) => !dados[campo]);
        
        if (faltandoSenha.length > 0) {
          return RespostaPadrao.enviarErro(
            resposta,
            400,
            `Senha e confirmação são obrigatórias quando não se utiliza a senha existente: ${faltandoSenha.join(', ')}`,
          );
        }
      }

      const adminCriado = await servicoAdmin.registrarNovoAdministrador(dados);

      return RespostaPadrao.enviarSucesso(resposta, 201, adminCriado);
    } catch (erro) {
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
          isAdminMestre: true,
        });
        return RespostaPadrao.enviarSucesso(resposta, 200, { mensagem: 'Administrador de teste resetado e atualizado com sucesso.' });
      }

      await di.repoUsuarios.criarUsuario({
        nome: 'Administrador Mestre (Testes)',
        email,
        cpf: '000.000.000-00',
        senhaHash: hash,
        role: PAPEL_ADMIN,
        isAdminMestre: true,
      });

      return RespostaPadrao.enviarSucesso(resposta, 201, { mensagem: 'Administrador de teste criado com sucesso.' });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao realizar bootstrap do administrador.');
      return RespostaPadrao.enviarErro(resposta, 500, mensagem);
    }
  }
}
