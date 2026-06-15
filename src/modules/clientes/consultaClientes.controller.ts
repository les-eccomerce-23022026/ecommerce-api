import { Request, Response } from 'express';
import { di } from '../../shared/infrastructure/di.container';
import { RespostaPadrao } from '../../shared/errors/Iresposta-padrao';

const { servicoConsultaClientes } = di;

/**
 * Controller responsável pela consulta administrativa de clientes.
 */
export class ControladorConsultaClientes {
  /**
   * Obtém detalhes completos de um cliente por UUID (RF0024).
   */
  public static async obterClientePorUuid(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const { uuid } = requisicao.params;

      const cliente = await servicoConsultaClientes.obterClientePorUuid(uuid);

      if (!cliente) {
        return RespostaPadrao.enviarErro(resposta, 404, 'Cliente não encontrado.');
      }

      return RespostaPadrao.enviarSucesso(resposta, 200, cliente);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao obter cliente.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Lista clientes com filtros opcionais (RF0024).
   * Suporta query param `ativo` para filtrar por status (true/false).
   */
  public static async consultarClientes(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const { nome, cpf, email, ativo, pagina = 1, limite = 10 } = requisicao.query;

      let ativoBool: boolean | undefined;
      if (ativo === 'true') ativoBool = true;
      else if (ativo === 'false') ativoBool = false;

      const filtros = {
        nome: nome as string | undefined,
        cpf: cpf as string | undefined,
        email: email as string | undefined,
        ativo: ativoBool,
        pagina: parseInt(pagina as string, 10) || 1,
        limite: Math.min(parseInt(limite as string, 10) || 10, 100),
      };

      const resultado = await servicoConsultaClientes.consultarClientes(filtros);

      return RespostaPadrao.enviarSucesso(resposta, 200, resultado);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao consultar clientes.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Inativa ou reativa um cliente por UUID (admin).
   */
  public static async inativarCliente(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const { uuid } = requisicao.params;
      const { ativo } = requisicao.body;

      if (ativo === undefined) return RespostaPadrao.enviarErro(resposta, 400, 'O campo "ativo" é obrigatório.');
      if (typeof ativo !== 'boolean') return RespostaPadrao.enviarErro(resposta, 400, 'O campo "ativo" deve ser um booleano.');

      const resultado = await servicoConsultaClientes.inativarCliente(uuid, ativo);

      return RespostaPadrao.enviarSucesso(resposta, 200, { sucesso: true, dados: resultado });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao inativar cliente.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }
}
