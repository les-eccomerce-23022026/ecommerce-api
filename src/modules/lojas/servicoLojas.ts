import { RepositorioLojasPostgres } from './repositorioLojasPostgres';
import { ICriarLojaDto, IRespostaLojaCriadaDto, IListaLojaDto } from './Iloja.dto';
import { Logger } from '@/shared/utils/Logger.util';

/**
 * Serviço responsável pela lógica de negócio de lojas.
 */
export class ServicoLojas {
  private readonly repositorioLojas: RepositorioLojasPostgres;

  constructor(repositorioLojas: RepositorioLojasPostgres) {
    this.repositorioLojas = repositorioLojas;
  }

  /**
   * Cria uma nova loja.
   */
  public async criarLoja(dados: ICriarLojaDto): Promise<IRespostaLojaCriadaDto> {
    Logger.info('[criarLoja] Iniciando criação de loja no serviço', { nome: dados.nome, slug: dados.slug });

    // Validar slug (deve ser único)
    const lojaExistente = await this.repositorioLojas.buscarPorSlug(dados.slug);
    if (lojaExistente) {
      Logger.warn('[criarLoja] Slug já existe', { slug: dados.slug });
      throw new Error('Slug já está em uso por outra loja.');
    }

    const lojaCriada = await this.repositorioLojas.criarLoja(dados);

    Logger.info('[criarLoja] Loja criada com sucesso no serviço', { uuid: lojaCriada.uuid });
    
    return {
      uuid: lojaCriada.uuid,
      nome: lojaCriada.nome,
      slug: lojaCriada.slug,
      cnpj: lojaCriada.cnpj,
      ativo: lojaCriada.ativo,
    };
  }

  /**
   * Lista todas as lojas.
   */
  public async listarLojas(): Promise<IListaLojaDto[]> {
    Logger.info('[listarLojas] Listando todas as lojas');
    return await this.repositorioLojas.listarLojas();
  }

  /**
   * Obtém loja por UUID (para rota pública de tenante).
   */
  public async obterPorUuid(loj_uuid: string): Promise<IListaLojaDto | null> {
    Logger.info('[obterPorUuid] Buscando loja por UUID', { loj_uuid });
    return await this.repositorioLojas.obterPorUuid(loj_uuid);
  }

  /**
   * Resolve identificador de loja (ID interno ou UUID) para o bigint usado em admin_lojas.
   */
  public async resolverLojaIdInterno(lojaId: number | string): Promise<number> {
    if (typeof lojaId === 'number' && Number.isFinite(lojaId)) {
      return lojaId;
    }

    const lojaUuid = String(lojaId ?? '').trim();
    if (!lojaUuid) {
      throw new Error('Identificador da loja é obrigatório.');
    }

    const idInterno = await this.repositorioLojas.obterIdInternoPorUuid(lojaUuid);
    if (idInterno === null) {
      throw new Error(`Loja não encontrada: ${lojaUuid}`);
    }

    return idInterno;
  }

  /**
   * Associa administrador a loja.
   */
  public async associarAdminALoja(usuarioId: number, lojaId: number | string, papel?: string): Promise<void> {
    const lojaIdInterno = await this.resolverLojaIdInterno(lojaId);
    Logger.info('[associarAdminALoja] Associando admin à loja no serviço', { usuarioId, lojaId: lojaIdInterno });
    await this.repositorioLojas.associarAdminALoja(usuarioId, lojaIdInterno, papel);
    Logger.info('[associarAdminALoja] Admin associado à loja com sucesso no serviço', { usuarioId, lojaId: lojaIdInterno });
  }

  /**
   * Busca lojas de um administrador.
   */
  public async buscarLojasDoAdmin(usuarioId: number): Promise<IListaLojaDto[]> {
    Logger.info('[buscarLojasDoAdmin] Buscando lojas do admin', { usuarioId });
    return await this.repositorioLojas.buscarLojasDoAdmin(usuarioId);
  }
}
