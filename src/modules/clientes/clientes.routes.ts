import { Application } from 'express';
import { ControladorClientes } from '@/modules/clientes/clientes.controller';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';

/**
 * Registra as rotas relacionadas a clientes.
 */
export function registrarRotasClientes(app: Application): void {
  // Rota pública de registro
  app.post('/api/clientes/registro', (requisicao, resposta) =>
    ControladorClientes.registrarCliente(requisicao, resposta),
  );

  // Rota protegida para atualizar perfil próprio
  app.put('/api/clientes/perfil', autenticacaoMiddleware, (requisicao, resposta) =>
    ControladorClientes.atualizarCliente(requisicao, resposta),
  );

  // Rota de alteração de senha (RF0028)
  app.patch('/api/clientes/seguranca/alterar-senha', autenticacaoMiddleware, (req, res) =>
    ControladorClientes.alterarSenha(req, res),
  );

  // Rota de inativação (soft delete) (RF0023)
  app.delete('/api/clientes/perfil', autenticacaoMiddleware, (req, res) =>
    ControladorClientes.inativarCliente(req, res),
  );

  // Rota protegida por admin (exemplo para RFvários)
  app.put('/api/clientes/:uuid', autenticacaoMiddleware, (requisicao, resposta) =>
    ControladorClientes.atualizarCliente(requisicao, resposta),
  );

  app.delete('/api/clientes/:uuid', autenticacaoMiddleware, (req, res) =>
    ControladorClientes.inativarCliente(req, res),
  );
}

