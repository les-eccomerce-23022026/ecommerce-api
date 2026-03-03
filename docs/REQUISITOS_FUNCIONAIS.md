# Requisitos Funcionais (RF)

Este documento registra todos os Requisitos Funcionais do sistema. Toda **inclusão, alteração ou exclusão** de um RF deve ser documentada aqui com data e responsável, mantendo o histórico de evolução.

> [!IMPORTANT]
> Ao adicionar ou alterar código que implemente ou modifique um RF, atualize o **Status** e o **Histórico** da entrada correspondente neste arquivo.

---

## Convenção de Identificadores

| Prefixo  | Domínio                       |
| -------- | ----------------------------- |
| `RF001x` | Autenticação e Sessão         |
| `RF002x` | Cadastro e Gestão de Clientes |
| `RF003x` | Catálogo e Produtos (Livros)  |
| `RF004x` | Carrinho de Compras           |
| `RF005x` | Checkout e Pedidos            |
| `RF006x` | Pagamento e Cupons            |
| `RF007x` | Estoque e Lote                |
| `RF008x` | Painel Administrativo         |
| `RF009x` | Devolução e Troca             |

---

## Legenda de Status

| Status          | Significado                                          |
| --------------- | ---------------------------------------------------- |
| ✅ Implementado | Funcionalidade completamente implementada e testada  |
| 🔄 Em andamento | Implementação em curso, pode ter integração pendente |
| 📋 Planejado    | Definido, aguardando implementação                   |
| ❌ Cancelado    | Descartado com justificativa registrada              |

---

## RF001 — Autenticação e Sessão

| ID     | Descrição                                                                                                     | Origem        | Status          | Módulo(s) |
| ------ | ------------------------------------------------------------------------------------------------------------- | ------------- | --------------- | --------- |
| RF0011 | O sistema deve permitir o **login** de clientes e administradores com e-mail e senha.                         | **Obrigatório**   | ✅ Implementado | `auth`    |
| RF0012 | O sistema deve emitir um **token JWT** no login, enviado via cookie `HttpOnly`, `Secure`, `SameSite=Strict`.  | **Novo**          | ✅ Implementado | `auth`    |
| RF0013 | O sistema deve permitir o **logout**, invalidando a sessão do usuário no lado do cliente (limpeza do cookie). | **Novo**          | ✅ Implementado | `auth`    |
| RF0014 | O sistema deve **renovar automaticamente** o token JWT antes de expirar para sessões ativas.                  | **Novo**          | 📋 Planejado    | `auth`    |

---

## RF002 — Cadastro e Gestão de Clientes

| ID     | Descrição                                                                                                                     | Origem        | Status          | Módulo(s)             |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------- | --------------------- |
| RF0021 | O sistema deve permitir o **cadastro de novos clientes** com nome, CPF, e-mail, data de nascimento, gênero, senha e telefone. | **Obrigatório**   | ✅ Implementado | `clientes`            |
| RF0022 | O sistema deve permitir a **atualização dos dados cadastrais** do cliente autenticado.                                        | **Obrigatório**   | ✅ Implementado | `clientes`            |
| RF0023 | O sistema deve permitir a **inativação (soft delete)** do cadastro do cliente por ele mesmo ou por um administrador.          | **Obrigatório**   | ✅ Implementado | `clientes`            |
| RF0024 | O sistema deve permitir ao cliente gerenciar seus **endereços** (cadastrar, atualizar, definir principal, remover).           | **Obrigatório**   | 🔄 Em andamento | `clientes`            |
| RF0025 | O sistema deve permitir ao cliente gerenciar seus **telefones** (cadastrar, atualizar, definir principal, remover).           | **Obrigatório**   | 🔄 Em andamento | `clientes`            |
| RF0026 | O sistema deve permitir ao cliente gerenciar seus **cartões de crédito** tokenizados (cadastrar, definir principal, remover). | **Obrigatório**   | 📋 Planejado    | `clientes`            |
| RF0027 | O sistema deve permitir ao cliente visualizar seu **histórico de pedidos**.                                                   | **Obrigatório**   | 📋 Planejado    | `clientes`, `pedidos` |
| RF0028 | O sistema deve permitir ao cliente **alterar sua senha** mediante informação da senha atual.                                  | **Obrigatório**   | ✅ Implementado | `clientes`            |
| RF0029 | O sistema deve permitir a **reativação** de uma conta inativa por um administrador.                                           | **Novo**          | 📋 Planejado    | `admin`               |

---

## RF003 — Catálogo e Produtos (Livros)

