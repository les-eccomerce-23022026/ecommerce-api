# Regras de Negócio (RN)

Este documento registra todas as Regras de Negócio do sistema. Toda **inclusão, alteração ou exclusão** de uma RN deve ser documentada aqui com data e justificativa.

> [!IMPORTANT]
> Ao adicionar ou alterar código que implemente ou modifique uma RN, atualize o **Status** e o **Histórico** da entrada correspondente neste arquivo.

---

## Convenção de Identificadores

| Prefixo  | Domínio               |
| -------- | --------------------- |
| `RN001x` | Clientes e Cadastro   |
| `RN002x` | Catálogo e Produtos   |
| `RN003x` | Carrinho e Checkout   |
| `RN004x` | Pedidos e Status      |
| `RN005x` | Pagamento             |
| `RN006x` | Parcelamento          |
| `RN007x` | Cupons e Descontos    |
| `RN008x` | Estoque e Lote        |
| `RN009x` | Devolução e Troca     |
| `RN010x` | Autenticação e Acesso |

---

## Legenda de Status

| Status          | Significado                                |
| --------------- | ------------------------------------------ |
| ✅ Implementado | Regra completamente implementada e testada |
| 🔄 Em andamento | Implementação em curso                     |
| 📋 Planejado    | Definido, aguardando implementação         |
| ❌ Cancelado    | Descartado com justificativa registrada    |

---

## RN001 — Clientes e Cadastro

| ID     | Regra                                                                                                                                    | Origem        | Status          | Módulo(s)          |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------- | ------------------ |
| RN0011 | O **CPF** é o identificador único do cliente e não pode ser alterado após o cadastro. Deve ser validado quanto ao algoritmo verificador. | **Obrigatório**   | ✅ Implementado | `clientes`         |
| RN0012 | O **e-mail** deve ser único no sistema e validado quanto ao formato.                                                                     | **Obrigatório**   | ✅ Implementado | `clientes`         |
| RN0013 | A **senha** deve ter no mínimo 8 caracteres, contendo letra maiúscula, minúscula, número e caractere especial.                           | **Obrigatório**   | ✅ Implementado | `clientes`         |
| RN0014 | O cliente inativo (**soft delete**) não pode realizar login nem efetuar compras.                                                         | **Novo**          | ✅ Implementado | `auth`, `clientes` |
| RN0015 | O cliente pode ter múltiplos endereços, mas apenas **um deve ser marcado como principal**.                                               | **Obrigatório**   | 🔄 Em andamento | `clientes`         |
| RN0016 | O cliente pode ter múltiplos telefones, mas apenas **um deve ser marcado como principal**.                                               | **Obrigatório**   | 🔄 Em andamento | `clientes`         |
| RN0017 | O cliente pode ter no máximo **3 cartões de crédito** cadastrados simultaneamente.                                                       | **Obrigatório**   | 📋 Planejado    | `clientes`         |
| RN0018 | A **data de nascimento** do cliente deve indicar ao menos 18 anos de idade para realizar compras.                                        | **Obrigatório**   | 📋 Planejado    | `clientes`         |
| RN0019 | É obrigatório o cadastro de ao menos um **endereço de cobrança**.                                                                        | **Obrigatório**   | 📋 Planejado    | `clientes`         |
| RN001A | É obrigatório o cadastro de ao menos um **endereço de entrega**.                                                                         | 📋 Planejado    | `clientes`         |
| RN001B | O endereço deve ser composto por tipo residência, tipo logradouro, logradouro, número, bairro, CEP, cidade, estado e país.               | 📋 Planejado    | `clientes`         |
| RN001C | O cartão de crédito deve conter número, nome impresso, bandeira e código de segurança.                                                   | 📋 Planejado    | `clientes`         |
| RN001D | A bandeira do cartão de crédito deve pertencer ao grupo de **bandeiras permitidas** no sistema.                                          | 📋 Planejado    | `clientes`         |
| RN001E | O cliente recebe um **ranking numérico** com base no seu perfil de compra.                                                               | 📋 Planejado    | `clientes`         |

---

## RN002 — Catálogo e Produtos

