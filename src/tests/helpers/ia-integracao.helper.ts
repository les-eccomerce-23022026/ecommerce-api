import request, { Test } from 'supertest';
import { Application } from 'express';
import { cabecalhoBearerAuth, obterTokenCliente } from './requisicoes-api.util';

/** Token de cliente autenticado para testes de integração do módulo IA. */
export async function obterTokenClienteParaIa(app: Application): Promise<string> {
  return obterTokenCliente(app);
}

export function postIaRecomendar(app: Application, token: string): Test {
  return request(app).post('/api/ia/recomendar').set(cabecalhoBearerAuth(token));
}

export function postIaChat(app: Application, token: string): Test {
  return request(app).post('/api/ia/chat').set(cabecalhoBearerAuth(token));
}
