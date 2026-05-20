import { IPapelUsuario } from '@/shared/types/Ipapel-usuario';

/**
 * Interface que representa um usuário no sistema.
 * Suporta múltiplos papéis através da tabela usuario_papeis.
 */
export interface IUsuario {
  id: number;
  uuid: string;
  nome: string;
  email: string;
  cpf?: string;
  cnpj?: string;
  tipoPessoa?: 'PF' | 'PJ';
  senhaHash: string;
  idPapel: number; // Mantido para compatibilidade, mas será descontinuado
  role: IPapelUsuario;
  papeis: IPapelUsuario[]; // Array de papéis do usuário (cliente, admin, etc.)
  telefoneRapido?: string;
  ativo: boolean;
  isAdminMestre: boolean;
  genero?: string;
  dataNascimento?: Date;
  criadoEm?: Date;
  atualizadoEm?: Date;
}
