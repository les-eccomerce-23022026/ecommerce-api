import dotenv from 'dotenv';
import { criarAplicacao } from '@/shared/infrastructure/http/app';
import { Logger } from '@/shared/utils/Logger.util';

dotenv.config();

// Validar variáveis de ambiente críticas (regra U3 - proibido fallback silencioso)
const variaveisObrigatorias: Record<string, string | undefined> = {
  PORTA_HTTP: process.env.PORTA_HTTP,
  JWT_SEGREDO: process.env.JWT_SEGREDO,
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  POSTGRES_PORT: process.env.POSTGRES_PORT,
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  POSTGRES_DB: process.env.POSTGRES_DB,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  SEGREDO_HMAC_INTENCAO: process.env.SEGREDO_HMAC_INTENCAO,
};

const variaveisFaltando = Object.entries(variaveisObrigatorias)
  .filter(([, valor]) => !valor)
  .map(([nome]) => nome);

if (variaveisFaltando.length > 0) {
  throw new Error(
    `Variáveis de ambiente obrigatórias não definidas: ${variaveisFaltando.join(', ')}. Verifique o arquivo .env.`
  );
}

const porta = process.env.PORTA_HTTP!;

const app = criarAplicacao();

app.listen(Number(porta), () => {
  Logger.info(`Servidor iniciado na porta ${porta}`);
});

