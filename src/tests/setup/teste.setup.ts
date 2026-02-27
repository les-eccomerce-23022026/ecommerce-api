// Configuração de ambiente para testes de integração.
// As variáveis de ambiente devem ser explicitamente definidas;
// não há fallbacks por segurança para evitar uso acidental de valores padrão em produção.

const variaveisObrigatorias = [
  'DB_TYPE',
  'JWT_SEGREDO',
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
];

for (const variavel of variaveisObrigatorias) {
  if (!process.env[variavel]) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${variavel}`);
  }
}
