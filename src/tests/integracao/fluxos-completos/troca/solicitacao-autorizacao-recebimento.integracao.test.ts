import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenCliente, obterTokenAdmin, obterTokenAdminSistema, obterTokenAdminComum, mudarStatusVendaTeste } from '@/tests/helpers/requisicoes-api.util';
import { 
  LIVRO_UUID_TESTE, 
  gerarPayloadPedido,
  obterPrecoCatalogo,
  validarConsistenciaPrecos
} from '@/tests/helpers/precos-catalogo.helper';

describe('Integração - Troca e Devolução (Sprint 2)', () => {
  const contexto = configurarTesteIntegracao();
  let tokenCliente: string;
  let tokenAdmin: string;
  let tokenAdminSistema: string;
  let tokenAdminComum: string;

  beforeAll(async () => {
    tokenCliente = await obterTokenCliente(contexto.app);
    tokenAdmin = await obterTokenAdmin(contexto.app);
    tokenAdminSistema = await obterTokenAdminSistema(contexto.app);
    tokenAdminComum = await obterTokenAdminComum(contexto.app);
  });

  beforeEach(async () => {
    // Validar consistência de preços antes de cada teste
    await validarConsistenciaPrecos(contexto.db!);
  });

  async function criarPedidoEntregue() {
    // 1. Criar Venda com preço dinâmico do catálogo
    const payload = await gerarPayloadPedido(contexto.db!, LIVRO_UUID_TESTE, {
      quantidade: 1,
      valorFrete: 10
    });
    
    const resVenda = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send(payload);
    const vendaUuid = resVenda.body.uuid || resVenda.body.id as string;

    // 2. Mudar para ENTREGUE e registrar data de entrega (necessário para o prazo de 7 dias — RN0043)
    await mudarStatusVendaTeste(contexto.app, tokenAdmin, vendaUuid, 'ENTREGUE', new Date().toISOString());

    return vendaUuid;
  }

  it('S2-A: Solicitar troca de item e acompanhar status', async () => {
    const vendaUuid = await criarPedidoEntregue();

    // Buscar itens para pegar o UUID do item
    const resDetalhes = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    const itemUuid = resDetalhes.body.itens[0].uuid || resDetalhes.body.itens[0].id;

    // Solicitar Troca
    const resTroca = await request(contexto.app)
      .post(`/api/vendas/${vendaUuid}/troca`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        motivo: 'Livro veio com páginas em branco',
        itensUuids: [itemUuid]
      });

    expect(resTroca.status).toBe(200);
    expect(resTroca.body.status).toBe('EM_TROCA');
    expect(resTroca.body.itens[0].emTroca).toBe(true);
    expect(resTroca.body.motivoTroca).toBe('Livro veio com páginas em branco');
  });

  it('S2-A-EXT: Admin Sistema pode autorizar troca (sem restrição de loja)', async () => {
    const vendaUuid = await criarPedidoEntregue();
    const resDetalhes = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    const itemUuid = resDetalhes.body.itens[0].uuid || resDetalhes.body.itens[0].id;

    // Cliente solicita troca
    await request(contexto.app)
      .post(`/api/vendas/${vendaUuid}/troca`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ motivo: 'Troca teste admin sistema', itensUuids: [itemUuid] });

    // Admin Sistema autoriza (deve funcionar pois contextoLojaMiddleware foi removido)
    const resAutorizar = await request(contexto.app)
      .patch(`/api/admin/pedidos/${vendaUuid}/autorizar-troca`)
      .set('Authorization', `Bearer ${tokenAdminSistema}`);

    expect(resAutorizar.status).toBe(200);
    expect(resAutorizar.body.status).toBe('TROCA_AUTORIZADA');
  });

  it('S2-A-EXT: Admin Comum pode autorizar troca da sua loja', async () => {
    const vendaUuid = await criarPedidoEntregue();
    const resDetalhes = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    const itemUuid = resDetalhes.body.itens[0].uuid || resDetalhes.body.itens[0].id;

    // Cliente solicita troca
    await request(contexto.app)
      .post(`/api/vendas/${vendaUuid}/troca`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ motivo: 'Troca teste admin comum', itensUuids: [itemUuid] });

    // Admin Comum autoriza (deve funcionar pois contextoLojaMiddleware foi removido)
    const resAutorizar = await request(contexto.app)
      .patch(`/api/admin/pedidos/${vendaUuid}/autorizar-troca`)
      .set('Authorization', `Bearer ${tokenAdminComum}`);

    expect(resAutorizar.status).toBe(200);
    expect(resAutorizar.body.status).toBe('TROCA_AUTORIZADA');
  });

  it('S2-B: Aprovação, recebimento e geração de cupom', async () => {
    const vendaUuid = await criarPedidoEntregue();
    const resDetalhes = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    const itemUuid = resDetalhes.body.itens[0].uuid || resDetalhes.body.itens[0].id;

    // 1. Cliente solicita
    const resSolicitar = await request(contexto.app)
      .post(`/api/vendas/${vendaUuid}/troca`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ motivo: 'Troca teste', itensUuids: [itemUuid] });

    // 2. Admin Sistema Autoriza (usando admin_sistema para testar papel específico)
    const resAutorizar = await request(contexto.app)
      .patch(`/api/admin/pedidos/${vendaUuid}/autorizar-troca`)
      .set('Authorization', `Bearer ${tokenAdminSistema}`);
    
    expect(resAutorizar.status).toBe(200);
    expect(resAutorizar.body.status).toBe('TROCA_AUTORIZADA');

    // 3. Admin Sistema Confirma Recebimento
    const resConfirmar = await request(contexto.app)
      .patch(`/api/admin/pedidos/${vendaUuid}/confirmar-recebimento`)
      .set('Authorization', `Bearer ${tokenAdminSistema}`)
      .send({ retornarEstoque: true });

    expect(resConfirmar.status).toBe(200);
    expect(resConfirmar.body.pedido.status).toBe('CONCLUIDA');
    
    // Obter preço dinâmico do catálogo para validação
    const precoItem = await obterPrecoCatalogo(contexto.db!, LIVRO_UUID_TESTE);
    expect(resConfirmar.body.cupomGerado.valor).toBe(precoItem); // Valor do item
    expect(resConfirmar.body.cupomGerado.codigo).toMatch(/^TROCA-/);

    // 4. Verificar se cupom existe no banco
    const resCupom = await request(contexto.app)
      .get('/api/pagamento/info') // O endpoint correto é /api/pagamento/info
      .set('Authorization', `Bearer ${tokenCliente}`);
    
    const cupom = resCupom.body.cuponsDisponiveis.find((c: { codigo: string }) => c.codigo === resConfirmar.body.cupomGerado.codigo);
    expect(cupom).toBeDefined();
    expect(cupom.valor).toBe(precoItem);
  });

  it('S2-B-EXT: Admin Comum pode confirmar recebimento e gerar cupom', async () => {
    const vendaUuid = await criarPedidoEntregue();
    const resDetalhes = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    const itemUuid = resDetalhes.body.itens[0].uuid || resDetalhes.body.itens[0].id;

    // 1. Cliente solicita
    await request(contexto.app)
      .post(`/api/vendas/${vendaUuid}/troca`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ motivo: 'Troca teste admin comum', itensUuids: [itemUuid] });

    // 2. Admin Comum Autoriza
    const resAutorizar = await request(contexto.app)
      .patch(`/api/admin/pedidos/${vendaUuid}/autorizar-troca`)
      .set('Authorization', `Bearer ${tokenAdminComum}`);
    
    expect(resAutorizar.status).toBe(200);
    expect(resAutorizar.body.status).toBe('TROCA_AUTORIZADA');

    // 3. Admin Comum Confirma Recebimento
    const resConfirmar = await request(contexto.app)
      .patch(`/api/admin/pedidos/${vendaUuid}/confirmar-recebimento`)
      .set('Authorization', `Bearer ${tokenAdminComum}`)
      .send({ retornarEstoque: true });

    expect(resConfirmar.status).toBe(200);
    expect(resConfirmar.body.pedido.status).toBe('CONCLUIDA');
    
    const precoItem = await obterPrecoCatalogo(contexto.db!, LIVRO_UUID_TESTE);
    expect(resConfirmar.body.cupomGerado.valor).toBe(precoItem);
    expect(resConfirmar.body.cupomGerado.codigo).toMatch(/^TROCA-/);
  });

  it('S2-C: Troca rejeitada', async () => {
    const vendaUuid = await criarPedidoEntregue();
    const resDetalhes = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    const itemUuid = resDetalhes.body.itens[0].uuid || resDetalhes.body.itens[0].id;

    // 1. Cliente solicita
    await request(contexto.app)
      .post(`/api/vendas/${vendaUuid}/troca`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ motivo: 'Troca teste', itensUuids: [itemUuid] });

    // 2. Admin Sistema Rejeita (usando admin_sistema para testar papel específico)
    const resRejeitar = await request(contexto.app)
      .patch(`/api/admin/pedidos/${vendaUuid}/rejeitar-troca`)
      .set('Authorization', `Bearer ${tokenAdminSistema}`)
      .send({ motivo: 'Motivo inválido' });

    expect(resRejeitar.status).toBe(200);
    expect(resRejeitar.body.status).toBe('TROCA_REJEITADA');
  });

  it('S2-C-EXT: Admin Comum pode rejeitar troca', async () => {
    const vendaUuid = await criarPedidoEntregue();
    const resDetalhes = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    const itemUuid = resDetalhes.body.itens[0].uuid || resDetalhes.body.itens[0].id;

    // 1. Cliente solicita
    await request(contexto.app)
      .post(`/api/vendas/${vendaUuid}/troca`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ motivo: 'Troca teste admin comum', itensUuids: [itemUuid] });

    // 2. Admin Comum Rejeita
    const resRejeitar = await request(contexto.app)
      .patch(`/api/admin/pedidos/${vendaUuid}/rejeitar-troca`)
      .set('Authorization', `Bearer ${tokenAdminComum}`)
      .send({ motivo: 'Motivo inválido' });

    expect(resRejeitar.status).toBe(200);
    expect(resRejeitar.body.status).toBe('TROCA_REJEITADA');
  });

  it('S2-D: Prazo de arrependimento (7 dias) — bloqueio após janela de entrega expirada', async () => {
    const vendaUuid = await criarPedidoEntregue();

    // Retroceder a data de entrega para 8 dias atrás — simula janela de 7 dias vencida (RN0043)
    await contexto.db!.executar(
      `UPDATE vendas SET ven_data_hora_entrega = NOW() - INTERVAL '8 days' WHERE ven_uuid = $1`,
      [vendaUuid],
    );

    const resTroca = await request(contexto.app)
      .post(`/api/vendas/${vendaUuid}/troca`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ motivo: 'Tarde demais', itensUuids: [] });

    expect(resTroca.status).toBe(400);
    expect(resTroca.body.erro).toMatch(/expirado/i);
  });

  describe('Validação de Papéis de Autenticação - Rotas de Troca', () => {
    it('Admin Sistema tem papel admin_sistema corretamente configurado', async () => {
      const resMe = await request(contexto.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenAdminSistema}`);

      expect(resMe.status).toBe(200);
      expect(resMe.body.dados.user.role).toBe('admin_sistema');
      expect(resMe.body.dados.user.papeis).toContain('admin_sistema');
    });

    it('Admin Comum tem papel admin corretamente configurado (sem admin_sistema)', async () => {
      const resMe = await request(contexto.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenAdminComum}`);

      expect(resMe.status).toBe(200);
      expect(resMe.body.dados.user.role).toBe('admin');
      expect(resMe.body.dados.user.papeis).toContain('admin');
      expect(resMe.body.dados.user.papeis).toContain('cliente');
      expect(resMe.body.dados.user.papeis).not.toContain('admin_sistema');
    });

    it('Admin (todos os papéis) tem todos os papéis configurados', async () => {
      const resMe = await request(contexto.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(resMe.status).toBe(200);
      expect(resMe.body.dados.user.papeis).toContain('admin');
      expect(resMe.body.dados.user.papeis).toContain('cliente');
      expect(resMe.body.dados.user.papeis).toContain('admin_sistema');
    });
  });
});
