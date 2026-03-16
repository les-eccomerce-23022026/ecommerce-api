// Configuração de ambiente para testes de integração.
// As variáveis de ambiente devem ser explicitamente definidas;
// não há fallbacks por segurança para evitar uso acidental de valores padrão em produção.

import 'dotenv/config';
import { config } from 'dotenv';

// Carrega .env.test se existir, senão .env
config({ path: '.env.test' });
config();

// Para testes, força localhost
process.env.POSTGRES_HOST = 'localhost';

const variaveisObrigatorias = [
  'DB_TYPE',
  'JWT_SEGREDO',
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
];

const variavelFaltando = variaveisObrigatorias.find((variavel) => !process.env[variavel]);
if (variavelFaltando) {
  throw new Error(`Variável de ambiente obrigatória não definida: ${variavelFaltando}`);
}
