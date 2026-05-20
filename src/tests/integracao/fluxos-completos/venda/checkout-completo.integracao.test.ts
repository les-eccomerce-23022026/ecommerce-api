import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente, registrarCliente, realizarLogin, obterTokenAdmin, criarCupomTrocaTeste } from '@/tests/utils/requisicoes-api.util';
import { LIVRO_UUID_TESTE } from '@/tests/helpers/pedido-venda.helper';

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

  async function criarVenda(total = 60) {
    const valorFrete = 10;
    const valorTotalItens = total - valorFrete;
    const res = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itens: [{ livroUuid: LIVRO_UUID_TESTE, quantidade: 1, precoUnitario: valorTotalItens }],
        valorTotalItens,
        valorFrete,
        valorTotal: total,
      });
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
    const total = 100;
    const vendaUuid = await criarVenda(total);
    const intencao = await registrarIntencao(total);

    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valorTotal: total,
        idIntencao: intencao.idIntencao,
        segredoConfirmacao: intencao.segredoConfirmacao,
        pagamentosCartao: [
          { valor: 60, parcelasCartao: 1 },
          { valor: 40, parcelasCartao: 2 },
        ],
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
    const total = 100;
    const vendaUuid = await criarVenda(total);
    const intencao = await registrarIntencao(total);

    // Precisamos de um jeito de falhar um dos cartões no provedor simulado.
    // Vou usar a regra de negócio: se o valor de uma parcela for EXATAMENTE 6.66, o provedor recusa (simulação).
    // Ou usar magic digits no valor.
    
    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        valorTotal: total,
        idIntencao: intencao.idIntencao,
        segredoConfirmacao: intencao.segredoConfirmacao,
        pagamentosCartao: [
          { valor: 50, parcelasCartao: 1 },
          { valor: 50, parcelasCartao: 1, magicRecusar: true }, // Vou adicionar este campo no Provedor
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
    const total = 150;
    const cupomValorOriginal = 200;
    const vendaUuid = await criarVenda(total);

    // 1. Obter cli_id do cliente para criar cupom
    const clienteRes = await contexto.db!.executar<{ cli_id: number }>(
      'SELECT c.cli_id FROM livraria_gestao.clientes c WHERE c.usu_id = (SELECT usu_id FROM usuarios WHERE usu_email = $1)',
      [emailCliente]
    );
    
    if (clienteRes.length === 0) {
      throw new Error(`Cliente não encontrado para email ${emailCliente}`);
    }
    
    const cliId = clienteRes[0].cli_id;
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
          { uuid: 'qualquer-uuid', codigo: codigoCupom, tipo: 'troca', valor: total }
        ]
      });

    if (res.status !== 200) console.log('S1-C Error Body:', JSON.stringify(res.body));
    expect(res.status).toBe(200);
    
    // 4. Verificar status da venda
    const resVenda = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(resVenda.body.status).toBe('APROVADA');

    // 5. Verificar saldo remanescente do cupom
    const cupomRes = await contexto.db!.executar<{ cpt_valor: number }>(
      'SELECT cpt_valor FROM livraria_comercial.cupons_troca WHERE cpt_codigo = $1',
      [codigoCupom]
    );
    expect(Number(cupomRes[0].cpt_valor)).toBe(50); // 200 - 150
  });
});
