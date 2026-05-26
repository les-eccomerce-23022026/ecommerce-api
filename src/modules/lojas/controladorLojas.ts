import { Request, Response } from 'express';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';
import { Logger } from '@/shared/utils/Logger.util';
import { RepositorioLojasPostgres } from './repositorioLojasPostgres';
import { ServicoLojas } from './servicoLojas';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';

const db = ConexaoPostgres.obterInstancia();
const repositorioLojas = new RepositorioLojasPostgres(db);
const servicoLojas = new ServicoLojas(repositorioLojas);

/**
 * Controller responsável pelas operações de lojas.
 */
export class ControladorLojas {
  /**
   * Cria uma nova loja.
   */
  public static async criarLoja(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const dados = requisicao.body ?? {};
      
      Logger.info('[criarLoja] Iniciando criação de loja no controlador', { 
        nome: dados.nome, 
        slug: dados.slug 
      });

      const camposObrigatorios = ['nome', 'slug', 'cnpj'];
      const faltando = camposObrigatorios.filter((campo) => !dados[campo]);

      if (faltando.length > 0) {
        Logger.warn('[criarLoja] Campos obrigatórios ausentes', { faltando });
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          `Campos obrigatórios ausentes: ${faltando.join(', ')}`,
        );
      }

      const lojaCriada = await servicoLojas.criarLoja(dados);

      Logger.info('[criarLoja] Loja criada com sucesso no controlador', { 
        uuid: lojaCriada.uuid 
      });

      return RespostaPadrao.enviarSucesso(resposta, 201, lojaCriada);
    } catch (erro) {
      Logger.error('[criarLoja] Erro ao criar loja', { 
        erro: erro instanceof Error ? erro.message : String(erro) 
      });
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao criar loja.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Lista todas as lojas.
   */
  public static async listarLojas(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      Logger.info('[listarLojas] Listando todas as lojas no controlador');
      const lojas = await servicoLojas.listarLojas();
      return RespostaPadrao.enviarSucesso(resposta, 200, lojas);
    } catch (erro) {
      Logger.error('[listarLojas] Erro ao listar lojas', { 
        erro: erro instanceof Error ? erro.message : String(erro) 
      });
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao listar lojas.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Obtém informações da loja por UUID (rota pública para tenante).
   * Ex: GET /api/loja/tenante/:loj_uuid
   */
  public static async obterLojaPorUuid(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const { loj_uuid } = requisicao.params;
      
      Logger.info('[obterLojaPorUuid] Buscando loja por UUID', { loj_uuid });
      
      const loja = await servicoLojas.obterPorUuid(loj_uuid);
      
      if (!loja) {
        Logger.warn('[obterLojaPorUuid] Loja não encontrada', { loj_uuid });
        return RespostaPadrao.enviarErro(resposta, 404, 'Loja não encontrada.');
      }
      
      return RespostaPadrao.enviarSucesso(resposta, 200, loja);
    } catch (erro) {
      Logger.error('[obterLojaPorUuid] Erro ao buscar loja', { 
        erro: erro instanceof Error ? erro.message : String(erro) 
      });
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao buscar loja.');
      return RespostaPadrao.enviarErro(resposta, 500, mensagem);
    }
  }

  /**
   * Associa administrador a loja.
   */
  public static async associarAdminALoja(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const { usuarioId, lojaId, papel } = requisicao.body ?? {};
      
      Logger.info('[associarAdminALoja] Associando admin à loja no controlador', { 
        usuarioId, 
        lojaId, 
        papel 
      });

      const camposObrigatorios = ['usuarioId', 'lojaId'];
      const faltando = camposObrigatorios.filter((campo) => !requisicao.body[campo]);

      if (faltando.length > 0) {
        Logger.warn('[associarAdminALoja] Campos obrigatórios ausentes', { faltando });
        return RespostaPadrao.enviarErro(
          resposta,
          400,
          `Campos obrigatórios ausentes: ${faltando.join(', ')}`,
        );
      }

      await servicoLojas.associarAdminALoja(usuarioId, lojaId, papel);

      Logger.info('[associarAdminALoja] Admin associado à loja com sucesso no controlador', { 
        usuarioId, 
        lojaId 
      });

      return RespostaPadrao.enviarSucesso(resposta, 200, { mensagem: 'Administrador associado à loja com sucesso.' });
    } catch (erro) {
      Logger.error('[associarAdminALoja] Erro ao associar admin à loja', { 
        erro: erro instanceof Error ? erro.message : String(erro) 
      });
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao associar administrador à loja.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Obtém as lojas do administrador autenticado.
   * Endpoint: GET /api/admin/lojas/minhas-lojas
   */
  public static async obterMinhasLojas(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const usuarioAutenticado = requisicao.usuario;

      if (!usuarioAutenticado) {
        Logger.warn('[obterMinhasLojas] Usuário não autenticado');
        return RespostaPadrao.enviarErro(resposta, 401, 'Usuário não autenticado.');
      }

      const usuarioId = usuarioAutenticado.id;

      Logger.info('[obterMinhasLojas] Buscando lojas do administrador', { usuarioId });

      const lojas = await servicoLojas.buscarLojasDoAdmin(usuarioId);

      Logger.info('[obterMinhasLojas] Lojas do administrador obtidas com sucesso', { 
        usuarioId,
        quantidade: lojas.length
      });

      return RespostaPadrao.enviarSucesso(resposta, 200, lojas);
    } catch (erro) {
      Logger.error('[obterMinhasLojas] Erro ao obter lojas do administrador', { 
        erro: erro instanceof Error ? erro.message : String(erro) 
      });
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao obter lojas do administrador.');
      return RespostaPadrao.enviarErro(resposta, 500, mensagem);
    }
  }
}
