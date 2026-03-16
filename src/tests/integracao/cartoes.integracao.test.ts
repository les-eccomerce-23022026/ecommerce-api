import request from 'supertest';
import { Application } from 'express';
import { criarAplicacao } from '@/shared/infrastructure/http/app';
import {
  iniciarEscopoIsolamentoIntegracao,
  EscopoIsolamentoIntegracao,
} from '@/tests/utils/isolamento-integracao.util';

describe('Integração - Cartões', () => {
  let app: Application;
  let escopo: EscopoIsolamentoIntegracao;
  let token: string;
  let uuidCartao: string;

  beforeAll(async () => {
    app = criarAplicacao();
    escopo = await iniciarEscopoIsolamentoIntegracao();
    // Token hardcoded para teste (sub: uuid do cliente teste)
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJyb2xlIjoiY2xpZW50ZSIsImlhdCI6MTc3MzY4MjI2MiwiZXhwIjoxNzczNjg1ODYyfQ.SdVRhKYiPAbriPII1mSmENOI6KXHSS8tbdw5wqFOoFM';
  });

  afterAll(async () => {
    await escopo.finalizar();
  });

  it('deve listar cartões inicialmente vazios', async () => {
    const resposta = await request(app)
      .get('/api/clientes/perfil/cartoes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body.dados).toEqual([]);
  });

  it('deve adicionar um novo cartão', async () => {
    const novoCartao = {
      idBandeiraCartao: 1, // Visa
      tokenCartao: 'tok_test_integration',
      finalCartao: '9999',
      nomeImpresso: 'Teste Integração',
      validade: '2026-12-01',
      principal: false,
    };

    const resposta = await request(app)
      .post('/api/clientes/perfil/cartoes')
      .set('Authorization', `Bearer ${token}`)
      .send(novoCartao)
      .expect(201);

    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body.dados).toHaveProperty('uuid');
    expect(resposta.body.dados.final).toBe('9999');
    expect(resposta.body.dados.nomeImpresso).toBe('Teste Integração');
    expect(resposta.body.dados.bandeira).toBe('Visa');
    expect(resposta.body.dados.principal).toBe(false);

    uuidCartao = resposta.body.dados.uuid;
  });

  it('deve listar cartões após adição', async () => {
    const resposta = await request(app)
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

    const resposta = await request(app)
      .patch(`/api/clientes/perfil/cartoes/${uuidCartao}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dadosAtualizacao)
      .expect(200);

    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body.dados.nomeImpresso).toBe('Teste Integração Atualizado');
  });

  it('deve listar cartões após atualização', async () => {
    const resposta = await request(app)
      .get('/api/clientes/perfil/cartoes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body.dados).toHaveLength(1);
    expect(resposta.body.dados[0].nomeImpresso).toBe('Teste Integração Atualizado');
  });

  it('deve definir cartão como principal', async () => {
    const resposta = await request(app)
      .patch(`/api/clientes/perfil/cartoes/${uuidCartao}/principal`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resposta.body.sucesso).toBe(true);
  });

  it('deve listar cartões após definir como principal', async () => {
    const resposta = await request(app)
      .get('/api/clientes/perfil/cartoes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body.dados[0].principal).toBe(true);
  });

  it('deve deletar o cartão', async () => {
    const resposta = await request(app)
      .delete(`/api/clientes/perfil/cartoes/${uuidCartao}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resposta.body.sucesso).toBe(true);
  });

  it('deve listar cartões após deleção', async () => {
    const resposta = await request(app)
      .get('/api/clientes/perfil/cartoes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body.dados).toEqual([]);
  });
});