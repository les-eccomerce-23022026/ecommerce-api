--
-- PostgreSQL database dump
--

\restrict 51HDJl15WbGE3gxarjJLO09fXLmL9oTm3EZcHOFYta1p4czdtJQ21CIUHTC5O38

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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
-- Name: gerar_trigrama_pagamento(); Type: FUNCTION; Schema: public; Owner: ecm_user
--

CREATE FUNCTION public.gerar_trigrama_pagamento() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.pag_uuid = gen_random_uuid();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.gerar_trigrama_pagamento() OWNER TO ecm_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- Name: ecm_entrega; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.ecm_entrega (
    ent_id integer NOT NULL,
    ent_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    ven_id integer NOT NULL,
    tfr_id integer NOT NULL,
    ent_endereco_json jsonb NOT NULL,
    ent_custo numeric(10,2) NOT NULL,
    ent_entregador character varying(100),
    ent_criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ecm_entrega_ent_custo_check CHECK ((ent_custo >= (0)::numeric))
);


ALTER TABLE public.ecm_entrega OWNER TO ecm_user;

--
-- Name: ecm_entrega_ent_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.ecm_entrega_ent_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ecm_entrega_ent_id_seq OWNER TO ecm_user;

--
-- Name: ecm_entrega_ent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.ecm_entrega_ent_id_seq OWNED BY public.ecm_entrega.ent_id;