| ID     | Descrição                                                                                                                     | Origem        | Status          | Módulo(s)           |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------- | ------------------- |
| RF0031 | O sistema deve exibir o **catálogo de livros** com paginação, filtros por categoria e busca por título/autor/ISBN.            | **Obrigatório**   | 🔄 Em andamento | `livros`            |
| RF0032 | O sistema deve exibir a **página de detalhe** de um livro com título, autor, editora, ISBN, sinopse, preço e disponibilidade. | **Obrigatório**   | 📋 Planejado    | `livros`            |
| RF0033 | O administrador deve poder **cadastrar livros** com todos os atributos do domínio.                                            | **Obrigatório**   | 📋 Planejado    | `admin`, `livros`   |
| RF0034 | O administrador deve poder **editar** os dados de um livro.                                                                   | **Obrigatório**   | 📋 Planejado    | `admin`, `livros`   |
| RF0035 | O administrador deve poder **desativar** um livro (remover do catálogo sem deletar) e registrar justificativa.                | **Obrigatório**   | 📋 Planejado    | `admin`, `livros`   |
| RF0036 | O sistema deve **inativar automaticamente** livros sem estoque e que não possuem venda com valor inferior a um parâmetro.     | **Obrigatório**   | 📋 Planejado    | `livros`, `estoque` |
| RF0037 | O administrador deve poder **ativar** o cadastro de um livro informando justificativa.                                        | **Obrigatório**   | 📋 Planejado    | `admin`, `livros`   |
| RF0038 | O sistema deve **calcular o valor de venda** de um livro com base no valor de custo e no seu grupo de precificação.           | **Obrigatório**   | 📋 Planejado    | `livros`            |
| RF0039 | A consulta de livros deve permitir **combinação de filtros** por todos os campos de identificação disponíveis.                | **Obrigatório**   | 📋 Planejado    | `livros`            |

---

## RF004 — Carrinho de Compras

| ID     | Descrição                                                                                     | Origem        | Status       | Módulo(s)  |
| ------ | --------------------------------------------------------------------------------------------- | ------------- | ------------ | ---------- |
| RF0041 | O sistema deve permitir ao cliente **adicionar livros** ao carrinho.                          | **Obrigatório**   | 📋 Planejado | `carrinho` |
| RF0042 | O sistema deve permitir ao cliente **remover livros** ou **alterar quantidades** no carrinho. | **Obrigatório**   | 📋 Planejado | `carrinho` |
| RF0043 | O sistema deve **calcular automaticamente** o subtotal, frete e total do carrinho no backend. | **Obrigatório**   | 📋 Planejado | `carrinho` |
| RF0044 | O sistema deve **persistir o carrinho** para clientes autenticados entre sessões.             | **Novo**          | 📋 Planejado | `carrinho` |

---

## RF005 — Checkout e Pedidos

| ID     | Descrição                                                                                                                              | Origem        | Status       | Módulo(s)                 |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | ------------------------- |
| RF0051 | O sistema deve permitir ao cliente **realizar o checkout** com seleção de endereço de entrega, forma de pagamento e revisão do pedido. | **Obrigatório**   | 📋 Planejado | `pedidos`                 |
| RF0052 | O sistema deve **criar um pedido** ao finalizar o checkout, associando itens, preços, endereço e status inicial.                       | **Obrigatório**   | 📋 Planejado | `pedidos`                 |
| RF0053 | O sistema deve enviar **confirmação por e-mail** ao cliente após finalização do pedido.                                                | **Novo**          | 📋 Planejado | `pedidos`, `notificacoes` |
| RF0054 | O sistema deve permitir ao cliente **acompanhar o status** do pedido.                                                                  | **Novo**          | 📋 Planejado | `pedidos`                 |
| RF0055 | O administrador deve poder **atualizar o status** dos pedidos (aguardando pagamento, aprovado, em separação, cancelado).               | **Novo**          | 📋 Planejado | `admin`, `pedidos`        |
| RF0056 | O administrador deve poder **despachar pedidos para entrega**, atualizando o status para `EM TRÂNSITO`.                                | **Obrigatório**   | 📋 Planejado | `admin`, `pedidos`        |
| RF0057 | O administrador deve poder **confirmar a entrega** do pedido, atualizando o status para `ENTREGUE`.                                    | **Obrigatório**   | 📋 Planejado | `admin`, `pedidos`        |

---

## RF006 — Pagamento e Cupons

| ID     | Descrição                                                                                  | Origem        | Status       | Módulo(s)           |
| ------ | ------------------------------------------------------------------------------------------ | ------------- | ------------ | ------------------- |
| RF0061 | O sistema deve processar o pagamento via **cartão de crédito** por meio de um gateway.     | **Novo**          | 📋 Planejado | `pagamentos`        |
| RF0062 | O sistema deve processar o pagamento via **PIX**.                                          | **Novo**          | 📋 Planejado | `pagamentos`        |
| RF0063 | O sistema deve processar o pagamento via **boleto bancário**.                              | **Novo**          | 📋 Planejado | `pagamentos`        |
| RF0064 | O sistema deve suportar **parcelamento no cartão** conforme regras de negócio (ver RN006). | **Novo**          | 📋 Planejado | `pagamentos`        |
| RF0065 | O sistema deve permitir a aplicação de **cupons de desconto** válidos no checkout.         | **Obrigatório**   | 📋 Planejado | `cupons`, `pedidos` |
| RF0066 | O administrador deve poder **criar, editar e desativar cupons** de desconto.               | **Novo**          | 📋 Planejado | `admin`, `cupons`   |

