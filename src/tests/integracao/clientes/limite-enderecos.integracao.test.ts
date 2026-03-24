import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { registrarCliente, realizarLogin } from '@/tests/utils/requisicoes-api.util';

describe('Integração - Restrição de Quantidade de Endereços', () => {
  const contexto = configurarTesteIntegracao();

  it('deve impedir a criação de mais de 5 endereços para um cliente', async () => {
    // 1. Registrar um novo cliente
    const email = `teste.limite.${Date.now()}@email.com`;
    await registrarCliente(contexto.app, {
      nome: 'Teste Limite Endereços',
      cpf: '123.456.789-11',
      email,
      senha: 'SenhaForte@123',
      confirmacaoSenha: 'SenhaForte@123',
      // Já cria 2 no registro (cobranca + entrega)
      enderecoCobranca: {
        apelido: 'Cobranca',
        tipoResidencia: 'Casa',
        tipoLogradouro: 'Rua',
        logradouro: 'Rua das Flores',
        numero: '10',
        bairro: 'Centro',
        cep: '12345-678',
        cidade: 'São Paulo',
        estado: 'SP',
        pais: 'Brasil'
      },
      enderecoEntregaIgualCobranca: false,
      enderecoEntrega: {
        apelido: 'Entrega 1',
        tipoResidencia: 'Apartamento',
        tipoLogradouro: 'Avenida',
        logradouro: 'Av Central',
        numero: '100',
        bairro: 'Jardins',
        cep: '00000-000',
        cidade: 'São Paulo',
        estado: 'SP',
        pais: 'Brasil'
      }
    });

    // 2. Login para obter token
    const respostaLogin = await realizarLogin(contexto.app, email, 'SenhaForte@123');
    const { token } = respostaLogin.body.dados;

    // 3. Adicionar mais 3 endereços (totalizando 5)
    for (let i = 2; i <= 4; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const res = await request(contexto.app)
          .post('/api/clientes/perfil/enderecos')
          .set('Authorization', `Bearer ${token}`)
          .send({
            apelido: `Endereco ${i+1}`,
            tipoResidencia: 'Casa',
            tipoLogradouro: 'Rua',
            logradouro: `Rua Teste ${i}`,
            numero: `${i}`,
            bairro: 'Bairro Teste',
            cep: '11111-111',
            cidade: 'Cidade Teste',
            estado: 'SP'
          });
        expect(res.status).toBe(201);
    }

    // 4. Tentar adicionar o 6º endereço (deve falhar)
    const respostaFalha = await request(contexto.app)
      .post('/api/clientes/perfil/enderecos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        apelido: 'Sexto Endereco',
        tipoResidencia: 'Casa',
        tipoLogradouro: 'Rua',
        logradouro: 'Rua Proibida',
        numero: '666',
        bairro: 'Bairro Falha',
        cep: '99999-999',
        cidade: 'Cidade Erro',
        estado: 'SP'
      });

    expect(respostaFalha.status).toBe(400);
    expect(respostaFalha.body.mensagem).toContain('Limite de 5 endereços atingido');
  });
});
