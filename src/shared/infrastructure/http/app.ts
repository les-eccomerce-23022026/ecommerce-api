import express, { Application } from 'express';
import cors from 'cors';
import { registrarRotasAutenticacao } from '@/modules/auth/auth.routes';
import { registrarRotasClientes } from '@/modules/clientes/clientes.routes';

/**
 * Cria e configura a aplicação Express principal.
 */
export function criarAplicacao(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  registrarRotasAutenticacao(app);
  registrarRotasClientes(app);

  return app;
}

