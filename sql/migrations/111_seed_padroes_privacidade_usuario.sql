-- Migration: Seed padrões de privacidade — acesso a dados de outros usuários
-- Descrição: Adiciona padrões blacklist para rejeitar perguntas sobre
--            dados pessoais de outros usuários (histórico, pedidos, conta).
-- Relacionado à: Problema 2 — IA aceita perguntas sobre dados de terceiros

BEGIN;

INSERT INTO livraria_comercial.padroes_validacao_ia (pai_padrao, pai_tipo, pai_origem)
VALUES
  ('historico de compras do usuario', 'blacklist', 'manual'),
  ('historico de compras do cliente', 'blacklist', 'manual'),
  ('histórico de compras do usuário', 'blacklist', 'manual'),
  ('histórico de compras do cliente', 'blacklist', 'manual'),
  ('compras do usuario', 'blacklist', 'manual'),
  ('compras do cliente', 'blacklist', 'manual'),
  ('pedidos do usuario', 'blacklist', 'manual'),
  ('pedidos do cliente', 'blacklist', 'manual'),
  ('dados do usuario', 'blacklist', 'manual'),
  ('dados do cliente', 'blacklist', 'manual'),
  ('informacoes do usuario', 'blacklist', 'manual'),
  ('informacoes do cliente', 'blacklist', 'manual'),
  ('informações do usuário', 'blacklist', 'manual'),
  ('informações do cliente', 'blacklist', 'manual'),
  ('conta do usuario', 'blacklist', 'manual'),
  ('conta do cliente', 'blacklist', 'manual'),
  ('perfil do usuario', 'blacklist', 'manual'),
  ('perfil do cliente', 'blacklist', 'manual')
ON CONFLICT (pai_padrao) DO NOTHING;

INSERT INTO livraria_comercial.padroes_validacao_ia (pai_padrao, pai_tipo, pai_origem)
VALUES
  -- variações com pronomes e identificadores
  ('seus pedidos', 'blacklist', 'manual'),
  ('seus dados', 'blacklist', 'manual'),
  ('suas compras', 'blacklist', 'manual'),
  ('pedidos dele', 'blacklist', 'manual'),
  ('compras dele', 'blacklist', 'manual'),
  ('dados dele', 'blacklist', 'manual'),
  ('pedidos dela', 'blacklist', 'manual'),
  ('compras dela', 'blacklist', 'manual'),
  ('pedidos do email', 'blacklist', 'manual'),
  ('compras do email', 'blacklist', 'manual'),
  ('historico do email', 'blacklist', 'manual'),
  ('histórico do email', 'blacklist', 'manual'),
  ('pedidos do cpf', 'blacklist', 'manual'),
  ('dados do cpf', 'blacklist', 'manual')
ON CONFLICT (pai_padrao) DO NOTHING;

COMMIT;
