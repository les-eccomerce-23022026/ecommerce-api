-- =============================================================================
-- DML 009 — Seeds de cidades e bairros brasileiros
-- Sistema: LES – E-Commerce de Livros
-- Execute após: 001_seeds_tipos_referencia.sql (estados)
-- Os INSERTs usam ON CONFLICT DO NOTHING para serem idempotentes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Cidades (Capitais)
-- Popula as 26 capitais estaduais + Distrito Federal
-- -----------------------------------------------------------------------------

-- São Paulo
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'São Paulo', 'SAO PAULO', est_id FROM livraria_ref.estados WHERE est_sigla = 'SP'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Rio de Janeiro
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Rio de Janeiro', 'RIO DE JANEIRO', est_id FROM livraria_ref.estados WHERE est_sigla = 'RJ'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Minas Gerais
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Belo Horizonte', 'BELO HORIZONTE', est_id FROM livraria_ref.estados WHERE est_sigla = 'MG'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Rio Grande do Sul
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Porto Alegre', 'PORTO ALEGRE', est_id FROM livraria_ref.estados WHERE est_sigla = 'RS'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Paraná
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Curitiba', 'CURITIBA', est_id FROM livraria_ref.estados WHERE est_sigla = 'PR'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Santa Catarina
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Florianópolis', 'FLORIANOPOLIS', est_id FROM livraria_ref.estados WHERE est_sigla = 'SC'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Bahia
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Salvador', 'SALVADOR', est_id FROM livraria_ref.estados WHERE est_sigla = 'BA'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Distrito Federal
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Brasília', 'BRASILIA', est_id FROM livraria_ref.estados WHERE est_sigla = 'DF'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Pernambuco
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Recife', 'RECIFE', est_id FROM livraria_ref.estados WHERE est_sigla = 'PE'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Ceará
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Fortaleza', 'FORTALEZA', est_id FROM livraria_ref.estados WHERE est_sigla = 'CE'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Goiás
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Goiânia', 'GOIANIA', est_id FROM livraria_ref.estados WHERE est_sigla = 'GO'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Amazonas
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Manaus', 'MANAUS', est_id FROM livraria_ref.estados WHERE est_sigla = 'AM'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Espírito Santo
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Vitória', 'VITORIA', est_id FROM livraria_ref.estados WHERE est_sigla = 'ES'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Mato Grosso
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Cuiabá', 'CUIABA', est_id FROM livraria_ref.estados WHERE est_sigla = 'MT'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Pará
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Belém', 'BELEM', est_id FROM livraria_ref.estados WHERE est_sigla = 'PA'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Alagoas
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Maceió', 'MACEIO', est_id FROM livraria_ref.estados WHERE est_sigla = 'AL'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Amapá
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Macapá', 'MACAPA', est_id FROM livraria_ref.estados WHERE est_sigla = 'AP'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Maranhão
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'São Luís', 'SAO LUIS', est_id FROM livraria_ref.estados WHERE est_sigla = 'MA'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Paraíba
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'João Pessoa', 'JOAO PESSOA', est_id FROM livraria_ref.estados WHERE est_sigla = 'PB'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Piauí
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Teresina', 'TERESINA', est_id FROM livraria_ref.estados WHERE est_sigla = 'PI'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Rio Grande do Norte
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Natal', 'NATAL', est_id FROM livraria_ref.estados WHERE est_sigla = 'RN'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Sergipe
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Aracaju', 'ARACAJU', est_id FROM livraria_ref.estados WHERE est_sigla = 'SE'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Tocantins
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Palmas', 'PALMAS', est_id FROM livraria_ref.estados WHERE est_sigla = 'TO'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Acre
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Rio Branco', 'RIO BRANCO', est_id FROM livraria_ref.estados WHERE est_sigla = 'AC'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Rondônia
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Porto Velho', 'PORTO VELHO', est_id FROM livraria_ref.estados WHERE est_sigla = 'RO'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Roraima
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Boa Vista', 'BOA VISTA', est_id FROM livraria_ref.estados WHERE est_sigla = 'RR'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- Mato Grosso do Sul
INSERT INTO livraria_ref.cidades (cid_nome, cid_nome_norm, est_id)
SELECT 'Campo Grande', 'CAMPO GRANDE', est_id FROM livraria_ref.estados WHERE est_sigla = 'MS'
ON CONFLICT (cid_nome_norm, est_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Bairros Principais das Capitais
-- 5-10 bairros por capital
-- -----------------------------------------------------------------------------

-- São Paulo
INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Centro', 'CENTRO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'São Paulo'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Pinheiros', 'PINHEIROS', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'São Paulo'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Jardins', 'JARDINS', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'São Paulo'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Moema', 'MOEMA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'São Paulo'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Itaim Bibi', 'ITAIM BIBI', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'São Paulo'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Vila Madalena', 'VILA MADALENA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'São Paulo'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Santana', 'SANTANA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'São Paulo'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Tatuapé', 'TATUAPE', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'São Paulo'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

-- Rio de Janeiro
INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Centro', 'CENTRO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Rio de Janeiro'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Copacabana', 'COPACABANA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Rio de Janeiro'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Ipanema', 'IPANEMA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Rio de Janeiro'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Leblon', 'LEBLON', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Rio de Janeiro'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Botafogo', 'BOTAFOGO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Rio de Janeiro'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Tijuca', 'TIJUCA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Rio de Janeiro'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Barra da Tijuca', 'BARRA DA TIJUCA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Rio de Janeiro'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

-- Belo Horizonte
INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Centro', 'CENTRO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Belo Horizonte'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Savassi', 'SAVASSI', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Belo Horizonte'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Funcionários', 'FUNCIONARIOS', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Belo Horizonte'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Lourdes', 'LOURDES', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Belo Horizonte'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Pampulha', 'PAMPULHA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Belo Horizonte'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

-- Porto Alegre
INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Centro', 'CENTRO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Porto Alegre'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Moinhos de Vento', 'MOINHOS DE VENTO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Porto Alegre'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Partenon', 'PARTENON', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Porto Alegre'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Petrópolis', 'PETROPOLIS', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Porto Alegre'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Três Figueiras', 'TRES FIGUEIRAS', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Porto Alegre'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

-- Curitiba
INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Centro', 'CENTRO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Curitiba'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Batel', 'BATEL', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Curitiba'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Água Verde', 'AGUA VERDE', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Curitiba'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Bigorrilho', 'BIGORRILHO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Curitiba'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Mercês', 'MERCES', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Curitiba'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

-- Salvador
INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Centro', 'CENTRO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Salvador'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Barra', 'BARRA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Salvador'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Pituba', 'PITUBA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Salvador'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Rio Vermelho', 'RIO VERMELHO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Salvador'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Itaigara', 'ITAIGARA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Salvador'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

-- Brasília
INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Asa Norte', 'ASA NORTE', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Brasília'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Asa Sul', 'ASA SUL', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Brasília'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Lago Norte', 'LAGO NORTE', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Brasília'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Lago Sul', 'LAGO SUL', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Brasília'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Ceilândia', 'CEILANDIA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Brasília'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

-- Recife
INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Centro', 'CENTRO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Recife'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Boa Viagem', 'BOA VIAGEM', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Recife'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Olinda', 'OLINDA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Recife'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Madalena', 'MADALENA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Recife'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Graças', 'GRACAS', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Recife'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

-- Fortaleza
INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Centro', 'CENTRO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Fortaleza'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Meireles', 'MEIRELES', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Fortaleza'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Aldeota', 'ALDEOTA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Fortaleza'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Varjota', 'VARJOTA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Fortaleza'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Beira Mar', 'BEIRA MAR', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Fortaleza'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

-- Goiânia
INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Centro', 'CENTRO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Goiânia'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Setor Bueno', 'SETOR BUENO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Goiânia'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Setor Marista', 'SETOR MARISTA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Goiânia'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Jardim Goiás', 'JARDIM GOIAS', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Goiânia'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Oeste', 'OESTE', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Goiânia'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

-- Manaus
INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Centro', 'CENTRO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Manaus'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Adrianópolis', 'ADRIANOPOLIS', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Manaus'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Alvorada', 'ALVORADA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Manaus'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Chapada', 'CHAPADA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Manaus'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Petrópolis', 'PETROPOLIS', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Manaus'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

-- Vitória
INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Centro', 'CENTRO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Vitória'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Praia do Canto', 'PRAIA DO CANTO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Vitória'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Jardim da Penha', 'JARDIM DA PENHA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Vitória'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Maruípe', 'MARUIPE', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Vitória'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Bento Ferreira', 'BENTO FERREIRA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Vitória'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

-- Cuiabá
INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Centro', 'CENTRO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Cuiabá'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Alvorada', 'ALVORADA', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Cuiabá'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Porto', 'PORTO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Cuiabá'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'São Gonçalo', 'SAO GONCALO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Cuiabá'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Popular', 'POPULAR', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Cuiabá'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

-- Belém
INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Centro', 'CENTRO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Belém'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Nazaré', 'NAZARE', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Belém'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Batista Campos', 'BATISTA CAMPOS', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Belém'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Umarizal', 'UMARIZAL', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Belém'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'São Brás', 'SAO BRAS', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Belém'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

-- Campo Grande
INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Centro', 'CENTRO', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Campo Grande'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Jardim das Nações', 'JARDIM DAS NACOES', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Campo Grande'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Tiradentes', 'TIRADENTES', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Campo Grande'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Amambaí', 'AMAMBAI', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Campo Grande'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;

INSERT INTO livraria_ref.bairros (bai_nome, bai_nome_norm, cid_id)
SELECT 'Imbirussu', 'IMBIRUSSU', cid_id FROM livraria_ref.cidades WHERE cid_nome = 'Campo Grande'
ON CONFLICT (bai_nome_norm, cid_id) DO NOTHING;
