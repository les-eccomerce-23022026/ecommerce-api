import { ServicoVendas } from '@/modules/vendas/services/ServicoVendas';
import { RepositorioVendasPostgres } from '@/modules/vendas/repositories/RepositorioVendasPostgres';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { IVendaInputDto } from '@/modules/vendas/dtos/IVenda.dto';

describe('Integração - ServicoVendas - Regras de Negócio', () => {
  const contexto = configurarTesteIntegracao();
  let servico: ServicoVendas;

  beforeEach(() => {
    const repositorio = new RepositorioVendasPostgres(contexto.db!);
    servico = new ServicoVendas(repositorio);
  });

  describe('registrarPedidoVenda', () => {
    it('deve lançar erro quando usuário não é informado', async () => {
      const dados: IVendaInputDto = {
        usuarioUuid: '',
        itens: [{ livroUuid: 'uuid-livro', quantidade: 1, precoUnitario: 50 }],
        valorTotalItens: 50,
        valorFrete: 10,
        valorTotal: 60,
      };

      await expect(servico.registrarPedidoVenda(dados)).rejects.toThrow('Usuário é obrigatório');
    });

    it('deve lançar erro quando não há itens', async () => {
      const dados: IVendaInputDto = {
        usuarioUuid: 'uuid-usuario',
        itens: [],
        valorTotalItens: 0,
        valorFrete: 0,
        valorTotal: 0,
      };

      await expect(servico.registrarPedidoVenda(dados)).rejects.toThrow('Venda deve possuir ao menos um item');
    });

    it('deve lançar erro quando valor total é inválido', async () => {
      const dados: IVendaInputDto = {
        usuarioUuid: 'uuid-usuario',
        itens: [{ livroUuid: 'uuid-livro', quantidade: 1, precoUnitario: 50 }],
        valorTotalItens: 50,
        valorFrete: 10,
        valorTotal: 0,
      };

      await expect(servico.registrarPedidoVenda(dados)).rejects.toThrow('Valor total inválido');
    });

    it('deve lançar erro RN0069: parcelamento abaixo de R$ 80,00', async () => {
      const dados: IVendaInputDto = {
        usuarioUuid: 'uuid-usuario',
        itens: [{ livroUuid: 'uuid-livro', quantidade: 1, precoUnitario: 50 }],
        valorTotalItens: 50,
        valorFrete: 10,
        valorTotal: 60,
        parcelas: 2,
      };

      await expect(servico.registrarPedidoVenda(dados)).rejects.toThrow('RN0069: Compras abaixo de R$ 80,00 não permitem parcelamento');
    });

    it('deve permitir parcelamento acima de R$ 80,00', async () => {
      // Setup: Limpar usuário existente para evitar duplicate key
      await contexto.db!.executar(`DELETE FROM livraria_gestao.clientes WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '12345678903')`);
      await contexto.db!.executar(`DELETE FROM vendas WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '12345678903')`);
      await contexto.db!.executar(`DELETE FROM usuarios WHERE usu_cpf = '12345678903'`);
      
      // Setup: Criar usuário
      const usuarioRes = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
         VALUES ('Cliente Parcelamento', 'cliente.parcelamento@teste.com', '12345678903', 'hash', 1, TRUE, 1)
         RETURNING usu_uuid`
      );
      const usuarioUuid = usuarioRes[0].usu_uuid;

      const dados: IVendaInputDto = {
        usuarioUuid,
        itens: [{ livroUuid: '00000000-0000-0000-0000-000000000002', quantidade: 2, precoUnitario: 50 }],
        valorTotalItens: 100,
        valorFrete: 10,
        valorTotal: 110,
        parcelas: 2,
      };

      // Validar que a venda é criada sem erro de parcelamento
      const venda = await servico.registrarPedidoVenda(dados);
      expect(venda).toBeDefined();
      expect(venda.usuarioUuid).toBe(usuarioUuid);
    });

    it('deve lançar erro RN0034: valor mínimo por cartão abaixo de R$ 10,00', async () => {
      const dados: IVendaInputDto = {
        usuarioUuid: 'uuid-usuario',
        itens: [{ livroUuid: 'uuid-livro', quantidade: 1, precoUnitario: 50 }],
        valorTotalItens: 50,
        valorFrete: 10,
        valorTotal: 60,
        pagamentos: [{ tipo: 'cartao', valor: 5 }],
      };

      await expect(servico.registrarPedidoVenda(dados)).rejects.toThrow('RN0034: Valor mínimo por cartão deve ser R$ 10,00');
    });

    it('deve permitir pagamento split com valor mínimo R$ 10,00', async () => {
      // Setup: Limpar usuário existente para evitar duplicate key
      await contexto.db!.executar(`DELETE FROM livraria_gestao.clientes WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '12345678902')`);
      await contexto.db!.executar(`DELETE FROM vendas WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '12345678902')`);
      await contexto.db!.executar(`DELETE FROM usuarios WHERE usu_cpf = '12345678902'`);
      
      // Setup: Criar usuário
      const usuarioRes = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
         VALUES ('Cliente Split', 'cliente.split@teste.com', '12345678902', 'hash', 1, TRUE, 1)
         RETURNING usu_uuid`
      );
      const usuarioUuid = usuarioRes[0].usu_uuid;

      const dados: IVendaInputDto = {
        usuarioUuid,
        itens: [{ livroUuid: '00000000-0000-0000-0000-000000000002', quantidade: 1, precoUnitario: 50 }],
        valorTotalItens: 50,
        valorFrete: 10,
        valorTotal: 60,
        pagamentos: [{ tipo: 'cartao', valor: 10 }],
      };

      // Validar que a venda é criada sem erro de split
      const venda = await servico.registrarPedidoVenda(dados);
      expect(venda).toBeDefined();
      expect(venda.usuarioUuid).toBe(usuarioUuid);
    });
  });

  describe('visualizarDetalhesVenda', () => {
    it('deve lançar erro quando venda não existe', async () => {
      await expect(
        servico.visualizarDetalhesVenda('00000000-0000-0000-0000-000000000003', { uuid: '00000000-0000-0000-0000-000000000001', ehAdmin: true })
      ).rejects.toThrow('Venda não encontrada');
    });

    it('deve lançar erro quando cliente tenta acessar venda de outro usuário', async () => {
      // Setup: Limpar usuário existente para evitar duplicate key
      await contexto.db!.executar(`DELETE FROM livraria_gestao.clientes WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '12345678901')`);
      await contexto.db!.executar(`DELETE FROM vendas WHERE usu_id IN (SELECT usu_id FROM usuarios WHERE usu_cpf = '12345678901')`);
      await contexto.db!.executar(`DELETE FROM usuarios WHERE usu_cpf = '12345678901'`);
      
      // Setup: Criar venda para outro usuário
      const usuarioRes = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
         VALUES ('Dono da Venda', 'dono@teste.com', '12345678901', 'hash', 1, TRUE, 1)
         RETURNING usu_uuid`
      );
      const donoUuid = usuarioRes[0].usu_uuid;

      // Setup: Criar venda
      const vendaRes = await contexto.db!.executar<{ ven_uuid: string }>(
        `INSERT INTO vendas (usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda, loj_id)
         VALUES (
           (SELECT usu_id FROM usuarios WHERE usu_uuid = $1),
           (SELECT stv_id FROM status_venda WHERE stv_descricao = 'EM PROCESSAMENTO'),
           50.00, 10.00, 60.00, 1
         )
         RETURNING ven_uuid`,
        [donoUuid]
      );
      const vendaUuid = vendaRes[0].ven_uuid;

      // Tentar acessar como outro usuário
      await expect(
        servico.visualizarDetalhesVenda(vendaUuid, { uuid: 'outro-usuario', ehAdmin: false })
      ).rejects.toThrow('Venda não encontrada');
    });
  });

  describe('solicitarTroca', () => {
    it('deve lançar erro quando venda não existe', async () => {
      await expect(
        servico.solicitarTroca('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Motivo', [])
      ).rejects.toThrow('Venda não encontrada');
    });

    it('deve lançar erro quando usuário não é dono da venda', async () => {
      // Setup: Criar venda
      const usuarioRes = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
         VALUES ('Dono da Venda', 'dono@teste.com', '12345678901', 'hash', 1, TRUE, 1)
         RETURNING usu_uuid`
      );
      const donoUuid = usuarioRes[0].usu_uuid;

      const vendaRes = await contexto.db!.executar<{ ven_uuid: string }>(
        `INSERT INTO vendas (usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda, loj_id)
         VALUES (
           (SELECT usu_id FROM usuarios WHERE usu_uuid = $1),
           (SELECT stv_id FROM status_venda WHERE stv_descricao = 'EM PROCESSAMENTO'),
           50.00, 10.00, 60.00, 1
         )
         RETURNING ven_uuid`,
        [donoUuid]
      );
      const vendaUuid = vendaRes[0].ven_uuid;

      // Tentar solicitar troca como outro usuário
      await expect(
        servico.solicitarTroca(vendaUuid, 'outro-usuario', 'Motivo', [])
      ).rejects.toThrow('Acesso negado');
    });

    it('deve lançar erro quando venda não está entregue', async () => {
      // Setup: Criar usuário e venda
      const usuarioRes = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
         VALUES ('Cliente', 'cliente@teste.com', '12345678901', 'hash', 1, TRUE, 1)
         RETURNING usu_uuid`
      );
      const usuarioUuid = usuarioRes[0].usu_uuid;

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

      // Tentar solicitar troca sem estar entregue
      await expect(
        servico.solicitarTroca(vendaUuid, usuarioUuid, 'Motivo', [])
      ).rejects.toThrow('Apenas pedidos entregues podem ser trocados');
    });

    it('deve lançar erro RN0043: prazo de 7 dias expirado', async () => {
      // Setup: Criar usuário e venda entregue há mais de 7 dias
      const usuarioRes = await contexto.db!.executar<{ usu_uuid: string }>(
        `INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_ativo, loj_id)
         VALUES ('Cliente', 'cliente@teste.com', '12345678901', 'hash', 1, TRUE, 1)
         RETURNING usu_uuid`
      );
      const usuarioUuid = usuarioRes[0].usu_uuid;

      const vendaRes = await contexto.db!.executar<{ ven_uuid: string }>(
        `INSERT INTO vendas (usu_id, stv_id, ven_total_itens, ven_frete, ven_total_venda, ven_data_hora_entrega, loj_id)
         VALUES (
           (SELECT usu_id FROM usuarios WHERE usu_uuid = $1),
           (SELECT stv_id FROM status_venda WHERE stv_descricao = 'ENTREGUE'),
           50.00, 10.00, 60.00, NOW() - INTERVAL '8 days', 1
         )
         RETURNING ven_uuid`,
        [usuarioUuid]
      );
      const vendaUuid = vendaRes[0].ven_uuid;

      // Tentar solicitar troca após prazo expirado
      await expect(
        servico.solicitarTroca(vendaUuid, usuarioUuid, 'Motivo', [])
      ).rejects.toThrow('Prazo de 7 dias para troca expirado');
    });
  });
});
