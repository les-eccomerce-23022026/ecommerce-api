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
        lojas?: Array<{ loj_id: number; loj_uuid: string }>;
        loja_uuid_principal?: string;
        loj_id_atual?: number;
      };
    }
  }
}

export {};
