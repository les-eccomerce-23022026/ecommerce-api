-- Estrutura Final da Tabela admin_lojas após Migration 048
-- Data: 2025-05-25
-- Status: ✅ APLICADA COM SUCESSO

-- Definição da Tabela
CREATE TABLE livraria_gestao.admin_lojas (
    adl_id bigint NOT NULL,
    usu_id bigint NOT NULL,
    loj_id bigint NOT NULL,
    adl_papel character varying(20) NOT NULL,
    adl_ativo boolean DEFAULT true,
    adl_criado_em timestamp with time zone DEFAULT now(),
    adl_escopo character varying(20) NOT NULL DEFAULT 'LOJA'::character varying,
    CONSTRAINT ck_admin_lojas_escopo_valido CHECK (((adl_escopo)::text = ANY ((ARRAY['SISTEMA'::character varying, 'LOJA'::character varying])::text[])))
);

-- Sequência para adl_id
CREATE SEQUENCE livraria_gestao.admin_lojas_adl_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE livraria_gestao.admin_lojas_adl_id_seq OWNED BY livraria_gestao.admin_lojas.adl_id;

-- Padrão para adl_id
ALTER TABLE ONLY livraria_gestao.admin_lojas ALTER COLUMN adl_id SET DEFAULT nextval('livraria_gestao.admin_lojas_adl_id_seq'::regclass);

-- Constraints
ALTER TABLE ONLY livraria_gestao.admin_lojas
    ADD CONSTRAINT admin_lojas_pkey PRIMARY KEY (adl_id);

ALTER TABLE ONLY livraria_gestao.admin_lojas
    ADD CONSTRAINT uq_admin_loja UNIQUE (usu_id, loj_id);

-- Índices
CREATE INDEX idx_admin_lojas_escopo ON livraria_gestao.admin_lojas USING btree (adl_escopo);

-- Foreign Keys
ALTER TABLE ONLY livraria_gestao.admin_lojas
    ADD CONSTRAINT fk_admin_lojas_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);

ALTER TABLE ONLY livraria_gestao.admin_lojas
    ADD CONSTRAINT fk_admin_lojas_usuario FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id);

-- Exemplos de Uso
-- ================================================================================

-- 1. Inserir administrador de loja (padrão)
-- INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel)
-- VALUES (1, 1, 'GERENTE');
-- → adl_escopo será 'LOJA' automaticamente

-- 2. Inserir administrador de sistema
-- INSERT INTO livraria_gestao.admin_lojas (usu_id, loj_id, adl_papel, adl_escopo)
-- VALUES (2, 1, 'SUPER_ADMIN', 'SISTEMA');

-- 3. Consultar administradores de sistema
-- SELECT * FROM livraria_gestao.admin_lojas
-- WHERE adl_escopo = 'SISTEMA';

-- 4. Consultar administradores de uma loja específica
-- SELECT * FROM livraria_gestao.admin_lojas
-- WHERE loj_id = 1 AND adl_escopo = 'LOJA';

-- 5. Atualizar escopo de um administrador
-- UPDATE livraria_gestao.admin_lojas
-- SET adl_escopo = 'SISTEMA'
-- WHERE adl_id = 1;

-- Regras de Negócio
-- ================================================================================

-- ESCOPO_SISTEMA:
--   - Acesso global a todas as lojas
--   - Pode gerenciar múltiplas lojas
--   - Pode alterar configurações do sistema
--   - Pode gerenciar outros administradores

-- ESCOPO_LOJA:
--   - Acesso restrito à loja atribuída (loj_id)
--   - Pode gerenciar apenas sua loja
--   - Não pode acessar dados de outras lojas
--   - Não pode alterar configurações do sistema

-- Notas de Implementação
-- ================================================================================

-- 1. A coluna adl_escopo usa VARCHAR(20) em vez de ENUM para:
--    - Facilitar migrações futuras
--    - Permitir adição de novos escopos sem ALTER TYPE
--    - Compatibilidade com aplicações legadas

-- 2. O valor padrão 'LOJA' garante:
--    - Segurança por padrão (princípio do menor privilégio)
--    - Compatibilidade com dados existentes
--    - Reduz risco de erro humano

-- 3. O índice idx_admin_lojas_escopo otimiza:
--    - Queries que filtram por escopo
--    - Relatórios de administradores por tipo
--    - Verificações de autorização em tempo real

-- 4. A constraint CHECK garante:
--    - Integridade de dados no banco
--    - Impossibilidade de valores inválidos
--    - Validação em nível de banco de dados

