import { IPapelUsuario } from './Ipapel-usuario';

// IDs alinhados ao seed 001_seeds_tipos_referencia.sql (admin inserido antes de cliente).
export const PAPEL_ADMIN: IPapelUsuario = { id: 1, descricao: 'admin' };
export const PAPEL_CLIENTE: IPapelUsuario = { id: 2, descricao: 'cliente' };