-- =============================================================================
-- DML 001 — Seeds das tabelas de referência
-- Sistema: LES – E-Commerce de Livros
-- Execute após todos os scripts DDL (001 a 005).
-- Os INSERTs usam ON CONFLICT DO NOTHING para serem idempotentes:
-- podem ser executados múltiplas vezes sem duplicar dados.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ecm_papel_usuario
-- -----------------------------------------------------------------------------
INSERT INTO ecm_papel_usuario (dsc_papel)
VALUES
    ('cliente'),
    ('admin')
ON CONFLICT (dsc_papel) DO NOTHING;


-- -----------------------------------------------------------------------------
-- ecm_tipo_telefone
-- -----------------------------------------------------------------------------
INSERT INTO ecm_tipo_telefone (dsc_tipo_telefone)
VALUES
    ('celular'),
    ('residencial'),
    ('comercial')
ON CONFLICT (dsc_tipo_telefone) DO NOTHING;


-- -----------------------------------------------------------------------------
-- ecm_tipo_logradouro
-- Tipos mais comuns no endereçamento postal brasileiro.
-- -----------------------------------------------------------------------------
INSERT INTO ecm_tipo_logradouro (dsc_tipo_logradouro)
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
ON CONFLICT (dsc_tipo_logradouro) DO NOTHING;


-- -----------------------------------------------------------------------------
-- ecm_tipo_residencia
-- -----------------------------------------------------------------------------
INSERT INTO ecm_tipo_residencia (dsc_tipo_residencia)
VALUES
    ('Casa'),
    ('Apartamento'),
    ('Condomínio Fechado'),
    ('Comercial'),
    ('Sítio / Chácara'),
    ('Outro')
ON CONFLICT (dsc_tipo_residencia) DO NOTHING;


-- -----------------------------------------------------------------------------
-- ecm_estado_brasileiro
-- 26 estados + Distrito Federal (ordem alfabética pelo nome).
-- -----------------------------------------------------------------------------
INSERT INTO ecm_estado_brasileiro (sig_estado, nom_estado)
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
ON CONFLICT (sig_estado) DO NOTHING;
