import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';
import { LIVRO_UUID_TESTE } from '@/tests/helpers/pedido-venda.helper';
import { ServicoNotificacaoEmail } from '@/modules/entrega/adapters/ServicoNotificacaoEmail';

describe('Integração - Fluxo de Falha e Reagendamento de Entrega (Sprint 3)', () => {
  const contexto = configurarTesteIntegracao();
  let token: string;

  beforeAll(async () => {
    token = await obterTokenCliente(contexto.app);
  });

  it('deve agendar entrega e simular notificação de rastreio (S3-A)', async () => {
    // Espionamos o console.log do adapter (já que não temos um mock injetável no teste via supertest)
    // Em um cenário real de TDD rigoroso, usaríamos um container de DI para trocar o adapter no teste.
    const spyNotificacao = jest.spyOn(console, 'log').mockImplementation();

    // 1. Criar venda
    const resVenda = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itens: [{ livroUuid: LIVRO_UUID_TESTE, quantidade: 1, precoUnitario: 50.0 }],
        valorTotalItens: 50.0,
        valorFrete: 10.0,
        valorTotal: 60.0,
      });

    const vendaUuid = resVenda.body.id;

    // 2. Agendar entrega
    const resEntrega = await request(contexto.app)
      .post('/api/entregas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        tipoFrete: 'SEDEX',
        endereco: { logradouro: 'Rua Inicial', numero: '10' },
        custo: 10.0,
      });

    expect(resEntrega.status).toBe(201);
    expect(spyNotificacao).toHaveBeenCalledWith(expect.stringContaining('[NOTIFICAÇÃO]'));
    expect(spyNotificacao).toHaveBeenCalledWith(expect.stringContaining(resEntrega.body.uuid));

    spyNotificacao.mockRestore();
  });

  it('deve registrar falha na entrega e reagendar com novo endereço (S3-C)', async () => {
    // 1. Criar venda e agendar entrega inicial
    const resVenda = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itens: [{ livroUuid: LIVRO_UUID_TESTE, quantidade: 1, precoUnitario: 100.0 }],
        valorTotalItens: 100.0,
        valorFrete: 20.0,
        valorTotal: 120.0,
      });
    const vendaUuid = resVenda.body.id;

    const resEntrega = await request(contexto.app)
      .post('/api/entregas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        tipoFrete: 'PAC',
        endereco: { logradouro: 'Endereco Errado', numero: '0' },
        custo: 20.0,
      });
    const entregaUuid = resEntrega.body.uuid;

    // 2. Registrar Falha (Admin)
    const resFalha = await request(contexto.app)
      .patch(`/api/entregas/${entregaUuid}/falha`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(resFalha.status).toBe(204);

    // Verificar status da venda
    const resVendaFalha = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${token}`);
    expect(resVendaFalha.body.status).toBe('FALHA NA ENTREGA');

    // 3. Reagendar com novo endereço (Cliente)
    const novoEndereco = { logradouro: 'Endereco Corrigido', numero: '99' };
    const resReagendar = await request(contexto.app)
      .patch(`/api/entregas/${entregaUuid}/reagendar`)
      .set('Authorization', `Bearer ${token}`)
      .send({ endereco: novoEndereco });
    
    expect(resReagendar.status).toBe(204);

    // Verificar se o status voltou para EM PROCESSAMENTO e o endereço mudou
    const resVendaReagendada = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${token}`);
    expect(resVendaReagendada.body.status).toBe('EM PROCESSAMENTO');

    const resEntregaAtualizada = await request(contexto.app)
      .get(`/api/entregas/${entregaUuid}`)
      .set('Authorization', `Bearer ${token}`);
    expect(resEntregaAtualizada.body.endereco).toEqual(novoEndereco);
  });
});
