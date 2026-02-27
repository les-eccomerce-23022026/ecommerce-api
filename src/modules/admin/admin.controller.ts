import { Request, Response } from 'express';
import { ServicoAdmin } from '@/modules/admin/admin.service';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';

const servicoAdmin = new ServicoAdmin();

/**
 * Controller responsável pelas operações administrativas restritas.
 */
export class ControladorAdmin {
  /**
   * Realiza o registro de um novo administrador em rota protegida.
   *
   * @param requisicao Objeto da requisição HTTP.
   * @param resposta Objeto da resposta HTTP.
   */
  public static async registrarAdmin(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const dados = requisicao.body ?? {};

      const camposObrigatorios = ['nome', 'cpf', 'email', 'senha', 'confirmacao_senha'];
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
