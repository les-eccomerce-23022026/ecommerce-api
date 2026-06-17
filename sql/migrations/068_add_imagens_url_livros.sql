-- Migration: 068_add_imagens_url_livros.sql
-- Descrição: Adiciona URLs de imagens para os livros do catálogo demo (migration 065)
-- Data: 2026-06-01
-- Motivo: Os livros da migration 065 foram criados sem liv_imagem_url, resultando em imagens não aparecendo no frontend

BEGIN;

-- Usar uma URL de imagem simples e confiável (via.placeholder.com)
UPDATE livraria_comercial.livros SET liv_imagem_url = 'https://via.placeholder.com/300x450/8B4513/FFFFFF?text=Crime+e+Castigo' WHERE liv_titulo = 'Crime e Castigo';
UPDATE livraria_comercial.livros SET liv_imagem_url = 'https://via.placeholder.com/300x450/4169E1/FFFFFF?text=Orgulho+e+Preconceito' WHERE liv_titulo = 'Orgulho e Preconceito';
UPDATE livraria_comercial.livros SET liv_imagem_url = 'https://via.placeholder.com/300x450/228B22/FFFFFF?text=Cem+Anos+de+Solidao' WHERE liv_titulo = 'Cem Anos de Solidão';
UPDATE livraria_comercial.livros SET liv_imagem_url = 'https://via.placeholder.com/300x450/FFD700/000000?text=A+Hora+da+Estrela' WHERE liv_titulo = 'A Hora da Estrela';
UPDATE livraria_comercial.livros SET liv_imagem_url = 'https://via.placeholder.com/300x450/708090/FFFFFF?text=Memorias+Postumas' WHERE liv_titulo = 'Memórias Póstumas de Brás Cubas';
UPDATE livraria_comercial.livros SET liv_imagem_url = 'https://via.placeholder.com/300x450/DC143C/FFFFFF?text=O+Alquimista' WHERE liv_titulo = 'O Alquimista';
UPDATE livraria_comercial.livros SET liv_imagem_url = 'https://via.placeholder.com/300x450/9932CC/FFFFFF?text=Grande+Sertao' WHERE liv_titulo = 'Grande Sertão: Veredas';
UPDATE livraria_comercial.livros SET liv_imagem_url = 'https://via.placeholder.com/300x450/B8860B/FFFFFF?text=Vidas+Secas' WHERE liv_titulo = 'Vidas Secas';
UPDATE livraria_comercial.livros SET liv_imagem_url = 'https://via.placeholder.com/300x450/20B2AA/FFFFFF?text=Capitaes+da+Areia' WHERE liv_titulo = 'Capitães da Areia';
UPDATE livraria_comercial.livros SET liv_imagem_url = 'https://via.placeholder.com/300x450/FF69B4/FFFFFF?text=O+Pequeno+Principe' WHERE liv_titulo = 'O Pequeno Príncipe';

-- Para os demais livros, usar uma imagem genérica
UPDATE livraria_comercial.livros SET liv_imagem_url = 'https://via.placeholder.com/300x450/666666/FFFFFF?text=Livro' 
WHERE liv_imagem_url IS NULL AND liv_ativo = TRUE;

COMMIT;
