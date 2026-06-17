#!/bin/bash

# Script para popular 5 livros reais em cada categoria com estoque > 10
# Categorias: Tecnologia, Fantasia, Literatura Brasileira, Distopia, Young Adult,
# Desenvolvimento Pessoal, Clássicos, Terror, Filosofia, História, Biografia,
# Ficção Científica, Aventura, Humor, Infantil, Romance, Negócios, Ciência, Mistério

API_URL="http://localhost:5001/api/admin/livros"
ADMIN_EMAIL="admintest@email.com"
ADMIN_SENHA="ASDF@asdf123"

# Login e obter token
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"senha\":\"$ADMIN_SENHA\"}" \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token obtido: ${TOKEN:0:20}..."

# Função para criar livro
criar_livro() {
  local titulo="$1"
  local autor="$2"
  local categoria="$3"
  local isbn="$4"
  local preco="$5"
  local estoque="$6"
  local paginas="$7"
  local ano="$8"
  local sinopse="$9"

  curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"titulo\":\"$titulo\",
      \"autor\":\"$autor\",
      \"editora\":\"HarperCollins\",
      \"grupoPrecificacaoNome\":\"Varejo\",
      \"categoria\":\"$categoria\",
      \"isbn\":\"$isbn\",
      \"preco\":$preco,
      \"estoque\":$estoque,
      \"numeroPaginas\":$paginas,
      \"ano\":$ano,
      \"sinopse\":\"$sinopse\"
    }"
}

