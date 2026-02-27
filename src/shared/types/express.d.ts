declare global {
  namespace Express {
    interface Request {
      /**
       * Dados do usuário autenticado, extraídos do JWT.
       * O campo `role` é a descrição do papel (ex: 'admin', 'cliente'),
       * nunca o id interno do papel.
       */
      usuario?: {
        uuid: string;
        role: string;
      };
    }
  }
}

export {};
