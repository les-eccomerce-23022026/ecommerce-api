import { Request, Response } from 'express';
import { di } from '@/shared/infrastructure/di.container';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';

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
      const adminAutenticado = (requisicao as any).usuario;

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

      const camposObrigatorios = ['nome', 'cpf', 'email', 'senha', 'confirmacaoSenha'];
      const faltando = camposObrigatorios.filter((campo) => !dados[campo]);

      if (faltando.length > 0) {
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          `Campos obrigatórios ausentes: ${faltando.join(', ')}`,
        );
      }

      const adminCriado = await servicoAdmin.registrarNovoAdministrador(dados);

      return RespostaPadrao.enviarSucesso(resposta, 201, adminCriado);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao registrar administrador.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }
}
