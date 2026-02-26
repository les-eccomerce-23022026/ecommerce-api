import { Request, Response } from 'express';
import { ServicoClientes } from '@/modules/clientes/clientes.service';

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
        return resposta.status(400).json({
          mensagem: `Campos obrigatórios ausentes: ${faltando.join(', ')}`,
        });
      }

      const clienteCriado = await servicoClientes.registrarCliente(dados);

      return resposta.status(201).json(clienteCriado);
    } catch (erro) {
      return resposta.status(400).json({
        mensagem: erro instanceof Error ? erro.message : 'Erro ao registrar cliente.',
      });
    }
  }
}

