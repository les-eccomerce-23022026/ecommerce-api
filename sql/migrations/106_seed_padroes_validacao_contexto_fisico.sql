-- Migration: Seed de padrões de contexto físico que inviabilizam a leitura
-- Descrição: Adiciona padrões 'impossivel' para contextos que escapavam da
--            validação determinística (água/banho danifica o livro, voo de
--            asa-delta/parapente exige atenção total e oferece risco à vida).
--            Complementa a regra de viabilidade física reforçada no
--            ClassificadorDominioIA (camada LLM catch-all).
-- Relacionado à: Entrega 9 - IA de Recomendação com Aprendizado Automático

BEGIN;

INSERT INTO livraria_comercial.padroes_validacao_ia (pai_padrao, pai_tipo, pai_origem)
VALUES
  -- impossivel: ambiente com água danifica o livro / mãos molhadas
  ('no banho com água e sabão', 'impossivel', 'manual'),
  ('no banho com agua e sabao', 'impossivel', 'manual'),
  ('enquanto tomo banho', 'impossivel', 'manual'),
  ('enquanto estou tomando banho', 'impossivel', 'manual'),
  ('enquanto estou no banho', 'impossivel', 'manual'),
  ('debaixo do chuveiro', 'impossivel', 'manual'),
  ('embaixo do chuveiro', 'impossivel', 'manual'),
  ('enquanto estou na chuva', 'impossivel', 'manual'),
  ('durante a chuva', 'impossivel', 'manual'),

  -- impossivel: atividade aérea de risco que exige atenção total
  ('voando de asa-delta', 'impossivel', 'manual'),
  ('voando de asa delta', 'impossivel', 'manual'),
  ('enquanto estou de asa-delta', 'impossivel', 'manual'),
  ('enquanto estou de asa delta', 'impossivel', 'manual'),
  ('enquanto estou de parapente', 'impossivel', 'manual'),
  ('enquanto estou de paraglider', 'impossivel', 'manual'),
  ('enquanto estou de paraquedas', 'impossivel', 'manual')
ON CONFLICT (pai_padrao) DO NOTHING;

COMMIT;
