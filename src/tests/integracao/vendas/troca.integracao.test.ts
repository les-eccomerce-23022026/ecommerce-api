import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente, obterTokenAdmin } from '@/tests/utils/requisicoes-api.util';
import { LIVRO_UUID_TESTE } from '@/tests/helpers/pedido-venda.helper';

describe('Integração - Troca e Devolução (Sprint 2)', () => {
  const contexto = configurarTesteIntegracao();
  let tokenCliente: string;
  let tokenAdmin: string;

  beforeAll(async () => {
    tokenCliente = await obterTokenCliente(contexto.app);
    tokenAdmin = await obterTokenAdmin(contexto.app);
  });

  async function criarPedidoEntregue() {
    // 1. Criar Venda
    const resVenda = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        itens: [{ livroUuid: LIVRO_UUID_TESTE, quantidade: 1, precoUnitario: 100 }],
        valorTotalItens: 100,
        valorFrete: 10,
        valorTotal: 110,
      });
    const vendaUuid = resVenda.body.id;

    // 2. Mudar para ENTREGUE via Banco para facilitar setup
    await contexto.db!.executar(`
      UPDATE vendas 
      SET stv_id = (SELECT stv_id FROM status_vendas WHERE stv_descricao = 'ENTREGUE')
      WHERE ven_uuid = $1
    `, [vendaUuid]);

    return vendaUuid;
  }

  it('S2-A: Solicitar troca de item e acompanhar status', async () => {
    const vendaUuid = await criarPedidoEntregue();

    // Buscar itens para pegar o UUID do item
    const resDetalhes = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    const itemUuid = resDetalhes.body.itens[0].id;

    // Solicitar Troca
    const resTroca = await request(contexto.app)
      .post(`/api/vendas/${vendaUuid}/troca`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        motivo: 'Livro veio com páginas em branco',
        itensUuids: [itemUuid]
      });

    expect(resTroca.status).toBe(200);
    expect(resTroca.body.status).toBe('EM TROCA');
    expect(resTroca.body.itens[0].emTroca).toBe(true);
    expect(resTroca.body.motivoTroca).toBe('Livro veio com páginas em branco');
  });

  it('S2-B: Aprovação, recebimento e geração de cupom', async () => {
    const vendaUuid = await criarPedidoEntregue();
    const resDetalhes = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    const itemUuid = resDetalhes.body.itens[0].id;

    // 1. Cliente solicita
    await request(contexto.app)
      .post(`/api/vendas/${vendaUuid}/troca`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ motivo: 'Troca teste', itensUuids: [itemUuid] });

    // 2. Admin Autoriza
    const resAutorizar = await request(contexto.app)
      .put(`/api/admin/pedidos/${vendaUuid}/autorizar-troca`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    
    expect(resAutorizar.status).toBe(200);
    expect(resAutorizar.body.status).toBe('TROCA AUTORIZADA');

    // 3. Admin Confirma Recebimento
    const resConfirmar = await request(contexto.app)
      .put(`/api/admin/pedidos/${vendaUuid}/confirmar-recebimento`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ retornarEstoque: true });

    expect(resConfirmar.status).toBe(200);
    expect(resConfirmar.body.pedido.status).toBe('CONCLUÍDA');
    expect(resConfirmar.body.cupomGerado.valor).toBe(100); // Valor do item
    expect(resConfirmar.body.cupomGerado.codigo).toMatch(/^TROCA-/);

    // 4. Verificar se cupom existe no banco
    const resCupom = await request(contexto.app)
      .get('/api/pagamento/info') // O endpoint correto é /api/pagamento/info
      .set('Authorization', `Bearer ${tokenCliente}`);
    
    const cupom = resCupom.body.cuponsDisponiveis.find((c: any) => c.codigo === resConfirmar.body.cupomGerado.codigo);
    expect(cupom).toBeDefined();
    expect(cupom.valor).toBe(100);
  });

  it('S2-C: Troca rejeitada', async () => {
    const vendaUuid = await criarPedidoEntregue();
    const resDetalhes = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    const itemUuid = resDetalhes.body.itens[0].id;

    // 1. Cliente solicita
    await request(contexto.app)
      .post(`/api/vendas/${vendaUuid}/troca`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ motivo: 'Troca teste', itensUuids: [itemUuid] });

    // 2. Admin Rejeita
    const resRejeitar = await request(contexto.app)
      .put(`/api/admin/pedidos/${vendaUuid}/rejeitar-troca`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ motivo: 'Motivo inválido' });

    expect(resRejeitar.status).toBe(200);
    expect(resRejeitar.body.status).toBe('TROCA REJEITADA');
  });

  it('S2-D: Prazo de arrependimento (7 dias)', async () => {
    const vendaUuid = await criarPedidoEntregue();

    // Retroceder data da venda para 8 dias atrás
    await contexto.db!.executar(`
      UPDATE vendas SET ven_criado_em = NOW() - INTERVAL '8 days' WHERE ven_uuid = $1
    `, [vendaUuid]);

    // Tentar solicitar troca
    const resTroca = await request(contexto.app)
      .post(`/api/vendas/${vendaUuid}/troca`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ motivo: 'Tarde demais', itensUuids: [] });

    expect(resTroca.status).toBe(400);
    expect(resTroca.body.erro).toMatch(/expirado/i);
  });
});
