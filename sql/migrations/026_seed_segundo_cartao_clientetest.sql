-- Migration: 026_seed_segundo_cartao_clientetest.sql
-- Cartões salvos para clientetest@email.com (split / E2E Cypress com API real).
-- Visa ****0002 (principal) + Mastercard ****4444 — idempotente por crt_final.

INSERT INTO livraria_financeiro.cartoes (usu_id, ban_id, crt_token, crt_final, crt_nome_impresso, crt_validade, crt_principal)
SELECT u.usu_id,
       (SELECT ban_id FROM livraria_financeiro.bandeiras_cartao WHERE ban_descricao = 'Visa' LIMIT 1),
       'tok_sim_e2e_primeiro_cartao_visa0002',
       '0002',
       'CLIENTE TESTE VISA',
       DATE '2029-06-01',
       TRUE
FROM livraria_gestao.usuarios u
WHERE u.usu_email = 'clientetest@email.com'
  AND NOT EXISTS (
    SELECT 1 FROM livraria_financeiro.cartoes c2 WHERE c2.usu_id = u.usu_id AND c2.crt_final = '0002'
  );

INSERT INTO livraria_financeiro.cartoes (usu_id, ban_id, crt_token, crt_final, crt_nome_impresso, crt_validade, crt_principal)
SELECT u.usu_id,
       2,
       'tok_sim_e2e_segundo_cartao_mc4444',
       '4444',
       'CLIENTE TESTE MC',
       DATE '2029-06-01',
       FALSE
FROM livraria_gestao.usuarios u
WHERE u.usu_email = 'clientetest@email.com'
  AND NOT EXISTS (
    SELECT 1 FROM livraria_financeiro.cartoes c2 WHERE c2.usu_id = u.usu_id AND c2.crt_final = '4444'
  );
