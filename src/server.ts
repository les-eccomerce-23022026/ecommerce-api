import dotenv from 'dotenv';
import { criarAplicacao } from '@/shared/infrastructure/http/app';

dotenv.config();

const porta = process.env.PORTA_HTTP ?? '3000';

const app = criarAplicacao();

app.listen(Number(porta), () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor iniciado na porta ${porta}`);
});

