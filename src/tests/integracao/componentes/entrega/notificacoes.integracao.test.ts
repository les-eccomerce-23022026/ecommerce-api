import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenCliente } from '@/tests/helpers/requisicoes-api.util';
import { LIVRO_UUID_TESTE } from '@/tests/helpers/pedido-venda.helper';
import { di } from '@/shared/infrastructure/di.container';

/**
 * Testes de Integração - Notificações
 * 
 * Valida o fluxo completo de notificações sem mocks:
 * - Criação de notificação ao despachar entrega
 * - Listagem de notificações do usuário
 * - Contagem de notificações não lidas
 * - Marcação como lida
 */

describe('Integração - Módulo de Notificações', () => {
  const contexto = configurarTesteIntegracao(true);
  let token: string;
  let usuarioUuid: string;

  beforeAll(async () => {
    token = await obterTokenCliente(contexto.app);
    
    // Obter UUID do usuário diretamente do repositório
    const repositorioUsuarios = di.repoUsuarios;
    const usuario = await repositorioUsuarios.buscarPorEmail('cliente.teste@email.com');
    usuarioUuid = usuario?.uuid || '';
  });

  it('deve criar notificação ao despachar entrega', async () => {
    // 1. Criar uma venda
    const resVenda = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itens: [{ livroUuid: LIVRO_UUID_TESTE, quantidade: 1, precoUnitario: 50.0 }],
        valorTotalItens: 50.0,
        valorFrete: 10.0,
        valorTotal: 60.0,
      });

    expect(resVenda.status).toBe(201);
    const vendaUuid = resVenda.body.id;

    // 2. Despachar entrega (deve gerar notificação)
    const resEntrega = await request(contexto.app)
      .post('/api/entregas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        tipoFrete: 'SEDEX',
        endereco: { logradouro: 'Rua de Teste', numero: '123' },
        custo: 10.0,
        entregador: 'João da Silva',
      });

    expect(resEntrega.status).toBe(201);

    // 3. Verificar que notificação foi criada
    const resNotificacoes = await request(contexto.app)
      .get('/api/notificacoes')
      .set('Authorization', `Bearer ${token}`);

    expect(resNotificacoes.status).toBe(200);
    expect(resNotificacoes.body).toBeInstanceOf(Array);
    expect(resNotificacoes.body.length).toBeGreaterThan(0);

    const notificacao = resNotificacoes.body[0];
    expect(notificacao.usuarioUuid).toBe(usuarioUuid);
    expect(notificacao.vendaUuid).toBe(vendaUuid);
    expect(notificacao.tipo).toBe('RASTREIO');
    expect(notificacao.lida).toBe(false);
    expect(notificacao.codigoRastreio).toBeDefined();
  });

  it('deve listar apenas notificações não lidas quando solicitado', async () => {
    // 1. Criar venda e despachar
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

    await request(contexto.app)
      .post('/api/entregas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        tipoFrete: 'SEDEX',
        endereco: { logradouro: 'Rua de Teste', numero: '123' },
        custo: 10.0,
        entregador: 'João da Silva',
      });

    // 2. Listar apenas não lidas
    const resNaoLidas = await request(contexto.app)
      .get('/api/notificacoes?apenasNaoLidas=true')
      .set('Authorization', `Bearer ${token}`);

    expect(resNaoLidas.status).toBe(200);
    expect(resNaoLidas.body).toBeInstanceOf(Array);
    
    // Todas devem estar não lidas
    resNaoLidas.body.forEach((notificacao: any) => {
      expect(notificacao.lida).toBe(false);
    });
  });

  it('deve contar notificações não lidas corretamente', async () => {
    // 1. Criar venda e despachar
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

    await request(contexto.app)
      .post('/api/entregas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        tipoFrete: 'SEDEX',
        endereco: { logradouro: 'Rua de Teste', numero: '123' },
        custo: 10.0,
        entregador: 'João da Silva',
      });

    // 2. Contar não lidas
    const resContagem = await request(contexto.app)
      .get('/api/notificacoes/contar-nao-lidas')
      .set('Authorization', `Bearer ${token}`);

    expect(resContagem.status).toBe(200);
    expect(resContagem.body.quantidade).toBeGreaterThan(0);
    expect(typeof resContagem.body.quantidade).toBe('number');
  });

  it('deve marcar notificação como lida', async () => {
    // 1. Criar venda e despachar
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

    await request(contexto.app)
      .post('/api/entregas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        tipoFrete: 'SEDEX',
        endereco: { logradouro: 'Rua de Teste', numero: '123' },
        custo: 10.0,
        entregador: 'João da Silva',
      });

    // 2. Obter notificação criada
    const resNotificacoes = await request(contexto.app)
      .get('/api/notificacoes')
      .set('Authorization', `Bearer ${token}`);

    const notificacaoUuid = resNotificacoes.body[0].uuid;

    // 3. Marcar como lida
    const resMarcarLida = await request(contexto.app)
      .put(`/api/notificacoes/${notificacaoUuid}/lida`)
      .set('Authorization', `Bearer ${token}`);

    expect(resMarcarLida.status).toBe(200);

    // 4. Verificar que foi marcada como lida
    const resVerificar = await request(contexto.app)
      .get('/api/notificacoes')
      .set('Authorization', `Bearer ${token}`);

    const notificacaoAtualizada = resVerificar.body.find(
      (n: any) => n.uuid === notificacaoUuid
    );
    expect(notificacaoAtualizada.lida).toBe(true);
  });

  it('deve marcar todas as notificações como lidas', async () => {
    // 1. Criar duas vendas e despachar (gera 2 notificações)
    for (let i = 0; i < 2; i++) {
      const resVenda = await request(contexto.app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          itens: [{ livroUuid: LIVRO_UUID_TESTE, quantidade: 1, precoUnitario: 50.0 }],
          valorTotalItens: 50.0,
          valorFrete: 10.0,
          valorTotal: 60.0,
        });

      await request(contexto.app)
        .post('/api/entregas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vendaUuid: resVenda.body.id,
          tipoFrete: 'SEDEX',
          endereco: { logradouro: 'Rua de Teste', numero: '123' },
          custo: 10.0,
          entregador: 'João da Silva',
        });
    }

    // 2. Verificar que há notificações não lidas
    const resContagemAntes = await request(contexto.app)
      .get('/api/notificacoes/contar-nao-lidas')
      .set('Authorization', `Bearer ${token}`);

    expect(resContagemAntes.body.quantidade).toBeGreaterThan(0);

    // 3. Marcar todas como lidas
    const resMarcarTodas = await request(contexto.app)
      .put('/api/notificacoes/marcar-todas-lidas')
      .set('Authorization', `Bearer ${token}`);

    expect(resMarcarTodas.status).toBe(200);

    // 4. Verificar que não há mais não lidas
    const resContagemDepois = await request(contexto.app)
      .get('/api/notificacoes/contar-nao-lidas')
      .set('Authorization', `Bearer ${token}`);

    expect(resContagemDepois.body.quantidade).toBe(0);
  });

  it('deve impedir acesso a notificações de outro usuário', async () => {
    // 1. Criar venda e despachar com usuário 1
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

    await request(contexto.app)
      .post('/api/entregas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendaUuid,
        tipoFrete: 'SEDEX',
        endereco: { logradouro: 'Rua de Teste', numero: '123' },
        custo: 10.0,
        entregador: 'João da Silva',
      });

    // 2. Obter notificação UUID
    const resNotificacoes = await request(contexto.app)
      .get('/api/notificacoes')
      .set('Authorization', `Bearer ${token}`);

    const notificacaoUuid = resNotificacoes.body[0].uuid;

    // 3. Tentar marcar como lida com token de outro usuário
    const tokenOutroUsuario = await obterTokenCliente(contexto.app, 'cliente2@teste.com', 'Senha123!');

    const resTentativa = await request(contexto.app)
      .put(`/api/notificacoes/${notificacaoUuid}/lida`)
      .set('Authorization', `Bearer ${tokenOutroUsuario}`);

    // Deve falhar (403 ou 404 dependendo da implementação)
    expect([403, 404]).toContain(resTentativa.status);
  });
});
