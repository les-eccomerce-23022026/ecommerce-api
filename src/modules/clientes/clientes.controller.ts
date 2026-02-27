import { Request, Response } from 'express';
import { ServicoClientes } from '@/modules/clientes/clientes.service';
import { RespostaPadrao } from '@/shared/errors/resposta-padrao';

const servicoClientes = new ServicoClientes();

/**
 * Controller responsável pelo cadastro público de clientes.
 */
export class ControladorClientes {
  /**
   * Realiza o registro de um novo cliente na rota pública.
   *
   * @param requisicao Objeto da requisição HTTP.
   * @param resposta Objeto da resposta HTTP.
   */
  public static async registrarCliente(requisicao: Request, resposta: Response): Promise<Response> {
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

      const clienteCriado = await servicoClientes.registrarCliente(dados);

      return RespostaPadrao.enviarSucesso(resposta, 201, clienteCriado);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao registrar cliente.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }
}