# Livros por categoria (todos com autores existentes no banco)
declare -A LIVROS=(
  ["Tecnologia"]="Clean Code|Robert C. Martin|978-0132350884|89.90|15|464|2008|Código limpo e práticas de desenvolvimento de software eficaz e sustentável
The Pragmatic Programmer|Robert C. Martin|978-0201616224|69.90|20|352|1999|Aprenda a programar de forma eficiente e entregue valor aos seus clientes
Design Patterns|Robert C. Martin|978-0201633610|129.90|18|416|1994|Padrões de projeto reutilizáveis para software orientado a objetos
Refactoring|Robert C. Martin|978-0201485677|99.90|12|448|1999|Melhore o design de código existente sem alterar seu comportamento externo
Introduction to Algorithms|Robert C. Martin|978-0262033848|159.90|25|1312|2009|Abordagem abrangente para projeto e análise de algoritmos"

  ["Fantasia"]="The Hobbit|J.R.R. Tolkien|978-0547928227|49.90|30|310|2012|Uma jornada inesquecível através da Terra Média em busca de tesouro e aventura
The Name of the Wind|J.R.R. Tolkien|978-0756404741|59.90|22|662|2007|A história lendária de Kvothe, o matador de reis, narrada por ele próprio
Mistborn|J.R.R. Tolkien|978-0765326292|54.90|18|541|2006|Um mundo onde metais dão poderes e um grupo de ladrões planeja derrubar um império
The Way of Kings|J.R.R. Tolkien|978-0765326355|69.90|15|1007|2010|Uma épica fantasia em um mundo de tempestades e espadas mágicas
A Game of Thrones|George R.R. Martin|978-0553593716|59.90|20|835|1996|Intrigas políticas e guerras pelo poder em um mundo medieval brutal"

  ["Literatura Brasileira"]="Capitães da Areia|Machado de Assis|978-8501042960|39.90|25|350|1937|A vida de um grupo de menores abandonados nas ruas de Salvador
Dom Casmurro|Machado de Assis|978-8501042953|29.90|30|280|1899|Um clássico da literatura brasileira sobre ciúme e traição
Vidas Secas|Machado de Assis|978-8501042946|34.90|20|160|1938|A luta de uma família sertaneja contra a seca e a adversidade
Memórias Póstumas de Brás Cubas|Machado de Assis|978-8501042939|32.90|18|280|1881|Um romance póstumo narrado por um defunto sobre sua vida sem sentido
O Cortiço|Machado de Assis|978-8501042922|36.90|22|280|1890|Um romance naturalista sobre a vida em um cortiço carioca"

  ["Distopia"]="1984|George Orwell|978-0451524935|39.90|25|328|1949|Um futuro totalitário onde o Grande Irmão vigia todos os cidadãos
Brave New World|George Orwell|978-0060850524|44.90|20|288|1932|Uma sociedade perfeita onde a estabilidade é mantida através de controle genético
Fahrenheit 451|George Orwell|978-1451673319|34.90|22|194|1953|Um futuro onde livros são proibidos e incinerados por bombeiros
The Handmaid's Tale|George Orwell|978-0385490818|49.90|18|311|1985|Uma distopia feminista onde mulheres são submetidas a um regime teocrático
The Hunger Games|George Orwell|978-0439023528|39.90|30|374|2008|Um reality show mortal onde jovens lutam até a morte em um futuro distópico"

  ["Young Adult"]="The Fault in Our Stars|J.K. Rowling|978-0142424179|39.90|25|313|2012|Uma história de amor entre dois adolescentes com câncer
Divergent|J.K. Rowling|978-0062024039|44.90|20|487|2011|Em uma sociedade dividida por facções, uma jovem descobre sua verdadeira natureza
The Maze Runner|J.K. Rowling|978-0385737944|39.90|22|375|2009|Um grupo de jovens tenta escapar de um labirinto mortal sem memória
Harry Potter and the Sorcerer's Stone|J.K. Rowling|978-0590353427|49.90|30|309|1997|Um jovem bruxo descobre seu destino na Escola de Magia e Bruxaria de Hogwarts
Twilight|J.K. Rowling|978-0316015844|39.90|18|498|2005|Um romance entre uma humana e um vampiro em uma pequena cidade"

  ["Desenvolvimento Pessoal"]="Atomic Habits|Machado de Assis|978-0735211292|49.90|25|320|2018|Pequenas mudanças que geram resultados extraordinários em hábitos e rotinas
The 7 Habits of Highly Effective People|Machado de Assis|978-0743269513|49.90|20|381|1989|Sete hábitos eficazes para transformar sua vida pessoal e profissional
How to Win Friends and Influence People|Machado de Assis|978-0671723651|39.90|30|292|1936|Princípios fundamentais para lidar com pessoas e alcançar sucesso
Mindset|Machado de Assis|978-0345472328|44.90|18|280|2006|A nova psicologia do sucesso e como o mindset afeta nossa capacidade de aprender
The Power of Now|Machado de Assis|978-1577314806|34.90|22|236|1997|Um guia para iluminação espiritual e viver no momento presente"

  ["Clássicos"]="Pride and Prejudice|Agatha Christie|978-0141439518|29.90|25|432|1950|Um romance satírico sobre a sociedade inglesa e as relações familiares
Wuthering Heights|Agatha Christie|978-0141439556|34.90|20|400|1950|Uma história de amor e vingança nas charnecas da Inglaterra vitoriana
Jane Eyre|Agatha Christie|978-0141441146|32.90|18|507|1950|A jornada de uma órfã que busca independência e amor em um mundo hostil
The Great Gatsby|Agatha Christie|978-0743273565|29.90|22|180|1950|Uma crítica à sociedade americana dos anos 20 através dos olhos de Nick Carraway
To Kill a Mockingbird|Agatha Christie|978-0061120084|34.90|30|336|1950|Um advogado defende um homem negro injustamente acusado no sul racista dos EUA"

  ["Terror"]="Dracula|Bram Stoker|978-0141439846|34.90|20|488|1950|O conde vampiro que aterroriza a Transilvânia e busca refúgio em Londres
Frankenstein|Bram Stoker|978-0141439471|29.90|18|280|1950|Um cientista cria um monstro que se volta contra seu criador
The Shining|Stephen King|978-0307743657|44.90|22|688|1977|Uma família isolada em um hotel durante o inverno enfrenta forças sobrenaturais
It|Stephen King|978-1501142970|49.90|25|1138|1986|Um grupo de crianças enfrenta um mal ancestral que se manifesta como um palhaço assassino
The Exorcist|Stephen King|978-0061007224|39.90|18|400|1970|Um padre tenta exorcizar um demônio que possui uma jovem garota"

  ["Filosofia"]="Meditations|Augusto César|978-0140449334|34.90|20|352|1950|Reflexões estoicas sobre a vida e a natureza humana escritas por um imperador romano
Beyond Good and Evil|Augusto César|978-0140449235|39.90|18|240|1950|Uma crítica radical aos fundamentos da moralidade e filosofia ocidental
The Republic|Augusto César|978-0140455113|29.90|25|416|1950|Um diálogo sobre justiça e a sociedade ideal através dos olhos de Sócrates
Being and Time|Augusto César|978-0061575594|59.90|15|589|1950|Uma análise fundamental da existência humana e do conceito de ser
The Art of War|Augusto César|978-1599869773|24.90|30|273|1950|Um tratado estratégico sobre guerra e liderança aplicado aos negócios"

  ["Romance"]="Pride and Prejudice|Agatha Christie|978-0141439518|29.90|25|432|1950|Um romance satírico sobre a sociedade inglesa e as relações familiares
Jane Eyre|Agatha Christie|978-0141441146|32.90|18|507|1950|A jornada de uma órfã que busca independência e amor em um mundo hostil
Sense and Sensibility|Agatha Christie|978-0141439517|27.90|20|368|1950|Duas irmãs com personalidades opostas navegam pelo amor e sociedade
Wuthering Heights|Agatha Christie|978-0141439556|34.90|22|400|1950|Uma história de amor e vingança nas charnecas da Inglaterra vitoriana
Anna Karenina|Agatha Christie|978-0143035008|49.90|15|964|1950|Uma tragedy sobre amor adultério e a sociedade aristocrática russa"

  ["Negócios"]="The Lean Startup|Frank Herbert|978-0307887894|49.90|25|336|2011|Como criar negócios inovadores através de experimentos validados
Good to Great|Frank Herbert|978-0066620992|44.90|20|320|2001|Por que algumas empresas fazem a transição de boas para ótimas
Thinking, Fast and Slow|Frank Herbert|978-0374533557|59.90|18|499|2011|Como os dois sistemas de pensamento moldam nossas decisões
The Innovator's Dilemma|Frank Herbert|978-0062060240|49.90|22|336|1997|Por que empresas bem-sucedidas falham ao inovar
Zero to One|Frank Herbert|978-0804139298|39.90|15|224|2014|Notas sobre startups e como construir o futuro"

  ["Ciência"]="A Brief History of Time|Frank Herbert|978-0553380163|39.90|25|212|1988|Uma exploração acessível do universo, do Big Bang aos buracos negros
The Selfish Gene|Frank Herbert|978-0199291151|44.90|20|360|1976|Uma perspectiva evolutiva sobre genes como unidades de seleção natural
Cosmos|Frank Herbert|978-0345331359|34.90|18|365|1980|Uma jornada pessoal pelo universo e nossa busca por significado
The Gene|Frank Herbert|978-1476733500|49.90|22|608|2016|Uma história íntima do gene e seu impacto na humanidade
Silent Spring|Frank Herbert|978-0618249060|34.90|15|368|1962|Um clássico ambiental sobre os perigos dos pesticidas"

  ["Mistério"]="The Girl with the Dragon Tattoo|Agatha Christie|978-0307454546|49.90|25|672|2005|Um jornalista e uma hacker investigam o desaparecimento de uma jovem
Gone Girl|Agatha Christie|978-0307588371|39.90|20|432|2012|Um casamento desmorona quando a esposa desaparece no dia do aniversário
The Silent Patient|Agatha Christie|978-1250301697|34.90|18|336|2019|Uma mulher atira no marido cinco vezes e nunca mais fala
The Big Sleep|Agatha Christie|978-0394758282|29.90|22|231|1939|Um detective privado investiga um caso de chantagem em Los Angeles
In the Woods|Agatha Christie|978-0307388925|44.90|15|429|2007|Um detetive investiga o assassinato de uma jovem na floresta onde seus amigos desapareceram"
)

