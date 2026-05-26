import { Request, Response } from 'express';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Controller exclusivo para testes de integração.
 * Todas as operações são protegidas por NODE_ENV=test.
 */
export class ControladorTestesAdmin {
  /**
   * Cria um cupom (troca ou promocional) para testes.
   * Suporta tanto cupons de troca quanto promocionais usando a tabela unificada.
   */
  public static async criarCupomTroca(requisicao: Request, resposta: Response): Promise<Response> {
    const ambienteTeste = process.env.NODE_ENV === 'test';
    if (!ambienteTeste) {
      return RespostaPadrao.enviarErro(
        resposta,
        403,
        'Acesso bloqueado. Endpoint permitido apenas em NODE_ENV=test.',
      );
    }

    try {
      const { clienteId, codigo, valor, tipo = 'troca', valorMinimo = 0 } = requisicao.body;

      if (!codigo || valor === undefined) {
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          'Campos obrigatórios: codigo, valor',
        );
      }

      if (tipo === 'troca' && !clienteId) {
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          'clienteId é obrigatório para cupons de troca',
        );
      }

      if (tipo !== 'troca' && tipo !== 'promocional') {
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          'Tipo de cupom inválido. Use "troca" ou "promocional".',
        );
      }

      const db = ConexaoPostgres.obterInstancia();

      // Para cupons promocionais, não precisa de clienteId
      if (tipo === 'promocional') {
        await db.executar(`
          INSERT INTO livraria_comercial.cupom (cup_codigo, cup_tipo, cup_valor_desconto, cup_valor_minimo, cup_valido_ate, cup_ativo)
          VALUES ($1, 'promocional', $2, $3, CURRENT_DATE + INTERVAL '365 days', true)
          ON CONFLICT (cup_codigo) DO UPDATE
          SET cup_valor_desconto = EXCLUDED.cup_valor_desconto, cup_ativo = true
        `, [codigo, valor, valorMinimo]);
      } else {
        // Para cupons de troca, insere na tabela específica cupons_troca
        Logger.info('[criarCupomTroca] Criando cupom de troca na tabela cupons_troca', { codigo, valor, clienteId });
        await db.executar(`
          INSERT INTO livraria_comercial.cupons_troca (cpt_cliente_id, cpt_codigo, cpt_valor, cpt_valido_ate, cpt_status)
          VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '365 days', 'DISPONIVEL')
          ON CONFLICT (cpt_codigo) DO UPDATE
          SET cpt_valor = EXCLUDED.cpt_valor, cpt_status = 'DISPONIVEL'
        `, [clienteId, codigo, valor]);
      }

      return RespostaPadrao.enviarSucesso(resposta, 201, { mensagem: `Cupom de ${tipo} criado com sucesso.` });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao criar cupom.');
      return RespostaPadrao.enviarErro(resposta, 500, mensagem);
    }
  }

  /**
   * Expira uma intenção de pagamento simulando TTL (apenas testes).
   */
  public static async expirarIntencao(requisicao: Request, resposta: Response): Promise<Response> {
    const ambienteTeste = process.env.NODE_ENV === 'test';
    if (!ambienteTeste) {
      return RespostaPadrao.enviarErro(
        resposta,
        403,
        'Acesso bloqueado. Endpoint permitido apenas em NODE_ENV=test.',
      );
    }

    try {
      const { idIntencao } = requisicao.body;

      if (!idIntencao) {
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          'Campo obrigatório: idIntencao',
        );
      }

      const db = ConexaoPostgres.obterInstancia();
      await db.executar(
        `UPDATE intencao_pagamento SET inp_expira_em = NOW() - INTERVAL '1 minute' WHERE inp_uuid = $1`,
        [idIntencao],
      );

      return RespostaPadrao.enviarSucesso(resposta, 200, { mensagem: 'Intenção de pagamento expirada com sucesso.' });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao expirar intenção de pagamento.');
      return RespostaPadrao.enviarErro(resposta, 500, mensagem);
    }
  }

  /**
   * Muda o status de uma venda (apenas testes).
   */
  public static async mudarStatusVenda(requisicao: Request, resposta: Response): Promise<Response> {
    const ambienteTeste = process.env.NODE_ENV === 'test';
    if (!ambienteTeste) {
      return RespostaPadrao.enviarErro(
        resposta,
        403,
        'Acesso bloqueado. Endpoint permitido apenas em NODE_ENV=test.',
      );
    }

    try {
      const { vendaUuid, novoStatus, dataEntrega } = requisicao.body;

      if (!vendaUuid || !novoStatus) {
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          'Campos obrigatórios: vendaUuid, novoStatus',
        );
      }

      const db = ConexaoPostgres.obterInstancia();
      
      let query = `
        UPDATE livraria_comercial.vendas
        SET stv_id = (SELECT stv_id FROM livraria_comercial.status_venda WHERE stv_descricao = $2)
      `;
      const params: any[] = [vendaUuid, novoStatus];

      if (dataEntrega) {
        query += `, ven_data_hora_entrega = $3`;
        params.push(dataEntrega);
      }

      query += ` WHERE ven_uuid = $1`;

      await db.executar(query, params);

      return RespostaPadrao.enviarSucesso(resposta, 200, { mensagem: 'Status da venda alterado com sucesso.' });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao alterar status da venda.');
      return RespostaPadrao.enviarErro(resposta, 500, mensagem);
    }
  }

  /**
   * Prepara tabelas de pagamento para testes (apenas testes).
   * Insere dados de tipo_pagamento, status_venda e prepara tabela de PIX simulado.
   */
  public static async prepararTabelasPagamento(requisicao: Request, resposta: Response): Promise<Response> {
    const ambienteTeste = process.env.NODE_ENV === 'test';
    if (!ambienteTeste) {
      return RespostaPadrao.enviarErro(
        resposta,
        403,
        'Acesso bloqueado. Endpoint permitido apenas em NODE_ENV=test.',
      );
    }

    try {
      const db = ConexaoPostgres.obterInstancia();

      // Inserir tipo de pagamento PIX
      await db.executar(
        `INSERT INTO livraria_financeiro.tipo_pagamento (tpg_descricao) VALUES ('pix') ON CONFLICT (tpg_descricao) DO NOTHING`,
      );

      // Inserir status de venda AGUARDANDO PAGAMENTO
      await db.executar(
        `INSERT INTO livraria_comercial.status_venda (stv_descricao) VALUES ('AGUARDANDO PAGAMENTO') ON CONFLICT (stv_descricao) DO NOTHING`,
      );

      // Preparar tabela de PIX simulado
      await db.executar(`
        ALTER TABLE livraria_financeiro.pagamento_pix_simulado
          ADD COLUMN IF NOT EXISTS pps_segredo_confirmacao VARCHAR(128)
      `);

      return RespostaPadrao.enviarSucesso(resposta, 200, { mensagem: 'Tabelas de pagamento preparadas com sucesso.' });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao preparar tabelas de pagamento.');
      return RespostaPadrao.enviarErro(resposta, 500, mensagem);
    }
  }

  /**
   * Obtém ID do cliente por email (apenas testes).
   * Usado para criar cupons de troca vinculados a clientes específicos.
   */
  public static async obterClienteIdPorEmail(requisicao: Request, resposta: Response): Promise<Response> {
    const ambienteTeste = process.env.NODE_ENV === 'test';
    if (!ambienteTeste) {
      return RespostaPadrao.enviarErro(
        resposta,
        403,
        'Acesso bloqueado. Endpoint permitido apenas em NODE_ENV=test.',
      );
    }

    try {
      const { email } = requisicao.body;

      if (!email) {
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          'Campo obrigatório: email',
        );
      }

      const db = ConexaoPostgres.obterInstancia();
      
      const clienteRes = await db.executar<{ cli_id: number }>(
        `SELECT c.cli_id FROM livraria_gestao.clientes c
         JOIN livraria_gestao.usuarios u ON u.usu_id = c.usu_id
         WHERE u.usu_email = $1`,
        [email]
      );
      
      if (clienteRes.length === 0) {
        return RespostaPadrao.enviarErro(resposta, 404, 'Cliente não encontrado.');
      }

      return RespostaPadrao.enviarSucesso(resposta, 200, { clienteId: clienteRes[0].cli_id });
    } catch (erro) {
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao obter ID do cliente.');
      return RespostaPadrao.enviarErro(resposta, 500, mensagem);
    }
  }
}
