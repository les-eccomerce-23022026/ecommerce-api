-- =============================================================================
-- DML 001 — Seeds das tabelas de referência
-- Sistema: LES – E-Commerce de Livros
-- Execute após todos os scripts DDL (001 a 005).
-- Os INSERTs usam ON CONFLICT DO NOTHING para serem idempotentes:
-- podem ser executados múltiplas vezes sem duplicar dados.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- papeis
-- -----------------------------------------------------------------------------
INSERT INTO livraria_comercial.papeis (pap_descricao) VALUES ('admin') ON CONFLICT (pap_descricao) DO NOTHING;
INSERT INTO livraria_comercial.papeis (pap_descricao) VALUES ('cliente') ON CONFLICT (pap_descricao) DO NOTHING;

-- -----------------------------------------------------------------------------
-- tipos_telefones
-- -----------------------------------------------------------------------------
INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('celular') ON CONFLICT (ttp_descricao) DO NOTHING;
INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('residencial') ON CONFLICT (ttp_descricao) DO NOTHING;
INSERT INTO livraria_ref.tipos_telefones (ttp_descricao) VALUES ('comercial') ON CONFLICT (ttp_descricao) DO NOTHING;

-- -----------------------------------------------------------------------------
-- tipos_logradouros
-- Tipos mais comuns no endereçamento postal brasileiro.
-- -----------------------------------------------------------------------------
INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rua') ON CONFLICT (tlo_descricao) DO NOTHING;
INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Avenida') ON CONFLICT (tlo_descricao) DO NOTHING;
INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Alameda') ON CONFLICT (tlo_descricao) DO NOTHING;
INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Travessa') ON CONFLICT (tlo_descricao) DO NOTHING;
INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Praça') ON CONFLICT (tlo_descricao) DO NOTHING;
INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Rodovia') ON CONFLICT (tlo_descricao) DO NOTHING;
INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Estrada') ON CONFLICT (tlo_descricao) DO NOTHING;
INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Viela') ON CONFLICT (tlo_descricao) DO NOTHING;
INSERT INTO livraria_ref.tipos_logradouros (tlo_descricao) VALUES ('Beco') ON CONFLICT (tlo_descricao) DO NOTHING;

-- -----------------------------------------------------------------------------
-- tipos_residencias
-- -----------------------------------------------------------------------------
INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Casa') ON CONFLICT (tre_descricao) DO NOTHING;
INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Apartamento') ON CONFLICT (tre_descricao) DO NOTHING;
INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Cômodo') ON CONFLICT (tre_descricao) DO NOTHING;
INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Sobrado') ON CONFLICT (tre_descricao) DO NOTHING;
INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Condomínio') ON CONFLICT (tre_descricao) DO NOTHING;
INSERT INTO livraria_ref.tipos_residencias (tre_descricao) VALUES ('Galpão') ON CONFLICT (tre_descricao) DO NOTHING;

-- -----------------------------------------------------------------------------
-- estados
-- 26 estados + Distrito Federal (ordem alfabética pelo nome).
-- -----------------------------------------------------------------------------
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('SP', 'São Paulo') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('RJ', 'Rio de Janeiro') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('MG', 'Minas Gerais') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('RS', 'Rio Grande do Sul') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('PR', 'Paraná') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('SC', 'Santa Catarina') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('BA', 'Bahia') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('DF', 'Distrito Federal') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('PE', 'Pernambuco') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('CE', 'Ceará') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('GO', 'Goiás') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('AM', 'Amazonas') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('ES', 'Espírito Santo') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('MT', 'Mato Grosso') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('PA', 'Pará') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('AL', 'Alagoas') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('AP', 'Amapá') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('MA', 'Maranhão') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('PB', 'Paraíba') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('PI', 'Piauí') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('RN', 'Rio Grande do Norte') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('SE', 'Sergipe') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('TO', 'Tocantins') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('AC', 'Acre') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('RO', 'Rondônia') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('RR', 'Roraima') ON CONFLICT DO NOTHING;
INSERT INTO livraria_ref.estados (est_sigla, est_nome) VALUES ('MS', 'Mato Grosso do Sul') ON CONFLICT DO NOTHING;
