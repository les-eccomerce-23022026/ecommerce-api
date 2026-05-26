-- Gerado em: 2026-05-22 14:26:41
-- Fonte: ecm_postgres / ecm_livraria
-- Comando: npm run db:snapshot:historico

--
-- PostgreSQL database dump
--


-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: livraria_comercial; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA livraria_comercial;


--
-- Name: livraria_financeiro; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA livraria_financeiro;


--
-- Name: livraria_gestao; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA livraria_gestao;


--
-- Name: livraria_logistica; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA livraria_logistica;


--
-- Name: livraria_ref; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA livraria_ref;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: atualizar_notificacoes_atualizado_em(); Type: FUNCTION; Schema: livraria_comercial; Owner: -
--

CREATE FUNCTION livraria_comercial.atualizar_notificacoes_atualizado_em() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.not_atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: fn_atualizar_timestamp(); Type: FUNCTION; Schema: livraria_comercial; Owner: -
--

CREATE FUNCTION livraria_comercial.fn_atualizar_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_TABLE_NAME = 'usuarios' THEN NEW.usu_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'clientes' THEN NEW.cli_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'telefones' THEN NEW.tel_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'enderecos' THEN NEW.end_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'cartoes'   THEN NEW.crt_atualizado_em := NOW(); END IF;
    RETURN NEW;
END;
$$;


--
-- Name: fn_atualizar_timestamp_cupom(); Type: FUNCTION; Schema: livraria_comercial; Owner: -
--

CREATE FUNCTION livraria_comercial.fn_atualizar_timestamp_cupom() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.cup_atualizado_em := NOW();
    RETURN NEW;
END;
$$;


--
-- Name: fn_atualizar_timestamp_livros_estoque(); Type: FUNCTION; Schema: livraria_comercial; Owner: -
--

CREATE FUNCTION livraria_comercial.fn_atualizar_timestamp_livros_estoque() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_TABLE_NAME = 'autores' THEN NEW.aut_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'editoras' THEN NEW.edi_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'livros' THEN NEW.liv_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'estoques' THEN NEW.etq_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'fornecedores' THEN NEW.for_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'avaliacoes_livro' THEN NEW.avl_atualizado_em := NOW(); END IF;
    RETURN NEW;
END;
$$;


--
-- Name: fn_gerar_trigrama_autores(); Type: FUNCTION; Schema: livraria_comercial; Owner: -
--

