import { Request, Response } from 'express';
import { di } from '../../shared/infrastructure/di.container';
import { RespostaPadrao } from '../../shared/errors/Iresposta-padrao';

const { servicoConsultaClientes } = di;

/**
 * Controller responsável pela consulta administrativa de clientes.
 */
export class ControladorConsultaClientes {
  /**
   * Lista clientes com filtros opcionais (RF0024).
   */
  public static async consultarClientes(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const { nome, cpf, email, pagina = 1, limite = 10 } = requisicao.query;

      const filtros = {
        nome: nome as string,
        cpf: cpf as string,
        email: email as string,
        pagina: parseInt(pagina as string, 10) || 1,
        limite: Math.min(parseInt(limite as string, 10) || 10, 100) // Máximo 100 por página
      };

      const resultado = await servicoConsultaClientes.consultarClientes(filtros);

      return RespostaPadrao.enviarSucesso(resposta, 200, resultado);
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao consultar clientes.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }
}