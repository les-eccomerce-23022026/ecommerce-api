import { Request, Response } from 'express';
import { di } from '@/shared/infrastructure/di.container';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';
import { obterErroValidacaoCadastroPublico } from '@/modules/clientes/clientes-cadastro-publico-validacao.util';

const { gestaoIdentidadeCliente } = di;

/**
 * Controller responsável pelo cadastro público de clientes.
 */
export class ControladorClientes {
  /**
   * Obtém o perfil do cliente logado.
   *
   * @param requisicao Objeto da requisição HTTP.
   * @param resposta Objeto da resposta HTTP.
   */
  public static async obterPerfil(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const uuid = requisicao.usuario?.uuid;

      if (!uuid) {
        return RespostaPadrao.enviarErro(resposta, 401, 'Usuário não autenticado.');
      }

      const perfil = await gestaoIdentidadeCliente.obterPerfil(uuid);

      return RespostaPadrao.enviarSucesso(resposta, 200, perfil);
    } catch (erro) {

      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao obter perfil do cliente.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Realiza o registro de um novo cliente na rota pública.
   *
   * @param requisicao Objeto da requisição HTTP.
   * @param resposta Objeto da resposta HTTP.
   */
  public static async realizarCadastroPublico(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const dados = requisicao.body ?? {};
      const erroValidacao = obterErroValidacaoCadastroPublico(dados);
      if (erroValidacao) {
        return RespostaPadrao.enviarErro(resposta, 400, erroValidacao);
      }

      const clienteCriado = await gestaoIdentidadeCliente.realizarCadastroPublico(dados);

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
      const uuid = requisicao.params.uuid || requisicao.usuario?.uuid;
      const dados = requisicao.body ?? {};

      if (!uuid) {
        return RespostaPadrao.enviarErro(resposta, 401, 'Identificador de usuário não encontrado.');
      }

      const clienteAtualizado = await gestaoIdentidadeCliente.atualizarCliente(uuid, dados);

      return RespostaPadrao.enviarSucesso(resposta, 200, clienteAtualizado);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao atualizar dados do cliente.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Adiciona um novo endereço ao perfil do cliente.
   */
  public static async adicionarEndereco(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const uuid = requisicao.usuario?.uuid;
      const dados = requisicao.body;

      if (!uuid) {
        return RespostaPadrao.enviarErro(resposta, 401, 'Usuário não autenticado.');
      }

      const novoEndereco = await gestaoIdentidadeCliente.adicionarEndereco(uuid, dados);
      return RespostaPadrao.enviarSucesso(resposta, 201, novoEndereco);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao adicionar endereço.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Remove um endereço do perfil do cliente.
   */
  public static async removerEndereco(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const uuid = requisicao.usuario?.uuid;
      const { uuidEndereco } = requisicao.params;

      if (!uuid || !uuidEndereco) {
        return RespostaPadrao.enviarErro(resposta, 401, 'Parâmetros insuficientes.');
      }

      await gestaoIdentidadeCliente.removerEndereco(uuid, uuidEndereco);
      return RespostaPadrao.enviarSucesso(resposta, 200, { mensagem: 'Endereço removido com sucesso.' });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao remover endereço.');
      const status = mensagem === 'Endereço não encontrado.' ? 404 : 400;
      return RespostaPadrao.enviarErro(resposta, status, mensagem);
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
      const uuid = requisicao.usuario?.uuid;
      const { senhaAtual, novaSenha, confirmacaoNovaSenha } = requisicao.body;

      if (!uuid) {
        return RespostaPadrao.enviarErro(resposta, 401, 'Usuário não autenticado.');
      }

      await gestaoIdentidadeCliente.alterarSenha(uuid, {
        senhaAtual,
        novaSenha,
        confirmacaoNovaSenha,
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
  public static async suspenderAcessoCliente(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const uuid = requisicao.params.uuid || requisicao.usuario?.uuid;

      if (!uuid) {
        return RespostaPadrao.enviarErro(resposta, 401, 'Usuário não autenticado.');
      }

      await gestaoIdentidadeCliente.suspenderAcessoCliente(uuid);

      return RespostaPadrao.enviarSucesso(resposta, 200, {
        mensagem: 'Cadastro inativado com sucesso.',
      });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao inativar cadastro.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Edita um endereço existente de um cliente.
   */
  public static async editarEndereco(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const uuidUsuario = requisicao.usuario?.uuid;
      const { uuidEndereco } = requisicao.params;
      const dados = requisicao.body;

      if (!uuidUsuario || !uuidEndereco) {
        return RespostaPadrao.enviarErro(resposta, 401, 'Parâmetros insuficientes.');
      }

      const enderecosAtualizados = await gestaoIdentidadeCliente.editarEndereco(uuidUsuario, uuidEndereco, dados);
      return RespostaPadrao.enviarSucesso(resposta, 200, enderecosAtualizados);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao editar endereço.');
      const status = mensagem === 'Endereço não encontrado.' ? 404 : 400;
      return RespostaPadrao.enviarErro(resposta, status, mensagem);
    }
  }
}

