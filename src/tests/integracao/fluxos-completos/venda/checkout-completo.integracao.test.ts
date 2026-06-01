import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenCliente, registrarCliente, realizarLogin, obterTokenAdmin, criarCupomTrocaTeste } from '@/tests/helpers/requisicoes-api.util';
import { 
  LIVRO_UUID_TESTE, 
  gerarPayloadPedido, 
  gerarPayloadPagamentoMultiplo,
  validarConsistenciaPrecos
} from '@/tests/helpers/precos-catalogo.helper';

describe('Integração - Venda Completa (Sprint 1)', () => {
  const contexto = configurarTesteIntegracao();
  let token: string;
  let tokenAdmin: string;
  const emailCliente = 'cliente.cupom.troca@email.com';
  const cpfCliente = '987.654.321-00';

  beforeAll(async () => {
    // Registrar cliente completo (usuário + cliente em livraria_gestao.clientes)
    // Precisamos passar genero ou dataNascimento para que o perfil seja criado em livraria_gestao.clientes
    await registrarCliente(contexto.app, {
      email: emailCliente,
      cpf: cpfCliente,
      genero: 'M',
      dataNascimento: '1990-01-01',
      limparDados: true,
    });
    
    // Fazer login para obter o token
    const loginRes = await realizarLogin(contexto.app, emailCliente, 'SenhaForte@123');
    token = loginRes.body.dados.token;

    tokenAdmin = await obterTokenAdmin(contexto.app);
  });

  beforeEach(async () => {
    // Validar consistência de preços antes de cada teste
    await validarConsistenciaPrecos(contexto.db!);
  });

  async function criarVenda(opcoes?: { quantidade?: number; valorFrete?: number }) {
    const payload = await gerarPayloadPedido(contexto.db!, LIVRO_UUID_TESTE, opcoes);
    const res = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.status).toBe(201);
    return res.body.id as string;
  }

  async function registrarIntencao(valorTotal: number) {
    const res = await request(contexto.app)
      .post('/api/pagamentos/intencao-pagamento')
      .set('Authorization', `Bearer ${token}`)
      .send({ valorTotal });
    expect(res.status).toBe(201);
    return res.body as { idIntencao: string; segredoConfirmacao: string };
  }

  it('S1-A: Realizar compra com múltiplos cartões (Cenário Feliz)', async () => {
    const { vendaPayload, pagamentoPayload } = await gerarPayloadPagamentoMultiplo(
      contexto.db!,
      LIVRO_UUID_TESTE,
      { numeroCartoes: 2 }
    );
    
    const vendaUuid = await criarVenda({
      quantidade: 1,
      valorFrete: 10
    });
    
    const intencao = await registrarIntencao(vendaPayload.valorTotal as number);

    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valorTotal: vendaPayload.valorTotal,
        idIntencao: intencao.idIntencao,
        segredoConfirmacao: intencao.segredoConfirmacao,
        pagamentosCartao: pagamentoPayload.pagamentosCartao,
      });

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);

    // Verificar se gerou múltiplos registros de pagamento (Deveria, segundo o BDD)
    const resResumo = await request(contexto.app)
      .get(`/api/pagamentos/venda/${vendaUuid}/resumo`)
      .set('Authorization', `Bearer ${token}`);

    expect(resResumo.status).toBe(200);
    // ATUALMENTE: o backend gera apenas 1 registro "consolidado".
    // Para cumprir o BDD "debitar nos dois cartões", idealmente deveríamos ter 2.
    // Vou checar se há 2 pagamentos na lista.
    expect(resResumo.body.pagamentos).toHaveLength(2);
  });

  it('S1-B: Falha no pagamento com um dos cartões (Atomicidade)', async () => {
    const { vendaPayload, pagamentoPayload } = await gerarPayloadPagamentoMultiplo(
      contexto.db!,
      LIVRO_UUID_TESTE,
      { numeroCartoes: 2 }
    );
    
    const vendaUuid = await criarVenda({
      quantidade: 1,
      valorFrete: 10
    });
    
    const intencao = await registrarIntencao(vendaPayload.valorTotal as number);

    // Precisamos de um jeito de falhar um dos cartões no provedor simulado.
    // Vou usar a regra de negócio: se o valor de uma parcela for EXATAMENTE 6.66, o provedor recusa (simulação).
    // Ou usar magic digits no valor.
    
    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valorTotal: vendaPayload.valorTotal,
        idIntencao: intencao.idIntencao,
        segredoConfirmacao: intencao.segredoConfirmacao,
        pagamentosCartao: [
          pagamentoPayload.pagamentosCartao[0],
          { ...pagamentoPayload.pagamentosCartao[1], magicRecusar: true }, // Vou adicionar este campo no Provedor
        ],
      });

    expect(res.body.sucesso).toBe(false);

    // Verificar se NENHUM pagamento foi aprovado
    const resResumo = await request(contexto.app)
      .get(`/api/pagamentos/venda/${vendaUuid}/resumo`)
      .set('Authorization', `Bearer ${token}`);

    const aprovados = resResumo.body.pagamentos.filter((p: { status: string }) => p.status === 'aprovado');
    expect(aprovados).toHaveLength(0);
  });

  it('S1-C: Pagamento integral com Cupom de Troca (Variação)', async () => {
    const { vendaPayload } = await gerarPayloadPagamentoMultiplo(
      contexto.db!,
      LIVRO_UUID_TESTE,
      { numeroCartoes: 2 }
    );
    
    const cupomValorOriginal = 200;
    const vendaUuid = await criarVenda({
      quantidade: 1,
      valorFrete: 10
    });

    // 1. Obter cli_id do cliente para criar cupom via endpoint de teste
    const clienteRes = await request(contexto.app)
      .post('/api/admin/testes/obter-cliente-id')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ email: emailCliente });
    
    if (clienteRes.status !== 200 || !clienteRes.body.dados) {
      throw new Error(`Cliente não encontrado para email ${emailCliente}`);
    }
    
    const cliId = clienteRes.body.dados.clienteId;
    const codigoCupom = 'TROCA-TESTE-123';

    // 2. Criar cupom usando a rota API de teste
    await criarCupomTrocaTeste(contexto.app, tokenAdmin, cliId, codigoCupom, cupomValorOriginal);

    // 3. Finalizar com 100% cupom
    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valorTotal: 0,
        idIntencao: 'CUPOM-ONLY',
        segredoConfirmacao: 'CUPOM-ONLY',
        pagamentosCartao: [],
        cuponsAplicados: [
          { uuid: 'qualquer-uuid', codigo: codigoCupom, tipo: 'troca', valor: vendaPayload.valorTotal }
        ]
      });

    expect(res.status).toBe(200);
    
    // 4. Verificar status da venda
    const resVenda = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(resVenda.body.status).toBe('APROVADA');
    
    // Nota: A verificação de saldo remanescente do cupom não está implementada
    // neste endpoint. A funcionalidade de geração de novo cupom com saldo excedente
    // é validada em outros testes (cupons.integracao.test.ts)
  });

  it('S1-D: Registrar novo cartão e endereço durante checkout (Cenário 3)', async () => {
    // 1. Obter UUID da bandeira Visa para o novo cartão
    const resBandeira = await contexto.db!.executar<{ ban_uuid: string }>(
      "SELECT ban_uuid FROM bandeiras_cartao WHERE ban_descricao = 'Visa' LIMIT 1"
    );
    const uuidBandeiraVisa = resBandeira[0].ban_uuid;

    // 2. Criar venda com preço dinâmico
    const { vendaPayload } = await gerarPayloadPagamentoMultiplo(
      contexto.db!,
      LIVRO_UUID_TESTE,
      { numeroCartoes: 1 }
    );
    
    const resVenda = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${token}`)
      .send(vendaPayload);
    
    const vendaUuid = resVenda.body.id as string;
    const intencao = await registrarIntencao(vendaPayload.valorTotal as number);

    // 3. Registrar novo cartão durante o pagamento
    const resCartao = await request(contexto.app)
      .post('/api/clientes/perfil/cartoes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        uuidBandeira: uuidBandeiraVisa,
        token: 'tok_test_checkout_new_card',
        ultimosDigitosCartao: '4242',
        nomeImpresso: 'Checkout Test User',
        validade: '2026-12-01',
        cvv: '123',
        principal: false,
      });

    expect(resCartao.status).toBe(201);
    expect(resCartao.body.sucesso).toBe(true);
    const novoCartaoUuid = resCartao.body.dados.uuid;

    // 4. Registrar novo endereço durante o checkout
    const resEndereco = await request(contexto.app)
      .post('/api/clientes/perfil/enderecos')
      .set('Authorization', `Bearer ${token}`)
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

    // 5. Processar pagamento usando o novo cartão
    const resPagamento = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valorTotal: vendaPayload.valorTotal,
        idIntencao: intencao.idIntencao,
        segredoConfirmacao: intencao.segredoConfirmacao,
        pagamentosCartao: [
          { 
            valor: vendaPayload.valorTotal, 
            parcelasCartao: 1,
            cartaoUuid: novoCartaoUuid // Usar o cartão recém-criado
          }
        ],
      });

    expect(resPagamento.status).toBe(200);
    expect(resPagamento.body.sucesso).toBe(true);

    // 6. Verificar se o novo cartão e endereço estão associados ao cliente
    const resPerfil = await request(contexto.app)
      .get('/api/clientes/perfil')
      .set('Authorization', `Bearer ${token}`);

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

    // 7. Verificar status final da venda
    const resVendaFinal = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${token}`);

    expect(resVendaFinal.body.status).toBe('APROVADA');
  });
});
