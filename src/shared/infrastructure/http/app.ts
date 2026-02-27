import express, { Application } from 'express';
import cors from 'cors';
import { registrarRotasAutenticacao } from '@/modules/auth/auth.routes';
import { registrarRotasClientes } from '@/modules/clientes/clientes.routes';
import { registrarRotasAdmin } from '@/modules/admin/admin.routes';
import { middlewareErro } from '@/shared/middlewares/erro.middleware';

/**
 * Cria e configura a aplicação Express principal.
 */
export function criarAplicacao(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  registrarRotasAutenticacao(app);
  registrarRotasClientes(app);
  registrarRotasAdmin(app);

  app.use(middlewareErro);

  return app;
}

