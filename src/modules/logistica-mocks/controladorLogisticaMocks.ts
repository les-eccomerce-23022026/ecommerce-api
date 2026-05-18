import { Request, Response } from 'express';
import { ServicoMockCorreios } from './servicoMockCorreios';
import { ServicoMockLoggi } from './servicoMockLoggi';
import {
  CalculoFreteRequest,
  CodigoRastreamento,
} from './ILogisticaMocks.dto';

/**
 * Controlador para endpoints mockados de APIs de logística
 * Simula APIs reais de Correios e Loggi
 */
export class ControladorLogisticaMocks {
  constructor(
    private readonly servicoMockCorreios: ServicoMockCorreios,
    private readonly servicoMockLoggi: ServicoMockLoggi,
  ) {}

  /**
   * Endpoint: GET /mock/logistica/correios/rastreamento/:codigo
   * Simula API de rastreamento dos Correios
   */
  public rastrearCorreios = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { codigo } = req.params;
      const resultado = await this.servicoMockCorreios.consultarRastreamento(codigo as CodigoRastreamento);
      return res.status(200).json(resultado);
    } catch (erro: unknown) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao consultar rastreamento Correios';
      return res.status(400).json({ erro: mensagem });
    }
  };

  /**
   * Endpoint: POST /mock/logistica/correios/calcular-frete
   * Simula API de cálculo de frete dos Correios
   */
  public calcularFreteCorreios = async (req: Request, res: Response): Promise<Response> => {
    try {
      const dados = req.body as CalculoFreteRequest;
      const resultado = this.servicoMockCorreios.calcularFrete(dados);
      return res.status(200).json(resultado);
    } catch (erro: unknown) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao calcular frete Correios';
      return res.status(400).json({ erro: mensagem });
    }
  };

  /**
   * Endpoint: GET /mock/logistica/loggi/rastreamento/:trackingCode
   * Simula API de rastreamento da Loggi
   */
  public rastrearLoggi = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { trackingCode } = req.params;
      const resultado = await this.servicoMockLoggi.consultarRastreamento(trackingCode);
      return res.status(200).json(resultado);
    } catch (erro: unknown) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao consultar rastreamento Loggi';
      return res.status(400).json({ erro: mensagem });
    }
  };

  /**
   * Endpoint: POST /mock/logistica/loggi/calcular-frete
   * Simula API de cálculo de frete da Loggi
   */
  public calcularFreteLoggi = async (req: Request, res: Response): Promise<Response> => {
    try {
      const dados = req.body as CalculoFreteRequest;
      const resultado = this.servicoMockLoggi.calcularFrete(dados);
      return res.status(200).json(resultado);
    } catch (erro: unknown) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao calcular frete Loggi';
      return res.status(400).json({ erro: mensagem });
    }
  };

  /**
   * Endpoint: POST /mock/logistica/correios/adicionar-evento
   * Adiciona evento de rastreamento (para simulação/teste)
   */
  public adicionarEventoCorreios = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { codigo, evento } = req.body;
      await this.servicoMockCorreios.adicionarEventoRastreamento(codigo, evento);
      return res.status(200).json({ mensagem: 'Evento adicionado com sucesso' });
    } catch (erro: unknown) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao adicionar evento';
      return res.status(400).json({ erro: mensagem });
    }
  };

  /**
   * Endpoint: POST /mock/logistica/loggi/adicionar-evento
   * Adiciona evento de rastreamento (para simulação/teste)
   */
  public adicionarEventoLoggi = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { trackingCode, status, description, location } = req.body;
      await this.servicoMockLoggi.adicionarEventoRastreamento(trackingCode, status, description, location);
      return res.status(200).json({ mensagem: 'Evento adicionado com sucesso' });
    } catch (erro: unknown) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao adicionar evento';
      return res.status(400).json({ erro: mensagem });
    }
  };
}
