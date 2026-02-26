import { Application } from 'express';
import { ControladorClientes } from '@/modules/clientes/clientes.controller';

/**
 * Registra as rotas públicas relacionadas a clientes.
 */
export function registrarRotasClientes(app: Application): void {
  app.post('/api/clientes/registro', (requisicao, resposta) =>
    ControladorClientes.registrarCliente(requisicao, resposta),
  );
}

