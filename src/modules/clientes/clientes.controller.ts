import { Request, Response } from 'express';
import { ServicoClientes } from '@/modules/clientes/clientes.service';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';

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

  /**
   * Atualiza os dados de um cliente existente.
   *
   * @param requisicao Objeto da requisição HTTP (parâmetro uuid e corpo JSON).
   * @param resposta Objeto da resposta HTTP.
   */
  public static async atualizarCliente(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      // Obter o UUID do cliente. Pode vir dos parâmetros ou do objeto 'usuario' (token)
      const uuid = requisicao.params.uuid || (requisicao as any).usuario?.uuid;
      const dados = requisicao.body ?? {};

      if (!uuid) {
        return RespostaPadrao.enviarErro(resposta, 401, 'Identificador de usuário não encontrado.');
      }

      const clienteAtualizado = await servicoClientes.atualizarCliente(uuid, dados);

      return RespostaPadrao.enviarSucesso(resposta, 200, clienteAtualizado);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao atualizar dados do cliente.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Realiza a alteração de senha de um cliente.
   *
   * @param requisicao Objeto da requisição contendo senhas.
   * @param resposta Resposta HTTP.
   */
  public static async alterarSenha(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const uuid = (requisicao as any).usuario?.uuid;
      const { senha_atual, nova_senha, confirmacao_senha } = requisicao.body;

      if (!uuid) {
        return RespostaPadrao.enviarErro(resposta, 401, 'Usuário não autenticado.');
      }

      await servicoClientes.alterarSenha(uuid, {
        senha_atual,
        nova_senha,
        confirmacao_senha,
      });

      return RespostaPadrao.enviarSucesso(resposta, 200, {
        mensagem: 'Senha alterada com sucesso.',
      });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao alterar senha.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Realiza a inativação de um cliente (soft delete).
   *
   * @param requisicao Objeto da requisição.
   * @param resposta Resposta HTTP.
   */
  public static async inativarCliente(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const uuid = requisicao.params.uuid || (requisicao as any).usuario?.uuid;

      if (!uuid) {
        return RespostaPadrao.enviarErro(resposta, 401, 'Usuário não autenticado.');
      }

      await servicoClientes.inativarCliente(uuid);

      return RespostaPadrao.enviarSucesso(resposta, 200, {
        mensagem: 'Cadastro inativado com sucesso.',
      });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao inativar cadastro.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }
}