| ID     | Regra                                                                                                                             | Origem        | Status       | Módulo(s)           |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | ------------------- |
| RN0021 | O **ISBN** do livro é único no sistema e deve ser validado no formato ISBN-10 ou ISBN-13.                                         | **Obrigatório**   | 📋 Planejado | `livros`            |
| RN0022 | Um livro só aparece no catálogo para o cliente se estiver **ativo** e com **estoque maior que zero**.                             | **Obrigatório**   | 📋 Planejado | `livros`, `estoque` |
| RN0023 | O **preço** de um livro não pode ser zero ou negativo.                                                                            | **Obrigatório**   | 📋 Planejado | `livros`            |
| RN0024 | Um livro pode pertencer a **múltiplas categorias**.                                                                               | **Obrigatório**   | 📋 Planejado | `livros`            |
| RN0025 | Título, autor, categoria, ano, editora, edição, ISBN, páginas, sinopse, dimensão, grupo, cód de barra são **dados obrigatórios**. | **Obrigatório**   | 📋 Planejado | `livros`            |
| RN0026 | O valor de venda deve respeitar a **margem de lucro** parametrizada para o grupo de precificação vinculado.                       | **Obrigatório**   | 📋 Planejado | `livros`            |
| RN0027 | Mudanças abaixo da margem de lucro padrão exigem autorização de um **gerente de vendas**.                                         | **Obrigatório**   | 📋 Planejado | `livros`            |
| RN0028 | A inativação manual exige o registro de uma **justificativa** e a respectiva **categoria de inativação**.                         | **Obrigatório**   | 📋 Planejado | `livros`            |
| RN0029 | Inativações automáticas por falta de histórico etc devem ser categorizadas como **FORA DE MERCADO**.                              | **Obrigatório**   | 📋 Planejado | `livros`            |

---

## RN003 — Carrinho e Checkout

| ID     | Regra                                                                                                                                                         | Origem        | Status       | Módulo(s)             |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | --------------------- |
| RN0031 | O **preço** de cada item no carrinho deve ser recuperado diretamente do banco de dados no momento do checkout, ignorando qualquer valor enviado pelo cliente. | **Obrigatório**   | 📋 Planejado | `carrinho`, `pedidos` |
| RN0032 | A **quantidade** de um item no carrinho não pode exceder o estoque disponível.                                                                                | **Obrigatório**   | 📋 Planejado | `carrinho`, `estoque` |
| RN0033 | Não é permitido finalizar o checkout com um **carrinho vazio**.                                                                                               | **Obrigatório**   | 📋 Planejado | `pedidos`             |
| RN0034 | O **frete** deve ser calculado com base no endereço de entrega selecionado e no peso total dos itens.                                                         | **Obrigatório**   | 📋 Planejado | `pedidos`             |
| RN0035 | Apenas clientes **autenticados e ativos** podem realizar o checkout.                                                                                          | **Obrigatório**   | 📋 Planejado | `auth`, `pedidos`     |
| RN0036 | O sistema deve notificar o usuário se houver **mudança de estoque** entre a adição ao carrinho e a finalização da compra, atualizando/removendo.              | **Obrigatório**   | 📋 Planejado | `carrinho`, `pedidos` |
| RN0037 | Itens no carrinho ficam **bloqueados temporariamente** no estoque; caso o prazo falte 5 minutos para expirar, alertar o cliente.                              | **Obrigatório**   | 📋 Planejado | `carrinho`, `estoque` |
| RN0038 | Quando o prazo de bloqueio do carrinho expirar, **os itens serão removidos** e o seu respectivo estoque restaurado.                                           | **Obrigatório**   | 📋 Planejado | `carrinho`, `estoque` |

---

## RN004 — Pedidos e Status

| ID     | Regra                                                                                                                                     | Origem        | Status       | Módulo(s)            |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | -------------------- |
| RN0041 | O fluxo de status do pedido deve seguir a ordem: `Aguardando Pagamento` → `Pagamento Aprovado` → `Em Separação` → `Enviado` → `Entregue`. | **Novo**          | 📋 Planejado | `pedidos`            |
| RN0042 | Um pedido só pode ser **cancelado** enquanto estiver no status `Aguardando Pagamento` ou `Pagamento Aprovado`.                            | **Novo**          | 📋 Planejado | `pedidos`            |
| RN0043 | O **estoque deve ser reservado** (decrementado) apenas quando o pagamento for confirmado (`Pagamento Aprovado`).                          | **Obrigatório**   | 📋 Planejado | `pedidos`, `estoque` |
| RN0044 | O **cancelamento** de um pedido deve restaurar o estoque dos itens reservados.                                                            | **Obrigatório**   | 📋 Planejado | `pedidos`, `estoque` |
| RN0045 | Status pós-pagamento: em caso de sucesso passa a **APROVADA**; em caso de falha passa a **REPROVADA** ou congênere disponível.            | **Obrigatório**   | 📋 Planejado | `pedidos`            |
| RN0046 | Status em transporte: ao ser despachado pro usuário, passa a **EM TRANSPORTE**.                                                           | **Obrigatório**   | 📋 Planejado | `pedidos`            |
| RN0047 | Status em entrega: quando confirmado o recebimento pelo administrador, passa a **ENTREGUE**.                                              | **Obrigatório**   | 📋 Planejado | `pedidos`            |

