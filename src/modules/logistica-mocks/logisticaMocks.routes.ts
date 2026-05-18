import { Router } from 'express';
import { ControladorLogisticaMocks } from './controladorLogisticaMocks';
import { ServicoMockCorreios } from './servicoMockCorreios';
import { ServicoMockLoggi } from './servicoMockLoggi';

/**
 * Cria o router de mocks de logística com os serviços injetados
 */
export function criarRotasLogisticaMocks(
  servicoMockCorreios: ServicoMockCorreios,
  servicoMockLoggi: ServicoMockLoggi,
) {
  const router = Router();
  const controlador = new ControladorLogisticaMocks(servicoMockCorreios, servicoMockLoggi);

  /**
   * Rotas mockadas para APIs de logística
   * Simulam APIs reais de Correios e Loggi
   */

  // Correios
  router.get('/correios/rastreamento/:codigo', controlador.rastrearCorreios);
  router.post('/correios/calcular-frete', controlador.calcularFreteCorreios);
  router.post('/correios/adicionar-evento', controlador.adicionarEventoCorreios);

  // Loggi
  router.get('/loggi/rastreamento/:trackingCode', controlador.rastrearLoggi);
  router.post('/loggi/calcular-frete', controlador.calcularFreteLoggi);
  router.post('/loggi/adicionar-evento', controlador.adicionarEventoLoggi);

  return router;
}