---

## RF007 — Estoque e Lote

| ID     | Descrição                                                                                                   | Origem        | Status       | Módulo(s)             |
| ------ | ----------------------------------------------------------------------------------------------------------- | ------------- | ------------ | --------------------- |
| RF0071 | O sistema deve controlar o **estoque de livros por lote**, registrando data de entrada, quantidade e custo. | **Obrigatório**   | 📋 Planejado | `estoque`             |
| RF0072 | O sistema deve **decrementar automaticamente** o estoque ao confirmar um pedido.                            | **Obrigatório**   | 📋 Planejado | `estoque`, `pedidos`  |
| RF0073 | O sistema deve **bloquear a compra** quando o estoque estiver zerado.                                       | **Obrigatório**   | 📋 Planejado | `estoque`, `carrinho` |
| RF0074 | O administrador deve poder **registrar entrada de novos lotes** de estoque.                                 | **Obrigatório**   | 📋 Planejado | `admin`, `estoque`    |
| RF0075 | O sistema deve realizar a **reentrada em estoque** de itens devolvidos ou de troca confirmada.              | **Obrigatório**   | 📋 Planejado | `estoque`, `trocas`   |

---

## RF008 — Painel Administrativo

| ID     | Descrição                                                                                                         | Origem        | Status          | Módulo(s) |
| ------ | ----------------------------------------------------------------------------------------------------------------- | ------------- | --------------- | --------- |
| RF0081 | O sistema deve permitir o **cadastro de novos administradores** somente por outro administrador autenticado.      | **Novo**          | ✅ Implementado | `admin`   |
| RF0082 | O painel administrativo deve exibir **indicadores de desempenho** (pedidos do dia, faturamento, estoque crítico). | **Novo**          | 📋 Planejado    | `admin`   |
| RF0083 | O administrador deve poder **listar e buscar clientes** cadastrados.                                              | **Obrigatório**   | 📋 Planejado    | `admin`   |
| RF0084 | O administrador deve poder **visualizar e exportar** relatórios de vendas.                                        | **Novo**          | 📋 Planejado    | `admin`   |
| RF0085 | O sistema deve permitir a **análise do histórico de vendas**, comparando produtos e categorias por período.       | **Obrigatório**   | 📋 Planejado    | `admin`   |

---

## RF009 — Devolução e Troca

| ID     | Descrição                                                                                                     | Origem        | Status       | Módulo(s)           |
| ------ | ------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | ------------------- |
| RF0091 | O sistema deve permitir ao cliente **solicitar devolução ou troca** de itens dentro do prazo legal (7 dias).  | **Obrigatório**   | 📋 Planejado | `pedidos`, `trocas` |
| RF0092 | O administrador deve poder **aprovar ou rejeitar** solicitações de devolução/troca.                           | **Obrigatório**   | 📋 Planejado | `admin`, `trocas`   |
| RF0093 | O sistema deve **registrar o motivo** da devolução/troca e atualizar o estoque após processamento.            | **Novo**          | 📋 Planejado | `trocas`, `estoque` |
| RF0094 | O administrador deve poder **visualizar todos os pedidos** e compras com status de `EM TROCA`.                | **Obrigatório**   | 📋 Planejado | `admin`, `trocas`   |
| RF0095 | O administrador deve poder **confirmar o recebimento de itens** para troca, indicando se retornam ao estoque. | **Obrigatório**   | 📋 Planejado | `admin`, `trocas`   |
| RF0096 | O sistema deve **gerar um cupom de troca** e disponibilizá-lo ao cliente após recebimento dos itens.          | **Obrigatório**   | 📋 Planejado | `trocas`, `cupons`  |

---

## Histórico de Alterações

| Data       | RF                             | Tipo      | Descrição                                                                     | Responsável |
| ---------- | ------------------------------ | --------- | ----------------------------------------------------------------------------- | ----------- |
| 2026-02-26 | RF0011, RF0012, RF0013         | Inclusão  | RFs de autenticação implementados e testados (login, JWT, logout)             | Equipe      |
| 2026-02-26 | RF0021, RF0022, RF0023, RF0028 | Inclusão  | RFs de cadastro e gestão de clientes implementados                            | Equipe      |
| 2026-02-26 | RF0081                         | Inclusão  | RF de cadastro de admin implementado (rota restrita)                          | Equipe      |
| 2026-03-03 | Todos                          | Inclusão  | Documentação inicial completa dos RFs extraída do contexto do projeto         | Agente      |
| 2026-03-03 | Vários                         | Alteração | Inclusão de RFs faltantes mapeados a partir de `doc-requirement-ecommerce.md` | Agente      |
