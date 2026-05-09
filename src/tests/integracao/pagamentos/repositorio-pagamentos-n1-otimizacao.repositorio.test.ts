import { RepositorioPagamentosPostgres } from '@/modules/pagamentos/repositories/RepositorioPagamentosPostgres';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';

describe('Integração - RepositorioPagamentosPostgres - Correção N+1 Query', () => {
  const contexto = configurarTesteIntegracao();
  let repositorio: RepositorioPagamentosPostgres;

  beforeEach(() => {
    repositorio = new RepositorioPagamentosPostgres(contexto.db!);
  });

  describe('listarPorVenda - Sem N+1 Query', () => {
    it('deve listar pagamentos de uma venda com cartões em uma única query', async () => {
      // Setup: Criar usuário
      const usuarioRes = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo)
         VALUES ('Cliente Teste Pag', 'cliente.pag@teste.com', '98765432100', 'hash', 1, TRUE)
         RETURNING usu_uuid`
      );
      const usuarioUuid = usuarioRes[0].usu_uuid;

      // Setup: Criar venda
      const vendaRes = await contexto.db!.executar<{ ven_uuid: string }>(
        `INSERT INTO vendas (usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda)
         VALUES (
           (SELECT usu_id FROM usuarios WHERE usu_uuid = $1),
           (SELECT stv_id FROM status_vendas WHERE stv_descricao = 'EM PROCESSAMENTO'),
           100.00, 10.00, 110.00
         )
         RETURNING ven_uuid`,
        [usuarioUuid]
      );
      const vendaUuid = vendaRes[0].ven_uuid;

      // Setup: Criar tipos de pagamento e status
      // Nota: O enum TipoPagamento usa snake_case, mas o banco pode usar outro formato
      await contexto.db!.executar(
        `INSERT INTO tipo_pagamento (tpg_descricao) VALUES ('cartao_credito'), ('cupom_troca') ON CONFLICT DO NOTHING`
      );
      await contexto.db!.executar(
        `INSERT INTO status_pagamento (stp_descricao) VALUES ('APROVADO'), ('PENDENTE'), ('RECUSADO'), ('CANCELADO') ON CONFLICT DO NOTHING`
      );

      // Setup: Criar bandeira de cartão
      await contexto.db!.executar(
        `INSERT INTO bandeiras_cartao (ban_descricao) VALUES ('VISA') ON CONFLICT DO NOTHING`
      );

      // Criar 3 pagamentos para a venda
      const pagamentosPromises = Array.from({ length: 3 }, async () => {
        const pagamentoRes = await contexto.db!.executar<{ pag_uuid: string; pag_id: number }>(
          `INSERT INTO pagamento (ven_id, tpg_id, stp_id, pag_valor, pag_criado_em)
           VALUES (
             (SELECT ven_id FROM vendas WHERE ven_uuid = $1),
             (SELECT tpg_id FROM tipo_pagamento WHERE tpg_descricao = 'cartao_credito'),
             (SELECT stp_id FROM status_pagamento WHERE stp_descricao = 'APROVADO'),
             50.00, NOW()
           )
           RETURNING pag_uuid, pag_id`,
          [vendaUuid]
        );
        const pagId = pagamentoRes[0].pag_id;

        // Adicionar detalhes do cartão
        await contexto.db!.executar(
          `INSERT INTO cartao_pagamento (pag_id, cpp_numero_tokenizado, cpp_nome_titular, cpp_validade, cpp_bandeira)
           VALUES ($1, 'token123', 'TITULAR TESTE', '12/25', 'VISA')`,
          [pagId]
        );
      });
      await Promise.all(pagamentosPromises);

      // Act: Listar pagamentos da venda
      const pagamentos = await repositorio.listarPorVenda(vendaUuid);

      // Assert
      expect(pagamentos).toHaveLength(3);
      
      // Verificar que cada pagamento tem cartão carregado (prova de N+1 fix)
      pagamentos.forEach((pagamento) => {
        expect(pagamento.cartao).toBeDefined();
        expect(pagamento.cartao!.getUltimosDigitos()).toBeDefined();
        expect(pagamento.cartao!.getNomeTitular()).toBe('TITULAR TESTE');
        expect(pagamento.vendaUuid).toBe(vendaUuid);
        expect(pagamento.status).toBe('APROVADO');
      });
    });

    it('deve retornar array vazio quando venda não possui pagamentos', async () => {
      // Setup: Criar venda sem pagamentos
      const usuarioRes = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo)
         VALUES ('Cliente Sem Pag', 'cliente.sempag@teste.com', '55555555555', 'hash', 1, TRUE)
         RETURNING usu_uuid`
      );
      const usuarioUuid = usuarioRes[0].usu_uuid;

      const vendaRes = await contexto.db!.executar<{ ven_uuid: string }>(
        `INSERT INTO vendas (usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda)
         VALUES (
           (SELECT usu_id FROM usuarios WHERE usu_uuid = $1),
           (SELECT stv_id FROM status_vendas WHERE stv_descricao = 'EM PROCESSAMENTO'),
           100.00, 10.00, 110.00
         )
         RETURNING ven_uuid`,
        [usuarioUuid]
      );
      const vendaUuid = vendaRes[0].ven_uuid;

      // Act
      const pagamentos = await repositorio.listarPorVenda(vendaUuid);

      // Assert
      expect(pagamentos).toHaveLength(0);
    });

    it('deve listar pagamentos com cupom de troca sem cartão', async () => {
      // Setup
      const usuarioRes = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo)
         VALUES ('Cliente Cupom', 'cliente.cupom@teste.com', '44444444444', 'hash', 1, TRUE)
         RETURNING usu_uuid`
      );
      const usuarioUuid = usuarioRes[0].usu_uuid;

      const vendaRes = await contexto.db!.executar<{ ven_uuid: string }>(
        `INSERT INTO vendas (usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda)
         VALUES (
           (SELECT usu_id FROM usuarios WHERE usu_uuid = $1),
           (SELECT stv_id FROM status_vendas WHERE stv_descricao = 'EM PROCESSAMENTO'),
           50.00, 0.00, 50.00
         )
         RETURNING ven_uuid`,
        [usuarioUuid]
      );
      const vendaUuid = vendaRes[0].ven_uuid;

      await contexto.db!.executar(
        `INSERT INTO pagamento (ven_id, tpg_id, stp_id, pag_valor, pag_criado_em, pag_detalhes_cupom)
         VALUES (
           (SELECT ven_id FROM vendas WHERE ven_uuid = $1),
           (SELECT tpg_id FROM tipo_pagamento WHERE tpg_descricao = 'cupom_troca'),
           (SELECT stp_id FROM status_pagamento WHERE stp_descricao = 'APROVADO'),
           50.00, NOW(), 'CUPOM-TESTE-123'
         )`,
        [vendaUuid]
      );

      // Act
      const pagamentos = await repositorio.listarPorVenda(vendaUuid);

      // Assert
      expect(pagamentos).toHaveLength(1);
      expect(pagamentos[0].cartao).toBeUndefined();
      expect(pagamentos[0].formaPagamento.getTipo()).toBe('cupom_troca');
      expect(pagamentos[0].valor).toBe(50);
    });

    it('deve listar pagamentos com status variados', async () => {
      // Setup
      const usuarioRes = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo)
         VALUES ('Cliente Status Pag', 'cliente.statuspag@teste.com', '66666666666', 'hash', 1, TRUE)
         RETURNING usu_uuid`
      );
      const usuarioUuid = usuarioRes[0].usu_uuid;

      const vendaRes = await contexto.db!.executar<{ ven_uuid: string }>(
        `INSERT INTO vendas (usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda)
         VALUES (
           (SELECT usu_id FROM usuarios WHERE usu_uuid = $1),
           (SELECT stv_id FROM status_vendas WHERE stv_descricao = 'EM PROCESSAMENTO'),
           200.00, 0.00, 200.00
         )
         RETURNING ven_uuid`,
        [usuarioUuid]
      );
      const vendaUuid = vendaRes[0].ven_uuid;

      // Criar pagamentos com status diferentes
      const statuses = ['APROVADO', 'PENDENTE', 'RECUSADO', 'CANCELADO'];
      await Promise.all(
        statuses.map((status) =>
          contexto.db!.executar(
            `INSERT INTO pagamento (ven_id, tpg_id, stp_id, pag_valor, pag_criado_em)
             VALUES (
               (SELECT ven_id FROM vendas WHERE ven_uuid = $1),
               (SELECT tpg_id FROM tipo_pagamento WHERE tpg_descricao = 'cartao_credito'),
               (SELECT stp_id FROM status_pagamento WHERE stp_descricao = $2),
               50.00, NOW()
             )`,
            [vendaUuid, status]
          )
        )
      );

      // Act
      const pagamentos = await repositorio.listarPorVenda(vendaUuid);

      // Assert
      expect(pagamentos).toHaveLength(4);
      const statusesEncontrados = pagamentos.map(p => p.status);
      expect(statusesEncontrados).toContain('APROVADO');
      expect(statusesEncontrados).toContain('PENDENTE');
      expect(statusesEncontrados).toContain('RECUSADO');
      expect(statusesEncontrados).toContain('CANCELADO');
    });
  });
});
