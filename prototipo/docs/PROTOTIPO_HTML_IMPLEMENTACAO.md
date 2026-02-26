# Planejamento do Protótipo HTML (Checklist de Implementação)

Esta documentação serve como guia para a criação e acompanhamento do desenvolvimento das telas do protótipo HTML baseadas no comportamento delineado nos arquivos BDD.

Cada seção contém as telas essenciais que devem ser implementadas e a referência funcional atrelada (link para o BDD respectivo).

---

## 1. Visão do Cliente (E-commerce / Loja Virtual)
Estas são as páginas que o usuário final (cliente visitante/comprador) irá interagir.

### 🛍️ Navegação e Compras
- [ ] **Home / Catálogo de Produtos**: Página principal contendo um grid de livros, banners de destaque e opções de busca/filtro.
  - **Referência:** [Consultar Livro](./cadastro_livros/consultar_livro.md)
- [ ] **Detalhes do Livro (Página do Produto)**: Tela para visualização das características do livro, sinopse, preço e botão "Adicionar ao Carrinho".
  - **Referência:** [Consultar Livro](./cadastro_livros/consultar_livro.md)
- [ ] **Carrinho de Compras**: Tela que lista todos os produtos adicionados, mostrando foto, quantidade e subtotais, permitindo remoção/alteração.
  - **Referência:** [Carrinho](./vendas/carrinho.md)
- [ ] **Cálculo de Frete (Componente)**: Módulo de inserção de CEP dentro do carrinho ou no checkout, listando opções de entrega e prazos.
  - **Referência:** [Frete](./vendas/frete.md)
- [ ] **Checkout (Finalização de Compra)**: Processo em etapas contendo: Resumo da Compra $\rightarrow$ Identificação $\rightarrow$ Endereço de Entrega $\rightarrow$ Pagamento (Seleção de Cartões) $\rightarrow$ Conclusão.
  - **Referência:** [Finalizar Compra](./vendas/finalizar_compra.md)

### 👤 Autenticação e Área do Cliente (Minha Conta)
- [ ] **Login / Cadastro de Conta**: Formulário exigindo dados pessoais (Nome, CPF, Data Nascimento), endereço básico e regras rígidas de senha.
  - **Referência:** [Cadastrar Cliente](./cadastro_clientes/cadastrar_cliente.md)
- [ ] **Perfil do Cliente**: Tela de visualização dos dados cadastrais (Read-only) com botões para edição e alteração de senha.
  - **Referências:** 
    - [Consultar Cliente](./cadastro_clientes/consultar_cliente.md)
    - [Alterar Cliente](./cadastro_clientes/alterar_cliente.md)
    - [Alterar Senha](./cadastro_clientes/alterar_senha.md)
- [ ] **Meus Endereços**: Lista de endereços cadastrados (Entrega, Cobrança, Residencial) e modal/formulário para adicionar novos.
  - **Referência:** [Gerenciar Endereços](./cadastro_clientes/gerenciar_enderecos.md)
- [ ] **Meus Cartões**: Lista de cartões de crédito salvos, com possibilidade de exclusão ou registro de novos cartões.
  - **Referência:** [Gerenciar Cartões](./cadastro_clientes/gerenciar_cartoes.md)
- [ ] **Meus Pedidos / Solicitações de Troca**: Tabela contendo histórico de pedidos, seus respectivos status, e uma funcionalidade/botão para "Solicitar Troca" (fluxo de devolução de produtos).
  - **Referência:** [Troca (Pedidos)](./vendas/troca.md)

---

## 2. Visão Administrativa (Backoffice / Painel Admin)
Páginas destinadas aos administradores da plataforma e funcionários para gestão da loja.

### 📊 Relatórios e Visão Geral
- [ ] **Dashboard (Análise de Vendas)**: Tela inicial da retaguarda administrativa, contendo gráficos de vendas por período (filtros de data) e métricas gerais (receita, volume).
  - **Referência:** [Análise de Vendas](./analise/analise_vendas.md)

### 🔐 Controle de Acesso e Usuários Administradores
- [ ] **Cadastro de Administrador**: Formulário ou tela de gerenciamento de equipe. **Regra de Negócio Crítica**: Somente um administrador já logado e autenticado possui permissão para registrar outros administradores no sistema. Não deve existir rota pública para criação de perfil "admin".


### 📚 Catálogo e Estoque
- [ ] **Listagem de Livros**: Tabela mostrando os livros cadastrados na loja com busca textual e paginação, possuindo controle para desativar (tirar de circulação) um produto.
  - **Referências:**
    - [Consultar Livro Admin](./cadastro_livros/consultar_livro.md)
    - [Ativar/Inativar Livro](./cadastro_livros/inativar_ativar_livro.md)
- [ ] **Cadastro e Edição de Livro**: Formulário extenso (podendo ser em abas ou accordion) que contemple Grupos de Precificação, Código de Barras, Autor, Editora, Dimensões e Sinopse.
  - **Referências:**
    - [Cadastrar Livro](./cadastro_livros/cadastrar_livro.md)
    - [Alterar Livro](./cadastro_livros/alterar_livro.md)
- [ ] **Gestão de Estoque**: Ferramenta de lançamento de entradas ou ajustes de estoque de livros existentes para atualizar quantidades disponíveis na loja.
  - **Referência:** [Gerenciar Estoque](./estoque/gerenciar_estoque.md)
