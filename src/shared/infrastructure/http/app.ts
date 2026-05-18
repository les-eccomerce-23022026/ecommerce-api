import express, { Application, Router } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { registrarRotasAutenticacao } from '@/modules/auth/auth.routes';
import { registrarRotasClientes } from '@/modules/clientes/clientes.routes';
import { registrarRotasCartoes } from '@/modules/cartoes/cartoes.routes';
import { registrarRotasEntrega } from '@/modules/entrega/entrega.routes';
import { registrarRotasPagamentos } from '@/modules/pagamentos/controllers/pagamentos.routes';
import { registrarRotasAdmin } from '@/modules/admin/admin.routes';
import { registrarRotasVendas } from '@/modules/vendas/vendas.routes';
import { registrarRotasLivros } from '@/modules/livros/livros.routes';
import { registrarRotasCarrinho } from '@/modules/carrinho/carrinho.routes';
import { registrarRotasFrete } from '@/modules/frete/frete.routes';
import { registrarRotasCupom } from '@/modules/cupom/cupom.routes';
import { criarRotasLogisticaMocks } from '@/modules/logistica-mocks/logisticaMocks.routes';
import { ServicoMockCorreios } from '@/modules/logistica-mocks/servicoMockCorreios';
import { ServicoMockLoggi } from '@/modules/logistica-mocks/servicoMockLoggi';
import { RepositorioRastreamentoPostgres } from '@/modules/logistica-mocks/repositorios/RepositorioRastreamentoPostgres';
import { RepositorioEventoRastreamentoPostgres } from '@/modules/logistica-mocks/repositorios/RepositorioEventoRastreamentoPostgres';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { middlewareErro } from '@/shared/middlewares/erro.middleware';
import { middlewareTrocaBanco } from '@/shared/middlewares/troca-banco.middleware';

/**
 * Cria e configura a aplicação Express principal.
 */
const origensCorsPermitidas = (): string[] =>
  (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

export function criarAplicacao(): Application {
  const app = express();
  const apiRouter = Router();
  const db = ConexaoPostgres.obterInstancia();

  app.use(cookieParser());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (origensCorsPermitidas().includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );
  // Configura os middlewares globais ANTES das rotas.
  app.use(express.json());
  app.use(middlewareTrocaBanco);

  // Instanciar serviços mock de logística
  const repoRastreamento = new RepositorioRastreamentoPostgres(db);
  const repoEventoRastreamento = new RepositorioEventoRastreamentoPostgres(db);
  const servicoMockCorreios = new ServicoMockCorreios(repoRastreamento, repoEventoRastreamento);
  const servicoMockLoggi = new ServicoMockLoggi(repoRastreamento, repoEventoRastreamento);

  // Registro das rotas da API.
  registrarRotasPagamentos(apiRouter);
  registrarRotasFrete(apiRouter);
  registrarRotasEntrega(apiRouter);
  registrarRotasAutenticacao(apiRouter);
  registrarRotasClientes(apiRouter);
  registrarRotasCartoes(apiRouter);
  registrarRotasAdmin(apiRouter);
  registrarRotasVendas(apiRouter);
  registrarRotasLivros(apiRouter);
  registrarRotasCarrinho(apiRouter);
  registrarRotasCupom(apiRouter);
  
  // Rotas mockadas para APIs de logística (Correios e Loggi)
  apiRouter.use('/mock/logistica', criarRotasLogisticaMocks(servicoMockCorreios, servicoMockLoggi));

  // Aplica o prefixo configurável (default: /api)
  const prefixo = process.env.API_PREFIX ?? '/api';
  app.use(prefixo, apiRouter);

  app.use(middlewareErro);

  return app;
}
