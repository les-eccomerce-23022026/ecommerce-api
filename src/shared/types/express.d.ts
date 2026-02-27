import type { PapelUsuario } from '@/modules/usuarios/Iusuario.entity';

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        uuid: string;
        role: PapelUsuario;
      };
    }
  }
}

export {};
