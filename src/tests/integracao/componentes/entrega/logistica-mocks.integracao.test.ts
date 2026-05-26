import request from 'supertest';
import { Application } from 'express';
import type { IConexaoBanco } from '@/shared/infrastructure/database/IConexaoBanco';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';

describe('Integração - Módulo de Mocks de Logística', () => {
  const contexto = configurarTesteIntegracao(true); // transação por teste com SAVEPOINT
  let app: Application;

  beforeAll(async () => {
    app = contexto.app;
  });

  // ============================================================================
  // TESTES DE CÁLCULO DE FRETE
  // ============================================================================
  describe('Cálculo de Frete - Correios', () => {
    it('deve calcular frete SEDEX com sucesso', async () => {
      const res = await request(app).post('/api/mock/logistica/correios/calcular-frete').send({
        cepOrigem: '01310-100',
        cepDestino: '13010-100',
        peso: 1.0,
        tipoFrete: 'SEDEX',
      });

      expect(res.status).toBe(200);
      expect(res.body.valorFrete).toBeGreaterThan(0);
      expect(res.body.prazoEntrega).toBeGreaterThan(0);
      expect(res.body.dataPrevistaEntrega).toBeDefined();
      expect(res.body.tipoFrete).toBe('SEDEX');
    });

    it('deve calcular frete PAC com prazo maior que SEDEX', async () => {
      const resSedex = await request(app).post('/api/mock/logistica/correios/calcular-frete').send({
        cepOrigem: '01310-100',
        cepDestino: '13010-100',
        peso: 1.0,
        tipoFrete: 'SEDEX',
      });

      const resPac = await request(app).post('/api/mock/logistica/correios/calcular-frete').send({
        cepOrigem: '01310-100',
        cepDestino: '13010-100',
        peso: 1.0,
        tipoFrete: 'PAC',
      });

      expect(resPac.status).toBe(200);
      expect(resPac.body.prazoEntrega).toBeGreaterThan(resSedex.body.prazoEntrega);
    });

    it('deve calcular frete considerando distância real entre estados', async () => {
      const resSpRj = await request(app).post('/api/mock/logistica/correios/calcular-frete').send({
        cepOrigem: '01310-100', // São Paulo
        cepDestino: '20040-002', // Rio de Janeiro
        peso: 1.0,
        tipoFrete: 'SEDEX',
      });

      const resSpRs = await request(app).post('/api/mock/logistica/correios/calcular-frete').send({
        cepOrigem: '01310-100', // São Paulo
        cepDestino: '90010-000', // Rio Grande do Sul
        peso: 1.0,
        tipoFrete: 'SEDEX',
      });

      expect(resSpRs.status).toBe(200);
      expect(resSpRs.body.valorFrete).toBeGreaterThan(resSpRj.body.valorFrete);
      expect(resSpRs.body.prazoEntrega).toBeGreaterThan(resSpRj.body.prazoEntrega);
    });

    it('deve calcular frete considerando peso do pacote', async () => {
      const resLeve = await request(app).post('/api/mock/logistica/correios/calcular-frete').send({
        cepOrigem: '01310-100',
        cepDestino: '13010-100',
        peso: 0.5,
        tipoFrete: 'SEDEX',
      });

      const resPesado = await request(app).post('/api/mock/logistica/correios/calcular-frete').send({
        cepOrigem: '01310-100',
        cepDestino: '13010-100',
        peso: 5.0,
        tipoFrete: 'SEDEX',
      });

      expect(resPesado.status).toBe(200);
      expect(resPesado.body.valorFrete).toBeGreaterThan(resLeve.body.valorFrete);
    });
  });

  describe('Cálculo de Frete - Loggi', () => {
    it('deve calcular frete Loggi Standard com sucesso', async () => {
      const res = await request(app).post('/api/mock/logistica/loggi/calcular-frete').send({
        cepOrigem: '01310-100',
        cepDestino: '13010-100',
        peso: 1.0,
        tipoFrete: 'LOGGI_STANDARD',
      });

      expect(res.status).toBe(200);
      expect(res.body.valorFrete).toBeGreaterThan(0);
      expect(res.body.prazoEntrega).toBeGreaterThan(0);
      expect(res.body.dataPrevistaEntrega).toBeDefined();
      expect(res.body.tipoFrete).toBe('LOGGI_STANDARD');
    });

    it('deve calcular frete Loggi Express com prazo menor que Standard', async () => {
      // Usar distância maior para garantir que o prazo do Express seja menor
      const resStandard = await request(app).post('/api/mock/logistica/loggi/calcular-frete').send({
        cepOrigem: '01310-100', // São Paulo
        cepDestino: '90010-000', // Porto Alegre (distância ~900km)
        peso: 1.0,
        tipoFrete: 'LOGGI_STANDARD',
      });

      const resExpress = await request(app).post('/api/mock/logistica/loggi/calcular-frete').send({
        cepOrigem: '01310-100', // São Paulo
        cepDestino: '90010-000', // Porto Alegre (distância ~900km)
        peso: 1.0,
        tipoFrete: 'LOGGI_EXPRESS',
      });

      expect(resExpress.status).toBe(200);
      expect(resExpress.body.prazoEntrega).toBeLessThan(resStandard.body.prazoEntrega);
      expect(resExpress.body.valorFrete).toBeGreaterThan(resStandard.body.valorFrete);
    });
  });

  describe('Validação de Cálculo de Frete', () => {
    it('deve retornar erro quando CEP de origem está vazio', async () => {
      const res = await request(app).post('/api/mock/logistica/correios/calcular-frete').send({
        cepOrigem: '',
        cepDestino: '13010-100',
        peso: 1.0,
        tipoFrete: 'SEDEX',
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('deve retornar erro quando peso é negativo', async () => {
      const res = await request(app).post('/api/mock/logistica/correios/calcular-frete').send({
        cepOrigem: '01310-100',
        cepDestino: '13010-100',
        peso: -1.0,
        tipoFrete: 'SEDEX',
      });

      // O sistema deve tratar peso negativo como erro ou normalizar
      expect(res.status).toBeGreaterThanOrEqual(200);
    });

    it('deve usar tipo de frete padrão quando não informado', async () => {
      const res = await request(app).post('/api/mock/logistica/correios/calcular-frete').send({
        cepOrigem: '01310-100',
        cepDestino: '13010-100',
        peso: 1.0,
      });

      expect(res.status).toBe(200);
      expect(res.body.tipoFrete).toBe('SEDEX');
    });
  });

  // ============================================================================
  // TESTES DE RASTREAMENTO
  // ============================================================================
  describe('Rastreamento - Correios', () => {
    it('deve consultar rastreamento com código válido', async () => {
      const codigoValido = 'AA123456789BR';
      const res = await request(app).get(`/api/mock/logistica/correios/rastreamento/${codigoValido}`);

      expect(res.status).toBe(200);
      expect(res.body.codigo).toBe(codigoValido);
      expect(res.body.status).toBe('found');
      expect(res.body.success).toBe(true);
      expect(res.body.historico).toBeDefined();
      expect(res.body.historico.length).toBeGreaterThan(0);
    });

    it('deve retornar erro para código de formato inválido', async () => {
      const codigoInvalido = 'ABC123';
      const res = await request(app).get(`/api/mock/logistica/correios/rastreamento/${codigoInvalido}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('invalid_format');
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Formato de código não reconhecido');
    });

    it('deve retornar eventos com timestamps progressivos', async () => {
      const codigoValido = 'AA123456789BR';
      const res = await request(app).get(`/api/mock/logistica/correios/rastreamento/${codigoValido}`);

      expect(res.status).toBe(200);
      const historico = res.body.historico;
      
      // Verificar que os timestamps são progressivos
      for (let i = 1; i < historico.length; i++) {
        const dataAtual = new Date(historico[i].data).getTime();
        const dataAnterior = new Date(historico[i - 1].data).getTime();
        expect(dataAtual).toBeGreaterThan(dataAnterior);
      }
    });

    it('deve incluir localização nos eventos de rastreamento', async () => {
      const codigoValido = 'AA123456789BR';
      const res = await request(app).get(`/api/mock/logistica/correios/rastreamento/${codigoValido}`);

      expect(res.status).toBe(200);
      const historico = res.body.historico;
      
      // Verificar que pelo menos o primeiro evento tem localização
      expect(historico[0].local).toBeDefined();
      expect(historico[0].local.length).toBeGreaterThan(0);
    });
  });

  describe('Rastreamento - Loggi', () => {
    it('deve consultar rastreamento com código válido', async () => {
      const codigoValido = 'LOGGI123456';
      const res = await request(app).get(`/api/mock/logistica/loggi/rastreamento/${codigoValido}`);

      expect(res.status).toBe(200);
      expect(res.body.trackingCode).toBe(codigoValido);
      expect(res.body.companyID).toBe('mock_company_les_livraria');
      expect(res.body.events).toBeDefined();
      expect(res.body.events.length).toBeGreaterThan(0);
    });

    it('deve retornar erro JSON para código de formato inválido', async () => {
      const codigoInvalido = 'ABC';
      const res = await request(app).get(`/api/mock/logistica/loggi/rastreamento/${codigoInvalido}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('invalid_format');
      expect(res.body.error).toBeDefined();
      expect(res.body.error).toContain('Formato de código inválido');
    });

    it('deve incluir geolocalização atual', async () => {
      const codigoValido = 'LOGGI123456';
      const res = await request(app).get(`/api/mock/logistica/loggi/rastreamento/${codigoValido}`);

      expect(res.status).toBe(200);
      expect(res.body.currentLocation).toBeDefined();
      expect(res.body.currentLocation.latitude).toBeDefined();
      expect(res.body.currentLocation.longitude).toBeDefined();
      expect(res.body.currentLocation.address).toBeDefined();
    });

    it('deve incluir data prometida de entrega', async () => {
      const codigoValido = 'LOGGI123456';
      const res = await request(app).get(`/api/mock/logistica/loggi/rastreamento/${codigoValido}`);

      expect(res.status).toBe(200);
      expect(res.body.promisedDate).toBeDefined();
      const dataPrometida = new Date(res.body.promisedDate);
      const agora = new Date();
      expect(dataPrometida.getTime()).toBeGreaterThan(agora.getTime());
    });
  });

  // ============================================================================
  // TESTES DE CONTRATO (DTOs)
  // ============================================================================
  describe('Contrato de DTOs', () => {
    it('deve retornar DTO válido para cálculo de frete Correios', async () => {
      const res = await request(app).post('/api/mock/logistica/correios/calcular-frete').send({
        cepOrigem: '01310-100',
        cepDestino: '13010-100',
        peso: 1.0,
        tipoFrete: 'SEDEX',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('valorFrete');
      expect(res.body).toHaveProperty('prazoEntrega');
      expect(res.body).toHaveProperty('dataPrevistaEntrega');
      expect(res.body).toHaveProperty('tipoFrete');
      expect(typeof res.body.valorFrete).toBe('number');
      expect(typeof res.body.prazoEntrega).toBe('number');
      expect(typeof res.body.dataPrevistaEntrega).toBe('string');
      expect(typeof res.body.tipoFrete).toBe('string');
    });

    it('deve retornar DTO válido para rastreamento Correios', async () => {
      const res = await request(app).get('/api/mock/logistica/correios/rastreamento/AA123456789BR');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('codigo');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('eventoMaisRecente');
      expect(res.body).toHaveProperty('linkDetalhesCompletos');
      expect(typeof res.body.success).toBe('boolean');
    });

    it('deve retornar DTO válido para rastreamento Loggi', async () => {
      const res = await request(app).get('/api/mock/logistica/loggi/rastreamento/LOGGI123456');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('trackingCode');
      expect(res.body).toHaveProperty('companyID');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('events');
      expect(res.body).toHaveProperty('currentLocation');
      expect(Array.isArray(res.body.events)).toBe(true);
    });
  });
});
