import { Request, Response } from 'express';
import { IRepositorioUsuarios } from './IRepositorioUsuarios';
import { IAssociarPapelDto, IRemoverPapelDto, IRespostaPapelUsuarioDto } from './IusuarioPapeis.dto';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';
import { Logger } from '@/shared/utils/Logger.util';
import { PAPEL_ADMIN, PAPEL_CLIENTE } from '@/shared/types/papeis';

/**
 * Controlador para gerenciar papéis de usuários.
 * Permite associar e remover papéis de usuários (cliente, admin, etc.).
 */
export class UsuarioPapeisController {
  constructor(private readonly repositorioUsuarios: IRepositorioUsuarios) {}

  /**
   * Associa um papel a um usuário.
   * Requer autenticação e permissão de admin mestre.
   */
  public static async associarPapel(
    requisicao: Request,
    resposta: Response,
  ): Promise<Response> {
    try {
      const dados: IAssociarPapelDto = requisicao.body;
      const repositorio = requisicao.app.locals.repositorioUsuarios as IRepositorioUsuarios;
      const { usuario } = requisicao;

      // Validar que o usuário autenticado é admin mestre
      if (!usuario || !usuario.isAdminMestre) {
        return RespostaPadrao.enviarErro(
          resposta,
          403,
          'Acesso negado. Apenas administradores mestres podem gerenciar papéis de usuários.',
        );
      }

      // Validar campos obrigatórios
      if (!dados.uuidUsuario || !dados.idPapel) {
        Logger.warn('[associarPapel] Campos obrigatórios ausentes');
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          'Campos obrigatórios ausentes: uuidUsuario, idPapel',
        );
      }

      // Validar que o papel é válido
      if (dados.idPapel !== PAPEL_ADMIN.id && dados.idPapel !== PAPEL_CLIENTE.id) {
        Logger.warn('[associarPapel] Papel inválido', { idPapel: dados.idPapel });
        return RespostaPadrao.enviarErro(resposta, 400, 'Papel inválido. Use 1 (cliente) ou 2 (admin).');
      }

      // Buscar usuário pelo UUID
      const usuarioAlvo = await repositorio.buscarPorUuid(dados.uuidUsuario);
      if (!usuarioAlvo) {
        Logger.warn('[associarPapel] Usuário não encontrado', { uuidUsuario: dados.uuidUsuario });
        return RespostaPadrao.enviarErro(resposta, 404, 'Usuário não encontrado.');
      }

      // Associar papel ao usuário
      await repositorio.associarPapelUsuario(usuarioAlvo.id, dados.idPapel);

      Logger.info('[associarPapel] Papel associado com sucesso', {
        uuidUsuario: dados.uuidUsuario,
        idPapel: dados.idPapel,
      });

      const respostaDto: IRespostaPapelUsuarioDto = {
        sucesso: true,
        mensagem: 'Papel associado ao usuário com sucesso.',
      };

      return RespostaPadrao.enviarSucesso(resposta, 200, respostaDto);
    } catch (erro) {
      Logger.error('[associarPapel] Erro ao associar papel ao usuário', {
        erro: erro instanceof Error ? erro.message : String(erro),
      });
      return RespostaPadrao.enviarErro(resposta, 500, 'Erro ao associar papel ao usuário.');
    }
  }

  /**
   * Remove um papel de um usuário.
   * Requer autenticação e permissão de admin mestre.
   */
  public static async removerPapel(
    requisicao: Request,
    resposta: Response,
  ): Promise<Response> {
    try {
      const dados: IRemoverPapelDto = requisicao.body;
      const repositorio = requisicao.app.locals.repositorioUsuarios as IRepositorioUsuarios;
      const { usuario } = requisicao;

      // Validar que o usuário autenticado é admin mestre
      if (!usuario || !usuario.isAdminMestre) {
        return RespostaPadrao.enviarErro(
          resposta,
          403,
          'Acesso negado. Apenas administradores mestres podem gerenciar papéis de usuários.',
        );
      }

      // Validar campos obrigatórios
      if (!dados.uuidUsuario || !dados.idPapel) {
        Logger.warn('[removerPapel] Campos obrigatórios ausentes');
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          'Campos obrigatórios ausentes: uuidUsuario, idPapel',
        );
      }

      // Validar que o papel é válido
      if (dados.idPapel !== PAPEL_ADMIN.id && dados.idPapel !== PAPEL_CLIENTE.id) {
        Logger.warn('[removerPapel] Papel inválido', { idPapel: dados.idPapel });
        return RespostaPadrao.enviarErro(resposta, 400, 'Papel inválido. Use 1 (cliente) ou 2 (admin).');
      }

      // Buscar usuário pelo UUID
      const usuarioAlvo = await repositorio.buscarPorUuid(dados.uuidUsuario);
      if (!usuarioAlvo) {
        Logger.warn('[removerPapel] Usuário não encontrado', { uuidUsuario: dados.uuidUsuario });
        return RespostaPadrao.enviarErro(resposta, 404, 'Usuário não encontrado.');
      }

      // Verificar se o papel está associado ao usuário
      const papelAssociado = await repositorio.verificarPapelUsuario(usuarioAlvo.id, dados.idPapel);
      if (!papelAssociado) {
        Logger.warn('[removerPapel] Papel não está associado ao usuário', { 
          uuidUsuario: dados.uuidUsuario, 
          idPapel: dados.idPapel 
        });
        return RespostaPadrao.enviarErro(
          resposta,
          404,
          'Papel não encontrado para este usuário.',
        );
      }

      // Verificar se o usuário tem pelo menos um papel além do que está sendo removido
      const temPapeis = usuarioAlvo.papeis.filter((p) => p.id !== dados.idPapel);
      if (temPapeis.length === 0) {
        Logger.warn('[removerPapel] Usuário ficaria sem papéis', { uuidUsuario: dados.uuidUsuario });
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          'Usuário deve ter pelo menos um papel. Não é possível remover o único papel do usuário.',
        );
      }

      // Remover papel do usuário
      await repositorio.removerPapelUsuario(usuarioAlvo.id, dados.idPapel);

      Logger.info('[removerPapel] Papel removido com sucesso', {
        uuidUsuario: dados.uuidUsuario,
        idPapel: dados.idPapel,
      });

      const respostaDto: IRespostaPapelUsuarioDto = {
        sucesso: true,
        mensagem: 'Papel removido do usuário com sucesso.',
      };

      return RespostaPadrao.enviarSucesso(resposta, 200, respostaDto);
    } catch (erro) {
      Logger.error('[removerPapel] Erro ao remover papel do usuário', {
        erro: erro instanceof Error ? erro.message : String(erro),
      });
      return RespostaPadrao.enviarErro(resposta, 500, 'Erro ao remover papel do usuário.');
    }
  }
}
