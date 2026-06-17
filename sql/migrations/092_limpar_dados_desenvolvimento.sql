-- Migration: 092_limpar_dados_desenvolvimento.sql
-- Descrição: Limpa dados excessivos de desenvolvimento para manter apenas 2 clientes e 1 admin de loja
-- Ambiente: Desenvolvimento
-- Autor: Cascade AI
-- Data: 2026-06-08

BEGIN;

-- ============================================
-- PASSO 1: Limpar dados de testes e demos
-- ============================================

-- Remover clientes demo (demo.cliente01@les.demo.br até demo.cliente30@les.demo.br)
DELETE FROM livraria_gestao.usuario_papeis
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE usu_email LIKE 'demo.cliente%@les.demo.br'
);

DELETE FROM livraria_gestao.clientes
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE usu_email LIKE 'demo.cliente%@les.demo.br'
);

DELETE FROM livraria_gestao.enderecos
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE usu_email LIKE 'demo.cliente%@les.demo.br'
);

DELETE FROM livraria_gestao.telefones
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE usu_email LIKE 'demo.cliente%@les.demo.br'
);

DELETE FROM livraria_financeiro.cartoes
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE usu_email LIKE 'demo.cliente%@les.demo.br'
);

DELETE FROM livraria_gestao.usuarios
WHERE usu_email LIKE 'demo.cliente%@les.demo.br';

-- Remover clientes de teste temporários
DELETE FROM livraria_gestao.usuario_papeis
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE usu_email LIKE 'teste.%@email.com'
);

DELETE FROM livraria_gestao.clientes
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE usu_email LIKE 'teste.%@email.com'
);

DELETE FROM livraria_gestao.enderecos
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE usu_email LIKE 'teste.%@email.com'
);

DELETE FROM livraria_gestao.telefones
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE usu_email LIKE 'teste.%@email.com'
);

DELETE FROM livraria_financeiro.cartoes
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE usu_email LIKE 'teste.%@email.com'
);

DELETE FROM livraria_gestao.usuarios
WHERE usu_email LIKE 'teste.%@email.com';

-- Remover admins de sistema
DELETE FROM livraria_gestao.admin_lojas
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE pap_id IN (SELECT pap_id FROM livraria_gestao.papeis WHERE pap_descricao = 'admin_sistema')
);

DELETE FROM livraria_gestao.usuario_papeis
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE pap_id IN (SELECT pap_id FROM livraria_gestao.papeis WHERE pap_descricao = 'admin_sistema')
);

DELETE FROM livraria_gestao.usuarios
WHERE pap_id IN (SELECT pap_id FROM livraria_gestao.papeis WHERE pap_descricao = 'admin_sistema');

-- Remover admins de loja excessivos (manter apenas 1)
DELETE FROM livraria_gestao.admin_lojas
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE pap_id IN (SELECT pap_id FROM livraria_gestao.papeis WHERE pap_descricao = 'admin')
  AND usu_email NOT IN ('admin_loja@livraria.com.br')
);

DELETE FROM livraria_gestao.usuario_papeis
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE pap_id IN (SELECT pap_id FROM livraria_gestao.papeis WHERE pap_descricao = 'admin')
  AND usu_email NOT IN ('admin_loja@livraria.com.br')
);

DELETE FROM livraria_gestao.usuarios
WHERE pap_id IN (SELECT pap_id FROM livraria_gestao.papeis WHERE pap_descricao = 'admin')
AND usu_email NOT IN ('admin_loja@livraria.com.br');

-- Remover clientes excessivos (manter apenas 2)
DELETE FROM livraria_gestao.usuario_papeis
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE pap_id IN (SELECT pap_id FROM livraria_gestao.papeis WHERE pap_descricao = 'cliente')
  AND usu_email NOT IN ('cliente1@livraria.com.br', 'cliente2@livraria.com.br')
);

DELETE FROM livraria_gestao.clientes
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE pap_id IN (SELECT pap_id FROM livraria_gestao.papeis WHERE pap_descricao = 'cliente')
  AND usu_email NOT IN ('cliente1@livraria.com.br', 'cliente2@livraria.com.br')
);

DELETE FROM livraria_gestao.enderecos
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE pap_id IN (SELECT pap_id FROM livraria_gestao.papeis WHERE pap_descricao = 'cliente')
  AND usu_email NOT IN ('cliente1@livraria.com.br', 'cliente2@livraria.com.br')
);

DELETE FROM livraria_gestao.telefones
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE pap_id IN (SELECT pap_id FROM livraria_gestao.papeis WHERE pap_descricao = 'cliente')
  AND usu_email NOT IN ('cliente1@livraria.com.br', 'cliente2@livraria.com.br')
);

DELETE FROM livraria_financeiro.cartoes
WHERE usu_id IN (
  SELECT usu_id FROM livraria_gestao.usuarios
  WHERE pap_id IN (SELECT pap_id FROM livraria_gestao.papeis WHERE pap_descricao = 'cliente')
  AND usu_email NOT IN ('cliente1@livraria.com.br', 'cliente2@livraria.com.br')
);

DELETE FROM livraria_gestao.usuarios
WHERE pap_id IN (SELECT pap_id FROM livraria_gestao.papeis WHERE pap_descricao = 'cliente')
AND usu_email NOT IN ('cliente1@livraria.com.br', 'cliente2@livraria.com.br');

-- Remover lojas excessivas (manter apenas 1)
DELETE FROM livraria_comercial.estoques
WHERE loj_id NOT IN (
  SELECT loj_id FROM livraria_gestao.lojas
  WHERE loj_slug = 'livraria-padrao'
);

DELETE FROM livraria_gestao.lojas
WHERE loj_slug NOT IN ('livraria-padrao');

COMMIT;
