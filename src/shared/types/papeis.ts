import { IPapelUsuario } from './Ipapel-usuario';

// IDs simbólicos para código de produção com seed estável; em testes de integração
// use resolverPapelGestao() (requisicoes-api.util) — pap_id vem do serial do BD.
export const PAPEL_ADMIN_SISTEMA: IPapelUsuario = { id: 3, descricao: 'admin_sistema' };
export const PAPEL_ADMIN: IPapelUsuario = { id: 1, descricao: 'admin' };
export const PAPEL_CLIENTE: IPapelUsuario = { id: 2, descricao: 'cliente' };