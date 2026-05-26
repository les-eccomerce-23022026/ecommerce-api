import { Router } from 'express';
import { UsuarioPapeisController } from './usuarioPapeis.controller';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { adminOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';

const router = Router();

/**
 * Rotas para gerenciar papéis de usuários.
 * Todas as rotas requerem autenticação e permissão de admin.
 */

/**
 * POST /api/usuarios/papeis/associar
 * Associa um papel a um usuário.
 * Requer: autenticação, admin
 */
router.post(
  '/associar',
  autenticacaoMiddleware,
  adminOnlyMiddleware,
  UsuarioPapeisController.associarPapel,
);

/**
 * POST /api/usuarios/papeis/remover
 * Remove um papel de um usuário.
 * Requer: autenticação, admin
 */
router.post(
  '/remover',
  autenticacaoMiddleware,
  adminOnlyMiddleware,
  UsuarioPapeisController.removerPapel,
);

export default router;
