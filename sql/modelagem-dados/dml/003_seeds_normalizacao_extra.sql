-- -----------------------------------------------------------------------------
-- paises
-- -----------------------------------------------------------------------------
INSERT INTO paises (pai_nome)
VALUES ('Brasil')
ON CONFLICT (pai_nome) DO NOTHING;


-- -----------------------------------------------------------------------------
-- cep_ceps
-- Nota: Esta tabela seria populada dinamicamente conforme endereços são cadastrados.
-- Aqui apenas um exemplo de seed para um CEP comum.
-- -----------------------------------------------------------------------------
-- INSERT INTO cep_ceps (cep_numero, cid_id, bai_id)
-- VALUES ('01310000', (SELECT cid_id FROM cid_cidades WHERE cid_nome_norm = UPPER('São Paulo')), NULL)
-- ON CONFLICT (cep_numero) DO NOTHING;


-- -----------------------------------------------------------------------------
-- log_logradouros
-- Nota: Esta tabela seria populada dinamicamente conforme endereços são cadastrados.
-- Aqui apenas um exemplo de seed para um logradouro comum.
-- -----------------------------------------------------------------------------
-- INSERT INTO log_logradouros (tlo_id, log_nome)
-- VALUES (
--     (SELECT tlo_id FROM tlo_tipos_logradouros WHERE tlo_descricao = 'Avenida'),
--     'Paulista',
--     '1000'
-- )
-- ON CONFLICT (tlo_id, log_nome) DO NOTHING;