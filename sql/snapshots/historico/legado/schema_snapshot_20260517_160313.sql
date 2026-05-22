--
-- PostgreSQL database dump
--

\restrict ZUGbnnBnfcgmiRes08YazjpK8yt8E9IDTX0Hke2q2kdeUaed0bYe2bsoIvT3ou5

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
-- Name: les; Type: SCHEMA; Schema: -; Owner: ecm_user
--

CREATE SCHEMA les;


ALTER SCHEMA les OWNER TO ecm_user;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: fn_atualizar_timestamp(); Type: FUNCTION; Schema: les; Owner: ecm_user
--

CREATE FUNCTION les.fn_atualizar_timestamp() RETURNS trigger
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


ALTER FUNCTION les.fn_atualizar_timestamp() OWNER TO ecm_user;

--
-- Name: fn_atualizar_timestamp_livros_estoque(); Type: FUNCTION; Schema: les; Owner: ecm_user
--

CREATE FUNCTION les.fn_atualizar_timestamp_livros_estoque() RETURNS trigger
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


ALTER FUNCTION les.fn_atualizar_timestamp_livros_estoque() OWNER TO ecm_user;

--
-- Name: fn_atualizar_timestamp_pagamento(); Type: FUNCTION; Schema: les; Owner: ecm_user
--

CREATE FUNCTION les.fn_atualizar_timestamp_pagamento() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.pag_atualizado_em := NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION les.fn_atualizar_timestamp_pagamento() OWNER TO ecm_user;

--
-- Name: fn_gerar_trigrama_autores(); Type: FUNCTION; Schema: les; Owner: ecm_user
--

