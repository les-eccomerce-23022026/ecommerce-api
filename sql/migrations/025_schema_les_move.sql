-- Migration: Move objects to 'les' schema
-- Version: 025

BEGIN;

CREATE SCHEMA IF NOT EXISTS les;

-- Tables (Associated sequences, indexes and triggers move automatically)
ALTER TABLE public.papeis SET SCHEMA les;
ALTER TABLE public.tipos_telefones SET SCHEMA les;
ALTER TABLE public.estados SET SCHEMA les;
ALTER TABLE public.tipos_logradouros SET SCHEMA les;
ALTER TABLE public.enderecos SET SCHEMA les;
ALTER TABLE public.tipos_residencias SET SCHEMA les;
ALTER TABLE public.paises SET SCHEMA les;
ALTER TABLE public.tipo_pagamento SET SCHEMA les;
ALTER TABLE public.status_pagamento SET SCHEMA les;
ALTER TABLE public.pagamento SET SCHEMA les;
ALTER TABLE public.bandeiras_cartao SET SCHEMA les;
ALTER TABLE public.usuarios SET SCHEMA les;
ALTER TABLE public.clientes SET SCHEMA les;
ALTER TABLE public.telefones SET SCHEMA les;
ALTER TABLE public.cartoes SET SCHEMA les;
ALTER TABLE public.cartao_pagamento SET SCHEMA les;
ALTER TABLE public.cidades SET SCHEMA les;
ALTER TABLE public.bairros SET SCHEMA les;
ALTER TABLE public.configuracoes_app SET SCHEMA les;
ALTER TABLE public.status_vendas SET SCHEMA les;
ALTER TABLE public.ceps SET SCHEMA les;
ALTER TABLE public.logradouros SET SCHEMA les;
ALTER TABLE public.itens_venda SET SCHEMA les;
ALTER TABLE public.entregas SET SCHEMA les;
ALTER TABLE public.fornecedores SET SCHEMA les;
ALTER TABLE public.tipos_frete SET SCHEMA les;
ALTER TABLE public.autores SET SCHEMA les;
ALTER TABLE public.livros SET SCHEMA les;
ALTER TABLE public.editoras SET SCHEMA les;
ALTER TABLE public.grupos_precificacao SET SCHEMA les;
ALTER TABLE public.livro_categorias SET SCHEMA les;
ALTER TABLE public.categorias SET SCHEMA les;
ALTER TABLE public.historico_entradas_estoque SET SCHEMA les;
ALTER TABLE public.estoques SET SCHEMA les;
ALTER TABLE public.avaliacoes_livro SET SCHEMA les;
ALTER TABLE public.carrinho_itens SET SCHEMA les;
ALTER TABLE public.intencao_pagamento SET SCHEMA les;
ALTER TABLE public.intencao_pagamento_simulado SET SCHEMA les;
ALTER TABLE public.intencao_pagamento_stripe SET SCHEMA les;
ALTER TABLE public.cotacao_frete SET SCHEMA les;
ALTER TABLE public.cotacao_frete_simulada SET SCHEMA les;
ALTER TABLE public.vendas SET SCHEMA les;
ALTER TABLE public.pagamento_pix_simulado SET SCHEMA les;

-- Functions (ALTER FUNCTION does not support IF EXISTS in all PG versions)
ALTER FUNCTION public.fn_atualizar_timestamp() SET SCHEMA les;
ALTER FUNCTION public.fn_atualizar_timestamp_livros_estoque() SET SCHEMA les;
ALTER FUNCTION public.fn_atualizar_timestamp_pagamento() SET SCHEMA les;
ALTER FUNCTION public.fn_gerar_trigrama_autores() SET SCHEMA les;
ALTER FUNCTION public.fn_gerar_trigrama_categorias() SET SCHEMA les;
ALTER FUNCTION public.fn_gerar_trigrama_editoras() SET SCHEMA les;
ALTER FUNCTION public.fn_gerar_trigrama_fornecedores() SET SCHEMA les;
ALTER FUNCTION public.fn_gerar_trigrama_livros() SET SCHEMA les;
ALTER FUNCTION public.fn_normalizar_texto(text) SET SCHEMA les;

-- Permissions
DO $$
DECLARE
    curr_user text;
BEGIN
    SELECT current_user INTO curr_user;
    EXECUTE 'GRANT USAGE ON SCHEMA les TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA les TO ' || curr_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA les TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA les GRANT ALL ON TABLES TO ' || curr_user;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA les GRANT ALL ON SEQUENCES TO ' || curr_user;
END $$;

COMMIT;
