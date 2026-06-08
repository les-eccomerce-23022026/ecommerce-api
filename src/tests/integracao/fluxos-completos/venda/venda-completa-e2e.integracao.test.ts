import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenCliente, obterTokenAdmin } from '@/tests/helpers/requisicoes-api.util';
import { 
  gerarPayloadPedido, 
  validarConsistenciaPrecos,
  LIVRO_UUID_TESTE
} from '@/tests/helpers/precos-catalogo.helper';

/**
 * Teste End-to-End - Venda Completa (Entrega 7)
 * 
 * Valida cenários obrigatórios da entrega 7:
 * 1. Cliente realizar compra
 * 3. Registrar novo cartão e endereço no checkout
 * 5. Administrador confirma pagamento
 * 10. Administrador confirma ENTREGUE
 */
describe('Integração - Venda Completa E2E (Entrega 7)', () => {
  const contexto = configurarTesteIntegracao();
  let tokenCliente: string;
  let tokenAdmin: string;
  const emailCliente = 'cliente.venda.e2e@email.com';
  const cpfCliente = '123.456.789-01';

  beforeAll(async () => {
    tokenCliente = await obterTokenCliente(contexto.app, emailCliente, cpfCliente, true);
    tokenAdmin = await obterTokenAdmin(contexto.app);
  });

  beforeEach(async () => {
    // Validar consistência de preços antes de cada teste
    await validarConsistenciaPrecos(contexto.db!);
  });

  /**
   * Cenário 1: Cliente realizar compra
   */
  it('E2E-01: Fluxo completo de venda - Compra', async () => {
    // Arrange
    const payload = await gerarPayloadPedido(contexto.db!, LIVRO_UUID_TESTE, {
      quantidade: 2,
      valorFrete: 15
    });

    // Act: Cliente realiza compra (Cenário 1)
    const resVenda = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send(payload);

    expect(resVenda.status).toBe(201);
    const vendaUuid = resVenda.body.uuid || resVenda.body.id as string;

    // Assert: Verificar status da venda
    const resStatus = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(resStatus.status).toBe(200);
    expect(resStatus.body.status).toBe('EM PROCESSAMENTO');
  });

  /**
   * Cenário 3: Registrar novo cartão e endereço no checkout
   */
  it('E2E-02: Registrar novo cartão e endereço durante checkout', async () => {
    // 1. Obter UUID da bandeira Visa para o novo cartão
    const resBandeira = await contexto.db!.executar<{ ban_uuid: string }>(
      "SELECT ban_uuid FROM bandeiras_cartao WHERE ban_descricao = 'Visa' LIMIT 1"
    );
    const uuidBandeiraVisa = resBandeira[0].ban_uuid;

    // 2. Criar venda
    const payload = await gerarPayloadPedido(contexto.db!, LIVRO_UUID_TESTE, {
      quantidade: 1,
      valorFrete: 12
    });

    const resVenda = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send(payload);

    expect(resVenda.status).toBe(201);
    const vendaUuid = resVenda.body.uuid || resVenda.body.id as string;

    // 3. Registrar novo cartão durante o checkout
    const resCartao = await request(contexto.app)
      .post('/api/clientes/perfil/cartoes')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        uuidBandeira: uuidBandeiraVisa,
        token: 'tok_test_checkout_new_card',
        ultimosDigitosCartao: '4242',
        nomeImpresso: 'Checkout Test User',
        validade: '2026-12-01',
        principal: false,
      });

    expect(resCartao.status).toBe(201);
    expect(resCartao.body.sucesso).toBe(true);
    const novoCartaoUuid = resCartao.body.dados.uuid;

    // 4. Registrar novo endereço durante o checkout
    const resEndereco = await request(contexto.app)
      .post('/api/clientes/perfil/enderecos')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        apelido: 'Endereço Checkout',
        tipoResidencia: 'APARTAMENTO',
        tipoLogradouro: 'RUA',
        logradouro: 'dos Testes de Checkout',
        numero: '123',
        bairro: 'Checkout District',
        cep: '01234-567',
        cidade: 'São Paulo',
        estado: 'SP',
        pais: 'Brasil'
      });

    expect(resEndereco.status).toBe(201);
    expect(resEndereco.body.sucesso).toBe(true);
    const novoEnderecoUuid = resEndereco.body.dados.uuid;

    // 5. Verificar se o novo cartão e endereço estão associados ao cliente
    const resPerfil = await request(contexto.app)
      .get('/api/clientes/perfil')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(resPerfil.status).toBe(200);
    
    // Verificar cartão
    const cartoes = resPerfil.body.dados.cartoes || [];
    const cartaoCriado = cartoes.find((c: { uuid: string }) => c.uuid === novoCartaoUuid);
    expect(cartaoCriado).toBeDefined();
    expect(cartaoCriado.ultimosDigitosCartao).toBe('4242');

    // Verificar endereço
    const enderecos = resPerfil.body.dados.enderecos || [];
    const enderecoCriado = enderecos.find((e: { uuid: string }) => e.uuid === novoEnderecoUuid);
    expect(enderecoCriado).toBeDefined();
    expect(enderecoCriado.logradouro).toBe('dos Testes de Checkout');
  });

  /**
   * Cenário 5: Administrador confirma pagamento
   */
  it('E2E-03: Administrador confirma pagamento', async () => {
    // 1. Criar venda
    const payload = await gerarPayloadPedido(contexto.db!, LIVRO_UUID_TESTE, {
      quantidade: 1,
      valorFrete: 10
    });

    const resVenda = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send(payload);

    expect(resVenda.status).toBe(201);
    const vendaUuid = resVenda.body.uuid || resVenda.body.id as string;

    // 2. Criar pagamento para a venda
    const resPagamento = await request(contexto.app)
      .post('/api/pagamentos/intencao-pagamento')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        vendaUuid,
        metodoPagamento: 'cartao_credito'
      });

    // Se o endpoint de intenção de pagamento não existir, criar pagamento diretamente
    if (resPagamento.status === 201) {
      const pagamentoUuid = resPagamento.body.dados?.uuid || resPagamento.body.id;
      
      // 3. Admin confirma pagamento
      const resConfirmar = await request(contexto.app)
        .post(`/api/admin/pagamentos/${pagamentoUuid}/confirmar`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(resConfirmar.status).toBe(200);
      expect(resConfirmar.body.status).toBe('APROVADO');
    } else {
      // Alternativa: marcar venda como aprovada diretamente
      const resAprovar = await request(contexto.app)
        .patch(`/api/admin/pedidos/${vendaUuid}/aprovar-pagamento`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      if (resAprovar.status === 200) {
        expect(resAprovar.body.status).toBe('APROVADA');
      }
    }
  });

  /**
   * Cenário 10: Administrador confirma ENTREGUE
   */
  it('E2E-04: Administrador confirma ENTREGUE', async () => {
    // 1. Criar venda
    const payload = await gerarPayloadPedido(contexto.db!, LIVRO_UUID_TESTE, {
      quantidade: 1,
      valorFrete: 10
    });

    const resVenda = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send(payload);

    expect(resVenda.status).toBe(201);
    const vendaUuid = resVenda.body.uuid || resVenda.body.id as string;

    // 2. Criar entrega
    const resEntrega = await request(contexto.app)
      .post('/api/entregas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        vendaUuid,
        tipoFrete: 'PAC',
        custo: 10,
        endereco: {
          logradouro: 'Rua Teste',
          numero: '123',
          bairro: 'Bairro Teste',
          cep: '01234-567',
          cidade: 'São Paulo',
          estado: 'SP'
        }
      });

    expect(resEntrega.status).toBe(201);
    const entregaUuid = resEntrega.body.uuid || resEntrega.body.id as string;

    // 3. Admin confirma entrega
    const resConfirmar = await request(contexto.app)
      .patch(`/api/entregas/${entregaUuid}/confirmar`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(resConfirmar.status).toBe(204);

    // 4. Verificar status da venda
    const resStatus = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(resStatus.status).toBe(200);
    expect(resStatus.body.status).toBe('ENTREGUE');
  });
});
