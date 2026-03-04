import { Request, Response } from 'express';
import { di } from '../../shared/infrastructure/di.container';
import { RespostaPadrao } from '../../shared/errors/Iresposta-padrao';
import { ICriarCartaoDto, IAtualizarCartaoDto } from './cartoes.service';

const { servicoCartoes } = di;

/**
 * Controller responsável pelo gerenciamento de cartões de crédito.
 */
export class ControladorCartoes {
  /**
   * Lista todos os cartões do usuário autenticado.
   */
  public static async listarCartoesUsuario(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const idUsuario = requisicao.usuario?.id;
      if (!idUsuario) {
        return RespostaPadrao.enviarErro(resposta, 401, 'Usuário não autenticado.');
      }

      const cartoes = await servicoCartoes.listarCartoesUsuario(idUsuario);

      // Formatar resposta para o frontend (sem dados sensíveis)
      const cartoesFormatados = cartoes.map(cartao => ({
        uuid: cartao.uuid,
        final: cartao.finalCartao,
        nomeImpresso: cartao.nomeImpresso,
        bandeira: 'Visa', // TODO: buscar descrição da bandeira
        validade: cartao.validade.toISOString().substring(0, 7), // YYYY-MM
        principal: cartao.principal
      }));

      return RespostaPadrao.enviarSucesso(resposta, 200, cartoesFormatados);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao listar cartões.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Cadastra um novo cartão para o usuário autenticado.
   */
  public static async cadastrarCartao(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const idUsuario = requisicao.usuario?.id;
      if (!idUsuario) {
        return RespostaPadrao.enviarErro(resposta, 401, 'Usuário não autenticado.');
      }

      const dados: ICriarCartaoDto = requisicao.body;

      // Validações básicas
      const { idBandeiraCartao, tokenCartao, finalCartao, nomeImpresso, validade } = dados;
      if (!idBandeiraCartao || !tokenCartao || !finalCartao || !nomeImpresso || !validade) {
        const faltando = [];
        if (!idBandeiraCartao) faltando.push('idBandeiraCartao');
        if (!tokenCartao) faltando.push('tokenCartao');
        if (!finalCartao) faltando.push('finalCartao');
        if (!nomeImpresso) faltando.push('nomeImpresso');
        if (!validade) faltando.push('validade');
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          `Campos obrigatórios ausentes: ${faltando.join(', ')}`
        );
      }

      const cartao = await servicoCartoes.cadastrarCartao(idUsuario, dados);

      const cartaoFormatado = {
        uuid: cartao.uuid,
        final: cartao.finalCartao,
        nomeImpresso: cartao.nomeImpresso,
        bandeira: 'Visa', // TODO: buscar descrição da bandeira
        validade: cartao.validade.toISOString().substring(0, 7),
        principal: cartao.principal
      };

      return RespostaPadrao.enviarSucesso(resposta, 201, cartaoFormatado);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao cadastrar cartão.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Atualiza um cartão existente.
   */
  public static async atualizarCartao(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const { uuid } = requisicao.params;
      const dados: IAtualizarCartaoDto = requisicao.body;

      const cartao = await servicoCartoes.atualizarCartao(uuid, dados);
      if (!cartao) {
        return RespostaPadrao.enviarErro(resposta, 404, 'Cartão não encontrado.');
      }

      const cartaoFormatado = {
        uuid: cartao.uuid,
        final: cartao.finalCartao,
        nomeImpresso: cartao.nomeImpresso,
        bandeira: 'Visa', // TODO: buscar descrição da bandeira
        validade: cartao.validade.toISOString().substring(0, 7),
        principal: cartao.principal
      };

      return RespostaPadrao.enviarSucesso(resposta, 200, cartaoFormatado);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao atualizar cartão.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Remove um cartão.
   */
  public static async removerCartao(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const { uuid } = requisicao.params;

      await servicoCartoes.removerCartao(uuid);

      return RespostaPadrao.enviarSucesso(resposta, 200, { mensagem: 'Cartão removido com sucesso.' });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao remover cartão.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Define um cartão como principal.
   */
  public static async definirCartaoPrincipal(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const { uuid } = requisicao.params;
      const idUsuario = requisicao.usuario?.id;

      if (!idUsuario) {
        return RespostaPadrao.enviarErro(resposta, 401, 'Usuário não autenticado.');
      }

      await servicoCartoes.definirCartaoPrincipal(uuid, idUsuario);

      return RespostaPadrao.enviarSucesso(resposta, 200, { mensagem: 'Cartão definido como principal.' });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao definir cartão principal.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }
}