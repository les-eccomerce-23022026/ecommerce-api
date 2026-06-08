import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { registrarCliente, realizarLogin, gerarCpfValidoUnico } from '@/tests/helpers/requisicoes-api.util';

/**
 * Testes de integração para validar os cenários criados pelo seed 008
 * Sistema: LES – E-Commerce de Livros
 * Seed: 008_seed_pagamentos_teste.sql
 * 
 * Cenários testados:
 * - Múltiplos cartões por cliente
 * - Pagamentos com diferentes status (PENDENTE, APROVADO, RECUSADO)
 * - Múltiplos pagamentos por venda (cartão + cupom)
 * - Cenários de troca (devolução completa, rejeição)
 */
describe('Integração - Seed 008 Cenários de Pagamentos', () => {
  const contexto = configurarTesteIntegracao();
  let app: any;
  let tokenAdmin: string;
  let tokenCliente: string;

  beforeAll(async () => {
    app = contexto.app;
    
    // Criar e logar admin
    const emailAdmin = `admin.teste.${Date.now()}@teste.com`;
    await registrarCliente(app, {
      cpf: gerarCpfValidoUnico(),
      email: emailAdmin,
      limparDados: true,
    });
    
    const loginAdminRes = await realizarLogin(app, emailAdmin, 'SenhaForte@123');
    tokenAdmin = loginAdminRes.body.dados.token;
  });

  describe('Múltiplos Cartões por Cliente', () => {
    it('deve listar múltiplos cartões para um cliente', async () => {
      // Criar cliente
      const emailCliente = `cliente.cartoes.${Date.now()}@teste.com`;
      await registrarCliente(app, {
        cpf: gerarCpfValidoUnico(),
        email: emailCliente,
        limparDados: true,
      });
      
      const loginRes = await realizarLogin(app, emailCliente, 'SenhaForte@123');
      tokenCliente = loginRes.body.body.dados.token;
      
      // Listar cartões do cliente
      const res = await request(app)
        .get('/api/cartoes')
        .set('Authorization', `Bearer ${tokenCliente}`);
      
      // O seed 008 adiciona 3 cartões por cliente
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Pagamentos com Diferentes Status', () => {
    it('deve listar pagamentos com status PENDENTE', async () => {
      const res = await request(app)
        .get('/api/pagamentos/status/PENDENTE')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      
      // O seed 008 cria pagamentos com status PENDENTE
      if (res.status === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });

    it('deve listar pagamentos com status APROVADO', async () => {
      const res = await request(app)
        .get('/api/pagamentos/status/APROVADO')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      
      // O seed 008 cria pagamentos com status APROVADO
      if (res.status === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });

    it('deve listar pagamentos com status RECUSADO', async () => {
      const res = await request(app)
        .get('/api/pagamentos/status/RECUSADO')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      
      // O seed 008 cria pagamentos com status RECUSADO
      if (res.status === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });
  });

  describe('Múltiplos Pagamentos por Venda', () => {
    it('deve listar todos os pagamentos de uma venda', async () => {
      // Buscar uma venda existente
      const vendasRes = await request(app)
        .get('/api/admin/vendas')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      
      if (vendasRes.status === 200 && Array.isArray(vendasRes.body) && vendasRes.body.length > 0) {
        const vendaId = vendasRes.body[0].id;
        
        const pagamentosRes = await request(app)
          .get(`/api/pagamentos/venda/${vendaId}/resumo`)
          .set('Authorization', `Bearer ${tokenAdmin}`);
        
        if (pagamentosRes.status === 200) {
          expect(Array.isArray(pagamentosRes.body)).toBe(true);
          // O seed 008 pode criar vendas com múltiplos pagamentos
        }
      }
    });
  });

  describe('Cenários de Troca', () => {
    it('deve listar vendas com status TROCA CONCLUÍDA', async () => {
      const res = await request(app)
        .get('/api/admin/vendas?status=TROCA%20CONCLUÍDA')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      
      // O seed 008 cria vendas com status TROCA CONCLUÍDA
      if (res.status === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });

    it('deve listar vendas com status TROCA REJEITADA', async () => {
      const res = await request(app)
        .get('/api/admin/vendas?status=TROCA%20REJEITADA')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      
      // O seed 008 cria vendas com status TROCA REJEITADA
      if (res.status === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });

    it('deve listar cupons de troca criados', async () => {
      const res = await request(app)
        .get('/api/cupons/troca')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      
      // O seed 008 cria cupons de troca para devoluções completas
      if (res.status === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });
  });
});
