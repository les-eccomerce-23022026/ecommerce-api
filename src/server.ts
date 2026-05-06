import dotenv from 'dotenv';
import { criarAplicacao } from '@/shared/infrastructure/http/app';
import { Logger } from '@/shared/utils/Logger.util';

dotenv.config();

const porta = process.env.PORTA_HTTP ?? '3000';

const app = criarAplicacao();

app.listen(Number(porta), () => {
  Logger.info(`Servidor iniciado na porta ${porta}`);
});

