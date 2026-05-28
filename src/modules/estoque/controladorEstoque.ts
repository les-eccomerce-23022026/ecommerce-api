import { Request, Response } from 'express';
import { ServicoEstoque } from './servicoEstoque';
import { RespostaPadrao } from '@/shared/errors/Iresposta-padrao';
import { Logger } from '@/shared/utils/Logger.util';

export class ControladorEstoque {
  constructor(private readonly servico: ServicoEstoque) {}

  listarEstoque = async (_req: Request, res: Response): Promise<void> => {
    try {
      const estoque = await this.servico.listarEstoque();
      RespostaPadrao.enviarSucesso(res, 200, estoque);
    } catch (err: unknown) {
      const msg = RespostaPadrao.obterMensagemErro(err, 'Erro ao listar estoque');
      Logger.error(`[ControladorEstoque.listarEstoque] Erro: ${msg}`, err instanceof Error ? err.stack : String(err));
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };

  listarEstoqueCritico = async (req: Request, res: Response): Promise<void> => {
    try {
      const limite = req.query.limite ? parseInt(req.query.limite as string, 10) : 5;
      const estoqueCritico = await this.servico.listarEstoqueCritico(limite);
      RespostaPadrao.enviarSucesso(res, 200, estoqueCritico);
    } catch (err: unknown) {
      const msg = RespostaPadrao.obterMensagemErro(err, 'Erro ao listar estoque crítico');
      Logger.error(`[ControladorEstoque.listarEstoqueCritico] Erro: ${msg}`, err instanceof Error ? err.stack : String(err));
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };

  obterKpis = async (req: Request, res: Response): Promise<void> => {
    try {
      const limiteParam = req.query.limite ? parseInt(req.query.limite as string, 10) : 5;
      const limiteCritico = isNaN(limiteParam) ? 5 : limiteParam;
      const kpis = await this.servico.obterKpis(limiteCritico);
      RespostaPadrao.enviarSucesso(res, 200, kpis);
    } catch (err: unknown) {
      const msg = RespostaPadrao.obterMensagemErro(err, 'Erro ao obter KPIs de estoque');
      Logger.error(`[ControladorEstoque.obterKpis] Erro: ${msg}`, err instanceof Error ? err.stack : String(err));
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };

  registrarEntrada = async (req: Request, res: Response): Promise<void> => {
    try {
      const dados = req.body;

      if (!dados.livroUuid) {
        RespostaPadrao.enviarErro(res, 400, 'UUID do livro é obrigatório.');
        return;
      }

      if (!dados.quantidade) {
        RespostaPadrao.enviarErro(res, 400, 'Quantidade é obrigatória.');
        return;
      }

      if (!dados.custoUnitario) {
        RespostaPadrao.enviarErro(res, 400, 'Custo unitário é obrigatório.');
        return;
      }

      await this.servico.registrarEntrada({
        livroUuid: dados.livroUuid,
        quantidade: dados.quantidade,
        custoUnitario: dados.custoUnitario,
        fornecedorUuid: dados.fornecedorUuid,
        numeroNotaFiscal: dados.numeroNotaFiscal,
        observacoes: dados.observacoes,
        dataEntrada: dados.dataEntrada ? new Date(dados.dataEntrada) : undefined,
      });

      RespostaPadrao.enviarSucesso(res, 201, { mensagem: 'Entrada de estoque registrada com sucesso.' });
    } catch (err: unknown) {
      const msg = RespostaPadrao.obterMensagemErro(err, 'Erro ao registrar entrada de estoque');
      Logger.error(`[ControladorEstoque.registrarEntrada] Erro: ${msg}`, err instanceof Error ? err.stack : String(err));
      RespostaPadrao.enviarErro(res, 500, msg);
    }
  };
}