--
-- Name: ecm_item_venda; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.ecm_item_venda (
    itv_id bigint NOT NULL,
    itv_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    ven_id bigint NOT NULL,
    liv_uuid uuid NOT NULL,
    itv_quantidade integer NOT NULL,
    itv_preco_unitario numeric(10,2) NOT NULL,
    itv_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    itv_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ecm_item_venda OWNER TO ecm_user;

--
-- Name: ecm_item_venda_itv_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.ecm_item_venda_itv_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ecm_item_venda_itv_id_seq OWNER TO ecm_user;

--
-- Name: ecm_item_venda_itv_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.ecm_item_venda_itv_id_seq OWNED BY public.ecm_item_venda.itv_id;


--
-- Name: ecm_status_venda; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.ecm_status_venda (
    stv_id integer NOT NULL,
    stv_descricao character varying(50) NOT NULL,
    stv_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ecm_status_venda OWNER TO ecm_user;

--
-- Name: ecm_status_venda_stv_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.ecm_status_venda_stv_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ecm_status_venda_stv_id_seq OWNER TO ecm_user;

--
-- Name: ecm_status_venda_stv_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.ecm_status_venda_stv_id_seq OWNED BY public.ecm_status_venda.stv_id;


--
-- Name: ecm_tipo_frete; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.ecm_tipo_frete (
    tfr_id integer NOT NULL,
    tfr_descricao character varying(100) NOT NULL,
    tfr_criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ecm_tipo_frete OWNER TO ecm_user;

--
-- Name: ecm_tipo_frete_tfr_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.ecm_tipo_frete_tfr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ecm_tipo_frete_tfr_id_seq OWNER TO ecm_user;

--
-- Name: ecm_tipo_frete_tfr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.ecm_tipo_frete_tfr_id_seq OWNED BY public.ecm_tipo_frete.tfr_id;


--
-- Name: ecm_venda; Type: TABLE; Schema: public; Owner: ecm_user
--

CREATE TABLE public.ecm_venda (
    ven_id bigint NOT NULL,
    ven_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usu_id bigint NOT NULL,
    stv_id integer NOT NULL,
    ven_total_itens numeric(10,2) NOT NULL,
    ven_frete numeric(10,2) NOT NULL,
    ven_total_venda numeric(10,2) NOT NULL,
    ven_criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ven_atualizado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ecm_venda OWNER TO ecm_user;

--
-- Name: ecm_venda_ven_id_seq; Type: SEQUENCE; Schema: public; Owner: ecm_user
--

CREATE SEQUENCE public.ecm_venda_ven_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ecm_venda_ven_id_seq OWNER TO ecm_user;

--
-- Name: ecm_venda_ven_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecm_user
--

ALTER SEQUENCE public.ecm_venda_ven_id_seq OWNED BY public.ecm_venda.ven_id;


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

COMMENT ON TABLE public.tipo_pagamento IS 'Tipos de pagamento aceitos (cartao_credito, cupom_troca, cupom_promocional).';


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
    usu_criado_em timestamp with time zone DEFAULT now() NOT NULL,
    usu_atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    usu_is_admin_mestre boolean DEFAULT false NOT NULL
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
-- Name: bairros bai_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.bairros ALTER COLUMN bai_id SET DEFAULT nextval('public.bairros_bai_id_seq'::regclass);


--
-- Name: bandeiras_cartao ban_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.bandeiras_cartao ALTER COLUMN ban_id SET DEFAULT nextval('public.bandeiras_cartao_ban_id_seq'::regclass);


--
-- Name: cartao_pagamento cpp_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cartao_pagamento ALTER COLUMN cpp_id SET DEFAULT nextval('public.cartao_pagamento_cpp_id_seq'::regclass);


--
-- Name: cartoes crt_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.cartoes ALTER COLUMN crt_id SET DEFAULT nextval('public.cartoes_crt_id_seq'::regclass);


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
-- Name: ecm_entrega ent_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_entrega ALTER COLUMN ent_id SET DEFAULT nextval('public.ecm_entrega_ent_id_seq'::regclass);


--
-- Name: ecm_item_venda itv_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_item_venda ALTER COLUMN itv_id SET DEFAULT nextval('public.ecm_item_venda_itv_id_seq'::regclass);


--
-- Name: ecm_status_venda stv_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_status_venda ALTER COLUMN stv_id SET DEFAULT nextval('public.ecm_status_venda_stv_id_seq'::regclass);


--
-- Name: ecm_tipo_frete tfr_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_tipo_frete ALTER COLUMN tfr_id SET DEFAULT nextval('public.ecm_tipo_frete_tfr_id_seq'::regclass);


--
-- Name: ecm_venda ven_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_venda ALTER COLUMN ven_id SET DEFAULT nextval('public.ecm_venda_ven_id_seq'::regclass);


--
-- Name: enderecos end_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.enderecos ALTER COLUMN end_id SET DEFAULT nextval('public.enderecos_end_id_seq'::regclass);


--
-- Name: estados est_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.estados ALTER COLUMN est_id SET DEFAULT nextval('public.estados_est_id_seq'::regclass);


--
-- Name: logradouros log_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.logradouros ALTER COLUMN log_id SET DEFAULT nextval('public.logradouros_log_id_seq'::regclass);


--
-- Name: pagamento pag_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.pagamento ALTER COLUMN pag_id SET DEFAULT nextval('public.pagamento_pag_id_seq'::regclass);


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
-- Name: telefones tel_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.telefones ALTER COLUMN tel_id SET DEFAULT nextval('public.telefones_tel_id_seq'::regclass);


--
-- Name: tipo_pagamento tpg_id; Type: DEFAULT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.tipo_pagamento ALTER COLUMN tpg_id SET DEFAULT nextval('public.tipo_pagamento_tpg_id_seq'::regclass);


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
-- Name: ecm_entrega ecm_entrega_ent_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_entrega
    ADD CONSTRAINT ecm_entrega_ent_uuid_key UNIQUE (ent_uuid);


--
-- Name: ecm_entrega ecm_entrega_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_entrega
    ADD CONSTRAINT ecm_entrega_pkey PRIMARY KEY (ent_id);


--
-- Name: ecm_item_venda ecm_item_venda_itv_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_item_venda
    ADD CONSTRAINT ecm_item_venda_itv_uuid_key UNIQUE (itv_uuid);


--
-- Name: ecm_item_venda ecm_item_venda_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_item_venda
    ADD CONSTRAINT ecm_item_venda_pkey PRIMARY KEY (itv_id);


--
-- Name: ecm_status_venda ecm_status_venda_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_status_venda
    ADD CONSTRAINT ecm_status_venda_pkey PRIMARY KEY (stv_id);


--
-- Name: ecm_status_venda ecm_status_venda_stv_descricao_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_status_venda
    ADD CONSTRAINT ecm_status_venda_stv_descricao_key UNIQUE (stv_descricao);


--
-- Name: ecm_tipo_frete ecm_tipo_frete_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_tipo_frete
    ADD CONSTRAINT ecm_tipo_frete_pkey PRIMARY KEY (tfr_id);


--
-- Name: ecm_tipo_frete ecm_tipo_frete_tfr_descricao_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_tipo_frete
    ADD CONSTRAINT ecm_tipo_frete_tfr_descricao_key UNIQUE (tfr_descricao);


--
-- Name: ecm_venda ecm_venda_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_venda
    ADD CONSTRAINT ecm_venda_pkey PRIMARY KEY (ven_id);


--
-- Name: ecm_venda ecm_venda_ven_uuid_key; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_venda
    ADD CONSTRAINT ecm_venda_ven_uuid_key UNIQUE (ven_uuid);


--
-- Name: enderecos enderecos_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.enderecos
    ADD CONSTRAINT enderecos_pkey PRIMARY KEY (end_id);


--
-- Name: estados estados_pkey; Type: CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.estados
    ADD CONSTRAINT estados_pkey PRIMARY KEY (est_id);


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
-- Name: idx_entrega_uuid; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_entrega_uuid ON public.ecm_entrega USING btree (ent_uuid);


--
-- Name: idx_entrega_venda; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_entrega_venda ON public.ecm_entrega USING btree (ven_id);


--
-- Name: idx_item_venda_uuid; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_item_venda_uuid ON public.ecm_item_venda USING btree (itv_uuid);


--
-- Name: idx_item_venda_venda; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_item_venda_venda ON public.ecm_item_venda USING btree (ven_id);


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
-- Name: idx_venda_status; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_venda_status ON public.ecm_venda USING btree (stv_id);


--
-- Name: idx_venda_usuario; Type: INDEX; Schema: public; Owner: ecm_user
--

CREATE INDEX idx_venda_usuario ON public.ecm_venda USING btree (usu_id);


--
-- Name: cartoes tg_cartoes_atualizado_em; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_cartoes_atualizado_em BEFORE UPDATE ON public.cartoes FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_timestamp();


--
-- Name: clientes tg_clientes_atualizado_em; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_clientes_atualizado_em BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_timestamp();


--
-- Name: enderecos tg_enderecos_atualizado_em; Type: TRIGGER; Schema: public; Owner: ecm_user
--

CREATE TRIGGER tg_enderecos_atualizado_em BEFORE UPDATE ON public.enderecos FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_timestamp();


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
-- Name: ecm_entrega ecm_entrega_tfr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_entrega
    ADD CONSTRAINT ecm_entrega_tfr_id_fkey FOREIGN KEY (tfr_id) REFERENCES public.ecm_tipo_frete(tfr_id);


--
-- Name: ecm_entrega ecm_entrega_ven_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_entrega
    ADD CONSTRAINT ecm_entrega_ven_id_fkey FOREIGN KEY (ven_id) REFERENCES public.ecm_venda(ven_id) ON DELETE CASCADE;


--
-- Name: ecm_item_venda ecm_item_venda_ven_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_item_venda
    ADD CONSTRAINT ecm_item_venda_ven_id_fkey FOREIGN KEY (ven_id) REFERENCES public.ecm_venda(ven_id) ON DELETE CASCADE;


--
-- Name: ecm_venda ecm_venda_stv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_venda
    ADD CONSTRAINT ecm_venda_stv_id_fkey FOREIGN KEY (stv_id) REFERENCES public.ecm_status_venda(stv_id);


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
-- Name: ecm_venda fk_venda_usuario; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.ecm_venda
    ADD CONSTRAINT fk_venda_usuario FOREIGN KEY (usu_id) REFERENCES public.usuarios(usu_id);


--
-- Name: logradouros logradouros_tlo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.logradouros
    ADD CONSTRAINT logradouros_tlo_id_fkey FOREIGN KEY (tlo_id) REFERENCES public.tipos_logradouros(tlo_id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: pagamento pagamento_ven_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecm_user
--

ALTER TABLE ONLY public.pagamento
    ADD CONSTRAINT pagamento_ven_id_fkey FOREIGN KEY (ven_id) REFERENCES public.ecm_venda(ven_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 51HDJl15WbGE3gxarjJLO09fXLmL9oTm3EZcHOFYta1p4czdtJQ21CIUHTC5O38