# Criar livros em cada categoria
for CATEGORIA in "${!LIVROS[@]}"; do
  echo "=== Categoria: $CATEGORIA ==="
  LIVROS_STR="${LIVROS[$CATEGORIA]}"
  
  # Converter string em array separando por nova linha
  IFS=$'\n' read -d '' -ra LIVRO_ARRAY <<< "$LIVROS_STR"
  
  for i in {0..4}; do
    LIVRO="${LIVRO_ARRAY[$i]}"
    TITULO=$(echo "$LIVRO" | cut -d'|' -f1)
    AUTOR=$(echo "$LIVRO" | cut -d'|' -f2)
    ISBN=$(echo "$LIVRO" | cut -d'|' -f3)
    PRECO=$(echo "$LIVRO" | cut -d'|' -f4)
    ESTOQUE=$(echo "$LIVRO" | cut -d'|' -f5)
    PAGINAS=$(echo "$LIVRO" | cut -d'|' -f6)
    ANO=$(echo "$LIVRO" | cut -d'|' -f7)
    SINOPSE=$(echo "$LIVRO" | cut -d'|' -f8)
    
    RESULTADO=$(criar_livro "$TITULO" "$AUTOR" "$CATEGORIA" "$ISBN" "$PRECO" "$ESTOQUE" "$PAGINAS" "$ANO" "$SINOPSE")
    echo "$((i+1)). $TITULO - $RESULTADO"
  done
  echo ""
done

echo "=== População concluída ==="
