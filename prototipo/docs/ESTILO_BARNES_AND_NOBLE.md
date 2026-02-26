# Diretrizes de Estilo e UI/UX: Inspirado na Barnes & Noble

Este documento define as diretrizes de estilo, identidade visual e comportamento da interface do usuário (UI) para o protótipo HTML do E-Commerce de Livros (LES), substituindo estilos genéricos por uma estética inspirada no layout clássico, elegante e focado em leitura da **Barnes & Noble**.

Estas especificações devem ser aplicadas em todas as telas listadas no documento [PROTOTIPO_HTML_IMPLEMENTACAO.md](./PROTOTIPO_HTML_IMPLEMENTACAO.md).

---

## 1. Identidade Visual e Atmosfera

A interface deve transmitir a sensação de uma livraria tradicional e sofisticada, porém com uma experiência de navegação digital moderna, clara e focada no conteúdo (as capas dos livros).

### 1.1. Paleta de Cores
A paleta prioriza cores neutras quentes (lembrando o papel) e verdes profundos característicos.

- **Cor Primária (Brand Color):** `#0F4C3A` (Verde Floresta Profundo) - Usado no Header, rodapé, botões principais de ação (como "Adicionar ao Carrinho").
- **Cor Secundária (Acentos):** `#D2B48C` (Caqui/Dourado Mudo) ou `#B9935A` - Usado para estrelas de avaliação, badges de destaque, sublinhados sutis.
- **Cor de Fundo Principal:** `#FDFBF7` (Off-white / Bege bem claro) - Reduz o cansaço visual, lembrando páginas de livros físicos. É o fundo de quase toda a aplicação.
- **Cores de Texto:**
  - **Texto Principal (Títulos):** `#1A1A1A` (Preto/Cinza muito escuro) - Maior contraste e seriedade.
  - **Texto Secundário (Corpo/Descrições):** `#4A4A4A` (Cinza médio).
- **Cores de Alertas/Sistema:**
  - **Erro:** `#C9302C` (Vermelho tijolo)
  - **Sucesso:** `#2E7D32` (Verde padrão)
  - **Aviso:** `#F57F17` (Amarelo terroso)

### 1.2. Tipografia
Como se trata de uma livraria, a tipografia é crucial. Combina-se uma fonte Serif elegante para títulos (trazendo o lado clássico) com uma fonte Sans-serif limpa para a leitura na tela.

- **Títulos e Cabeçalhos (H1, H2, H3):** `Merriweather`, `Lora` ou `Playfair Display` (Serifa).
  - *Estilo:* Tamanhos grandes, peso médio a negrito.
- **Corpo do Texto e Interface (Botões, Menus, Pág. Administrativas):** `Lato`, `Inter` ou `Open Sans` (Sem Serifa).
  - *Estilo:* Tamanhos variando entre 14px a 16px, priorizando legibilidade nas descrições e formulários.

---

## 2. Elementos de Interface Globais

### 2.1. Botões
- **Botão Primário (Solid):** Fundo Verde Floresta (`#0F4C3A`), texto branco, cantos levemente arredondados (`border-radius: 4px`). 
  - *Hover:* Fundo verde mais escuro (`#0A3326`). Efeito de transição suave (`transition: background 0.3s`).
- **Botão Secundário (Outline):** Sem fundo, borda Verde Floresta, texto Verde Floresta.
  - *Hover:* Fundo Verde Floresta claro/transparente, ou preenchimento sólido.
- **Botões Administrativos:** No Backoffice, botões podem ser menores e mais funcionais (usando variações de azul e cinza para não conflitar com a identidade da loja, focando em utilidade).

### 2.2. Capas de Livros e Cards (Grid de Produtos)
- **Proporção da Capa:** As imagens das capas devem dominar o card do produto. Proporção retangular vertical.
- **Efeitos no Card:** Fundo do card em branco puro (`#FFFFFF`) para destacar do fundo beige, borda fina cinza claro (`border: 1px solid #EAEAEA`).
- **Sombra (Shadows):** Sombras devem ser sutis. Ao passar o mouse (*hover*) em um card de livro, adicionar um `box-shadow` suave e elevar o card levemente (`transform: translateY(-3px)`) para incentivar o clique.

