import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenCliente } from '@/tests/helpers/requisicoes-api.util';

/**
 * Gera um UUID v4 aleatório para uso em testes
 * Evita colisões em execução paralela
 */
function gerarUuidAleatorio(): string {
  return crypto.randomUUID();
}

describe('Integração - Clientes (Endereços)', () => {
  const contexto = configurarTesteIntegracao();

  const novoEndereco = {
    apelido: 'Casa Praia',
    tipoResidencia: 'CASA',
    tipoLogradouro: 'RUA',
    logradouro: 'Alameda das Ostras',
    numero: '100',
    bairro: 'Centro',
    cep: '11600-000',
    cidade: 'São Sebastião',
    estado: 'SP',
    pais: 'Brasil'
  };

  describe('POST /api/clientes/perfil/enderecos', () => {
    it('deve adicionar um novo endereço ao perfil do cliente', async () => {
      const token = await obterTokenCliente(contexto.app);
      const resposta = await request(contexto.app)
        .post('/api/clientes/perfil/enderecos')
        .set('Authorization', `Bearer ${token}`)
        .send(novoEndereco);

      expect(resposta.status).toBe(201);
      expect(resposta.body.sucesso).toBe(true);
      expect(typeof resposta.body.dados.uuid).toBe('string');
      expect(resposta.body.dados.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(resposta.body.dados.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(resposta.body.dados.apelido).toBe(novoEndereco.apelido);
    });

    it('deve falhar ao adicionar endereço sem campos obrigatórios', async () => {
      const token = await obterTokenCliente(contexto.app);
      const resposta = await request(contexto.app)
        .post('/api/clientes/perfil/enderecos')
        .set('Authorization', `Bearer ${token}`)
        .send({ apelido: 'Incompleto' });

      expect(resposta.status).toBe(400);
      expect(resposta.body.sucesso).toBe(false);
    });
  });

  describe('PATCH /api/clientes/perfil/enderecos/:uuidEndereco', () => {
    it('deve editar um endereço existente parcialmente', async () => {
      const token = await obterTokenCliente(contexto.app);
      
      // Adiciona um endereço primeiro
      const resAdd = await request(contexto.app)
        .post('/api/clientes/perfil/enderecos')
        .set('Authorization', `Bearer ${token}`)
        .send(novoEndereco);
      
      const uuidEndereco = resAdd.body.dados.uuid;

      const resposta = await request(contexto.app)
        .patch(`/api/clientes/perfil/enderecos/${uuidEndereco}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ apelido: 'Casa Campo', numero: '500' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.apelido).toBe('Casa Campo');
      expect(resposta.body.dados.numero).toBe('500');
    });
  });

  describe('DELETE /api/clientes/perfil/enderecos/:uuidEndereco', () => {
    it('deve remover um endereço do perfil', async () => {
      const token = await obterTokenCliente(contexto.app);
      
      const resAdd = await request(contexto.app)
        .post('/api/clientes/perfil/enderecos')
        .set('Authorization', `Bearer ${token}`)
        .send(novoEndereco);
      
      const uuidEndereco = resAdd.body.dados.uuid;

      const resposta = await request(contexto.app)
        .delete(`/api/clientes/perfil/enderecos/${uuidEndereco}`)
        .set('Authorization', `Bearer ${token}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
      expect(resposta.body.dados.mensagem).toContain('sucesso');

      // Verifica se foi removido mesmo (GET perfil não deve trazer ele)
      const resPerfil = await request(contexto.app)
        .get('/api/clientes/perfil')
        .set('Authorization', `Bearer ${token}`);
      
      const enderecoRemovido = resPerfil.body.dados.enderecos.find((e: { uuid: string }) => e.uuid === uuidEndereco);
      expect(enderecoRemovido).toBeUndefined();
    });

    it('deve falhar ao tentar remover um endereço inexistente', async () => {
      const token = await obterTokenCliente(contexto.app);
      const enderecoInexistenteUuid = gerarUuidAleatorio();

      const resposta = await request(contexto.app)
        .delete(`/api/clientes/perfil/enderecos/${enderecoInexistenteUuid}`)
        .set('Authorization', `Bearer ${token}`);

      expect(resposta.status).toBe(404);
      expect(resposta.body.sucesso).toBe(false);
    });
  });
});
