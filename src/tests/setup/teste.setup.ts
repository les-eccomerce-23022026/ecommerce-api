// Configuração de ambiente para testes de integração.
// As variáveis de ambiente devem ser explicitamente definidas;
// não há fallbacks por segurança para evitar uso acidental de valores padrão em produção.

import 'dotenv/config';
import { config } from 'dotenv';

// Carrega .env.test se existir, senão .env
config({ path: '.env.test' });
config();

// Garante ambiente de teste e banco de integração (porta 5433), mesmo quando o Supertest perde o AsyncLocalStorage
process.env.NODE_ENV = 'test';
process.env.DEFAULT_LOJA_ID = process.env.DEFAULT_LOJA_ID ?? '1';
process.env.POSTGRES_HOST = process.env.POSTGRES_HOST_TEST ?? 'localhost';
process.env.POSTGRES_PORT = process.env.POSTGRES_PORT_TEST ?? '5433';
process.env.POSTGRES_USER = process.env.POSTGRES_USER_TEST ?? 'ecm_user_test';
process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD_TEST ?? 'ecm_senha_test';
process.env.POSTGRES_DB = process.env.POSTGRES_DB_TEST ?? 'ecm_livraria_test';

const variaveisObrigatorias = [
  'DB_TYPE',
  'JWT_SEGREDO',
  'POSTGRES_HOST_TEST',
  'POSTGRES_PORT_TEST',
  'POSTGRES_USER_TEST',
  'POSTGRES_PASSWORD_TEST',
  'POSTGRES_DB_TEST',
];

const variavelFaltando = variaveisObrigatorias.find((variavel) => !process.env[variavel]);
if (variavelFaltando) {
  throw new Error(`Variável de ambiente obrigatória não definida: ${variavelFaltando}`);
}
