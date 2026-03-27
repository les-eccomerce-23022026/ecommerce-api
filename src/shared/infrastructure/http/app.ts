import express, { Application, Router } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { registrarRotasAutenticacao } from '@/modules/auth/auth.routes';
import { registrarRotasClientes } from '@/modules/clientes/clientes.routes';
import { registrarRotasCartoes } from '@/modules/cartoes/cartoes.routes';
import { registrarRotasEntrega } from '@/modules/entrega/entrega.routes';
import { registrarRotasPagamentos } from '@/modules/pagamentos/pagamentos.routes';
import { registrarRotasAdmin } from '@/modules/admin/admin.routes';
import { registrarRotasVendas } from '@/modules/vendas/vendas.routes';
import { middlewareErro } from '@/shared/middlewares/erro.middleware';
import { middlewareTrocaBanco } from '@/shared/middlewares/troca-banco.middleware';

/**
 * Cria e configura a aplicação Express principal.
 */
export function criarAplicacao(): Application {
  const app = express();
  const apiRouter = Router();

  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(cookieParser());
  // Configura os middlewares globais ANTES das rotas.
  app.use(express.json());
  app.use(middlewareTrocaBanco);

  // Registro das rotas da API.
  registrarRotasPagamentos(apiRouter);
  registrarRotasEntrega(apiRouter);
  registrarRotasAutenticacao(apiRouter);
  registrarRotasClientes(apiRouter);
  registrarRotasCartoes(apiRouter);
  registrarRotasAdmin(apiRouter);
  registrarRotasVendas(apiRouter);

  // Aplica o prefixo configurável (default: /api)
  const prefixo = process.env.API_PREFIX ?? '/api';
  app.use(prefixo, apiRouter);

  app.use(middlewareErro);

  return app;
}