CREATE FUNCTION les.fn_gerar_trigrama_autores() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.aut_nome_norm := fn_normalizar_texto(NEW.aut_nome);
    NEW.aut_uuid := COALESCE(NEW.aut_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;


ALTER FUNCTION les.fn_gerar_trigrama_autores() OWNER TO ecm_user;

--
-- Name: fn_gerar_trigrama_categorias(); Type: FUNCTION; Schema: les; Owner: ecm_user
--

CREATE FUNCTION les.fn_gerar_trigrama_categorias() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.cat_nome_norm := fn_normalizar_texto(NEW.cat_nome);
    NEW.cat_uuid := COALESCE(NEW.cat_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;


ALTER FUNCTION les.fn_gerar_trigrama_categorias() OWNER TO ecm_user;

--
-- Name: fn_gerar_trigrama_editoras(); Type: FUNCTION; Schema: les; Owner: ecm_user
--

CREATE FUNCTION les.fn_gerar_trigrama_editoras() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.edi_nome_norm := fn_normalizar_texto(NEW.edi_nome);
    NEW.edi_uuid := COALESCE(NEW.edi_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;


ALTER FUNCTION les.fn_gerar_trigrama_editoras() OWNER TO ecm_user;

--
-- Name: fn_gerar_trigrama_fornecedores(); Type: FUNCTION; Schema: les; Owner: ecm_user
--

CREATE FUNCTION les.fn_gerar_trigrama_fornecedores() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.for_nome_norm := fn_normalizar_texto(NEW.for_nome);
    NEW.for_uuid := COALESCE(NEW.for_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;


ALTER FUNCTION les.fn_gerar_trigrama_fornecedores() OWNER TO ecm_user;

--
-- Name: fn_gerar_trigrama_livros(); Type: FUNCTION; Schema: les; Owner: ecm_user
--

CREATE FUNCTION les.fn_gerar_trigrama_livros() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.liv_titulo_norm := fn_normalizar_texto(NEW.liv_titulo);
    NEW.liv_uuid := COALESCE(NEW.liv_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;


ALTER FUNCTION les.fn_gerar_trigrama_livros() OWNER TO ecm_user;

--
-- Name: fn_normalizar_texto(text); Type: FUNCTION; Schema: les; Owner: ecm_user
--

CREATE FUNCTION les.fn_normalizar_texto(input_text text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    RETURN UPPER(UNACCENT(input_text));
END;
$$;


ALTER FUNCTION les.fn_normalizar_texto(input_text text) OWNER TO ecm_user;

--
-- Name: fn_atualizar_timestamp(); Type: FUNCTION; Schema: public; Owner: ecm_user
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


ALTER FUNCTION public.fn_atualizar_timestamp() OWNER TO ecm_user;

--
-- Name: fn_atualizar_timestamp_cupom(); Type: FUNCTION; Schema: public; Owner: ecm_user
--

CREATE FUNCTION public.fn_atualizar_timestamp_cupom() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.cup_atualizado_em := NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_atualizar_timestamp_cupom() OWNER TO ecm_user;

--
-- Name: fn_atualizar_timestamp_livros_estoque(); Type: FUNCTION; Schema: public; Owner: ecm_user
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


ALTER FUNCTION public.fn_atualizar_timestamp_livros_estoque() OWNER TO ecm_user;

--
-- Name: fn_atualizar_timestamp_pagamento(); Type: FUNCTION; Schema: public; Owner: ecm_user
--

CREATE FUNCTION public.fn_atualizar_timestamp_pagamento() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.pag_atualizado_em := NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_atualizar_timestamp_pagamento() OWNER TO ecm_user;

--
-- Name: fn_gerar_trigrama_autores(); Type: FUNCTION; Schema: public; Owner: ecm_user
--

CREATE FUNCTION public.fn_gerar_trigrama_autores() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.aut_nome_norm := fn_normalizar_texto(NEW.aut_nome);
    NEW.aut_uuid := COALESCE(NEW.aut_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_gerar_trigrama_autores() OWNER TO ecm_user;

--
-- Name: fn_gerar_trigrama_categorias(); Type: FUNCTION; Schema: public; Owner: ecm_user
--

CREATE FUNCTION public.fn_gerar_trigrama_categorias() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.cat_nome_norm := fn_normalizar_texto(NEW.cat_nome);
    NEW.cat_uuid := COALESCE(NEW.cat_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_gerar_trigrama_categorias() OWNER TO ecm_user;

--
-- Name: fn_gerar_trigrama_editoras(); Type: FUNCTION; Schema: public; Owner: ecm_user
--

CREATE FUNCTION public.fn_gerar_trigrama_editoras() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.edi_nome_norm := fn_normalizar_texto(NEW.edi_nome);
    NEW.edi_uuid := COALESCE(NEW.edi_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_gerar_trigrama_editoras() OWNER TO ecm_user;

--
-- Name: fn_gerar_trigrama_fornecedores(); Type: FUNCTION; Schema: public; Owner: ecm_user
--

CREATE FUNCTION public.fn_gerar_trigrama_fornecedores() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.for_nome_norm := fn_normalizar_texto(NEW.for_nome);
    NEW.for_uuid := COALESCE(NEW.for_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_gerar_trigrama_fornecedores() OWNER TO ecm_user;

--
-- Name: fn_gerar_trigrama_livros(); Type: FUNCTION; Schema: public; Owner: ecm_user
--

CREATE FUNCTION public.fn_gerar_trigrama_livros() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.liv_titulo_norm := fn_normalizar_texto(NEW.liv_titulo);
    NEW.liv_uuid := COALESCE(NEW.liv_uuid, gen_random_uuid());
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_gerar_trigrama_livros() OWNER TO ecm_user;

--
-- Name: fn_normalizar_texto(text); Type: FUNCTION; Schema: public; Owner: ecm_user
--

CREATE FUNCTION public.fn_normalizar_texto(input_text text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    RETURN UPPER(UNACCENT(input_text));
END;
$$;


ALTER FUNCTION public.fn_normalizar_texto(input_text text) OWNER TO ecm_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: autores; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.autores (
    aut_id integer NOT NULL,
    aut_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    aut_nome character varying(200) NOT NULL,
    aut_nome_norm character varying(200) NOT NULL,
    aut_descricao text,
    aut_ativo boolean DEFAULT true NOT NULL,
    aut_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    aut_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE les.autores OWNER TO ecm_user;

--
-- Name: TABLE autores; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.autores IS 'Catálogo de autores de livros.';


--
-- Name: COLUMN autores.aut_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.autores.aut_id IS 'Identificador interno do autor.';


--
-- Name: COLUMN autores.aut_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.autores.aut_uuid IS 'Identificador público UUID do autor.';


--
-- Name: COLUMN autores.aut_nome; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.autores.aut_nome IS 'Nome completo do autor.';


--
-- Name: COLUMN autores.aut_nome_norm; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.autores.aut_nome_norm IS 'Nome normalizado para busca (sem acentos, maiúsculas).';


--
-- Name: COLUMN autores.aut_descricao; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.autores.aut_descricao IS 'Biografia/descrição do autor.';


--
-- Name: COLUMN autores.aut_ativo; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.autores.aut_ativo IS 'Flag indicando se autor está ativo no catálogo.';


--
-- Name: autores_aut_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.autores_aut_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.autores_aut_id_seq OWNER TO ecm_user;

--
-- Name: autores_aut_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.autores_aut_id_seq OWNED BY les.autores.aut_id;


--
-- Name: avaliacoes_livro; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.avaliacoes_livro (
    avl_id bigint NOT NULL,
    avl_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    liv_id bigint NOT NULL,
    usu_id bigint NOT NULL,
    avl_nota integer NOT NULL,
    avl_comentario character varying(1000),
    avl_aprovado boolean DEFAULT false NOT NULL,
    avl_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    avl_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT avaliacoes_livro_avl_nota_check CHECK (((avl_nota >= 1) AND (avl_nota <= 5)))
);


ALTER TABLE les.avaliacoes_livro OWNER TO ecm_user;

--
-- Name: TABLE avaliacoes_livro; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.avaliacoes_livro IS 'Avaliações de usuários para livros (RN0068).';


--
-- Name: COLUMN avaliacoes_livro.avl_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.avaliacoes_livro.avl_id IS 'Identificador interno da avaliação.';


--
-- Name: COLUMN avaliacoes_livro.avl_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.avaliacoes_livro.avl_uuid IS 'Identificador público UUID da avaliação.';


--
-- Name: COLUMN avaliacoes_livro.liv_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.avaliacoes_livro.liv_id IS 'FK para livro avaliado.';


--
-- Name: COLUMN avaliacoes_livro.usu_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.avaliacoes_livro.usu_id IS 'FK para usuário que avaliou.';


--
-- Name: COLUMN avaliacoes_livro.avl_nota; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.avaliacoes_livro.avl_nota IS 'Nota de 1 a 5 estrelas.';


--
-- Name: COLUMN avaliacoes_livro.avl_comentario; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.avaliacoes_livro.avl_comentario IS 'Comentário opcional do usuário.';


--
-- Name: COLUMN avaliacoes_livro.avl_aprovado; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.avaliacoes_livro.avl_aprovado IS 'Flag indicando se avaliação foi aprovada para exibição.';


--
-- Name: avaliacoes_livro_avl_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.avaliacoes_livro_avl_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.avaliacoes_livro_avl_id_seq OWNER TO ecm_user;

--
-- Name: avaliacoes_livro_avl_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.avaliacoes_livro_avl_id_seq OWNED BY les.avaliacoes_livro.avl_id;


--
-- Name: bairros; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.bairros (
    bai_id integer NOT NULL,
    bai_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    bai_nome character varying(200) NOT NULL,
    bai_nome_norm character varying(200) NOT NULL,
    cid_id integer NOT NULL,
    bai_criado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE les.bairros OWNER TO ecm_user;

--
-- Name: TABLE bairros; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.bairros IS 'Catálogo normalizado de bairros por cidade (matching via bai_nome_norm).';


--
-- Name: COLUMN bairros.bai_nome_norm; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.bairros.bai_nome_norm IS 'Versão normalizada de bai_nome (UPPER(TRIM(...))).';


--
-- Name: bairros_bai_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.bairros_bai_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.bairros_bai_id_seq OWNER TO ecm_user;

--
-- Name: bairros_bai_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.bairros_bai_id_seq OWNED BY les.bairros.bai_id;


--
-- Name: bandeiras_cartao; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.bandeiras_cartao (
    ban_id integer NOT NULL,
    ban_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    ban_descricao character varying(30) NOT NULL,
    ban_criado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE les.bandeiras_cartao OWNER TO ecm_user;

--
-- Name: TABLE bandeiras_cartao; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.bandeiras_cartao IS 'Bandeiras de cartão de crédito suportadas (RN0025).';


--
-- Name: COLUMN bandeiras_cartao.ban_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.bandeiras_cartao.ban_id IS 'Identificador interno da bandeira.';


--
-- Name: COLUMN bandeiras_cartao.ban_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.bandeiras_cartao.ban_uuid IS 'Identificador público (UUID v4) para uso em rotas HTTP.';


--
-- Name: COLUMN bandeiras_cartao.ban_descricao; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.bandeiras_cartao.ban_descricao IS 'Nome da bandeira (Visa, Mastercard, Elo, etc.).';


--
-- Name: bandeiras_cartao_ban_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.bandeiras_cartao_ban_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.bandeiras_cartao_ban_id_seq OWNER TO ecm_user;

--
-- Name: bandeiras_cartao_ban_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.bandeiras_cartao_ban_id_seq OWNED BY les.bandeiras_cartao.ban_id;


--
-- Name: carrinho_itens; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.carrinho_itens (
    cri_id bigint NOT NULL,
    usu_id bigint NOT NULL,
    liv_id bigint NOT NULL,
    cri_quantidade integer NOT NULL,
    cri_atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT carrinho_itens_cri_quantidade_check CHECK ((cri_quantidade > 0))
);


ALTER TABLE les.carrinho_itens OWNER TO ecm_user;

--
-- Name: TABLE carrinho_itens; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.carrinho_itens IS 'Itens do carrinho de compras por usuário autenticado.';


--
-- Name: carrinho_itens_cri_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.carrinho_itens_cri_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.carrinho_itens_cri_id_seq OWNER TO ecm_user;

--
-- Name: carrinho_itens_cri_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.carrinho_itens_cri_id_seq OWNED BY les.carrinho_itens.cri_id;


--
-- Name: cartao_pagamento; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.cartao_pagamento (
    cpp_id bigint NOT NULL,
    cpp_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    pag_id bigint NOT NULL,
    cpp_numero_tokenizado character varying(255) NOT NULL,
    cpp_nome_titular character varying(100) NOT NULL,
    cpp_validade character varying(7) NOT NULL,
    cpp_bandeira character varying(50) NOT NULL,
    cpp_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE les.cartao_pagamento OWNER TO ecm_user;

--
-- Name: TABLE cartao_pagamento; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.cartao_pagamento IS 'Dados de cartões utilizados em pagamentos (apenas tokens por segurança).';


--
-- Name: COLUMN cartao_pagamento.cpp_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartao_pagamento.cpp_id IS 'Chave primária interna.';


--
-- Name: COLUMN cartao_pagamento.cpp_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartao_pagamento.cpp_uuid IS 'Identificador público UUID.';


--
-- Name: COLUMN cartao_pagamento.pag_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartao_pagamento.pag_id IS 'FK para pagamento — pagamento associado ao cartão.';


--
-- Name: COLUMN cartao_pagamento.cpp_numero_tokenizado; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartao_pagamento.cpp_numero_tokenizado IS 'Token ou hash SHA-256 do número do cartão.';


--
-- Name: COLUMN cartao_pagamento.cpp_nome_titular; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartao_pagamento.cpp_nome_titular IS 'Nome do titular impresso no cartão.';


--
-- Name: COLUMN cartao_pagamento.cpp_validade; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartao_pagamento.cpp_validade IS 'Validade do cartão no formato MM/YYYY.';


--
-- Name: COLUMN cartao_pagamento.cpp_bandeira; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartao_pagamento.cpp_bandeira IS 'Bandeira do cartão (Visa, Mastercard, etc.).';


--
-- Name: COLUMN cartao_pagamento.cpp_criado_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartao_pagamento.cpp_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: cartao_pagamento_cpp_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.cartao_pagamento_cpp_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.cartao_pagamento_cpp_id_seq OWNER TO ecm_user;

--
-- Name: cartao_pagamento_cpp_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.cartao_pagamento_cpp_id_seq OWNED BY les.cartao_pagamento.cpp_id;


--
-- Name: cartoes; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.cartoes (
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


ALTER TABLE les.cartoes OWNER TO ecm_user;

--
-- Name: TABLE cartoes; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.cartoes IS 'Cartões de crédito cadastrados pelos usuários. Apenas token é armazenado por segurança.';


--
-- Name: COLUMN cartoes.crt_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartoes.crt_id IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';


--
-- Name: COLUMN cartoes.crt_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartoes.crt_uuid IS 'Identificador público (UUID v4). Retornado nas rotas HTTP.';


--
-- Name: COLUMN cartoes.usu_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartoes.usu_id IS 'FK para usuarios.';


--
-- Name: COLUMN cartoes.ban_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartoes.ban_id IS 'FK para bandeiras_cartao — bandeira do cartão.';


--
-- Name: COLUMN cartoes.crt_token; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartoes.crt_token IS 'Token do cartão retornado pela operadora. Nunca o número real.';


--
-- Name: COLUMN cartoes.crt_final; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartoes.crt_final IS 'Últimos 4 dígitos do cartão para identificação (ex.: 1234).';


--
-- Name: COLUMN cartoes.crt_nome_impresso; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartoes.crt_nome_impresso IS 'Nome como aparece impresso no cartão.';


--
-- Name: COLUMN cartoes.crt_validade; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartoes.crt_validade IS 'Data de validade do cartão (mês/ano).';


--
-- Name: COLUMN cartoes.crt_principal; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartoes.crt_principal IS 'TRUE se este é o cartão principal do usuário.';


--
-- Name: COLUMN cartoes.crt_criado_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartoes.crt_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: COLUMN cartoes.crt_atualizado_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cartoes.crt_atualizado_em IS 'Timestamp da última atualização.';


--
-- Name: cartoes_crt_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.cartoes_crt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.cartoes_crt_id_seq OWNER TO ecm_user;

--
-- Name: cartoes_crt_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.cartoes_crt_id_seq OWNED BY les.cartoes.crt_id;


--
-- Name: categorias; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.categorias (
    cat_id integer NOT NULL,
    cat_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    cat_nome character varying(100) NOT NULL,
    cat_nome_norm character varying(100) NOT NULL,
    cat_descricao character varying(500),
    cat_ativo boolean DEFAULT true NOT NULL,
    cat_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    cat_slug character varying(120)
);


ALTER TABLE les.categorias OWNER TO ecm_user;

--
-- Name: TABLE categorias; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.categorias IS 'Catálogo de categorias de livros.';


--
-- Name: COLUMN categorias.cat_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.categorias.cat_id IS 'Identificador interno da categoria.';


--
-- Name: COLUMN categorias.cat_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.categorias.cat_uuid IS 'Identificador público UUID da categoria.';


--
-- Name: COLUMN categorias.cat_nome; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.categorias.cat_nome IS 'Nome da categoria.';


--
-- Name: COLUMN categorias.cat_nome_norm; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.categorias.cat_nome_norm IS 'Nome normalizado para busca (sem acentos, maiúsculas).';


--
-- Name: COLUMN categorias.cat_descricao; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.categorias.cat_descricao IS 'Descrição da categoria.';


--
-- Name: COLUMN categorias.cat_ativo; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.categorias.cat_ativo IS 'Flag indicando se categoria está ativa.';


--
-- Name: COLUMN categorias.cat_slug; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.categorias.cat_slug IS 'Identificador estável para URL (ex.: ficcao, fantasia).';


--
-- Name: categorias_cat_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.categorias_cat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.categorias_cat_id_seq OWNER TO ecm_user;

--
-- Name: categorias_cat_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.categorias_cat_id_seq OWNED BY les.categorias.cat_id;


--
-- Name: ceps; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.ceps (
    cep_id integer NOT NULL,
    cep_numero character(8) NOT NULL,
    cid_id integer,
    bai_id integer,
    cep_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_ceps_numero_numerico CHECK ((cep_numero ~ '^[0-9]{8}$'::text))
);


ALTER TABLE les.ceps OWNER TO ecm_user;

--
-- Name: TABLE ceps; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.ceps IS 'CEPs brasileiros normalizados. Centraliza dados postais e evita duplicação.';


--
-- Name: COLUMN ceps.cep_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.ceps.cep_id IS 'Identificador interno do CEP.';


--
-- Name: COLUMN ceps.cep_numero; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.ceps.cep_numero IS 'CEP com 8 dígitos numéricos.';


--
-- Name: COLUMN ceps.cid_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.ceps.cid_id IS 'FK para cidades — cidade do CEP.';


--
-- Name: COLUMN ceps.bai_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.ceps.bai_id IS 'FK para bairros — bairro principal do CEP (opcional, pois CEPs abrangem áreas).';


--
-- Name: ceps_cep_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.ceps_cep_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.ceps_cep_id_seq OWNER TO ecm_user;

--
-- Name: ceps_cep_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.ceps_cep_id_seq OWNED BY les.ceps.cep_id;


--
-- Name: cidades; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.cidades (
    cid_id integer NOT NULL,
    cid_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    cid_nome character varying(200) NOT NULL,
    cid_nome_norm character varying(200) NOT NULL,
    est_id integer,
    cid_criado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE les.cidades OWNER TO ecm_user;

--
-- Name: TABLE cidades; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.cidades IS 'Catálogo normalizado de cidades (nomes normalizados para matching).';


--
-- Name: COLUMN cidades.cid_nome_norm; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.cidades.cid_nome_norm IS 'Versão normalizada de cid_nome (UPPER(TRIM(...))) usada para unicidade e matching.';


--
-- Name: cidades_cid_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.cidades_cid_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.cidades_cid_id_seq OWNER TO ecm_user;

--
-- Name: cidades_cid_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.cidades_cid_id_seq OWNED BY les.cidades.cid_id;


--
-- Name: clientes; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.clientes (
    cli_id bigint NOT NULL,
    cli_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usu_id bigint NOT NULL,
    cli_genero character varying(30),
    cli_data_nascimento date,
    cli_ranking integer DEFAULT 0 NOT NULL,
    cli_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    cli_atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE les.clientes OWNER TO ecm_user;

--
-- Name: TABLE clientes; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.clientes IS 'Perfil 1:1 com usuarios, restrito a usuários com papel cliente. Armazena dados complementares não utilizados na autenticação.';


--
-- Name: COLUMN clientes.cli_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.clientes.cli_id IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';


--
-- Name: COLUMN clientes.cli_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.clientes.cli_uuid IS 'Identificador público (UUID v4). Retornado nas rotas HTTP quando necessário.';


--
-- Name: COLUMN clientes.usu_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.clientes.usu_id IS 'FK única para usuarios — garante relação 1:1.';


--
-- Name: COLUMN clientes.cli_genero; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.clientes.cli_genero IS 'Gênero autodeclarado pelo cliente (opcional). Sem restrição de domínio para suportar diversidade. RN0026.';


--
-- Name: COLUMN clientes.cli_data_nascimento; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.clientes.cli_data_nascimento IS 'Data de nascimento do cliente (opcional). RN0026.';


--
-- Name: COLUMN clientes.cli_ranking; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.clientes.cli_ranking IS 'Ranking numérico do cliente baseado no perfil de compra. RN0027. Valor padrão 0.';


--
-- Name: COLUMN clientes.cli_criado_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.clientes.cli_criado_em IS 'Timestamp de criação do perfil.';


--
-- Name: COLUMN clientes.cli_atualizado_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.clientes.cli_atualizado_em IS 'Timestamp da última atualização (mantido via trigger).';


--
-- Name: clientes_cli_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.clientes_cli_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.clientes_cli_id_seq OWNER TO ecm_user;

--
-- Name: clientes_cli_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.clientes_cli_id_seq OWNED BY les.clientes.cli_id;


--
-- Name: configuracoes_app; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.configuracoes_app (
    cfg_id integer NOT NULL,
    cfg_chave character varying(50) NOT NULL,
    cfg_valor text NOT NULL,
    cfg_descricao character varying(255),
    cfg_atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE les.configuracoes_app OWNER TO ecm_user;

--
-- Name: TABLE configuracoes_app; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.configuracoes_app IS 'Configurações globais do sistema.';


--
-- Name: COLUMN configuracoes_app.cfg_chave; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.configuracoes_app.cfg_chave IS 'Nome único da configuração (ex: SENHA_MESTRA_ADMIN_HASH).';


--
-- Name: COLUMN configuracoes_app.cfg_valor; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.configuracoes_app.cfg_valor IS 'Valor da configuração (pode ser um hash, uma string, etc).';


--
-- Name: COLUMN configuracoes_app.cfg_descricao; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.configuracoes_app.cfg_descricao IS 'Explicação sobre para que serve esta configuração.';


--
-- Name: configuracoes_app_cfg_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.configuracoes_app_cfg_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.configuracoes_app_cfg_id_seq OWNER TO ecm_user;

--
-- Name: configuracoes_app_cfg_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.configuracoes_app_cfg_id_seq OWNED BY les.configuracoes_app.cfg_id;


--
-- Name: cotacao_frete; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.cotacao_frete (
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
    CONSTRAINT cotacao_frete_cfr_estado_check CHECK (((cfr_estado)::text = ANY ((ARRAY['CRIADA'::character varying, 'CONSUMIDA'::character varying, 'EXPIRADA'::character varying, 'CANCELADA'::character varying])::text[]))),
    CONSTRAINT cotacao_frete_cfr_peso_kg_check CHECK ((cfr_peso_kg > (0)::numeric)),
    CONSTRAINT cotacao_frete_cfr_valor_check CHECK ((cfr_valor >= (0)::numeric))
);


ALTER TABLE les.cotacao_frete OWNER TO ecm_user;

--
-- Name: TABLE cotacao_frete; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.cotacao_frete IS 'Cotação de frete por modalidade; UUID exposto ao cliente para seleção no checkout.';


--
-- Name: cotacao_frete_cfr_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.cotacao_frete_cfr_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.cotacao_frete_cfr_id_seq OWNER TO ecm_user;

--
-- Name: cotacao_frete_cfr_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.cotacao_frete_cfr_id_seq OWNED BY les.cotacao_frete.cfr_id;


--
-- Name: cotacao_frete_simulada; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.cotacao_frete_simulada (
    cfr_id bigint NOT NULL,
    cfs_fator_regiao numeric(10,4) DEFAULT 1.0 NOT NULL,
    cfs_peso_arredondado numeric(10,3) NOT NULL
);


ALTER TABLE les.cotacao_frete_simulada OWNER TO ecm_user;

--
-- Name: TABLE cotacao_frete_simulada; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.cotacao_frete_simulada IS 'Metadados da transportadora simulada (regras internas de cálculo).';


--
-- Name: editoras; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.editoras (
    edi_id integer NOT NULL,
    edi_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    edi_nome character varying(200) NOT NULL,
    edi_nome_norm character varying(200) NOT NULL,
    edi_cnpj character varying(18),
    edi_ativo boolean DEFAULT true NOT NULL,
    edi_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    edi_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE les.editoras OWNER TO ecm_user;

--
-- Name: TABLE editoras; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.editoras IS 'Catálogo de editoras de livros.';


--
-- Name: COLUMN editoras.edi_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.editoras.edi_id IS 'Identificador interno da editora.';


--
-- Name: COLUMN editoras.edi_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.editoras.edi_uuid IS 'Identificador público UUID da editora.';


--
-- Name: COLUMN editoras.edi_nome; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.editoras.edi_nome IS 'Nome da editora.';


--
-- Name: COLUMN editoras.edi_nome_norm; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.editoras.edi_nome_norm IS 'Nome normalizado para busca (sem acentos, maiúsculas).';


--
-- Name: COLUMN editoras.edi_cnpj; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.editoras.edi_cnpj IS 'CNPJ da editora.';


--
-- Name: COLUMN editoras.edi_ativo; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.editoras.edi_ativo IS 'Flag indicando se editora está ativa no catálogo.';


--
-- Name: editoras_edi_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.editoras_edi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.editoras_edi_id_seq OWNER TO ecm_user;

--
-- Name: editoras_edi_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.editoras_edi_id_seq OWNED BY les.editoras.edi_id;


--
-- Name: enderecos; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.enderecos (
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
    cep_id integer,
    pai_id integer DEFAULT 1 NOT NULL,
    end_principal boolean DEFAULT false NOT NULL,
    end_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    end_atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_enderecos_tipo CHECK (((end_tipo)::text = ANY ((ARRAY['cobranca'::character varying, 'entrega'::character varying])::text[])))
);


ALTER TABLE les.enderecos OWNER TO ecm_user;

--
-- Name: TABLE enderecos; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.enderecos IS 'Endereços vinculados a um usuário. Um usuário pode ter N endereços, mas apenas um principal. Todos os componentes do endereço são normalizados em tabelas separadas.';


--
-- Name: COLUMN enderecos.end_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.enderecos.end_id IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';


--
-- Name: COLUMN enderecos.end_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.enderecos.end_uuid IS 'Identificador público (UUID v4). Retornado pelas rotas HTTP.';


--
-- Name: COLUMN enderecos.usu_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.enderecos.usu_id IS 'FK para usuarios — proprietário do endereço.';


--
-- Name: COLUMN enderecos.end_tipo; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.enderecos.end_tipo IS 'Tipo do endereço: cobranca ou entrega. RN0021/RN0022. Padrão: entrega.';


--
-- Name: COLUMN enderecos.end_apelido; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.enderecos.end_apelido IS 'Apelido customizado do endereço (ex: Casa, Trabalho).';


--
-- Name: COLUMN enderecos.tre_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.enderecos.tre_id IS 'FK para tipos_residencias (Casa, Apartamento…). Opcional.';


--
-- Name: COLUMN enderecos.log_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.enderecos.log_id IS 'FK para logradouros — logradouro (tipo + nome).';


--
-- Name: COLUMN enderecos.end_numero; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.enderecos.end_numero IS 'Número do imóvel no logradouro.';


--
-- Name: COLUMN enderecos.end_complemento; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.enderecos.end_complemento IS 'Complemento opcional (ex.: apto 42, bloco B).';


--
-- Name: COLUMN enderecos.cid_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.enderecos.cid_id IS 'FK para cidades — cidade do endereço.';


--
-- Name: COLUMN enderecos.bai_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.enderecos.bai_id IS 'FK para bairros — bairro do endereço.';


--
-- Name: COLUMN enderecos.cep_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.enderecos.cep_id IS 'FK para ceps — CEP do endereço.';


--
-- Name: COLUMN enderecos.pai_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.enderecos.pai_id IS 'FK para paises — país do endereço (padrão: Brasil).';


--
-- Name: COLUMN enderecos.end_principal; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.enderecos.end_principal IS 'TRUE indica que este é o endereço de entrega padrão do usuário.';


--
-- Name: COLUMN enderecos.end_criado_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.enderecos.end_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: COLUMN enderecos.end_atualizado_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.enderecos.end_atualizado_em IS 'Timestamp da última atualização.';


--
-- Name: enderecos_end_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.enderecos_end_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.enderecos_end_id_seq OWNER TO ecm_user;

--
-- Name: enderecos_end_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.enderecos_end_id_seq OWNED BY les.enderecos.end_id;


--
-- Name: entregas; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.entregas (
    ent_id integer NOT NULL,
    ent_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    ven_id integer NOT NULL,
    tfr_id integer NOT NULL,
    ent_endereco_json jsonb NOT NULL,
    ent_custo numeric(10,2) NOT NULL,
    ent_entregador character varying(100),
    ent_criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT entrega_ent_custo_check CHECK ((ent_custo >= (0)::numeric))
);


ALTER TABLE les.entregas OWNER TO ecm_user;

--
-- Name: entrega_ent_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.entrega_ent_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.entrega_ent_id_seq OWNER TO ecm_user;

--
-- Name: entrega_ent_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.entrega_ent_id_seq OWNED BY les.entregas.ent_id;


--
-- Name: estados; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.estados (
    est_id integer NOT NULL,
    est_sigla character(2) NOT NULL,
    est_nome character varying(60) NOT NULL
);


ALTER TABLE les.estados OWNER TO ecm_user;

--
-- Name: TABLE estados; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.estados IS 'Estados e Distrito Federal do Brasil.';


--
-- Name: COLUMN estados.est_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.estados.est_id IS 'Identificador interno do estado.';


--
-- Name: COLUMN estados.est_sigla; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.estados.est_sigla IS 'Sigla de dois caracteres (ex.: SP, RJ, MG).';


--
-- Name: COLUMN estados.est_nome; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.estados.est_nome IS 'Nome completo do estado (ex.: São Paulo, Rio de Janeiro).';


--
-- Name: estados_est_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.estados_est_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.estados_est_id_seq OWNER TO ecm_user;

--
-- Name: estados_est_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.estados_est_id_seq OWNED BY les.estados.est_id;


--
-- Name: estoques; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.estoques (
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
    CONSTRAINT estoques_etq_preco_venda_check CHECK ((etq_preco_venda >= (0)::numeric)),
    CONSTRAINT estoques_etq_quantidade_disponivel_check CHECK ((etq_quantidade_disponivel >= 0)),
    CONSTRAINT estoques_etq_quantidade_reservada_check CHECK ((etq_quantidade_reservada >= 0)),
    CONSTRAINT estoques_etq_valor_custo_atual_check CHECK ((etq_valor_custo_atual >= (0)::numeric))
);


ALTER TABLE les.estoques OWNER TO ecm_user;

--
-- Name: TABLE estoques; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.estoques IS 'Controle de estoque e preços por livro (dados operacionais mutáveis).';


--
-- Name: COLUMN estoques.etq_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.estoques.etq_id IS 'Identificador interno do estoque.';


--
-- Name: COLUMN estoques.etq_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.estoques.etq_uuid IS 'Identificador público UUID do estoque.';


--
-- Name: COLUMN estoques.liv_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.estoques.liv_id IS 'FK única para livro (relacionamento 1:1).';


--
-- Name: COLUMN estoques.etq_quantidade_disponivel; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.estoques.etq_quantidade_disponivel IS 'Quantidade disponível para venda.';


--
-- Name: COLUMN estoques.etq_quantidade_reservada; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.estoques.etq_quantidade_reservada IS 'Quantidade reservada para pedidos em andamento.';


--
-- Name: COLUMN estoques.etq_preco_venda; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.estoques.etq_preco_venda IS 'Preço de venda atual (calculado via RN0013).';


--
-- Name: COLUMN estoques.etq_valor_custo_atual; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.estoques.etq_valor_custo_atual IS 'Custo unitário atual do livro.';


--
-- Name: COLUMN estoques.etq_ultimo_custo_calculado; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.estoques.etq_ultimo_custo_calculado IS 'Data do último cálculo de custo (média ponderada).';


--
-- Name: COLUMN estoques.etq_ativo; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.estoques.etq_ativo IS 'Flag indicando se registro de estoque está ativo.';


--
-- Name: estoques_etq_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.estoques_etq_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.estoques_etq_id_seq OWNER TO ecm_user;

--
-- Name: estoques_etq_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.estoques_etq_id_seq OWNED BY les.estoques.etq_id;


--
-- Name: fornecedores; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.fornecedores (
    for_id integer NOT NULL,
    for_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    for_nome character varying(200) NOT NULL,
    for_nome_norm character varying(200) NOT NULL,
    for_cnpj character varying(18),
    for_email character varying(255),
    for_telefone character varying(20),
    for_ativo boolean DEFAULT true NOT NULL,
    for_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    for_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE les.fornecedores OWNER TO ecm_user;

--
-- Name: TABLE fornecedores; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.fornecedores IS 'Cadastro de fornecedores para entrada de estoque.';


--
-- Name: COLUMN fornecedores.for_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.fornecedores.for_id IS 'Identificador interno do fornecedor.';


--
-- Name: COLUMN fornecedores.for_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.fornecedores.for_uuid IS 'Identificador público UUID do fornecedor.';


--
-- Name: COLUMN fornecedores.for_nome; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.fornecedores.for_nome IS 'Nome do fornecedor.';


--
-- Name: COLUMN fornecedores.for_nome_norm; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.fornecedores.for_nome_norm IS 'Nome normalizado para busca.';


--
-- Name: COLUMN fornecedores.for_cnpj; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.fornecedores.for_cnpj IS 'CNPJ do fornecedor.';


--
-- Name: COLUMN fornecedores.for_email; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.fornecedores.for_email IS 'Email para contato.';


--
-- Name: COLUMN fornecedores.for_telefone; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.fornecedores.for_telefone IS 'Telefone para contato.';


--
-- Name: COLUMN fornecedores.for_ativo; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.fornecedores.for_ativo IS 'Flag indicando se fornecedor está ativo.';


--
-- Name: fornecedores_for_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.fornecedores_for_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.fornecedores_for_id_seq OWNER TO ecm_user;

--
-- Name: fornecedores_for_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.fornecedores_for_id_seq OWNED BY les.fornecedores.for_id;


--
-- Name: grupos_precificacao; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.grupos_precificacao (
    gpr_id integer NOT NULL,
    gpr_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    gpr_descricao character varying(100) NOT NULL,
    gpr_margem_lucro_percentual numeric(5,2) DEFAULT 0.00 NOT NULL,
    gpr_ativo boolean DEFAULT true NOT NULL,
    gpr_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT grupos_precificacao_gpr_margem_lucro_percentual_check CHECK ((gpr_margem_lucro_percentual >= (0)::numeric))
);


ALTER TABLE les.grupos_precificacao OWNER TO ecm_user;

--
-- Name: TABLE grupos_precificacao; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.grupos_precificacao IS 'Grupos de precificação para cálculo de preços de venda.';


--
-- Name: COLUMN grupos_precificacao.gpr_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.grupos_precificacao.gpr_id IS 'Identificador interno do grupo.';


--
-- Name: COLUMN grupos_precificacao.gpr_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.grupos_precificacao.gpr_uuid IS 'Identificador público UUID do grupo.';


--
-- Name: COLUMN grupos_precificacao.gpr_descricao; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.grupos_precificacao.gpr_descricao IS 'Descrição do grupo (ex.: Varejo, Atacado, Técnico).';


--
-- Name: COLUMN grupos_precificacao.gpr_margem_lucro_percentual; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.grupos_precificacao.gpr_margem_lucro_percentual IS 'Margem de lucro percentual padrão do grupo.';


--
-- Name: COLUMN grupos_precificacao.gpr_ativo; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.grupos_precificacao.gpr_ativo IS 'Flag indicando se grupo está ativo.';


--
-- Name: grupos_precificacao_gpr_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.grupos_precificacao_gpr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.grupos_precificacao_gpr_id_seq OWNER TO ecm_user;

--
-- Name: grupos_precificacao_gpr_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.grupos_precificacao_gpr_id_seq OWNED BY les.grupos_precificacao.gpr_id;


--
-- Name: historico_entradas_estoque; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.historico_entradas_estoque (
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


ALTER TABLE les.historico_entradas_estoque OWNER TO ecm_user;

--
-- Name: TABLE historico_entradas_estoque; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.historico_entradas_estoque IS 'Histórico de entradas de estoque para cálculo de custo médio (RN0051).';


--
-- Name: COLUMN historico_entradas_estoque.hee_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.historico_entradas_estoque.hee_id IS 'Identificador interno do registro.';


--
-- Name: COLUMN historico_entradas_estoque.hee_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.historico_entradas_estoque.hee_uuid IS 'Identificador público UUID do registro.';


--
-- Name: COLUMN historico_entradas_estoque.liv_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.historico_entradas_estoque.liv_id IS 'FK para livro.';


--
-- Name: COLUMN historico_entradas_estoque.for_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.historico_entradas_estoque.for_id IS 'FK para fornecedor.';


--
-- Name: COLUMN historico_entradas_estoque.hee_quantidade; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.historico_entradas_estoque.hee_quantidade IS 'Quantidade recebida.';


--
-- Name: COLUMN historico_entradas_estoque.hee_valor_custo_unitario; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.historico_entradas_estoque.hee_valor_custo_unitario IS 'Custo unitário na entrada.';


--
-- Name: COLUMN historico_entradas_estoque.hee_valor_total; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.historico_entradas_estoque.hee_valor_total IS 'Valor total da entrada (quantidade * custo).';


--
-- Name: COLUMN historico_entradas_estoque.hee_data_entrada; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.historico_entradas_estoque.hee_data_entrada IS 'Data da entrada do estoque.';


--
-- Name: COLUMN historico_entradas_estoque.hee_numero_nota_fiscal; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.historico_entradas_estoque.hee_numero_nota_fiscal IS 'Número da nota fiscal.';


--
-- Name: COLUMN historico_entradas_estoque.hee_observacoes; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.historico_entradas_estoque.hee_observacoes IS 'Observações adicionais.';


--
-- Name: historico_entradas_estoque_hee_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.historico_entradas_estoque_hee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.historico_entradas_estoque_hee_id_seq OWNER TO ecm_user;

--
-- Name: historico_entradas_estoque_hee_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.historico_entradas_estoque_hee_id_seq OWNED BY les.historico_entradas_estoque.hee_id;


--
-- Name: intencao_pagamento; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.intencao_pagamento (
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
    CONSTRAINT intencao_pagamento_inp_estado_check CHECK (((inp_estado)::text = ANY ((ARRAY['CRIADA'::character varying, 'CONFIRMADA'::character varying, 'RECUSADA'::character varying, 'EXPIRADA'::character varying, 'CANCELADA'::character varying])::text[]))),
    CONSTRAINT intencao_pagamento_inp_tentativas_confirmacao_check CHECK ((inp_tentativas_confirmacao >= 0)),
    CONSTRAINT intencao_pagamento_inp_valor_check CHECK ((inp_valor > (0)::numeric))
);


ALTER TABLE les.intencao_pagamento OWNER TO ecm_user;

--
-- Name: TABLE intencao_pagamento; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.intencao_pagamento IS 'Intenção de pagamento/cobrança antes da confirmação no provedor (valor travado, TTL, estado).';


--
-- Name: COLUMN intencao_pagamento.inp_hash_segredo; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.intencao_pagamento.inp_hash_segredo IS 'HMAC-SHA-256 (hex) do segredo de confirmação; nunca armazenar segredo em claro.';


--
-- Name: COLUMN intencao_pagamento.inp_expira_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.intencao_pagamento.inp_expira_em IS 'Após este instante a intenção não pode ser confirmada (validação obrigatória na API).';


--
-- Name: intencao_pagamento_inp_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.intencao_pagamento_inp_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.intencao_pagamento_inp_id_seq OWNER TO ecm_user;

--
-- Name: intencao_pagamento_inp_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.intencao_pagamento_inp_id_seq OWNED BY les.intencao_pagamento.inp_id;


--
-- Name: intencao_pagamento_simulado; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.intencao_pagamento_simulado (
    inp_id bigint NOT NULL
);


ALTER TABLE les.intencao_pagamento_simulado OWNER TO ecm_user;

--
-- Name: TABLE intencao_pagamento_simulado; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.intencao_pagamento_simulado IS 'Metadados específicos do provedor de pagamento simulado.';


--
-- Name: intencao_pagamento_stripe; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.intencao_pagamento_stripe (
    inp_id bigint NOT NULL,
    stripe_payment_intent_id character varying(255),
    stripe_customer_id character varying(255)
);


ALTER TABLE les.intencao_pagamento_stripe OWNER TO ecm_user;

--
-- Name: TABLE intencao_pagamento_stripe; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.intencao_pagamento_stripe IS 'Referências Stripe; segredos efêmeros não persistidos em texto plano.';


--
-- Name: itens_venda; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.itens_venda (
    itv_id bigint NOT NULL,
    itv_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    ven_id bigint NOT NULL,
    liv_uuid uuid NOT NULL,
    itv_quantidade integer NOT NULL,
    itv_preco_unitario numeric(10,2) NOT NULL,
    itv_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    itv_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    liv_id bigint
);


ALTER TABLE les.itens_venda OWNER TO ecm_user;

--
-- Name: TABLE itens_venda; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.itens_venda IS 'Itens de cada venda (antiga ecm_item_venda).';


--
-- Name: COLUMN itens_venda.liv_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.itens_venda.liv_id IS 'FK para livro vendido (relacionamento direto com tabela livros).';


--
-- Name: itens_venda_itv_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.itens_venda_itv_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.itens_venda_itv_id_seq OWNER TO ecm_user;

--
-- Name: itens_venda_itv_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.itens_venda_itv_id_seq OWNED BY les.itens_venda.itv_id;


--
-- Name: livro_categorias; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.livro_categorias (
    lct_id integer NOT NULL,
    liv_id bigint NOT NULL,
    cat_id integer NOT NULL,
    lct_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE les.livro_categorias OWNER TO ecm_user;

--
-- Name: TABLE livro_categorias; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.livro_categorias IS 'Tabela associativa para relacionamento N:N entre livros e categorias.';


--
-- Name: COLUMN livro_categorias.lct_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livro_categorias.lct_id IS 'Identificador interno do relacionamento.';


--
-- Name: COLUMN livro_categorias.liv_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livro_categorias.liv_id IS 'FK para livro.';


--
-- Name: COLUMN livro_categorias.cat_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livro_categorias.cat_id IS 'FK para categoria.';


--
-- Name: livro_categorias_lct_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.livro_categorias_lct_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.livro_categorias_lct_id_seq OWNER TO ecm_user;

--
-- Name: livro_categorias_lct_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.livro_categorias_lct_id_seq OWNED BY les.livro_categorias.lct_id;


--
-- Name: livros; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.livros (
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


ALTER TABLE les.livros OWNER TO ecm_user;

--
-- Name: TABLE livros; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.livros IS 'Catálogo central de livros (dados imutáveis do produto).';


--
-- Name: COLUMN livros.liv_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.liv_id IS 'Identificador interno do livro.';


--
-- Name: COLUMN livros.liv_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.liv_uuid IS 'Identificador público UUID do livro.';


--
-- Name: COLUMN livros.liv_titulo; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.liv_titulo IS 'Título completo do livro.';


--
-- Name: COLUMN livros.liv_titulo_norm; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.liv_titulo_norm IS 'Título normalizado para busca (sem acentos, maiúsculas).';


--
-- Name: COLUMN livros.liv_ano; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.liv_ano IS 'Ano de publicação.';


--
-- Name: COLUMN livros.liv_edicao; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.liv_edicao IS 'Número/ano da edição (ex.: "3ª edição").';


--
-- Name: COLUMN livros.liv_isbn; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.liv_isbn IS 'ISBN do livro (único).';


--
-- Name: COLUMN livros.liv_numero_paginas; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.liv_numero_paginas IS 'Número total de páginas.';


--
-- Name: COLUMN livros.liv_sinopse; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.liv_sinopse IS 'Sinopse/descrição do livro.';


--
-- Name: COLUMN livros.liv_altura; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.liv_altura IS 'Altura do livro em cm.';


--
-- Name: COLUMN livros.liv_largura; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.liv_largura IS 'Largura do livro em cm.';


--
-- Name: COLUMN livros.liv_peso; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.liv_peso IS 'Peso do livro em kg.';


--
-- Name: COLUMN livros.liv_profundidade; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.liv_profundidade IS 'Profundidade do livro em cm.';


--
-- Name: COLUMN livros.liv_codigo_barras; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.liv_codigo_barras IS 'Código de barras EAN/UPC.';


--
-- Name: COLUMN livros.aut_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.aut_id IS 'FK para autor principal.';


--
-- Name: COLUMN livros.edi_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.edi_id IS 'FK para editora.';


--
-- Name: COLUMN livros.gpr_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.gpr_id IS 'FK para grupo de precificação.';


--
-- Name: COLUMN livros.liv_ativo; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.liv_ativo IS 'Flag indicando se livro está ativo no catálogo.';


--
-- Name: COLUMN livros.liv_imagem_url; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.livros.liv_imagem_url IS 'URL da imagem de capa do livro.';


--
-- Name: livros_liv_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.livros_liv_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.livros_liv_id_seq OWNER TO ecm_user;

--
-- Name: livros_liv_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.livros_liv_id_seq OWNED BY les.livros.liv_id;


--
-- Name: logradouros; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.logradouros (
    log_id integer NOT NULL,
    tlo_id integer,
    log_nome character varying(200) NOT NULL,
    log_criado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE les.logradouros OWNER TO ecm_user;

--
-- Name: TABLE logradouros; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.logradouros IS 'Logradouros normalizados (tipo + nome). Permite reusar endereços de rua idênticos.';


--
-- Name: COLUMN logradouros.log_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.logradouros.log_id IS 'Identificador interno do logradouro.';


--
-- Name: COLUMN logradouros.tlo_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.logradouros.tlo_id IS 'FK para tipos_logradouros (Rua, Avenida…).';


--
-- Name: COLUMN logradouros.log_nome; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.logradouros.log_nome IS 'Nome do logradouro sem o tipo.';


--
-- Name: logradouros_log_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.logradouros_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.logradouros_log_id_seq OWNER TO ecm_user;

--
-- Name: logradouros_log_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.logradouros_log_id_seq OWNED BY les.logradouros.log_id;


--
-- Name: pagamento; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.pagamento (
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
    CONSTRAINT pagamento_pag_valor_check CHECK ((pag_valor > (0)::numeric))
);


ALTER TABLE les.pagamento OWNER TO ecm_user;

--
-- Name: TABLE pagamento; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.pagamento IS 'Registros de pagamentos realizados para vendas.';


--
-- Name: COLUMN pagamento.pag_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.pagamento.pag_id IS 'Chave primária interna.';


--
-- Name: COLUMN pagamento.pag_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.pagamento.pag_uuid IS 'Identificador público UUID.';


--
-- Name: COLUMN pagamento.ven_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.pagamento.ven_id IS 'FK para ecm_venda — venda associada ao pagamento.';


--
-- Name: COLUMN pagamento.tpg_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.pagamento.tpg_id IS 'FK para tipo_pagamento — tipo de pagamento utilizado.';


--
-- Name: COLUMN pagamento.stp_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.pagamento.stp_id IS 'FK para status_pagamento — status atual do pagamento.';


--
-- Name: COLUMN pagamento.pag_valor; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.pagamento.pag_valor IS 'Valor total do pagamento.';


--
-- Name: COLUMN pagamento.pag_detalhes_cupom; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.pagamento.pag_detalhes_cupom IS 'Código ou detalhes do cupom (quando aplicável).';


--
-- Name: COLUMN pagamento.pag_processado_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.pagamento.pag_processado_em IS 'Timestamp de processamento do pagamento.';


--
-- Name: COLUMN pagamento.pag_criado_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.pagamento.pag_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: COLUMN pagamento.pag_atualizado_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.pagamento.pag_atualizado_em IS 'Timestamp da última atualização.';


--
-- Name: COLUMN pagamento.inp_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.pagamento.inp_id IS 'FK opcional para intencao_pagamento (checkout com intenção prévia).';


--
-- Name: pagamento_pag_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.pagamento_pag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.pagamento_pag_id_seq OWNER TO ecm_user;

--
-- Name: pagamento_pag_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.pagamento_pag_id_seq OWNED BY les.pagamento.pag_id;


--
-- Name: pagamento_pix_simulado; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.pagamento_pix_simulado (
    ppx_id bigint NOT NULL,
    pag_id bigint NOT NULL,
    ppx_copia_cola text NOT NULL,
    ppx_qr_base64 text,
    ppx_expira_em timestamp with time zone NOT NULL,
    ppx_segredo_confirmacao character varying(128) NOT NULL
);


ALTER TABLE les.pagamento_pix_simulado OWNER TO ecm_user;

--
-- Name: TABLE pagamento_pix_simulado; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.pagamento_pix_simulado IS 'Cobrança PIX simulada (copia-e-cola, QR, expiração, segredo para webhook).';


--
-- Name: COLUMN pagamento_pix_simulado.ppx_segredo_confirmacao; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.pagamento_pix_simulado.ppx_segredo_confirmacao IS 'Segredo enviado ao webhook para confirmar liquidação (simula assinatura do PSP).';


--
-- Name: pagamento_pix_simulado_ppx_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.pagamento_pix_simulado_ppx_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.pagamento_pix_simulado_ppx_id_seq OWNER TO ecm_user;

--
-- Name: pagamento_pix_simulado_ppx_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.pagamento_pix_simulado_ppx_id_seq OWNED BY les.pagamento_pix_simulado.ppx_id;


--
-- Name: paises; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.paises (
    pai_id integer NOT NULL,
    pai_nome character varying(80) NOT NULL,
    pai_criado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE les.paises OWNER TO ecm_user;

--
-- Name: TABLE paises; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.paises IS 'Países suportados pelo sistema. Inicialmente apenas Brasil.';


--
-- Name: COLUMN paises.pai_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.paises.pai_id IS 'Identificador interno do país.';


--
-- Name: COLUMN paises.pai_nome; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.paises.pai_nome IS 'Nome completo do país (ex.: Brasil, Estados Unidos).';


--
-- Name: paises_pai_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.paises_pai_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.paises_pai_id_seq OWNER TO ecm_user;

--
-- Name: paises_pai_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.paises_pai_id_seq OWNED BY les.paises.pai_id;


--
-- Name: papeis; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.papeis (
    pap_id integer NOT NULL,
    pap_descricao character varying(30) NOT NULL,
    pap_criado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE les.papeis OWNER TO ecm_user;

--
-- Name: TABLE papeis; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.papeis IS 'Papéis de acesso dos usuários do sistema.';


--
-- Name: COLUMN papeis.pap_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.papeis.pap_id IS 'Identificador interno do papel (nunca exposto nas rotas).';


--
-- Name: COLUMN papeis.pap_descricao; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.papeis.pap_descricao IS 'Nome canônico do papel (ex.: cliente, admin).';


--
-- Name: papeis_pap_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.papeis_pap_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.papeis_pap_id_seq OWNER TO ecm_user;

--
-- Name: papeis_pap_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.papeis_pap_id_seq OWNED BY les.papeis.pap_id;


--
-- Name: status_pagamento; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.status_pagamento (
    stp_id integer NOT NULL,
    stp_descricao character varying(50) NOT NULL,
    stp_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE les.status_pagamento OWNER TO ecm_user;

--
-- Name: TABLE status_pagamento; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.status_pagamento IS 'Status de pagamento das vendas (PENDENTE, APROVADO, RECUSADO, CANCELADO).';


--
-- Name: COLUMN status_pagamento.stp_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.status_pagamento.stp_id IS 'Identificador interno do status.';


--
-- Name: COLUMN status_pagamento.stp_descricao; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.status_pagamento.stp_descricao IS 'Descrição do status (ex.: PENDENTE, APROVADO).';


--
-- Name: COLUMN status_pagamento.stp_criado_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.status_pagamento.stp_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: status_pagamento_stp_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.status_pagamento_stp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.status_pagamento_stp_id_seq OWNER TO ecm_user;

--
-- Name: status_pagamento_stp_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.status_pagamento_stp_id_seq OWNED BY les.status_pagamento.stp_id;


--
-- Name: status_vendas; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.status_vendas (
    stv_id integer NOT NULL,
    stv_descricao character varying(50) NOT NULL,
    stv_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE les.status_vendas OWNER TO ecm_user;

--
-- Name: status_venda_stv_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.status_venda_stv_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.status_venda_stv_id_seq OWNER TO ecm_user;

--
-- Name: status_venda_stv_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.status_venda_stv_id_seq OWNED BY les.status_vendas.stv_id;


--
-- Name: telefones; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.telefones (
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


ALTER TABLE les.telefones OWNER TO ecm_user;

--
-- Name: TABLE telefones; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.telefones IS 'Objetos de valor de telefone vinculados a um usuário. Um usuário pode ter N telefones, mas apenas um principal.';


--
-- Name: COLUMN telefones.tel_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.telefones.tel_id IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';


--
-- Name: COLUMN telefones.tel_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.telefones.tel_uuid IS 'Identificador público (UUID v4). Retornado nas rotas HTTP.';


--
-- Name: COLUMN telefones.usu_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.telefones.usu_id IS 'FK para usuarios — dono do telefone.';


--
-- Name: COLUMN telefones.ttp_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.telefones.ttp_id IS 'FK para tipos_telefones (celular, residencial, comercial…).';


--
-- Name: COLUMN telefones.tel_ddd; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.telefones.tel_ddd IS 'Código DDD de 2 dígitos (somente números).';


--
-- Name: COLUMN telefones.tel_numero; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.telefones.tel_numero IS 'Número local com 8 ou 9 dígitos (somente números, sem formatação).';


--
-- Name: COLUMN telefones.tel_principal; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.telefones.tel_principal IS 'TRUE indica que este é o telefone de contato principal do usuário.';


--
-- Name: COLUMN telefones.tel_criado_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.telefones.tel_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: COLUMN telefones.tel_atualizado_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.telefones.tel_atualizado_em IS 'Timestamp da última atualização.';


--
-- Name: telefones_tel_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.telefones_tel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.telefones_tel_id_seq OWNER TO ecm_user;

--
-- Name: telefones_tel_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.telefones_tel_id_seq OWNED BY les.telefones.tel_id;


--
-- Name: tipos_frete; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.tipos_frete (
    tfr_id integer NOT NULL,
    tfr_descricao character varying(100) NOT NULL,
    tfr_criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE les.tipos_frete OWNER TO ecm_user;

--
-- Name: tipo_frete_tfr_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.tipo_frete_tfr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.tipo_frete_tfr_id_seq OWNER TO ecm_user;

--
-- Name: tipo_frete_tfr_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.tipo_frete_tfr_id_seq OWNED BY les.tipos_frete.tfr_id;


--
-- Name: tipo_pagamento; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.tipo_pagamento (
    tpg_id integer NOT NULL,
    tpg_descricao character varying(50) NOT NULL,
    tpg_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE les.tipo_pagamento OWNER TO ecm_user;

--
-- Name: TABLE tipo_pagamento; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.tipo_pagamento IS 'Tipos de pagamento aceitos (cartao_credito, cupom_troca, cupom_promocional, pix).';


--
-- Name: COLUMN tipo_pagamento.tpg_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.tipo_pagamento.tpg_id IS 'Identificador interno do tipo de pagamento.';


--
-- Name: COLUMN tipo_pagamento.tpg_descricao; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.tipo_pagamento.tpg_descricao IS 'Descrição do tipo (ex.: cartao_credito, cupom_promocional).';


--
-- Name: COLUMN tipo_pagamento.tpg_criado_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.tipo_pagamento.tpg_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: tipo_pagamento_tpg_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.tipo_pagamento_tpg_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.tipo_pagamento_tpg_id_seq OWNER TO ecm_user;

--
-- Name: tipo_pagamento_tpg_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.tipo_pagamento_tpg_id_seq OWNED BY les.tipo_pagamento.tpg_id;


--
-- Name: tipos_logradouros; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.tipos_logradouros (
    tlo_id integer NOT NULL,
    tlo_descricao character varying(50) NOT NULL
);


ALTER TABLE les.tipos_logradouros OWNER TO ecm_user;

--
-- Name: TABLE tipos_logradouros; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.tipos_logradouros IS 'Tipos de logradouro (Rua, Avenida, Alameda, Travessa…).';


--
-- Name: COLUMN tipos_logradouros.tlo_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.tipos_logradouros.tlo_id IS 'Identificador interno do tipo de logradouro.';


--
-- Name: COLUMN tipos_logradouros.tlo_descricao; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.tipos_logradouros.tlo_descricao IS 'Descrição do tipo (ex.: Rua, Avenida, Alameda).';


--
-- Name: tipos_logradouros_tlo_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.tipos_logradouros_tlo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.tipos_logradouros_tlo_id_seq OWNER TO ecm_user;

--
-- Name: tipos_logradouros_tlo_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.tipos_logradouros_tlo_id_seq OWNED BY les.tipos_logradouros.tlo_id;


--
-- Name: tipos_residencias; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.tipos_residencias (
    tre_id integer NOT NULL,
    tre_descricao character varying(50) NOT NULL
);


ALTER TABLE les.tipos_residencias OWNER TO ecm_user;

--
-- Name: TABLE tipos_residencias; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.tipos_residencias IS 'Tipos de residência vinculados a endereços dos clientes.';


--
-- Name: COLUMN tipos_residencias.tre_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.tipos_residencias.tre_id IS 'Identificador interno do tipo de residência.';


--
-- Name: COLUMN tipos_residencias.tre_descricao; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.tipos_residencias.tre_descricao IS 'Descrição do tipo (ex.: Casa, Apartamento, Condomínio).';


--
-- Name: tipos_residencias_tre_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.tipos_residencias_tre_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.tipos_residencias_tre_id_seq OWNER TO ecm_user;

--
-- Name: tipos_residencias_tre_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.tipos_residencias_tre_id_seq OWNED BY les.tipos_residencias.tre_id;


--
-- Name: tipos_telefones; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.tipos_telefones (
    ttp_id integer NOT NULL,
    ttp_descricao character varying(30) NOT NULL
);


ALTER TABLE les.tipos_telefones OWNER TO ecm_user;

--
-- Name: TABLE tipos_telefones; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.tipos_telefones IS 'Tipos de telefone aceitos pelo sistema (celular, residencial, comercial…).';


--
-- Name: COLUMN tipos_telefones.ttp_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.tipos_telefones.ttp_id IS 'Identificador interno do tipo de telefone.';


--
-- Name: COLUMN tipos_telefones.ttp_descricao; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.tipos_telefones.ttp_descricao IS 'Descrição do tipo (ex.: celular, residencial, comercial).';


--
-- Name: tipos_telefones_ttp_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.tipos_telefones_ttp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.tipos_telefones_ttp_id_seq OWNER TO ecm_user;

--
-- Name: tipos_telefones_ttp_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.tipos_telefones_ttp_id_seq OWNED BY les.tipos_telefones.ttp_id;


--
-- Name: usuarios; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.usuarios (
    usu_id bigint NOT NULL,
    usu_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usu_nome character varying(80) NOT NULL,
    usu_email character varying(255) NOT NULL,
    usu_cpf character(14) NOT NULL,
    usu_senha_hash character varying(100) NOT NULL,
    pap_id integer NOT NULL,
    usu_telefone_rapido character varying(15),
    usu_genero character varying(20),
    usu_data_nascimento date,
    usu_ativo boolean DEFAULT true NOT NULL,
    usu_is_admin_mestre boolean DEFAULT false NOT NULL,
    usu_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    usu_atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE les.usuarios OWNER TO ecm_user;

--
-- Name: TABLE usuarios; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.usuarios IS 'Entidade central de identidade: todo ator autenticado (cliente ou admin) possui exatamente um registro aqui.';


--
-- Name: COLUMN usuarios.usu_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.usuarios.usu_id IS 'Chave primária interna (BIGSERIAL). Usada apenas em JOINs internos; nunca exposta nas rotas HTTP.';


--
-- Name: COLUMN usuarios.usu_uuid; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.usuarios.usu_uuid IS 'Identificador público (UUID v4). Único campo de identidade retornado pelas rotas HTTP.';


--
-- Name: COLUMN usuarios.usu_nome; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.usuarios.usu_nome IS 'Nome completo do usuário.';


--
-- Name: COLUMN usuarios.usu_email; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.usuarios.usu_email IS 'Endereço de e-mail único utilizado como login.';


--
-- Name: COLUMN usuarios.usu_cpf; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.usuarios.usu_cpf IS 'CPF no formato XXX.XXX.XXX-XX. Único por usuário.';


--
-- Name: COLUMN usuarios.usu_senha_hash; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.usuarios.usu_senha_hash IS 'Hash bcrypt da senha. Nunca retornado pela API.';


--
-- Name: COLUMN usuarios.pap_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.usuarios.pap_id IS 'FK para papeis — define se o usuário é cliente ou admin.';


--
-- Name: COLUMN usuarios.usu_ativo; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.usuarios.usu_ativo IS 'FALSE indica inativação (soft delete). RF0023.';


--
-- Name: COLUMN usuarios.usu_criado_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.usuarios.usu_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: COLUMN usuarios.usu_atualizado_em; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.usuarios.usu_atualizado_em IS 'Timestamp da última atualização (atualizado via trigger ou aplicação).';


--
-- Name: usuarios_usu_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.usuarios_usu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.usuarios_usu_id_seq OWNER TO ecm_user;

--
-- Name: usuarios_usu_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.usuarios_usu_id_seq OWNED BY les.usuarios.usu_id;


--
-- Name: vendas; Type: TABLE; Schema: les; Owner: ecm_user
--

CREATE TABLE les.vendas (
    ven_id bigint NOT NULL,
    ven_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usu_id bigint NOT NULL,
    stv_id integer NOT NULL,
    ven_total_itens numeric(10,2) NOT NULL,
    ven_frete numeric(10,2) NOT NULL,
    ven_total_venda numeric(10,2) NOT NULL,
    ven_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ven_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    cfr_id bigint
);


ALTER TABLE les.vendas OWNER TO ecm_user;

--
-- Name: TABLE vendas; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON TABLE les.vendas IS 'Vendas realizadas pelos usuários (antiga ecm_venda).';


--
-- Name: COLUMN vendas.cfr_id; Type: COMMENT; Schema: les; Owner: ecm_user
--

COMMENT ON COLUMN les.vendas.cfr_id IS 'Cotação de frete escolhida no checkout (opcional durante migração legado).';


--
-- Name: vendas_ven_id_seq; Type: SEQUENCE; Schema: les; Owner: ecm_user
--

CREATE SEQUENCE les.vendas_ven_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE les.vendas_ven_id_seq OWNER TO ecm_user;

--
-- Name: vendas_ven_id_seq; Type: SEQUENCE OWNED BY; Schema: les; Owner: ecm_user
--

ALTER SEQUENCE les.vendas_ven_id_seq OWNED BY les.vendas.ven_id;


--
-- Name: autores; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.autores (
    aut_id integer NOT NULL,
    aut_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    aut_nome character varying(200) NOT NULL,
    aut_nome_norm character varying(200) NOT NULL,
    aut_descricao text,
    aut_ativo boolean DEFAULT true NOT NULL,
    aut_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    aut_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.autores OWNER TO ecm_user;

--
-- Name: TABLE autores; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.autores IS 'Catálogo de autores de livros.';


--
-- Name: COLUMN autores.aut_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.autores.aut_id IS 'Identificador interno do autor.';


--
-- Name: COLUMN autores.aut_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.autores.aut_uuid IS 'Identificador público UUID do autor.';


--
-- Name: COLUMN autores.aut_nome; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.autores.aut_nome IS 'Nome completo do autor.';


--
-- Name: COLUMN autores.aut_nome_norm; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.autores.aut_nome_norm IS 'Nome normalizado para busca (sem acentos, maiúsculas).';


--
-- Name: COLUMN autores.aut_descricao; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.autores.aut_descricao IS 'Biografia/descrição do autor.';


--
-- Name: COLUMN autores.aut_ativo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.autores.aut_ativo IS 'Flag indicando se autor está ativo no catálogo.';


--
-- Name: autores_aut_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.autores_aut_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.autores_aut_id_seq OWNER TO ecm_user;

--
-- Name: autores_aut_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.autores_aut_id_seq OWNED BY public.autores.aut_id;


--
-- Name: avaliacoes_livro; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.avaliacoes_livro (
    avl_id bigint NOT NULL,
    avl_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    liv_id bigint NOT NULL,
    usu_id bigint NOT NULL,
    avl_nota integer NOT NULL,
    avl_comentario character varying(1000),
    avl_aprovado boolean DEFAULT false NOT NULL,
    avl_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    avl_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT avaliacoes_livro_avl_nota_check CHECK (((avl_nota >= 1) AND (avl_nota <= 5)))
);


ALTER TABLE public.avaliacoes_livro OWNER TO ecm_user;

--
-- Name: TABLE avaliacoes_livro; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.avaliacoes_livro IS 'Avaliações de usuários para livros (RN0068).';


--
-- Name: COLUMN avaliacoes_livro.avl_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.avaliacoes_livro.avl_id IS 'Identificador interno da avaliação.';


--
-- Name: COLUMN avaliacoes_livro.avl_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.avaliacoes_livro.avl_uuid IS 'Identificador público UUID da avaliação.';


--
-- Name: COLUMN avaliacoes_livro.liv_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.avaliacoes_livro.liv_id IS 'FK para livro avaliado.';


--
-- Name: COLUMN avaliacoes_livro.usu_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.avaliacoes_livro.usu_id IS 'FK para usuário que avaliou.';


--
-- Name: COLUMN avaliacoes_livro.avl_nota; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.avaliacoes_livro.avl_nota IS 'Nota de 1 a 5 estrelas.';


--
-- Name: COLUMN avaliacoes_livro.avl_comentario; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.avaliacoes_livro.avl_comentario IS 'Comentário opcional do usuário.';


--
-- Name: COLUMN avaliacoes_livro.avl_aprovado; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.avaliacoes_livro.avl_aprovado IS 'Flag indicando se avaliação foi aprovada para exibição.';


--
-- Name: avaliacoes_livro_avl_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.avaliacoes_livro_avl_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.avaliacoes_livro_avl_id_seq OWNER TO ecm_user;

--
-- Name: avaliacoes_livro_avl_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.avaliacoes_livro_avl_id_seq OWNED BY public.avaliacoes_livro.avl_id;


--
-- Name: bairros; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.bairros (
    bai_id integer NOT NULL,
    bai_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    bai_nome character varying(200) NOT NULL,
    bai_nome_norm character varying(200) NOT NULL,
    cid_id integer NOT NULL,
    bai_criado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bairros OWNER TO ecm_user;

--
-- Name: TABLE bairros; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.bairros IS 'Catálogo normalizado de bairros por cidade (matching via bai_nome_norm).';


--
-- Name: COLUMN bairros.bai_nome_norm; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.bairros.bai_nome_norm IS 'Versão normalizada de bai_nome (UPPER(TRIM(...))).';


--
-- Name: bairros_bai_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.bairros_bai_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bairros_bai_id_seq OWNER TO ecm_user;

--
-- Name: bairros_bai_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.bairros_bai_id_seq OWNED BY public.bairros.bai_id;


--
-- Name: bandeiras_cartao; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.bandeiras_cartao (
    ban_id integer NOT NULL,
    ban_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    ban_descricao character varying(30) NOT NULL,
    ban_criado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bandeiras_cartao OWNER TO ecm_user;

--
-- Name: TABLE bandeiras_cartao; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.bandeiras_cartao IS 'Bandeiras de cartão de crédito suportadas (RN0025).';


--
-- Name: COLUMN bandeiras_cartao.ban_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.bandeiras_cartao.ban_id IS 'Identificador interno da bandeira.';


--
-- Name: COLUMN bandeiras_cartao.ban_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.bandeiras_cartao.ban_uuid IS 'Identificador público (UUID v4) para uso em rotas HTTP.';


--
-- Name: COLUMN bandeiras_cartao.ban_descricao; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.bandeiras_cartao.ban_descricao IS 'Nome da bandeira (Visa, Mastercard, Elo, etc.).';


--
-- Name: bandeiras_cartao_ban_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.bandeiras_cartao_ban_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bandeiras_cartao_ban_id_seq OWNER TO ecm_user;

--
-- Name: bandeiras_cartao_ban_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.bandeiras_cartao_ban_id_seq OWNED BY public.bandeiras_cartao.ban_id;


--
-- Name: carrinho_itens; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.carrinho_itens (
    cri_id bigint NOT NULL,
    usu_id bigint NOT NULL,
    liv_id bigint NOT NULL,
    cri_quantidade integer NOT NULL,
    cri_atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT carrinho_itens_cri_quantidade_check CHECK ((cri_quantidade > 0))
);


ALTER TABLE public.carrinho_itens OWNER TO ecm_user;

--
-- Name: TABLE carrinho_itens; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.carrinho_itens IS 'Itens do carrinho de compras por usuário autenticado.';


--
-- Name: carrinho_itens_cri_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.carrinho_itens_cri_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.carrinho_itens_cri_id_seq OWNER TO ecm_user;

--
-- Name: carrinho_itens_cri_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.carrinho_itens_cri_id_seq OWNED BY public.carrinho_itens.cri_id;


--
-- Name: cartao_pagamento; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.cartao_pagamento (
    cpp_id bigint NOT NULL,
    cpp_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    pag_id bigint NOT NULL,
    cpp_numero_tokenizado character varying(255) NOT NULL,
    cpp_nome_titular character varying(100) NOT NULL,
    cpp_validade character varying(7) NOT NULL,
    cpp_bandeira character varying(50) NOT NULL,
    cpp_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cartao_pagamento OWNER TO ecm_user;

--
-- Name: TABLE cartao_pagamento; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.cartao_pagamento IS 'Dados de cartões utilizados em pagamentos (apenas tokens por segurança).';


--
-- Name: COLUMN cartao_pagamento.cpp_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartao_pagamento.cpp_id IS 'Chave primária interna.';


--
-- Name: COLUMN cartao_pagamento.cpp_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartao_pagamento.cpp_uuid IS 'Identificador público UUID.';


--
-- Name: COLUMN cartao_pagamento.pag_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartao_pagamento.pag_id IS 'FK para pagamento — pagamento associado ao cartão.';


--
-- Name: COLUMN cartao_pagamento.cpp_numero_tokenizado; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartao_pagamento.cpp_numero_tokenizado IS 'Token ou hash SHA-256 do número do cartão.';


--
-- Name: COLUMN cartao_pagamento.cpp_nome_titular; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartao_pagamento.cpp_nome_titular IS 'Nome do titular impresso no cartão.';


--
-- Name: COLUMN cartao_pagamento.cpp_validade; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartao_pagamento.cpp_validade IS 'Validade do cartão no formato MM/YYYY.';


--
-- Name: COLUMN cartao_pagamento.cpp_bandeira; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartao_pagamento.cpp_bandeira IS 'Bandeira do cartão (Visa, Mastercard, etc.).';


--
-- Name: COLUMN cartao_pagamento.cpp_criado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartao_pagamento.cpp_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: cartao_pagamento_cpp_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.cartao_pagamento_cpp_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cartao_pagamento_cpp_id_seq OWNER TO ecm_user;

--
-- Name: cartao_pagamento_cpp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.cartao_pagamento_cpp_id_seq OWNED BY public.cartao_pagamento.cpp_id;


--
-- Name: cartoes; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.cartoes (
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


ALTER TABLE public.cartoes OWNER TO ecm_user;

--
-- Name: TABLE cartoes; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.cartoes IS 'Cartões de crédito cadastrados pelos usuários. Apenas token é armazenado por segurança.';


--
-- Name: COLUMN cartoes.crt_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartoes.crt_id IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';


--
-- Name: COLUMN cartoes.crt_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartoes.crt_uuid IS 'Identificador público (UUID v4). Retornado nas rotas HTTP.';


--
-- Name: COLUMN cartoes.usu_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartoes.usu_id IS 'FK para usuarios.';


--
-- Name: COLUMN cartoes.ban_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartoes.ban_id IS 'FK para bandeiras_cartao — bandeira do cartão.';


--
-- Name: COLUMN cartoes.crt_token; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartoes.crt_token IS 'Token do cartão retornado pela operadora. Nunca o número real.';


--
-- Name: COLUMN cartoes.crt_final; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartoes.crt_final IS 'Últimos 4 dígitos do cartão para identificação (ex.: 1234).';


--
-- Name: COLUMN cartoes.crt_nome_impresso; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartoes.crt_nome_impresso IS 'Nome como aparece impresso no cartão.';


--
-- Name: COLUMN cartoes.crt_validade; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartoes.crt_validade IS 'Data de validade do cartão (mês/ano).';


--
-- Name: COLUMN cartoes.crt_principal; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartoes.crt_principal IS 'TRUE se este é o cartão principal do usuário.';


--
-- Name: COLUMN cartoes.crt_criado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartoes.crt_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: COLUMN cartoes.crt_atualizado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cartoes.crt_atualizado_em IS 'Timestamp da última atualização.';


--
-- Name: cartoes_crt_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.cartoes_crt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cartoes_crt_id_seq OWNER TO ecm_user;

--
-- Name: cartoes_crt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.cartoes_crt_id_seq OWNED BY public.cartoes.crt_id;


--
-- Name: categorias; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.categorias (
    cat_id integer NOT NULL,
    cat_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    cat_nome character varying(100) NOT NULL,
    cat_nome_norm character varying(100) NOT NULL,
    cat_descricao character varying(500),
    cat_ativo boolean DEFAULT true NOT NULL,
    cat_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    cat_slug character varying(120)
);


ALTER TABLE public.categorias OWNER TO ecm_user;

--
-- Name: TABLE categorias; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.categorias IS 'Catálogo de categorias de livros.';


--
-- Name: COLUMN categorias.cat_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.categorias.cat_id IS 'Identificador interno da categoria.';


--
-- Name: COLUMN categorias.cat_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.categorias.cat_uuid IS 'Identificador público UUID da categoria.';


--
-- Name: COLUMN categorias.cat_nome; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.categorias.cat_nome IS 'Nome da categoria.';


--
-- Name: COLUMN categorias.cat_nome_norm; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.categorias.cat_nome_norm IS 'Nome normalizado para busca (sem acentos, maiúsculas).';


--
-- Name: COLUMN categorias.cat_descricao; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.categorias.cat_descricao IS 'Descrição da categoria.';


--
-- Name: COLUMN categorias.cat_ativo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.categorias.cat_ativo IS 'Flag indicando se categoria está ativa.';


--
-- Name: COLUMN categorias.cat_slug; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.categorias.cat_slug IS 'Identificador estável para URL (ex.: ficcao, fantasia).';


--
-- Name: categorias_cat_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.categorias_cat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_cat_id_seq OWNER TO ecm_user;

--
-- Name: categorias_cat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.categorias_cat_id_seq OWNED BY public.categorias.cat_id;


--
-- Name: ceps; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.ceps (
    cep_id integer NOT NULL,
    cep_numero character(8) NOT NULL,
    cid_id integer,
    bai_id integer,
    cep_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_ceps_numero_numerico CHECK ((cep_numero ~ '^[0-9]{8}$'::text))
);


ALTER TABLE public.ceps OWNER TO ecm_user;

--
-- Name: TABLE ceps; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.ceps IS 'CEPs brasileiros normalizados. Centraliza dados postais e evita duplicação.';


--
-- Name: COLUMN ceps.cep_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.ceps.cep_id IS 'Identificador interno do CEP.';


--
-- Name: COLUMN ceps.cep_numero; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.ceps.cep_numero IS 'CEP com 8 dígitos numéricos.';


--
-- Name: COLUMN ceps.cid_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.ceps.cid_id IS 'FK para cidades — cidade do CEP.';


--
-- Name: COLUMN ceps.bai_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.ceps.bai_id IS 'FK para bairros — bairro principal do CEP (opcional, pois CEPs abrangem áreas).';


--
-- Name: ceps_cep_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.ceps_cep_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ceps_cep_id_seq OWNER TO ecm_user;

--
-- Name: ceps_cep_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.ceps_cep_id_seq OWNED BY public.ceps.cep_id;


--
-- Name: cidades; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.cidades (
    cid_id integer NOT NULL,
    cid_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    cid_nome character varying(200) NOT NULL,
    cid_nome_norm character varying(200) NOT NULL,
    est_id integer,
    cid_criado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cidades OWNER TO ecm_user;

--
-- Name: TABLE cidades; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.cidades IS 'Catálogo normalizado de cidades (nomes normalizados para matching).';


--
-- Name: COLUMN cidades.cid_nome_norm; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cidades.cid_nome_norm IS 'Versão normalizada de cid_nome (UPPER(TRIM(...))) usada para unicidade e matching.';


--
-- Name: cidades_cid_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.cidades_cid_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cidades_cid_id_seq OWNER TO ecm_user;

--
-- Name: cidades_cid_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.cidades_cid_id_seq OWNED BY public.cidades.cid_id;


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.clientes (
    cli_id bigint NOT NULL,
    cli_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usu_id bigint NOT NULL,
    cli_genero character varying(30),
    cli_data_nascimento date,
    cli_ranking integer DEFAULT 0 NOT NULL,
    cli_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    cli_atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.clientes OWNER TO ecm_user;

--
-- Name: TABLE clientes; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.clientes IS 'Perfil 1:1 com usuarios, restrito a usuários com papel cliente. Armazena dados complementares não utilizados na autenticação.';


--
-- Name: COLUMN clientes.cli_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.clientes.cli_id IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';


--
-- Name: COLUMN clientes.cli_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.clientes.cli_uuid IS 'Identificador público (UUID v4). Retornado nas rotas HTTP quando necessário.';


--
-- Name: COLUMN clientes.usu_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.clientes.usu_id IS 'FK única para usuarios — garante relação 1:1.';


--
-- Name: COLUMN clientes.cli_genero; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.clientes.cli_genero IS 'Gênero autodeclarado pelo cliente (opcional). Sem restrição de domínio para suportar diversidade. RN0026.';


--
-- Name: COLUMN clientes.cli_data_nascimento; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.clientes.cli_data_nascimento IS 'Data de nascimento do cliente (opcional). RN0026.';


--
-- Name: COLUMN clientes.cli_ranking; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.clientes.cli_ranking IS 'Ranking numérico do cliente baseado no perfil de compra. RN0027. Valor padrão 0.';


--
-- Name: COLUMN clientes.cli_criado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.clientes.cli_criado_em IS 'Timestamp de criação do perfil.';


--
-- Name: COLUMN clientes.cli_atualizado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.clientes.cli_atualizado_em IS 'Timestamp da última atualização (mantido via trigger).';


--
-- Name: clientes_cli_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.clientes_cli_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clientes_cli_id_seq OWNER TO ecm_user;

--
-- Name: clientes_cli_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.clientes_cli_id_seq OWNED BY public.clientes.cli_id;


--
-- Name: configuracoes_app; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.configuracoes_app (
    cfg_id integer NOT NULL,
    cfg_chave character varying(50) NOT NULL,
    cfg_valor text NOT NULL,
    cfg_descricao character varying(255),
    cfg_atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.configuracoes_app OWNER TO ecm_user;

--
-- Name: TABLE configuracoes_app; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.configuracoes_app IS 'Configurações globais do sistema.';


--
-- Name: COLUMN configuracoes_app.cfg_chave; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.configuracoes_app.cfg_chave IS 'Nome único da configuração (ex: SENHA_MESTRA_ADMIN_HASH).';


--
-- Name: COLUMN configuracoes_app.cfg_valor; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.configuracoes_app.cfg_valor IS 'Valor da configuração (pode ser um hash, uma string, etc).';


--
-- Name: COLUMN configuracoes_app.cfg_descricao; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.configuracoes_app.cfg_descricao IS 'Explicação sobre para que serve esta configuração.';


--
-- Name: configuracoes_app_cfg_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.configuracoes_app_cfg_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.configuracoes_app_cfg_id_seq OWNER TO ecm_user;

--
-- Name: configuracoes_app_cfg_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.configuracoes_app_cfg_id_seq OWNED BY public.configuracoes_app.cfg_id;


--
-- Name: cotacao_frete; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.cotacao_frete (
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
    CONSTRAINT cotacao_frete_cfr_estado_check CHECK (((cfr_estado)::text = ANY ((ARRAY['CRIADA'::character varying, 'CONSUMIDA'::character varying, 'EXPIRADA'::character varying, 'CANCELADA'::character varying])::text[]))),
    CONSTRAINT cotacao_frete_cfr_peso_kg_check CHECK ((cfr_peso_kg > (0)::numeric)),
    CONSTRAINT cotacao_frete_cfr_valor_check CHECK ((cfr_valor >= (0)::numeric))
);


ALTER TABLE public.cotacao_frete OWNER TO ecm_user;

--
-- Name: TABLE cotacao_frete; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.cotacao_frete IS 'Cotação de frete por modalidade; UUID exposto ao cliente para seleção no checkout.';


--
-- Name: cotacao_frete_cfr_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.cotacao_frete_cfr_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cotacao_frete_cfr_id_seq OWNER TO ecm_user;

--
-- Name: cotacao_frete_cfr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.cotacao_frete_cfr_id_seq OWNED BY public.cotacao_frete.cfr_id;


--
-- Name: cotacao_frete_simulada; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.cotacao_frete_simulada (
    cfr_id bigint NOT NULL,
    cfs_fator_regiao numeric(10,4) DEFAULT 1.0 NOT NULL,
    cfs_peso_arredondado numeric(10,3) NOT NULL
);


ALTER TABLE public.cotacao_frete_simulada OWNER TO ecm_user;

--
-- Name: TABLE cotacao_frete_simulada; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.cotacao_frete_simulada IS 'Metadados da transportadora simulada (regras internas de cálculo).';


--
-- Name: cupom; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.cupom (
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


ALTER TABLE public.cupom OWNER TO ecm_user;

--
-- Name: TABLE cupom; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.cupom IS 'Seed de cupons para testes E2E do Cypress';


--
-- Name: COLUMN cupom.cup_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cupom.cup_id IS 'Chave primária interna';


--
-- Name: COLUMN cupom.cup_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cupom.cup_uuid IS 'Identificador público UUID';


--
-- Name: COLUMN cupom.cup_codigo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cupom.cup_codigo IS 'Código do cupom para digitação no checkout';


--
-- Name: COLUMN cupom.cup_tipo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cupom.cup_tipo IS 'Tipo: promocional (máximo 1 por compra) ou troca (múltiplos permitidos)';


--
-- Name: COLUMN cupom.cup_valor_desconto; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cupom.cup_valor_desconto IS 'Valor do desconto em reais';


--
-- Name: COLUMN cupom.cup_valor_minimo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cupom.cup_valor_minimo IS 'Valor mínimo da compra para aplicar o cupom';


--
-- Name: COLUMN cupom.cup_uso_maximo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cupom.cup_uso_maximo IS 'Número máximo de usos (NULL = ilimitado)';


--
-- Name: COLUMN cupom.cup_uso_atual; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cupom.cup_uso_atual IS 'Contador de usos atual';


--
-- Name: COLUMN cupom.cup_valido_de; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cupom.cup_valido_de IS 'Data de início de validade';


--
-- Name: COLUMN cupom.cup_valido_ate; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cupom.cup_valido_ate IS 'Data de fim de validade';


--
-- Name: COLUMN cupom.cup_ativo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cupom.cup_ativo IS 'Se o cupom está ativo';


--
-- Name: COLUMN cupom.cup_criado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cupom.cup_criado_em IS 'Timestamp de criação';


--
-- Name: COLUMN cupom.cup_atualizado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cupom.cup_atualizado_em IS 'Timestamp da última atualização';


--
-- Name: cupom_cup_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.cupom_cup_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cupom_cup_id_seq OWNER TO ecm_user;

--
-- Name: cupom_cup_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.cupom_cup_id_seq OWNED BY public.cupom.cup_id;


--
-- Name: cupons_troca; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.cupons_troca (
    ctr_id bigint NOT NULL,
    ctr_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usu_id bigint NOT NULL,
    ctr_codigo character varying(50) NOT NULL,
    ctr_valor_original numeric(10,2) NOT NULL,
    ctr_valor_atual numeric(10,2) NOT NULL,
    ctr_ativo boolean DEFAULT true NOT NULL,
    ctr_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    ctr_atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cupons_troca OWNER TO ecm_user;

--
-- Name: TABLE cupons_troca; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.cupons_troca IS 'Armazena cupons de troca vinculados aos usuários.';


--
-- Name: COLUMN cupons_troca.ctr_codigo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cupons_troca.ctr_codigo IS 'Código único do cupom (ex.: TROCA-ABC-123).';


--
-- Name: COLUMN cupons_troca.ctr_valor_atual; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.cupons_troca.ctr_valor_atual IS 'Saldo remanescente do cupom.';


--
-- Name: cupons_troca_ctr_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.cupons_troca_ctr_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cupons_troca_ctr_id_seq OWNER TO ecm_user;

--
-- Name: cupons_troca_ctr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.cupons_troca_ctr_id_seq OWNED BY public.cupons_troca.ctr_id;


--
-- Name: editoras; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.editoras (
    edi_id integer NOT NULL,
    edi_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    edi_nome character varying(200) NOT NULL,
    edi_nome_norm character varying(200) NOT NULL,
    edi_cnpj character varying(18),
    edi_ativo boolean DEFAULT true NOT NULL,
    edi_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    edi_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.editoras OWNER TO ecm_user;

--
-- Name: TABLE editoras; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.editoras IS 'Catálogo de editoras de livros.';


--
-- Name: COLUMN editoras.edi_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.editoras.edi_id IS 'Identificador interno da editora.';


--
-- Name: COLUMN editoras.edi_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.editoras.edi_uuid IS 'Identificador público UUID da editora.';


--
-- Name: COLUMN editoras.edi_nome; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.editoras.edi_nome IS 'Nome da editora.';


--
-- Name: COLUMN editoras.edi_nome_norm; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.editoras.edi_nome_norm IS 'Nome normalizado para busca (sem acentos, maiúsculas).';


--
-- Name: COLUMN editoras.edi_cnpj; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.editoras.edi_cnpj IS 'CNPJ da editora.';


--
-- Name: COLUMN editoras.edi_ativo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.editoras.edi_ativo IS 'Flag indicando se editora está ativa no catálogo.';


--
-- Name: editoras_edi_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.editoras_edi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.editoras_edi_id_seq OWNER TO ecm_user;

--
-- Name: editoras_edi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.editoras_edi_id_seq OWNED BY public.editoras.edi_id;


--
-- Name: enderecos; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.enderecos (
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
    cep_id integer,
    pai_id integer DEFAULT 1 NOT NULL,
    end_principal boolean DEFAULT false NOT NULL,
    end_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    end_atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_enderecos_tipo CHECK (((end_tipo)::text = ANY ((ARRAY['cobranca'::character varying, 'entrega'::character varying])::text[])))
);


ALTER TABLE public.enderecos OWNER TO ecm_user;

--
-- Name: TABLE enderecos; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.enderecos IS 'Endereços vinculados a um usuário. Um usuário pode ter N endereços, mas apenas um principal. Todos os componentes do endereço são normalizados em tabelas separadas.';


--
-- Name: COLUMN enderecos.end_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.enderecos.end_id IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';


--
-- Name: COLUMN enderecos.end_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.enderecos.end_uuid IS 'Identificador público (UUID v4). Retornado pelas rotas HTTP.';


--
-- Name: COLUMN enderecos.usu_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.enderecos.usu_id IS 'FK para usuarios — proprietário do endereço.';


--
-- Name: COLUMN enderecos.end_tipo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.enderecos.end_tipo IS 'Tipo do endereço: cobranca ou entrega. RN0021/RN0022. Padrão: entrega.';


--
-- Name: COLUMN enderecos.end_apelido; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.enderecos.end_apelido IS 'Apelido customizado do endereço (ex: Casa, Trabalho).';


--
-- Name: COLUMN enderecos.tre_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.enderecos.tre_id IS 'FK para tipos_residencias (Casa, Apartamento…). Opcional.';


--
-- Name: COLUMN enderecos.log_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.enderecos.log_id IS 'FK para logradouros — logradouro (tipo + nome).';


--
-- Name: COLUMN enderecos.end_numero; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.enderecos.end_numero IS 'Número do imóvel no logradouro.';


--
-- Name: COLUMN enderecos.end_complemento; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.enderecos.end_complemento IS 'Complemento opcional (ex.: apto 42, bloco B).';


--
-- Name: COLUMN enderecos.cid_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.enderecos.cid_id IS 'FK para cidades — cidade do endereço.';


--
-- Name: COLUMN enderecos.bai_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.enderecos.bai_id IS 'FK para bairros — bairro do endereço.';


--
-- Name: COLUMN enderecos.cep_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.enderecos.cep_id IS 'FK para ceps — CEP do endereço.';


--
-- Name: COLUMN enderecos.pai_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.enderecos.pai_id IS 'FK para paises — país do endereço (padrão: Brasil).';


--
-- Name: COLUMN enderecos.end_principal; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.enderecos.end_principal IS 'TRUE indica que este é o endereço de entrega padrão do usuário.';


--
-- Name: COLUMN enderecos.end_criado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.enderecos.end_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: COLUMN enderecos.end_atualizado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.enderecos.end_atualizado_em IS 'Timestamp da última atualização.';


--
-- Name: enderecos_end_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.enderecos_end_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enderecos_end_id_seq OWNER TO ecm_user;

--
-- Name: enderecos_end_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.enderecos_end_id_seq OWNED BY public.enderecos.end_id;


--
-- Name: entregas; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.entregas (
    ent_id integer NOT NULL,
    ent_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    ven_id integer NOT NULL,
    tfr_id integer NOT NULL,
    ent_endereco_json jsonb NOT NULL,
    ent_custo numeric(10,2) NOT NULL,
    ent_entregador character varying(100),
    ent_criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT entrega_ent_custo_check CHECK ((ent_custo >= (0)::numeric))
);


ALTER TABLE public.entregas OWNER TO ecm_user;

--
-- Name: entrega_ent_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.entrega_ent_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.entrega_ent_id_seq OWNER TO ecm_user;

--
-- Name: entrega_ent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.entrega_ent_id_seq OWNED BY public.entregas.ent_id;


--
-- Name: estados; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.estados (
    est_id integer NOT NULL,
    est_sigla character(2) NOT NULL,
    est_nome character varying(60) NOT NULL
);


ALTER TABLE public.estados OWNER TO ecm_user;

--
-- Name: TABLE estados; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.estados IS 'Estados e Distrito Federal do Brasil.';


--
-- Name: COLUMN estados.est_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.estados.est_id IS 'Identificador interno do estado.';


--
-- Name: COLUMN estados.est_sigla; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.estados.est_sigla IS 'Sigla de dois caracteres (ex.: SP, RJ, MG).';


--
-- Name: COLUMN estados.est_nome; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.estados.est_nome IS 'Nome completo do estado (ex.: São Paulo, Rio de Janeiro).';


--
-- Name: estados_est_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.estados_est_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.estados_est_id_seq OWNER TO ecm_user;

--
-- Name: estados_est_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.estados_est_id_seq OWNED BY public.estados.est_id;


--
-- Name: estoques; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.estoques (
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
    CONSTRAINT estoques_etq_preco_venda_check CHECK ((etq_preco_venda >= (0)::numeric)),
    CONSTRAINT estoques_etq_quantidade_disponivel_check CHECK ((etq_quantidade_disponivel >= 0)),
    CONSTRAINT estoques_etq_quantidade_reservada_check CHECK ((etq_quantidade_reservada >= 0)),
    CONSTRAINT estoques_etq_valor_custo_atual_check CHECK ((etq_valor_custo_atual >= (0)::numeric))
);


ALTER TABLE public.estoques OWNER TO ecm_user;

--
-- Name: TABLE estoques; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.estoques IS 'Controle de estoque e preços por livro (dados operacionais mutáveis).';


--
-- Name: COLUMN estoques.etq_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.estoques.etq_id IS 'Identificador interno do estoque.';


--
-- Name: COLUMN estoques.etq_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.estoques.etq_uuid IS 'Identificador público UUID do estoque.';


--
-- Name: COLUMN estoques.liv_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.estoques.liv_id IS 'FK única para livro (relacionamento 1:1).';


--
-- Name: COLUMN estoques.etq_quantidade_disponivel; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.estoques.etq_quantidade_disponivel IS 'Quantidade disponível para venda.';


--
-- Name: COLUMN estoques.etq_quantidade_reservada; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.estoques.etq_quantidade_reservada IS 'Quantidade reservada para pedidos em andamento.';


--
-- Name: COLUMN estoques.etq_preco_venda; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.estoques.etq_preco_venda IS 'Preço de venda atual (calculado via RN0013).';


--
-- Name: COLUMN estoques.etq_valor_custo_atual; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.estoques.etq_valor_custo_atual IS 'Custo unitário atual do livro.';


--
-- Name: COLUMN estoques.etq_ultimo_custo_calculado; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.estoques.etq_ultimo_custo_calculado IS 'Data do último cálculo de custo (média ponderada).';


--
-- Name: COLUMN estoques.etq_ativo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.estoques.etq_ativo IS 'Flag indicando se registro de estoque está ativo.';


--
-- Name: estoques_etq_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.estoques_etq_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.estoques_etq_id_seq OWNER TO ecm_user;

--
-- Name: estoques_etq_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.estoques_etq_id_seq OWNED BY public.estoques.etq_id;


--
-- Name: fornecedores; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.fornecedores (
    for_id integer NOT NULL,
    for_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    for_nome character varying(200) NOT NULL,
    for_nome_norm character varying(200) NOT NULL,
    for_cnpj character varying(18),
    for_email character varying(255),
    for_telefone character varying(20),
    for_ativo boolean DEFAULT true NOT NULL,
    for_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    for_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.fornecedores OWNER TO ecm_user;

--
-- Name: TABLE fornecedores; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.fornecedores IS 'Cadastro de fornecedores para entrada de estoque.';


--
-- Name: COLUMN fornecedores.for_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.fornecedores.for_id IS 'Identificador interno do fornecedor.';


--
-- Name: COLUMN fornecedores.for_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.fornecedores.for_uuid IS 'Identificador público UUID do fornecedor.';


--
-- Name: COLUMN fornecedores.for_nome; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.fornecedores.for_nome IS 'Nome do fornecedor.';


--
-- Name: COLUMN fornecedores.for_nome_norm; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.fornecedores.for_nome_norm IS 'Nome normalizado para busca.';


--
-- Name: COLUMN fornecedores.for_cnpj; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.fornecedores.for_cnpj IS 'CNPJ do fornecedor.';


--
-- Name: COLUMN fornecedores.for_email; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.fornecedores.for_email IS 'Email para contato.';


--
-- Name: COLUMN fornecedores.for_telefone; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.fornecedores.for_telefone IS 'Telefone para contato.';


--
-- Name: COLUMN fornecedores.for_ativo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.fornecedores.for_ativo IS 'Flag indicando se fornecedor está ativo.';


--
-- Name: fornecedores_for_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.fornecedores_for_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fornecedores_for_id_seq OWNER TO ecm_user;

--
-- Name: fornecedores_for_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.fornecedores_for_id_seq OWNED BY public.fornecedores.for_id;


--
-- Name: grupos_precificacao; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.grupos_precificacao (
    gpr_id integer NOT NULL,
    gpr_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    gpr_descricao character varying(100) NOT NULL,
    gpr_margem_lucro_percentual numeric(5,2) DEFAULT 0.00 NOT NULL,
    gpr_ativo boolean DEFAULT true NOT NULL,
    gpr_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT grupos_precificacao_gpr_margem_lucro_percentual_check CHECK ((gpr_margem_lucro_percentual >= (0)::numeric))
);


ALTER TABLE public.grupos_precificacao OWNER TO ecm_user;

--
-- Name: TABLE grupos_precificacao; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.grupos_precificacao IS 'Grupos de precificação para cálculo de preços de venda.';


--
-- Name: COLUMN grupos_precificacao.gpr_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.grupos_precificacao.gpr_id IS 'Identificador interno do grupo.';


--
-- Name: COLUMN grupos_precificacao.gpr_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.grupos_precificacao.gpr_uuid IS 'Identificador público UUID do grupo.';


--
-- Name: COLUMN grupos_precificacao.gpr_descricao; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.grupos_precificacao.gpr_descricao IS 'Descrição do grupo (ex.: Varejo, Atacado, Técnico).';


--
-- Name: COLUMN grupos_precificacao.gpr_margem_lucro_percentual; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.grupos_precificacao.gpr_margem_lucro_percentual IS 'Margem de lucro percentual padrão do grupo.';


--
-- Name: COLUMN grupos_precificacao.gpr_ativo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.grupos_precificacao.gpr_ativo IS 'Flag indicando se grupo está ativo.';


--
-- Name: grupos_precificacao_gpr_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.grupos_precificacao_gpr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grupos_precificacao_gpr_id_seq OWNER TO ecm_user;

--
-- Name: grupos_precificacao_gpr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.grupos_precificacao_gpr_id_seq OWNED BY public.grupos_precificacao.gpr_id;


--
-- Name: historico_entradas_estoque; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.historico_entradas_estoque (
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


ALTER TABLE public.historico_entradas_estoque OWNER TO ecm_user;

--
-- Name: TABLE historico_entradas_estoque; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.historico_entradas_estoque IS 'Histórico de entradas de estoque para cálculo de custo médio (RN0051).';


--
-- Name: COLUMN historico_entradas_estoque.hee_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.historico_entradas_estoque.hee_id IS 'Identificador interno do registro.';


--
-- Name: COLUMN historico_entradas_estoque.hee_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.historico_entradas_estoque.hee_uuid IS 'Identificador público UUID do registro.';


--
-- Name: COLUMN historico_entradas_estoque.liv_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.historico_entradas_estoque.liv_id IS 'FK para livro.';


--
-- Name: COLUMN historico_entradas_estoque.for_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.historico_entradas_estoque.for_id IS 'FK para fornecedor.';


--
-- Name: COLUMN historico_entradas_estoque.hee_quantidade; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.historico_entradas_estoque.hee_quantidade IS 'Quantidade recebida.';


--
-- Name: COLUMN historico_entradas_estoque.hee_valor_custo_unitario; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.historico_entradas_estoque.hee_valor_custo_unitario IS 'Custo unitário na entrada.';


--
-- Name: COLUMN historico_entradas_estoque.hee_valor_total; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.historico_entradas_estoque.hee_valor_total IS 'Valor total da entrada (quantidade * custo).';


--
-- Name: COLUMN historico_entradas_estoque.hee_data_entrada; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.historico_entradas_estoque.hee_data_entrada IS 'Data da entrada do estoque.';


--
-- Name: COLUMN historico_entradas_estoque.hee_numero_nota_fiscal; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.historico_entradas_estoque.hee_numero_nota_fiscal IS 'Número da nota fiscal.';


--
-- Name: COLUMN historico_entradas_estoque.hee_observacoes; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.historico_entradas_estoque.hee_observacoes IS 'Observações adicionais.';


--
-- Name: historico_entradas_estoque_hee_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.historico_entradas_estoque_hee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historico_entradas_estoque_hee_id_seq OWNER TO ecm_user;

--
-- Name: historico_entradas_estoque_hee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.historico_entradas_estoque_hee_id_seq OWNED BY public.historico_entradas_estoque.hee_id;


--
-- Name: intencao_pagamento; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.intencao_pagamento (
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
    CONSTRAINT intencao_pagamento_inp_estado_check CHECK (((inp_estado)::text = ANY ((ARRAY['CRIADA'::character varying, 'CONFIRMADA'::character varying, 'RECUSADA'::character varying, 'EXPIRADA'::character varying, 'CANCELADA'::character varying])::text[]))),
    CONSTRAINT intencao_pagamento_inp_tentativas_confirmacao_check CHECK ((inp_tentativas_confirmacao >= 0)),
    CONSTRAINT intencao_pagamento_inp_valor_check CHECK ((inp_valor > (0)::numeric))
);


ALTER TABLE public.intencao_pagamento OWNER TO ecm_user;

--
-- Name: TABLE intencao_pagamento; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.intencao_pagamento IS 'Intenção de pagamento/cobrança antes da confirmação no provedor (valor travado, TTL, estado).';


--
-- Name: COLUMN intencao_pagamento.inp_hash_segredo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.intencao_pagamento.inp_hash_segredo IS 'HMAC-SHA-256 (hex) do segredo de confirmação; nunca armazenar segredo em claro.';


--
-- Name: COLUMN intencao_pagamento.inp_expira_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.intencao_pagamento.inp_expira_em IS 'Após este instante a intenção não pode ser confirmada (validação obrigatória na API).';


--
-- Name: intencao_pagamento_inp_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.intencao_pagamento_inp_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.intencao_pagamento_inp_id_seq OWNER TO ecm_user;

--
-- Name: intencao_pagamento_inp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.intencao_pagamento_inp_id_seq OWNED BY public.intencao_pagamento.inp_id;


--
-- Name: intencao_pagamento_simulado; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.intencao_pagamento_simulado (
    inp_id bigint NOT NULL
);


ALTER TABLE public.intencao_pagamento_simulado OWNER TO ecm_user;

--
-- Name: TABLE intencao_pagamento_simulado; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.intencao_pagamento_simulado IS 'Metadados específicos do provedor de pagamento simulado.';


--
-- Name: intencao_pagamento_stripe; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.intencao_pagamento_stripe (
    inp_id bigint NOT NULL,
    stripe_payment_intent_id character varying(255),
    stripe_customer_id character varying(255)
);


ALTER TABLE public.intencao_pagamento_stripe OWNER TO ecm_user;

--
-- Name: TABLE intencao_pagamento_stripe; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.intencao_pagamento_stripe IS 'Referências Stripe; segredos efêmeros não persistidos em texto plano.';


--
-- Name: itens_venda; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.itens_venda (
    itv_id bigint NOT NULL,
    itv_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    ven_id bigint NOT NULL,
    liv_uuid uuid NOT NULL,
    itv_quantidade integer NOT NULL,
    itv_preco_unitario numeric(10,2) NOT NULL,
    itv_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    itv_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    liv_id bigint,
    itv_em_troca boolean DEFAULT false NOT NULL
);


ALTER TABLE public.itens_venda OWNER TO ecm_user;

--
-- Name: TABLE itens_venda; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.itens_venda IS 'Itens de cada venda (antiga ecm_item_venda).';


--
-- Name: COLUMN itens_venda.liv_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.itens_venda.liv_id IS 'FK para livro vendido (relacionamento direto com tabela livros).';


--
-- Name: COLUMN itens_venda.itv_em_troca; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.itens_venda.itv_em_troca IS 'Indica se este item específico da venda foi solicitado para troca.';


--
-- Name: itens_venda_itv_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.itens_venda_itv_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.itens_venda_itv_id_seq OWNER TO ecm_user;

--
-- Name: itens_venda_itv_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.itens_venda_itv_id_seq OWNED BY public.itens_venda.itv_id;


--
-- Name: livro_categorias; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.livro_categorias (
    lct_id integer NOT NULL,
    liv_id bigint NOT NULL,
    cat_id integer NOT NULL,
    lct_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.livro_categorias OWNER TO ecm_user;

--
-- Name: TABLE livro_categorias; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.livro_categorias IS 'Tabela associativa para relacionamento N:N entre livros e categorias.';


--
-- Name: COLUMN livro_categorias.lct_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livro_categorias.lct_id IS 'Identificador interno do relacionamento.';


--
-- Name: COLUMN livro_categorias.liv_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livro_categorias.liv_id IS 'FK para livro.';


--
-- Name: COLUMN livro_categorias.cat_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livro_categorias.cat_id IS 'FK para categoria.';


--
-- Name: livro_categorias_lct_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.livro_categorias_lct_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.livro_categorias_lct_id_seq OWNER TO ecm_user;

--
-- Name: livro_categorias_lct_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.livro_categorias_lct_id_seq OWNED BY public.livro_categorias.lct_id;


--
-- Name: livros; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.livros (
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


ALTER TABLE public.livros OWNER TO ecm_user;

--
-- Name: TABLE livros; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.livros IS 'Catálogo central de livros (dados imutáveis do produto).';


--
-- Name: COLUMN livros.liv_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.liv_id IS 'Identificador interno do livro.';


--
-- Name: COLUMN livros.liv_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.liv_uuid IS 'Identificador público UUID do livro.';


--
-- Name: COLUMN livros.liv_titulo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.liv_titulo IS 'Título completo do livro.';


--
-- Name: COLUMN livros.liv_titulo_norm; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.liv_titulo_norm IS 'Título normalizado para busca (sem acentos, maiúsculas).';


--
-- Name: COLUMN livros.liv_ano; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.liv_ano IS 'Ano de publicação.';


--
-- Name: COLUMN livros.liv_edicao; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.liv_edicao IS 'Número/ano da edição (ex.: "3ª edição").';


--
-- Name: COLUMN livros.liv_isbn; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.liv_isbn IS 'ISBN do livro (único).';


--
-- Name: COLUMN livros.liv_numero_paginas; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.liv_numero_paginas IS 'Número total de páginas.';


--
-- Name: COLUMN livros.liv_sinopse; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.liv_sinopse IS 'Sinopse/descrição do livro.';


--
-- Name: COLUMN livros.liv_altura; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.liv_altura IS 'Altura do livro em cm.';


--
-- Name: COLUMN livros.liv_largura; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.liv_largura IS 'Largura do livro em cm.';


--
-- Name: COLUMN livros.liv_peso; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.liv_peso IS 'Peso do livro em kg.';


--
-- Name: COLUMN livros.liv_profundidade; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.liv_profundidade IS 'Profundidade do livro em cm.';


--
-- Name: COLUMN livros.liv_codigo_barras; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.liv_codigo_barras IS 'Código de barras EAN/UPC.';


--
-- Name: COLUMN livros.aut_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.aut_id IS 'FK para autor principal.';


--
-- Name: COLUMN livros.edi_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.edi_id IS 'FK para editora.';


--
-- Name: COLUMN livros.gpr_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.gpr_id IS 'FK para grupo de precificação.';


--
-- Name: COLUMN livros.liv_ativo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.liv_ativo IS 'Flag indicando se livro está ativo no catálogo.';


--
-- Name: COLUMN livros.liv_imagem_url; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.livros.liv_imagem_url IS 'URL da imagem de capa do livro.';


--
-- Name: livros_liv_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.livros_liv_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.livros_liv_id_seq OWNER TO ecm_user;

--
-- Name: livros_liv_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.livros_liv_id_seq OWNED BY public.livros.liv_id;


--
-- Name: logradouros; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.logradouros (
    log_id integer NOT NULL,
    tlo_id integer,
    log_nome character varying(200) NOT NULL,
    log_criado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.logradouros OWNER TO ecm_user;

--
-- Name: TABLE logradouros; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.logradouros IS 'Logradouros normalizados (tipo + nome). Permite reusar endereços de rua idênticos.';


--
-- Name: COLUMN logradouros.log_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.logradouros.log_id IS 'Identificador interno do logradouro.';


--
-- Name: COLUMN logradouros.tlo_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.logradouros.tlo_id IS 'FK para tipos_logradouros (Rua, Avenida…).';


--
-- Name: COLUMN logradouros.log_nome; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.logradouros.log_nome IS 'Nome do logradouro sem o tipo.';


--
-- Name: logradouros_log_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.logradouros_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logradouros_log_id_seq OWNER TO ecm_user;

--
-- Name: logradouros_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.logradouros_log_id_seq OWNED BY public.logradouros.log_id;


--
-- Name: pagamento; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.pagamento (
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
    CONSTRAINT pagamento_pag_valor_check CHECK ((pag_valor > (0)::numeric))
);


ALTER TABLE public.pagamento OWNER TO ecm_user;

--
-- Name: TABLE pagamento; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.pagamento IS 'Registros de pagamentos realizados para vendas.';


--
-- Name: COLUMN pagamento.pag_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.pagamento.pag_id IS 'Chave primária interna.';


--
-- Name: COLUMN pagamento.pag_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.pagamento.pag_uuid IS 'Identificador público UUID.';


--
-- Name: COLUMN pagamento.ven_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.pagamento.ven_id IS 'FK para ecm_venda — venda associada ao pagamento.';


--
-- Name: COLUMN pagamento.tpg_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.pagamento.tpg_id IS 'FK para tipo_pagamento — tipo de pagamento utilizado.';


--
-- Name: COLUMN pagamento.stp_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.pagamento.stp_id IS 'FK para status_pagamento — status atual do pagamento.';


--
-- Name: COLUMN pagamento.pag_valor; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.pagamento.pag_valor IS 'Valor total do pagamento.';


--
-- Name: COLUMN pagamento.pag_detalhes_cupom; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.pagamento.pag_detalhes_cupom IS 'Código ou detalhes do cupom (quando aplicável).';


--
-- Name: COLUMN pagamento.pag_processado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.pagamento.pag_processado_em IS 'Timestamp de processamento do pagamento.';


--
-- Name: COLUMN pagamento.pag_criado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.pagamento.pag_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: COLUMN pagamento.pag_atualizado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.pagamento.pag_atualizado_em IS 'Timestamp da última atualização.';


--
-- Name: COLUMN pagamento.inp_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.pagamento.inp_id IS 'FK opcional para intencao_pagamento (checkout com intenção prévia).';


--
-- Name: pagamento_pag_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.pagamento_pag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pagamento_pag_id_seq OWNER TO ecm_user;

--
-- Name: pagamento_pag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.pagamento_pag_id_seq OWNED BY public.pagamento.pag_id;


--
-- Name: pagamento_pix_simulado; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.pagamento_pix_simulado (
    ppx_id bigint NOT NULL,
    pag_id bigint NOT NULL,
    ppx_copia_cola text NOT NULL,
    ppx_qr_base64 text,
    ppx_expira_em timestamp with time zone NOT NULL,
    ppx_segredo_confirmacao character varying(128) NOT NULL
);


ALTER TABLE public.pagamento_pix_simulado OWNER TO ecm_user;

--
-- Name: TABLE pagamento_pix_simulado; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.pagamento_pix_simulado IS 'Cobrança PIX simulada (copia-e-cola, QR, expiração, segredo para webhook).';


--
-- Name: COLUMN pagamento_pix_simulado.ppx_segredo_confirmacao; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.pagamento_pix_simulado.ppx_segredo_confirmacao IS 'Segredo enviado ao webhook para confirmar liquidação (simula assinatura do PSP).';


--
-- Name: pagamento_pix_simulado_ppx_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.pagamento_pix_simulado_ppx_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pagamento_pix_simulado_ppx_id_seq OWNER TO ecm_user;

--
-- Name: pagamento_pix_simulado_ppx_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.pagamento_pix_simulado_ppx_id_seq OWNED BY public.pagamento_pix_simulado.ppx_id;


--
-- Name: paises; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.paises (
    pai_id integer NOT NULL,
    pai_nome character varying(80) NOT NULL,
    pai_criado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.paises OWNER TO ecm_user;

--
-- Name: TABLE paises; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.paises IS 'Países suportados pelo sistema. Inicialmente apenas Brasil.';


--
-- Name: COLUMN paises.pai_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.paises.pai_id IS 'Identificador interno do país.';


--
-- Name: COLUMN paises.pai_nome; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.paises.pai_nome IS 'Nome completo do país (ex.: Brasil, Estados Unidos).';


--
-- Name: paises_pai_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.paises_pai_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.paises_pai_id_seq OWNER TO ecm_user;

--
-- Name: paises_pai_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.paises_pai_id_seq OWNED BY public.paises.pai_id;


--
-- Name: papeis; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.papeis (
    pap_id integer NOT NULL,
    pap_descricao character varying(30) NOT NULL,
    pap_criado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.papeis OWNER TO ecm_user;

--
-- Name: TABLE papeis; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.papeis IS 'Papéis de acesso dos usuários do sistema.';


--
-- Name: COLUMN papeis.pap_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.papeis.pap_id IS 'Identificador interno do papel (nunca exposto nas rotas).';


--
-- Name: COLUMN papeis.pap_descricao; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.papeis.pap_descricao IS 'Nome canônico do papel (ex.: cliente, admin).';


--
-- Name: papeis_pap_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.papeis_pap_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.papeis_pap_id_seq OWNER TO ecm_user;

--
-- Name: papeis_pap_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.papeis_pap_id_seq OWNED BY public.papeis.pap_id;


--
-- Name: status_pagamento; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.status_pagamento (
    stp_id integer NOT NULL,
    stp_descricao character varying(50) NOT NULL,
    stp_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.status_pagamento OWNER TO ecm_user;

--
-- Name: TABLE status_pagamento; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.status_pagamento IS 'Status de pagamento das vendas (PENDENTE, APROVADO, RECUSADO, CANCELADO).';


--
-- Name: COLUMN status_pagamento.stp_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.status_pagamento.stp_id IS 'Identificador interno do status.';


--
-- Name: COLUMN status_pagamento.stp_descricao; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.status_pagamento.stp_descricao IS 'Descrição do status (ex.: PENDENTE, APROVADO).';


--
-- Name: COLUMN status_pagamento.stp_criado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.status_pagamento.stp_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: status_pagamento_stp_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.status_pagamento_stp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.status_pagamento_stp_id_seq OWNER TO ecm_user;

--
-- Name: status_pagamento_stp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.status_pagamento_stp_id_seq OWNED BY public.status_pagamento.stp_id;


--
-- Name: status_vendas; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.status_vendas (
    stv_id integer NOT NULL,
    stv_descricao character varying(50) NOT NULL,
    stv_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.status_vendas OWNER TO ecm_user;

--
-- Name: status_venda_stv_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.status_venda_stv_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.status_venda_stv_id_seq OWNER TO ecm_user;

--
-- Name: status_venda_stv_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.status_venda_stv_id_seq OWNED BY public.status_vendas.stv_id;


--
-- Name: telefones; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.telefones (
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


ALTER TABLE public.telefones OWNER TO ecm_user;

--
-- Name: TABLE telefones; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.telefones IS 'Objetos de valor de telefone vinculados a um usuário. Um usuário pode ter N telefones, mas apenas um principal.';


--
-- Name: COLUMN telefones.tel_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.telefones.tel_id IS 'Chave primária interna. Nunca exposta nas rotas HTTP.';


--
-- Name: COLUMN telefones.tel_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.telefones.tel_uuid IS 'Identificador público (UUID v4). Retornado nas rotas HTTP.';


--
-- Name: COLUMN telefones.usu_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.telefones.usu_id IS 'FK para usuarios — dono do telefone.';


--
-- Name: COLUMN telefones.ttp_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.telefones.ttp_id IS 'FK para tipos_telefones (celular, residencial, comercial…).';


--
-- Name: COLUMN telefones.tel_ddd; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.telefones.tel_ddd IS 'Código DDD de 2 dígitos (somente números).';


--
-- Name: COLUMN telefones.tel_numero; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.telefones.tel_numero IS 'Número local com 8 ou 9 dígitos (somente números, sem formatação).';


--
-- Name: COLUMN telefones.tel_principal; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.telefones.tel_principal IS 'TRUE indica que este é o telefone de contato principal do usuário.';


--
-- Name: COLUMN telefones.tel_criado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.telefones.tel_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: COLUMN telefones.tel_atualizado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.telefones.tel_atualizado_em IS 'Timestamp da última atualização.';


--
-- Name: telefones_tel_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.telefones_tel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.telefones_tel_id_seq OWNER TO ecm_user;

--
-- Name: telefones_tel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.telefones_tel_id_seq OWNED BY public.telefones.tel_id;


--
-- Name: tipos_frete; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.tipos_frete (
    tfr_id integer NOT NULL,
    tfr_descricao character varying(100) NOT NULL,
    tfr_criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tipos_frete OWNER TO ecm_user;

--
-- Name: tipo_frete_tfr_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.tipo_frete_tfr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipo_frete_tfr_id_seq OWNER TO ecm_user;

--
-- Name: tipo_frete_tfr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.tipo_frete_tfr_id_seq OWNED BY public.tipos_frete.tfr_id;


--
-- Name: tipo_pagamento; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.tipo_pagamento (
    tpg_id integer NOT NULL,
    tpg_descricao character varying(50) NOT NULL,
    tpg_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tipo_pagamento OWNER TO ecm_user;

--
-- Name: TABLE tipo_pagamento; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.tipo_pagamento IS 'Tipos de pagamento aceitos (cartao_credito, cupom_troca, cupom_promocional, pix).';


--
-- Name: COLUMN tipo_pagamento.tpg_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.tipo_pagamento.tpg_id IS 'Identificador interno do tipo de pagamento.';


--
-- Name: COLUMN tipo_pagamento.tpg_descricao; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.tipo_pagamento.tpg_descricao IS 'Descrição do tipo (ex.: cartao_credito, cupom_promocional).';


--
-- Name: COLUMN tipo_pagamento.tpg_criado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.tipo_pagamento.tpg_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: tipo_pagamento_tpg_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.tipo_pagamento_tpg_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipo_pagamento_tpg_id_seq OWNER TO ecm_user;

--
-- Name: tipo_pagamento_tpg_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.tipo_pagamento_tpg_id_seq OWNED BY public.tipo_pagamento.tpg_id;


--
-- Name: tipos_logradouros; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.tipos_logradouros (
    tlo_id integer NOT NULL,
    tlo_descricao character varying(50) NOT NULL
);


ALTER TABLE public.tipos_logradouros OWNER TO ecm_user;

--
-- Name: TABLE tipos_logradouros; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.tipos_logradouros IS 'Tipos de logradouro (Rua, Avenida, Alameda, Travessa…).';


--
-- Name: COLUMN tipos_logradouros.tlo_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.tipos_logradouros.tlo_id IS 'Identificador interno do tipo de logradouro.';


--
-- Name: COLUMN tipos_logradouros.tlo_descricao; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.tipos_logradouros.tlo_descricao IS 'Descrição do tipo (ex.: Rua, Avenida, Alameda).';


--
-- Name: tipos_logradouros_tlo_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.tipos_logradouros_tlo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipos_logradouros_tlo_id_seq OWNER TO ecm_user;

--
-- Name: tipos_logradouros_tlo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.tipos_logradouros_tlo_id_seq OWNED BY public.tipos_logradouros.tlo_id;


--
-- Name: tipos_residencias; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.tipos_residencias (
    tre_id integer NOT NULL,
    tre_descricao character varying(50) NOT NULL
);


ALTER TABLE public.tipos_residencias OWNER TO ecm_user;

--
-- Name: TABLE tipos_residencias; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.tipos_residencias IS 'Tipos de residência vinculados a endereços dos clientes.';


--
-- Name: COLUMN tipos_residencias.tre_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.tipos_residencias.tre_id IS 'Identificador interno do tipo de residência.';


--
-- Name: COLUMN tipos_residencias.tre_descricao; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.tipos_residencias.tre_descricao IS 'Descrição do tipo (ex.: Casa, Apartamento, Condomínio).';


--
-- Name: tipos_residencias_tre_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.tipos_residencias_tre_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipos_residencias_tre_id_seq OWNER TO ecm_user;

--
-- Name: tipos_residencias_tre_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.tipos_residencias_tre_id_seq OWNED BY public.tipos_residencias.tre_id;


--
-- Name: tipos_telefones; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.tipos_telefones (
    ttp_id integer NOT NULL,
    ttp_descricao character varying(30) NOT NULL
);


ALTER TABLE public.tipos_telefones OWNER TO ecm_user;

--
-- Name: TABLE tipos_telefones; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.tipos_telefones IS 'Tipos de telefone aceitos pelo sistema (celular, residencial, comercial…).';


--
-- Name: COLUMN tipos_telefones.ttp_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.tipos_telefones.ttp_id IS 'Identificador interno do tipo de telefone.';


--
-- Name: COLUMN tipos_telefones.ttp_descricao; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.tipos_telefones.ttp_descricao IS 'Descrição do tipo (ex.: celular, residencial, comercial).';


--
-- Name: tipos_telefones_ttp_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.tipos_telefones_ttp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipos_telefones_ttp_id_seq OWNER TO ecm_user;

--
-- Name: tipos_telefones_ttp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.tipos_telefones_ttp_id_seq OWNED BY public.tipos_telefones.ttp_id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.usuarios (
    usu_id bigint NOT NULL,
    usu_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usu_nome character varying(80) NOT NULL,
    usu_email character varying(255) NOT NULL,
    usu_cpf character(14) NOT NULL,
    usu_senha_hash character varying(100) NOT NULL,
    pap_id integer NOT NULL,
    usu_telefone_rapido character varying(15),
    usu_genero character varying(20),
    usu_data_nascimento date,
    usu_ativo boolean DEFAULT true NOT NULL,
    usu_is_admin_mestre boolean DEFAULT false NOT NULL,
    usu_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    usu_atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.usuarios OWNER TO ecm_user;

--
-- Name: TABLE usuarios; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.usuarios IS 'Entidade central de identidade: todo ator autenticado (cliente ou admin) possui exatamente um registro aqui.';


--
-- Name: COLUMN usuarios.usu_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.usuarios.usu_id IS 'Chave primária interna (BIGSERIAL). Usada apenas em JOINs internos; nunca exposta nas rotas HTTP.';


--
-- Name: COLUMN usuarios.usu_uuid; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.usuarios.usu_uuid IS 'Identificador público (UUID v4). Único campo de identidade retornado pelas rotas HTTP.';


--
-- Name: COLUMN usuarios.usu_nome; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.usuarios.usu_nome IS 'Nome completo do usuário.';


--
-- Name: COLUMN usuarios.usu_email; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.usuarios.usu_email IS 'Endereço de e-mail único utilizado como login.';


--
-- Name: COLUMN usuarios.usu_cpf; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.usuarios.usu_cpf IS 'CPF no formato XXX.XXX.XXX-XX. Único por usuário.';


--
-- Name: COLUMN usuarios.usu_senha_hash; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.usuarios.usu_senha_hash IS 'Hash bcrypt da senha. Nunca retornado pela API.';


--
-- Name: COLUMN usuarios.pap_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.usuarios.pap_id IS 'FK para papeis — define se o usuário é cliente ou admin.';


--
-- Name: COLUMN usuarios.usu_ativo; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.usuarios.usu_ativo IS 'FALSE indica inativação (soft delete). RF0023.';


--
-- Name: COLUMN usuarios.usu_criado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.usuarios.usu_criado_em IS 'Timestamp de criação do registro.';


--
-- Name: COLUMN usuarios.usu_atualizado_em; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.usuarios.usu_atualizado_em IS 'Timestamp da última atualização (atualizado via trigger ou aplicação).';


--
-- Name: usuarios_usu_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.usuarios_usu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_usu_id_seq OWNER TO ecm_user;

--
-- Name: usuarios_usu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.usuarios_usu_id_seq OWNED BY public.usuarios.usu_id;


--
-- Name: vendas; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.vendas (
    ven_id bigint NOT NULL,
    ven_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usu_id bigint NOT NULL,
    stv_id integer NOT NULL,
    ven_total_itens numeric(10,2) NOT NULL,
    ven_frete numeric(10,2) NOT NULL,
    ven_total_venda numeric(10,2) NOT NULL,
    ven_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ven_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    cfr_id bigint,
    ven_motivo_troca text,
    ven_data_hora_entrega timestamp with time zone
);


ALTER TABLE public.vendas OWNER TO ecm_user;

--
-- Name: TABLE vendas; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON TABLE public.vendas IS 'Vendas realizadas pelos usuários (antiga ecm_venda).';


--
-- Name: COLUMN vendas.cfr_id; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.vendas.cfr_id IS 'Cotação de frete escolhida no checkout (opcional durante migração legado).';


--
-- Name: COLUMN vendas.ven_motivo_troca; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.vendas.ven_motivo_troca IS 'Motivo informado pelo cliente ao solicitar troca ou devolução.';


--
-- Name: COLUMN vendas.ven_data_hora_entrega; Type: COMMENT; Schema: public; Owner: ecm_user
--

COMMENT ON COLUMN public.vendas.ven_data_hora_entrega IS 'Data e hora em que a entrega foi confirmada. Usada para calcular o prazo de 7 dias para solicitação de troca (RN0043).';


--
-- Name: vendas_ven_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.vendas_ven_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendas_ven_id_seq OWNER TO ecm_user;

--
-- Name: vendas_ven_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.vendas_ven_id_seq OWNED BY public.vendas.ven_id;


--
-- Name: autores aut_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.autores ALTER COLUMN aut_id SET DEFAULT nextval('les.autores_aut_id_seq'::regclass);


--
-- Name: avaliacoes_livro avl_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.avaliacoes_livro ALTER COLUMN avl_id SET DEFAULT nextval('les.avaliacoes_livro_avl_id_seq'::regclass);


--
-- Name: bairros bai_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.bairros ALTER COLUMN bai_id SET DEFAULT nextval('les.bairros_bai_id_seq'::regclass);


--
-- Name: bandeiras_cartao ban_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.bandeiras_cartao ALTER COLUMN ban_id SET DEFAULT nextval('les.bandeiras_cartao_ban_id_seq'::regclass);


--
-- Name: carrinho_itens cri_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.carrinho_itens ALTER COLUMN cri_id SET DEFAULT nextval('les.carrinho_itens_cri_id_seq'::regclass);


--
-- Name: cartao_pagamento cpp_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cartao_pagamento ALTER COLUMN cpp_id SET DEFAULT nextval('les.cartao_pagamento_cpp_id_seq'::regclass);


--
-- Name: cartoes crt_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cartoes ALTER COLUMN crt_id SET DEFAULT nextval('les.cartoes_crt_id_seq'::regclass);


--
-- Name: categorias cat_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.categorias ALTER COLUMN cat_id SET DEFAULT nextval('les.categorias_cat_id_seq'::regclass);


--
-- Name: ceps cep_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.ceps ALTER COLUMN cep_id SET DEFAULT nextval('les.ceps_cep_id_seq'::regclass);


--
-- Name: cidades cid_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cidades ALTER COLUMN cid_id SET DEFAULT nextval('les.cidades_cid_id_seq'::regclass);


--
-- Name: clientes cli_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.clientes ALTER COLUMN cli_id SET DEFAULT nextval('les.clientes_cli_id_seq'::regclass);


--
-- Name: configuracoes_app cfg_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.configuracoes_app ALTER COLUMN cfg_id SET DEFAULT nextval('les.configuracoes_app_cfg_id_seq'::regclass);


--
-- Name: cotacao_frete cfr_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cotacao_frete ALTER COLUMN cfr_id SET DEFAULT nextval('les.cotacao_frete_cfr_id_seq'::regclass);


--
-- Name: editoras edi_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.editoras ALTER COLUMN edi_id SET DEFAULT nextval('les.editoras_edi_id_seq'::regclass);


--
-- Name: enderecos end_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.enderecos ALTER COLUMN end_id SET DEFAULT nextval('les.enderecos_end_id_seq'::regclass);


--
-- Name: entregas ent_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.entregas ALTER COLUMN ent_id SET DEFAULT nextval('les.entrega_ent_id_seq'::regclass);


--
-- Name: estados est_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.estados ALTER COLUMN est_id SET DEFAULT nextval('les.estados_est_id_seq'::regclass);


--
-- Name: estoques etq_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.estoques ALTER COLUMN etq_id SET DEFAULT nextval('les.estoques_etq_id_seq'::regclass);


--
-- Name: fornecedores for_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.fornecedores ALTER COLUMN for_id SET DEFAULT nextval('les.fornecedores_for_id_seq'::regclass);


--
-- Name: grupos_precificacao gpr_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.grupos_precificacao ALTER COLUMN gpr_id SET DEFAULT nextval('les.grupos_precificacao_gpr_id_seq'::regclass);


--
-- Name: historico_entradas_estoque hee_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.historico_entradas_estoque ALTER COLUMN hee_id SET DEFAULT nextval('les.historico_entradas_estoque_hee_id_seq'::regclass);


--
-- Name: intencao_pagamento inp_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.intencao_pagamento ALTER COLUMN inp_id SET DEFAULT nextval('les.intencao_pagamento_inp_id_seq'::regclass);


--
-- Name: itens_venda itv_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.itens_venda ALTER COLUMN itv_id SET DEFAULT nextval('les.itens_venda_itv_id_seq'::regclass);


--
-- Name: livro_categorias lct_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.livro_categorias ALTER COLUMN lct_id SET DEFAULT nextval('les.livro_categorias_lct_id_seq'::regclass);


--
-- Name: livros liv_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.livros ALTER COLUMN liv_id SET DEFAULT nextval('les.livros_liv_id_seq'::regclass);


--
-- Name: logradouros log_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.logradouros ALTER COLUMN log_id SET DEFAULT nextval('les.logradouros_log_id_seq'::regclass);


--
-- Name: pagamento pag_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.pagamento ALTER COLUMN pag_id SET DEFAULT nextval('les.pagamento_pag_id_seq'::regclass);


--
-- Name: pagamento_pix_simulado ppx_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.pagamento_pix_simulado ALTER COLUMN ppx_id SET DEFAULT nextval('les.pagamento_pix_simulado_ppx_id_seq'::regclass);


--
-- Name: paises pai_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.paises ALTER COLUMN pai_id SET DEFAULT nextval('les.paises_pai_id_seq'::regclass);


--
-- Name: papeis pap_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.papeis ALTER COLUMN pap_id SET DEFAULT nextval('les.papeis_pap_id_seq'::regclass);


--
-- Name: status_pagamento stp_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.status_pagamento ALTER COLUMN stp_id SET DEFAULT nextval('les.status_pagamento_stp_id_seq'::regclass);


--
-- Name: status_vendas stv_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.status_vendas ALTER COLUMN stv_id SET DEFAULT nextval('les.status_venda_stv_id_seq'::regclass);


--
-- Name: telefones tel_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.telefones ALTER COLUMN tel_id SET DEFAULT nextval('les.telefones_tel_id_seq'::regclass);


--
-- Name: tipo_pagamento tpg_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.tipo_pagamento ALTER COLUMN tpg_id SET DEFAULT nextval('les.tipo_pagamento_tpg_id_seq'::regclass);


--
-- Name: tipos_frete tfr_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.tipos_frete ALTER COLUMN tfr_id SET DEFAULT nextval('les.tipo_frete_tfr_id_seq'::regclass);


--
-- Name: tipos_logradouros tlo_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.tipos_logradouros ALTER COLUMN tlo_id SET DEFAULT nextval('les.tipos_logradouros_tlo_id_seq'::regclass);


--
-- Name: tipos_residencias tre_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.tipos_residencias ALTER COLUMN tre_id SET DEFAULT nextval('les.tipos_residencias_tre_id_seq'::regclass);


--
-- Name: tipos_telefones ttp_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.tipos_telefones ALTER COLUMN ttp_id SET DEFAULT nextval('les.tipos_telefones_ttp_id_seq'::regclass);


--
-- Name: usuarios usu_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.usuarios ALTER COLUMN usu_id SET DEFAULT nextval('les.usuarios_usu_id_seq'::regclass);


--
-- Name: vendas ven_id; Type: DEFAULT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.vendas ALTER COLUMN ven_id SET DEFAULT nextval('les.vendas_ven_id_seq'::regclass);


--
-- Name: autores aut_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.autores ALTER COLUMN aut_id SET DEFAULT nextval('public.autores_aut_id_seq'::regclass);


--
-- Name: avaliacoes_livro avl_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.avaliacoes_livro ALTER COLUMN avl_id SET DEFAULT nextval('public.avaliacoes_livro_avl_id_seq'::regclass);


--
-- Name: bairros bai_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.bairros ALTER COLUMN bai_id SET DEFAULT nextval('public.bairros_bai_id_seq'::regclass);


--
-- Name: bandeiras_cartao ban_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.bandeiras_cartao ALTER COLUMN ban_id SET DEFAULT nextval('public.bandeiras_cartao_ban_id_seq'::regclass);


--
-- Name: carrinho_itens cri_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.carrinho_itens ALTER COLUMN cri_id SET DEFAULT nextval('public.carrinho_itens_cri_id_seq'::regclass);


--
-- Name: cartao_pagamento cpp_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cartao_pagamento ALTER COLUMN cpp_id SET DEFAULT nextval('public.cartao_pagamento_cpp_id_seq'::regclass);


--
-- Name: cartoes crt_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cartoes ALTER COLUMN crt_id SET DEFAULT nextval('public.cartoes_crt_id_seq'::regclass);


--
-- Name: categorias cat_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.categorias ALTER COLUMN cat_id SET DEFAULT nextval('public.categorias_cat_id_seq'::regclass);


--
-- Name: ceps cep_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ceps ALTER COLUMN cep_id SET DEFAULT nextval('public.ceps_cep_id_seq'::regclass);


--
-- Name: cidades cid_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cidades ALTER COLUMN cid_id SET DEFAULT nextval('public.cidades_cid_id_seq'::regclass);


--
-- Name: clientes cli_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.clientes ALTER COLUMN cli_id SET DEFAULT nextval('public.clientes_cli_id_seq'::regclass);


--
-- Name: configuracoes_app cfg_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.configuracoes_app ALTER COLUMN cfg_id SET DEFAULT nextval('public.configuracoes_app_cfg_id_seq'::regclass);


--
-- Name: cotacao_frete cfr_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cotacao_frete ALTER COLUMN cfr_id SET DEFAULT nextval('public.cotacao_frete_cfr_id_seq'::regclass);


--
-- Name: cupom cup_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cupom ALTER COLUMN cup_id SET DEFAULT nextval('public.cupom_cup_id_seq'::regclass);


--
-- Name: cupons_troca ctr_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cupons_troca ALTER COLUMN ctr_id SET DEFAULT nextval('public.cupons_troca_ctr_id_seq'::regclass);


--
-- Name: editoras edi_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.editoras ALTER COLUMN edi_id SET DEFAULT nextval('public.editoras_edi_id_seq'::regclass);


--
-- Name: enderecos end_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.enderecos ALTER COLUMN end_id SET DEFAULT nextval('public.enderecos_end_id_seq'::regclass);


--
-- Name: entregas ent_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.entregas ALTER COLUMN ent_id SET DEFAULT nextval('public.entrega_ent_id_seq'::regclass);


--
-- Name: estados est_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.estados ALTER COLUMN est_id SET DEFAULT nextval('public.estados_est_id_seq'::regclass);


--
-- Name: estoques etq_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.estoques ALTER COLUMN etq_id SET DEFAULT nextval('public.estoques_etq_id_seq'::regclass);


--
-- Name: fornecedores for_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.fornecedores ALTER COLUMN for_id SET DEFAULT nextval('public.fornecedores_for_id_seq'::regclass);


--
-- Name: grupos_precificacao gpr_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.grupos_precificacao ALTER COLUMN gpr_id SET DEFAULT nextval('public.grupos_precificacao_gpr_id_seq'::regclass);


--
-- Name: historico_entradas_estoque hee_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.historico_entradas_estoque ALTER COLUMN hee_id SET DEFAULT nextval('public.historico_entradas_estoque_hee_id_seq'::regclass);


--
-- Name: intencao_pagamento inp_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.intencao_pagamento ALTER COLUMN inp_id SET DEFAULT nextval('public.intencao_pagamento_inp_id_seq'::regclass);


--
-- Name: itens_venda itv_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.itens_venda ALTER COLUMN itv_id SET DEFAULT nextval('public.itens_venda_itv_id_seq'::regclass);


--
-- Name: livro_categorias lct_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.livro_categorias ALTER COLUMN lct_id SET DEFAULT nextval('public.livro_categorias_lct_id_seq'::regclass);


--
-- Name: livros liv_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.livros ALTER COLUMN liv_id SET DEFAULT nextval('public.livros_liv_id_seq'::regclass);


--
-- Name: logradouros log_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.logradouros ALTER COLUMN log_id SET DEFAULT nextval('public.logradouros_log_id_seq'::regclass);


--
-- Name: pagamento pag_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.pagamento ALTER COLUMN pag_id SET DEFAULT nextval('public.pagamento_pag_id_seq'::regclass);


--
-- Name: pagamento_pix_simulado ppx_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.pagamento_pix_simulado ALTER COLUMN ppx_id SET DEFAULT nextval('public.pagamento_pix_simulado_ppx_id_seq'::regclass);


--
-- Name: paises pai_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.paises ALTER COLUMN pai_id SET DEFAULT nextval('public.paises_pai_id_seq'::regclass);


--
-- Name: papeis pap_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.papeis ALTER COLUMN pap_id SET DEFAULT nextval('public.papeis_pap_id_seq'::regclass);


--
-- Name: status_pagamento stp_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.status_pagamento ALTER COLUMN stp_id SET DEFAULT nextval('public.status_pagamento_stp_id_seq'::regclass);


--
-- Name: status_vendas stv_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.status_vendas ALTER COLUMN stv_id SET DEFAULT nextval('public.status_venda_stv_id_seq'::regclass);


--
-- Name: telefones tel_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.telefones ALTER COLUMN tel_id SET DEFAULT nextval('public.telefones_tel_id_seq'::regclass);


--
-- Name: tipo_pagamento tpg_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.tipo_pagamento ALTER COLUMN tpg_id SET DEFAULT nextval('public.tipo_pagamento_tpg_id_seq'::regclass);


--
-- Name: tipos_frete tfr_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.tipos_frete ALTER COLUMN tfr_id SET DEFAULT nextval('public.tipo_frete_tfr_id_seq'::regclass);


--
-- Name: tipos_logradouros tlo_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.tipos_logradouros ALTER COLUMN tlo_id SET DEFAULT nextval('public.tipos_logradouros_tlo_id_seq'::regclass);


--
-- Name: tipos_residencias tre_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.tipos_residencias ALTER COLUMN tre_id SET DEFAULT nextval('public.tipos_residencias_tre_id_seq'::regclass);


--
-- Name: tipos_telefones ttp_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.tipos_telefones ALTER COLUMN ttp_id SET DEFAULT nextval('public.tipos_telefones_ttp_id_seq'::regclass);


--
-- Name: usuarios usu_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN usu_id SET DEFAULT nextval('public.usuarios_usu_id_seq'::regclass);


--
-- Name: vendas ven_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.vendas ALTER COLUMN ven_id SET DEFAULT nextval('public.vendas_ven_id_seq'::regclass);


--
-- Name: autores autores_aut_uuid_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.autores
    ADD CONSTRAINT autores_aut_uuid_key UNIQUE (aut_uuid);


--
-- Name: autores autores_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.autores
    ADD CONSTRAINT autores_pkey PRIMARY KEY (aut_id);


--
-- Name: avaliacoes_livro avaliacoes_livro_avl_uuid_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.avaliacoes_livro
    ADD CONSTRAINT avaliacoes_livro_avl_uuid_key UNIQUE (avl_uuid);


--
-- Name: avaliacoes_livro avaliacoes_livro_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.avaliacoes_livro
    ADD CONSTRAINT avaliacoes_livro_pkey PRIMARY KEY (avl_id);


--
-- Name: bairros bairros_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.bairros
    ADD CONSTRAINT bairros_pkey PRIMARY KEY (bai_id);


--
-- Name: bandeiras_cartao bandeiras_cartao_ban_descricao_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.bandeiras_cartao
    ADD CONSTRAINT bandeiras_cartao_ban_descricao_key UNIQUE (ban_descricao);


--
-- Name: bandeiras_cartao bandeiras_cartao_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.bandeiras_cartao
    ADD CONSTRAINT bandeiras_cartao_pkey PRIMARY KEY (ban_id);


--
-- Name: carrinho_itens carrinho_itens_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.carrinho_itens
    ADD CONSTRAINT carrinho_itens_pkey PRIMARY KEY (cri_id);


--
-- Name: cartao_pagamento cartao_pagamento_cpp_uuid_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cartao_pagamento
    ADD CONSTRAINT cartao_pagamento_cpp_uuid_key UNIQUE (cpp_uuid);


--
-- Name: cartao_pagamento cartao_pagamento_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cartao_pagamento
    ADD CONSTRAINT cartao_pagamento_pkey PRIMARY KEY (cpp_id);


--
-- Name: cartoes cartoes_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cartoes
    ADD CONSTRAINT cartoes_pkey PRIMARY KEY (crt_id);


--
-- Name: categorias categorias_cat_nome_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.categorias
    ADD CONSTRAINT categorias_cat_nome_key UNIQUE (cat_nome);


--
-- Name: categorias categorias_cat_uuid_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.categorias
    ADD CONSTRAINT categorias_cat_uuid_key UNIQUE (cat_uuid);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (cat_id);


--
-- Name: ceps ceps_cep_numero_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.ceps
    ADD CONSTRAINT ceps_cep_numero_key UNIQUE (cep_numero);


--
-- Name: ceps ceps_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.ceps
    ADD CONSTRAINT ceps_pkey PRIMARY KEY (cep_id);


--
-- Name: cidades cidades_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cidades
    ADD CONSTRAINT cidades_pkey PRIMARY KEY (cid_id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (cli_id);


--
-- Name: configuracoes_app configuracoes_app_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.configuracoes_app
    ADD CONSTRAINT configuracoes_app_pkey PRIMARY KEY (cfg_id);


--
-- Name: cotacao_frete cotacao_frete_cfr_uuid_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cotacao_frete
    ADD CONSTRAINT cotacao_frete_cfr_uuid_key UNIQUE (cfr_uuid);


--
-- Name: cotacao_frete cotacao_frete_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cotacao_frete
    ADD CONSTRAINT cotacao_frete_pkey PRIMARY KEY (cfr_id);


--
-- Name: cotacao_frete_simulada cotacao_frete_simulada_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cotacao_frete_simulada
    ADD CONSTRAINT cotacao_frete_simulada_pkey PRIMARY KEY (cfr_id);


--
-- Name: itens_venda ecm_item_venda_itv_uuid_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.itens_venda
    ADD CONSTRAINT ecm_item_venda_itv_uuid_key UNIQUE (itv_uuid);


--
-- Name: itens_venda ecm_item_venda_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.itens_venda
    ADD CONSTRAINT ecm_item_venda_pkey PRIMARY KEY (itv_id);


--
-- Name: status_vendas ecm_status_venda_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.status_vendas
    ADD CONSTRAINT ecm_status_venda_pkey PRIMARY KEY (stv_id);


--
-- Name: status_vendas ecm_status_venda_stv_descricao_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.status_vendas
    ADD CONSTRAINT ecm_status_venda_stv_descricao_key UNIQUE (stv_descricao);


--
-- Name: vendas ecm_venda_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.vendas
    ADD CONSTRAINT ecm_venda_pkey PRIMARY KEY (ven_id);


--
-- Name: vendas ecm_venda_ven_uuid_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.vendas
    ADD CONSTRAINT ecm_venda_ven_uuid_key UNIQUE (ven_uuid);


--
-- Name: editoras editoras_edi_uuid_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.editoras
    ADD CONSTRAINT editoras_edi_uuid_key UNIQUE (edi_uuid);


--
-- Name: editoras editoras_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.editoras
    ADD CONSTRAINT editoras_pkey PRIMARY KEY (edi_id);


--
-- Name: enderecos enderecos_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.enderecos
    ADD CONSTRAINT enderecos_pkey PRIMARY KEY (end_id);


--
-- Name: entregas entrega_ent_uuid_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.entregas
    ADD CONSTRAINT entrega_ent_uuid_key UNIQUE (ent_uuid);


--
-- Name: entregas entrega_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.entregas
    ADD CONSTRAINT entrega_pkey PRIMARY KEY (ent_id);


--
-- Name: estados estados_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.estados
    ADD CONSTRAINT estados_pkey PRIMARY KEY (est_id);


--
-- Name: estoques estoques_etq_uuid_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.estoques
    ADD CONSTRAINT estoques_etq_uuid_key UNIQUE (etq_uuid);


--
-- Name: estoques estoques_liv_id_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.estoques
    ADD CONSTRAINT estoques_liv_id_key UNIQUE (liv_id);


--
-- Name: estoques estoques_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.estoques
    ADD CONSTRAINT estoques_pkey PRIMARY KEY (etq_id);


--
-- Name: fornecedores fornecedores_for_uuid_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.fornecedores
    ADD CONSTRAINT fornecedores_for_uuid_key UNIQUE (for_uuid);


--
-- Name: fornecedores fornecedores_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.fornecedores
    ADD CONSTRAINT fornecedores_pkey PRIMARY KEY (for_id);


--
-- Name: grupos_precificacao grupos_precificacao_gpr_descricao_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.grupos_precificacao
    ADD CONSTRAINT grupos_precificacao_gpr_descricao_key UNIQUE (gpr_descricao);


--
-- Name: grupos_precificacao grupos_precificacao_gpr_uuid_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.grupos_precificacao
    ADD CONSTRAINT grupos_precificacao_gpr_uuid_key UNIQUE (gpr_uuid);


--
-- Name: grupos_precificacao grupos_precificacao_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.grupos_precificacao
    ADD CONSTRAINT grupos_precificacao_pkey PRIMARY KEY (gpr_id);


--
-- Name: historico_entradas_estoque historico_entradas_estoque_hee_uuid_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.historico_entradas_estoque
    ADD CONSTRAINT historico_entradas_estoque_hee_uuid_key UNIQUE (hee_uuid);


--
-- Name: historico_entradas_estoque historico_entradas_estoque_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.historico_entradas_estoque
    ADD CONSTRAINT historico_entradas_estoque_pkey PRIMARY KEY (hee_id);


--
-- Name: intencao_pagamento intencao_pagamento_inp_uuid_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.intencao_pagamento
    ADD CONSTRAINT intencao_pagamento_inp_uuid_key UNIQUE (inp_uuid);


--
-- Name: intencao_pagamento intencao_pagamento_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.intencao_pagamento
    ADD CONSTRAINT intencao_pagamento_pkey PRIMARY KEY (inp_id);


--
-- Name: intencao_pagamento_simulado intencao_pagamento_simulado_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.intencao_pagamento_simulado
    ADD CONSTRAINT intencao_pagamento_simulado_pkey PRIMARY KEY (inp_id);


--
-- Name: intencao_pagamento_stripe intencao_pagamento_stripe_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.intencao_pagamento_stripe
    ADD CONSTRAINT intencao_pagamento_stripe_pkey PRIMARY KEY (inp_id);


--
-- Name: livro_categorias livro_categorias_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.livro_categorias
    ADD CONSTRAINT livro_categorias_pkey PRIMARY KEY (lct_id);


--
-- Name: livros livros_liv_codigo_barras_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.livros
    ADD CONSTRAINT livros_liv_codigo_barras_key UNIQUE (liv_codigo_barras);


--
-- Name: livros livros_liv_isbn_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.livros
    ADD CONSTRAINT livros_liv_isbn_key UNIQUE (liv_isbn);


--
-- Name: livros livros_liv_uuid_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.livros
    ADD CONSTRAINT livros_liv_uuid_key UNIQUE (liv_uuid);


--
-- Name: livros livros_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.livros
    ADD CONSTRAINT livros_pkey PRIMARY KEY (liv_id);


--
-- Name: logradouros logradouros_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.logradouros
    ADD CONSTRAINT logradouros_pkey PRIMARY KEY (log_id);


--
-- Name: pagamento pagamento_pag_uuid_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.pagamento
    ADD CONSTRAINT pagamento_pag_uuid_key UNIQUE (pag_uuid);


--
-- Name: pagamento_pix_simulado pagamento_pix_simulado_pag_id_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.pagamento_pix_simulado
    ADD CONSTRAINT pagamento_pix_simulado_pag_id_key UNIQUE (pag_id);


--
-- Name: pagamento_pix_simulado pagamento_pix_simulado_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.pagamento_pix_simulado
    ADD CONSTRAINT pagamento_pix_simulado_pkey PRIMARY KEY (ppx_id);


--
-- Name: pagamento pagamento_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.pagamento
    ADD CONSTRAINT pagamento_pkey PRIMARY KEY (pag_id);


--
-- Name: paises paises_pai_nome_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.paises
    ADD CONSTRAINT paises_pai_nome_key UNIQUE (pai_nome);


--
-- Name: paises paises_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.paises
    ADD CONSTRAINT paises_pkey PRIMARY KEY (pai_id);


--
-- Name: papeis papeis_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.papeis
    ADD CONSTRAINT papeis_pkey PRIMARY KEY (pap_id);


--
-- Name: status_pagamento status_pagamento_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.status_pagamento
    ADD CONSTRAINT status_pagamento_pkey PRIMARY KEY (stp_id);


--
-- Name: status_pagamento status_pagamento_stp_descricao_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.status_pagamento
    ADD CONSTRAINT status_pagamento_stp_descricao_key UNIQUE (stp_descricao);


--
-- Name: telefones telefones_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.telefones
    ADD CONSTRAINT telefones_pkey PRIMARY KEY (tel_id);


--
-- Name: tipos_frete tipo_frete_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.tipos_frete
    ADD CONSTRAINT tipo_frete_pkey PRIMARY KEY (tfr_id);


--
-- Name: tipos_frete tipo_frete_tfr_descricao_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.tipos_frete
    ADD CONSTRAINT tipo_frete_tfr_descricao_key UNIQUE (tfr_descricao);


--
-- Name: tipo_pagamento tipo_pagamento_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.tipo_pagamento
    ADD CONSTRAINT tipo_pagamento_pkey PRIMARY KEY (tpg_id);


--
-- Name: tipo_pagamento tipo_pagamento_tpg_descricao_key; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.tipo_pagamento
    ADD CONSTRAINT tipo_pagamento_tpg_descricao_key UNIQUE (tpg_descricao);


--
-- Name: tipos_logradouros tipos_logradouros_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.tipos_logradouros
    ADD CONSTRAINT tipos_logradouros_pkey PRIMARY KEY (tlo_id);


--
-- Name: tipos_residencias tipos_residencias_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.tipos_residencias
    ADD CONSTRAINT tipos_residencias_pkey PRIMARY KEY (tre_id);


--
-- Name: tipos_telefones tipos_telefones_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.tipos_telefones
    ADD CONSTRAINT tipos_telefones_pkey PRIMARY KEY (ttp_id);


--
-- Name: bairros uq_bairros_norm_cidade; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.bairros
    ADD CONSTRAINT uq_bairros_norm_cidade UNIQUE (bai_nome_norm, cid_id);


--
-- Name: bandeiras_cartao uq_bandeiras_uuid; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.bandeiras_cartao
    ADD CONSTRAINT uq_bandeiras_uuid UNIQUE (ban_uuid);


--
-- Name: carrinho_itens uq_carrinho_usuario_livro; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.carrinho_itens
    ADD CONSTRAINT uq_carrinho_usuario_livro UNIQUE (usu_id, liv_id);


--
-- Name: cartoes uq_cartoes_usuario_principal; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cartoes
    ADD CONSTRAINT uq_cartoes_usuario_principal EXCLUDE USING btree (usu_id WITH =) WHERE ((crt_principal = true));


--
-- Name: cartoes uq_cartoes_usuario_token; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cartoes
    ADD CONSTRAINT uq_cartoes_usuario_token UNIQUE (usu_id, crt_token);


--
-- Name: cartoes uq_cartoes_uuid; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cartoes
    ADD CONSTRAINT uq_cartoes_uuid UNIQUE (crt_uuid);


--
-- Name: cidades uq_cidades_norm_estado; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cidades
    ADD CONSTRAINT uq_cidades_norm_estado UNIQUE (cid_nome_norm, est_id);


--
-- Name: clientes uq_clientes_usuario; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.clientes
    ADD CONSTRAINT uq_clientes_usuario UNIQUE (usu_id);


--
-- Name: clientes uq_clientes_uuid; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.clientes
    ADD CONSTRAINT uq_clientes_uuid UNIQUE (cli_uuid);


--
-- Name: configuracoes_app uq_configuracoes_chave; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.configuracoes_app
    ADD CONSTRAINT uq_configuracoes_chave UNIQUE (cfg_chave);


--
-- Name: enderecos uq_enderecos_usuario_principal; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.enderecos
    ADD CONSTRAINT uq_enderecos_usuario_principal EXCLUDE USING btree (usu_id WITH =) WHERE ((end_principal = true));


--
-- Name: enderecos uq_enderecos_uuid; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.enderecos
    ADD CONSTRAINT uq_enderecos_uuid UNIQUE (end_uuid);


--
-- Name: estados uq_estados_nome; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.estados
    ADD CONSTRAINT uq_estados_nome UNIQUE (est_nome);


--
-- Name: estados uq_estados_sigla; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.estados
    ADD CONSTRAINT uq_estados_sigla UNIQUE (est_sigla);


--
-- Name: livro_categorias uq_livro_categoria; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.livro_categorias
    ADD CONSTRAINT uq_livro_categoria UNIQUE (liv_id, cat_id);


--
-- Name: logradouros uq_logradouros_completo; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.logradouros
    ADD CONSTRAINT uq_logradouros_completo UNIQUE (tlo_id, log_nome);


--
-- Name: papeis uq_papeis_descricao; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.papeis
    ADD CONSTRAINT uq_papeis_descricao UNIQUE (pap_descricao);


--
-- Name: telefones uq_telefones_usuario_numero; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.telefones
    ADD CONSTRAINT uq_telefones_usuario_numero UNIQUE (usu_id, tel_ddd, tel_numero);


--
-- Name: telefones uq_telefones_usuario_principal; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.telefones
    ADD CONSTRAINT uq_telefones_usuario_principal EXCLUDE USING btree (usu_id WITH =) WHERE ((tel_principal = true));


--
-- Name: telefones uq_telefones_uuid; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.telefones
    ADD CONSTRAINT uq_telefones_uuid UNIQUE (tel_uuid);


--
-- Name: tipos_logradouros uq_tipos_logradouros_descricao; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.tipos_logradouros
    ADD CONSTRAINT uq_tipos_logradouros_descricao UNIQUE (tlo_descricao);


--
-- Name: tipos_residencias uq_tipos_residencias_descricao; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.tipos_residencias
    ADD CONSTRAINT uq_tipos_residencias_descricao UNIQUE (tre_descricao);


--
-- Name: tipos_telefones uq_tipos_telefones_descricao; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.tipos_telefones
    ADD CONSTRAINT uq_tipos_telefones_descricao UNIQUE (ttp_descricao);


--
-- Name: avaliacoes_livro uq_usuario_livro_avaliacao; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.avaliacoes_livro
    ADD CONSTRAINT uq_usuario_livro_avaliacao UNIQUE (usu_id, liv_id);


--
-- Name: usuarios uq_usuarios_cpf; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.usuarios
    ADD CONSTRAINT uq_usuarios_cpf UNIQUE (usu_cpf);


--
-- Name: usuarios uq_usuarios_email; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.usuarios
    ADD CONSTRAINT uq_usuarios_email UNIQUE (usu_email);


--
-- Name: usuarios uq_usuarios_uuid; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.usuarios
    ADD CONSTRAINT uq_usuarios_uuid UNIQUE (usu_uuid);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (usu_id);


--
-- Name: autores autores_aut_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.autores
    ADD CONSTRAINT autores_aut_uuid_key UNIQUE (aut_uuid);


--
-- Name: autores autores_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.autores
    ADD CONSTRAINT autores_pkey PRIMARY KEY (aut_id);


--
-- Name: avaliacoes_livro avaliacoes_livro_avl_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.avaliacoes_livro
    ADD CONSTRAINT avaliacoes_livro_avl_uuid_key UNIQUE (avl_uuid);


--
-- Name: avaliacoes_livro avaliacoes_livro_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.avaliacoes_livro
    ADD CONSTRAINT avaliacoes_livro_pkey PRIMARY KEY (avl_id);


--
-- Name: bairros bairros_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.bairros
    ADD CONSTRAINT bairros_pkey PRIMARY KEY (bai_id);


--
-- Name: bandeiras_cartao bandeiras_cartao_ban_descricao_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.bandeiras_cartao
    ADD CONSTRAINT bandeiras_cartao_ban_descricao_key UNIQUE (ban_descricao);


--
-- Name: bandeiras_cartao bandeiras_cartao_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.bandeiras_cartao
    ADD CONSTRAINT bandeiras_cartao_pkey PRIMARY KEY (ban_id);


--
-- Name: carrinho_itens carrinho_itens_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.carrinho_itens
    ADD CONSTRAINT carrinho_itens_pkey PRIMARY KEY (cri_id);


--
-- Name: cartao_pagamento cartao_pagamento_cpp_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cartao_pagamento
    ADD CONSTRAINT cartao_pagamento_cpp_uuid_key UNIQUE (cpp_uuid);


--
-- Name: cartao_pagamento cartao_pagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cartao_pagamento
    ADD CONSTRAINT cartao_pagamento_pkey PRIMARY KEY (cpp_id);


--
-- Name: cartoes cartoes_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cartoes
    ADD CONSTRAINT cartoes_pkey PRIMARY KEY (crt_id);


--
-- Name: categorias categorias_cat_nome_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_cat_nome_key UNIQUE (cat_nome);


--
-- Name: categorias categorias_cat_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_cat_uuid_key UNIQUE (cat_uuid);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (cat_id);


--
-- Name: ceps ceps_cep_numero_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ceps
    ADD CONSTRAINT ceps_cep_numero_key UNIQUE (cep_numero);


--
-- Name: ceps ceps_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ceps
    ADD CONSTRAINT ceps_pkey PRIMARY KEY (cep_id);


--
-- Name: cidades cidades_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cidades
    ADD CONSTRAINT cidades_pkey PRIMARY KEY (cid_id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (cli_id);


--
-- Name: configuracoes_app configuracoes_app_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.configuracoes_app
    ADD CONSTRAINT configuracoes_app_pkey PRIMARY KEY (cfg_id);


--
-- Name: cotacao_frete cotacao_frete_cfr_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cotacao_frete
    ADD CONSTRAINT cotacao_frete_cfr_uuid_key UNIQUE (cfr_uuid);


--
-- Name: cotacao_frete cotacao_frete_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cotacao_frete
    ADD CONSTRAINT cotacao_frete_pkey PRIMARY KEY (cfr_id);


--
-- Name: cotacao_frete_simulada cotacao_frete_simulada_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cotacao_frete_simulada
    ADD CONSTRAINT cotacao_frete_simulada_pkey PRIMARY KEY (cfr_id);


--
-- Name: cupom cupom_cup_codigo_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cupom
    ADD CONSTRAINT cupom_cup_codigo_key UNIQUE (cup_codigo);


--
-- Name: cupom cupom_cup_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cupom
    ADD CONSTRAINT cupom_cup_uuid_key UNIQUE (cup_uuid);


--
-- Name: cupom cupom_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cupom
    ADD CONSTRAINT cupom_pkey PRIMARY KEY (cup_id);


--
-- Name: cupons_troca cupons_troca_ctr_codigo_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cupons_troca
    ADD CONSTRAINT cupons_troca_ctr_codigo_key UNIQUE (ctr_codigo);


--
-- Name: cupons_troca cupons_troca_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cupons_troca
    ADD CONSTRAINT cupons_troca_pkey PRIMARY KEY (ctr_id);


--
-- Name: itens_venda ecm_item_venda_itv_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.itens_venda
    ADD CONSTRAINT ecm_item_venda_itv_uuid_key UNIQUE (itv_uuid);


--
-- Name: itens_venda ecm_item_venda_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.itens_venda
    ADD CONSTRAINT ecm_item_venda_pkey PRIMARY KEY (itv_id);


--
-- Name: status_vendas ecm_status_venda_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.status_vendas
    ADD CONSTRAINT ecm_status_venda_pkey PRIMARY KEY (stv_id);


--
-- Name: status_vendas ecm_status_venda_stv_descricao_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.status_vendas
    ADD CONSTRAINT ecm_status_venda_stv_descricao_key UNIQUE (stv_descricao);


--
-- Name: vendas ecm_venda_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT ecm_venda_pkey PRIMARY KEY (ven_id);


--
-- Name: vendas ecm_venda_ven_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT ecm_venda_ven_uuid_key UNIQUE (ven_uuid);


--
-- Name: editoras editoras_edi_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.editoras
    ADD CONSTRAINT editoras_edi_uuid_key UNIQUE (edi_uuid);


--
-- Name: editoras editoras_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.editoras
    ADD CONSTRAINT editoras_pkey PRIMARY KEY (edi_id);


--
-- Name: enderecos enderecos_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.enderecos
    ADD CONSTRAINT enderecos_pkey PRIMARY KEY (end_id);


--
-- Name: entregas entrega_ent_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.entregas
    ADD CONSTRAINT entrega_ent_uuid_key UNIQUE (ent_uuid);


--
-- Name: entregas entrega_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.entregas
    ADD CONSTRAINT entrega_pkey PRIMARY KEY (ent_id);


--
-- Name: estados estados_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.estados
    ADD CONSTRAINT estados_pkey PRIMARY KEY (est_id);


--
-- Name: estoques estoques_etq_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.estoques
    ADD CONSTRAINT estoques_etq_uuid_key UNIQUE (etq_uuid);


--
-- Name: estoques estoques_liv_id_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.estoques
    ADD CONSTRAINT estoques_liv_id_key UNIQUE (liv_id);


--
-- Name: estoques estoques_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.estoques
    ADD CONSTRAINT estoques_pkey PRIMARY KEY (etq_id);


--
-- Name: fornecedores fornecedores_for_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.fornecedores
    ADD CONSTRAINT fornecedores_for_uuid_key UNIQUE (for_uuid);


--
-- Name: fornecedores fornecedores_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.fornecedores
    ADD CONSTRAINT fornecedores_pkey PRIMARY KEY (for_id);


--
-- Name: grupos_precificacao grupos_precificacao_gpr_descricao_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.grupos_precificacao
    ADD CONSTRAINT grupos_precificacao_gpr_descricao_key UNIQUE (gpr_descricao);


--
-- Name: grupos_precificacao grupos_precificacao_gpr_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.grupos_precificacao
    ADD CONSTRAINT grupos_precificacao_gpr_uuid_key UNIQUE (gpr_uuid);


--
-- Name: grupos_precificacao grupos_precificacao_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.grupos_precificacao
    ADD CONSTRAINT grupos_precificacao_pkey PRIMARY KEY (gpr_id);


--
-- Name: historico_entradas_estoque historico_entradas_estoque_hee_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.historico_entradas_estoque
    ADD CONSTRAINT historico_entradas_estoque_hee_uuid_key UNIQUE (hee_uuid);


--
-- Name: historico_entradas_estoque historico_entradas_estoque_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.historico_entradas_estoque
    ADD CONSTRAINT historico_entradas_estoque_pkey PRIMARY KEY (hee_id);


--
-- Name: intencao_pagamento intencao_pagamento_inp_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.intencao_pagamento
    ADD CONSTRAINT intencao_pagamento_inp_uuid_key UNIQUE (inp_uuid);


--
-- Name: intencao_pagamento intencao_pagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.intencao_pagamento
    ADD CONSTRAINT intencao_pagamento_pkey PRIMARY KEY (inp_id);


--
-- Name: intencao_pagamento_simulado intencao_pagamento_simulado_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.intencao_pagamento_simulado
    ADD CONSTRAINT intencao_pagamento_simulado_pkey PRIMARY KEY (inp_id);


--
-- Name: intencao_pagamento_stripe intencao_pagamento_stripe_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.intencao_pagamento_stripe
    ADD CONSTRAINT intencao_pagamento_stripe_pkey PRIMARY KEY (inp_id);


--
-- Name: livro_categorias livro_categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.livro_categorias
    ADD CONSTRAINT livro_categorias_pkey PRIMARY KEY (lct_id);


--
-- Name: livros livros_liv_codigo_barras_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.livros
    ADD CONSTRAINT livros_liv_codigo_barras_key UNIQUE (liv_codigo_barras);


--
-- Name: livros livros_liv_isbn_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.livros
    ADD CONSTRAINT livros_liv_isbn_key UNIQUE (liv_isbn);


--
-- Name: livros livros_liv_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.livros
    ADD CONSTRAINT livros_liv_uuid_key UNIQUE (liv_uuid);


--
-- Name: livros livros_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.livros
    ADD CONSTRAINT livros_pkey PRIMARY KEY (liv_id);


--
-- Name: logradouros logradouros_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.logradouros
    ADD CONSTRAINT logradouros_pkey PRIMARY KEY (log_id);


--
-- Name: pagamento pagamento_pag_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.pagamento
    ADD CONSTRAINT pagamento_pag_uuid_key UNIQUE (pag_uuid);


--
-- Name: pagamento_pix_simulado pagamento_pix_simulado_pag_id_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.pagamento_pix_simulado
    ADD CONSTRAINT pagamento_pix_simulado_pag_id_key UNIQUE (pag_id);


--
-- Name: pagamento_pix_simulado pagamento_pix_simulado_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.pagamento_pix_simulado
    ADD CONSTRAINT pagamento_pix_simulado_pkey PRIMARY KEY (ppx_id);


--
-- Name: pagamento pagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.pagamento
    ADD CONSTRAINT pagamento_pkey PRIMARY KEY (pag_id);


--
-- Name: paises paises_pai_nome_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.paises
    ADD CONSTRAINT paises_pai_nome_key UNIQUE (pai_nome);


--
-- Name: paises paises_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.paises
    ADD CONSTRAINT paises_pkey PRIMARY KEY (pai_id);


--
-- Name: papeis papeis_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.papeis
    ADD CONSTRAINT papeis_pkey PRIMARY KEY (pap_id);


--
-- Name: status_pagamento status_pagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.status_pagamento
    ADD CONSTRAINT status_pagamento_pkey PRIMARY KEY (stp_id);


--
-- Name: status_pagamento status_pagamento_stp_descricao_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.status_pagamento
    ADD CONSTRAINT status_pagamento_stp_descricao_key UNIQUE (stp_descricao);


--
-- Name: telefones telefones_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.telefones
    ADD CONSTRAINT telefones_pkey PRIMARY KEY (tel_id);


--
-- Name: tipos_frete tipo_frete_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.tipos_frete
    ADD CONSTRAINT tipo_frete_pkey PRIMARY KEY (tfr_id);


--
-- Name: tipos_frete tipo_frete_tfr_descricao_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.tipos_frete
    ADD CONSTRAINT tipo_frete_tfr_descricao_key UNIQUE (tfr_descricao);


--
-- Name: tipo_pagamento tipo_pagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.tipo_pagamento
    ADD CONSTRAINT tipo_pagamento_pkey PRIMARY KEY (tpg_id);


--
-- Name: tipo_pagamento tipo_pagamento_tpg_descricao_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.tipo_pagamento
    ADD CONSTRAINT tipo_pagamento_tpg_descricao_key UNIQUE (tpg_descricao);


--
-- Name: tipos_logradouros tipos_logradouros_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.tipos_logradouros
    ADD CONSTRAINT tipos_logradouros_pkey PRIMARY KEY (tlo_id);


--
-- Name: tipos_residencias tipos_residencias_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.tipos_residencias
    ADD CONSTRAINT tipos_residencias_pkey PRIMARY KEY (tre_id);


--
-- Name: tipos_telefones tipos_telefones_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.tipos_telefones
    ADD CONSTRAINT tipos_telefones_pkey PRIMARY KEY (ttp_id);


--
-- Name: bairros uq_bairros_norm_cidade; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.bairros
    ADD CONSTRAINT uq_bairros_norm_cidade UNIQUE (bai_nome_norm, cid_id);


--
-- Name: bandeiras_cartao uq_bandeiras_uuid; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.bandeiras_cartao
    ADD CONSTRAINT uq_bandeiras_uuid UNIQUE (ban_uuid);


--
-- Name: carrinho_itens uq_carrinho_usuario_livro; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.carrinho_itens
    ADD CONSTRAINT uq_carrinho_usuario_livro UNIQUE (usu_id, liv_id);


--
-- Name: cartoes uq_cartoes_usuario_principal; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cartoes
    ADD CONSTRAINT uq_cartoes_usuario_principal EXCLUDE USING btree (usu_id WITH =) WHERE ((crt_principal = true));


--
-- Name: cartoes uq_cartoes_usuario_token; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cartoes
    ADD CONSTRAINT uq_cartoes_usuario_token UNIQUE (usu_id, crt_token);


--
-- Name: cartoes uq_cartoes_uuid; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cartoes
    ADD CONSTRAINT uq_cartoes_uuid UNIQUE (crt_uuid);


--
-- Name: cidades uq_cidades_norm_estado; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cidades
    ADD CONSTRAINT uq_cidades_norm_estado UNIQUE (cid_nome_norm, est_id);


--
-- Name: clientes uq_clientes_usuario; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT uq_clientes_usuario UNIQUE (usu_id);


--
-- Name: clientes uq_clientes_uuid; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT uq_clientes_uuid UNIQUE (cli_uuid);


--
-- Name: configuracoes_app uq_configuracoes_chave; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.configuracoes_app
    ADD CONSTRAINT uq_configuracoes_chave UNIQUE (cfg_chave);


--
-- Name: enderecos uq_enderecos_usuario_principal; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.enderecos
    ADD CONSTRAINT uq_enderecos_usuario_principal EXCLUDE USING btree (usu_id WITH =) WHERE ((end_principal = true));


--
-- Name: enderecos uq_enderecos_uuid; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.enderecos
    ADD CONSTRAINT uq_enderecos_uuid UNIQUE (end_uuid);


--
-- Name: estados uq_estados_nome; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.estados
    ADD CONSTRAINT uq_estados_nome UNIQUE (est_nome);


--
-- Name: estados uq_estados_sigla; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.estados
    ADD CONSTRAINT uq_estados_sigla UNIQUE (est_sigla);


--
-- Name: livro_categorias uq_livro_categoria; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.livro_categorias
    ADD CONSTRAINT uq_livro_categoria UNIQUE (liv_id, cat_id);


--
-- Name: logradouros uq_logradouros_completo; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.logradouros
    ADD CONSTRAINT uq_logradouros_completo UNIQUE (tlo_id, log_nome);


--
-- Name: papeis uq_papeis_descricao; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.papeis
    ADD CONSTRAINT uq_papeis_descricao UNIQUE (pap_descricao);


--
-- Name: telefones uq_telefones_usuario_numero; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.telefones
    ADD CONSTRAINT uq_telefones_usuario_numero UNIQUE (usu_id, tel_ddd, tel_numero);


--
-- Name: telefones uq_telefones_usuario_principal; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.telefones
    ADD CONSTRAINT uq_telefones_usuario_principal EXCLUDE USING btree (usu_id WITH =) WHERE ((tel_principal = true));


--
-- Name: telefones uq_telefones_uuid; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.telefones
    ADD CONSTRAINT uq_telefones_uuid UNIQUE (tel_uuid);


--
-- Name: tipos_logradouros uq_tipos_logradouros_descricao; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.tipos_logradouros
    ADD CONSTRAINT uq_tipos_logradouros_descricao UNIQUE (tlo_descricao);


--
-- Name: tipos_residencias uq_tipos_residencias_descricao; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.tipos_residencias
    ADD CONSTRAINT uq_tipos_residencias_descricao UNIQUE (tre_descricao);


--
-- Name: tipos_telefones uq_tipos_telefones_descricao; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.tipos_telefones
    ADD CONSTRAINT uq_tipos_telefones_descricao UNIQUE (ttp_descricao);


--
-- Name: avaliacoes_livro uq_usuario_livro_avaliacao; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.avaliacoes_livro
    ADD CONSTRAINT uq_usuario_livro_avaliacao UNIQUE (usu_id, liv_id);


--
-- Name: usuarios uq_usuarios_cpf; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT uq_usuarios_cpf UNIQUE (usu_cpf);


--
-- Name: usuarios uq_usuarios_email; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT uq_usuarios_email UNIQUE (usu_email);


--
-- Name: usuarios uq_usuarios_uuid; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT uq_usuarios_uuid UNIQUE (usu_uuid);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (usu_id);


--
-- Name: idx_autores_nome_norm; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_autores_nome_norm ON les.autores USING gin (aut_nome_norm public.gin_trgm_ops);


--
-- Name: idx_avaliacoes_aprovado; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_avaliacoes_aprovado ON les.avaliacoes_livro USING btree (avl_aprovado);


--
-- Name: idx_avaliacoes_livro; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_avaliacoes_livro ON les.avaliacoes_livro USING btree (liv_id);


--
-- Name: idx_avaliacoes_usuario; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_avaliacoes_usuario ON les.avaliacoes_livro USING btree (usu_id);


--
-- Name: idx_carrinho_itens_usuario; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_carrinho_itens_usuario ON les.carrinho_itens USING btree (usu_id);


--
-- Name: idx_cartao_pagamento_pagamento; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_cartao_pagamento_pagamento ON les.cartao_pagamento USING btree (pag_id);


--
-- Name: idx_cartoes_bandeira; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_cartoes_bandeira ON les.cartoes USING btree (ban_id);


--
-- Name: idx_cartoes_usuario; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_cartoes_usuario ON les.cartoes USING btree (usu_id);


--
-- Name: idx_categorias_nome_norm; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_categorias_nome_norm ON les.categorias USING gin (cat_nome_norm public.gin_trgm_ops);


--
-- Name: idx_cotacao_frete_estado_expira; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_cotacao_frete_estado_expira ON les.cotacao_frete USING btree (cfr_estado, cfr_expira_em);


--
-- Name: idx_cotacao_frete_uuid; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_cotacao_frete_uuid ON les.cotacao_frete USING btree (cfr_uuid);


--
-- Name: idx_cotacao_frete_ven; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_cotacao_frete_ven ON les.cotacao_frete USING btree (ven_id);


--
-- Name: idx_editoras_nome_norm; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_editoras_nome_norm ON les.editoras USING gin (edi_nome_norm public.gin_trgm_ops);


--
-- Name: idx_enderecos_bairro; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_enderecos_bairro ON les.enderecos USING btree (bai_id);


--
-- Name: idx_enderecos_cep; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_enderecos_cep ON les.enderecos USING btree (cep_id);


--
-- Name: idx_enderecos_cidade; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_enderecos_cidade ON les.enderecos USING btree (cid_id);


--
-- Name: idx_enderecos_logradouro; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_enderecos_logradouro ON les.enderecos USING btree (log_id);


--
-- Name: idx_enderecos_principal; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_enderecos_principal ON les.enderecos USING btree (usu_id) WHERE (end_principal = true);


--
-- Name: idx_enderecos_usuario; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_enderecos_usuario ON les.enderecos USING btree (usu_id);


--
-- Name: idx_entrega_tipo_frete; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_entrega_tipo_frete ON les.entregas USING btree (tfr_id);


--
-- Name: idx_entrega_uuid; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_entrega_uuid ON les.entregas USING btree (ent_uuid);


--
-- Name: idx_entrega_venda; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_entrega_venda ON les.entregas USING btree (ven_id);


--
-- Name: idx_estoques_livro; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_estoques_livro ON les.estoques USING btree (liv_id);


--
-- Name: idx_fornecedores_nome_norm; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_fornecedores_nome_norm ON les.fornecedores USING gin (for_nome_norm public.gin_trgm_ops);


--
-- Name: idx_historico_entradas_data; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_historico_entradas_data ON les.historico_entradas_estoque USING btree (hee_data_entrada);


--
-- Name: idx_historico_entradas_fornecedor; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_historico_entradas_fornecedor ON les.historico_entradas_estoque USING btree (for_id);


--
-- Name: idx_historico_entradas_livro; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_historico_entradas_livro ON les.historico_entradas_estoque USING btree (liv_id);


--
-- Name: idx_intencao_pagamento_estado_expira; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_intencao_pagamento_estado_expira ON les.intencao_pagamento USING btree (inp_estado, inp_expira_em);


--
-- Name: idx_intencao_pagamento_uuid; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_intencao_pagamento_uuid ON les.intencao_pagamento USING btree (inp_uuid);


--
-- Name: idx_intencao_pagamento_ven_id; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_intencao_pagamento_ven_id ON les.intencao_pagamento USING btree (ven_id) WHERE (ven_id IS NOT NULL);


--
-- Name: idx_itens_venda_livro; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_itens_venda_livro ON les.itens_venda USING btree (liv_id);


--
-- Name: idx_itens_venda_uuid; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_itens_venda_uuid ON les.itens_venda USING btree (itv_uuid);


--
-- Name: idx_itens_venda_venda; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_itens_venda_venda ON les.itens_venda USING btree (ven_id);


--
-- Name: idx_livro_categorias_categoria; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_livro_categorias_categoria ON les.livro_categorias USING btree (cat_id);


--
-- Name: idx_livro_categorias_livro; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_livro_categorias_livro ON les.livro_categorias USING btree (liv_id);


--
-- Name: idx_livros_autor; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_livros_autor ON les.livros USING btree (aut_id);


--
-- Name: idx_livros_editora; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_livros_editora ON les.livros USING btree (edi_id);


--
-- Name: idx_livros_grupo_precificacao; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_livros_grupo_precificacao ON les.livros USING btree (gpr_id);


--
-- Name: idx_livros_isbn; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_livros_isbn ON les.livros USING btree (liv_isbn);


--
-- Name: idx_livros_titulo_norm; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_livros_titulo_norm ON les.livros USING gin (liv_titulo_norm public.gin_trgm_ops);


--
-- Name: idx_pagamento_inp_id_nao_unico; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_pagamento_inp_id_nao_unico ON les.pagamento USING btree (inp_id) WHERE (inp_id IS NOT NULL);


--
-- Name: idx_pagamento_pix_simulado_pag_id; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_pagamento_pix_simulado_pag_id ON les.pagamento_pix_simulado USING btree (pag_id);


--
-- Name: idx_pagamento_status; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_pagamento_status ON les.pagamento USING btree (stp_id);


--
-- Name: idx_pagamento_tipo; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_pagamento_tipo ON les.pagamento USING btree (tpg_id);


--
-- Name: idx_pagamento_uuid; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_pagamento_uuid ON les.pagamento USING btree (pag_uuid);


--
-- Name: idx_pagamento_venda; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_pagamento_venda ON les.pagamento USING btree (ven_id);


--
-- Name: idx_telefones_principal; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_telefones_principal ON les.telefones USING btree (usu_id) WHERE (tel_principal = true);


--
-- Name: idx_telefones_usuario; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_telefones_usuario ON les.telefones USING btree (usu_id);


--
-- Name: idx_vendas_cfr; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_vendas_cfr ON les.vendas USING btree (cfr_id);


--
-- Name: idx_vendas_status; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_vendas_status ON les.vendas USING btree (stv_id);


--
-- Name: idx_vendas_usuario; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE INDEX idx_vendas_usuario ON les.vendas USING btree (usu_id);


--
-- Name: uq_categorias_cat_slug; Type: INDEX; Schema: les; Owner: ecm_user
--

CREATE UNIQUE INDEX uq_categorias_cat_slug ON les.categorias USING btree (cat_slug) WHERE (cat_slug IS NOT NULL);


--
-- Name: idx_autores_nome_norm; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_autores_nome_norm ON public.autores USING gin (aut_nome_norm public.gin_trgm_ops);


--
-- Name: idx_avaliacoes_aprovado; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_avaliacoes_aprovado ON public.avaliacoes_livro USING btree (avl_aprovado);


--
-- Name: idx_avaliacoes_livro; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_avaliacoes_livro ON public.avaliacoes_livro USING btree (liv_id);


--
-- Name: idx_avaliacoes_usuario; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_avaliacoes_usuario ON public.avaliacoes_livro USING btree (usu_id);


--
-- Name: idx_carrinho_itens_usuario; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_carrinho_itens_usuario ON public.carrinho_itens USING btree (usu_id);


--
-- Name: idx_cartao_pagamento_pagamento; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_cartao_pagamento_pagamento ON public.cartao_pagamento USING btree (pag_id);


--
-- Name: idx_cartoes_bandeira; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_cartoes_bandeira ON public.cartoes USING btree (ban_id);


--
-- Name: idx_cartoes_usuario; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_cartoes_usuario ON public.cartoes USING btree (usu_id);


--
-- Name: idx_categorias_nome_norm; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_categorias_nome_norm ON public.categorias USING gin (cat_nome_norm public.gin_trgm_ops);


--
-- Name: idx_cotacao_frete_estado_expira; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_cotacao_frete_estado_expira ON public.cotacao_frete USING btree (cfr_estado, cfr_expira_em);


--
-- Name: idx_cotacao_frete_uuid; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_cotacao_frete_uuid ON public.cotacao_frete USING btree (cfr_uuid);


--
-- Name: idx_cotacao_frete_ven; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_cotacao_frete_ven ON public.cotacao_frete USING btree (ven_id);


--
-- Name: idx_cupom_ativo; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_cupom_ativo ON public.cupom USING btree (cup_ativo);


--
-- Name: idx_cupom_codigo; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_cupom_codigo ON public.cupom USING btree (cup_codigo);


--
-- Name: idx_cupom_tipo; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_cupom_tipo ON public.cupom USING btree (cup_tipo);


--
-- Name: idx_cupom_validade; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_cupom_validade ON public.cupom USING btree (cup_valido_de, cup_valido_ate);


--
-- Name: idx_cupons_troca_codigo; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_cupons_troca_codigo ON public.cupons_troca USING btree (ctr_codigo);


--
-- Name: idx_cupons_troca_usuario; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_cupons_troca_usuario ON public.cupons_troca USING btree (usu_id);


--
-- Name: idx_editoras_nome_norm; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_editoras_nome_norm ON public.editoras USING gin (edi_nome_norm public.gin_trgm_ops);


--
-- Name: idx_enderecos_bairro; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_enderecos_bairro ON public.enderecos USING btree (bai_id);


--
-- Name: idx_enderecos_cep; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_enderecos_cep ON public.enderecos USING btree (cep_id);


--
-- Name: idx_enderecos_cidade; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_enderecos_cidade ON public.enderecos USING btree (cid_id);


--
-- Name: idx_enderecos_logradouro; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_enderecos_logradouro ON public.enderecos USING btree (log_id);


--
-- Name: idx_enderecos_principal; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_enderecos_principal ON public.enderecos USING btree (usu_id) WHERE (end_principal = true);


--
-- Name: idx_enderecos_usuario; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_enderecos_usuario ON public.enderecos USING btree (usu_id);


--
-- Name: idx_entrega_tipo_frete; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_entrega_tipo_frete ON public.entregas USING btree (tfr_id);


--
-- Name: idx_entrega_uuid; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_entrega_uuid ON public.entregas USING btree (ent_uuid);


--
-- Name: idx_entrega_venda; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_entrega_venda ON public.entregas USING btree (ven_id);


--
-- Name: idx_estoques_livro; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_estoques_livro ON public.estoques USING btree (liv_id);


--
-- Name: idx_fornecedores_nome_norm; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_fornecedores_nome_norm ON public.fornecedores USING gin (for_nome_norm public.gin_trgm_ops);


--
-- Name: idx_historico_entradas_data; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_historico_entradas_data ON public.historico_entradas_estoque USING btree (hee_data_entrada);


--
-- Name: idx_historico_entradas_fornecedor; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_historico_entradas_fornecedor ON public.historico_entradas_estoque USING btree (for_id);


--
-- Name: idx_historico_entradas_livro; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_historico_entradas_livro ON public.historico_entradas_estoque USING btree (liv_id);


--
-- Name: idx_intencao_pagamento_estado_expira; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_intencao_pagamento_estado_expira ON public.intencao_pagamento USING btree (inp_estado, inp_expira_em);


--
-- Name: idx_intencao_pagamento_uuid; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_intencao_pagamento_uuid ON public.intencao_pagamento USING btree (inp_uuid);


--
-- Name: idx_intencao_pagamento_ven_id; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_intencao_pagamento_ven_id ON public.intencao_pagamento USING btree (ven_id) WHERE (ven_id IS NOT NULL);


--
-- Name: idx_itens_venda_livro; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_itens_venda_livro ON public.itens_venda USING btree (liv_id);


--
-- Name: idx_itens_venda_uuid; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_itens_venda_uuid ON public.itens_venda USING btree (itv_uuid);


--
-- Name: idx_itens_venda_venda; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_itens_venda_venda ON public.itens_venda USING btree (ven_id);


--
-- Name: idx_livro_categorias_categoria; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_livro_categorias_categoria ON public.livro_categorias USING btree (cat_id);


--
-- Name: idx_livro_categorias_livro; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_livro_categorias_livro ON public.livro_categorias USING btree (liv_id);


--
-- Name: idx_livros_autor; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_livros_autor ON public.livros USING btree (aut_id);


--
-- Name: idx_livros_editora; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_livros_editora ON public.livros USING btree (edi_id);


--
-- Name: idx_livros_grupo_precificacao; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_livros_grupo_precificacao ON public.livros USING btree (gpr_id);


--
-- Name: idx_livros_isbn; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_livros_isbn ON public.livros USING btree (liv_isbn);


--
-- Name: idx_livros_titulo_norm; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_livros_titulo_norm ON public.livros USING gin (liv_titulo_norm public.gin_trgm_ops);


--
-- Name: idx_pagamento_inp_id_nao_unico; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_pagamento_inp_id_nao_unico ON public.pagamento USING btree (inp_id) WHERE (inp_id IS NOT NULL);


--
-- Name: idx_pagamento_pix_simulado_pag_id; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_pagamento_pix_simulado_pag_id ON public.pagamento_pix_simulado USING btree (pag_id);


--
-- Name: idx_pagamento_status; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_pagamento_status ON public.pagamento USING btree (stp_id);


--
-- Name: idx_pagamento_tipo; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_pagamento_tipo ON public.pagamento USING btree (tpg_id);


--
-- Name: idx_pagamento_uuid; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_pagamento_uuid ON public.pagamento USING btree (pag_uuid);


--
-- Name: idx_pagamento_venda; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_pagamento_venda ON public.pagamento USING btree (ven_id);


--
-- Name: idx_telefones_principal; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_telefones_principal ON public.telefones USING btree (usu_id) WHERE (tel_principal = true);


--
-- Name: idx_telefones_usuario; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_telefones_usuario ON public.telefones USING btree (usu_id);


--
-- Name: idx_vendas_cfr; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_vendas_cfr ON public.vendas USING btree (cfr_id);


--
-- Name: idx_vendas_status; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_vendas_status ON public.vendas USING btree (stv_id);


--
-- Name: idx_vendas_usuario; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_vendas_usuario ON public.vendas USING btree (usu_id);


--
-- Name: uq_categorias_cat_slug; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE UNIQUE INDEX uq_categorias_cat_slug ON public.categorias USING btree (cat_slug) WHERE (cat_slug IS NOT NULL);


--
-- Name: autores tg_autores_atualizado_em; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_autores_atualizado_em BEFORE UPDATE ON les.autores FOR EACH ROW EXECUTE FUNCTION les.fn_atualizar_timestamp_livros_estoque();


--
-- Name: autores tg_autores_normalizar; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_autores_normalizar BEFORE INSERT OR UPDATE ON les.autores FOR EACH ROW EXECUTE FUNCTION les.fn_gerar_trigrama_autores();


--
-- Name: avaliacoes_livro tg_avaliacoes_livro_atualizado_em; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_avaliacoes_livro_atualizado_em BEFORE UPDATE ON les.avaliacoes_livro FOR EACH ROW EXECUTE FUNCTION les.fn_atualizar_timestamp_livros_estoque();


--
-- Name: cartoes tg_cartoes_atualizado_em; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_cartoes_atualizado_em BEFORE UPDATE ON les.cartoes FOR EACH ROW EXECUTE FUNCTION les.fn_atualizar_timestamp();


--
-- Name: categorias tg_categorias_normalizar; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_categorias_normalizar BEFORE INSERT OR UPDATE ON les.categorias FOR EACH ROW EXECUTE FUNCTION les.fn_gerar_trigrama_categorias();


--
-- Name: clientes tg_clientes_atualizado_em; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_clientes_atualizado_em BEFORE UPDATE ON les.clientes FOR EACH ROW EXECUTE FUNCTION les.fn_atualizar_timestamp();


--
-- Name: editoras tg_editoras_atualizado_em; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_editoras_atualizado_em BEFORE UPDATE ON les.editoras FOR EACH ROW EXECUTE FUNCTION les.fn_atualizar_timestamp_livros_estoque();


--
-- Name: editoras tg_editoras_normalizar; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_editoras_normalizar BEFORE INSERT OR UPDATE ON les.editoras FOR EACH ROW EXECUTE FUNCTION les.fn_gerar_trigrama_editoras();


--
-- Name: enderecos tg_enderecos_atualizado_em; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_enderecos_atualizado_em BEFORE UPDATE ON les.enderecos FOR EACH ROW EXECUTE FUNCTION les.fn_atualizar_timestamp();


--
-- Name: estoques tg_estoques_atualizado_em; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_estoques_atualizado_em BEFORE UPDATE ON les.estoques FOR EACH ROW EXECUTE FUNCTION les.fn_atualizar_timestamp_livros_estoque();


--
-- Name: fornecedores tg_fornecedores_atualizado_em; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_fornecedores_atualizado_em BEFORE UPDATE ON les.fornecedores FOR EACH ROW EXECUTE FUNCTION les.fn_atualizar_timestamp_livros_estoque();


--
-- Name: fornecedores tg_fornecedores_normalizar; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_fornecedores_normalizar BEFORE INSERT OR UPDATE ON les.fornecedores FOR EACH ROW EXECUTE FUNCTION les.fn_gerar_trigrama_fornecedores();


--
-- Name: livros tg_livros_atualizado_em; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_livros_atualizado_em BEFORE UPDATE ON les.livros FOR EACH ROW EXECUTE FUNCTION les.fn_atualizar_timestamp_livros_estoque();


--
-- Name: livros tg_livros_normalizar; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_livros_normalizar BEFORE INSERT OR UPDATE ON les.livros FOR EACH ROW EXECUTE FUNCTION les.fn_gerar_trigrama_livros();


--
-- Name: pagamento tg_pagamento_atualizado_em; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_pagamento_atualizado_em BEFORE UPDATE ON les.pagamento FOR EACH ROW EXECUTE FUNCTION les.fn_atualizar_timestamp_pagamento();


--
-- Name: telefones tg_telefones_atualizado_em; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_telefones_atualizado_em BEFORE UPDATE ON les.telefones FOR EACH ROW EXECUTE FUNCTION les.fn_atualizar_timestamp();


--
-- Name: usuarios tg_usuarios_atualizado_em; Type: TRIGGER; Schema: les; Owner: ecm_user
--

CREATE TRIGGER tg_usuarios_atualizado_em BEFORE UPDATE ON les.usuarios FOR EACH ROW EXECUTE FUNCTION les.fn_atualizar_timestamp();


--
-- Name: autores tg_autores_atualizado_em; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_autores_atualizado_em BEFORE UPDATE ON public.autores FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_timestamp_livros_estoque();


--
-- Name: autores tg_autores_normalizar; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_autores_normalizar BEFORE INSERT OR UPDATE ON public.autores FOR EACH ROW EXECUTE FUNCTION public.fn_gerar_trigrama_autores();


--
-- Name: avaliacoes_livro tg_avaliacoes_livro_atualizado_em; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_avaliacoes_livro_atualizado_em BEFORE UPDATE ON public.avaliacoes_livro FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_timestamp_livros_estoque();


--
-- Name: cartoes tg_cartoes_atualizado_em; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_cartoes_atualizado_em BEFORE UPDATE ON public.cartoes FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_timestamp();


--
-- Name: categorias tg_categorias_normalizar; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_categorias_normalizar BEFORE INSERT OR UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.fn_gerar_trigrama_categorias();


--
-- Name: clientes tg_clientes_atualizado_em; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_clientes_atualizado_em BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_timestamp();


--
-- Name: cupom tg_cupom_atualizado_em; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_cupom_atualizado_em BEFORE UPDATE ON public.cupom FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_timestamp_cupom();


--
-- Name: editoras tg_editoras_atualizado_em; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_editoras_atualizado_em BEFORE UPDATE ON public.editoras FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_timestamp_livros_estoque();


--
-- Name: editoras tg_editoras_normalizar; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_editoras_normalizar BEFORE INSERT OR UPDATE ON public.editoras FOR EACH ROW EXECUTE FUNCTION public.fn_gerar_trigrama_editoras();


--
-- Name: enderecos tg_enderecos_atualizado_em; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_enderecos_atualizado_em BEFORE UPDATE ON public.enderecos FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_timestamp();


--
-- Name: estoques tg_estoques_atualizado_em; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_estoques_atualizado_em BEFORE UPDATE ON public.estoques FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_timestamp_livros_estoque();


--
-- Name: fornecedores tg_fornecedores_atualizado_em; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_fornecedores_atualizado_em BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_timestamp_livros_estoque();


--
-- Name: fornecedores tg_fornecedores_normalizar; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_fornecedores_normalizar BEFORE INSERT OR UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.fn_gerar_trigrama_fornecedores();


--
-- Name: livros tg_livros_atualizado_em; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_livros_atualizado_em BEFORE UPDATE ON public.livros FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_timestamp_livros_estoque();


--
-- Name: livros tg_livros_normalizar; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_livros_normalizar BEFORE INSERT OR UPDATE ON public.livros FOR EACH ROW EXECUTE FUNCTION public.fn_gerar_trigrama_livros();


--
-- Name: pagamento tg_pagamento_atualizado_em; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_pagamento_atualizado_em BEFORE UPDATE ON public.pagamento FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_timestamp_pagamento();


--
-- Name: telefones tg_telefones_atualizado_em; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_telefones_atualizado_em BEFORE UPDATE ON public.telefones FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_timestamp();


--
-- Name: usuarios tg_usuarios_atualizado_em; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_usuarios_atualizado_em BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_timestamp();


--
-- Name: avaliacoes_livro avaliacoes_livro_liv_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.avaliacoes_livro
    ADD CONSTRAINT avaliacoes_livro_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES les.livros(liv_id) ON DELETE CASCADE;


--
-- Name: avaliacoes_livro avaliacoes_livro_usu_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.avaliacoes_livro
    ADD CONSTRAINT avaliacoes_livro_usu_id_fkey FOREIGN KEY (usu_id) REFERENCES les.usuarios(usu_id);


--
-- Name: carrinho_itens carrinho_itens_liv_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.carrinho_itens
    ADD CONSTRAINT carrinho_itens_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES les.livros(liv_id) ON DELETE CASCADE;


--
-- Name: carrinho_itens carrinho_itens_usu_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.carrinho_itens
    ADD CONSTRAINT carrinho_itens_usu_id_fkey FOREIGN KEY (usu_id) REFERENCES les.usuarios(usu_id) ON DELETE CASCADE;


--
-- Name: cartao_pagamento cartao_pagamento_pag_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cartao_pagamento
    ADD CONSTRAINT cartao_pagamento_pag_id_fkey FOREIGN KEY (pag_id) REFERENCES les.pagamento(pag_id) ON DELETE CASCADE;


--
-- Name: ceps ceps_bai_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.ceps
    ADD CONSTRAINT ceps_bai_id_fkey FOREIGN KEY (bai_id) REFERENCES les.bairros(bai_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ceps ceps_cid_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.ceps
    ADD CONSTRAINT ceps_cid_id_fkey FOREIGN KEY (cid_id) REFERENCES les.cidades(cid_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cotacao_frete_simulada cotacao_frete_simulada_cfr_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cotacao_frete_simulada
    ADD CONSTRAINT cotacao_frete_simulada_cfr_id_fkey FOREIGN KEY (cfr_id) REFERENCES les.cotacao_frete(cfr_id) ON DELETE CASCADE;


--
-- Name: cotacao_frete cotacao_frete_ven_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cotacao_frete
    ADD CONSTRAINT cotacao_frete_ven_id_fkey FOREIGN KEY (ven_id) REFERENCES les.vendas(ven_id) ON DELETE SET NULL;


--
-- Name: itens_venda ecm_item_venda_ven_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.itens_venda
    ADD CONSTRAINT ecm_item_venda_ven_id_fkey FOREIGN KEY (ven_id) REFERENCES les.vendas(ven_id) ON DELETE CASCADE;


--
-- Name: vendas ecm_venda_stv_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.vendas
    ADD CONSTRAINT ecm_venda_stv_id_fkey FOREIGN KEY (stv_id) REFERENCES les.status_vendas(stv_id);


--
-- Name: entregas entrega_tfr_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.entregas
    ADD CONSTRAINT entrega_tfr_id_fkey FOREIGN KEY (tfr_id) REFERENCES les.tipos_frete(tfr_id);


--
-- Name: estoques estoques_liv_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.estoques
    ADD CONSTRAINT estoques_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES les.livros(liv_id) ON DELETE CASCADE;


--
-- Name: bairros fk_bairros_cidades; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.bairros
    ADD CONSTRAINT fk_bairros_cidades FOREIGN KEY (cid_id) REFERENCES les.cidades(cid_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cartoes fk_cartoes_bandeiras; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cartoes
    ADD CONSTRAINT fk_cartoes_bandeiras FOREIGN KEY (ban_id) REFERENCES les.bandeiras_cartao(ban_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cartoes fk_cartoes_usuarios; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cartoes
    ADD CONSTRAINT fk_cartoes_usuarios FOREIGN KEY (usu_id) REFERENCES les.usuarios(usu_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cidades fk_cidades_estados; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.cidades
    ADD CONSTRAINT fk_cidades_estados FOREIGN KEY (est_id) REFERENCES les.estados(est_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: clientes fk_clientes_usuarios; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.clientes
    ADD CONSTRAINT fk_clientes_usuarios FOREIGN KEY (usu_id) REFERENCES les.usuarios(usu_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enderecos fk_enderecos_bairros; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.enderecos
    ADD CONSTRAINT fk_enderecos_bairros FOREIGN KEY (bai_id) REFERENCES les.bairros(bai_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enderecos fk_enderecos_ceps; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.enderecos
    ADD CONSTRAINT fk_enderecos_ceps FOREIGN KEY (cep_id) REFERENCES les.ceps(cep_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enderecos fk_enderecos_cidades; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.enderecos
    ADD CONSTRAINT fk_enderecos_cidades FOREIGN KEY (cid_id) REFERENCES les.cidades(cid_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enderecos fk_enderecos_logradouros; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.enderecos
    ADD CONSTRAINT fk_enderecos_logradouros FOREIGN KEY (log_id) REFERENCES les.logradouros(log_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enderecos fk_enderecos_paises; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.enderecos
    ADD CONSTRAINT fk_enderecos_paises FOREIGN KEY (pai_id) REFERENCES les.paises(pai_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enderecos fk_enderecos_tipos_residencias; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.enderecos
    ADD CONSTRAINT fk_enderecos_tipos_residencias FOREIGN KEY (tre_id) REFERENCES les.tipos_residencias(tre_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enderecos fk_enderecos_usuarios; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.enderecos
    ADD CONSTRAINT fk_enderecos_usuarios FOREIGN KEY (usu_id) REFERENCES les.usuarios(usu_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: entregas fk_entrega_vendas; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.entregas
    ADD CONSTRAINT fk_entrega_vendas FOREIGN KEY (ven_id) REFERENCES les.vendas(ven_id) ON DELETE CASCADE;


--
-- Name: pagamento fk_pagamento_vendas; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.pagamento
    ADD CONSTRAINT fk_pagamento_vendas FOREIGN KEY (ven_id) REFERENCES les.vendas(ven_id) ON DELETE CASCADE;


--
-- Name: telefones fk_telefones_tipos; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.telefones
    ADD CONSTRAINT fk_telefones_tipos FOREIGN KEY (ttp_id) REFERENCES les.tipos_telefones(ttp_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: telefones fk_telefones_usuarios; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.telefones
    ADD CONSTRAINT fk_telefones_usuarios FOREIGN KEY (usu_id) REFERENCES les.usuarios(usu_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: usuarios fk_usuarios_papeis; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.usuarios
    ADD CONSTRAINT fk_usuarios_papeis FOREIGN KEY (pap_id) REFERENCES les.papeis(pap_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vendas fk_venda_usuario; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.vendas
    ADD CONSTRAINT fk_venda_usuario FOREIGN KEY (usu_id) REFERENCES les.usuarios(usu_id);


--
-- Name: historico_entradas_estoque historico_entradas_estoque_for_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.historico_entradas_estoque
    ADD CONSTRAINT historico_entradas_estoque_for_id_fkey FOREIGN KEY (for_id) REFERENCES les.fornecedores(for_id);


--
-- Name: historico_entradas_estoque historico_entradas_estoque_liv_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.historico_entradas_estoque
    ADD CONSTRAINT historico_entradas_estoque_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES les.livros(liv_id);


--
-- Name: intencao_pagamento_simulado intencao_pagamento_simulado_inp_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.intencao_pagamento_simulado
    ADD CONSTRAINT intencao_pagamento_simulado_inp_id_fkey FOREIGN KEY (inp_id) REFERENCES les.intencao_pagamento(inp_id) ON DELETE CASCADE;


--
-- Name: intencao_pagamento_stripe intencao_pagamento_stripe_inp_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.intencao_pagamento_stripe
    ADD CONSTRAINT intencao_pagamento_stripe_inp_id_fkey FOREIGN KEY (inp_id) REFERENCES les.intencao_pagamento(inp_id) ON DELETE CASCADE;


--
-- Name: intencao_pagamento intencao_pagamento_ven_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.intencao_pagamento
    ADD CONSTRAINT intencao_pagamento_ven_id_fkey FOREIGN KEY (ven_id) REFERENCES les.vendas(ven_id) ON DELETE SET NULL;


--
-- Name: itens_venda itens_venda_liv_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.itens_venda
    ADD CONSTRAINT itens_venda_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES les.livros(liv_id);


--
-- Name: livro_categorias livro_categorias_cat_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.livro_categorias
    ADD CONSTRAINT livro_categorias_cat_id_fkey FOREIGN KEY (cat_id) REFERENCES les.categorias(cat_id) ON DELETE CASCADE;


--
-- Name: livro_categorias livro_categorias_liv_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.livro_categorias
    ADD CONSTRAINT livro_categorias_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES les.livros(liv_id) ON DELETE CASCADE;


--
-- Name: livros livros_aut_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.livros
    ADD CONSTRAINT livros_aut_id_fkey FOREIGN KEY (aut_id) REFERENCES les.autores(aut_id);


--
-- Name: livros livros_edi_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.livros
    ADD CONSTRAINT livros_edi_id_fkey FOREIGN KEY (edi_id) REFERENCES les.editoras(edi_id);


--
-- Name: livros livros_gpr_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.livros
    ADD CONSTRAINT livros_gpr_id_fkey FOREIGN KEY (gpr_id) REFERENCES les.grupos_precificacao(gpr_id);


--
-- Name: logradouros logradouros_tlo_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.logradouros
    ADD CONSTRAINT logradouros_tlo_id_fkey FOREIGN KEY (tlo_id) REFERENCES les.tipos_logradouros(tlo_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pagamento pagamento_inp_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.pagamento
    ADD CONSTRAINT pagamento_inp_id_fkey FOREIGN KEY (inp_id) REFERENCES les.intencao_pagamento(inp_id) ON DELETE SET NULL;


--
-- Name: pagamento_pix_simulado pagamento_pix_simulado_pag_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.pagamento_pix_simulado
    ADD CONSTRAINT pagamento_pix_simulado_pag_id_fkey FOREIGN KEY (pag_id) REFERENCES les.pagamento(pag_id) ON DELETE CASCADE;


--
-- Name: pagamento pagamento_stp_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.pagamento
    ADD CONSTRAINT pagamento_stp_id_fkey FOREIGN KEY (stp_id) REFERENCES les.status_pagamento(stp_id);


--
-- Name: pagamento pagamento_tpg_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.pagamento
    ADD CONSTRAINT pagamento_tpg_id_fkey FOREIGN KEY (tpg_id) REFERENCES les.tipo_pagamento(tpg_id);


--
-- Name: vendas vendas_cfr_id_fkey; Type: FK CONSTRAINT; Schema: les; Owner: ecm_user
--

ALTER TABLE ONLY les.vendas
    ADD CONSTRAINT vendas_cfr_id_fkey FOREIGN KEY (cfr_id) REFERENCES les.cotacao_frete(cfr_id) ON DELETE SET NULL;


--
-- Name: avaliacoes_livro avaliacoes_livro_liv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.avaliacoes_livro
    ADD CONSTRAINT avaliacoes_livro_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES public.livros(liv_id) ON DELETE CASCADE;


--
-- Name: avaliacoes_livro avaliacoes_livro_usu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.avaliacoes_livro
    ADD CONSTRAINT avaliacoes_livro_usu_id_fkey FOREIGN KEY (usu_id) REFERENCES public.usuarios(usu_id);


--
-- Name: carrinho_itens carrinho_itens_liv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.carrinho_itens
    ADD CONSTRAINT carrinho_itens_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES public.livros(liv_id) ON DELETE CASCADE;


--
-- Name: carrinho_itens carrinho_itens_usu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.carrinho_itens
    ADD CONSTRAINT carrinho_itens_usu_id_fkey FOREIGN KEY (usu_id) REFERENCES public.usuarios(usu_id) ON DELETE CASCADE;


--
-- Name: cartao_pagamento cartao_pagamento_pag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cartao_pagamento
    ADD CONSTRAINT cartao_pagamento_pag_id_fkey FOREIGN KEY (pag_id) REFERENCES public.pagamento(pag_id) ON DELETE CASCADE;


--
-- Name: ceps ceps_bai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ceps
    ADD CONSTRAINT ceps_bai_id_fkey FOREIGN KEY (bai_id) REFERENCES public.bairros(bai_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ceps ceps_cid_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ceps
    ADD CONSTRAINT ceps_cid_id_fkey FOREIGN KEY (cid_id) REFERENCES public.cidades(cid_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cotacao_frete_simulada cotacao_frete_simulada_cfr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cotacao_frete_simulada
    ADD CONSTRAINT cotacao_frete_simulada_cfr_id_fkey FOREIGN KEY (cfr_id) REFERENCES public.cotacao_frete(cfr_id) ON DELETE CASCADE;


--
-- Name: cotacao_frete cotacao_frete_ven_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cotacao_frete
    ADD CONSTRAINT cotacao_frete_ven_id_fkey FOREIGN KEY (ven_id) REFERENCES public.vendas(ven_id) ON DELETE SET NULL;


--
-- Name: cupons_troca cupons_troca_usu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cupons_troca
    ADD CONSTRAINT cupons_troca_usu_id_fkey FOREIGN KEY (usu_id) REFERENCES public.usuarios(usu_id);


--
-- Name: itens_venda ecm_item_venda_ven_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.itens_venda
    ADD CONSTRAINT ecm_item_venda_ven_id_fkey FOREIGN KEY (ven_id) REFERENCES public.vendas(ven_id) ON DELETE CASCADE;


--
-- Name: vendas ecm_venda_stv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT ecm_venda_stv_id_fkey FOREIGN KEY (stv_id) REFERENCES public.status_vendas(stv_id);


--
-- Name: entregas entrega_tfr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.entregas
    ADD CONSTRAINT entrega_tfr_id_fkey FOREIGN KEY (tfr_id) REFERENCES public.tipos_frete(tfr_id);


--
-- Name: estoques estoques_liv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.estoques
    ADD CONSTRAINT estoques_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES public.livros(liv_id) ON DELETE CASCADE;


--
-- Name: bairros fk_bairros_cidades; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.bairros
    ADD CONSTRAINT fk_bairros_cidades FOREIGN KEY (cid_id) REFERENCES public.cidades(cid_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cartoes fk_cartoes_bandeiras; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cartoes
    ADD CONSTRAINT fk_cartoes_bandeiras FOREIGN KEY (ban_id) REFERENCES public.bandeiras_cartao(ban_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cartoes fk_cartoes_usuarios; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cartoes
    ADD CONSTRAINT fk_cartoes_usuarios FOREIGN KEY (usu_id) REFERENCES public.usuarios(usu_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cidades fk_cidades_estados; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cidades
    ADD CONSTRAINT fk_cidades_estados FOREIGN KEY (est_id) REFERENCES public.estados(est_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: clientes fk_clientes_usuarios; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT fk_clientes_usuarios FOREIGN KEY (usu_id) REFERENCES public.usuarios(usu_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enderecos fk_enderecos_bairros; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.enderecos
    ADD CONSTRAINT fk_enderecos_bairros FOREIGN KEY (bai_id) REFERENCES public.bairros(bai_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enderecos fk_enderecos_ceps; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.enderecos
    ADD CONSTRAINT fk_enderecos_ceps FOREIGN KEY (cep_id) REFERENCES public.ceps(cep_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enderecos fk_enderecos_cidades; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.enderecos
    ADD CONSTRAINT fk_enderecos_cidades FOREIGN KEY (cid_id) REFERENCES public.cidades(cid_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enderecos fk_enderecos_logradouros; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.enderecos
    ADD CONSTRAINT fk_enderecos_logradouros FOREIGN KEY (log_id) REFERENCES public.logradouros(log_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enderecos fk_enderecos_paises; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.enderecos
    ADD CONSTRAINT fk_enderecos_paises FOREIGN KEY (pai_id) REFERENCES public.paises(pai_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enderecos fk_enderecos_tipos_residencias; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.enderecos
    ADD CONSTRAINT fk_enderecos_tipos_residencias FOREIGN KEY (tre_id) REFERENCES public.tipos_residencias(tre_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enderecos fk_enderecos_usuarios; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.enderecos
    ADD CONSTRAINT fk_enderecos_usuarios FOREIGN KEY (usu_id) REFERENCES public.usuarios(usu_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: entregas fk_entrega_vendas; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.entregas
    ADD CONSTRAINT fk_entrega_vendas FOREIGN KEY (ven_id) REFERENCES public.vendas(ven_id) ON DELETE CASCADE;


--
-- Name: pagamento fk_pagamento_vendas; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.pagamento
    ADD CONSTRAINT fk_pagamento_vendas FOREIGN KEY (ven_id) REFERENCES public.vendas(ven_id) ON DELETE CASCADE;


--
-- Name: telefones fk_telefones_tipos; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.telefones
    ADD CONSTRAINT fk_telefones_tipos FOREIGN KEY (ttp_id) REFERENCES public.tipos_telefones(ttp_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: telefones fk_telefones_usuarios; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.telefones
    ADD CONSTRAINT fk_telefones_usuarios FOREIGN KEY (usu_id) REFERENCES public.usuarios(usu_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: usuarios fk_usuarios_papeis; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuarios_papeis FOREIGN KEY (pap_id) REFERENCES public.papeis(pap_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vendas fk_venda_usuario; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT fk_venda_usuario FOREIGN KEY (usu_id) REFERENCES public.usuarios(usu_id);


--
-- Name: historico_entradas_estoque historico_entradas_estoque_for_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.historico_entradas_estoque
    ADD CONSTRAINT historico_entradas_estoque_for_id_fkey FOREIGN KEY (for_id) REFERENCES public.fornecedores(for_id);


--
-- Name: historico_entradas_estoque historico_entradas_estoque_liv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.historico_entradas_estoque
    ADD CONSTRAINT historico_entradas_estoque_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES public.livros(liv_id);


--
-- Name: intencao_pagamento_simulado intencao_pagamento_simulado_inp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.intencao_pagamento_simulado
    ADD CONSTRAINT intencao_pagamento_simulado_inp_id_fkey FOREIGN KEY (inp_id) REFERENCES public.intencao_pagamento(inp_id) ON DELETE CASCADE;


--
-- Name: intencao_pagamento_stripe intencao_pagamento_stripe_inp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.intencao_pagamento_stripe
    ADD CONSTRAINT intencao_pagamento_stripe_inp_id_fkey FOREIGN KEY (inp_id) REFERENCES public.intencao_pagamento(inp_id) ON DELETE CASCADE;


--
-- Name: intencao_pagamento intencao_pagamento_ven_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.intencao_pagamento
    ADD CONSTRAINT intencao_pagamento_ven_id_fkey FOREIGN KEY (ven_id) REFERENCES public.vendas(ven_id) ON DELETE SET NULL;


--
-- Name: itens_venda itens_venda_liv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.itens_venda
    ADD CONSTRAINT itens_venda_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES public.livros(liv_id);


--
-- Name: livro_categorias livro_categorias_cat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.livro_categorias
    ADD CONSTRAINT livro_categorias_cat_id_fkey FOREIGN KEY (cat_id) REFERENCES public.categorias(cat_id) ON DELETE CASCADE;


--
-- Name: livro_categorias livro_categorias_liv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.livro_categorias
    ADD CONSTRAINT livro_categorias_liv_id_fkey FOREIGN KEY (liv_id) REFERENCES public.livros(liv_id) ON DELETE CASCADE;


--
-- Name: livros livros_aut_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.livros
    ADD CONSTRAINT livros_aut_id_fkey FOREIGN KEY (aut_id) REFERENCES public.autores(aut_id);


--
-- Name: livros livros_edi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.livros
    ADD CONSTRAINT livros_edi_id_fkey FOREIGN KEY (edi_id) REFERENCES public.editoras(edi_id);


--
-- Name: livros livros_gpr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.livros
    ADD CONSTRAINT livros_gpr_id_fkey FOREIGN KEY (gpr_id) REFERENCES public.grupos_precificacao(gpr_id);


--
-- Name: logradouros logradouros_tlo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.logradouros
    ADD CONSTRAINT logradouros_tlo_id_fkey FOREIGN KEY (tlo_id) REFERENCES public.tipos_logradouros(tlo_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pagamento pagamento_inp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.pagamento
    ADD CONSTRAINT pagamento_inp_id_fkey FOREIGN KEY (inp_id) REFERENCES public.intencao_pagamento(inp_id) ON DELETE SET NULL;


--
-- Name: pagamento_pix_simulado pagamento_pix_simulado_pag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.pagamento_pix_simulado
    ADD CONSTRAINT pagamento_pix_simulado_pag_id_fkey FOREIGN KEY (pag_id) REFERENCES public.pagamento(pag_id) ON DELETE CASCADE;


--
-- Name: pagamento pagamento_stp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.pagamento
    ADD CONSTRAINT pagamento_stp_id_fkey FOREIGN KEY (stp_id) REFERENCES public.status_pagamento(stp_id);


--
-- Name: pagamento pagamento_tpg_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.pagamento
    ADD CONSTRAINT pagamento_tpg_id_fkey FOREIGN KEY (tpg_id) REFERENCES public.tipo_pagamento(tpg_id);


--
-- Name: vendas vendas_cfr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT vendas_cfr_id_fkey FOREIGN KEY (cfr_id) REFERENCES public.cotacao_frete(cfr_id) ON DELETE SET NULL;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: les; Owner: ecm_user
--

ALTER DEFAULT PRIVILEGES FOR ROLE ecm_user IN SCHEMA les GRANT ALL ON SEQUENCES TO ecm_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: les; Owner: ecm_user
--

ALTER DEFAULT PRIVILEGES FOR ROLE ecm_user IN SCHEMA les GRANT ALL ON TABLES TO ecm_user;


--
-- PostgreSQL database dump complete
--

\unrestrict ZUGbnnBnfcgmiRes08YazjpK8yt8E9IDTX0Hke2q2kdeUaed0bYe2bsoIvT3ou5

