-- -----------------------------------------------------------------------------
-- ecm_pais
-- -----------------------------------------------------------------------------
INSERT INTO ecm_pais (nom_pais)
VALUES ('Brasil')
ON CONFLICT (nom_pais) DO NOTHING;


-- -----------------------------------------------------------------------------
-- ecm_cep
-- Nota: Esta tabela seria populada dinamicamente conforme endereços são cadastrados.
-- Aqui apenas um exemplo de seed para um CEP comum.
-- -----------------------------------------------------------------------------
-- INSERT INTO ecm_cep (num_cep, id_cidade, id_bairro)
-- VALUES ('01310000', (SELECT id_cidade FROM ecm_cidade WHERE nom_cidade_norm = UPPER('São Paulo')), NULL)
-- ON CONFLICT (num_cep) DO NOTHING;


-- -----------------------------------------------------------------------------
-- ecm_logradouro
-- Nota: Esta tabela seria populada dinamicamente conforme endereços são cadastrados.
-- Aqui apenas um exemplo de seed para um logradouro comum.
-- -----------------------------------------------------------------------------
-- INSERT INTO ecm_logradouro (id_tipo_logradouro, dsc_logradouro, num_logradouro)
-- VALUES (
--     (SELECT id_tipo_logradouro FROM ecm_tipo_logradouro WHERE dsc_tipo_logradouro = 'Avenida'),
--     'Paulista',
--     '1000'
-- )
-- ON CONFLICT (id_tipo_logradouro, dsc_logradouro, num_logradouro) DO NOTHING;