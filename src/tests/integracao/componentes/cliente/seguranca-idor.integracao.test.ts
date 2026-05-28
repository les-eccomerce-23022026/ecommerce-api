import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import {
  gerarCpfValidoUnico,
  obterTokenCliente,
} from '@/tests/helpers/requisicoes-api.util';

const enderecoPadrao = {
  apelido: 'Casa IDOR',
  tipoResidencia: 'CASA',
  tipoLogradouro: 'RUA',
  logradouro: 'Rua Isolamento',
  numero: '10',
  bairro: 'Centro',
  cep: '01001-000',
  cidade: 'São Paulo',
  estado: 'SP',
  pais: 'Brasil',
};

/**
 * Testes de integração — IDOR (acesso a recursos de outro usuário por UUID).
 */
describe('Integração - Segurança IDOR (Cliente)', () => {
  const contexto = configurarTesteIntegracao();

  it('[SEGURANÇA] cliente B deve receber 404 ao editar endereço do cliente A', async () => {
    const tokenA = await obterTokenCliente(
      contexto.app,
      `cliente.a.idor.${Date.now()}@teste.com`,
      gerarCpfValidoUnico(),
    );
    const tokenB = await obterTokenCliente(
      contexto.app,
      `cliente.b.idor.${Date.now()}@teste.com`,
      gerarCpfValidoUnico(),
    );

    const criado = await request(contexto.app)
      .post('/api/clientes/perfil/enderecos')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(enderecoPadrao);

    expect(criado.status).toBe(201);
    const uuidEndereco = criado.body.dados.uuid as string;

    const resposta = await request(contexto.app)
      .patch(`/api/clientes/perfil/enderecos/${uuidEndereco}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ apelido: 'Tentativa IDOR' });

    expect(resposta.status).toBe(404);
    expect(resposta.body.sucesso).toBe(false);
  });

  it('[SEGURANÇA] cliente B deve receber erro ao atualizar cartão do cliente A', async () => {
    const tokenA = await obterTokenCliente(
      contexto.app,
      `cartao.a.idor.${Date.now()}@teste.com`,
      gerarCpfValidoUnico(),
    );
    const tokenB = await obterTokenCliente(
      contexto.app,
      `cartao.b.idor.${Date.now()}@teste.com`,
      gerarCpfValidoUnico(),
    );

    const bandeira = await contexto.db!.executar<{ ban_uuid: string }>(
      "SELECT ban_uuid FROM bandeiras_cartao WHERE ban_descricao = 'Visa' LIMIT 1",
    );
    const uuidBandeira = bandeira[0].ban_uuid;

    const criado = await request(contexto.app)
      .post('/api/clientes/perfil/cartoes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        uuidBandeira,
        token: 'tok_idor_a',
        ultimosDigitosCartao: '1111',
        nomeImpresso: 'Cliente A',
        validade: '2026-12-01',
        cvv: '123',
        principal: false,
      });

    expect(criado.status).toBe(201);
    const cartaoUuid = criado.body.dados.uuid as string;

    const resposta = await request(contexto.app)
      .patch(`/api/clientes/perfil/cartoes/${cartaoUuid}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ nomeImpresso: 'Tentativa IDOR' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.sucesso).toBe(false);
  });
});
