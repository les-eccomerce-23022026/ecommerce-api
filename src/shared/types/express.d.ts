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
        id: number;
        email: string;
        role: string;
        papeis?: string[];
        loj_ids?: number[];
        loj_id_principal?: number;
        loj_id_atual?: number;
      };
    }
  }
}

export {};