---

## RN005 — Pagamento

| ID     | Regra                                                                                                            | Origem        | Status       | Módulo(s)               |
| ------ | ---------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | ----------------------- |
| RN0051 | O **total do pedido** deve ser recalculado no backend antes de acionar o gateway de pagamento.                   | **Novo**          | 📋 Planejado | `pagamentos`, `pedidos` |
| RN0052 | Números de **cartão de crédito** não devem ser armazenados no banco de dados. Usar apenas tokens do gateway.     | **Obrigatório**   | 📋 Planejado | `pagamentos`            |
| RN0053 | Uma compra com **pagamento reprovado** não deve gerar pedido confirmado nem decrementar estoque.                 | **Obrigatório**   | 📋 Planejado | `pagamentos`, `pedidos` |
| RN0054 | O sistema deve oferecer as formas de pagamento: **cartão de crédito**, **PIX** e **boleto bancário**.            | **Obrigatório**   | 📋 Planejado | `pagamentos`            |
| RN0055 | Pagamento por cartão é permitido em múltiplos cartões, contanto que o **valor mínimo por cartão seja R$ 10,00**. | **Obrigatório**   | 📋 Planejado | `pagamentos`            |
| RN0056 | Caso o pagamento use cupons em conjunto com cartão, o saldo cobrado no cartão pode ser **inferior a R$ 10,00**.  | **Obrigatório**   | 📋 Planejado | `pagamentos`            |
| RN0057 | Finalização do pagamento com cartão e cupom exige **validação prévia da autenticidade** dos cupons no sistema.   | **Obrigatório**   | 📋 Planejado | `pagamentos`, `cupons`  |

---

## RN006 — Parcelamento

| ID     | Regra                                                                                                                                           | Origem        | Status       | Módulo(s)             |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | --------------------- |
| RN0061 | Compras com valor **inferior a R$ 80,00** não são elegíveis para parcelamento.                                                                  | **Novo**          | 📋 Planejado | `pagamentos`          |
| RN0062 | Compras com valor entre **R$ 80,00 e R$ 300,00** podem ser parceladas em até **3× sem juros**.                                                  | **Novo**          | 📋 Planejado | `pagamentos`          |
| RN0063 | Compras com valor **acima de R$ 300,00** podem ser parceladas em até **6× sem juros**.                                                          | **Novo**          | 📋 Planejado | `pagamentos`          |
| RN0064 | O **número máximo de parcelas** e os valores mínimos por parcela são definidos por política da loja e podem ser atualizados pelo administrador. | **Novo**          | 📋 Planejado | `admin`, `pagamentos` |

---

## RN007 — Cupons e Descontos

| ID     | Regra                                                                                                                         | Origem        | Status       | Módulo(s)           |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | ------------------- |
| RN0071 | Um cupom tem **data de validade** e não pode ser aplicado após seu vencimento.                                                | **Obrigatório**   | 📋 Planejado | `cupons`            |
| RN0072 | Um cupom pode ter **uso único por cliente** ou **número máximo de usos geral**.                                               | **Obrigatório**   | 📋 Planejado | `cupons`            |
| RN0073 | O desconto do cupom é aplicado **após** o cálculo do subtotal e **antes** do cálculo do frete.                                | **Obrigatório**   | 📋 Planejado | `cupons`, `pedidos` |
| RN0074 | Não é permitido combinar **múltiplos cupons promocionais** em um mesmo pedido, permitidos apenas múltiplos cupons de troca.   | **Obrigatório**   | 📋 Planejado | `cupons`, `pedidos` |
| RN0075 | O desconto do cupom não pode resultar em um **valor total negativo**.                                                         | **Obrigatório**   | 📋 Planejado | `cupons`, `pedidos` |
| RN0076 | Caso o valor dos **cupons de troca exceda o valor da compra**, será gerado um **novo cupom de troca** com o saldo ao cliente. | **Obrigatório**   | 📋 Planejado | `cupons`            |

---

## RN008 — Estoque e Lote

