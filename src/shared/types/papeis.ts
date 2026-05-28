import { IPapelUsuario } from './Ipapel-usuario';

// IDs alinhados ao banco de dados (livraria_gestao.papeis)
export const PAPEL_ADMIN_SISTEMA: IPapelUsuario = { id: 3, descricao: 'admin_sistema' };
export const PAPEL_ADMIN: IPapelUsuario = { id: 1, descricao: 'admin' };
export const PAPEL_CLIENTE: IPapelUsuario = { id: 2, descricao: 'cliente' };