import { IRouter } from 'express';
import { ControladorClientes } from '@/modules/clientes/clientes.controller';
import { ControladorConsultaClientes } from '@/modules/clientes/consulta-clientes.controller';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { adminOnlyMiddleware, clienteOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';

/**
 * Registra as rotas relacionadas a clientes.
 */
export function registrarRotasClientes(app: IRouter): void {
  // Rota pública de registro
  app.post('/clientes/registro', (requisicao, resposta) =>
    ControladorClientes.registrarCliente(requisicao, resposta),
  );

  // Rota protegida para obter perfil próprio
  app.get('/clientes/perfil', autenticacaoMiddleware, clienteOnlyMiddleware, (requisicao, resposta) =>
    ControladorClientes.obterPerfil(requisicao, resposta),
  );

  // Rota protegida para atualizar perfil próprio (PATCH para atualização parcial)
  app.patch('/clientes/perfil', autenticacaoMiddleware, clienteOnlyMiddleware, (requisicao, resposta) =>
    ControladorClientes.atualizarCliente(requisicao, resposta),
  );

  // Rota de alteração de senha (RF0028)
  app.patch('/clientes/seguranca/alterar-senha', autenticacaoMiddleware, (req, res) =>
    ControladorClientes.alterarSenha(req, res),
  );

  // Rota de inativação (soft delete) (RF0023)
  app.delete('/clientes/perfil', autenticacaoMiddleware, (req, res) =>
    ControladorClientes.inativarCliente(req, res),
  );

  // Rota de consulta administrativa de clientes (RF0024)
  app.get('/clientes', autenticacaoMiddleware, adminOnlyMiddleware, (requisicao, resposta) =>
    ControladorConsultaClientes.consultarClientes(requisicao, resposta),
  );
}

