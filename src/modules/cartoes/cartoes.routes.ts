import { Application } from 'express';
import { ControladorCartoes } from './cartoes.controller';
import { autenticacaoMiddleware } from '../../shared/middlewares/autenticacao.middleware';

/**
 * Registra as rotas relacionadas a cartões de crédito.
 */
export function registrarRotasCartoes(app: Application): void {
  // Listar cartões do usuário autenticado
  app.get('/api/clientes/perfil/cartoes', autenticacaoMiddleware, (req, res) =>
    ControladorCartoes.listarCartoesUsuario(req, res)
  );

  // Cadastrar novo cartão
  app.post('/api/clientes/perfil/cartoes', autenticacaoMiddleware, (req, res) =>
    ControladorCartoes.cadastrarCartao(req, res)
  );

  // Atualizar cartão específico
  app.put('/api/clientes/perfil/cartoes/:uuid', autenticacaoMiddleware, (req, res) =>
    ControladorCartoes.atualizarCartao(req, res)
  );

  // Remover cartão
  app.delete('/api/clientes/perfil/cartoes/:uuid', autenticacaoMiddleware, (req, res) =>
    ControladorCartoes.removerCartao(req, res)
  );

  // Definir cartão como principal
  app.patch('/api/clientes/perfil/cartoes/:uuid/principal', autenticacaoMiddleware, (req, res) =>
    ControladorCartoes.definirCartaoPrincipal(req, res)
  );
}