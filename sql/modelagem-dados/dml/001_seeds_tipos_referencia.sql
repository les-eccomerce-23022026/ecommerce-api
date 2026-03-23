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
INSERT INTO papeis (pap_descricao)
VALUES
    ('cliente'),
    ('admin')
ON CONFLICT (pap_descricao) DO NOTHING;


-- -----------------------------------------------------------------------------
-- tipos_telefones
-- -----------------------------------------------------------------------------
INSERT INTO tipos_telefones (ttp_descricao)
VALUES
    ('celular'),
    ('residencial'),
    ('comercial')
ON CONFLICT (ttp_descricao) DO NOTHING;


-- -----------------------------------------------------------------------------
-- tipos_logradouros
-- Tipos mais comuns no endereçamento postal brasileiro.
-- -----------------------------------------------------------------------------
INSERT INTO tipos_logradouros (tlo_descricao)
VALUES
    ('Rua'),
    ('Avenida'),
    ('Alameda'),
    ('Travessa'),
    ('Rodovia'),
    ('Estrada'),
    ('Praça'),
    ('Largo'),
    ('Vila'),
    ('Setor'),
    ('Quadra'),
    ('Conjunto')
ON CONFLICT (tlo_descricao) DO NOTHING;


-- -----------------------------------------------------------------------------
-- tipos_residencias
-- -----------------------------------------------------------------------------
INSERT INTO tipos_residencias (tre_descricao)
VALUES
    ('Casa'),
    ('Apartamento'),
    ('Condomínio Fechado'),
    ('Comercial'),
    ('Sítio / Chácara'),
    ('Outro')
ON CONFLICT (tre_descricao) DO NOTHING;


-- -----------------------------------------------------------------------------
-- estados
-- 26 estados + Distrito Federal (ordem alfabética pelo nome).
-- -----------------------------------------------------------------------------
INSERT INTO estados (est_sigla, est_nome)
VALUES
    ('AC', 'Acre'),
    ('AL', 'Alagoas'),
    ('AP', 'Amapá'),
    ('AM', 'Amazonas'),
    ('BA', 'Bahia'),
    ('CE', 'Ceará'),
    ('DF', 'Distrito Federal'),
    ('ES', 'Espírito Santo'),
    ('GO', 'Goiás'),
    ('MA', 'Maranhão'),
    ('MT', 'Mato Grosso'),
    ('MS', 'Mato Grosso do Sul'),
    ('MG', 'Minas Gerais'),
    ('PA', 'Pará'),
    ('PB', 'Paraíba'),
    ('PR', 'Paraná'),
    ('PE', 'Pernambuco'),
    ('PI', 'Piauí'),
    ('RJ', 'Rio de Janeiro'),
    ('RN', 'Rio Grande do Norte'),
    ('RS', 'Rio Grande do Sul'),
    ('RO', 'Rondônia'),
    ('RR', 'Roraima'),
    ('SC', 'Santa Catarina'),
    ('SP', 'São Paulo'),
    ('SE', 'Sergipe'),
    ('TO', 'Tocantins')
ON CONFLICT (est_sigla) DO NOTHING;
