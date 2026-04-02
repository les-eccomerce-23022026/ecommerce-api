import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { obterTokenCliente } from '@/tests/utils/requisicoes-api.util';

describe('Integração - Cartões', () => {
  const contexto = configurarTesteIntegracao(false);
  let token: string;
  let uuidCartao: string;
  let uuidBandeiraVisa: string;

  beforeAll(async () => {
    // Busca o UUID da bandeira Visa dinamicamente para evitar erro de FK em bancos com seeds diferentes
    const resBandeira = await contexto.db!.executar<{ ban_uuid: string }>(
      "SELECT ban_uuid FROM bandeiras_cartao WHERE ban_descricao = 'Visa' LIMIT 1"
    );
    uuidBandeiraVisa = resBandeira[0].ban_uuid;

    token = await obterTokenCliente(contexto.app, 'cliente.cartao@email.com', '123.456.789-99', true);
  });


  it('deve listar cartões inicialmente vazios', async () => {
    const resposta = await request(contexto.app)
      .get('/api/clientes/perfil/cartoes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body.dados).toEqual([]);
  });

  it('deve adicionar um novo cartão', async () => {
    const novoCartao = {
      uuidBandeira: uuidBandeiraVisa,
      token: 'tok_test_integration',
      ultimosDigitosCartao: '9999',
      nomeImpresso: 'Teste Integração',
      validade: '2026-12-01',
      principal: false,
    };

    const resposta = await request(contexto.app)
      .post('/api/clientes/perfil/cartoes')
      .set('Authorization', `Bearer ${token}`)
      .send(novoCartao)
      .expect(201);

    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body.dados).toHaveProperty('uuid');
    expect(resposta.body.dados.ultimosDigitosCartao).toBe('9999');
    expect(resposta.body.dados.nomeImpresso).toBe('Teste Integração');
    expect(resposta.body.dados.bandeira).toBe('Visa');
    expect(resposta.body.dados.principal).toBe(false);

    uuidCartao = resposta.body.dados.uuid;
  });

  it('deve listar cartões após adição', async () => {
    const resposta = await request(contexto.app)
      .get('/api/clientes/perfil/cartoes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body.dados).toHaveLength(1);
    expect(resposta.body.dados[0].uuid).toBe(uuidCartao);
    expect(resposta.body.dados[0].bandeira).toBe('Visa');
  });

  it('deve atualizar o cartão', async () => {
    const dadosAtualizacao = {
      nomeImpresso: 'Teste Integração Atualizado',
    };

    const resposta = await request(contexto.app)
      .patch(`/api/clientes/perfil/cartoes/${uuidCartao}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dadosAtualizacao)
      .expect(200);

    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body.dados.nomeImpresso).toBe('Teste Integração Atualizado');
  });

  it('deve listar cartões após atualização', async () => {
    const resposta = await request(contexto.app)
      .get('/api/clientes/perfil/cartoes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body.dados).toHaveLength(1);
    expect(resposta.body.dados[0].nomeImpresso).toBe('Teste Integração Atualizado');
  });

  it('deve definir cartão como principal', async () => {
    const resposta = await request(contexto.app)
      .patch(`/api/clientes/perfil/cartoes/${uuidCartao}/principal`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resposta.body.sucesso).toBe(true);
  });

  it('deve listar cartões após definir como principal', async () => {
    const resposta = await request(contexto.app)
      .get('/api/clientes/perfil/cartoes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body.dados[0].principal).toBe(true);
  });

  it('deve deletar o cartão', async () => {
    const resposta = await request(contexto.app)
      .delete(`/api/clientes/perfil/cartoes/${uuidCartao}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resposta.body.sucesso).toBe(true);
  });

  it('deve listar cartões após deleção', async () => {
    const resposta = await request(contexto.app)
      .get('/api/clientes/perfil/cartoes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body.dados).toEqual([]);
  });

  it('falha ao atualizar cartão inexistente (UUID desconhecido)', async () => {
    const resposta = await request(contexto.app)
      .patch('/api/clientes/perfil/cartoes/00000000-0000-0000-0000-00000000dead')
      .set('Authorization', `Bearer ${token}`)
      .send({ nomeImpresso: 'Inexistente' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.sucesso).toBe(false);
  });
});