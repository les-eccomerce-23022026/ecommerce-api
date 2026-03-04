// Configuração de ambiente para testes de integração.
// As variáveis de ambiente devem ser explicitamente definidas;
// não há fallbacks por segurança para evitar uso acidental de valores padrão em produção.

import 'dotenv/config';

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
