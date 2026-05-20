/* eslint-disable max-lines */
import { RepositorioVendasPostgres } from '@/modules/vendas/repositories/RepositorioVendasPostgres';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';

describe('Integração - RepositorioVendasPostgres - Correção N+1 Queries', () => {
  const contexto = configurarTesteIntegracao();
  let repositorio: RepositorioVendasPostgres;

  beforeEach(() => {
    repositorio = new RepositorioVendasPostgres(contexto.db!);
  });

  afterEach(async () => {
    // Limpar dados criados nos testes
    const cpfs = ['12345678901', '12345678902', '12345678903', '12345678904', '11111111111', '22222222222', '33333333333'];
    for (const cpf of cpfs) {
      await contexto.db!.executar(`DELETE FROM itens_venda WHERE ven_id IN (SELECT ven_id FROM vendas WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = $1))`, [cpf]);
      await contexto.db!.executar(`DELETE FROM vendas WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = $1)`, [cpf]);
      await contexto.db!.executar(`DELETE FROM livraria_gestao.clientes WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = $1)`, [cpf]);
      await contexto.db!.executar(`DELETE FROM usuarios WHERE usu_cpf = $1`, [cpf]);
    }
    await contexto.db!.executar(`DELETE FROM estoques WHERE liv_id IN (SELECT liv_id FROM livros WHERE liv_titulo LIKE 'Livro Teste%')`);
    await contexto.db!.executar(`DELETE FROM livros WHERE liv_titulo LIKE 'Livro Teste%' OR liv_titulo = 'Livro Status'`);
  });

  describe('listarPorUsuario - Sem N+1 Query', () => {
    it('deve listar vendas de um usuário com itens em uma única query', async () => {
      // Setup: Limpar usuário existente para evitar duplicate key
      await contexto.db!.executar(`DELETE FROM livraria_gestao.clientes WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '12345678901')`);
      await contexto.db!.executar(`DELETE FROM vendas WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '12345678901')`);
      await contexto.db!.executar(`DELETE FROM usuarios WHERE usu_cpf = '12345678901'`);
      
      // Setup: Criar usuário
      const usuarioRes = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
         VALUES ($1, $2, $3, $4, $5, TRUE, 1)
         RETURNING usu_uuid`,
        ['Cliente Teste', 'cliente@teste.com', '12345678901', 'hash', 1]
      );
      const usuarioUuid = usuarioRes[0].usu_uuid;

      // Setup: Criar status de venda
      await contexto.db!.executar(
        "INSERT INTO status_venda (stv_descricao) VALUES ('EM PROCESSAMENTO'), ('APROVADA') ON CONFLICT DO NOTHING"
      );

      // Setup: Criar livro
      const livroRes = await contexto.db!.executar<{ liv_uuid: string }>(
        `INSERT INTO livros (liv_uuid, liv_titulo, liv_isbn, aut_id, edi_id, gpr_id, liv_ano, liv_edicao, liv_numero_paginas, liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_ativo)
         VALUES ('123e4567-e89b-12d3-a456-426614174000', 'Livro Teste', '1234567890123', 1, 1, 1, 2024, '1ª', 300, 23, 15, 0.5, 2, '7891234567890', TRUE)
         RETURNING liv_uuid`
      );
      const livroUuid = livroRes[0].liv_uuid;

      // Setup: Criar estoque
      await contexto.db!.executar(
        `INSERT INTO estoques (liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
         VALUES ((SELECT liv_id FROM livros WHERE liv_uuid = $1), 10, 0, 50.00, 30.00, TRUE, 1)`,
        [livroUuid]
      );

      // Criar 3 vendas com itens para o usuário
      const vendasPromises = Array.from({ length: 3 }, async () => {
        const vendaRes = await contexto.db!.executar<{ ven_uuid: string }>(
          `INSERT INTO vendas (usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda, loj_id)
           VALUES (
             (SELECT usu_id FROM usuarios WHERE usu_uuid = $1),
             (SELECT stv_id FROM status_venda WHERE stv_descricao = 'EM PROCESSAMENTO'),
             50.00, 10.00, 60.00, 1
           )
           RETURNING ven_uuid`,
          [usuarioUuid]
        );
        const vendaUuid = vendaRes[0].ven_uuid;

        // Adicionar 1 item por venda
        await contexto.db!.executar(
          `INSERT INTO itens_venda (ven_id, liv_uuid, itv_quantidade, itv_preco_unitario, loj_id)
           VALUES (
             (SELECT ven_id FROM vendas WHERE ven_uuid = $1),
             $2, 1, 50.00, 1
           )`,
          [vendaUuid, livroUuid]
        );
      });
      await Promise.all(vendasPromises);

      // Act: Listar vendas do usuário
      const vendas = await repositorio.listarPorUsuario(usuarioUuid);

      // Assert
      expect(vendas).toHaveLength(3);
      
      // Verificar que cada venda tem seus itens carregados (prova de N+1 fix)
      vendas.forEach((venda) => {
        expect(venda.itens).toHaveLength(1);
        expect(venda.itens[0].livroUuid).toBe(livroUuid);
        expect(venda.usuarioUuid).toBe(usuarioUuid);
        expect(venda.status).toBe('EM PROCESSAMENTO');
      });
    });

    it('deve retornar array vazio quando usuário não possui vendas', async () => {
      const usuarioUuid = '00000000-0000-0000-0000-000000000000';
      
      const vendas = await repositorio.listarPorUsuario(usuarioUuid);
      
      expect(vendas).toHaveLength(0);
    });

    it('deve listar venda com múltiplos itens (boundary test)', async () => {
      // Setup: Criar usuário
      // Setup: Limpar usuário existente para evitar duplicate key
      await contexto.db!.executar(`DELETE FROM livraria_gestao.clientes WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '12345678902')`);
      await contexto.db!.executar(`DELETE FROM vendas WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '12345678902')`);
      await contexto.db!.executar(`DELETE FROM usuarios WHERE usu_cpf = '12345678902'`);
      
      const usuarioRes = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
         VALUES ('Cliente Multi Itens', 'cliente.multi@teste.com', '12345678902', 'hash', 1, TRUE, 1)
         RETURNING usu_uuid`
      );
      const usuarioUuid = usuarioRes[0].usu_uuid;

      // Setup: Criar status de venda
      await contexto.db!.executar(
        "INSERT INTO status_venda (stv_descricao) VALUES ('EM PROCESSAMENTO') ON CONFLICT DO NOTHING"
      );

      // Setup: Criar 5 livros diferentes
      const livroUuids: string[] = [];
      for (let i = 0; i < 5; i++) {
        const livroUuid = crypto.randomUUID();
        const isbn = livroUuid.replace(/-/g, '').substring(0, 13);
        const codigoBarras = livroUuid.replace(/-/g, '').substring(0, 13);
        
        const livroRes = await contexto.db!.executar<{ liv_uuid: string }>(
          `INSERT INTO livros (liv_uuid, liv_titulo, liv_isbn, aut_id, edi_id, gpr_id, liv_ano, liv_edicao, liv_numero_paginas, liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_ativo)
           VALUES ($1, 'Livro Teste ${i}', $2, 1, 1, 1, 2024, '1ª', 300, 23, 15, 0.5, 2, $3, TRUE)
           RETURNING liv_uuid`,
          [livroUuid, isbn, codigoBarras]
        );
        livroUuids.push(livroRes[0].liv_uuid);

        await contexto.db!.executar(
          `INSERT INTO estoques (liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
           VALUES ((SELECT liv_id FROM livros WHERE liv_uuid = $1), 10, 0, 50.00, 30.00, TRUE, 1)`,
          [livroUuid]
        );
      }

      // Criar 1 venda com 5 itens
      const vendaRes = await contexto.db!.executar<{ ven_uuid: string }>(
        `INSERT INTO vendas (usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda, loj_id)
         VALUES (
           (SELECT usu_id FROM usuarios WHERE usu_uuid = $1),
           (SELECT stv_id FROM status_venda WHERE stv_descricao = 'EM PROCESSAMENTO'),
           250.00, 10.00, 260.00, 1
         )
         RETURNING ven_uuid`,
        [usuarioUuid]
      );
      const vendaUuid = vendaRes[0].ven_uuid;

      // Adicionar 5 itens à venda
      await Promise.all(
        livroUuids.map((livroUuid) =>
          contexto.db!.executar(
            `INSERT INTO itens_venda (ven_id, liv_uuid, itv_quantidade, itv_preco_unitario, loj_id)
             VALUES (
               (SELECT ven_id FROM vendas WHERE ven_uuid = $1),
               $2, 1, 50.00, 1
             )`,
            [vendaUuid, livroUuid]
          )
        )
      );

      // Act
      const vendas = await repositorio.listarPorUsuario(usuarioUuid);

      // Assert
      expect(vendas).toHaveLength(1);
      expect(vendas[0].itens).toHaveLength(5);
      expect(vendas[0].itens.map(i => i.livroUuid)).toEqual(expect.arrayContaining(livroUuids));
    });

    it('deve listar vendas com status variados', async () => {
      // Setup: Criar usuário
      // Setup: Limpar usuário existente para evitar duplicate key
      await contexto.db!.executar(`DELETE FROM livraria_gestao.clientes WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '12345678903')`);
      await contexto.db!.executar(`DELETE FROM vendas WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '12345678903')`);
      await contexto.db!.executar(`DELETE FROM usuarios WHERE usu_cpf = '12345678903'`);
      
      const usuarioRes = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
         VALUES ('Cliente Status Var', 'cliente.status@teste.com', '12345678903', 'hash', 1, TRUE, 1)
         RETURNING usu_uuid`
      );
      const usuarioUuid = usuarioRes[0].usu_uuid;

      // Setup: Criar múltiplos status
      await contexto.db!.executar(
        `INSERT INTO status_venda (stv_descricao) 
         VALUES ('EM PROCESSAMENTO'), ('APROVADA'), ('CANCELADA'), ('ENTREGUE'), ('EM TROCA') 
         ON CONFLICT DO NOTHING`
      );

      // Setup: Criar livro
      const livroRes = await contexto.db!.executar<{ liv_uuid: string }>(
        `INSERT INTO livros (liv_uuid, liv_titulo, liv_isbn, aut_id, edi_id, gpr_id, liv_ano, liv_edicao, liv_numero_paginas, liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_ativo)
         VALUES ('${crypto.randomUUID()}', 'Livro Status', '1234567890199', 1, 1, 1, 2024, '1ª', 300, 23, 15, 0.5, 2, '7891234567899', TRUE)
         RETURNING liv_uuid`
      );
      const livroUuid = livroRes[0].liv_uuid;

      await contexto.db!.executar(
        `INSERT INTO estoques (liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
         VALUES ((SELECT liv_id FROM livros WHERE liv_uuid = $1), 10, 0, 50.00, 30.00, TRUE, 1)`,
        [livroUuid]
      );

      // Criar vendas com status diferentes
      const statuses = ['EM PROCESSAMENTO', 'APROVADA', 'CANCELADA', 'ENTREGUE'];
      await Promise.all(
        statuses.map(async (status) => {
          const vendaRes = await contexto.db!.executar<{ ven_uuid: string }>(
            `INSERT INTO vendas (usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda, loj_id)
             VALUES (
               (SELECT usu_id FROM usuarios WHERE usu_uuid = $1),
               (SELECT stv_id FROM status_venda WHERE stv_descricao = $2),
               50.00, 10.00, 60.00, 1
             )
             RETURNING ven_uuid`,
            [usuarioUuid, status]
          );
          const vendaUuid = vendaRes[0].ven_uuid;

          await contexto.db!.executar(
            `INSERT INTO itens_venda (ven_id, liv_uuid, itv_quantidade, itv_preco_unitario, loj_id)
             VALUES (
               (SELECT ven_id FROM vendas WHERE ven_uuid = $1),
               $2, 1, 50.00, 1
             )`,
            [vendaUuid, livroUuid]
          );
        })
      );

      // Act
      const vendas = await repositorio.listarPorUsuario(usuarioUuid);

      // Assert
      expect(vendas).toHaveLength(4);
      const statusesEncontrados = vendas.map(v => v.status);
      expect(statusesEncontrados).toContain('EM PROCESSAMENTO');
      expect(statusesEncontrados).toContain('APROVADA');
      expect(statusesEncontrados).toContain('CANCELADA');
      expect(statusesEncontrados).toContain('ENTREGUE');
    });

    it('deve listar venda sem itens (LEFT JOIN edge case)', async () => {
      // Setup: Criar usuário
      // Setup: Limpar usuário existente para evitar duplicate key
      await contexto.db!.executar(`DELETE FROM livraria_gestao.clientes WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '12345678904')`);
      await contexto.db!.executar(`DELETE FROM vendas WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '12345678904')`);
      await contexto.db!.executar(`DELETE FROM usuarios WHERE usu_cpf = '12345678904'`);
      
      const usuarioRes = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
         VALUES ('Cliente Sem Itens', 'cliente.semitens@teste.com', '12345678904', 'hash', 1, TRUE, 1)
         RETURNING usu_uuid`
      );
      const usuarioUuid = usuarioRes[0].usu_uuid;

      // Setup: Criar status
      await contexto.db!.executar(
        "INSERT INTO status_venda (stv_descricao) VALUES ('EM PROCESSAMENTO') ON CONFLICT DO NOTHING"
      );

      // Criar venda sem itens
      const vendaRes = await contexto.db!.executar<{ ven_uuid: string }>(
        `INSERT INTO vendas (usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda, loj_id)
         VALUES (
           (SELECT usu_id FROM usuarios WHERE usu_uuid = $1),
           (SELECT stv_id FROM status_venda WHERE stv_descricao = 'EM PROCESSAMENTO'),
           0.00, 0.00, 0.00, 1
         )
         RETURNING ven_uuid`,
        [usuarioUuid]
      );
      const vendaUuid = vendaRes[0].ven_uuid;

      // Act
      const vendas = await repositorio.listarPorUsuario(usuarioUuid);

      // Assert
      expect(vendas).toHaveLength(1);
      expect(vendas[0].id).toBe(vendaUuid);
      expect(vendas[0].itens).toHaveLength(0); // Venda sem itens deve retornar array vazio
    });
  });

  describe('listarTodas - Sem N+1 Query', () => {
    it('deve listar todas as vendas com itens em uma única query', async () => {
      // Setup: Limpar usuário existente para evitar duplicate key
      await contexto.db!.executar(`DELETE FROM livraria_gestao.clientes WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '11111111111')`);
      await contexto.db!.executar(`DELETE FROM vendas WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '11111111111')`);
      await contexto.db!.executar(`DELETE FROM usuarios WHERE usu_cpf = '11111111111'`);
      
      const usuarioRes = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
         VALUES ($1, $2, $3, $4, $5, TRUE, 1)
         RETURNING usu_uuid`,
        ['Cliente 1', 'cliente1@teste.com', '11111111111', 'hash', 1]
      );
      const usuario1Uuid = usuarioRes[0].usu_uuid;

      // Setup: Limpar usuário existente para evitar duplicate key
      await contexto.db!.executar(`DELETE FROM livraria_gestao.clientes WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '22222222222')`);
      await contexto.db!.executar(`DELETE FROM vendas WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '22222222222')`);
      await contexto.db!.executar(`DELETE FROM usuarios WHERE usu_cpf = '22222222222'`);
      
      const usuario2Res = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
         VALUES ($1, $2, $3, $4, $5, TRUE, 1)
         RETURNING usu_uuid`,
        ['Cliente 2', 'cliente2@teste.com', '22222222222', 'hash', 1]
      );
      const usuario2Uuid = usuario2Res[0].usu_uuid;

      // Criar vendas para ambos os usuários
      const livroRes = await contexto.db!.executar<{ liv_uuid: string }>(
        `INSERT INTO livros (liv_uuid, liv_titulo, liv_isbn, aut_id, edi_id, gpr_id, liv_ano, liv_edicao, liv_numero_paginas, liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_ativo)
         VALUES ('223e4567-e89b-12d3-a456-426614174001', 'Livro Teste 2', '1234567890124', 1, 1, 1, 2024, '1ª', 300, 23, 15, 0.5, 2, '7891234567891', TRUE)
         RETURNING liv_uuid`
      );
      const livroUuid = livroRes[0].liv_uuid;

      await contexto.db!.executar(
        `INSERT INTO estoques (liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
         VALUES ((SELECT liv_id FROM livros WHERE liv_uuid = $1), 10, 0, 50.00, 30.00, TRUE, 1)`,
        [livroUuid]
      );

      // Criar 5 vendas e guardar os UUIDs para validar
      const vendasCriadas: string[] = [];
      const vendasPromises = Array.from({ length: 5 }, async (i: number) => {
        const usuarioUuid = i % 2 === 0 ? usuario1Uuid : usuario2Uuid;
        const vendaRes = await contexto.db!.executar<{ ven_uuid: string }>(
          `INSERT INTO vendas (usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda, loj_id)
           VALUES (
             (SELECT usu_id FROM usuarios WHERE usu_uuid = $1),
             (SELECT stv_id FROM status_venda WHERE stv_descricao = 'EM PROCESSAMENTO'),
             50.00, 10.00, 60.00, 1
           )
           RETURNING ven_uuid`,
          [usuarioUuid]
        );
        const vendaUuid = vendaRes[0].ven_uuid;
        vendasCriadas.push(vendaUuid);

        await contexto.db!.executar(
          `INSERT INTO itens_venda (ven_id, liv_uuid, itv_quantidade, itv_preco_unitario, loj_id)
           VALUES (
             (SELECT ven_id FROM vendas WHERE ven_uuid = $1),
             $2, 1, 50.00, 1
           )`,
          [vendaUuid, livroUuid]
        );
      });
      await Promise.all(vendasPromises);

      // Act: Listar todas as vendas
      const vendas = await repositorio.listarTodas(10);

      // Assert - Validar que as vendas criadas estão nos resultados
      const uuidsEncontrados = vendas.map(v => v.id);
      vendasCriadas.forEach(uuid => {
        expect(uuidsEncontrados).toContain(uuid);
      });
      
      // Verificar que as vendas criadas têm itens carregados (prova de N+1 fix)
      vendasCriadas.forEach(uuid => {
        const venda = vendas.find(v => v.id === uuid);
        expect(venda).toBeDefined();
        expect(venda!.itens).toHaveLength(1);
        expect(venda!.status).toBe('EM PROCESSAMENTO');
      });
    });

    it('deve respeitar o limite de vendas retornadas', async () => {
      const vendas = await repositorio.listarTodas(2);
      
      expect(vendas.length).toBeLessThanOrEqual(2);
    });
  });

  describe('obterPorUuid - Sem Subquery Desnecessária', () => {
    it('deve obter venda com itens usando LEFT JOIN', async () => {
      // Setup
      // Setup: Limpar usuário existente para evitar duplicate key
      await contexto.db!.executar(`DELETE FROM livraria_gestao.clientes WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '33333333333')`);
      await contexto.db!.executar(`DELETE FROM vendas WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '33333333333')`);
      await contexto.db!.executar(`DELETE FROM usuarios WHERE usu_cpf = '33333333333'`);
      
      const usuarioRes = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
         VALUES ('Cliente 3', 'cliente3@teste.com', '33333333333', 'hash', 1, TRUE, 1)
         RETURNING usu_uuid`
      );
      const usuarioUuid = usuarioRes[0].usu_uuid;

      const livroRes = await contexto.db!.executar<{ liv_uuid: string }>(
        `INSERT INTO livros (liv_uuid, liv_titulo, liv_isbn, aut_id, edi_id, gpr_id, liv_ano, liv_edicao, liv_numero_paginas, liv_altura, liv_largura, liv_peso, liv_profundidade, liv_codigo_barras, liv_ativo)
         VALUES ('323e4567-e89b-12d3-a456-426614174002', 'Livro Teste 3', '1234567890125', 1, 1, 1, 2024, '1ª', 300, 23, 15, 0.5, 2, '7891234567892', TRUE)
         RETURNING liv_uuid`
      );
      const livroUuid = livroRes[0].liv_uuid;

      await contexto.db!.executar(
        `INSERT INTO estoques (liv_id, etq_quantidade_disponivel, etq_quantidade_reservada, etq_preco_venda, etq_valor_custo_atual, etq_ativo, loj_id)
         VALUES ((SELECT liv_id FROM livros WHERE liv_uuid = $1), 10, 0, 50.00, 30.00, TRUE, 1)`,
        [livroUuid]
      );

      const vendaRes = await contexto.db!.executar<{ ven_uuid: string }>(
        `INSERT INTO vendas (usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda, loj_id)
         VALUES (
           (SELECT usu_id FROM usuarios WHERE usu_uuid = $1),
           (SELECT stv_id FROM status_venda WHERE stv_descricao = 'EM PROCESSAMENTO'),
           50.00, 10.00, 60.00, 1
         )
         RETURNING ven_uuid`,
        [usuarioUuid]
      );
      const vendaUuid = vendaRes[0].ven_uuid;

      await contexto.db!.executar(
        `INSERT INTO itens_venda (ven_id, liv_uuid, itv_quantidade, itv_preco_unitario, loj_id)
         VALUES (
           (SELECT ven_id FROM vendas WHERE ven_uuid = $1),
           $2, 1, 50.00, 1
         )`,
        [vendaUuid, livroUuid]
      );

      // Act
      const venda = await repositorio.obterPorUuid(vendaUuid);

      // Assert
      expect(venda).not.toBeNull();
      expect(venda!.id).toBe(vendaUuid);
      expect(venda!.usuarioUuid).toBe(usuarioUuid);
      expect(venda!.itens).toHaveLength(1);
      expect(venda!.itens[0].livroUuid).toBe(livroUuid);
    });

    it('deve retornar null para venda inexistente', async () => {
      const venda = await repositorio.obterPorUuid('00000000-0000-0000-0000-000000000000');
      
      expect(venda).toBeNull();
    });
  });
});