CREATE FUNCTION livraria_comercial.fn_gerar_trigrama_autores() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.aut_nome_norm := livraria_comercial.fn_normalizar_texto(NEW.aut_nome);
    NEW.aut_uuid := COALESCE(NEW.aut_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;


--
-- Name: fn_gerar_trigrama_categorias(); Type: FUNCTION; Schema: livraria_comercial; Owner: -
--

CREATE FUNCTION livraria_comercial.fn_gerar_trigrama_categorias() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.cat_nome_norm := livraria_comercial.fn_normalizar_texto(NEW.cat_nome);
    NEW.cat_uuid := COALESCE(NEW.cat_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;


--
-- Name: fn_gerar_trigrama_editoras(); Type: FUNCTION; Schema: livraria_comercial; Owner: -
--

CREATE FUNCTION livraria_comercial.fn_gerar_trigrama_editoras() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.edi_nome_norm := livraria_comercial.fn_normalizar_texto(NEW.edi_nome);
    NEW.edi_uuid := COALESCE(NEW.edi_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;


--
-- Name: fn_gerar_trigrama_fornecedores(); Type: FUNCTION; Schema: livraria_comercial; Owner: -
--

CREATE FUNCTION livraria_comercial.fn_gerar_trigrama_fornecedores() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.for_nome_norm := livraria_comercial.fn_normalizar_texto(NEW.for_nome);
    NEW.for_uuid := COALESCE(NEW.for_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;


--
-- Name: fn_gerar_trigrama_livros(); Type: FUNCTION; Schema: livraria_comercial; Owner: -
--

CREATE FUNCTION livraria_comercial.fn_gerar_trigrama_livros() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.liv_titulo_norm := livraria_comercial.fn_normalizar_texto(NEW.liv_titulo);
    NEW.liv_uuid := COALESCE(NEW.liv_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;


--
-- Name: fn_normalizar_texto(text); Type: FUNCTION; Schema: livraria_comercial; Owner: -
--

CREATE FUNCTION livraria_comercial.fn_normalizar_texto(input_text text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    RETURN UPPER(UNACCENT(input_text));
END;
$$;


--
-- Name: fn_atualizar_timestamp_pagamento(); Type: FUNCTION; Schema: livraria_financeiro; Owner: -
--

CREATE FUNCTION livraria_financeiro.fn_atualizar_timestamp_pagamento() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.pag_atualizado_em := NOW();
    RETURN NEW;
END;
$$;


--
-- Name: fn_atualizar_timestamp(); Type: FUNCTION; Schema: livraria_gestao; Owner: -
--

CREATE FUNCTION livraria_gestao.fn_atualizar_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_TABLE_NAME = 'usuarios' THEN NEW.usu_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'clientes' THEN NEW.cli_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'telefones' THEN NEW.tel_atualizado_em := NOW(); END IF;
    RETURN NEW;
END;
$$;


--
-- Name: fn_atualizar_timestamp_usuario_papeis(); Type: FUNCTION; Schema: livraria_gestao; Owner: -
--

CREATE FUNCTION livraria_gestao.fn_atualizar_timestamp_usuario_papeis() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.usp_atualizado_em = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: limpar_refresh_tokens_expirados(); Type: FUNCTION; Schema: livraria_gestao; Owner: -
--

CREATE FUNCTION livraria_gestao.limpar_refresh_tokens_expirados() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM livraria_gestao.refresh_tokens
    WHERE rft_expira_em < NOW()
    AND rft_revocado_em IS NULL;
END;
$$;


--
-- Name: fn_atualizar_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_atualizar_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_TABLE_NAME = 'usuarios' THEN NEW.usu_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'clientes' THEN NEW.cli_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'telefones' THEN NEW.tel_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'enderecos' THEN NEW.end_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'cartoes'   THEN NEW.crt_atualizado_em := NOW(); END IF;
    RETURN NEW;
END;
$$;


--
-- Name: fn_atualizar_timestamp_livros_estoque(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_atualizar_timestamp_livros_estoque() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_TABLE_NAME = 'autores' THEN NEW.aut_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'editoras' THEN NEW.edi_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'livros' THEN NEW.liv_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'estoques' THEN NEW.etq_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'fornecedores' THEN NEW.for_atualizado_em := NOW(); END IF;
    IF TG_TABLE_NAME = 'avaliacoes_livro' THEN NEW.avl_atualizado_em := NOW(); END IF;
    RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: autores; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.autores (
    aut_id integer NOT NULL,
    aut_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    aut_nome character varying(200) NOT NULL,
    aut_nome_norm character varying(200) NOT NULL,
    aut_descricao text,
    aut_ativo boolean DEFAULT true NOT NULL,
    aut_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    aut_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE autores; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.autores IS 'Catálogo de autores de livros.';


--
-- Name: COLUMN autores.aut_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.autores.aut_id IS 'Identificador interno do autor.';


--
-- Name: COLUMN autores.aut_uuid; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.autores.aut_uuid IS 'Identificador público UUID do autor.';


--
-- Name: COLUMN autores.aut_nome; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.autores.aut_nome IS 'Nome completo do autor.';


--
-- Name: COLUMN autores.aut_nome_norm; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.autores.aut_nome_norm IS 'Nome normalizado para busca (sem acentos, maiúsculas).';


--
-- Name: COLUMN autores.aut_descricao; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.autores.aut_descricao IS 'Biografia/descrição do autor.';


--
-- Name: COLUMN autores.aut_ativo; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.autores.aut_ativo IS 'Flag indicando se autor está ativo no catálogo.';


--
-- Name: autores_aut_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.autores_aut_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: autores_aut_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.autores_aut_id_seq OWNED BY livraria_comercial.autores.aut_id;


--
-- Name: avaliacoes_livro; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.avaliacoes_livro (
    avl_id bigint NOT NULL,
    avl_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    liv_id bigint NOT NULL,
    usu_id bigint NOT NULL,
    avl_nota integer NOT NULL,
    avl_comentario character varying(1000),
    avl_aprovado boolean DEFAULT false NOT NULL,
    avl_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    avl_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    loj_id bigint NOT NULL,
    CONSTRAINT avaliacoes_livro_avl_nota_check CHECK (((avl_nota >= 1) AND (avl_nota <= 5)))
);


--
-- Name: TABLE avaliacoes_livro; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.avaliacoes_livro IS 'Avaliações de usuários para livros (RN0068).';


--
-- Name: COLUMN avaliacoes_livro.avl_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.avaliacoes_livro.avl_id IS 'Identificador interno da avaliação.';


--
-- Name: COLUMN avaliacoes_livro.avl_uuid; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.avaliacoes_livro.avl_uuid IS 'Identificador público UUID da avaliação.';


--
-- Name: COLUMN avaliacoes_livro.liv_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.avaliacoes_livro.liv_id IS 'FK para livro avaliado.';


--
-- Name: COLUMN avaliacoes_livro.usu_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.avaliacoes_livro.usu_id IS 'FK para usuário que avaliou.';


--
-- Name: COLUMN avaliacoes_livro.avl_nota; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.avaliacoes_livro.avl_nota IS 'Nota de 1 a 5 estrelas.';


--
-- Name: COLUMN avaliacoes_livro.avl_comentario; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.avaliacoes_livro.avl_comentario IS 'Comentário opcional do usuário.';


--
-- Name: COLUMN avaliacoes_livro.avl_aprovado; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.avaliacoes_livro.avl_aprovado IS 'Flag indicando se avaliação foi aprovada para exibição.';


--
-- Name: COLUMN avaliacoes_livro.loj_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.avaliacoes_livro.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';


--
-- Name: avaliacoes_livro_avl_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.avaliacoes_livro_avl_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avaliacoes_livro_avl_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.avaliacoes_livro_avl_id_seq OWNED BY livraria_comercial.avaliacoes_livro.avl_id;


--
-- Name: carrinho_itens; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.carrinho_itens (
    cri_id bigint NOT NULL,
    usu_id bigint NOT NULL,
    liv_id bigint NOT NULL,
    cri_quantidade integer NOT NULL,
    cri_atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    loj_id bigint NOT NULL,
    CONSTRAINT carrinho_itens_cri_quantidade_check CHECK ((cri_quantidade > 0))
);


--
-- Name: TABLE carrinho_itens; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.carrinho_itens IS 'Itens do carrinho de compras por usuário autenticado.';


--
-- Name: COLUMN carrinho_itens.loj_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.carrinho_itens.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';


--
-- Name: carrinho_itens_cri_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.carrinho_itens_cri_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: carrinho_itens_cri_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.carrinho_itens_cri_id_seq OWNED BY livraria_comercial.carrinho_itens.cri_id;


--
-- Name: categorias; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.categorias (
    cat_id integer NOT NULL,
    cat_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    cat_nome character varying(100) NOT NULL,
    cat_nome_norm character varying(100) NOT NULL,
    cat_descricao character varying(500),
    cat_ativo boolean DEFAULT true NOT NULL,
    cat_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    cat_slug character varying(120)
);


--
-- Name: TABLE categorias; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.categorias IS 'Catálogo de categorias de livros.';


--
-- Name: COLUMN categorias.cat_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.categorias.cat_id IS 'Identificador interno da categoria.';


--
-- Name: COLUMN categorias.cat_uuid; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.categorias.cat_uuid IS 'Identificador público UUID da categoria.';


--
-- Name: COLUMN categorias.cat_nome; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.categorias.cat_nome IS 'Nome da categoria.';


--
-- Name: COLUMN categorias.cat_nome_norm; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.categorias.cat_nome_norm IS 'Nome normalizado para busca (sem acentos, maiúsculas).';


--
-- Name: COLUMN categorias.cat_descricao; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.categorias.cat_descricao IS 'Descrição da categoria.';


--
-- Name: COLUMN categorias.cat_ativo; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.categorias.cat_ativo IS 'Flag indicando se categoria está ativa.';


--
-- Name: COLUMN categorias.cat_slug; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.categorias.cat_slug IS 'Identificador estável para URL (ex.: ficcao, fantasia).';


--
-- Name: categorias_cat_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.categorias_cat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categorias_cat_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.categorias_cat_id_seq OWNED BY livraria_comercial.categorias.cat_id;


--
-- Name: cotacao_frete; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.cotacao_frete (
    cfr_id bigint NOT NULL,
    cfr_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    cfr_provedor character varying(32) DEFAULT 'simulado'::character varying NOT NULL,
    cfr_estado character varying(32) NOT NULL,
    cfr_cep_origem character varying(8) NOT NULL,
    cfr_cep_destino character varying(8) NOT NULL,
    cfr_peso_kg numeric(10,3) NOT NULL,
    cfr_valor_itens numeric(10,2),
    cfr_tipo_servico character varying(32) NOT NULL,
    cfr_valor numeric(10,2) NOT NULL,
    cfr_prazo_texto character varying(160) NOT NULL,
    cfr_expira_em timestamp with time zone NOT NULL,
    cfr_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ven_id bigint,
    loj_id bigint NOT NULL,
    CONSTRAINT cotacao_frete_cfr_estado_check CHECK (((cfr_estado)::text = ANY ((ARRAY['CRIADA'::character varying, 'CONSUMIDA'::character varying, 'EXPIRADA'::character varying, 'CANCELADA'::character varying])::text[]))),
    CONSTRAINT cotacao_frete_cfr_peso_kg_check CHECK ((cfr_peso_kg > (0)::numeric)),
    CONSTRAINT cotacao_frete_cfr_valor_check CHECK ((cfr_valor >= (0)::numeric))
);


--
-- Name: TABLE cotacao_frete; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.cotacao_frete IS 'Cotação de frete por modalidade; UUID exposto ao cliente para seleção no checkout.';


--
-- Name: COLUMN cotacao_frete.loj_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cotacao_frete.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';


--
-- Name: cotacao_frete_cfr_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.cotacao_frete_cfr_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cotacao_frete_cfr_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.cotacao_frete_cfr_id_seq OWNED BY livraria_comercial.cotacao_frete.cfr_id;


--
-- Name: cotacao_frete_simulada; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.cotacao_frete_simulada (
    cfr_id bigint NOT NULL,
    cfs_fator_regiao numeric(10,4) DEFAULT 1.0 NOT NULL,
    cfs_peso_arredondado numeric(10,3) NOT NULL
);


--
-- Name: TABLE cotacao_frete_simulada; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.cotacao_frete_simulada IS 'Metadados da transportadora simulada (regras internas de cálculo).';


--
-- Name: cupom; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.cupom (
    cup_id bigint NOT NULL,
    cup_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    cup_codigo character varying(50) NOT NULL,
    cup_tipo character varying(20) NOT NULL,
    cup_valor_desconto numeric(10,2) NOT NULL,
    cup_valor_minimo numeric(10,2) DEFAULT 0,
    cup_uso_maximo integer,
    cup_uso_atual integer DEFAULT 0,
    cup_valido_de date DEFAULT CURRENT_DATE,
    cup_valido_ate date DEFAULT (CURRENT_DATE + '1 year'::interval),
    cup_ativo boolean DEFAULT true,
    cup_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    cup_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cupom_cup_tipo_check CHECK (((cup_tipo)::text = ANY ((ARRAY['promocional'::character varying, 'troca'::character varying])::text[]))),
    CONSTRAINT cupom_cup_valor_desconto_check CHECK ((cup_valor_desconto > (0)::numeric)),
    CONSTRAINT cupom_cup_valor_minimo_check CHECK ((cup_valor_minimo >= (0)::numeric))
);


--
-- Name: TABLE cupom; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.cupom IS 'Seed de cupons para testes E2E do Cypress';


--
-- Name: COLUMN cupom.cup_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupom.cup_id IS 'Chave primária interna';


--
-- Name: COLUMN cupom.cup_uuid; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupom.cup_uuid IS 'Identificador público UUID';


--
-- Name: COLUMN cupom.cup_codigo; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupom.cup_codigo IS 'Código do cupom para digitação no checkout';


--
-- Name: COLUMN cupom.cup_tipo; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupom.cup_tipo IS 'Tipo: promocional (máximo 1 por compra) ou troca (múltiplos permitidos)';


--
-- Name: COLUMN cupom.cup_valor_desconto; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupom.cup_valor_desconto IS 'Valor do desconto em reais';


--
-- Name: COLUMN cupom.cup_valor_minimo; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupom.cup_valor_minimo IS 'Valor mínimo da compra para aplicar o cupom';


--
-- Name: COLUMN cupom.cup_uso_maximo; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupom.cup_uso_maximo IS 'Número máximo de usos (NULL = ilimitado)';


--
-- Name: COLUMN cupom.cup_uso_atual; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupom.cup_uso_atual IS 'Contador de usos atual';


--
-- Name: COLUMN cupom.cup_valido_de; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupom.cup_valido_de IS 'Data de início de validade';


--
-- Name: COLUMN cupom.cup_valido_ate; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupom.cup_valido_ate IS 'Data de fim de validade';


--
-- Name: COLUMN cupom.cup_ativo; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupom.cup_ativo IS 'Se o cupom está ativo';


--
-- Name: COLUMN cupom.cup_criado_em; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupom.cup_criado_em IS 'Timestamp de criação';


--
-- Name: COLUMN cupom.cup_atualizado_em; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupom.cup_atualizado_em IS 'Timestamp da última atualização';


--
-- Name: cupom_cup_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.cupom_cup_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cupom_cup_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.cupom_cup_id_seq OWNED BY livraria_comercial.cupom.cup_id;


--
-- Name: cupons_troca; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.cupons_troca (
    cpt_id bigint NOT NULL,
    cpt_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    cpt_codigo character varying(50) NOT NULL,
    cpt_valor numeric(10,2) NOT NULL,
    cpt_cliente_id bigint NOT NULL,
    cpt_venda_origem_id bigint,
    cpt_status character varying(20) DEFAULT 'DISPONIVEL'::character varying NOT NULL,
    cpt_valido_ate date NOT NULL,
    cpt_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cupons_troca_cpt_status_check CHECK (((cpt_status)::text = ANY ((ARRAY['DISPONIVEL'::character varying, 'UTILIZADO'::character varying, 'EXPIRADO'::character varying])::text[]))),
    CONSTRAINT cupons_troca_cpt_valor_check CHECK ((cpt_valor > (0)::numeric))
);


--
-- Name: TABLE cupons_troca; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.cupons_troca IS 'Armazena cupons de troca vinculados aos clientes.';


--
-- Name: COLUMN cupons_troca.cpt_codigo; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupons_troca.cpt_codigo IS 'Código único do cupom (ex.: TROCA-ABC-123).';


--
-- Name: COLUMN cupons_troca.cpt_valor; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupons_troca.cpt_valor IS 'Saldo remanescente do cupom.';


--
-- Name: COLUMN cupons_troca.cpt_cliente_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupons_troca.cpt_cliente_id IS 'ID do cliente vinculado ao cupom.';


--
-- Name: COLUMN cupons_troca.cpt_status; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.cupons_troca.cpt_status IS 'Status do cupom (DISPONIVEL, UTILIZADO, EXPIRADO).';


--
-- Name: cupons_troca_cpt_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.cupons_troca_cpt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cupons_troca_cpt_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.cupons_troca_cpt_id_seq OWNED BY livraria_comercial.cupons_troca.cpt_id;


--
-- Name: itens_venda; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.itens_venda (
    itv_id bigint NOT NULL,
    itv_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    ven_id bigint NOT NULL,
    liv_uuid uuid NOT NULL,
    itv_quantidade integer NOT NULL,
    itv_preco_unitario numeric(10,2) NOT NULL,
    itv_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    itv_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    itv_em_troca boolean DEFAULT false NOT NULL,
    loj_id bigint NOT NULL
);


--
-- Name: COLUMN itens_venda.itv_em_troca; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.itens_venda.itv_em_troca IS 'Indica se este item específico da venda foi solicitado para troca.';


--
-- Name: COLUMN itens_venda.loj_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.itens_venda.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';


--
-- Name: ecm_item_venda_itv_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.ecm_item_venda_itv_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ecm_item_venda_itv_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.ecm_item_venda_itv_id_seq OWNED BY livraria_comercial.itens_venda.itv_id;


--
-- Name: status_venda; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.status_venda (
    stv_id integer NOT NULL,
    stv_descricao character varying(50) NOT NULL,
    stv_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: ecm_status_venda_stv_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.ecm_status_venda_stv_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ecm_status_venda_stv_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.ecm_status_venda_stv_id_seq OWNED BY livraria_comercial.status_venda.stv_id;


--
-- Name: vendas; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.vendas (
    ven_id bigint NOT NULL,
    ven_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usu_id bigint NOT NULL,
    stv_id integer NOT NULL,
    ven_total_itens numeric(10,2) NOT NULL,
    ven_frete numeric(10,2) NOT NULL,
    ven_total_venda numeric(10,2) NOT NULL,
    ven_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ven_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ven_motivo_troca text,
    loj_id bigint NOT NULL,
    cfr_id bigint,
    ven_data_hora_entrega timestamp with time zone
);


--
-- Name: COLUMN vendas.ven_motivo_troca; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.vendas.ven_motivo_troca IS 'Motivo informado pelo cliente ao solicitar troca ou devolução.';


--
-- Name: COLUMN vendas.loj_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.vendas.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';


--
-- Name: COLUMN vendas.cfr_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.vendas.cfr_id IS 'Cotação de frete escolhida no checkout (opcional durante migração legado).';


--
-- Name: COLUMN vendas.ven_data_hora_entrega; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.vendas.ven_data_hora_entrega IS 'Data e hora em que a entrega foi confirmada. Usada para calcular o prazo de 7 dias para solicitação de troca (RN0043).';


--
-- Name: ecm_venda_ven_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.ecm_venda_ven_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ecm_venda_ven_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.ecm_venda_ven_id_seq OWNED BY livraria_comercial.vendas.ven_id;


--
-- Name: editoras; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.editoras (
    edi_id integer NOT NULL,
    edi_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    edi_nome character varying(200) NOT NULL,
    edi_nome_norm character varying(200) NOT NULL,
    edi_cnpj character varying(18),
    edi_ativo boolean DEFAULT true NOT NULL,
    edi_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    edi_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE editoras; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.editoras IS 'Catálogo de editoras de livros.';


--
-- Name: COLUMN editoras.edi_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.editoras.edi_id IS 'Identificador interno da editora.';


--
-- Name: COLUMN editoras.edi_uuid; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.editoras.edi_uuid IS 'Identificador público UUID da editora.';


--
-- Name: COLUMN editoras.edi_nome; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.editoras.edi_nome IS 'Nome da editora.';


--
-- Name: COLUMN editoras.edi_nome_norm; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.editoras.edi_nome_norm IS 'Nome normalizado para busca (sem acentos, maiúsculas).';


--
-- Name: COLUMN editoras.edi_cnpj; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.editoras.edi_cnpj IS 'CNPJ da editora.';


--
-- Name: COLUMN editoras.edi_ativo; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.editoras.edi_ativo IS 'Flag indicando se editora está ativa no catálogo.';


--
-- Name: editoras_edi_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.editoras_edi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: editoras_edi_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.editoras_edi_id_seq OWNED BY livraria_comercial.editoras.edi_id;


--
-- Name: entrega; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.entrega (
    ent_id integer NOT NULL,
    ent_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    ven_id integer NOT NULL,
    tfr_id integer NOT NULL,
    ent_endereco_json jsonb NOT NULL,
    ent_custo numeric(10,2) NOT NULL,
    ent_entregador character varying(100),
    ent_criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    loj_id bigint NOT NULL,
    CONSTRAINT entrega_ent_custo_check CHECK ((ent_custo >= (0)::numeric))
);


--
-- Name: COLUMN entrega.loj_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.entrega.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';


--
-- Name: entrega_ent_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.entrega_ent_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entrega_ent_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.entrega_ent_id_seq OWNED BY livraria_comercial.entrega.ent_id;


--
-- Name: estoques; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.estoques (
    etq_id bigint NOT NULL,
    etq_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    liv_id bigint NOT NULL,
    etq_quantidade_disponivel integer DEFAULT 0 NOT NULL,
    etq_quantidade_reservada integer DEFAULT 0 NOT NULL,
    etq_preco_venda numeric(10,2) NOT NULL,
    etq_valor_custo_atual numeric(10,2),
    etq_ultimo_custo_calculado timestamp with time zone,
    etq_ativo boolean DEFAULT true NOT NULL,
    etq_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    etq_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    loj_id bigint NOT NULL,
    CONSTRAINT estoques_etq_preco_venda_check CHECK ((etq_preco_venda >= (0)::numeric)),
    CONSTRAINT estoques_etq_quantidade_disponivel_check CHECK ((etq_quantidade_disponivel >= 0)),
    CONSTRAINT estoques_etq_quantidade_reservada_check CHECK ((etq_quantidade_reservada >= 0)),
    CONSTRAINT estoques_etq_valor_custo_atual_check CHECK ((etq_valor_custo_atual >= (0)::numeric))
);


--
-- Name: TABLE estoques; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.estoques IS 'Controle de estoque e preços por livro (dados operacionais mutáveis).';


--
-- Name: COLUMN estoques.etq_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.estoques.etq_id IS 'Identificador interno do estoque.';


--
-- Name: COLUMN estoques.etq_uuid; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.estoques.etq_uuid IS 'Identificador público UUID do estoque.';


--
-- Name: COLUMN estoques.liv_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.estoques.liv_id IS 'FK única para livro (relacionamento 1:1).';


--
-- Name: COLUMN estoques.etq_quantidade_disponivel; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.estoques.etq_quantidade_disponivel IS 'Quantidade disponível para venda.';


--
-- Name: COLUMN estoques.etq_quantidade_reservada; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.estoques.etq_quantidade_reservada IS 'Quantidade reservada para pedidos em andamento.';


--
-- Name: COLUMN estoques.etq_preco_venda; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.estoques.etq_preco_venda IS 'Preço de venda atual (calculado via RN0013).';


--
-- Name: COLUMN estoques.etq_valor_custo_atual; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.estoques.etq_valor_custo_atual IS 'Custo unitário atual do livro.';


--
-- Name: COLUMN estoques.etq_ultimo_custo_calculado; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.estoques.etq_ultimo_custo_calculado IS 'Data do último cálculo de custo (média ponderada).';


--
-- Name: COLUMN estoques.etq_ativo; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.estoques.etq_ativo IS 'Flag indicando se registro de estoque está ativo.';


--
-- Name: COLUMN estoques.loj_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.estoques.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';


--
-- Name: estoques_etq_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.estoques_etq_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: estoques_etq_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.estoques_etq_id_seq OWNED BY livraria_comercial.estoques.etq_id;


--
-- Name: fornecedores; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.fornecedores (
    for_id integer NOT NULL,
    for_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    for_nome character varying(200) NOT NULL,
    for_nome_norm character varying(200) NOT NULL,
    for_cnpj character varying(18),
    for_email character varying(255),
    for_telefone character varying(20),
    for_ativo boolean DEFAULT true NOT NULL,
    for_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    for_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    loj_id bigint NOT NULL
);


--
-- Name: TABLE fornecedores; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.fornecedores IS 'Cadastro de fornecedores para entrada de estoque.';


--
-- Name: COLUMN fornecedores.for_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.fornecedores.for_id IS 'Identificador interno do fornecedor.';


--
-- Name: COLUMN fornecedores.for_uuid; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.fornecedores.for_uuid IS 'Identificador público UUID do fornecedor.';


--
-- Name: COLUMN fornecedores.for_nome; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.fornecedores.for_nome IS 'Nome do fornecedor.';


--
-- Name: COLUMN fornecedores.for_nome_norm; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.fornecedores.for_nome_norm IS 'Nome normalizado para busca.';


--
-- Name: COLUMN fornecedores.for_cnpj; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.fornecedores.for_cnpj IS 'CNPJ do fornecedor.';


--
-- Name: COLUMN fornecedores.for_email; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.fornecedores.for_email IS 'Email para contato.';


--
-- Name: COLUMN fornecedores.for_telefone; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.fornecedores.for_telefone IS 'Telefone para contato.';


--
-- Name: COLUMN fornecedores.for_ativo; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.fornecedores.for_ativo IS 'Flag indicando se fornecedor está ativo.';


--
-- Name: COLUMN fornecedores.loj_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.fornecedores.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';


--
-- Name: fornecedores_for_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.fornecedores_for_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fornecedores_for_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.fornecedores_for_id_seq OWNED BY livraria_comercial.fornecedores.for_id;


--
-- Name: grupos_precificacao; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.grupos_precificacao (
    gpr_id integer NOT NULL,
    gpr_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    gpr_descricao character varying(100) NOT NULL,
    gpr_margem_lucro_percentual numeric(5,2) DEFAULT 0.00 NOT NULL,
    gpr_ativo boolean DEFAULT true NOT NULL,
    gpr_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT grupos_precificacao_gpr_margem_lucro_percentual_check CHECK ((gpr_margem_lucro_percentual >= (0)::numeric))
);


--
-- Name: TABLE grupos_precificacao; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.grupos_precificacao IS 'Grupos de precificação para cálculo de preços de venda.';


--
-- Name: COLUMN grupos_precificacao.gpr_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.grupos_precificacao.gpr_id IS 'Identificador interno do grupo.';


--
-- Name: COLUMN grupos_precificacao.gpr_uuid; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.grupos_precificacao.gpr_uuid IS 'Identificador público UUID do grupo.';


--
-- Name: COLUMN grupos_precificacao.gpr_descricao; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.grupos_precificacao.gpr_descricao IS 'Descrição do grupo (ex.: Varejo, Atacado, Técnico).';


--
-- Name: COLUMN grupos_precificacao.gpr_margem_lucro_percentual; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.grupos_precificacao.gpr_margem_lucro_percentual IS 'Margem de lucro percentual padrão do grupo.';


--
-- Name: COLUMN grupos_precificacao.gpr_ativo; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.grupos_precificacao.gpr_ativo IS 'Flag indicando se grupo está ativo.';


--
-- Name: grupos_precificacao_gpr_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.grupos_precificacao_gpr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grupos_precificacao_gpr_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.grupos_precificacao_gpr_id_seq OWNED BY livraria_comercial.grupos_precificacao.gpr_id;


--
-- Name: historico_entradas_estoque; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.historico_entradas_estoque (
    hee_id bigint NOT NULL,
    hee_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    liv_id bigint NOT NULL,
    for_id integer NOT NULL,
    hee_quantidade integer NOT NULL,
    hee_valor_custo_unitario numeric(10,2) NOT NULL,
    hee_valor_total numeric(10,2) NOT NULL,
    hee_data_entrada timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    hee_numero_nota_fiscal character varying(50),
    hee_observacoes text,
    hee_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT historico_entradas_estoque_hee_quantidade_check CHECK ((hee_quantidade > 0)),
    CONSTRAINT historico_entradas_estoque_hee_valor_custo_unitario_check CHECK ((hee_valor_custo_unitario >= (0)::numeric)),
    CONSTRAINT historico_entradas_estoque_hee_valor_total_check CHECK ((hee_valor_total >= (0)::numeric))
);


--
-- Name: TABLE historico_entradas_estoque; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.historico_entradas_estoque IS 'Histórico de entradas de estoque para cálculo de custo médio (RN0051).';


--
-- Name: COLUMN historico_entradas_estoque.hee_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.hee_id IS 'Identificador interno do registro.';


--
-- Name: COLUMN historico_entradas_estoque.hee_uuid; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.hee_uuid IS 'Identificador público UUID do registro.';


--
-- Name: COLUMN historico_entradas_estoque.liv_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.liv_id IS 'FK para livro.';


--
-- Name: COLUMN historico_entradas_estoque.for_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.for_id IS 'FK para fornecedor.';


--
-- Name: COLUMN historico_entradas_estoque.hee_quantidade; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.hee_quantidade IS 'Quantidade recebida.';


--
-- Name: COLUMN historico_entradas_estoque.hee_valor_custo_unitario; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.hee_valor_custo_unitario IS 'Custo unitário na entrada.';


--
-- Name: COLUMN historico_entradas_estoque.hee_valor_total; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.hee_valor_total IS 'Valor total da entrada (quantidade * custo).';


--
-- Name: COLUMN historico_entradas_estoque.hee_data_entrada; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.hee_data_entrada IS 'Data da entrada do estoque.';


--
-- Name: COLUMN historico_entradas_estoque.hee_numero_nota_fiscal; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.hee_numero_nota_fiscal IS 'Número da nota fiscal.';


--
-- Name: COLUMN historico_entradas_estoque.hee_observacoes; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.historico_entradas_estoque.hee_observacoes IS 'Observações adicionais.';


--
-- Name: historico_entradas_estoque_hee_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.historico_entradas_estoque_hee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: historico_entradas_estoque_hee_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.historico_entradas_estoque_hee_id_seq OWNED BY livraria_comercial.historico_entradas_estoque.hee_id;


--
-- Name: livro_categorias; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.livro_categorias (
    lct_id integer NOT NULL,
    liv_id bigint NOT NULL,
    cat_id integer NOT NULL,
    lct_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE livro_categorias; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.livro_categorias IS 'Tabela associativa para relacionamento N:N entre livros e categorias.';


--
-- Name: COLUMN livro_categorias.lct_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livro_categorias.lct_id IS 'Identificador interno do relacionamento.';


--
-- Name: COLUMN livro_categorias.liv_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livro_categorias.liv_id IS 'FK para livro.';


--
-- Name: COLUMN livro_categorias.cat_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livro_categorias.cat_id IS 'FK para categoria.';


--
-- Name: livro_categorias_lct_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.livro_categorias_lct_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: livro_categorias_lct_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.livro_categorias_lct_id_seq OWNED BY livraria_comercial.livro_categorias.lct_id;


--
-- Name: livros; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.livros (
    liv_id bigint NOT NULL,
    liv_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    liv_titulo character varying(300) NOT NULL,
    liv_titulo_norm character varying(300) NOT NULL,
    liv_ano integer NOT NULL,
    liv_edicao character varying(50),
    liv_isbn character varying(20) NOT NULL,
    liv_numero_paginas integer,
    liv_sinopse text,
    liv_altura numeric(5,2),
    liv_largura numeric(5,2),
    liv_peso numeric(6,3),
    liv_profundidade numeric(5,2),
    liv_codigo_barras character varying(20),
    aut_id integer NOT NULL,
    edi_id integer NOT NULL,
    gpr_id integer NOT NULL,
    liv_ativo boolean DEFAULT true NOT NULL,
    liv_imagem_url character varying(500),
    liv_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    liv_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT livros_liv_altura_check CHECK ((liv_altura > (0)::numeric)),
    CONSTRAINT livros_liv_ano_check CHECK (((liv_ano >= 1900) AND ((liv_ano)::numeric <= (EXTRACT(year FROM CURRENT_DATE) + (1)::numeric)))),
    CONSTRAINT livros_liv_largura_check CHECK ((liv_largura > (0)::numeric)),
    CONSTRAINT livros_liv_numero_paginas_check CHECK ((liv_numero_paginas > 0)),
    CONSTRAINT livros_liv_peso_check CHECK ((liv_peso > (0)::numeric)),
    CONSTRAINT livros_liv_profundidade_check CHECK ((liv_profundidade > (0)::numeric))
);


--
-- Name: TABLE livros; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.livros IS 'Catálogo central de livros (dados imutáveis do produto).';


--
-- Name: COLUMN livros.liv_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.liv_id IS 'Identificador interno do livro.';


--
-- Name: COLUMN livros.liv_uuid; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.liv_uuid IS 'Identificador público UUID do livro.';


--
-- Name: COLUMN livros.liv_titulo; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.liv_titulo IS 'Título completo do livro.';


--
-- Name: COLUMN livros.liv_titulo_norm; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.liv_titulo_norm IS 'Título normalizado para busca (sem acentos, maiúsculas).';


--
-- Name: COLUMN livros.liv_ano; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.liv_ano IS 'Ano de publicação.';


--
-- Name: COLUMN livros.liv_edicao; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.liv_edicao IS 'Número/ano da edição (ex.: "3ª edição").';


--
-- Name: COLUMN livros.liv_isbn; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.liv_isbn IS 'ISBN do livro (único).';


--
-- Name: COLUMN livros.liv_numero_paginas; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.liv_numero_paginas IS 'Número total de páginas.';


--
-- Name: COLUMN livros.liv_sinopse; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.liv_sinopse IS 'Sinopse/descrição do livro.';


--
-- Name: COLUMN livros.liv_altura; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.liv_altura IS 'Altura do livro em cm.';


--
-- Name: COLUMN livros.liv_largura; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.liv_largura IS 'Largura do livro em cm.';


--
-- Name: COLUMN livros.liv_peso; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.liv_peso IS 'Peso do livro em kg.';


--
-- Name: COLUMN livros.liv_profundidade; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.liv_profundidade IS 'Profundidade do livro em cm.';


--
-- Name: COLUMN livros.liv_codigo_barras; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.liv_codigo_barras IS 'Código de barras EAN/UPC.';


--
-- Name: COLUMN livros.aut_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.aut_id IS 'FK para autor principal.';


--
-- Name: COLUMN livros.edi_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.edi_id IS 'FK para editora.';


--
-- Name: COLUMN livros.gpr_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.gpr_id IS 'FK para grupo de precificação.';


--
-- Name: COLUMN livros.liv_ativo; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.liv_ativo IS 'Flag indicando se livro está ativo no catálogo.';


--
-- Name: COLUMN livros.liv_imagem_url; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.livros.liv_imagem_url IS 'URL da imagem de capa do livro.';


--
-- Name: livros_liv_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.livros_liv_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: livros_liv_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.livros_liv_id_seq OWNED BY livraria_comercial.livros.liv_id;


--
-- Name: notificacoes; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.notificacoes (
    not_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    not_usuario_uuid uuid NOT NULL,
    not_venda_uuid uuid,
    not_tipo character varying(50) NOT NULL,
    not_titulo character varying(255) NOT NULL,
    not_mensagem text NOT NULL,
    not_codigo_rastreio character varying(100),
    not_lida boolean DEFAULT false,
    not_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    not_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE notificacoes; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.notificacoes IS 'Armazena notificações para exibir badge no header do cliente';


--
-- Name: COLUMN notificacoes.not_uuid; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.notificacoes.not_uuid IS 'Identificador único da notificação';


--
-- Name: COLUMN notificacoes.not_usuario_uuid; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.notificacoes.not_usuario_uuid IS 'UUID do usuário destinatário';


--
-- Name: COLUMN notificacoes.not_venda_uuid; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.notificacoes.not_venda_uuid IS 'UUID da venda relacionada (opcional)';


--
-- Name: COLUMN notificacoes.not_tipo; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.notificacoes.not_tipo IS 'Tipo da notificação: RASTREIO, TROCA_AUTORIZADA, TROCA_FINALIZADA, TROCA_REJEITADA';


--
-- Name: COLUMN notificacoes.not_titulo; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.notificacoes.not_titulo IS 'Título curto da notificação';


--
-- Name: COLUMN notificacoes.not_mensagem; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.notificacoes.not_mensagem IS 'Mensagem detalhada da notificação';


--
-- Name: COLUMN notificacoes.not_codigo_rastreio; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.notificacoes.not_codigo_rastreio IS 'Código de rastreio (aplicável para tipo RASTREIO)';


--
-- Name: COLUMN notificacoes.not_lida; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.notificacoes.not_lida IS 'Indica se o usuário já visualizou a notificação';


--
-- Name: COLUMN notificacoes.not_criado_em; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.notificacoes.not_criado_em IS 'Data de criação da notificação';


--
-- Name: COLUMN notificacoes.not_atualizado_em; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.notificacoes.not_atualizado_em IS 'Data da última atualização';


--
-- Name: papeis; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.papeis (
    pap_id integer NOT NULL,
    pap_descricao character varying(30) NOT NULL,
    pap_criado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE papeis; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON TABLE livraria_comercial.papeis IS 'Papéis de acesso dos usuários do sistema.';


--
-- Name: COLUMN papeis.pap_id; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.papeis.pap_id IS 'Identificador interno do papel (nunca exposto nas rotas).';


--
-- Name: COLUMN papeis.pap_descricao; Type: COMMENT; Schema: livraria_comercial; Owner: -
--

COMMENT ON COLUMN livraria_comercial.papeis.pap_descricao IS 'Nome canônico do papel (ex.: cliente, admin).';


--
-- Name: papeis_pap_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.papeis_pap_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: papeis_pap_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.papeis_pap_id_seq OWNED BY livraria_comercial.papeis.pap_id;


--
-- Name: tipo_frete; Type: TABLE; Schema: livraria_comercial; Owner: -
--

CREATE TABLE livraria_comercial.tipo_frete (
    tfr_id integer NOT NULL,
    tfr_descricao character varying(100) NOT NULL,
    tfr_criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tipo_frete_tfr_id_seq; Type: SEQUENCE; Schema: livraria_comercial; Owner: -
--

CREATE SEQUENCE livraria_comercial.tipo_frete_tfr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_frete_tfr_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_comercial; Owner: -
--

ALTER SEQUENCE livraria_comercial.tipo_frete_tfr_id_seq OWNED BY livraria_comercial.tipo_frete.tfr_id;


--
-- Name: bandeiras_cartao; Type: TABLE; Schema: livraria_financeiro; Owner: -
--

CREATE TABLE livraria_financeiro.bandeiras_cartao (
    ban_id integer NOT NULL,
    ban_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    ban_descricao character varying(30) NOT NULL,
    ban_criado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE bandeiras_cartao; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON TABLE livraria_financeiro.bandeiras_cartao IS 'Bandeiras de cartão de crédito suportadas (RN0025).';


--
-- Name: COLUMN bandeiras_cartao.ban_id; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.bandeiras_cartao.ban_id IS 'Identificador interno da bandeira.';


--
-- Name: COLUMN bandeiras_cartao.ban_uuid; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.bandeiras_cartao.ban_uuid IS 'Identificador público (UUID v4).';


--
-- Name: COLUMN bandeiras_cartao.ban_descricao; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.bandeiras_cartao.ban_descricao IS 'Nome da bandeira (ex.: Visa, Mastercard, American Express).';


--
-- Name: COLUMN bandeiras_cartao.ban_criado_em; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.bandeiras_cartao.ban_criado_em IS 'Timestamp de criação da bandeira.';


--
-- Name: bandeiras_cartao_ban_id_seq; Type: SEQUENCE; Schema: livraria_financeiro; Owner: -
--

CREATE SEQUENCE livraria_financeiro.bandeiras_cartao_ban_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bandeiras_cartao_ban_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_financeiro; Owner: -
--

ALTER SEQUENCE livraria_financeiro.bandeiras_cartao_ban_id_seq OWNED BY livraria_financeiro.bandeiras_cartao.ban_id;


--
-- Name: cartao_pagamento; Type: TABLE; Schema: livraria_financeiro; Owner: -
--

CREATE TABLE livraria_financeiro.cartao_pagamento (
    cpp_id bigint NOT NULL,
    cpp_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    pag_id bigint NOT NULL,
    cpp_numero_tokenizado character varying(255) NOT NULL,
    cpp_nome_titular character varying(100) NOT NULL,
    cpp_validade character varying(7) NOT NULL,
    cpp_bandeira character varying(50) NOT NULL,
    cpp_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    loj_id bigint NOT NULL
);


--
-- Name: TABLE cartao_pagamento; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON TABLE livraria_financeiro.cartao_pagamento IS 'Dados de cartões utilizados em pagamentos (apenas tokens por segurança).';


--
-- Name: COLUMN cartao_pagamento.cpp_id; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.cpp_id IS 'Chave primária interna.';


--
-- Name: COLUMN cartao_pagamento.cpp_uuid; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.cpp_uuid IS 'Identificador público UUID.';


--
-- Name: COLUMN cartao_pagamento.pag_id; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.pag_id IS 'FK para pagamento — pagamento associado ao cartão.';


--
-- Name: COLUMN cartao_pagamento.cpp_numero_tokenizado; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.cpp_numero_tokenizado IS 'Token ou hash SHA-256 do número do cartão.';


--
-- Name: COLUMN cartao_pagamento.cpp_nome_titular; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.cpp_nome_titular IS 'Nome do titular impresso no cartão.';


--
-- Name: COLUMN cartao_pagamento.cpp_validade; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.cpp_validade IS 'Validade do cartão no formato MM/YYYY.';


--
-- Name: COLUMN cartao_pagamento.cpp_bandeira; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.cpp_bandeira IS 'Bandeira do cartão (Visa, Mastercard, etc.).';


--
-- Name: COLUMN cartao_pagamento.cpp_criado_em; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.cpp_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: COLUMN cartao_pagamento.loj_id; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartao_pagamento.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';


--
-- Name: cartao_pagamento_cpp_id_seq; Type: SEQUENCE; Schema: livraria_financeiro; Owner: -
--

CREATE SEQUENCE livraria_financeiro.cartao_pagamento_cpp_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cartao_pagamento_cpp_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_financeiro; Owner: -
--

ALTER SEQUENCE livraria_financeiro.cartao_pagamento_cpp_id_seq OWNED BY livraria_financeiro.cartao_pagamento.cpp_id;


--
-- Name: cartoes; Type: TABLE; Schema: livraria_financeiro; Owner: -
--

CREATE TABLE livraria_financeiro.cartoes (
    crt_id bigint NOT NULL,
    crt_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usu_id bigint NOT NULL,
    ban_id integer NOT NULL,
    crt_token character varying(255) NOT NULL,
    crt_final character(4) NOT NULL,
    crt_nome_impresso character varying(50) NOT NULL,
    crt_validade date NOT NULL,
    crt_principal boolean DEFAULT false NOT NULL,
    crt_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    crt_atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_cartoes_final_numerico CHECK ((crt_final ~ '^[0-9]{4}$'::text))
);


--
-- Name: TABLE cartoes; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON TABLE livraria_financeiro.cartoes IS 'Cartões de crédito cadastrados pelos usuários. Apenas token é armazenado por segurança.';


--
-- Name: COLUMN cartoes.crt_id; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartoes.crt_id IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';


--
-- Name: COLUMN cartoes.crt_uuid; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartoes.crt_uuid IS 'Identificador público (UUID v4). Retornado nas rotas HTTP.';


--
-- Name: COLUMN cartoes.usu_id; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartoes.usu_id IS 'FK para usuarios.';


--
-- Name: COLUMN cartoes.ban_id; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartoes.ban_id IS 'FK para bandeiras_cartao — bandeira do cartão.';


--
-- Name: COLUMN cartoes.crt_token; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartoes.crt_token IS 'Token do cartão retornado pela operadora. Nunca o número real.';


--
-- Name: COLUMN cartoes.crt_final; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartoes.crt_final IS 'Últimos 4 dígitos do cartão para identificação (ex.: 1234).';


--
-- Name: COLUMN cartoes.crt_nome_impresso; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartoes.crt_nome_impresso IS 'Nome como aparece impresso no cartão.';


--
-- Name: COLUMN cartoes.crt_validade; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartoes.crt_validade IS 'Data de validade do cartão (mês/ano).';


--
-- Name: COLUMN cartoes.crt_principal; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartoes.crt_principal IS 'TRUE se este é o cartão principal do usuário.';


--
-- Name: COLUMN cartoes.crt_criado_em; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartoes.crt_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: COLUMN cartoes.crt_atualizado_em; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.cartoes.crt_atualizado_em IS 'Timestamp da última atualização.';


--
-- Name: cartoes_crt_id_seq; Type: SEQUENCE; Schema: livraria_financeiro; Owner: -
--

CREATE SEQUENCE livraria_financeiro.cartoes_crt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cartoes_crt_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_financeiro; Owner: -
--

ALTER SEQUENCE livraria_financeiro.cartoes_crt_id_seq OWNED BY livraria_financeiro.cartoes.crt_id;


--
-- Name: intencao_pagamento; Type: TABLE; Schema: livraria_financeiro; Owner: -
--

CREATE TABLE livraria_financeiro.intencao_pagamento (
    inp_id bigint NOT NULL,
    inp_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    inp_valor numeric(10,2) NOT NULL,
    inp_moeda character varying(3) DEFAULT 'BRL'::character varying NOT NULL,
    inp_provedor character varying(32) NOT NULL,
    inp_estado character varying(32) NOT NULL,
    inp_hash_segredo character varying(128) NOT NULL,
    inp_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    inp_expira_em timestamp with time zone NOT NULL,
    inp_tentativas_confirmacao integer DEFAULT 0 NOT NULL,
    inp_confirmado_em timestamp with time zone,
    inp_recusado_em timestamp with time zone,
    ven_id bigint,
    loj_id bigint NOT NULL,
    CONSTRAINT intencao_pagamento_inp_estado_check CHECK (((inp_estado)::text = ANY ((ARRAY['CRIADA'::character varying, 'CONFIRMADA'::character varying, 'RECUSADA'::character varying, 'EXPIRADA'::character varying, 'CANCELADA'::character varying])::text[]))),
    CONSTRAINT intencao_pagamento_inp_tentativas_confirmacao_check CHECK ((inp_tentativas_confirmacao >= 0)),
    CONSTRAINT intencao_pagamento_inp_valor_check CHECK ((inp_valor > (0)::numeric))
);


--
-- Name: TABLE intencao_pagamento; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON TABLE livraria_financeiro.intencao_pagamento IS 'Intenção de pagamento/cobrança antes da confirmação no provedor (valor travado, TTL, estado).';


--
-- Name: COLUMN intencao_pagamento.inp_hash_segredo; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.intencao_pagamento.inp_hash_segredo IS 'HMAC-SHA-256 (hex) do segredo de confirmação; nunca armazenar segredo em claro.';


--
-- Name: COLUMN intencao_pagamento.inp_expira_em; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.intencao_pagamento.inp_expira_em IS 'Após este instante a intenção não pode ser confirmada (validação obrigatória na API).';


--
-- Name: COLUMN intencao_pagamento.loj_id; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.intencao_pagamento.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';


--
-- Name: intencao_pagamento_inp_id_seq; Type: SEQUENCE; Schema: livraria_financeiro; Owner: -
--

CREATE SEQUENCE livraria_financeiro.intencao_pagamento_inp_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: intencao_pagamento_inp_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_financeiro; Owner: -
--

ALTER SEQUENCE livraria_financeiro.intencao_pagamento_inp_id_seq OWNED BY livraria_financeiro.intencao_pagamento.inp_id;


--
-- Name: intencao_pagamento_simulado; Type: TABLE; Schema: livraria_financeiro; Owner: -
--

CREATE TABLE livraria_financeiro.intencao_pagamento_simulado (
    inp_id bigint NOT NULL
);


--
-- Name: TABLE intencao_pagamento_simulado; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON TABLE livraria_financeiro.intencao_pagamento_simulado IS 'Metadados específicos do provedor de pagamento simulado.';


--
-- Name: intencao_pagamento_stripe; Type: TABLE; Schema: livraria_financeiro; Owner: -
--

CREATE TABLE livraria_financeiro.intencao_pagamento_stripe (
    inp_id bigint NOT NULL,
    stripe_payment_intent_id character varying(255),
    stripe_customer_id character varying(255)
);


--
-- Name: TABLE intencao_pagamento_stripe; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON TABLE livraria_financeiro.intencao_pagamento_stripe IS 'Referências Stripe; segredos efêmeros não persistidos em texto plano.';


--
-- Name: pagamento; Type: TABLE; Schema: livraria_financeiro; Owner: -
--

CREATE TABLE livraria_financeiro.pagamento (
    pag_id bigint NOT NULL,
    pag_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    ven_id bigint NOT NULL,
    tpg_id integer NOT NULL,
    stp_id integer NOT NULL,
    pag_valor numeric(10,2) NOT NULL,
    pag_detalhes_cupom character varying(100),
    pag_processado_em timestamp with time zone,
    pag_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    pag_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    inp_id bigint,
    loj_id bigint NOT NULL,
    CONSTRAINT pagamento_pag_valor_check CHECK ((pag_valor > (0)::numeric))
);


--
-- Name: TABLE pagamento; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON TABLE livraria_financeiro.pagamento IS 'Registros de pagamentos realizados para vendas.';


--
-- Name: COLUMN pagamento.pag_id; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.pagamento.pag_id IS 'Chave primária interna.';


--
-- Name: COLUMN pagamento.pag_uuid; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.pagamento.pag_uuid IS 'Identificador público UUID.';


--
-- Name: COLUMN pagamento.ven_id; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.pagamento.ven_id IS 'FK para ecm_venda — venda associada ao pagamento.';


--
-- Name: COLUMN pagamento.tpg_id; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.pagamento.tpg_id IS 'FK para tipo_pagamento — tipo de pagamento utilizado.';


--
-- Name: COLUMN pagamento.stp_id; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.pagamento.stp_id IS 'FK para status_pagamento — status atual do pagamento.';


--
-- Name: COLUMN pagamento.pag_valor; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.pagamento.pag_valor IS 'Valor total do pagamento.';


--
-- Name: COLUMN pagamento.pag_detalhes_cupom; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.pagamento.pag_detalhes_cupom IS 'Código ou detalhes do cupom (quando aplicável).';


--
-- Name: COLUMN pagamento.pag_processado_em; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.pagamento.pag_processado_em IS 'Timestamp de processamento do pagamento.';


--
-- Name: COLUMN pagamento.pag_criado_em; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.pagamento.pag_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: COLUMN pagamento.pag_atualizado_em; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.pagamento.pag_atualizado_em IS 'Timestamp da última atualização.';


--
-- Name: COLUMN pagamento.inp_id; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.pagamento.inp_id IS 'FK opcional para intencao_pagamento (checkout com intenção prévia).';


--
-- Name: COLUMN pagamento.loj_id; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.pagamento.loj_id IS 'FK para lojas (multi-tenancy). Migration 045.';


--
-- Name: pagamento_pag_id_seq; Type: SEQUENCE; Schema: livraria_financeiro; Owner: -
--

CREATE SEQUENCE livraria_financeiro.pagamento_pag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pagamento_pag_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_financeiro; Owner: -
--

ALTER SEQUENCE livraria_financeiro.pagamento_pag_id_seq OWNED BY livraria_financeiro.pagamento.pag_id;


--
-- Name: pagamento_pix_simulado; Type: TABLE; Schema: livraria_financeiro; Owner: -
--

CREATE TABLE livraria_financeiro.pagamento_pix_simulado (
    pps_id bigint NOT NULL,
    pps_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    pag_id bigint NOT NULL,
    pps_codigo_qr character varying(255),
    pps_codigo_copia_cola character varying(255),
    pps_expiracao_em timestamp with time zone NOT NULL,
    pps_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    pps_segredo_confirmacao character varying(128)
);


--
-- Name: TABLE pagamento_pix_simulado; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON TABLE livraria_financeiro.pagamento_pix_simulado IS 'Cobrança PIX simulada (copia-e-cola, QR, expiração, segredo para webhook).';


--
-- Name: COLUMN pagamento_pix_simulado.pps_segredo_confirmacao; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.pagamento_pix_simulado.pps_segredo_confirmacao IS 'Segredo enviado ao webhook para confirmar liquidação (simula assinatura do PSP).';


--
-- Name: pagamento_pix_simulado_pps_id_seq; Type: SEQUENCE; Schema: livraria_financeiro; Owner: -
--

CREATE SEQUENCE livraria_financeiro.pagamento_pix_simulado_pps_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pagamento_pix_simulado_pps_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_financeiro; Owner: -
--

ALTER SEQUENCE livraria_financeiro.pagamento_pix_simulado_pps_id_seq OWNED BY livraria_financeiro.pagamento_pix_simulado.pps_id;


--
-- Name: status_pagamento; Type: TABLE; Schema: livraria_financeiro; Owner: -
--

CREATE TABLE livraria_financeiro.status_pagamento (
    stp_id integer NOT NULL,
    stp_descricao character varying(50) NOT NULL,
    stp_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE status_pagamento; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON TABLE livraria_financeiro.status_pagamento IS 'Status de pagamento das vendas (PENDENTE, APROVADO, RECUSADO, CANCELADO).';


--
-- Name: COLUMN status_pagamento.stp_id; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.status_pagamento.stp_id IS 'Identificador interno do status.';


--
-- Name: COLUMN status_pagamento.stp_descricao; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.status_pagamento.stp_descricao IS 'Descrição do status (ex.: PENDENTE, APROVADO).';


--
-- Name: COLUMN status_pagamento.stp_criado_em; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.status_pagamento.stp_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: status_pagamento_stp_id_seq; Type: SEQUENCE; Schema: livraria_financeiro; Owner: -
--

CREATE SEQUENCE livraria_financeiro.status_pagamento_stp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: status_pagamento_stp_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_financeiro; Owner: -
--

ALTER SEQUENCE livraria_financeiro.status_pagamento_stp_id_seq OWNED BY livraria_financeiro.status_pagamento.stp_id;


--
-- Name: tipo_pagamento; Type: TABLE; Schema: livraria_financeiro; Owner: -
--

CREATE TABLE livraria_financeiro.tipo_pagamento (
    tpg_id integer NOT NULL,
    tpg_descricao character varying(50) NOT NULL,
    tpg_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE tipo_pagamento; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON TABLE livraria_financeiro.tipo_pagamento IS 'Tipos de pagamento aceitos (cartao_credito, cupom_troca, cupom_promocional, pix).';


--
-- Name: COLUMN tipo_pagamento.tpg_id; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.tipo_pagamento.tpg_id IS 'Identificador interno do tipo de pagamento.';


--
-- Name: COLUMN tipo_pagamento.tpg_descricao; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.tipo_pagamento.tpg_descricao IS 'Descrição do tipo (ex.: cartao_credito, cupom_promocional).';


--
-- Name: COLUMN tipo_pagamento.tpg_criado_em; Type: COMMENT; Schema: livraria_financeiro; Owner: -
--

COMMENT ON COLUMN livraria_financeiro.tipo_pagamento.tpg_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: tipo_pagamento_tpg_id_seq; Type: SEQUENCE; Schema: livraria_financeiro; Owner: -
--

CREATE SEQUENCE livraria_financeiro.tipo_pagamento_tpg_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_pagamento_tpg_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_financeiro; Owner: -
--

ALTER SEQUENCE livraria_financeiro.tipo_pagamento_tpg_id_seq OWNED BY livraria_financeiro.tipo_pagamento.tpg_id;


--
-- Name: admin_lojas; Type: TABLE; Schema: livraria_gestao; Owner: -
--

CREATE TABLE livraria_gestao.admin_lojas (
    adl_id bigint NOT NULL,
    usu_id bigint NOT NULL,
    loj_id bigint NOT NULL,
    adl_papel character varying(20) NOT NULL,
    adl_ativo boolean DEFAULT true,
    adl_criado_em timestamp with time zone DEFAULT now()
);


--
-- Name: admin_lojas_adl_id_seq; Type: SEQUENCE; Schema: livraria_gestao; Owner: -
--

CREATE SEQUENCE livraria_gestao.admin_lojas_adl_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_lojas_adl_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_gestao; Owner: -
--

ALTER SEQUENCE livraria_gestao.admin_lojas_adl_id_seq OWNED BY livraria_gestao.admin_lojas.adl_id;


--
-- Name: clientes; Type: TABLE; Schema: livraria_gestao; Owner: -
--

CREATE TABLE livraria_gestao.clientes (
    cli_id bigint NOT NULL,
    cli_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usu_id bigint NOT NULL,
    cli_genero character varying(30),
    cli_data_nascimento date,
    cli_ranking integer DEFAULT 0 NOT NULL,
    loj_id bigint NOT NULL,
    cli_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    cli_atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE clientes; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON TABLE livraria_gestao.clientes IS 'Perfil 1:1 com usuarios, restrito a usuários com papel cliente. Armazena dados complementares não utilizados na autenticação.';


--
-- Name: COLUMN clientes.cli_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.clientes.cli_id IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';


--
-- Name: COLUMN clientes.cli_uuid; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.clientes.cli_uuid IS 'Identificador público (UUID v4). Retornado nas rotas HTTP quando necessário.';


--
-- Name: COLUMN clientes.usu_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.clientes.usu_id IS 'FK única para usuarios — garante relação 1:1.';


--
-- Name: COLUMN clientes.cli_genero; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.clientes.cli_genero IS 'Gênero autodeclarado pelo cliente (opcional). Sem restrição de domínio para suportar diversidade. RN0026.';


--
-- Name: COLUMN clientes.cli_data_nascimento; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.clientes.cli_data_nascimento IS 'Data de nascimento do cliente (opcional). RN0026.';


--
-- Name: COLUMN clientes.cli_ranking; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.clientes.cli_ranking IS 'Ranking numérico do cliente baseado no perfil de compra. RN0027. Valor padrão 0.';


--
-- Name: COLUMN clientes.loj_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.clientes.loj_id IS 'FK para lojas (multi-tenancy). Migration 030.';


--
-- Name: COLUMN clientes.cli_criado_em; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.clientes.cli_criado_em IS 'Timestamp de criação do perfil.';


--
-- Name: COLUMN clientes.cli_atualizado_em; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.clientes.cli_atualizado_em IS 'Timestamp da última atualização (mantido via trigger).';


--
-- Name: clientes_cli_id_seq; Type: SEQUENCE; Schema: livraria_gestao; Owner: -
--

CREATE SEQUENCE livraria_gestao.clientes_cli_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clientes_cli_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_gestao; Owner: -
--

ALTER SEQUENCE livraria_gestao.clientes_cli_id_seq OWNED BY livraria_gestao.clientes.cli_id;


--
-- Name: configuracoes_app; Type: TABLE; Schema: livraria_gestao; Owner: -
--

CREATE TABLE livraria_gestao.configuracoes_app (
    cfg_id integer NOT NULL,
    cfg_chave character varying(50) NOT NULL,
    cfg_valor text NOT NULL,
    cfg_descricao character varying(255),
    cfg_atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE configuracoes_app; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON TABLE livraria_gestao.configuracoes_app IS 'Configurações globais do sistema.';


--
-- Name: COLUMN configuracoes_app.cfg_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.configuracoes_app.cfg_id IS 'Identificador interno da configuração.';


--
-- Name: COLUMN configuracoes_app.cfg_chave; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.configuracoes_app.cfg_chave IS 'Chave única da configuração.';


--
-- Name: COLUMN configuracoes_app.cfg_valor; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.configuracoes_app.cfg_valor IS 'Valor da configuração (JSON ou texto).';


--
-- Name: COLUMN configuracoes_app.cfg_descricao; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.configuracoes_app.cfg_descricao IS 'Descrição do propósito da configuração.';


--
-- Name: COLUMN configuracoes_app.cfg_atualizado_em; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.configuracoes_app.cfg_atualizado_em IS 'Timestamp da última atualização.';


--
-- Name: configuracoes_app_cfg_id_seq; Type: SEQUENCE; Schema: livraria_gestao; Owner: -
--

CREATE SEQUENCE livraria_gestao.configuracoes_app_cfg_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: configuracoes_app_cfg_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_gestao; Owner: -
--

ALTER SEQUENCE livraria_gestao.configuracoes_app_cfg_id_seq OWNED BY livraria_gestao.configuracoes_app.cfg_id;


--
-- Name: enderecos; Type: TABLE; Schema: livraria_gestao; Owner: -
--

CREATE TABLE livraria_gestao.enderecos (
    end_id bigint NOT NULL,
    end_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usu_id bigint NOT NULL,
    end_tipo character varying(20) DEFAULT 'entrega'::character varying NOT NULL,
    end_apelido character varying(50),
    tre_id integer,
    log_id integer,
    end_numero character varying(10) NOT NULL,
    end_complemento character varying(100),
    cid_id integer,
    bai_id integer,
    cep_id character(8),
    pai_id integer DEFAULT 1 NOT NULL,
    loj_id bigint NOT NULL,
    end_principal boolean DEFAULT false NOT NULL,
    end_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    end_atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_enderecos_tipo CHECK (((end_tipo)::text = ANY ((ARRAY['cobranca'::character varying, 'entrega'::character varying])::text[])))
);


--
-- Name: TABLE enderecos; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON TABLE livraria_gestao.enderecos IS 'Endereços vinculados a um usuário. Um usuário pode ter N endereços, mas apenas um principal. Todos os componentes do endereço são normalizados em tabelas separadas.';


--
-- Name: COLUMN enderecos.end_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.end_id IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';


--
-- Name: COLUMN enderecos.end_uuid; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.end_uuid IS 'Identificador público (UUID v4). Retornado pelas rotas HTTP.';


--
-- Name: COLUMN enderecos.usu_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.usu_id IS 'FK para usuarios — proprietário do endereço.';


--
-- Name: COLUMN enderecos.end_tipo; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.end_tipo IS 'Tipo do endereço: cobranca ou entrega. RN0021/RN0022. Padrão: entrega.';


--
-- Name: COLUMN enderecos.end_apelido; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.end_apelido IS 'Apelido customizado do endereço (ex: Casa, Trabalho).';


--
-- Name: COLUMN enderecos.tre_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.tre_id IS 'FK para tipos_residencias (Casa, Apartamento…). Opcional.';


--
-- Name: COLUMN enderecos.log_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.log_id IS 'FK para logradouros — logradouro (tipo + nome).';


--
-- Name: COLUMN enderecos.end_numero; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.end_numero IS 'Número do imóvel no logradouro.';


--
-- Name: COLUMN enderecos.end_complemento; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.end_complemento IS 'Complemento opcional (ex.: apto 42, bloco B).';


--
-- Name: COLUMN enderecos.cid_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.cid_id IS 'FK para cidades — cidade do endereço.';


--
-- Name: COLUMN enderecos.bai_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.bai_id IS 'FK para bairros — bairro do endereço.';


--
-- Name: COLUMN enderecos.cep_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.cep_id IS 'FK para ceps — CEP do endereço (8 dígitos, sem formatação).';


--
-- Name: COLUMN enderecos.pai_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.pai_id IS 'FK para paises — país do endereço (padrão: Brasil).';


--
-- Name: COLUMN enderecos.loj_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.loj_id IS 'FK para lojas (multi-tenancy). Migration 030.';


--
-- Name: COLUMN enderecos.end_principal; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.end_principal IS 'TRUE indica que este é o endereço de entrega padrão do usuário.';


--
-- Name: COLUMN enderecos.end_criado_em; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.end_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: COLUMN enderecos.end_atualizado_em; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.enderecos.end_atualizado_em IS 'Timestamp da última atualização.';


--
-- Name: enderecos_end_id_seq; Type: SEQUENCE; Schema: livraria_gestao; Owner: -
--

CREATE SEQUENCE livraria_gestao.enderecos_end_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: enderecos_end_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_gestao; Owner: -
--

ALTER SEQUENCE livraria_gestao.enderecos_end_id_seq OWNED BY livraria_gestao.enderecos.end_id;


--
-- Name: lojas; Type: TABLE; Schema: livraria_gestao; Owner: -
--

CREATE TABLE livraria_gestao.lojas (
    loj_id bigint NOT NULL,
    loj_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    loj_nome character varying(100) NOT NULL,
    loj_slug character varying(50) NOT NULL,
    loj_cnpj character(18),
    loj_ativo boolean DEFAULT true,
    loj_criado_em timestamp with time zone DEFAULT now(),
    loj_atualizado_em timestamp with time zone DEFAULT now()
);


--
-- Name: lojas_loj_id_seq; Type: SEQUENCE; Schema: livraria_gestao; Owner: -
--

CREATE SEQUENCE livraria_gestao.lojas_loj_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lojas_loj_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_gestao; Owner: -
--

ALTER SEQUENCE livraria_gestao.lojas_loj_id_seq OWNED BY livraria_gestao.lojas.loj_id;


--
-- Name: papeis; Type: TABLE; Schema: livraria_gestao; Owner: -
--

CREATE TABLE livraria_gestao.papeis (
    pap_id integer NOT NULL,
    pap_descricao character varying(30) NOT NULL,
    pap_criado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE papeis; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON TABLE livraria_gestao.papeis IS 'Papéis de acesso dos usuários do sistema (schema livraria_gestao).';


--
-- Name: COLUMN papeis.pap_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.papeis.pap_id IS 'Identificador interno do papel (nunca exposto nas rotas).';


--
-- Name: COLUMN papeis.pap_descricao; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.papeis.pap_descricao IS 'Nome canônico do papel (ex.: cliente, admin).';


--
-- Name: papeis_pap_id_seq; Type: SEQUENCE; Schema: livraria_gestao; Owner: -
--

CREATE SEQUENCE livraria_gestao.papeis_pap_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: papeis_pap_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_gestao; Owner: -
--

ALTER SEQUENCE livraria_gestao.papeis_pap_id_seq OWNED BY livraria_gestao.papeis.pap_id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: livraria_gestao; Owner: -
--

CREATE TABLE livraria_gestao.refresh_tokens (
    rft_id bigint NOT NULL,
    rft_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usu_id bigint NOT NULL,
    rft_token_hash text NOT NULL,
    rft_ip_address text,
    rft_user_agent text,
    rft_expira_em timestamp with time zone NOT NULL,
    rft_revocado_em timestamp with time zone,
    rft_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    loj_id integer DEFAULT 1 NOT NULL
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON TABLE livraria_gestao.refresh_tokens IS 'Tabela de refresh tokens para implementação de access token (short-lived) + refresh token (long-lived)';


--
-- Name: COLUMN refresh_tokens.rft_token_hash; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.refresh_tokens.rft_token_hash IS 'Hash do refresh token (SHA-256) - nunca armazenar plaintext';


--
-- Name: COLUMN refresh_tokens.rft_ip_address; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.refresh_tokens.rft_ip_address IS 'IP do usuário para proteção contra replay attack';


--
-- Name: COLUMN refresh_tokens.rft_user_agent; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.refresh_tokens.rft_user_agent IS 'User agent para fingerprint básico';


--
-- Name: COLUMN refresh_tokens.rft_expira_em; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.refresh_tokens.rft_expira_em IS 'Data de expiração do refresh token (recomendado: 7-30 dias)';


--
-- Name: COLUMN refresh_tokens.rft_revocado_em; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.refresh_tokens.rft_revocado_em IS 'Data de revogação manual (logout, segurança)';


--
-- Name: refresh_tokens_rft_id_seq; Type: SEQUENCE; Schema: livraria_gestao; Owner: -
--

CREATE SEQUENCE livraria_gestao.refresh_tokens_rft_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_rft_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_gestao; Owner: -
--

ALTER SEQUENCE livraria_gestao.refresh_tokens_rft_id_seq OWNED BY livraria_gestao.refresh_tokens.rft_id;


--
-- Name: telefones; Type: TABLE; Schema: livraria_gestao; Owner: -
--

CREATE TABLE livraria_gestao.telefones (
    tel_id bigint NOT NULL,
    tel_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usu_id bigint NOT NULL,
    ttp_id integer NOT NULL,
    tel_ddd character(2) NOT NULL,
    tel_numero character varying(9) NOT NULL,
    tel_principal boolean DEFAULT false NOT NULL,
    tel_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    tel_atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_telefones_ddd_numerico CHECK ((tel_ddd ~ '^[0-9]{2}$'::text)),
    CONSTRAINT ck_telefones_numero_numerico CHECK (((tel_numero)::text ~ '^[0-9]{8,9}$'::text))
);


--
-- Name: TABLE telefones; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON TABLE livraria_gestao.telefones IS 'Objetos de valor de telefone vinculados a um usuário. Um usuário pode ter N telefones, mas apenas um principal.';


--
-- Name: COLUMN telefones.tel_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.telefones.tel_id IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';


--
-- Name: COLUMN telefones.tel_uuid; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.telefones.tel_uuid IS 'Identificador público (UUID v4). Retornado nas rotas HTTP.';


--
-- Name: COLUMN telefones.usu_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.telefones.usu_id IS 'FK para usuarios — dono do telefone.';


--
-- Name: COLUMN telefones.ttp_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.telefones.ttp_id IS 'FK para tipos_telefones (celular, residencial, comercial…).';


--
-- Name: COLUMN telefones.tel_ddd; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.telefones.tel_ddd IS 'Código DDD de 2 dígitos (somente números).';


--
-- Name: COLUMN telefones.tel_numero; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.telefones.tel_numero IS 'Número local com 8 ou 9 dígitos (somente números, sem formatação).';


--
-- Name: COLUMN telefones.tel_principal; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.telefones.tel_principal IS 'TRUE indica que este é o telefone de contato principal do usuário.';


--
-- Name: COLUMN telefones.tel_criado_em; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.telefones.tel_criado_em IS 'Timestamp de criação do telefone.';


--
-- Name: COLUMN telefones.tel_atualizado_em; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.telefones.tel_atualizado_em IS 'Timestamp da última atualização (mantido via trigger).';


--
-- Name: telefones_tel_id_seq; Type: SEQUENCE; Schema: livraria_gestao; Owner: -
--

CREATE SEQUENCE livraria_gestao.telefones_tel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: telefones_tel_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_gestao; Owner: -
--

ALTER SEQUENCE livraria_gestao.telefones_tel_id_seq OWNED BY livraria_gestao.telefones.tel_id;


--
-- Name: usuario_papeis; Type: TABLE; Schema: livraria_gestao; Owner: -
--

CREATE TABLE livraria_gestao.usuario_papeis (
    usp_id integer NOT NULL,
    usu_id bigint NOT NULL,
    pap_id integer NOT NULL,
    usp_ativo boolean DEFAULT true NOT NULL,
    usp_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    usp_atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE usuario_papeis; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON TABLE livraria_gestao.usuario_papeis IS 'Relacionamento N:M entre usuarios e papeis. Permite que um usuário tenha múltiplos papéis (ex: admin pode ter papéis de diferentes lojas).';


--
-- Name: COLUMN usuario_papeis.usp_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuario_papeis.usp_id IS 'Chave primária interna.';


--
-- Name: COLUMN usuario_papeis.usu_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuario_papeis.usu_id IS 'FK para usuarios.';


--
-- Name: COLUMN usuario_papeis.pap_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuario_papeis.pap_id IS 'FK para papeis.';


--
-- Name: COLUMN usuario_papeis.usp_ativo; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuario_papeis.usp_ativo IS 'Indica se o papel está ativo para este usuário.';


--
-- Name: COLUMN usuario_papeis.usp_criado_em; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuario_papeis.usp_criado_em IS 'Timestamp de criação do relacionamento.';


--
-- Name: COLUMN usuario_papeis.usp_atualizado_em; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuario_papeis.usp_atualizado_em IS 'Timestamp da última atualização.';


--
-- Name: usuario_papeis_usp_id_seq; Type: SEQUENCE; Schema: livraria_gestao; Owner: -
--

CREATE SEQUENCE livraria_gestao.usuario_papeis_usp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuario_papeis_usp_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_gestao; Owner: -
--

ALTER SEQUENCE livraria_gestao.usuario_papeis_usp_id_seq OWNED BY livraria_gestao.usuario_papeis.usp_id;


--
-- Name: usuarios; Type: TABLE; Schema: livraria_gestao; Owner: -
--

CREATE TABLE livraria_gestao.usuarios (
    usu_id bigint NOT NULL,
    usu_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usu_nome character varying(100) NOT NULL,
    usu_email character varying(255) NOT NULL,
    usu_cpf character(14),
    usu_senha_hash character varying(255) NOT NULL,
    pap_id integer NOT NULL,
    usu_ativo boolean DEFAULT true NOT NULL,
    loj_id bigint NOT NULL,
    usu_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    usu_atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    usu_cnpj character(18),
    usu_tipo_pessoa character(2) DEFAULT 'PF'::bpchar,
    usu_telefone_rapido character varying(15),
    usu_genero character varying(20),
    usu_data_nascimento date
);


--
-- Name: TABLE usuarios; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON TABLE livraria_gestao.usuarios IS 'Entidade central de identidade: todo ator autenticado (cliente ou admin) possui exatamente um registro aqui.';


--
-- Name: COLUMN usuarios.usu_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuarios.usu_id IS 'Chave primária interna (BIGSERIAL). Usada apenas em JOINs internos; nunca exposta nas rotas HTTP.';


--
-- Name: COLUMN usuarios.usu_uuid; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuarios.usu_uuid IS 'Identificador público (UUID v4). Único campo de identidade retornado pelas rotas HTTP.';


--
-- Name: COLUMN usuarios.usu_nome; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuarios.usu_nome IS 'Nome completo do usuário.';


--
-- Name: COLUMN usuarios.usu_email; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuarios.usu_email IS 'Endereço de e-mail único utilizado como login.';


--
-- Name: COLUMN usuarios.usu_cpf; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuarios.usu_cpf IS 'CPF no formato XXX.XXX.XXX-XX. Único por usuário.';


--
-- Name: COLUMN usuarios.usu_senha_hash; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuarios.usu_senha_hash IS 'Hash da senha (bcrypt). Nunca exposto nas rotas HTTP.';


--
-- Name: COLUMN usuarios.pap_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuarios.pap_id IS 'FK para papeis (admin, cliente).';


--
-- Name: COLUMN usuarios.usu_ativo; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuarios.usu_ativo IS 'Indica se o usuário está ativo. Usuários inativos não podem fazer login.';


--
-- Name: COLUMN usuarios.loj_id; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuarios.loj_id IS 'FK para lojas (multi-tenancy). Migration 030.';


--
-- Name: COLUMN usuarios.usu_criado_em; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuarios.usu_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: COLUMN usuarios.usu_atualizado_em; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuarios.usu_atualizado_em IS 'Timestamp da última atualização (mantido via trigger).';


--
-- Name: COLUMN usuarios.usu_cnpj; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuarios.usu_cnpj IS 'CNPJ no formato XX.XXX.XXX/XXXX-XX. Usado para pessoas jurídicas.';


--
-- Name: COLUMN usuarios.usu_tipo_pessoa; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuarios.usu_tipo_pessoa IS 'Tipo de pessoa: PF (Pessoa Física) ou PJ (Pessoa Jurídica).';


--
-- Name: COLUMN usuarios.usu_telefone_rapido; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuarios.usu_telefone_rapido IS 'Telefone de contato rápido do usuário.';


--
-- Name: COLUMN usuarios.usu_genero; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuarios.usu_genero IS 'Gênero do usuário (masculino, feminino, outro, não informado).';


--
-- Name: COLUMN usuarios.usu_data_nascimento; Type: COMMENT; Schema: livraria_gestao; Owner: -
--

COMMENT ON COLUMN livraria_gestao.usuarios.usu_data_nascimento IS 'Data de nascimento do usuário.';


--
-- Name: usuarios_usu_id_seq; Type: SEQUENCE; Schema: livraria_gestao; Owner: -
--

CREATE SEQUENCE livraria_gestao.usuarios_usu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_usu_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_gestao; Owner: -
--

ALTER SEQUENCE livraria_gestao.usuarios_usu_id_seq OWNED BY livraria_gestao.usuarios.usu_id;


--
-- Name: eventos_rastreamento; Type: TABLE; Schema: livraria_logistica; Owner: -
--

CREATE TABLE livraria_logistica.eventos_rastreamento (
    ere_id integer NOT NULL,
    ere_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    ras_uuid uuid NOT NULL,
    ere_codigo character varying(10) NOT NULL,
    ere_descricao character varying(255) NOT NULL,
    ere_detalhe text,
    ere_data timestamp without time zone NOT NULL,
    ere_local character varying(255),
    ere_destino character varying(255)
);


--
-- Name: TABLE eventos_rastreamento; Type: COMMENT; Schema: livraria_logistica; Owner: -
--

COMMENT ON TABLE livraria_logistica.eventos_rastreamento IS 'Histórico de eventos de rastreamento (mock de APIs de logística)';


--
-- Name: COLUMN eventos_rastreamento.ere_codigo; Type: COMMENT; Schema: livraria_logistica; Owner: -
--

COMMENT ON COLUMN livraria_logistica.eventos_rastreamento.ere_codigo IS 'Código do evento de rastreamento (ex: PO=Postado, RO=Em trânsito, OEC=Saiu para entrega, BDE=Entregue)';


--
-- Name: COLUMN eventos_rastreamento.ere_descricao; Type: COMMENT; Schema: livraria_logistica; Owner: -
--

COMMENT ON COLUMN livraria_logistica.eventos_rastreamento.ere_descricao IS 'Descrição do evento de rastreamento';


--
-- Name: COLUMN eventos_rastreamento.ere_local; Type: COMMENT; Schema: livraria_logistica; Owner: -
--

COMMENT ON COLUMN livraria_logistica.eventos_rastreamento.ere_local IS 'Local onde ocorreu o evento';


--
-- Name: COLUMN eventos_rastreamento.ere_destino; Type: COMMENT; Schema: livraria_logistica; Owner: -
--

COMMENT ON COLUMN livraria_logistica.eventos_rastreamento.ere_destino IS 'Destino do objeto (quando aplicável)';


--
-- Name: eventos_rastreamento_ere_id_seq; Type: SEQUENCE; Schema: livraria_logistica; Owner: -
--

CREATE SEQUENCE livraria_logistica.eventos_rastreamento_ere_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: eventos_rastreamento_ere_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_logistica; Owner: -
--

ALTER SEQUENCE livraria_logistica.eventos_rastreamento_ere_id_seq OWNED BY livraria_logistica.eventos_rastreamento.ere_id;


--
-- Name: rastreamentos; Type: TABLE; Schema: livraria_logistica; Owner: -
--

CREATE TABLE livraria_logistica.rastreamentos (
    ras_id integer NOT NULL,
    ras_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    ent_uuid uuid NOT NULL,
    ras_codigo character varying(20) NOT NULL,
    ras_transportadora character varying(50) NOT NULL,
    ras_data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ras_data_entrega_prevista timestamp without time zone,
    CONSTRAINT chk_transportadora CHECK (((ras_transportadora)::text = ANY ((ARRAY['Correios'::character varying, 'Loggi'::character varying])::text[])))
);


--
-- Name: TABLE rastreamentos; Type: COMMENT; Schema: livraria_logistica; Owner: -
--

COMMENT ON TABLE livraria_logistica.rastreamentos IS 'Códigos de rastreamento vinculados a entregas (mock de APIs de logística)';


--
-- Name: COLUMN rastreamentos.ras_codigo; Type: COMMENT; Schema: livraria_logistica; Owner: -
--

COMMENT ON COLUMN livraria_logistica.rastreamentos.ras_codigo IS 'Código de rastreamento da transportadora (ex: BR123456789BR para Correios, LG123456789 para Loggi)';


--
-- Name: COLUMN rastreamentos.ras_transportadora; Type: COMMENT; Schema: livraria_logistica; Owner: -
--

COMMENT ON COLUMN livraria_logistica.rastreamentos.ras_transportadora IS 'Transportadora responsável pelo rastreamento (Correios ou Loggi)';


--
-- Name: COLUMN rastreamentos.ras_data_entrega_prevista; Type: COMMENT; Schema: livraria_logistica; Owner: -
--

COMMENT ON COLUMN livraria_logistica.rastreamentos.ras_data_entrega_prevista IS 'Data prevista de entrega calculada pela API de logística';


--
-- Name: rastreamentos_ras_id_seq; Type: SEQUENCE; Schema: livraria_logistica; Owner: -
--

CREATE SEQUENCE livraria_logistica.rastreamentos_ras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rastreamentos_ras_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_logistica; Owner: -
--

ALTER SEQUENCE livraria_logistica.rastreamentos_ras_id_seq OWNED BY livraria_logistica.rastreamentos.ras_id;


--
-- Name: bairros; Type: TABLE; Schema: livraria_ref; Owner: -
--

CREATE TABLE livraria_ref.bairros (
    bai_id integer NOT NULL,
    bai_nome character varying(100) NOT NULL,
    bai_nome_norm character varying(100) NOT NULL,
    cid_id integer NOT NULL
);


--
-- Name: TABLE bairros; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON TABLE livraria_ref.bairros IS 'Bairros vinculados a cidades.';


--
-- Name: COLUMN bairros.bai_id; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.bairros.bai_id IS 'Chave primária interna.';


--
-- Name: COLUMN bairros.bai_nome; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.bairros.bai_nome IS 'Nome do bairro (ex.: Centro, Copacabana).';


--
-- Name: COLUMN bairros.bai_nome_norm; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.bairros.bai_nome_norm IS 'Nome normalizado (maiúsculas, sem acentos) para busca case-insensitive.';


--
-- Name: COLUMN bairros.cid_id; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.bairros.cid_id IS 'FK para cidades.';


--
-- Name: bairros_bai_id_seq; Type: SEQUENCE; Schema: livraria_ref; Owner: -
--

CREATE SEQUENCE livraria_ref.bairros_bai_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bairros_bai_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_ref; Owner: -
--

ALTER SEQUENCE livraria_ref.bairros_bai_id_seq OWNED BY livraria_ref.bairros.bai_id;


--
-- Name: ceps; Type: TABLE; Schema: livraria_ref; Owner: -
--

CREATE TABLE livraria_ref.ceps (
    cep_numero character(8) NOT NULL,
    cid_id integer NOT NULL,
    bai_id integer NOT NULL
);


--
-- Name: TABLE ceps; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON TABLE livraria_ref.ceps IS 'CEPs brasileiros vinculados a cidades e bairros.';


--
-- Name: COLUMN ceps.cep_numero; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.ceps.cep_numero IS 'CEP de 8 dígitos (sem formatação).';


--
-- Name: COLUMN ceps.cid_id; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.ceps.cid_id IS 'FK para cidades.';


--
-- Name: COLUMN ceps.bai_id; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.ceps.bai_id IS 'FK para bairros.';


--
-- Name: cidades; Type: TABLE; Schema: livraria_ref; Owner: -
--

CREATE TABLE livraria_ref.cidades (
    cid_id integer NOT NULL,
    cid_nome character varying(100) NOT NULL,
    cid_nome_norm character varying(100) NOT NULL,
    est_id integer NOT NULL
);


--
-- Name: TABLE cidades; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON TABLE livraria_ref.cidades IS 'Cidades brasileiras vinculadas a estados.';


--
-- Name: COLUMN cidades.cid_id; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.cidades.cid_id IS 'Chave primária interna.';


--
-- Name: COLUMN cidades.cid_nome; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.cidades.cid_nome IS 'Nome da cidade (ex.: São Paulo, Rio de Janeiro).';


--
-- Name: COLUMN cidades.cid_nome_norm; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.cidades.cid_nome_norm IS 'Nome normalizado (maiúsculas, sem acentos) para busca case-insensitive.';


--
-- Name: COLUMN cidades.est_id; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.cidades.est_id IS 'FK para estados.';


--
-- Name: cidades_cid_id_seq; Type: SEQUENCE; Schema: livraria_ref; Owner: -
--

CREATE SEQUENCE livraria_ref.cidades_cid_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cidades_cid_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_ref; Owner: -
--

ALTER SEQUENCE livraria_ref.cidades_cid_id_seq OWNED BY livraria_ref.cidades.cid_id;


--
-- Name: estados; Type: TABLE; Schema: livraria_ref; Owner: -
--

CREATE TABLE livraria_ref.estados (
    est_id integer NOT NULL,
    est_sigla character(2) NOT NULL,
    est_nome character varying(60) NOT NULL
);


--
-- Name: TABLE estados; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON TABLE livraria_ref.estados IS 'Estados e Distrito Federal do Brasil.';


--
-- Name: COLUMN estados.est_id; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.estados.est_id IS 'Identificador interno do estado.';


--
-- Name: COLUMN estados.est_sigla; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.estados.est_sigla IS 'Sigla de dois caracteres (ex.: SP, RJ, MG).';


--
-- Name: COLUMN estados.est_nome; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.estados.est_nome IS 'Nome completo do estado (ex.: São Paulo, Rio de Janeiro).';


--
-- Name: estados_est_id_seq; Type: SEQUENCE; Schema: livraria_ref; Owner: -
--

CREATE SEQUENCE livraria_ref.estados_est_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: estados_est_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_ref; Owner: -
--

ALTER SEQUENCE livraria_ref.estados_est_id_seq OWNED BY livraria_ref.estados.est_id;


--
-- Name: logradouros; Type: TABLE; Schema: livraria_ref; Owner: -
--

CREATE TABLE livraria_ref.logradouros (
    log_id integer NOT NULL,
    tlo_id integer,
    log_nome character varying(200) NOT NULL,
    log_criado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE logradouros; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON TABLE livraria_ref.logradouros IS 'Logradouros normalizados (tipo + nome). Permite reusar endereços de rua idênticos.';


--
-- Name: COLUMN logradouros.log_id; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.logradouros.log_id IS 'Identificador interno do logradouro.';


--
-- Name: COLUMN logradouros.tlo_id; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.logradouros.tlo_id IS 'FK para tipos_logradouros (Rua, Avenida…).';


--
-- Name: COLUMN logradouros.log_nome; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.logradouros.log_nome IS 'Nome do logradouro sem o tipo.';


--
-- Name: COLUMN logradouros.log_criado_em; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.logradouros.log_criado_em IS 'Timestamp de criação do logradouro.';


--
-- Name: logradouros_log_id_seq; Type: SEQUENCE; Schema: livraria_ref; Owner: -
--

CREATE SEQUENCE livraria_ref.logradouros_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: logradouros_log_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_ref; Owner: -
--

ALTER SEQUENCE livraria_ref.logradouros_log_id_seq OWNED BY livraria_ref.logradouros.log_id;


--
-- Name: paises; Type: TABLE; Schema: livraria_ref; Owner: -
--

CREATE TABLE livraria_ref.paises (
    pai_id integer NOT NULL,
    pai_sigla character(3) NOT NULL,
    pai_nome character varying(100) NOT NULL
);


--
-- Name: TABLE paises; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON TABLE livraria_ref.paises IS 'Países para normalização de endereços.';


--
-- Name: COLUMN paises.pai_id; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.paises.pai_id IS 'Chave primária interna.';


--
-- Name: COLUMN paises.pai_sigla; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.paises.pai_sigla IS 'Sigla ISO de 3 caracteres (ex.: BRA, USA).';


--
-- Name: COLUMN paises.pai_nome; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.paises.pai_nome IS 'Nome do país (ex.: Brasil, Estados Unidos).';


--
-- Name: paises_pai_id_seq; Type: SEQUENCE; Schema: livraria_ref; Owner: -
--

CREATE SEQUENCE livraria_ref.paises_pai_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: paises_pai_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_ref; Owner: -
--

ALTER SEQUENCE livraria_ref.paises_pai_id_seq OWNED BY livraria_ref.paises.pai_id;


--
-- Name: tipos_logradouros; Type: TABLE; Schema: livraria_ref; Owner: -
--

CREATE TABLE livraria_ref.tipos_logradouros (
    tlo_id integer NOT NULL,
    tlo_descricao character varying(50) NOT NULL
);


--
-- Name: TABLE tipos_logradouros; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON TABLE livraria_ref.tipos_logradouros IS 'Tipos de logradouro (Rua, Avenida, Alameda, Travessa…).';


--
-- Name: COLUMN tipos_logradouros.tlo_id; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.tipos_logradouros.tlo_id IS 'Identificador interno do tipo de logradouro.';


--
-- Name: COLUMN tipos_logradouros.tlo_descricao; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.tipos_logradouros.tlo_descricao IS 'Descrição do tipo (ex.: Rua, Avenida, Alameda).';


--
-- Name: tipos_logradouros_tlo_id_seq; Type: SEQUENCE; Schema: livraria_ref; Owner: -
--

CREATE SEQUENCE livraria_ref.tipos_logradouros_tlo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipos_logradouros_tlo_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_ref; Owner: -
--

ALTER SEQUENCE livraria_ref.tipos_logradouros_tlo_id_seq OWNED BY livraria_ref.tipos_logradouros.tlo_id;


--
-- Name: tipos_residencias; Type: TABLE; Schema: livraria_ref; Owner: -
--

CREATE TABLE livraria_ref.tipos_residencias (
    tre_id integer NOT NULL,
    tre_descricao character varying(50) NOT NULL
);


--
-- Name: TABLE tipos_residencias; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON TABLE livraria_ref.tipos_residencias IS 'Tipos de residência vinculados a endereços dos clientes.';


--
-- Name: COLUMN tipos_residencias.tre_id; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.tipos_residencias.tre_id IS 'Identificador interno do tipo de residência.';


--
-- Name: COLUMN tipos_residencias.tre_descricao; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.tipos_residencias.tre_descricao IS 'Descrição do tipo (ex.: Casa, Apartamento, Condomínio).';


--
-- Name: tipos_residencias_tre_id_seq; Type: SEQUENCE; Schema: livraria_ref; Owner: -
--

CREATE SEQUENCE livraria_ref.tipos_residencias_tre_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipos_residencias_tre_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_ref; Owner: -
--

ALTER SEQUENCE livraria_ref.tipos_residencias_tre_id_seq OWNED BY livraria_ref.tipos_residencias.tre_id;


--
-- Name: tipos_telefones; Type: TABLE; Schema: livraria_ref; Owner: -
--

CREATE TABLE livraria_ref.tipos_telefones (
    ttp_id integer NOT NULL,
    ttp_descricao character varying(30) NOT NULL
);


--
-- Name: TABLE tipos_telefones; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON TABLE livraria_ref.tipos_telefones IS 'Tipos de telefone aceitos pelo sistema (celular, residencial, comercial…).';


--
-- Name: COLUMN tipos_telefones.ttp_id; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.tipos_telefones.ttp_id IS 'Identificador interno do tipo de telefone.';


--
-- Name: COLUMN tipos_telefones.ttp_descricao; Type: COMMENT; Schema: livraria_ref; Owner: -
--

COMMENT ON COLUMN livraria_ref.tipos_telefones.ttp_descricao IS 'Descrição do tipo (ex.: celular, residencial, comercial).';


--
-- Name: tipos_telefones_ttp_id_seq; Type: SEQUENCE; Schema: livraria_ref; Owner: -
--

CREATE SEQUENCE livraria_ref.tipos_telefones_ttp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipos_telefones_ttp_id_seq; Type: SEQUENCE OWNED BY; Schema: livraria_ref; Owner: -
--

ALTER SEQUENCE livraria_ref.tipos_telefones_ttp_id_seq OWNED BY livraria_ref.tipos_telefones.ttp_id;


--
-- Name: autores aut_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.autores ALTER COLUMN aut_id SET DEFAULT nextval('livraria_comercial.autores_aut_id_seq'::regclass);


--
-- Name: avaliacoes_livro avl_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.avaliacoes_livro ALTER COLUMN avl_id SET DEFAULT nextval('livraria_comercial.avaliacoes_livro_avl_id_seq'::regclass);


--
-- Name: carrinho_itens cri_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.carrinho_itens ALTER COLUMN cri_id SET DEFAULT nextval('livraria_comercial.carrinho_itens_cri_id_seq'::regclass);


--
-- Name: categorias cat_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.categorias ALTER COLUMN cat_id SET DEFAULT nextval('livraria_comercial.categorias_cat_id_seq'::regclass);


--
-- Name: cotacao_frete cfr_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cotacao_frete ALTER COLUMN cfr_id SET DEFAULT nextval('livraria_comercial.cotacao_frete_cfr_id_seq'::regclass);


--
-- Name: cupom cup_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cupom ALTER COLUMN cup_id SET DEFAULT nextval('livraria_comercial.cupom_cup_id_seq'::regclass);


--
-- Name: cupons_troca cpt_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cupons_troca ALTER COLUMN cpt_id SET DEFAULT nextval('livraria_comercial.cupons_troca_cpt_id_seq'::regclass);


--
-- Name: editoras edi_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.editoras ALTER COLUMN edi_id SET DEFAULT nextval('livraria_comercial.editoras_edi_id_seq'::regclass);


--
-- Name: entrega ent_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.entrega ALTER COLUMN ent_id SET DEFAULT nextval('livraria_comercial.entrega_ent_id_seq'::regclass);


--
-- Name: estoques etq_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.estoques ALTER COLUMN etq_id SET DEFAULT nextval('livraria_comercial.estoques_etq_id_seq'::regclass);


--
-- Name: fornecedores for_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.fornecedores ALTER COLUMN for_id SET DEFAULT nextval('livraria_comercial.fornecedores_for_id_seq'::regclass);


--
-- Name: grupos_precificacao gpr_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.grupos_precificacao ALTER COLUMN gpr_id SET DEFAULT nextval('livraria_comercial.grupos_precificacao_gpr_id_seq'::regclass);


--
-- Name: historico_entradas_estoque hee_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.historico_entradas_estoque ALTER COLUMN hee_id SET DEFAULT nextval('livraria_comercial.historico_entradas_estoque_hee_id_seq'::regclass);


--
-- Name: itens_venda itv_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.itens_venda ALTER COLUMN itv_id SET DEFAULT nextval('livraria_comercial.ecm_item_venda_itv_id_seq'::regclass);


--
-- Name: livro_categorias lct_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.livro_categorias ALTER COLUMN lct_id SET DEFAULT nextval('livraria_comercial.livro_categorias_lct_id_seq'::regclass);


--
-- Name: livros liv_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.livros ALTER COLUMN liv_id SET DEFAULT nextval('livraria_comercial.livros_liv_id_seq'::regclass);


--
-- Name: papeis pap_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.papeis ALTER COLUMN pap_id SET DEFAULT nextval('livraria_comercial.papeis_pap_id_seq'::regclass);


--
-- Name: status_venda stv_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.status_venda ALTER COLUMN stv_id SET DEFAULT nextval('livraria_comercial.ecm_status_venda_stv_id_seq'::regclass);


--
-- Name: tipo_frete tfr_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.tipo_frete ALTER COLUMN tfr_id SET DEFAULT nextval('livraria_comercial.tipo_frete_tfr_id_seq'::regclass);


--
-- Name: vendas ven_id; Type: DEFAULT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.vendas ALTER COLUMN ven_id SET DEFAULT nextval('livraria_comercial.ecm_venda_ven_id_seq'::regclass);


--
-- Name: bandeiras_cartao ban_id; Type: DEFAULT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.bandeiras_cartao ALTER COLUMN ban_id SET DEFAULT nextval('livraria_financeiro.bandeiras_cartao_ban_id_seq'::regclass);


--
-- Name: cartao_pagamento cpp_id; Type: DEFAULT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.cartao_pagamento ALTER COLUMN cpp_id SET DEFAULT nextval('livraria_financeiro.cartao_pagamento_cpp_id_seq'::regclass);


--
-- Name: cartoes crt_id; Type: DEFAULT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.cartoes ALTER COLUMN crt_id SET DEFAULT nextval('livraria_financeiro.cartoes_crt_id_seq'::regclass);


--
-- Name: intencao_pagamento inp_id; Type: DEFAULT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.intencao_pagamento ALTER COLUMN inp_id SET DEFAULT nextval('livraria_financeiro.intencao_pagamento_inp_id_seq'::regclass);


--
-- Name: pagamento pag_id; Type: DEFAULT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.pagamento ALTER COLUMN pag_id SET DEFAULT nextval('livraria_financeiro.pagamento_pag_id_seq'::regclass);


--
-- Name: pagamento_pix_simulado pps_id; Type: DEFAULT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.pagamento_pix_simulado ALTER COLUMN pps_id SET DEFAULT nextval('livraria_financeiro.pagamento_pix_simulado_pps_id_seq'::regclass);


--
-- Name: status_pagamento stp_id; Type: DEFAULT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.status_pagamento ALTER COLUMN stp_id SET DEFAULT nextval('livraria_financeiro.status_pagamento_stp_id_seq'::regclass);


--
-- Name: tipo_pagamento tpg_id; Type: DEFAULT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.tipo_pagamento ALTER COLUMN tpg_id SET DEFAULT nextval('livraria_financeiro.tipo_pagamento_tpg_id_seq'::regclass);


--
-- Name: admin_lojas adl_id; Type: DEFAULT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.admin_lojas ALTER COLUMN adl_id SET DEFAULT nextval('livraria_gestao.admin_lojas_adl_id_seq'::regclass);


--
-- Name: clientes cli_id; Type: DEFAULT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.clientes ALTER COLUMN cli_id SET DEFAULT nextval('livraria_gestao.clientes_cli_id_seq'::regclass);


--
-- Name: configuracoes_app cfg_id; Type: DEFAULT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.configuracoes_app ALTER COLUMN cfg_id SET DEFAULT nextval('livraria_gestao.configuracoes_app_cfg_id_seq'::regclass);


--
-- Name: enderecos end_id; Type: DEFAULT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.enderecos ALTER COLUMN end_id SET DEFAULT nextval('livraria_gestao.enderecos_end_id_seq'::regclass);


--
-- Name: lojas loj_id; Type: DEFAULT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.lojas ALTER COLUMN loj_id SET DEFAULT nextval('livraria_gestao.lojas_loj_id_seq'::regclass);


--
-- Name: papeis pap_id; Type: DEFAULT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.papeis ALTER COLUMN pap_id SET DEFAULT nextval('livraria_gestao.papeis_pap_id_seq'::regclass);


--
-- Name: refresh_tokens rft_id; Type: DEFAULT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.refresh_tokens ALTER COLUMN rft_id SET DEFAULT nextval('livraria_gestao.refresh_tokens_rft_id_seq'::regclass);


--
-- Name: telefones tel_id; Type: DEFAULT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.telefones ALTER COLUMN tel_id SET DEFAULT nextval('livraria_gestao.telefones_tel_id_seq'::regclass);


--
-- Name: usuario_papeis usp_id; Type: DEFAULT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.usuario_papeis ALTER COLUMN usp_id SET DEFAULT nextval('livraria_gestao.usuario_papeis_usp_id_seq'::regclass);


--
-- Name: usuarios usu_id; Type: DEFAULT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.usuarios ALTER COLUMN usu_id SET DEFAULT nextval('livraria_gestao.usuarios_usu_id_seq'::regclass);


--
-- Name: eventos_rastreamento ere_id; Type: DEFAULT; Schema: livraria_logistica; Owner: -
--

ALTER TABLE ONLY livraria_logistica.eventos_rastreamento ALTER COLUMN ere_id SET DEFAULT nextval('livraria_logistica.eventos_rastreamento_ere_id_seq'::regclass);


--
-- Name: rastreamentos ras_id; Type: DEFAULT; Schema: livraria_logistica; Owner: -
--

ALTER TABLE ONLY livraria_logistica.rastreamentos ALTER COLUMN ras_id SET DEFAULT nextval('livraria_logistica.rastreamentos_ras_id_seq'::regclass);


--
-- Name: bairros bai_id; Type: DEFAULT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.bairros ALTER COLUMN bai_id SET DEFAULT nextval('livraria_ref.bairros_bai_id_seq'::regclass);


--
-- Name: cidades cid_id; Type: DEFAULT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.cidades ALTER COLUMN cid_id SET DEFAULT nextval('livraria_ref.cidades_cid_id_seq'::regclass);


--
-- Name: estados est_id; Type: DEFAULT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.estados ALTER COLUMN est_id SET DEFAULT nextval('livraria_ref.estados_est_id_seq'::regclass);


--
-- Name: logradouros log_id; Type: DEFAULT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.logradouros ALTER COLUMN log_id SET DEFAULT nextval('livraria_ref.logradouros_log_id_seq'::regclass);


--
-- Name: paises pai_id; Type: DEFAULT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.paises ALTER COLUMN pai_id SET DEFAULT nextval('livraria_ref.paises_pai_id_seq'::regclass);


--
-- Name: tipos_logradouros tlo_id; Type: DEFAULT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.tipos_logradouros ALTER COLUMN tlo_id SET DEFAULT nextval('livraria_ref.tipos_logradouros_tlo_id_seq'::regclass);


--
-- Name: tipos_residencias tre_id; Type: DEFAULT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.tipos_residencias ALTER COLUMN tre_id SET DEFAULT nextval('livraria_ref.tipos_residencias_tre_id_seq'::regclass);


--
-- Name: tipos_telefones ttp_id; Type: DEFAULT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.tipos_telefones ALTER COLUMN ttp_id SET DEFAULT nextval('livraria_ref.tipos_telefones_ttp_id_seq'::regclass);


--
-- Name: autores autores_aut_uuid_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.autores
    ADD CONSTRAINT autores_aut_uuid_key UNIQUE (aut_uuid);


--
-- Name: autores autores_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.autores
    ADD CONSTRAINT autores_pkey PRIMARY KEY (aut_id);


--
-- Name: avaliacoes_livro avaliacoes_livro_avl_uuid_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.avaliacoes_livro
    ADD CONSTRAINT avaliacoes_livro_avl_uuid_key UNIQUE (avl_uuid);


--
-- Name: avaliacoes_livro avaliacoes_livro_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.avaliacoes_livro
    ADD CONSTRAINT avaliacoes_livro_pkey PRIMARY KEY (avl_id);


--
-- Name: carrinho_itens carrinho_itens_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.carrinho_itens
    ADD CONSTRAINT carrinho_itens_pkey PRIMARY KEY (cri_id);


--
-- Name: categorias categorias_cat_nome_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.categorias
    ADD CONSTRAINT categorias_cat_nome_key UNIQUE (cat_nome);


--
-- Name: categorias categorias_cat_uuid_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.categorias
    ADD CONSTRAINT categorias_cat_uuid_key UNIQUE (cat_uuid);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (cat_id);


--
-- Name: cotacao_frete cotacao_frete_cfr_uuid_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cotacao_frete
    ADD CONSTRAINT cotacao_frete_cfr_uuid_key UNIQUE (cfr_uuid);


--
-- Name: cotacao_frete cotacao_frete_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cotacao_frete
    ADD CONSTRAINT cotacao_frete_pkey PRIMARY KEY (cfr_id);


--
-- Name: cotacao_frete_simulada cotacao_frete_simulada_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cotacao_frete_simulada
    ADD CONSTRAINT cotacao_frete_simulada_pkey PRIMARY KEY (cfr_id);


--
-- Name: cupom cupom_cup_codigo_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cupom
    ADD CONSTRAINT cupom_cup_codigo_key UNIQUE (cup_codigo);


--
-- Name: cupom cupom_cup_uuid_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cupom
    ADD CONSTRAINT cupom_cup_uuid_key UNIQUE (cup_uuid);


--
-- Name: cupom cupom_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cupom
    ADD CONSTRAINT cupom_pkey PRIMARY KEY (cup_id);


--
-- Name: cupons_troca cupons_troca_cpt_codigo_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cupons_troca
    ADD CONSTRAINT cupons_troca_cpt_codigo_key UNIQUE (cpt_codigo);


--
-- Name: cupons_troca cupons_troca_cpt_uuid_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cupons_troca
    ADD CONSTRAINT cupons_troca_cpt_uuid_key UNIQUE (cpt_uuid);


--
-- Name: cupons_troca cupons_troca_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cupons_troca
    ADD CONSTRAINT cupons_troca_pkey PRIMARY KEY (cpt_id);


--
-- Name: itens_venda ecm_item_venda_itv_uuid_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.itens_venda
    ADD CONSTRAINT ecm_item_venda_itv_uuid_key UNIQUE (itv_uuid);


--
-- Name: itens_venda ecm_item_venda_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.itens_venda
    ADD CONSTRAINT ecm_item_venda_pkey PRIMARY KEY (itv_id);


--
-- Name: status_venda ecm_status_venda_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.status_venda
    ADD CONSTRAINT ecm_status_venda_pkey PRIMARY KEY (stv_id);


--
-- Name: status_venda ecm_status_venda_stv_descricao_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.status_venda
    ADD CONSTRAINT ecm_status_venda_stv_descricao_key UNIQUE (stv_descricao);


--
-- Name: vendas ecm_venda_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.vendas
    ADD CONSTRAINT ecm_venda_pkey PRIMARY KEY (ven_id);


--
-- Name: vendas ecm_venda_ven_uuid_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.vendas
    ADD CONSTRAINT ecm_venda_ven_uuid_key UNIQUE (ven_uuid);


--
-- Name: editoras editoras_edi_uuid_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.editoras
    ADD CONSTRAINT editoras_edi_uuid_key UNIQUE (edi_uuid);


--
-- Name: editoras editoras_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.editoras
    ADD CONSTRAINT editoras_pkey PRIMARY KEY (edi_id);


--
-- Name: entrega entrega_ent_uuid_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.entrega
    ADD CONSTRAINT entrega_ent_uuid_key UNIQUE (ent_uuid);


--
-- Name: entrega entrega_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.entrega
    ADD CONSTRAINT entrega_pkey PRIMARY KEY (ent_id);


--
-- Name: estoques estoques_etq_uuid_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.estoques
    ADD CONSTRAINT estoques_etq_uuid_key UNIQUE (etq_uuid);


--
-- Name: estoques estoques_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.estoques
    ADD CONSTRAINT estoques_pkey PRIMARY KEY (etq_id);


--
-- Name: fornecedores fornecedores_for_uuid_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.fornecedores
    ADD CONSTRAINT fornecedores_for_uuid_key UNIQUE (for_uuid);


--
-- Name: fornecedores fornecedores_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.fornecedores
    ADD CONSTRAINT fornecedores_pkey PRIMARY KEY (for_id);


--
-- Name: grupos_precificacao grupos_precificacao_gpr_descricao_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.grupos_precificacao
    ADD CONSTRAINT grupos_precificacao_gpr_descricao_key UNIQUE (gpr_descricao);


--
-- Name: grupos_precificacao grupos_precificacao_gpr_uuid_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.grupos_precificacao
    ADD CONSTRAINT grupos_precificacao_gpr_uuid_key UNIQUE (gpr_uuid);


--
-- Name: grupos_precificacao grupos_precificacao_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.grupos_precificacao
    ADD CONSTRAINT grupos_precificacao_pkey PRIMARY KEY (gpr_id);


--
-- Name: historico_entradas_estoque historico_entradas_estoque_hee_uuid_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.historico_entradas_estoque
    ADD CONSTRAINT historico_entradas_estoque_hee_uuid_key UNIQUE (hee_uuid);


--
-- Name: historico_entradas_estoque historico_entradas_estoque_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.historico_entradas_estoque
    ADD CONSTRAINT historico_entradas_estoque_pkey PRIMARY KEY (hee_id);


--
-- Name: livro_categorias livro_categorias_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.livro_categorias
    ADD CONSTRAINT livro_categorias_pkey PRIMARY KEY (lct_id);


--
-- Name: livros livros_liv_codigo_barras_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.livros
    ADD CONSTRAINT livros_liv_codigo_barras_key UNIQUE (liv_codigo_barras);


--
-- Name: livros livros_liv_isbn_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.livros
    ADD CONSTRAINT livros_liv_isbn_key UNIQUE (liv_isbn);


--
-- Name: livros livros_liv_uuid_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.livros
    ADD CONSTRAINT livros_liv_uuid_key UNIQUE (liv_uuid);


--
-- Name: livros livros_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.livros
    ADD CONSTRAINT livros_pkey PRIMARY KEY (liv_id);


--
-- Name: notificacoes notificacoes_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.notificacoes
    ADD CONSTRAINT notificacoes_pkey PRIMARY KEY (not_uuid);


--
-- Name: papeis papeis_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.papeis
    ADD CONSTRAINT papeis_pkey PRIMARY KEY (pap_id);


--
-- Name: tipo_frete tipo_frete_pkey; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.tipo_frete
    ADD CONSTRAINT tipo_frete_pkey PRIMARY KEY (tfr_id);


--
-- Name: tipo_frete tipo_frete_tfr_descricao_key; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.tipo_frete
    ADD CONSTRAINT tipo_frete_tfr_descricao_key UNIQUE (tfr_descricao);


--
-- Name: carrinho_itens uq_carrinho_usuario_livro; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.carrinho_itens
    ADD CONSTRAINT uq_carrinho_usuario_livro UNIQUE (usu_id, liv_id);


--
-- Name: livro_categorias uq_livro_categoria; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.livro_categorias
    ADD CONSTRAINT uq_livro_categoria UNIQUE (liv_id, cat_id);


--
-- Name: papeis uq_papeis_descricao; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.papeis
    ADD CONSTRAINT uq_papeis_descricao UNIQUE (pap_descricao);


--
-- Name: avaliacoes_livro uq_usuario_livro_avaliacao; Type: CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.avaliacoes_livro
    ADD CONSTRAINT uq_usuario_livro_avaliacao UNIQUE (usu_id, liv_id);


--
-- Name: bandeiras_cartao bandeiras_cartao_ban_descricao_key; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.bandeiras_cartao
    ADD CONSTRAINT bandeiras_cartao_ban_descricao_key UNIQUE (ban_descricao);


--
-- Name: bandeiras_cartao bandeiras_cartao_pkey; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.bandeiras_cartao
    ADD CONSTRAINT bandeiras_cartao_pkey PRIMARY KEY (ban_id);


--
-- Name: cartao_pagamento cartao_pagamento_cpp_uuid_key; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.cartao_pagamento
    ADD CONSTRAINT cartao_pagamento_cpp_uuid_key UNIQUE (cpp_uuid);


--
-- Name: cartao_pagamento cartao_pagamento_pkey; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.cartao_pagamento
    ADD CONSTRAINT cartao_pagamento_pkey PRIMARY KEY (cpp_id);


--
-- Name: cartoes cartoes_pkey; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.cartoes
    ADD CONSTRAINT cartoes_pkey PRIMARY KEY (crt_id);


--
-- Name: intencao_pagamento intencao_pagamento_inp_uuid_key; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.intencao_pagamento
    ADD CONSTRAINT intencao_pagamento_inp_uuid_key UNIQUE (inp_uuid);


--
-- Name: intencao_pagamento intencao_pagamento_pkey; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.intencao_pagamento
    ADD CONSTRAINT intencao_pagamento_pkey PRIMARY KEY (inp_id);


--
-- Name: intencao_pagamento_simulado intencao_pagamento_simulado_pkey; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.intencao_pagamento_simulado
    ADD CONSTRAINT intencao_pagamento_simulado_pkey PRIMARY KEY (inp_id);


--
-- Name: intencao_pagamento_stripe intencao_pagamento_stripe_pkey; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.intencao_pagamento_stripe
    ADD CONSTRAINT intencao_pagamento_stripe_pkey PRIMARY KEY (inp_id);


--
-- Name: pagamento pagamento_pag_uuid_key; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.pagamento
    ADD CONSTRAINT pagamento_pag_uuid_key UNIQUE (pag_uuid);


--
-- Name: pagamento_pix_simulado pagamento_pix_simulado_pkey; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.pagamento_pix_simulado
    ADD CONSTRAINT pagamento_pix_simulado_pkey PRIMARY KEY (pps_id);


--
-- Name: pagamento_pix_simulado pagamento_pix_simulado_pps_uuid_key; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.pagamento_pix_simulado
    ADD CONSTRAINT pagamento_pix_simulado_pps_uuid_key UNIQUE (pps_uuid);


--
-- Name: pagamento pagamento_pkey; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.pagamento
    ADD CONSTRAINT pagamento_pkey PRIMARY KEY (pag_id);


--
-- Name: status_pagamento status_pagamento_pkey; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.status_pagamento
    ADD CONSTRAINT status_pagamento_pkey PRIMARY KEY (stp_id);


--
-- Name: status_pagamento status_pagamento_stp_descricao_key; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.status_pagamento
    ADD CONSTRAINT status_pagamento_stp_descricao_key UNIQUE (stp_descricao);


--
-- Name: tipo_pagamento tipo_pagamento_pkey; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.tipo_pagamento
    ADD CONSTRAINT tipo_pagamento_pkey PRIMARY KEY (tpg_id);


--
-- Name: tipo_pagamento tipo_pagamento_tpg_descricao_key; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.tipo_pagamento
    ADD CONSTRAINT tipo_pagamento_tpg_descricao_key UNIQUE (tpg_descricao);


--
-- Name: bandeiras_cartao uq_bandeiras_uuid; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.bandeiras_cartao
    ADD CONSTRAINT uq_bandeiras_uuid UNIQUE (ban_uuid);


--
-- Name: cartoes uq_cartoes_usuario_principal; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.cartoes
    ADD CONSTRAINT uq_cartoes_usuario_principal EXCLUDE USING btree (usu_id WITH =) WHERE ((crt_principal = true));


--
-- Name: cartoes uq_cartoes_usuario_token; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.cartoes
    ADD CONSTRAINT uq_cartoes_usuario_token UNIQUE (usu_id, crt_token);


--
-- Name: cartoes uq_cartoes_uuid; Type: CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.cartoes
    ADD CONSTRAINT uq_cartoes_uuid UNIQUE (crt_uuid);


--
-- Name: admin_lojas admin_lojas_pkey; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.admin_lojas
    ADD CONSTRAINT admin_lojas_pkey PRIMARY KEY (adl_id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (cli_id);


--
-- Name: configuracoes_app configuracoes_app_pkey; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.configuracoes_app
    ADD CONSTRAINT configuracoes_app_pkey PRIMARY KEY (cfg_id);


--
-- Name: enderecos enderecos_pkey; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.enderecos
    ADD CONSTRAINT enderecos_pkey PRIMARY KEY (end_id);


--
-- Name: lojas lojas_loj_slug_key; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.lojas
    ADD CONSTRAINT lojas_loj_slug_key UNIQUE (loj_slug);


--
-- Name: lojas lojas_loj_uuid_key; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.lojas
    ADD CONSTRAINT lojas_loj_uuid_key UNIQUE (loj_uuid);


--
-- Name: lojas lojas_pkey; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.lojas
    ADD CONSTRAINT lojas_pkey PRIMARY KEY (loj_id);


--
-- Name: papeis papeis_pkey; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.papeis
    ADD CONSTRAINT papeis_pkey PRIMARY KEY (pap_id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (rft_id);


--
-- Name: telefones telefones_pkey; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.telefones
    ADD CONSTRAINT telefones_pkey PRIMARY KEY (tel_id);


--
-- Name: admin_lojas uq_admin_loja; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.admin_lojas
    ADD CONSTRAINT uq_admin_loja UNIQUE (usu_id, loj_id);


--
-- Name: clientes uq_clientes_usuario; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.clientes
    ADD CONSTRAINT uq_clientes_usuario UNIQUE (usu_id);


--
-- Name: clientes uq_clientes_uuid; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.clientes
    ADD CONSTRAINT uq_clientes_uuid UNIQUE (cli_uuid);


--
-- Name: configuracoes_app uq_configuracoes_chave; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.configuracoes_app
    ADD CONSTRAINT uq_configuracoes_chave UNIQUE (cfg_chave);


--
-- Name: enderecos uq_enderecos_usuario_principal; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.enderecos
    ADD CONSTRAINT uq_enderecos_usuario_principal EXCLUDE USING btree (usu_id WITH =) WHERE ((end_principal = true));


--
-- Name: enderecos uq_enderecos_uuid; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.enderecos
    ADD CONSTRAINT uq_enderecos_uuid UNIQUE (end_uuid);


--
-- Name: papeis uq_papeis_descricao; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.papeis
    ADD CONSTRAINT uq_papeis_descricao UNIQUE (pap_descricao);


--
-- Name: refresh_tokens uq_refresh_token_hash; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.refresh_tokens
    ADD CONSTRAINT uq_refresh_token_hash UNIQUE (rft_token_hash);


--
-- Name: refresh_tokens uq_refresh_token_uuid; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.refresh_tokens
    ADD CONSTRAINT uq_refresh_token_uuid UNIQUE (rft_uuid);


--
-- Name: telefones uq_telefones_usuario_numero; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.telefones
    ADD CONSTRAINT uq_telefones_usuario_numero UNIQUE (usu_id, tel_ddd, tel_numero);


--
-- Name: telefones uq_telefones_usuario_principal; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.telefones
    ADD CONSTRAINT uq_telefones_usuario_principal EXCLUDE USING btree (usu_id WITH =) WHERE ((tel_principal = true));


--
-- Name: telefones uq_telefones_uuid; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.telefones
    ADD CONSTRAINT uq_telefones_uuid UNIQUE (tel_uuid);


--
-- Name: usuario_papeis uq_usuario_papel; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.usuario_papeis
    ADD CONSTRAINT uq_usuario_papel UNIQUE (usu_id, pap_id);


--
-- Name: usuarios uq_usuarios_cpf; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.usuarios
    ADD CONSTRAINT uq_usuarios_cpf UNIQUE (usu_cpf);


--
-- Name: usuarios uq_usuarios_email; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.usuarios
    ADD CONSTRAINT uq_usuarios_email UNIQUE (usu_email);


--
-- Name: usuarios uq_usuarios_uuid; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.usuarios
    ADD CONSTRAINT uq_usuarios_uuid UNIQUE (usu_uuid);


--
-- Name: usuario_papeis usuario_papeis_pkey; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.usuario_papeis
    ADD CONSTRAINT usuario_papeis_pkey PRIMARY KEY (usp_id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (usu_id);


--
-- Name: eventos_rastreamento eventos_rastreamento_ere_uuid_key; Type: CONSTRAINT; Schema: livraria_logistica; Owner: -
--

ALTER TABLE ONLY livraria_logistica.eventos_rastreamento
    ADD CONSTRAINT eventos_rastreamento_ere_uuid_key UNIQUE (ere_uuid);


--
-- Name: eventos_rastreamento eventos_rastreamento_pkey; Type: CONSTRAINT; Schema: livraria_logistica; Owner: -
--

ALTER TABLE ONLY livraria_logistica.eventos_rastreamento
    ADD CONSTRAINT eventos_rastreamento_pkey PRIMARY KEY (ere_id);


--
-- Name: rastreamentos rastreamentos_pkey; Type: CONSTRAINT; Schema: livraria_logistica; Owner: -
--

ALTER TABLE ONLY livraria_logistica.rastreamentos
    ADD CONSTRAINT rastreamentos_pkey PRIMARY KEY (ras_id);


--
-- Name: rastreamentos rastreamentos_ras_uuid_key; Type: CONSTRAINT; Schema: livraria_logistica; Owner: -
--

ALTER TABLE ONLY livraria_logistica.rastreamentos
    ADD CONSTRAINT rastreamentos_ras_uuid_key UNIQUE (ras_uuid);


--
-- Name: bairros bairros_pkey; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.bairros
    ADD CONSTRAINT bairros_pkey PRIMARY KEY (bai_id);


--
-- Name: ceps ceps_pkey; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.ceps
    ADD CONSTRAINT ceps_pkey PRIMARY KEY (cep_numero);


--
-- Name: cidades cidades_pkey; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.cidades
    ADD CONSTRAINT cidades_pkey PRIMARY KEY (cid_id);


--
-- Name: estados estados_pkey; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.estados
    ADD CONSTRAINT estados_pkey PRIMARY KEY (est_id);


--
-- Name: logradouros logradouros_pkey; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.logradouros
    ADD CONSTRAINT logradouros_pkey PRIMARY KEY (log_id);


--
-- Name: paises paises_pkey; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.paises
    ADD CONSTRAINT paises_pkey PRIMARY KEY (pai_id);


--
-- Name: tipos_logradouros tipos_logradouros_pkey; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.tipos_logradouros
    ADD CONSTRAINT tipos_logradouros_pkey PRIMARY KEY (tlo_id);


--
-- Name: tipos_residencias tipos_residencias_pkey; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.tipos_residencias
    ADD CONSTRAINT tipos_residencias_pkey PRIMARY KEY (tre_id);


--
-- Name: tipos_telefones tipos_telefones_pkey; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.tipos_telefones
    ADD CONSTRAINT tipos_telefones_pkey PRIMARY KEY (ttp_id);


--
-- Name: bairros uq_bairros_nome_cidade; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.bairros
    ADD CONSTRAINT uq_bairros_nome_cidade UNIQUE (bai_nome_norm, cid_id);


--
-- Name: cidades uq_cidades_nome_estado; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.cidades
    ADD CONSTRAINT uq_cidades_nome_estado UNIQUE (cid_nome_norm, est_id);


--
-- Name: estados uq_estados_nome; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.estados
    ADD CONSTRAINT uq_estados_nome UNIQUE (est_nome);


--
-- Name: estados uq_estados_sigla; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.estados
    ADD CONSTRAINT uq_estados_sigla UNIQUE (est_sigla);


--
-- Name: logradouros uq_logradouros_completo; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.logradouros
    ADD CONSTRAINT uq_logradouros_completo UNIQUE (tlo_id, log_nome);


--
-- Name: paises uq_paises_nome; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.paises
    ADD CONSTRAINT uq_paises_nome UNIQUE (pai_nome);


--
-- Name: paises uq_paises_sigla; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.paises
    ADD CONSTRAINT uq_paises_sigla UNIQUE (pai_sigla);


--
-- Name: tipos_logradouros uq_tipos_logradouros_descricao; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.tipos_logradouros
    ADD CONSTRAINT uq_tipos_logradouros_descricao UNIQUE (tlo_descricao);


--
-- Name: tipos_residencias uq_tipos_residencias_descricao; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.tipos_residencias
    ADD CONSTRAINT uq_tipos_residencias_descricao UNIQUE (tre_descricao);


--
-- Name: tipos_telefones uq_tipos_telefones_descricao; Type: CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.tipos_telefones
    ADD CONSTRAINT uq_tipos_telefones_descricao UNIQUE (ttp_descricao);


--
-- Name: idx_autores_nome_norm; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_autores_nome_norm ON livraria_comercial.autores USING gin (aut_nome_norm public.gin_trgm_ops);


--
-- Name: idx_avaliacoes_aprovado; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_avaliacoes_aprovado ON livraria_comercial.avaliacoes_livro USING btree (avl_aprovado);


--
-- Name: idx_avaliacoes_livro; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_avaliacoes_livro ON livraria_comercial.avaliacoes_livro USING btree (liv_id);


--
-- Name: idx_avaliacoes_livro_loj_id; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_avaliacoes_livro_loj_id ON livraria_comercial.avaliacoes_livro USING btree (loj_id);


--
-- Name: idx_avaliacoes_usuario; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_avaliacoes_usuario ON livraria_comercial.avaliacoes_livro USING btree (usu_id);


--
-- Name: idx_carrinho_itens_loj_id; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_carrinho_itens_loj_id ON livraria_comercial.carrinho_itens USING btree (loj_id);


--
-- Name: idx_carrinho_itens_usuario; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_carrinho_itens_usuario ON livraria_comercial.carrinho_itens USING btree (usu_id);


--
-- Name: idx_categorias_nome_norm; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_categorias_nome_norm ON livraria_comercial.categorias USING gin (cat_nome_norm public.gin_trgm_ops);


--
-- Name: idx_cotacao_frete_estado_expira; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_cotacao_frete_estado_expira ON livraria_comercial.cotacao_frete USING btree (cfr_estado, cfr_expira_em);


--
-- Name: idx_cotacao_frete_loj_id; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_cotacao_frete_loj_id ON livraria_comercial.cotacao_frete USING btree (loj_id);


--
-- Name: idx_cotacao_frete_uuid; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_cotacao_frete_uuid ON livraria_comercial.cotacao_frete USING btree (cfr_uuid);


--
-- Name: idx_cotacao_frete_ven; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_cotacao_frete_ven ON livraria_comercial.cotacao_frete USING btree (ven_id);


--
-- Name: idx_cupom_ativo; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_cupom_ativo ON livraria_comercial.cupom USING btree (cup_ativo);


--
-- Name: idx_cupom_codigo; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_cupom_codigo ON livraria_comercial.cupom USING btree (cup_codigo);


--
-- Name: idx_cupom_tipo; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_cupom_tipo ON livraria_comercial.cupom USING btree (cup_tipo);


--
-- Name: idx_cupom_validade; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_cupom_validade ON livraria_comercial.cupom USING btree (cup_valido_de, cup_valido_ate);


--
-- Name: idx_cupons_troca_codigo; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_cupons_troca_codigo ON livraria_comercial.cupons_troca USING btree (cpt_codigo);


--
-- Name: idx_cupons_troca_usuario; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_cupons_troca_usuario ON livraria_comercial.cupons_troca USING btree (cpt_cliente_id);


--
-- Name: idx_editoras_nome_norm; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_editoras_nome_norm ON livraria_comercial.editoras USING gin (edi_nome_norm public.gin_trgm_ops);


--
-- Name: idx_entrega_loj_id; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_entrega_loj_id ON livraria_comercial.entrega USING btree (loj_id);


--
-- Name: idx_entrega_tipo_frete; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_entrega_tipo_frete ON livraria_comercial.entrega USING btree (tfr_id);


--
-- Name: idx_entrega_uuid; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_entrega_uuid ON livraria_comercial.entrega USING btree (ent_uuid);


--
-- Name: idx_entrega_venda; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_entrega_venda ON livraria_comercial.entrega USING btree (ven_id);


--
-- Name: idx_estoques_livro; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_estoques_livro ON livraria_comercial.estoques USING btree (liv_id);


--
-- Name: idx_estoques_loj_id; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_estoques_loj_id ON livraria_comercial.estoques USING btree (loj_id);


--
-- Name: idx_fornecedores_loj_id; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_fornecedores_loj_id ON livraria_comercial.fornecedores USING btree (loj_id);


--
-- Name: idx_fornecedores_nome_norm; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_fornecedores_nome_norm ON livraria_comercial.fornecedores USING gin (for_nome_norm public.gin_trgm_ops);


--
-- Name: idx_historico_entradas_data; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_historico_entradas_data ON livraria_comercial.historico_entradas_estoque USING btree (hee_data_entrada);


--
-- Name: idx_historico_entradas_fornecedor; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_historico_entradas_fornecedor ON livraria_comercial.historico_entradas_estoque USING btree (for_id);


--
-- Name: idx_historico_entradas_livro; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_historico_entradas_livro ON livraria_comercial.historico_entradas_estoque USING btree (liv_id);


--
-- Name: idx_item_venda_uuid; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_item_venda_uuid ON livraria_comercial.itens_venda USING btree (itv_uuid);


--
-- Name: idx_item_venda_venda; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_item_venda_venda ON livraria_comercial.itens_venda USING btree (ven_id);


--
-- Name: idx_itens_venda_loj_id; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_itens_venda_loj_id ON livraria_comercial.itens_venda USING btree (loj_id);


--
-- Name: idx_livro_categorias_categoria; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_livro_categorias_categoria ON livraria_comercial.livro_categorias USING btree (cat_id);


--
-- Name: idx_livro_categorias_livro; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_livro_categorias_livro ON livraria_comercial.livro_categorias USING btree (liv_id);


--
-- Name: idx_livros_autor; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_livros_autor ON livraria_comercial.livros USING btree (aut_id);


--
-- Name: idx_livros_editora; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_livros_editora ON livraria_comercial.livros USING btree (edi_id);


--
-- Name: idx_livros_grupo_precificacao; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_livros_grupo_precificacao ON livraria_comercial.livros USING btree (gpr_id);


--
-- Name: idx_livros_isbn; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_livros_isbn ON livraria_comercial.livros USING btree (liv_isbn);


--
-- Name: idx_livros_titulo_norm; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_livros_titulo_norm ON livraria_comercial.livros USING gin (liv_titulo_norm public.gin_trgm_ops);


--
-- Name: idx_notificacoes_criado_em; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_notificacoes_criado_em ON livraria_comercial.notificacoes USING btree (not_criado_em DESC);


--
-- Name: idx_notificacoes_lida; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_notificacoes_lida ON livraria_comercial.notificacoes USING btree (not_lida) WHERE (not_lida = false);


--
-- Name: idx_notificacoes_usuario_uuid; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_notificacoes_usuario_uuid ON livraria_comercial.notificacoes USING btree (not_usuario_uuid);


--
-- Name: idx_venda_status; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_venda_status ON livraria_comercial.vendas USING btree (stv_id);


--
-- Name: idx_venda_usuario; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_venda_usuario ON livraria_comercial.vendas USING btree (usu_id);


--
-- Name: idx_vendas_cfr; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_vendas_cfr ON livraria_comercial.vendas USING btree (cfr_id);


--
-- Name: idx_vendas_loj_id; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE INDEX idx_vendas_loj_id ON livraria_comercial.vendas USING btree (loj_id);


--
-- Name: uq_categorias_cat_slug; Type: INDEX; Schema: livraria_comercial; Owner: -
--

CREATE UNIQUE INDEX uq_categorias_cat_slug ON livraria_comercial.categorias USING btree (cat_slug) WHERE (cat_slug IS NOT NULL);


--
-- Name: idx_cartao_pagamento_loj_id; Type: INDEX; Schema: livraria_financeiro; Owner: -
--

CREATE INDEX idx_cartao_pagamento_loj_id ON livraria_financeiro.cartao_pagamento USING btree (loj_id);


--
-- Name: idx_cartao_pagamento_pagamento; Type: INDEX; Schema: livraria_financeiro; Owner: -
--

CREATE INDEX idx_cartao_pagamento_pagamento ON livraria_financeiro.cartao_pagamento USING btree (pag_id);


--
-- Name: idx_cartoes_bandeira; Type: INDEX; Schema: livraria_financeiro; Owner: -
--

CREATE INDEX idx_cartoes_bandeira ON livraria_financeiro.cartoes USING btree (ban_id);


--
-- Name: idx_cartoes_usuario; Type: INDEX; Schema: livraria_financeiro; Owner: -
--

CREATE INDEX idx_cartoes_usuario ON livraria_financeiro.cartoes USING btree (usu_id);


--
-- Name: idx_intencao_pagamento_estado_expira; Type: INDEX; Schema: livraria_financeiro; Owner: -
--

CREATE INDEX idx_intencao_pagamento_estado_expira ON livraria_financeiro.intencao_pagamento USING btree (inp_estado, inp_expira_em);


--
-- Name: idx_intencao_pagamento_loj_id; Type: INDEX; Schema: livraria_financeiro; Owner: -
--

CREATE INDEX idx_intencao_pagamento_loj_id ON livraria_financeiro.intencao_pagamento USING btree (loj_id);


--
-- Name: idx_intencao_pagamento_uuid; Type: INDEX; Schema: livraria_financeiro; Owner: -
--

CREATE INDEX idx_intencao_pagamento_uuid ON livraria_financeiro.intencao_pagamento USING btree (inp_uuid);


--
-- Name: idx_intencao_pagamento_ven_id; Type: INDEX; Schema: livraria_financeiro; Owner: -
--

CREATE INDEX idx_intencao_pagamento_ven_id ON livraria_financeiro.intencao_pagamento USING btree (ven_id) WHERE (ven_id IS NOT NULL);


--
-- Name: idx_pagamento_inp_id_nao_unico; Type: INDEX; Schema: livraria_financeiro; Owner: -
--

CREATE INDEX idx_pagamento_inp_id_nao_unico ON livraria_financeiro.pagamento USING btree (inp_id) WHERE (inp_id IS NOT NULL);


--
-- Name: idx_pagamento_loj_id; Type: INDEX; Schema: livraria_financeiro; Owner: -
--

CREATE INDEX idx_pagamento_loj_id ON livraria_financeiro.pagamento USING btree (loj_id);


--
-- Name: idx_pagamento_pix_simulado_pag_id; Type: INDEX; Schema: livraria_financeiro; Owner: -
--

CREATE INDEX idx_pagamento_pix_simulado_pag_id ON livraria_financeiro.pagamento_pix_simulado USING btree (pag_id);


--
-- Name: idx_pagamento_status; Type: INDEX; Schema: livraria_financeiro; Owner: -
--

CREATE INDEX idx_pagamento_status ON livraria_financeiro.pagamento USING btree (stp_id);


--
-- Name: idx_pagamento_tipo; Type: INDEX; Schema: livraria_financeiro; Owner: -
--

CREATE INDEX idx_pagamento_tipo ON livraria_financeiro.pagamento USING btree (tpg_id);


--
-- Name: idx_pagamento_uuid; Type: INDEX; Schema: livraria_financeiro; Owner: -
--

CREATE INDEX idx_pagamento_uuid ON livraria_financeiro.pagamento USING btree (pag_uuid);


--
-- Name: idx_pagamento_venda; Type: INDEX; Schema: livraria_financeiro; Owner: -
--

CREATE INDEX idx_pagamento_venda ON livraria_financeiro.pagamento USING btree (ven_id);


--
-- Name: idx_clientes_loj_id; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_clientes_loj_id ON livraria_gestao.clientes USING btree (loj_id);


--
-- Name: idx_clientes_usuario; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_clientes_usuario ON livraria_gestao.clientes USING btree (usu_id);


--
-- Name: idx_enderecos_bairro; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_enderecos_bairro ON livraria_gestao.enderecos USING btree (bai_id);


--
-- Name: idx_enderecos_cep; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_enderecos_cep ON livraria_gestao.enderecos USING btree (cep_id);


--
-- Name: idx_enderecos_cidade; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_enderecos_cidade ON livraria_gestao.enderecos USING btree (cid_id);


--
-- Name: idx_enderecos_logradouro; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_enderecos_logradouro ON livraria_gestao.enderecos USING btree (log_id);


--
-- Name: idx_enderecos_loj_id; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_enderecos_loj_id ON livraria_gestao.enderecos USING btree (loj_id);


--
-- Name: idx_enderecos_principal; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_enderecos_principal ON livraria_gestao.enderecos USING btree (usu_id) WHERE (end_principal = true);


--
-- Name: idx_enderecos_usuario; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_enderecos_usuario ON livraria_gestao.enderecos USING btree (usu_id);


--
-- Name: idx_refresh_tokens_expira_em; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_refresh_tokens_expira_em ON livraria_gestao.refresh_tokens USING btree (rft_expira_em);


--
-- Name: idx_refresh_tokens_loj_id; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_refresh_tokens_loj_id ON livraria_gestao.refresh_tokens USING btree (loj_id);


--
-- Name: idx_refresh_tokens_revocado_em; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_refresh_tokens_revocado_em ON livraria_gestao.refresh_tokens USING btree (rft_revocado_em) WHERE (rft_revocado_em IS NULL);


--
-- Name: idx_refresh_tokens_usu_id; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_refresh_tokens_usu_id ON livraria_gestao.refresh_tokens USING btree (usu_id);


--
-- Name: idx_telefones_tipo; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_telefones_tipo ON livraria_gestao.telefones USING btree (ttp_id);


--
-- Name: idx_telefones_usuario; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_telefones_usuario ON livraria_gestao.telefones USING btree (usu_id);


--
-- Name: idx_usuario_papeis_ativo; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_usuario_papeis_ativo ON livraria_gestao.usuario_papeis USING btree (usp_ativo);


--
-- Name: idx_usuario_papeis_papel; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_usuario_papeis_papel ON livraria_gestao.usuario_papeis USING btree (pap_id);


--
-- Name: idx_usuario_papeis_usuario; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_usuario_papeis_usuario ON livraria_gestao.usuario_papeis USING btree (usu_id);


--
-- Name: idx_usuarios_loj_id; Type: INDEX; Schema: livraria_gestao; Owner: -
--

CREATE INDEX idx_usuarios_loj_id ON livraria_gestao.usuarios USING btree (loj_id);


--
-- Name: idx_evento_data; Type: INDEX; Schema: livraria_logistica; Owner: -
--

CREATE INDEX idx_evento_data ON livraria_logistica.eventos_rastreamento USING btree (ere_data);


--
-- Name: idx_evento_rastreamento; Type: INDEX; Schema: livraria_logistica; Owner: -
--

CREATE INDEX idx_evento_rastreamento ON livraria_logistica.eventos_rastreamento USING btree (ras_uuid);


--
-- Name: idx_rastreamento_codigo; Type: INDEX; Schema: livraria_logistica; Owner: -
--

CREATE INDEX idx_rastreamento_codigo ON livraria_logistica.rastreamentos USING btree (ras_codigo);


--
-- Name: idx_rastreamento_entrega; Type: INDEX; Schema: livraria_logistica; Owner: -
--

CREATE INDEX idx_rastreamento_entrega ON livraria_logistica.rastreamentos USING btree (ent_uuid);


--
-- Name: idx_rastreamento_transportadora; Type: INDEX; Schema: livraria_logistica; Owner: -
--

CREATE INDEX idx_rastreamento_transportadora ON livraria_logistica.rastreamentos USING btree (ras_transportadora);


--
-- Name: autores tg_autores_atualizado_em; Type: TRIGGER; Schema: livraria_comercial; Owner: -
--

CREATE TRIGGER tg_autores_atualizado_em BEFORE UPDATE ON livraria_comercial.autores FOR EACH ROW EXECUTE FUNCTION livraria_comercial.fn_atualizar_timestamp_livros_estoque();


--
-- Name: autores tg_autores_normalizar; Type: TRIGGER; Schema: livraria_comercial; Owner: -
--

CREATE TRIGGER tg_autores_normalizar BEFORE INSERT OR UPDATE ON livraria_comercial.autores FOR EACH ROW EXECUTE FUNCTION livraria_comercial.fn_gerar_trigrama_autores();


--
-- Name: avaliacoes_livro tg_avaliacoes_livro_atualizado_em; Type: TRIGGER; Schema: livraria_comercial; Owner: -
--

CREATE TRIGGER tg_avaliacoes_livro_atualizado_em BEFORE UPDATE ON livraria_comercial.avaliacoes_livro FOR EACH ROW EXECUTE FUNCTION livraria_comercial.fn_atualizar_timestamp_livros_estoque();


--
-- Name: categorias tg_categorias_normalizar; Type: TRIGGER; Schema: livraria_comercial; Owner: -
--

CREATE TRIGGER tg_categorias_normalizar BEFORE INSERT OR UPDATE ON livraria_comercial.categorias FOR EACH ROW EXECUTE FUNCTION livraria_comercial.fn_gerar_trigrama_categorias();


--
-- Name: cupom tg_cupom_atualizado_em; Type: TRIGGER; Schema: livraria_comercial; Owner: -
--

CREATE TRIGGER tg_cupom_atualizado_em BEFORE UPDATE ON livraria_comercial.cupom FOR EACH ROW EXECUTE FUNCTION livraria_comercial.fn_atualizar_timestamp_cupom();


--
-- Name: editoras tg_editoras_atualizado_em; Type: TRIGGER; Schema: livraria_comercial; Owner: -
--

CREATE TRIGGER tg_editoras_atualizado_em BEFORE UPDATE ON livraria_comercial.editoras FOR EACH ROW EXECUTE FUNCTION livraria_comercial.fn_atualizar_timestamp_livros_estoque();


--
-- Name: editoras tg_editoras_normalizar; Type: TRIGGER; Schema: livraria_comercial; Owner: -
--

CREATE TRIGGER tg_editoras_normalizar BEFORE INSERT OR UPDATE ON livraria_comercial.editoras FOR EACH ROW EXECUTE FUNCTION livraria_comercial.fn_gerar_trigrama_editoras();


--
-- Name: estoques tg_estoques_atualizado_em; Type: TRIGGER; Schema: livraria_comercial; Owner: -
--

CREATE TRIGGER tg_estoques_atualizado_em BEFORE UPDATE ON livraria_comercial.estoques FOR EACH ROW EXECUTE FUNCTION livraria_comercial.fn_atualizar_timestamp_livros_estoque();


--
-- Name: fornecedores tg_fornecedores_atualizado_em; Type: TRIGGER; Schema: livraria_comercial; Owner: -
--

CREATE TRIGGER tg_fornecedores_atualizado_em BEFORE UPDATE ON livraria_comercial.fornecedores FOR EACH ROW EXECUTE FUNCTION livraria_comercial.fn_atualizar_timestamp_livros_estoque();


--
-- Name: fornecedores tg_fornecedores_normalizar; Type: TRIGGER; Schema: livraria_comercial; Owner: -
--

CREATE TRIGGER tg_fornecedores_normalizar BEFORE INSERT OR UPDATE ON livraria_comercial.fornecedores FOR EACH ROW EXECUTE FUNCTION livraria_comercial.fn_gerar_trigrama_fornecedores();


--
-- Name: livros tg_livros_atualizado_em; Type: TRIGGER; Schema: livraria_comercial; Owner: -
--

CREATE TRIGGER tg_livros_atualizado_em BEFORE UPDATE ON livraria_comercial.livros FOR EACH ROW EXECUTE FUNCTION livraria_comercial.fn_atualizar_timestamp_livros_estoque();


--
-- Name: livros tg_livros_normalizar; Type: TRIGGER; Schema: livraria_comercial; Owner: -
--

CREATE TRIGGER tg_livros_normalizar BEFORE INSERT OR UPDATE ON livraria_comercial.livros FOR EACH ROW EXECUTE FUNCTION livraria_comercial.fn_gerar_trigrama_livros();


--
-- Name: notificacoes trigger_atualizar_notificacoes_atualizado_em; Type: TRIGGER; Schema: livraria_comercial; Owner: -
--

CREATE TRIGGER trigger_atualizar_notificacoes_atualizado_em BEFORE UPDATE ON livraria_comercial.notificacoes FOR EACH ROW EXECUTE FUNCTION livraria_comercial.atualizar_notificacoes_atualizado_em();


--
-- Name: cartoes tg_cartoes_atualizado_em; Type: TRIGGER; Schema: livraria_financeiro; Owner: -
--

CREATE TRIGGER tg_cartoes_atualizado_em BEFORE UPDATE ON livraria_financeiro.cartoes FOR EACH ROW EXECUTE FUNCTION livraria_comercial.fn_atualizar_timestamp();


--
-- Name: pagamento tg_pagamento_atualizado_em; Type: TRIGGER; Schema: livraria_financeiro; Owner: -
--

CREATE TRIGGER tg_pagamento_atualizado_em BEFORE UPDATE ON livraria_financeiro.pagamento FOR EACH ROW EXECUTE FUNCTION livraria_financeiro.fn_atualizar_timestamp_pagamento();


--
-- Name: clientes tg_clientes_atualizado_em; Type: TRIGGER; Schema: livraria_gestao; Owner: -
--

CREATE TRIGGER tg_clientes_atualizado_em BEFORE UPDATE ON livraria_gestao.clientes FOR EACH ROW EXECUTE FUNCTION livraria_gestao.fn_atualizar_timestamp();


--
-- Name: enderecos tg_enderecos_atualizado_em; Type: TRIGGER; Schema: livraria_gestao; Owner: -
--

CREATE TRIGGER tg_enderecos_atualizado_em BEFORE UPDATE ON livraria_gestao.enderecos FOR EACH ROW EXECUTE FUNCTION livraria_gestao.fn_atualizar_timestamp();


--
-- Name: telefones tg_telefones_atualizado_em; Type: TRIGGER; Schema: livraria_gestao; Owner: -
--

CREATE TRIGGER tg_telefones_atualizado_em BEFORE UPDATE ON livraria_gestao.telefones FOR EACH ROW EXECUTE FUNCTION livraria_gestao.fn_atualizar_timestamp();


--
-- Name: usuario_papeis tg_usuario_papeis_atualizado_em; Type: TRIGGER; Schema: livraria_gestao; Owner: -
--

CREATE TRIGGER tg_usuario_papeis_atualizado_em BEFORE UPDATE ON livraria_gestao.usuario_papeis FOR EACH ROW EXECUTE FUNCTION livraria_gestao.fn_atualizar_timestamp_usuario_papeis();


--
-- Name: usuarios tg_usuarios_atualizado_em; Type: TRIGGER; Schema: livraria_gestao; Owner: -
--

CREATE TRIGGER tg_usuarios_atualizado_em BEFORE UPDATE ON livraria_gestao.usuarios FOR EACH ROW EXECUTE FUNCTION livraria_gestao.fn_atualizar_timestamp();


--
-- Name: avaliacoes_livro avaliacoes_livro_liv_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.avaliacoes_livro
    ADD CONSTRAINT avaliacoes_livro_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES livraria_comercial.livros(liv_id) ON DELETE CASCADE;


--
-- Name: avaliacoes_livro avaliacoes_livro_usu_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.avaliacoes_livro
    ADD CONSTRAINT avaliacoes_livro_usu_id_fkey FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id);


--
-- Name: carrinho_itens carrinho_itens_liv_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.carrinho_itens
    ADD CONSTRAINT carrinho_itens_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES livraria_comercial.livros(liv_id) ON DELETE CASCADE;


--
-- Name: carrinho_itens carrinho_itens_usu_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.carrinho_itens
    ADD CONSTRAINT carrinho_itens_usu_id_fkey FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id) ON DELETE CASCADE;


--
-- Name: cotacao_frete_simulada cotacao_frete_simulada_cfr_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cotacao_frete_simulada
    ADD CONSTRAINT cotacao_frete_simulada_cfr_id_fkey FOREIGN KEY (cfr_id) REFERENCES livraria_comercial.cotacao_frete(cfr_id) ON DELETE CASCADE;


--
-- Name: cotacao_frete cotacao_frete_ven_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cotacao_frete
    ADD CONSTRAINT cotacao_frete_ven_id_fkey FOREIGN KEY (ven_id) REFERENCES livraria_comercial.vendas(ven_id) ON DELETE SET NULL;


--
-- Name: cupons_troca cupons_troca_cpt_cliente_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cupons_troca
    ADD CONSTRAINT cupons_troca_cpt_cliente_id_fkey FOREIGN KEY (cpt_cliente_id) REFERENCES livraria_gestao.clientes(cli_id) ON DELETE CASCADE;


--
-- Name: cupons_troca cupons_troca_cpt_venda_origem_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cupons_troca
    ADD CONSTRAINT cupons_troca_cpt_venda_origem_id_fkey FOREIGN KEY (cpt_venda_origem_id) REFERENCES livraria_comercial.vendas(ven_id);


--
-- Name: itens_venda ecm_item_venda_ven_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.itens_venda
    ADD CONSTRAINT ecm_item_venda_ven_id_fkey FOREIGN KEY (ven_id) REFERENCES livraria_comercial.vendas(ven_id) ON DELETE CASCADE;


--
-- Name: vendas ecm_venda_stv_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.vendas
    ADD CONSTRAINT ecm_venda_stv_id_fkey FOREIGN KEY (stv_id) REFERENCES livraria_comercial.status_venda(stv_id);


--
-- Name: entrega entrega_tfr_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.entrega
    ADD CONSTRAINT entrega_tfr_id_fkey FOREIGN KEY (tfr_id) REFERENCES livraria_comercial.tipo_frete(tfr_id);


--
-- Name: entrega entrega_ven_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.entrega
    ADD CONSTRAINT entrega_ven_id_fkey FOREIGN KEY (ven_id) REFERENCES livraria_comercial.vendas(ven_id) ON DELETE CASCADE;


--
-- Name: estoques estoques_liv_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.estoques
    ADD CONSTRAINT estoques_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES livraria_comercial.livros(liv_id) ON DELETE CASCADE;


--
-- Name: avaliacoes_livro fk_avaliacoes_livro_loja; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.avaliacoes_livro
    ADD CONSTRAINT fk_avaliacoes_livro_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);


--
-- Name: carrinho_itens fk_carrinho_itens_loja; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.carrinho_itens
    ADD CONSTRAINT fk_carrinho_itens_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);


--
-- Name: cotacao_frete fk_cotacao_frete_loja; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.cotacao_frete
    ADD CONSTRAINT fk_cotacao_frete_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);


--
-- Name: entrega fk_entrega_loja; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.entrega
    ADD CONSTRAINT fk_entrega_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);


--
-- Name: estoques fk_estoques_loja; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.estoques
    ADD CONSTRAINT fk_estoques_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);


--
-- Name: fornecedores fk_fornecedores_loja; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.fornecedores
    ADD CONSTRAINT fk_fornecedores_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);


--
-- Name: itens_venda fk_itens_venda_loja; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.itens_venda
    ADD CONSTRAINT fk_itens_venda_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);


--
-- Name: vendas fk_venda_usuario; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.vendas
    ADD CONSTRAINT fk_venda_usuario FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id);


--
-- Name: vendas fk_vendas_loja; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.vendas
    ADD CONSTRAINT fk_vendas_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);


--
-- Name: historico_entradas_estoque historico_entradas_estoque_for_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.historico_entradas_estoque
    ADD CONSTRAINT historico_entradas_estoque_for_id_fkey FOREIGN KEY (for_id) REFERENCES livraria_comercial.fornecedores(for_id);


--
-- Name: historico_entradas_estoque historico_entradas_estoque_liv_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.historico_entradas_estoque
    ADD CONSTRAINT historico_entradas_estoque_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES livraria_comercial.livros(liv_id);


--
-- Name: livro_categorias livro_categorias_cat_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.livro_categorias
    ADD CONSTRAINT livro_categorias_cat_id_fkey FOREIGN KEY (cat_id) REFERENCES livraria_comercial.categorias(cat_id) ON DELETE CASCADE;


--
-- Name: livro_categorias livro_categorias_liv_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.livro_categorias
    ADD CONSTRAINT livro_categorias_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES livraria_comercial.livros(liv_id) ON DELETE CASCADE;


--
-- Name: livros livros_aut_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.livros
    ADD CONSTRAINT livros_aut_id_fkey FOREIGN KEY (aut_id) REFERENCES livraria_comercial.autores(aut_id);


--
-- Name: livros livros_edi_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.livros
    ADD CONSTRAINT livros_edi_id_fkey FOREIGN KEY (edi_id) REFERENCES livraria_comercial.editoras(edi_id);


--
-- Name: livros livros_gpr_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.livros
    ADD CONSTRAINT livros_gpr_id_fkey FOREIGN KEY (gpr_id) REFERENCES livraria_comercial.grupos_precificacao(gpr_id);


--
-- Name: notificacoes notificacoes_not_usuario_uuid_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.notificacoes
    ADD CONSTRAINT notificacoes_not_usuario_uuid_fkey FOREIGN KEY (not_usuario_uuid) REFERENCES livraria_gestao.usuarios(usu_uuid) ON DELETE CASCADE;


--
-- Name: notificacoes notificacoes_not_venda_uuid_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.notificacoes
    ADD CONSTRAINT notificacoes_not_venda_uuid_fkey FOREIGN KEY (not_venda_uuid) REFERENCES livraria_comercial.vendas(ven_uuid) ON DELETE SET NULL;


--
-- Name: vendas vendas_cfr_id_fkey; Type: FK CONSTRAINT; Schema: livraria_comercial; Owner: -
--

ALTER TABLE ONLY livraria_comercial.vendas
    ADD CONSTRAINT vendas_cfr_id_fkey FOREIGN KEY (cfr_id) REFERENCES livraria_comercial.cotacao_frete(cfr_id) ON DELETE SET NULL;


--
-- Name: cartao_pagamento cartao_pagamento_pag_id_fkey; Type: FK CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.cartao_pagamento
    ADD CONSTRAINT cartao_pagamento_pag_id_fkey FOREIGN KEY (pag_id) REFERENCES livraria_financeiro.pagamento(pag_id) ON DELETE CASCADE;


--
-- Name: cartao_pagamento fk_cartao_pagamento_loja; Type: FK CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.cartao_pagamento
    ADD CONSTRAINT fk_cartao_pagamento_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);


--
-- Name: cartoes fk_cartoes_bandeiras; Type: FK CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.cartoes
    ADD CONSTRAINT fk_cartoes_bandeiras FOREIGN KEY (ban_id) REFERENCES livraria_financeiro.bandeiras_cartao(ban_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cartoes fk_cartoes_usuarios; Type: FK CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.cartoes
    ADD CONSTRAINT fk_cartoes_usuarios FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: intencao_pagamento fk_intencao_pagamento_loja; Type: FK CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.intencao_pagamento
    ADD CONSTRAINT fk_intencao_pagamento_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);


--
-- Name: pagamento fk_pagamento_loja; Type: FK CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.pagamento
    ADD CONSTRAINT fk_pagamento_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);


--
-- Name: intencao_pagamento_simulado intencao_pagamento_simulado_inp_id_fkey; Type: FK CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.intencao_pagamento_simulado
    ADD CONSTRAINT intencao_pagamento_simulado_inp_id_fkey FOREIGN KEY (inp_id) REFERENCES livraria_financeiro.intencao_pagamento(inp_id) ON DELETE CASCADE;


--
-- Name: intencao_pagamento_stripe intencao_pagamento_stripe_inp_id_fkey; Type: FK CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.intencao_pagamento_stripe
    ADD CONSTRAINT intencao_pagamento_stripe_inp_id_fkey FOREIGN KEY (inp_id) REFERENCES livraria_financeiro.intencao_pagamento(inp_id) ON DELETE CASCADE;


--
-- Name: intencao_pagamento intencao_pagamento_ven_id_fkey; Type: FK CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.intencao_pagamento
    ADD CONSTRAINT intencao_pagamento_ven_id_fkey FOREIGN KEY (ven_id) REFERENCES livraria_comercial.vendas(ven_id) ON DELETE SET NULL;


--
-- Name: pagamento pagamento_inp_id_fkey; Type: FK CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.pagamento
    ADD CONSTRAINT pagamento_inp_id_fkey FOREIGN KEY (inp_id) REFERENCES livraria_financeiro.intencao_pagamento(inp_id) ON DELETE SET NULL;


--
-- Name: pagamento_pix_simulado pagamento_pix_simulado_pag_id_fkey; Type: FK CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.pagamento_pix_simulado
    ADD CONSTRAINT pagamento_pix_simulado_pag_id_fkey FOREIGN KEY (pag_id) REFERENCES livraria_financeiro.pagamento(pag_id) ON DELETE CASCADE;


--
-- Name: pagamento pagamento_stp_id_fkey; Type: FK CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.pagamento
    ADD CONSTRAINT pagamento_stp_id_fkey FOREIGN KEY (stp_id) REFERENCES livraria_financeiro.status_pagamento(stp_id);


--
-- Name: pagamento pagamento_tpg_id_fkey; Type: FK CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.pagamento
    ADD CONSTRAINT pagamento_tpg_id_fkey FOREIGN KEY (tpg_id) REFERENCES livraria_financeiro.tipo_pagamento(tpg_id);


--
-- Name: pagamento pagamento_ven_id_fkey; Type: FK CONSTRAINT; Schema: livraria_financeiro; Owner: -
--

ALTER TABLE ONLY livraria_financeiro.pagamento
    ADD CONSTRAINT pagamento_ven_id_fkey FOREIGN KEY (ven_id) REFERENCES livraria_comercial.vendas(ven_id) ON DELETE CASCADE;


--
-- Name: admin_lojas fk_admin_lojas_loja; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.admin_lojas
    ADD CONSTRAINT fk_admin_lojas_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);


--
-- Name: admin_lojas fk_admin_lojas_usuario; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.admin_lojas
    ADD CONSTRAINT fk_admin_lojas_usuario FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id);


--
-- Name: clientes fk_clientes_loja; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.clientes
    ADD CONSTRAINT fk_clientes_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);


--
-- Name: clientes fk_clientes_usuario; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.clientes
    ADD CONSTRAINT fk_clientes_usuario FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id) ON DELETE CASCADE;


--
-- Name: clientes fk_clientes_usuarios; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.clientes
    ADD CONSTRAINT fk_clientes_usuarios FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enderecos fk_enderecos_bairros; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.enderecos
    ADD CONSTRAINT fk_enderecos_bairros FOREIGN KEY (bai_id) REFERENCES livraria_ref.bairros(bai_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enderecos fk_enderecos_cidades; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.enderecos
    ADD CONSTRAINT fk_enderecos_cidades FOREIGN KEY (cid_id) REFERENCES livraria_ref.cidades(cid_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enderecos fk_enderecos_loja; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.enderecos
    ADD CONSTRAINT fk_enderecos_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);


--
-- Name: enderecos fk_enderecos_tipos_residencias; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.enderecos
    ADD CONSTRAINT fk_enderecos_tipos_residencias FOREIGN KEY (tre_id) REFERENCES livraria_ref.tipos_residencias(tre_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enderecos fk_enderecos_usuarios; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.enderecos
    ADD CONSTRAINT fk_enderecos_usuarios FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens fk_refresh_token_usuario; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.refresh_tokens
    ADD CONSTRAINT fk_refresh_token_usuario FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id) ON DELETE CASCADE;


--
-- Name: telefones fk_telefones_tipo; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.telefones
    ADD CONSTRAINT fk_telefones_tipo FOREIGN KEY (ttp_id) REFERENCES livraria_ref.tipos_telefones(ttp_id) ON DELETE RESTRICT;


--
-- Name: telefones fk_telefones_usuario; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.telefones
    ADD CONSTRAINT fk_telefones_usuario FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id) ON DELETE CASCADE;


--
-- Name: telefones fk_telefones_usuarios; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.telefones
    ADD CONSTRAINT fk_telefones_usuarios FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: usuario_papeis fk_usuario_papeis_papel; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.usuario_papeis
    ADD CONSTRAINT fk_usuario_papeis_papel FOREIGN KEY (pap_id) REFERENCES livraria_comercial.papeis(pap_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: usuario_papeis fk_usuario_papeis_usuario; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.usuario_papeis
    ADD CONSTRAINT fk_usuario_papeis_usuario FOREIGN KEY (usu_id) REFERENCES livraria_gestao.usuarios(usu_id) ON DELETE CASCADE;


--
-- Name: usuarios fk_usuarios_loja; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.usuarios
    ADD CONSTRAINT fk_usuarios_loja FOREIGN KEY (loj_id) REFERENCES livraria_gestao.lojas(loj_id);


--
-- Name: usuarios fk_usuarios_papeis; Type: FK CONSTRAINT; Schema: livraria_gestao; Owner: -
--

ALTER TABLE ONLY livraria_gestao.usuarios
    ADD CONSTRAINT fk_usuarios_papeis FOREIGN KEY (pap_id) REFERENCES livraria_comercial.papeis(pap_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: eventos_rastreamento fk_evento_rastreamento; Type: FK CONSTRAINT; Schema: livraria_logistica; Owner: -
--

ALTER TABLE ONLY livraria_logistica.eventos_rastreamento
    ADD CONSTRAINT fk_evento_rastreamento FOREIGN KEY (ras_uuid) REFERENCES livraria_logistica.rastreamentos(ras_uuid) ON DELETE CASCADE;


--
-- Name: rastreamentos fk_rastreamento_entrega; Type: FK CONSTRAINT; Schema: livraria_logistica; Owner: -
--

ALTER TABLE ONLY livraria_logistica.rastreamentos
    ADD CONSTRAINT fk_rastreamento_entrega FOREIGN KEY (ent_uuid) REFERENCES livraria_comercial.entrega(ent_uuid) ON DELETE CASCADE;


--
-- Name: bairros fk_bairros_cidade; Type: FK CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.bairros
    ADD CONSTRAINT fk_bairros_cidade FOREIGN KEY (cid_id) REFERENCES livraria_ref.cidades(cid_id) ON DELETE RESTRICT;


--
-- Name: ceps fk_ceps_bairro; Type: FK CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.ceps
    ADD CONSTRAINT fk_ceps_bairro FOREIGN KEY (bai_id) REFERENCES livraria_ref.bairros(bai_id) ON DELETE RESTRICT;


--
-- Name: ceps fk_ceps_cidade; Type: FK CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.ceps
    ADD CONSTRAINT fk_ceps_cidade FOREIGN KEY (cid_id) REFERENCES livraria_ref.cidades(cid_id) ON DELETE RESTRICT;


--
-- Name: cidades fk_cidades_estado; Type: FK CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.cidades
    ADD CONSTRAINT fk_cidades_estado FOREIGN KEY (est_id) REFERENCES livraria_ref.estados(est_id) ON DELETE RESTRICT;


--
-- Name: logradouros logradouros_tlo_id_fkey; Type: FK CONSTRAINT; Schema: livraria_ref; Owner: -
--

ALTER TABLE ONLY livraria_ref.logradouros
    ADD CONSTRAINT logradouros_tlo_id_fkey FOREIGN KEY (tlo_id) REFERENCES livraria_ref.tipos_logradouros(tlo_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--