### 2.3. Formulários (Inputs)
- Inputs clean: fundo totalmente branco, borda cinza clara (`#CCC`), `padding` confortável (mínimo 10px).
- Ao focar no input (`:focus`), a borda deve mudar para o Verde Primário (`#0F4C3A`), reforçando onde o usuário está sem ser agressivo.
- Labels ficam acima do input para melhor leitura.

---

## 3. Aplicação nas Telas do Protótipo (Visão Cliente)

### 3.1. Navegação (Header & Footer)
- **Header:** Um bloco sólido superior em Verde Primário. Deve conter o logo em branco/dourado centralizado ou alinhado à esquerda. Barra de busca generosa centralizada (fundo branco, ícone de lupa) e ícones limpos na direita (Minha Conta, Carrinho).
- **Navegação Secundária:** Uma barra creme ou branca logo abaixo do header verde, contendo as categorias (Ficção, Não-Ficção, Romance, etc.) com links discretos que sublinham ao *hover*.

### 3.2. Home / Catálogo de Produtos
- **Banners:** Carrossel elegante no topo com promoções, preferencialmente sem sobrecarregar com cores berrantes; usar imagens de alta qualidade que mesclem com o tom do site.
- **Grid de Livros:** Alinhados em grade (4 ou 5 por linha no Desktop). O título do livro em fonte serifada, abreviado com reticências se necessário, autor menor em cinza, preço em destaque.

### 3.3. Detalhes do Livro (Página do Produto)
- Duas colunas em Desktop:
  - **Coluna Esquerda:** Foca na imagem do livro grandiosa, com sombra imitando espessura de páginas.
  - **Coluna Direita:** Título em fonte com serifa bem grande (`H1`), autor com link, avaliação em estrelas douradas (`#B9935A`). Preço em fonte sans-serif pesada. Botão grande "Adicionar ao Carrinho".
- **Sinopse e Ficha Técnica:** Seções separadas por linhas finas sutis (`<hr>` cinza claro). A sinopse em uma bloco de texto com largura máxima de ~700px (para leitura confortável).

### 3.4. Carrinho e Checkout (Cálculo de Frete)
- **Design Limpo e Fechado:** Durante o checkout, esconder excesso de links no Header (como categorias) para não distrair o cliente. Focar apenas nos passos (breadcrumbs de progresso bem destacados).
- **Carrinho:** Lista limpa estilo tabela, imagem da capa miniatura. Subtotais claramente justificados à direita.
- O campo de CEP (Cálculo de Frete) deve ser próximo ao botão de finalização.

### 3.5. Área do Usuário (Minha Conta, Meus Endereços, Pedidos)
- **Menu Lateral:** Um menu discreto à esquerda listando as áreas (Perfil, Endereços, Cartões, Pedidos). O link ativo deve ter cor e um filete lateral destacando sua seleção.
- **Design:** Painéis simples (`div` com fundo branco em cima de um fundo um pouco mais cinza/creme), tabelas bem espaçadas para o histórico de pedidos e botões de ação ("Solicitar Troca") bem contextualizados.

---

## 4. Aplicação nas Telas do Protótipo (Visão Administrativa)

O Backoffice **não precisa** focar intensamente na atmosfera de "livraria Barnes & Noble", mas sim em UX para dashboards e inserção de dados.
- Fundo cinza claro padrão (`#F4F6F9`).
- **Sidebar (Menu Lateral):** Escuro (`#1A1A1A` ou o Verde Floresta do logo), com a navegação administrativa (Dashboard, Livros, Estoque).
- **Formulários Extensos (Cadastro de Livros):** Uso de Cards brancos ou abas/accordions para separar (Identificação, Precificação, Dimensões).
- **Tabelas de Dados:** Listagens de livros e gestão de estoque em tabelas compactas, ordenáveis, com ações (Ativar/Desativar, Editar) em ícones limpos minimalistas.
- **Gráficos (Dashboard Analytics):** Uso de bibliotecas simples de gráfico (como Chart.js), integrando-se visualmente usando a paleta de cores institucional no lugar de cores genéricas.
