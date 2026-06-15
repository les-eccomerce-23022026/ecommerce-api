import { Request, Response } from 'express';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';
import { Logger } from '@/shared/utils/Logger.util';
import { RepositorioLojasPostgres } from './repositorioLojasPostgres';
import { ServicoLojas, LojaNaoEncontradaError } from './servicoLojas';
import { ConexaoPostgres } from '@/shared/infrastructure/database/ConexaoPostgres';
import { IFiltrosListarLojasDto, IAtualizarLojaDto } from './Iloja.dto';

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
        slug: dados.slug,
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
        uuid: lojaCriada.uuid,
      });

      return RespostaPadrao.enviarSucesso(resposta, 201, lojaCriada);
    } catch (erro) {
      Logger.error('[criarLoja] Erro ao criar loja', {
        erro: erro instanceof Error ? erro.message : String(erro),
      });
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao criar loja.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Lista lojas com filtros e paginação opcionais.
   * Query params: nome, cnpj, ativo, pagina, limite
   */
  public static async listarLojas(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      Logger.info('[listarLojas] Listando lojas no controlador');

      const { nome, cnpj, ativo, pagina, limite } = requisicao.query;

      const filtros: IFiltrosListarLojasDto = {};

      if (typeof nome === 'string' && nome.trim()) {
        filtros.nome = nome.trim();
      }

      if (typeof cnpj === 'string' && cnpj.trim()) {
        filtros.cnpj = cnpj.trim();
      }

      if (typeof ativo === 'string') {
        filtros.ativo = ativo === 'true';
      }

      if (typeof pagina === 'string' && pagina.trim()) {
        const paginaNum = parseInt(pagina, 10);
        if (!isNaN(paginaNum) && paginaNum > 0) {
          filtros.pagina = paginaNum;
        }
      }

      if (typeof limite === 'string' && limite.trim()) {
        const limiteNum = parseInt(limite, 10);
        if (!isNaN(limiteNum) && limiteNum > 0) {
          filtros.limite = limiteNum;
        }
      }

      const resultado = await servicoLojas.listarLojas(filtros);
      return RespostaPadrao.enviarSucesso(resposta, 200, resultado);
    } catch (erro) {
      Logger.error('[listarLojas] Erro ao listar lojas', {
        erro: erro instanceof Error ? erro.message : String(erro),
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
        erro: erro instanceof Error ? erro.message : String(erro),
      });
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao buscar loja.');
      return RespostaPadrao.enviarErro(resposta, 500, mensagem);
    }
  }

  /**
   * Atualiza campos da loja (partial update).
   * PATCH /api/admin/lojas/:uuid
   */
  public static async atualizarLoja(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const { uuid } = requisicao.params;

      if (!uuid || !uuid.trim()) {
        return RespostaPadrao.enviarErro(resposta, 400, 'UUID da loja é obrigatório.');
      }

      const { nome, cnpj, ativo } = requisicao.body ?? {};

      const dados: IAtualizarLojaDto = {};

      if (nome !== undefined) {
        if (typeof nome !== 'string' || !nome.trim()) {
          return RespostaPadrao.enviarErro(resposta, 400, 'Campo "nome" inválido.');
        }
        dados.nome = nome.trim();
      }

      if (cnpj !== undefined) {
        if (typeof cnpj !== 'string') {
          return RespostaPadrao.enviarErro(resposta, 400, 'Campo "cnpj" inválido.');
        }
        dados.cnpj = cnpj.trim();
      }

      if (ativo !== undefined) {
        if (typeof ativo !== 'boolean') {
          return RespostaPadrao.enviarErro(resposta, 400, 'Campo "ativo" deve ser booleano.');
        }
        dados.ativo = ativo;
      }

      if (Object.keys(dados).length === 0) {
        return RespostaPadrao.enviarErro(resposta, 400, 'Nenhum campo informado para atualização.');
      }

      Logger.info('[atualizarLoja] Atualizando loja no controlador', { uuid });

      const lojaAtualizada = await servicoLojas.atualizarLoja(uuid, dados);

      Logger.info('[atualizarLoja] Loja atualizada com sucesso no controlador', { uuid });

      return RespostaPadrao.enviarSucesso(resposta, 200, lojaAtualizada);
    } catch (erro) {
      Logger.error('[atualizarLoja] Erro ao atualizar loja', {
        erro: erro instanceof Error ? erro.message : String(erro),
      });

      if (erro instanceof LojaNaoEncontradaError) {
        return RespostaPadrao.enviarErro(resposta, 404, erro.message);
      }

      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao atualizar loja.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
    }
  }

  /**
   * Inativa ou reativa uma loja.
   * PATCH /api/admin/lojas/:uuid/inativar
   */
  public static async inativarLoja(requisicao: Request, resposta: Response): Promise<Response> {
    try {
      const { uuid } = requisicao.params;

      if (!uuid || !uuid.trim()) {
        return RespostaPadrao.enviarErro(resposta, 400, 'UUID da loja é obrigatório.');
      }

      const { ativo } = requisicao.body ?? {};

      if (typeof ativo !== 'boolean') {
        return RespostaPadrao.enviarErro(resposta, 400, 'Campo "ativo" é obrigatório e deve ser booleano.');
      }

      Logger.info('[inativarLoja] Alterando status da loja no controlador', { uuid, ativo });

      const lojaAtualizada = await servicoLojas.inativarLoja(uuid, ativo);

      Logger.info('[inativarLoja] Status da loja alterado com sucesso no controlador', { uuid, ativo });

      return RespostaPadrao.enviarSucesso(resposta, 200, lojaAtualizada);
    } catch (erro) {
      Logger.error('[inativarLoja] Erro ao alterar status da loja', {
        erro: erro instanceof Error ? erro.message : String(erro),
      });

      if (erro instanceof LojaNaoEncontradaError) {
        return RespostaPadrao.enviarErro(resposta, 404, erro.message);
      }

      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao alterar status da loja.');
      return RespostaPadrao.enviarErro(resposta, 400, mensagem);
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
        papel,
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
        lojaId,
      });

      return RespostaPadrao.enviarSucesso(resposta, 200, { mensagem: 'Administrador associado à loja com sucesso.' });
    } catch (erro) {
      Logger.error('[associarAdminALoja] Erro ao associar admin à loja', {
        erro: erro instanceof Error ? erro.message : String(erro),
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
        quantidade: lojas.length,
      });

      return RespostaPadrao.enviarSucesso(resposta, 200, lojas);
    } catch (erro) {
      Logger.error('[obterMinhasLojas] Erro ao obter lojas do administrador', {
        erro: erro instanceof Error ? erro.message : String(erro),
      });
      const mensagem = RespostaPadrao.obterMensagemErro(erro, 'Erro ao obter lojas do administrador.');
      return RespostaPadrao.enviarErro(resposta, 500, mensagem);
    }
  }
}