| ID     | Regra                                                                                                                | Origem        | Status       | Módulo(s)           |
| ------ | -------------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | ------------------- |
| RN0081 | O estoque é gerenciado por **lote** (entrada com data, quantidade e custo unitário).                                 | **Obrigatório**   | 📋 Planejado | `estoque`           |
| RN0082 | A retirada de estoque deve seguir a regra **FIFO** (First In, First Out) por lote.                                   | **Obrigatório**   | 📋 Planejado | `estoque`           |
| RN0083 | Um alerta deve ser disparado quando o estoque de um livro atingir o **nível mínimo configurado** pelo administrador. | **Obrigatório**   | 📋 Planejado | `estoque`, `admin`  |
| RN0084 | O estoque de um livro **não pode ser negativo**. Tentativas de decrementar abaixo de zero devem ser rejeitadas.      | **Obrigatório**   | 📋 Planejado | `estoque`           |
| RN0085 | **Produto, quantidade, valor de custo, fornecedor e data de entrada** são campos obrigatórios em lotes de estoque.   | **Obrigatório**   | 📋 Planejado | `estoque`           |
| RN0086 | Se houver custos diferentes de lote, o valor de venda **sempre considera o maior custo histórico**.                  | **Obrigatório**   | 📋 Planejado | `estoque`, `livros` |
| RN0087 | Não é permitido dar **entrada de quantidade zero** ou negativa na adição de lotes de estoque.                        | **Obrigatório**   | 📋 Planejado | `estoque`           |

---

## RN009 — Devolução e Troca

| ID     | Regra                                                                                                                                 | Origem        | Status       | Módulo(s)                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | --------------------------------- |
| RN0091 | O cliente pode solicitar devolução ou troca em até **7 dias corridos** após o recebimento, conforme o Código de Defesa do Consumidor. | **Obrigatório**   | 📋 Planejado | `trocas`                          |
| RN0092 | A devolução ou troca só é permitida se o pedido estiver no status **Entregue**.                                                       | **Obrigatório**   | 📋 Planejado | `trocas`, `pedidos`               |
| RN0093 | Após a aprovação da devolução, o **estoque do livro deve ser restaurado** e o **reembolso deve ser processado**.                      | **Obrigatório**   | 📋 Planejado | `trocas`, `estoque`, `pagamentos` |
| RN0094 | A troca só pode ser realizada por **outro livro de valor igual ou superior** (com complemento de pagamento se necessário).            | **Obrigatório**   | 📋 Planejado | `trocas`, `pagamentos`            |
| RN0095 | Ao aprovar os itens solicitados para troca, será gerado um controle com o status de **EM TROCA**.                                     | **Obrigatório**   | 📋 Planejado | `trocas`                          |
| RN0096 | O status de uma devolução deve mudar para **TROCADO** após os antigos itens serem recebidos pela loja.                                | **Obrigatório**   | 📋 Planejado | `trocas`                          |
| RN0097 | O sistema notifica via email o cliente quando o **administrador autoriza a troca**.                                                   | **Obrigatório**   | 📋 Planejado | `trocas`, `notificacoes`          |

---

## RN010 — Autenticação e Acesso

| ID     | Regra                                                                                                             | Origem        | Status          | Módulo(s)       |
| ------ | ----------------------------------------------------------------------------------------------------------------- | ------------- | --------------- | --------------- |
| RN1001 | Apenas usuários com papel **`admin`** podem acessar rotas do painel administrativo.                               | **Novo**          | ✅ Implementado | `auth`, `admin` |
| RN1002 | O token JWT deve expirar em **24 horas**; após isso, o usuário deve realizar novo login.                          | **Novo**          | ✅ Implementado | `auth`          |
| RN1003 | Após **5 tentativas de login inválidas consecutivas**, a conta deve ser temporariamente bloqueada por 15 minutos. | **Novo**          | 📋 Planejado    | `auth`          |
| RN1004 | A criação de um novo administrador só pode ser realizada por um **administrador autenticado** via rota restrita.  | **Novo**          | ✅ Implementado | `admin`         |

---

## Histórico de Alterações

| Data       | RN                     | Tipo      | Descrição                                                                                     | Responsável |
| ---------- | ---------------------- | --------- | --------------------------------------------------------------------------------------------- | ----------- |
| 2026-02-26 | RN0011, RN0012, RN0013 | Inclusão  | Regras de validação de cadastro de clientes implementadas                                     | Equipe      |
| 2026-02-26 | RN0014                 | Inclusão  | Regra de bloqueio de cliente inativo implementada                                             | Equipe      |
| 2026-02-26 | RN1001, RN1002, RN1004 | Inclusão  | Regras de autenticação e controle de acesso implementadas                                     | Equipe      |
| 2026-03-02 | RN0061, RN0062, RN0063 | Inclusão  | Regras de parcelamento definidas (R$80 sem parcelamento, até 3× acima, até 6× acima de R$300) | Equipe      |
| 2026-03-03 | Todas                  | Inclusão  | Documentação inicial completa das RNs extraída do contexto do projeto                         | Agente      |
| 2026-03-03 | Várias                 | Alteração | Atualização das RNs faltantes originadas do arquivo original de requisitos (estoque, compras) | Agente      |
